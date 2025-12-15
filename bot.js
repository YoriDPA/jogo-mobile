import { Snake } from './snake.js';
import { Utils } from './utils.js';

export class Bot extends Snake {
    constructor(x, y, color, name, game) {
        super(x, y, color, name, true);
        this.game = game;
        this.targetX = x;
        this.targetY = y;
        this.decisionTimer = 0;
    }

    update(dt) {
        if (this.dead) return;

        this.decisionTimer -= dt;
        if (this.decisionTimer <= 0) {
            this.makeDecision();
            this.decisionTimer = Utils.random(0.5, 2.0); // New decision every 0.5-2s
        }

        // Basic boundary avoidance
        const margin = 100;
        if (this.x < margin) this.targetX = this.x + 200;
        if (this.x > this.game.width - margin) this.targetX = this.x - 200;
        if (this.y < margin) this.targetY = this.y + 200;
        if (this.y > this.game.height - margin) this.targetY = this.y - 200;

        super.update(dt, this.targetX, this.targetY, false); // No dash for simple bots yet
    }

    makeDecision() {
        // Find nearest food
        let nearestDist = Infinity;
        let nearestFood = null;

        // Optimize: don't check all food every frame? 
        // We are only doing this every few seconds per bot
        for (const food of this.game.foods) {
            const d = Utils.distance(this.x, this.y, food.x, food.y);
            if (d < nearestDist) {
                nearestDist = d;
                nearestFood = food;
            }
        }

        if (nearestFood && nearestDist < 500) { // Only care if close
            this.targetX = nearestFood.x;
            this.targetY = nearestFood.y;
        } else {
            // Random wander
            const angle = Utils.random(0, Math.PI * 2);
            const dist = Utils.random(100, 300);
            this.targetX = this.x + Math.cos(angle) * dist;
            this.targetY = this.y + Math.sin(angle) * dist;
        }
    }
}
