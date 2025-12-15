import { Utils } from './utils.js';

export class Snake {
    constructor(x, y, color, name, isBot = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.name = name;
        this.isBot = isBot;

        this.angle = 0;
        this.velocity = 3;
        this.baseVelocity = 3;
        this.dashVelocity = 6;

        this.radius = 10;
        this.length = 20; // Initial length

        // Body is a list of points. For smooth snake, we store history of head positions
        // and render segments at fixed intervals from this history.
        this.history = [];
        this.gap = 5; // Distance between body segments in history indices

        this.score = 0;
        this.dead = false;

        // Fill initial history so it doesn't start as a dot
        for (let i = 0; i < this.length * this.gap; i++) {
            this.history.push({ x: this.x, y: this.y });
        }
    }

    update(dt, targetX, targetY, dash = false) {
        if (this.dead) return;

        // Calculate angle to target
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const targetAngle = Math.atan2(dy, dx);

        // Smooth rotation
        let angleDiff = targetAngle - this.angle;
        // Normalize to -PI to PI
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const turnSpeed = 0.1; // adjust for turning radius
        this.angle += angleDiff * turnSpeed;

        // Velocity
        const currentSpeed = dash ? this.dashVelocity : this.baseVelocity;

        // Move Head
        this.x += Math.cos(this.angle) * currentSpeed;
        this.y += Math.sin(this.angle) * currentSpeed;

        // Update History
        this.history.unshift({ x: this.x, y: this.y });

        // Limit history based on length
        // We need enough history to draw 'length' segments with 'gap'
        const maxHistory = this.length * this.gap;
        if (this.history.length > maxHistory) {
            this.history.pop();
        }

        // Dash cost (lose length/score)
        if (dash && this.length > 10 && Math.random() < 0.05) {
            // this.length -= 0.1; // Slowly lose length
            // Simplified: Emit food particle? For now just maybe stop growing
        }
    }

    grow(amount) {
        this.length += amount;
        this.score += amount * 10;
        this.radius = 10 + Math.sqrt(this.length) * 0.5; // Slight size increase
        if (this.radius > 25) this.radius = 25; // Cap size
    }

    draw(renderer) {
        if (this.dead) return;

        // Draw body segments
        // We iterate backwards to draw tail first (so head is on top)
        for (let i = this.length - 1; i >= 0; i--) {
            const historyIndex = i * this.gap;
            if (historyIndex < this.history.length) {
                const point = this.history[historyIndex];
                // Fade color or size for tail?
                // Let's keep it simple
                renderer.drawCircle(point.x, point.y, this.radius, this.color, i === 0); // Glow only head?
            }
        }

        // Draw Head (Already drawn as i=0, but maybe draw eyes?)
        const head = this.history[0];
        // renderer.drawCircle(head.x, head.y, this.radius, '#ffffff', true); // Head highlight

        // Eyes
        const eyeOffset = this.radius * 0.6;
        const eyeX1 = head.x + Math.cos(this.angle - 0.5) * eyeOffset;
        const eyeY1 = head.y + Math.sin(this.angle - 0.5) * eyeOffset;
        const eyeX2 = head.x + Math.cos(this.angle + 0.5) * eyeOffset;
        const eyeY2 = head.y + Math.sin(this.angle + 0.5) * eyeOffset;

        renderer.drawCircle(eyeX1, eyeY1, this.radius * 0.3, 'white');
        renderer.drawCircle(eyeX2, eyeY2, this.radius * 0.3, 'white');
        renderer.drawCircle(eyeX1, eyeY1, this.radius * 0.1, 'black');
        renderer.drawCircle(eyeX2, eyeY2, this.radius * 0.1, 'black');

        // Name tag
        renderer.ctx.fillStyle = 'white';
        renderer.ctx.font = '12px Outfit';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText(this.name, head.x, head.y - this.radius - 10);
    }
}
