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

    get point() {
        return new Point(this.x, this.y);
    }
}

class Circle {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.vX = 0;
        this.vY = 0;
        this.color = '#FFFFFF';
    }

    update() {
        this.x += this.vX;
        this.y += this.vY;
    }

    setVelocity(vX, vY) {
        this.vX = vX;
        this.vY = vY;
    }

    collides(rectangle) {
        let testR = rectangle;
        let testX = this.x;
        let testY = this.y;
        let dX = this.vX;
        let dY = this.vY;

        if (this.x < testR.x - testR.w / 2) {
            // Left Edge
            testX = testR.x - testR.w / 2;
            dX = -dX;
        } else if (this.x > testR.x + testR.w / 2) {
            // Right Edge
            testX = testR.x + testR.w / 2;
            dX = -dX;
        }

        if (this.y < testR.y - testR.h / 2) {
            // Top Edge
            testY = testR.y - testR.h / 2;
            dY = -dY;
        } else if (this.y > testR.y + testR.h / 2) {
            // Bottom Edge
            testY = testR.y + testR.h / 2;
            dY = -dY;
        }

        if (this.x == testR.x + testR.w / 2) {
            dX = -dX;
        }
        if (this.y == testR.y + testR.h / 2) {
            dY = -dY;
        }

        let distX = this.x - testX;
        let distY = this.y - testY;
        let distance = Math.sqrt((distX * distX) + (distY * distY));

        if (distance <= this.r) {
            this.setVelocity(dX, dY);
            return true;
        }
        return false;
    }

    collidesWithPaddle(paddle) {
        if (this.collides(paddle)) {
            let diffX = -1 * (paddle.x - this.x);
            this.setVelocity((5 * tileW * (diffX / (paddle.w / 2))) / FPS, this.vY);
        }
    }

    draw() {
        noStroke();
        fill(this.color);
        ellipse(this.x, this.y, this.r, this.r);
    }
}

class Paddle extends Rectangle {
    constructor(x, y, w, h, vX) {
        super(x, y, w, h);
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.vX = vX;
        this.color = 255;
    }

    draw() {
        noStroke();
        fill(this.color);
        rect(this.x, this.y, this.w, this.h, pixel * 4);
    }

    moveLeft() {
        this.x -= this.vX;
    }

    moveRight() {
        this.x += this.vX;
    }

    update() {
        if (this.x <= this.w / 2) {
            this.x = this.w / 2;
        } else if (this.x >= width - this.w / 2) {
            this.x = width - this.w / 2;
        }
    }
}

class Brick extends Rectangle {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.xIndex = 0;
        this.yIndex = 0;
        this.color;
    }

    setGridPosition(xIndex, yIndex) {
        this.xIndex = xIndex;
        this.yIndex = yIndex;
    }

    setColor(c) {
        this.color = c;
    }

    draw() {
        strokeWeight(pixel / 2);
        stroke(255);
        fill(this.color);
        rect(this.x, this.y, this.w, this.h);
    }
}

class BrickGroup {
    constructor(x, y, width, height, brickDim) {
        this.x = x;
        this.y = y;
        this.brickDim = brickDim;
        this.w = width;
        this.h = height;
        this.bricks = [];
        this.numDisabled = 0;

        let b;
        for (let j = 0; j < height; j++) {
            for (let i = 0; i < width; i++) {
                let bX = i * brickDim.x + this.x;
                let bY = j * brickDim.y + this.y;

                b = new Brick(bX, bY, brickDim.x, brickDim.y);
                b.xIndex = i;
                b.yIndex = j;

                b.color = colorAt(b.xIndex, b.yIndex, width, width);
                this.bricks.push(b);
            }
        }
        //this.bricks.length);
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
            //console.log("Disabling brick...");
            this.bricks[(this.w * y) + x] = false;
            this.numDisabled++;
        }
    }

    isEmpty() {
        return this.bricks.length - this.numDisabled == 0;
    }
}

class Ball extends Circle {
    static COLOR = "#EB471f";
    constructor(x, y, size) {
        super(x, y, Math.floor(size / 2));
        this.size = size;
        this.color = Ball.COLOR;
    }

    getSize() {
        return this.r * 2;
    }

    update() {
        super.update();

        if (this.x <= this.r) {
            this.vX = Math.abs(this.vX);
        } else if (this.x >= width - this.r) {
            this.vX = -1 * Math.abs(this.vX);
        }

        if (this.y <= tileH + this.r) {
            this.vY = Math.abs(this.vY);
        } else if (this.y >= height - this.r - (tileH / 3)) {
            // Reset ball position
            this.vX = 0;
            this.vY = Math.abs(this.vY);
            this.x = width / 2;
            this.y = height * (2 / 3);
            lives--;
        }
    }
}

/*

Functions

*/
let colorAt = (x, y, w, h) => {
    let blue = 255 - (((y + 1) / h) * 255) * (1.0 + Math.sin(2 * Math.PI * (x / w)));
    let green = 255 - (((y + 1) / h) * 255) * (1.0 + Math.cos(2 * Math.PI * (x / w)));
    let red = 255 - (((y + 1) / h) * 255) * (1.0 - Math.sin(2 * Math.PI * (x / w)));

    return color(red, green, blue);
};

