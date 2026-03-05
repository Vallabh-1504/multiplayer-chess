const http = require('http');
const socketio = require('socket.io');
const {app, sessionMiddleware} = require('./app');
const gameController = require('./controllers/gameController');
const {redisClient} = require('./utilities/redisClient');
const {randomid} = require('ksort-id');

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin : "*",
        methods: ["GET", "POST"]
    }
});

app.set('io', io);
app.set('redisClient', redisClient);

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

io.on('connection', (uniqueSocket)=> {
    const session = uniqueSocket.request.session;
    if(!session.userId){
        session.userId = randomid(6);
        session.save();
    }
    uniqueSocket.userId = session.userId;

    gameController(io, uniqueSocket, redisClient);
});

server.listen(PORT, (req, res)=> {
    console.log(`Server connected on port ${PORT}`);
});