export class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw background grid (optional but helps with motion perception)
        // This will be static relative to screen if not translated, 
        // but we want it to move with camera usually, let's implement in drawWorld
    }

    // Camera transform
    // targetX, targetY is where the camera should center (the player)
    updateCamera(targetX, targetY) {
        this.ctx.save();
        this.ctx.translate(this.width / 2 - targetX, this.height / 2 - targetY);
    }

    resetCamera() {
        this.ctx.restore();
    }

    drawCircle(x, y, radius, color, glow = false) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;

        if (glow) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = color;
        } else {
            this.ctx.shadowBlur = 0;
        }

        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.shadowBlur = 0; // Reset
    }

    drawGrid(gameWidth, gameHeight) {
        this.ctx.strokeStyle = '#232b38';
        this.ctx.lineWidth = 1;
        const gridSize = 50;

        // Draw simple grid background
        // Ideally we only draw visible grid for optimization, but for now draw all or a large area around
        // Since we are inside camera transform, we can just draw lines

        // Optimize: Draw lines only in view? For infinite world feel, we usually use modulo
        // But let's assume a bounded world for now as per plan (bots simulation)

        this.ctx.beginPath();
        for (let x = 0; x <= gameWidth; x += gridSize) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, gameHeight);
        }
        for (let y = 0; y <= gameHeight; y += gridSize) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(gameWidth, y);
        }
        this.ctx.stroke();

        // Draw boundaries
        this.ctx.strokeStyle = '#ff0055';
        this.ctx.lineWidth = 5;
        this.ctx.strokeRect(0, 0, gameWidth, gameHeight);
    }
}
