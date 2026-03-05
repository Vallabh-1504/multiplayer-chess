const { Game } = require('js-chess-engine');

// Default to Level 2 (Medium)
const getBestMove = (fen, level = 3) => {
    return new Promise((resolve, reject) => {
        try{
            const game = new Game(fen);

            // .aiMove(level) takes the difficulty level
            const aiMoveObj = game.aiMove(level); 

            const fromSquare = Object.keys(aiMoveObj)[0];
            const toSquare = aiMoveObj[fromSquare];
            const moveNotation = fromSquare.toLowerCase() + toSquare.toLowerCase();
            
            resolve(moveNotation);
        } 
        catch(err){
            reject(err);
        }
    });
};

module.exports = { getBestMove };