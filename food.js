import { Utils } from './utils.js';

export class Food {
    constructor(gameWidth, gameHeight) {
        this.x = Utils.randomInt(0, gameWidth);
        this.y = Utils.randomInt(0, gameHeight);
        this.radius = Utils.randomInt(3, 6);
        this.color = Utils.randomColor();
        this.value = 1; // Growth value

        // Special food chance
        if (Math.random() < 0.05) {
            this.radius += 3;
            this.value = 5;
            this.glow = true;
        } else {
            this.glow = false;
        }
    }

    draw(renderer) {
        renderer.drawCircle(this.x, this.y, this.radius, this.color, this.glow);
    }
}
