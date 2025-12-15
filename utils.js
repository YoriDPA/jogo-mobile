export class Utils {
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }

    static randomColor() {
        const colors = [
            '#FF0055', '#00FF88', '#00CCFF', '#FFAA00', '#CC00FF', '#FFFF00'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Helper to keep angle between -PI and PI or 0 and 2PI if needed
    static normalizeAngle(angle) {
        return Math.atan2(Math.sin(angle), Math.cos(angle));
    }
}
