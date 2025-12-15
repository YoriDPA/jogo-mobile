import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { Snake } from './snake.js';
import { Bot } from './bot.js';
import { Food } from './food.js';
import { Utils } from './utils.js';

export class Game {
    constructor() {
        this.renderer = new Renderer('game-canvas');
        this.input = new Input();
        this.width = 3000; // World size
        this.height = 3000;

        this.player = null;
        this.bots = [];
        this.foods = [];

        this.lastTime = 0;
        this.running = false;

        // Settings
        this.foodCount = 200;
        this.botCount = 10;

        // Initial setup
        this.setup();
    }

    setup() {
        // Generate initial food
        for (let i = 0; i < this.foodCount; i++) {
            this.foods.push(new Food(this.width, this.height));
        }

        // Generate Bots
        for (let i = 0; i < this.botCount; i++) {
            this.spawnBot();
        }
    }

    spawnBot() {
        const x = Utils.randomInt(0, this.width);
        const y = Utils.randomInt(0, this.height);
        const color = Utils.randomColor();
        const bot = new Bot(x, y, color, `Bot ${this.bots.length + 1}`, this);
        this.bots.push(bot);
    }

    start(playerName) {
        // Create Player
        this.player = new Snake(this.width / 2, this.height / 2, '#00ff88', playerName);
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(timestamp) {
        if (!this.running) return;

        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // Update Player
        if (this.player && !this.player.dead) {
            // Mouse is relative to screen, need to convert to world relative to player?
            // Actually snake follows mouse angle relative to center of screen usually in these games
            // Because camera centers on player.
            // MouseX - ScreenCenter, MouseY - ScreenCenter gives direction.

            const screenCenterX = window.innerWidth / 2;
            const screenCenterY = window.innerHeight / 2;
            const mouse = this.input.getMousePosition();

            const targetX = this.player.x + (mouse.x - screenCenterX);
            const targetY = this.player.y + (mouse.y - screenCenterY);

            this.player.update(dt, targetX, targetY, this.input.isMouseDown());

            // Boundary check for player
            if (this.player.x < 0 || this.player.x > this.width || this.player.y < 0 || this.player.y > this.height) {
                this.gameOver();
            }
        }

        // Update Bots
        this.bots.forEach(bot => bot.update(dt));

        // Collisions
        this.checkCollisions();

        // Replenish food/bots?
        // Simple respawn logic
        if (this.foods.length < this.foodCount) {
            if (Math.random() < 0.1) this.foods.push(new Food(this.width, this.height));
        }
    }

    checkCollisions() {
        const allSnakes = [this.player, ...this.bots].filter(s => !s.dead);

        // Snake vs Food
        allSnakes.forEach(snake => {
            for (let i = this.foods.length - 1; i >= 0; i--) {
                const food = this.foods[i];
                if (Utils.distance(snake.x, snake.y, food.x, food.y) < snake.radius + food.radius) {
                    snake.grow(food.value);
                    this.foods.splice(i, 1);
                }
            }
        });

        // Snake vs Snake
        // Head vs Body matches
        for (let i = 0; i < allSnakes.length; i++) {
            const s1 = allSnakes[i];

            for (let j = 0; j < allSnakes.length; j++) {
                if (i === j) continue;
                const s2 = allSnakes[j];

                // Head (s1) vs Body (s2)
                // Check if s1 head is close to any s2 history point
                // Optimization: Skip checking every single point? Check bounding box first?
                // For simplicity, check every 5th point
                let hit = false;
                for (let k = 0; k < s2.history.length; k += 3) {
                    const pt = s2.history[k];
                    if (Utils.distance(s1.x, s1.y, pt.x, pt.y) < s1.radius + s2.radius) {
                        hit = true;
                        break;
                    }
                }

                if (hit) {
                    this.killSnake(s1);
                }
            }
        }
    }

    killSnake(snake) {
        snake.dead = true;
        // Turn body into food
        // Use a step to not spawn too much food
        for (let i = 0; i < snake.history.length; i += 5) {
            const pt = snake.history[i];
            const food = new Food(this.width, this.height);
            food.x = pt.x;
            food.y = pt.y;
            food.value = 2; // Dead meat is valuable
            food.radius = 8;
            food.glow = true;
            this.foods.push(food);
        }

        if (snake === this.player) {
            this.gameOver();
        } else {
            // Remove bot and respawn
            const idx = this.bots.indexOf(snake);
            if (idx > -1) {
                this.bots.splice(idx, 1);
                setTimeout(() => this.spawnBot(), 3000);
            }
        }
    }

    draw() {
        this.renderer.clear();

        // Camera follows player
        if (this.player && !this.player.dead) {
            this.renderer.updateCamera(this.player.x, this.player.y);
        } else {
            // Maybe continue following death spot or random bot?
        }

        this.renderer.drawGrid(this.width, this.height);

        // Draw Food
        this.foods.forEach(f => f.draw(this.renderer));

        // Draw Snakes
        // Draw bots first? Or z-index?
        this.bots.forEach(b => b.draw(this.renderer));
        if (this.player) this.player.draw(this.renderer);

        this.renderer.resetCamera();

        // Update HUD
        if (this.player) {
            document.getElementById('score').innerText = Math.floor(this.player.score);
        }

        this.updateLeaderboard();
    }

    updateLeaderboard() {
        const all = [this.player, ...this.bots].filter(s => s && !s.dead);
        all.sort((a, b) => b.score - a.score);

        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';

        all.slice(0, 5).forEach((s, i) => {
            const li = document.createElement('li');
            li.innerText = `${i + 1}. ${s.name} - ${Math.floor(s.score)}`;
            if (s === this.player) li.style.color = '#00ff88';
            list.appendChild(li);
        });
    }

    gameOver() {
        this.running = false;
        const e = new CustomEvent('gameover', { detail: { score: this.player.score } });
        window.dispatchEvent(e);
    }
}
