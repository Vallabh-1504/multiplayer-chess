const socket = io();

const createGameBtn = document.getElementById('create-game-btn');
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
    };
});