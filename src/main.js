import { Game } from './game.js';

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const playBtn = document.getElementById('play-btn');
const restartBtn = document.getElementById('restart-btn');
const nameInput = document.getElementById('player-name');
const finalScoreSpan = document.getElementById('final-score');
const uiLayer = document.getElementById('ui-layer');

const game = new Game();

// Mobile Dash Button Logic
const dashBtn = document.getElementById('mobile-dash-btn');
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    dashBtn.classList.remove('hidden');

    dashBtn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // prevent mouse emulation
        game.input.setDash(true);
    });

    dashBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        game.input.setDash(false);
    });

    // Also mouse events for testing on desktop if needed
    dashBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Don't propagate to window
        game.input.setDash(true);
    });
    dashBtn.addEventListener('mouseup', () => {
        game.input.setDash(false);
    });
}

playBtn.addEventListener('click', () => {
    const name = nameInput.value || 'Player';
    startGame(name);
});

restartBtn.addEventListener('click', () => {
    // restart logic
    startGame(game.player ? game.player.name : 'Player');
});

function startGame(playerName) {
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameOverScreen.classList.remove('active');

    // reset UI layer to pass through
    uiLayer.style.pointerEvents = 'none';

    game.start(playerName);
}

// Global hook to show game over
window.addEventListener('gameover', (e) => {
    const score = e.detail.score;
    finalScoreSpan.textContent = Math.floor(score);

    gameOverScreen.classList.remove('hidden');
    gameOverScreen.classList.add('active');
    uiLayer.style.pointerEvents = 'auto';
});
