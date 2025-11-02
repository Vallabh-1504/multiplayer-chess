const socket = io();

const createGameBtn = document.getElementById('create-game-btn');
const gameListDiv = document.getElementById('game-list');

const renderGameList = (games) => {
    gameListDiv.innerHTML = ''; // Clear existing
    
    if(games.length === 0){
        gameListDiv.appendChild(noGamesMsg);
        return;
    }
    
    games.forEach(game =>{
        let gameStatusText = `Players: ${game.playerCount}/2`;
        if(game.playerCount === 2){
            gameStatusText = "Game in progress (Spectate)";
        }

        const gameLink = document.createElement('a');
        gameLink.href = `/game/${game.roomId}`;
        gameLink.classList.add('list-group-item', 'list-group-item-action', 'd-flex', 'justify-content-between', 'align-items-center');

        gameLink.innerHTML = `
            <span>Room: ${game.roomId.substring(0, 8)}...</span>
            <span class="badge bg-secondary">${gameStatusText}</span>
        `;
        
        gameListDiv.appendChild(gameLink);
    });
};

createGameBtn.addEventListener('click', () =>{
    createGameBtn.disabled = true;
    createGameBtn.innerText = 'Creating...';

    fetch('/game/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res =>{
        if(!res.ok){
            throw new Error('Server responded with an error');
        }
        return res.json();
    })
    .then(data =>{
        window.location.href = `/game/${data.roomId}`;
    })
    .catch(err =>{
        console.error('Error creating game:', err);
        createGameBtn.disabled = false;
        createGameBtn.innerText = 'Create New Game';
        alert('Could not create game. Please try again.');
    });
});
    
socket.on('updateGameList', (games) => {
    renderGameList(games);
});