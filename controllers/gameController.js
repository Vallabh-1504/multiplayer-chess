const { Chess } = require('chess.js');
const getGameStatus = require('../utils/gameStatus');

// chess object instance
const chess = new Chess();

// initialize players
let players = {};

module.exports = function(io, uniqueSocket){
    console.log('socket.io connected');

    uniqueSocket.emit('boardState', chess.fen());

    // checking if players are there
    if(!players.white){
        players.white = uniqueSocket.id;
        uniqueSocket.emit('playerRole', 'w'); 
        // uniqueSocket.emit - only to one who sent it
        // io.emit- to everyone including one who sent it
    }   
    else if(!players.black){
        players.black = uniqueSocket.id;
        uniqueSocket.emit('playerRole', 'b');
    }
    else{
        uniqueSocket.emit('spectatorRole');
    }

    io.emit('statusUpdate', getGameStatus(chess, players));

    // if disconnected, delete white and black both, currently game will not get over
    uniqueSocket.on('disconnect', () =>{
        if(uniqueSocket.id === players.white){
            delete players.white;
        }
        else if(uniqueSocket.id === players.black){
            delete players.black
        }
        io.emit('statusUpdate', getGameStatus(chess, players));
    })

    uniqueSocket.on('move', (move)=> {
        try{
            // check if move (movement) is played by valid person
            if(chess.turn() === 'w' && uniqueSocket.id !== players.white) return;
            if(chess.turn() === 'b' && uniqueSocket.id !== players.black) return;

            // person verified, now check if move is valid
            const isValidMove = chess.move(move);

            if(isValidMove){
                io.emit('move', move);
                io.emit('boardState', chess.fen());
                io.emit('statusUpdate', getGameStatus(chess, players));
                
                // everytime check if game over
                if(chess.isGameOver()){
                    if(chess.isCheckmate()){
                        const winner = chess.turn() === 'w' ? 'black' : 'white';
                        io.emit('gameOver', {reason: 'checkmate', winner});
                    }
                    else if(chess.isStalemate()){
                        io.emit('gameOver', {reason: 'stalemate'});
                    }
                    else if(chess.isThreefoldRepetition()){
                        io.emit('gameOver', {reason: 'threefold repetition'});
                    }
                    else if(chess.isInsufficientMaterial()){
                        io.emit('gameOver', {reason: 'insufficient material'});
                    }
                    else if(chess.isDraw()){
                        io.emit('gameOver', {reason: 'draw'});
                    }

                    // automatically game restart
                    setTimeout(()=>{
                        chess.reset();
                        io.emit('boardState', chess.fen());
                        io.emit('statusUpdate', 'New Game Started');
                    }, 3000);

                }   
            }
            else{
                uniqueSocket.emit('invalidMove', {move, reason: "Illegal move"}); // wrong move, so emit to that player only 
            }
        }
        catch(err){
            uniqueSocket.emit('invalidMove', {move, reason: 'Illegal move'});
        }
    })
    
};