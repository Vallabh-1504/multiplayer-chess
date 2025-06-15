const http = require('http');
const socketio = require('socket.io');
const app = require('./app');
const gameController = require('./controllers/gameController');
const PORT = process.env.PORT || 8002;

const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (uniqueSocket)=> {
    gameController(io, uniqueSocket);
});


server.listen(PORT, (req, res)=> {
    console.log('server connected');
});