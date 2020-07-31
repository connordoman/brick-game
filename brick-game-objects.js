class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toString() {
        return "(" + this.x + ", " + this.y + ")";
    }
}

class Rectangle {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    contains(point) {
        return (
            point.x >= this.x - this.w &&
            point.x < this.x + this.w &&
            point.y >= this.y - this.h &&
            point.y < this.y + this.h
        );
    }

    intersects(range) {
        return !(
            range.x - range.w > this.x + this.w ||
            range.x + range.w < this.x - this.w ||
            range.y - range.h > this.y + this.h ||
            range.y + range.h < this.y - this.h
        );
    }
}

class Paddle extends Rectangle {
    constructor(x, y, width, height, vX) {
        super(x, y, width, game.tileH / 3);
        this.x = x;
        this.y = y;
        this.w = width;
        this.h = height;
        this.vX = vX;
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

class Brick extends Rectangle {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.x = x;
        this.y = y;
        this.color;
        this.pxPoint = new Point((x * w), (y * h));
    }

    setColor(c) {
        this.color = c;
    }

    draw() {
        strokeWeight(pixel / 2);
        stroke(255);
        fill(this.color);
        rect(this.pxPoint.x, this.pxPoint.y, this.w, this.h);
    }
}

class BrickGroup {
    constructor(x, y, width, height, brickDim) {
        this.x = x;
        this.y = y;
        this.w = width;
        this.h = height;
        this.bricks = [];

        let b;
        for (let j = 0; j < height; j++) {
            for (let i = 0; i < width; i++) {
                b = new Brick(i, j, brickDim.x, brickDim.y);
                b.pxPoint = new Point(b.x * b.w + this.x, b.y * b.h + this.y);
                b.color = colorAt(b.x, b.y, width, width);
                this.bricks.push(b);
            }
        }
        console.log(this.bricks.length);
    }

    getBrick(x, y) {
        if (x < this.w && y < this.h) {
            let index = (this.w * y) + x;
            return this.bricks[index];
        }
        return false;
    }

    draw() {
        this.forEach((brick) => {
            if (brick) {
                brick.draw();
            }
        });
    }

    forEach(callback) {
        for (let br of this.bricks) {
            if (br !== false) {
                callback(br);
            }
        }
    }

    disableBrick(x, y) {
        if (this.getBrick(x, y)) {
            console.log("Disabling brick...");
            this.bricks[(this.w * y) + x] = false;
        }
    }
}

let colorAt = (x, y, w, h) => {
    let blue = 255 - ((y / h) * 255) * (1.0 + Math.sin(2 * Math.PI * (x / w)));
    let green = 255 - ((y / h) * 255) * (1.0 + Math.cos(2 * Math.PI * (x / w)));
    let red = 255 - ((y / h) * 255) * (1.0 - Math.sin(2 * Math.PI * (x / w)));
    
    return color(red, green, blue);
};

