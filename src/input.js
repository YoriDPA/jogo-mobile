export class Input {
    constructor() {
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        window.addEventListener('mousedown', () => {
            this.mouseDown = true;
        });

        window.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });

        // Touch support basic
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouseX = e.touches[0].clientX;
                this.mouseY = e.touches[0].clientY;
            }
        });

        window.addEventListener('touchstart', () => {
            this.mouseDown = true;
        });

        window.addEventListener('touchend', () => {
            this.mouseDown = false;
        });
    }

    getMousePosition() {
        return { x: this.mouseX, y: this.mouseY };
    }

    isMouseDown() {
        return this.mouseDown;
    }
}
