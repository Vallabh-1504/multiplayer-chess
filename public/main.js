const socket = io();
const chess = new Chess();
const boardElemet = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const roleDisplay = document.getElementById('role-display');
const turnDisplay = document.getElementById('turn-display');
const statusDisplay = document.getElementById('status-display');

const getPieceUnicode = (piece)=> {
    const unicodePieces = {
        K: "♔",  // King
        Q: "♕",  // Queen
        R: "♖",  // Rook
        B: "♗",  // Bishop
        N: "♘",  // Knight
        P: "♟",  // Pawn
        k: "♚",  // King
        q: "♛",  // Queen
        r: "♜",  // Rook
        b: "♝",  // Bishop
        n: "♞",  // Knight
        p: "♙"   // Pawn
    };

    return unicodePieces[piece.type] || '';
};

function showModal(title, message){
    const modalElement = document.getElementById('exampleModal');
    const modal = new bootstrap.Modal(modalElement);

    document.querySelector('#exampleModalLabel').textContent = title;
    document.querySelector('.modal-body').textContent = message;

    modal.show();
};

const renderBoard = ()=> {
    const board = chess.board();
    boardElemet.innerHTML = '';
    turnDisplay.innerText = `Current Turn: ${chess.turn() === 'w' ? 'White' : 'Black'}`;

    board.forEach((row, rowIdx) =>{
        row.forEach((square, squareIdx) =>{
            const squareElement = document.createElement('div');
            squareElement.classList.add('square', ((rowIdx + squareIdx) % 2 === 0 ? 'light' : 'dark'));
            squareElement.dataset.row = rowIdx;
            squareElement.dataset.col = squareIdx;

            if(square != null){
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', (square.color == 'w' ? 'white' : 'black'));
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = (playerRole === square.color);

                pieceElement.addEventListener('dragstart', (e)=>{
                    if(pieceElement.draggable){
                        draggedPiece = pieceElement;
                        sourceSquare = {row: rowIdx, col: squareIdx};
                    }
                    e.dataTransfer.setData('text/plain', '');
                });

                pieceElement.addEventListener('dragend', (e)=>{
                    draggedPiece = null;
                    sourceSquare = null;
                })

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', (e)=>{
                e.preventDefault();
            })

            squareElement.addEventListener('drop', (e)=>{
                e.preventDefault();
                if(draggedPiece){
                    const targetSource = {
                        row : parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    }
                    handleMove(sourceSquare, targetSource);
                }
            })

            boardElemet.appendChild(squareElement);  
        });
              
    });

    if(playerRole === 'b'){
        boardElemet.classList.add('flipped');
    }
    else boardElemet.classList.remove('flipped');
};

const handleMove = (source, target)=> {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q', // always promote to queen
    }
    socket.emit('move', move);

}


socket.on('playerRole', (role)=>{
    playerRole = role;
    roleDisplay.innerText = `Role: ${role === 'w' ? 'white' : 'black'}`;
    statusDisplay.innerText = 'waiting for opponent..';
    renderBoard();
});

socket.on('spectatorRole', ()=>{
    playerRole = null;
    roleDisplay.innerText = `Role: Spectator`;
    statusDisplay.innerText = 'Spectating the game';
    renderBoard();

});

socket.on('boardState', (fen)=>{
    chess.load(fen);
    renderBoard();
})

socket.on('statusUpdate', (msg) =>{
    statusDisplay.innerText = msg;
})

socket.on('move', (move)=>{
    chess.move(move);
    renderBoard();
});

socket.on('invalidMove', ({data}) =>{
    console.log(data);
    showModal('Invalid Move', data.reason);
})

socket.on('gameOver', (data)=>{
    let message;
    if(data.reason === 'checkmate'){
        message = `Game Over by Checkmate. Winner: ${data.winner}`;
    }
    else{
        message = `Game Over: ${data.reason}`;
    }

    showModal('Game Over', message);
    statusDisplay.innerText = `Game Over: ${data.reason}` + (data.winner ? ` | Winner: ${data.winner}` : '');

})


