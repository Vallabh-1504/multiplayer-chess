module.exports = function getGameStatus(chess, players){
    if(!players.white || !players.black) return 'Waiting for opponent..';
    if(chess.isGameOver()) return 'Game over!';
    return `Game in progress. Turn: ${chess.turn() === 'w' ? 'white' : 'black'}`;
}