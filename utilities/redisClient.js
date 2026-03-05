const Redis = require('ioredis');
const redisClient = new Redis();

redisClient.on('connect', () =>{
    console.log('Connected to Redis successfully!');
});
redisClient.on('error', (err) =>{
    console.log('Redis Client Error', err)
});

module.exports = {redisClient};