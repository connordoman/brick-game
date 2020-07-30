class Paddle extends Rectangle {
    constructor(x, y, width, height, vX) {
        super(x, y, width, game.tileH / 3);
        this.x = x;
        this.y = y;
        this.w = width;
        this.h = height;
        this.vX = vX;
        this.brickness = this.h;
        this.color = 255;
    }

    draw() {
        noStroke();
        fill(this.color);
        rect(this.x, this.y - this.h / 2, this.w, this.h, pixel * 4);
    }

    moveLeft() {
        this.x -= this.vX;
    }

    moveRight() {
        this.x += this.vX;
    }
}