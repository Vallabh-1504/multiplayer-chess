const {Chess} = require('chess.js');
const {getBestMove} = require('../utilities/chessAI');

const GAME_LIST_KEY = 'games:active';
const GAME_KEY_PREFIX = 'game:';
const CHAT_KEY_PREFIX = 'chat:';

module.exports = async function(io, uniqueSocket, redisClient){

    uniqueSocket.on('joinGame', async ({roomId}) =>{
        try{
            const gameKey = GAME_KEY_PREFIX + roomId;
            const game = await redisClient.hgetall(gameKey);

            if(!game || !game.fen){
                uniqueSocket.emit('invalidMove', {reason: "Game not found."});
                return;
            }

            const userId = uniqueSocket.userId;
            uniqueSocket.join(roomId);
            uniqueSocket.roomId = roomId;

            let role = 'spectator';
            if(game.playerWhite === userId){
                role = 'w';
            }
            else if(game.playerBlack === userId){
                role = 'b';
            }
            else if (game.playerBlack === 'stockfish') {
                // If Black is AI, user MUST be White (unless White is already taken by someone else)
                if (!game.playerWhite || game.playerWhite === "") {
                    role = 'w';
                    await redisClient.hset(gameKey, 'playerWhite', userId);
                    game.playerWhite = userId;
                }
            }
            else {
                // Standard Multiplayer assignment
                if(!game.playerWhite || game.playerWhite === ""){
                    role = 'w';
                    await redisClient.hset(gameKey, 'playerWhite', userId);
                }
                else if(!game.playerBlack || game.playerBlack === ""){
                    role = 'b';
                    await redisClient.hset(gameKey, 'playerBlack', userId);
                }
            }

            uniqueSocket.emit('playerRole', role);
            uniqueSocket.emit('boardState', game.fen);

            let status = 'Game in progress';
            if(game.playerBlack === 'stockfish'){
                status = 'Playing against Stockfish (AI)';
            }
            else if(!game.playerWhite || !game.playerBlack){
                status = 'Waiting for opponent...';
            }

            io.to(roomId).emit('statusUpdate', status);

            // load chat
            const chatKey = CHAT_KEY_PREFIX + roomId;
            const chatHistory = await redisClient.lrange(chatKey, 0, -1);
            const parsedHistory = chatHistory.map(item => JSON.parse(item));
            uniqueSocket.emit('chatHistory', parsedHistory);
        }
        catch(err){
            console.error(`Error joining game ${roomId}:`, err);
        }
    });

    uniqueSocket.on('disconnect', () =>{
        const roomId = uniqueSocket.roomId;
        if(roomId){
            io.to(roomId).emit('statusUpdate', 'Player disconnected. Waiting to reconnect...');
        }
    });

    uniqueSocket.on('move', async (move) =>{
        const roomId = uniqueSocket.roomId;
        if(!roomId) return;
    
        try{
            const gameKey = GAME_KEY_PREFIX + roomId;
            const game = await redisClient.hgetall(gameKey);
            const userId = uniqueSocket.userId;
            
            if(!game) return;

            const chess = new Chess(game.fen);
            const turn = chess.turn();

            const isAiGame = game.playerBlack === 'stockfish';

            if(isAiGame){
                if(turn !== 'w' || userId !== game.playerWhite){
                    uniqueSocket.emit('invalidMove', {reason: "Not your turn."});
                    return;
                }
            }
            else{
                if((turn === 'w' && userId !== game.playerWhite) || (turn === 'b' && userId !== game.playerBlack)){
                    uniqueSocket.emit('invalidMove', {reason: "Not your turn."});
                    return;
                }
            }
            
            const moveResult = chess.move(move);
            if(!moveResult){
                uniqueSocket.emit('invalidMove', { reason: "Illegal move." });
                return;
            }

            let newFen = chess.fen();
            await redisClient.hset(gameKey, 'fen', newFen);

            // broadcast move and new boardstate
            io.to(roomId).emit('move', move);
            io.to(roomId).emit('boardState', newFen);

            // Check Game Over after Human Move
            if(await handleGameOver(chess, io, roomId, redisClient, gameKey)) return;

            // 3. PROCESS AI MOVE (If applicable)
            if(isAiGame && chess.turn() === 'b'){
                // We don't want to block the event loop, but we need to wait for the move// A small timeout allows the client UI to update before the AI respondssetTimeout(async () => {
                try{
                    const aiMoveNotation = await getBestMove(newFen);
                    const aiMove = chess.move(aiMoveNotation);

                    if(aiMove){
                        newFen = chess.fen();
                        await redisClient.hset(gameKey, 'fen', newFen);
                        
                        io.to(roomId).emit('move', aiMove);
                        io.to(roomId).emit('boardState', newFen);
                        // Check Game Over after AI Move
                        if(await handleGameOver(chess, io, roomId, redisClient, gameKey)) return;
                    }
                }
                catch (error){
                    console.error("AI Move Error:", error);
                }
            }
        }
        catch(err){
            console.log('Error on move:', err)
            uniqueSocket.emit('invalidMove', {move, reason: 'Illegal move'});
        }
    });

    // everytime check game over
    const handleGameOver = async (chessInstance, io, roomId, redisClient, gameKey) =>{
        if(chessInstance.isGameOver()) {
            let gameOverData = {};

            if(chessInstance.isCheckmate()){
                const winner = chessInstance.turn() === 'w' ? 'black' : 'white';
                gameOverData = {reason: 'checkmate', winner};
            }
            else if(chessInstance.isStalemate()){
                gameOverData = {reason: 'stalemate'};
            }
            else if(chessInstance.isThreefoldRepetition()){
                gameOverData = {reason: 'threefold repetition'};
            }
            else if(chessInstance.isInsufficientMaterial()){
                gameOverData = {reason: 'insufficient material'};
            }
            else if(chessInstance.isDraw()){
                gameOverData = {reason: 'draw'};
            }

            io.to(roomId).emit('gameOver', gameOverData);

            // chat befor game deletion
            const chatKey = CHAT_KEY_PREFIX + roomId;
            await redisClient.del(chatKey);

            await redisClient.srem(GAME_LIST_KEY, roomId);
            await redisClient.del(gameKey);
            return true;
        }
        return false;
    }

    // chat event
    uniqueSocket.on('chatMessage', async (data) =>{
        const roomId = uniqueSocket.roomId;
        if(!roomId) return;

        const message = data.message.trim();
        if(!message) return;

        try{
            const gameKey = GAME_KEY_PREFIX + roomId;
            const game = await redisClient.hgetall(gameKey);
            const userId = uniqueSocket.userId;

            let senderName = 'Spectator';
            if (game && game.playerWhite === userId) senderName = 'White';
            else if (game && game.playerBlack === userId) senderName = 'Black';

            const chatKey = CHAT_KEY_PREFIX + roomId;
            const chatEntry = {
                sender: senderName,
                message: message
            };

            await redisClient.rpush(chatKey, JSON.stringify(chatEntry));
            // keeping only 50 messages
            await redisClient.ltrim(chatKey, -50, -1);

            io.to(roomId).emit('newChatMessage', chatEntry);
        }
        catch(err){
            console.error("Error handling chat message:", err);
            uniqueSocket.emit('chatError', 'Could not send message.');
        }
    });
};