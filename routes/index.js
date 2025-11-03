const express = require('express');
const router = express.Router();
const {v4: uuid} = require('uuid');

const GAME_LIST_KEY = 'games:active';
const GAME_KEY_PREFIX = 'game:';

router.get('/', async (req, res) =>{
    const redisClient = req.app.get('redisClient');
    let games = [];

    try{
        const gameIds = await redisClient.smembers(GAME_LIST_KEY);
        
        for(const roomId of gameIds){
            const gameData = await redisClient.hgetall(GAME_KEY_PREFIX + roomId);

            if(gameData && gameData.fen){
                let playerCount = 0;
                if(gameData.playerWhite) playerCount++;
                if(gameData.playerBlack) playerCount++;
                
                games.push({
                    roomId: roomId,
                    playerCount: playerCount,
                    status: gameData.status
                });
            }
        }
    }
    catch(err){
        console.error("Error fetching games for lobby:", err);
    }

    res.render('lobby', {title: 'Game Lobby', games: games});
});

router.get('/game/:roomId', (req, res) =>{
    const {roomId} = req.params;
    res.render('game', {title: 'Chess Game', roomId: roomId});
});

router.post('/game/create', async (req, res) =>{
    const redisClient = req.app.get('redisClient');

    try{
        const roomId = uuid();
        const newGame = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            playerWhite: '',
            playerBlack: '',
            status: 'waiting'
        };

        await redisClient.hset(GAME_KEY_PREFIX + roomId, newGame);
        await redisClient.sadd(GAME_LIST_KEY, roomId);
        await redisClient.expire(GAME_KEY_PREFIX + roomId, 60 * 60);
        
        res.status(201).json({roomId: roomId});
    }
    catch(err){
        console.error('Error creating game:', err);
        res.status(500).json({ error: 'Failed to create game' });
    }
});

module.exports = router;