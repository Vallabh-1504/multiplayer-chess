const socket = io();

const createGameBtn = document.getElementById('create-game-btn');
const createAiGameBtn = document.getElementById('create-ai-game-btn');
const gameListDiv = document.getElementById('game-list');

createGameBtn.addEventListener('click', async () =>{
    createGameBtn.disabled = true;
    createGameBtn.innerText = 'Creating...';

    try{
        const response = await axios.post('/game/create');

        const data = response.data;
        window.location.href = `/game/${data.roomId}`; // redirecting
    }
    catch(err){
        console.error('Error creating game', err);
        createGameBtn.disabled = false;
        createGameBtn.innerText = 'Create New Game';
        showModal('Error', 'Could not create game. Please try again.');
    }
});

createAiGameBtn.addEventListener('click', async () =>{
    createAiGameBtn.disabled = true;
    createAiGameBtn.innerText = 'Creating...';

    try{
        // We send { mode: 'ai' } to tell the server this is a PvC game
        const response = await axios.post('/game/create', {mode: 'ai'});

        const data = response.data;
        window.location.href = `/game/${data.roomId}`;
    }
    catch(err){
        console.error('Error creating AI game', err);
        createAiGameBtn.disabled = false;
        createAiGameBtn.innerText = 'Play vs Computer';
        showModal('Error', 'Could not create game. Please try again.');
    }
});