/**
 * brick-game.js
 * By Connor Doman
 * July 27, 2020
 * 
 */
const FPS = 60;
const DIM_X = 9;
const DIM_Y = 16;
const RATIO = DIM_X / DIM_Y;

const BRICK_ROWS = 6;

const DEBUG = false;

let cnv;
let tileW;
let tileH;
let pixel;

let paddleX;
let paddleY;
let paddleW;
let paddleH;
let paddleVx = 4;

let ballX;
let ballY;
let ballW;
let ballH;
let ballVx = 0;
let ballVy = Math.random(2, Math.PI);

let brickness;
let bricks = [];
let objectBricks;
let brickGroup;


let bufferX;

let score;
let lives;
let paused;

let gameFont;

let qt;

let debugText;

let objectPaddle;

function preload() {
    //gameFont = loadFont('https://fonts.gstatic.com/s/firacode/v9/uU9eCBsR6Z2vfE9aq3bL0fxyUs4tcw4W_GNsJV37MOzlojwUKaJO.woff');
    gameFont = "Fira Code";
}

function setup() {
    frameRate(FPS);
    ellipseMode(RADIUS);
    rectMode(CENTER);

    let w = windowWidth;
    let h = windowHeight;
    if (w / h > RATIO) {
        w = DIM_X * (windowHeight / DIM_Y);
        h = windowHeight;
    } else {
        w = windowWidth;
        h = DIM_Y * (windowWidth / DIM_X);
    }
    w = Math.floor(w - (w % DIM_X));
    h = Math.floor(h - (h % DIM_Y));
    cnv = createCanvas(w, h);
    cnv.parent('game');

    // Set units
    tileW = width / DIM_X;
    tileH = height / DIM_Y;
    pixel = (tileW / 16 + tileH / 16) / 2;

    // Set up paddle
    paddleX = tileW * DIM_X / 2;
    paddleY = height - tileH;
    paddleW = tileW * 2;
    paddleH = pixel * 4
    paddleVx = 8 * tileW / FPS;
    objectPaddle = new Paddle(tileW * DIM_X / 2, tileH * DIM_Y - tileH, tileW * 2, pixel * 4, 8 * tileW / FPS);
    objectPaddle.color = "white";

    // Set up ball
    ballX = paddleX;
    ballY = height / 2 ;
    ballW = tileW / 2;
    ballH = tileH / 2;
    ballVx = 0;
    ballVy = 5 * tileH / FPS;

    // Set up bricks
    brickness = pixel * 6;
    brickGroup = new BrickGroup(tileW / 2, tileH + brickness / 2, DIM_X, BRICK_ROWS, new Point(tileW, brickness));

    // Misc
    bufferX = tileW / 6;
    score = 0;
    lives = 3;
    paused = false;
    textFont(gameFont);

    // Controls
    cnv.touchStarted(movePaddleForTouch);
    cnv.touchMoved(movePaddleForTouch);

    // Optimizations
    buildQuadtree();
}

function draw() {
    background(0);

    // Build quadtree
    buildQuadtree();

    // Update paddle
    //paddleX += paddleVx;
    if (keyIsDown(LEFT_ARROW) && paddleX >= (paddleW / 2) + paddleVx) {
        paddleX -= paddleVx;
        objectPaddle.moveLeft();
    } else if (keyIsDown(RIGHT_ARROW) && paddleX <= width - (paddleW / 2) - paddleVx) {
        paddleX += paddleVx;
        objectPaddle.moveRight();
    } 


    // Update ball
    ballX += ballVx;
    ballY += ballVy;
    
    // Check brick collisions
    let range = new Rectangle(ballX, ballY, ballW, ballH);
    let points = qt.query(range);
    if (DEBUG) {
        noFill();
        strokeWeight(pixel / 2);
        stroke(color(255, 32, 32));
        rect(range.x, range.y, range.w, range.h);
    }

    if (points) {

        let minDist = tileW * 3;
        let minPoint = new Point(ballX, ballY);

        for (let p of points) {
                printDebugLine("p: " + p);
                let newDist = distanceTo(ballX, ballY, p.x, p.y);
                if (newDist <= minDist) {
                    minDist = newDist;
                    minPoint = p;
                }
        }

        if (minPoint) {
            let xIndex = Math.floor(minPoint.x / tileW);
            let yIndex = Math.floor((minPoint.y - tileH) / brickness);
            let br = brickGroup.getBrick(xIndex, yIndex);
            if (br) {
                //console.log(`closest: (${xIndex}, ${yIndex})\nbrick: ${br}`);
                printDebugLine(`closest: (${xIndex}, ${yIndex})`);
                let x = br.pxPoint.x;
                let y = br.pxPoint.y;

                

                if (ballX + ballVx + (ballW / 2) >= x - tileW / 2 && ballX + ballVx - (ballW / 2) < x + tileW / 2) {
                    if (ballY + ballVy + (ballH / 2) >= y - brickness / 2 && ballY + ballVy - (ballH / 2) < y + brickness / 2) {
                        ballVy = -1 * ballVy;
                        brickGroup.disableBrick(xIndex, yIndex);
                        score += calculateScore(yIndex);
                        //console.log(`Collision: ${br.pxPoint}`);
                    }
                }
            }
        }
    }

    // Check collisions
    //paddleCollide();
    ballCollide();
    ballCollideWithPaddle();

    // Draw top line
    stroke(255);
    strokeWeight(pixel / 2);
    line(0, tileH, width, tileH);

    objectPaddle.draw();
    drawBall(ballX, ballY);
    stroke(255);
    strokeWeight(pixel / 2);

    // Draw bricks
    //drawBrickArray(0, 0, bricks);
    brickGroup.draw();

    // Draw score
    noStroke();
    fill(255);
    textSize(pixel * 6);
    text("Score: " + score, pixel * 4, pixel * 10);
    //let ang = frameRate().toFixed(2);
    //text(ang, width / 2 - tileW / 2 - textWidth(ang) / 2, tileH / 6, textWidth(ang), tileH);

    // Draw lives
    for (let i = 0; i < lives; i++) {
        drawBall(width - (tileW / 2) - i * (tileW * 2 / 3), tileH / 2);
    }

    drawPauseSquare(width / 2, tileH / 2, pixel * 14);
    // Pause game
    if (paused === true) {
        drawPaused();
    }

    // Finish game
    if (lives < 0) {
        drawGameOver();
        noLoop();
    }
  
    // Debug
    if (DEBUG === true) {
        drawIndicators();
        debugText = '';
    }
}

function drawPaddle(x, y) {
    noStroke();
    fill(255);
    rect(x, y - paddleH / 2, paddleW, paddleH, paddleH);
}

function drawBall(x, y) {
    noStroke();
    fill(color("#EB471f"))
    ellipse(x, y, ballW / 2, ballH / 2);
}


function drawIndicators() {

    // Paddle Indicator
    strokeWeight(4);
    stroke(color(0, 255, 0));
    point(paddleX, paddleY);

    // Ball indicator
    stroke(color(0, 255, 255));
    point(ballX, ballY);

    // Boundary lines
    strokeWeight(pixel);
    stroke(255);
    line(0, tileH, width, tileH);
    line(bufferX, 0, bufferX, height);
    line(width - bufferX, 0, width - bufferX, height);


    // Ball vector
    stroke(255);
    let vec;
    let useLine = true;
    if (useLine === true) {
        strokeWeight(pixel);
        vec = calculateBallVector(ballX, ballY, ballVx, ballVy, ballW + Math.sqrt(ballVx * ballVx + ballVy * ballVy));
        line(ballX, ballY, vec[0], vec[1]);
    } else {
        strokeWeight(4 * pixel);
        vec = calculateBallVector(ballX, ballY, ballVx, ballVy, ballW / 2);
        point(vec[0], vec[1]);
    }
    fill(255);
    noStroke();
    textSize(pixel * 8);
    printDebugLine("v: (" + ballVx.toFixed(1) + ", " + ballVy.toFixed(1) + ")");
    printDebugLine("pt: (" + vec[0].toFixed(1) + ", " + vec[1].toFixed(1) + ")");
    printDebugLine("theta: " + vec[2].toFixed(3));
    text(debugText, tileW / 5, BRICK_ROWS * brickness + tileH + textSize());

    // Quadtree
    quadTreeMask(qt);
}

function calculateBallVector(x, y, vx, vy, r) {
    let vMag = vx * vy;
    let theta = Math.atan2(vy, vx);
    let rx = r * Math.cos(theta);
    let ry = r * Math.sin(theta);
    let ptx = x + rx;
    let pty = y + ry;
    return [ptx, pty, theta];
}

function paddleCollide() {
    if (paddleX < paddleW / 2) {
        paddleX = paddleW / 2;
    }
    if (paddleX > width - (paddleW / 2)) {
        paddleX = width - (paddleW / 2);
    }
    
}

function ballCollide() {
    if (ballX <= (ballW / 2)) {
        ballVx = Math.abs(ballVx);
    }
    if (ballX >= width - (ballW / 2)) {
        ballVx = -1 * Math.abs(ballVx);
    }
    if (ballY <= (ballH / 2) + tileH) {
        ballVy = Math.abs(ballVy);
    }
    if (ballY >= height + (ballH / 2) - (tileH / 3)) {
        ballVx = 0;
        ballVy = Math.abs(ballVy);
        ballX = width / 2;
        ballY = height * 2 / 3;
        lives--;
    }
}

function printDebugLine(line) {
    if (!debugText) {
        debugText = line;
    } else if (debugText) {
        debugText += '\n' + line
    }
}

function drawGameOver() {
    fill(color(200, 128));
    rect(width / 2, width / 2, width, height);
    textSize(tileW);

    let over = "Game Over";
    let textX = width / 2;
    let textY = height / 2;
    fill(0);
    rect(textX, textY, textWidth(over) + tileW, tileH * 2);
    
    fill(color(255, 64, 64));
    text(over, textX - textWidth(over) / 2, textY + tileH / 3);
}

function ballCollideWithPaddle() {
    let diffX = -1 * (paddleX - ballX);
    let halfPaddle = paddleW / 2;
    let halfBallW = ballW / 2;
    let halfBallH = ballH / 2;
    if (ballY + halfBallH + ballVy >= paddleY - paddleH && ballY - halfBallH + ballVy <= paddleY - paddleH / 2) {
        if (ballX + halfBallW + ballVx >= paddleX - halfPaddle && ballX - halfBallW + ballVx <= paddleX + halfPaddle) {
            ballVy = -1 * Math.abs(ballVy);
            ballVx = (5 * tileW * (diffX / halfPaddle)) / FPS;
        }
    }
}

function drawBrick(x, y) {
    stroke(255);
    fill(color(128, 255 * (x / width), 255 * (y / (6 * tileH))));
    rect(x, y, tileW, brickness);
}

function drawBrickArray(x, y, brickArray) {
    for (let i = 0; i < brickArray.length; i++) {
        if (brickArray[i] !== false) {
            drawBrick(x + brickArray[i][0], y + bricks[i][1]);
        }
    }
}

function circleIntersectRect(x1, y1, r, x2, y2, w, h) {
    let tx = x1;
    let ty = y1;

    let a = 1;
    let b = 1;

    if (x1 < x2) {
        tx = x2;
        a = -1;
    } else if (x1 > x2 + w) {
        tx = x2 + w;
        a = 1;
    }
    if (y1 < y2) {
        ty = y2;
        b = -1;
    } else if (y1 > y2 + h) {
        ty = y2 + h;
        b = 1;
    }

    let x = x1 - tx;
    let y = y1 - ty;
    let R = Math.sqrt(x * x + y * y);
    if (R <= r) {
        return [a, b];
    }
    return false;
}

function calculateAngle(vX, vY) {
    let angle;
    if (vX === 0) {
        angle = Math.PI / 2;
    } else {
        angle = Math.tan(vY / vX);
    }
    return angle.toFixed(3);
}

function rectIntersectRect(x1, y1, w1, h1, x2, y2, w2, h2) {
    let a = 1;
    let b = 1;
    
    if (x1 + w1 >= x2 && x1 <= x2 + w2) {
        a = 1;
    }

    if (y1 + h1 >= y2 && y1 <= y2 + h2) {
        b = -1;
    }
    return a - b != 0;
}

function drawPaused() {
    fill(200, 128);
    noStroke();
    rect(width / 2, height / 2, width, height);

    drawPauseSquare(width / 2, height / 2, tileW * 3);
}

function drawPauseSquare(x, y, w) {
    fill(0);
    rect(x, y, w, w);

    let thick = w / 24;
    fill(255);
    rect(x - w / 6 + thick, y, thick, w / 3 + 2 * thick);
    rect(x + (w / 6) - thick, y, thick, w / 3 + 2 * thick);
}

function keyTyped() {
    if (key == ' ') {
        pause();
    }
}

function movePaddleForTouch() {
    let x, y;
    for (let t = 0; t < touches.length; t++) {
        x = touches[t].x;
        y = touches[t].y;

        if (y > paddleY - tileH && y < paddleY + 2 * tileH) {
            if (x > paddleX - paddleW / 2 && x < paddleX + paddleW / 2) {
                paddleX = x;
                objectPaddle.x = x;
            }
        }
    }
    paddleCollide();
    pauseForTouch();
    return false;
}

function movePaddleForMouse() {
    let x = mouseX;
    let y = mouseY;

    if (y > paddleY - tileH && y < paddleY + 2 * tileH) {
        if (x > paddleX - paddleW / 2 && x < paddleX + paddleW / 2) {
            paddleX = x;
            objectPaddle.x = x;
        }
    }
    paddleCollide();
}

function pauseForTouch() {
    let x, y;
    for (let t = 0; t < touches.length; t++) {
        x = touches[t].x;
        y = touches[t].y;
        if (!paused && rectIntersectRect(x, y, pixel, pixel, (width / 2) - (7 * pixel), (tileH / 2) - (pixel * 7), pixel * 14, pixel * 14)) {
            pause();
        } else if (paused === true && rectIntersectRect(x, y, pixel, pixel, 0, 0, width, height)) {
            pause();
        }
    }
}

function mousePressed() {
    movePaddleForMouse();
    // Pause
    if (!paused && rectIntersectRect(mouseX, mouseY, pixel, pixel, (width / 2) - (7 * pixel), (tileH / 2) - (pixel * 7), pixel * 14, pixel * 14)) {
        pause();
    } else if (paused === true && rectIntersectRect(mouseX, mouseY, pixel, pixel, 0, 0, width, height)) {
        pause();
    }
}

function mouseDragged() {
    movePaddleForMouse();
}

function pause() {
    paused = !paused;
    if (paused === true) {
        noLoop();
    } else if (!paused) {
        loop();
    }
}

function calculateIndex(x, y, w) {
    return (y * w) + x;
}

function calculateScore(y) {
    y = BRICK_ROWS - y;
    return Math.ceil((y * y) / BRICK_ROWS) + 1;
}

function quadTreeMask(qt) {
    //noStroke();
    //fill(200, 128);
    //rect(width / 2, height / 2, width, height);
    
    quadTreeFraction(qt);
}

function quadTreeFraction(qt) {
    stroke(color(32, 255, 32));
    strokeWeight(1);
    noFill();
    rect(qt.boundary.x, qt.boundary.y, qt.boundary.w * 2, qt.boundary.h * 2);
    
    strokeWeight(2 * pixel);
    for (let p of qt.points) {
        point(p.x, p.y);
    }
    if (qt.divided) {
        quadTreeFraction(qt.quadrantOne);
        quadTreeFraction(qt.quadrantTwo);
        quadTreeFraction(qt.quadrantThree);
        quadTreeFraction(qt.quadrantFour);  
    }
}

function buildQuadtree() {
    // Optimization
    let boundary = new Rectangle(width / 2, height / 2, width, height);
    qt = new Quadtree(boundary, 1);
    
    brickGroup.forEach((brick) => {
        qt.insert(brick.pxPoint);
    });
    // for (let i = 0; i < bricks.length; i++) {
    //     let x = bricks[i][0];
    //     let y = bricks[i][1];
    //     let p = new Point(x, y);
    //     qt.insert(p);
        
    // }
    //qt.insert(new Point(ballX, ballY));
    //qt.insert(new Point(paddleX, paddleY));
}

function distanceTo(x1, y1, x2, y2) {
    let x = x2 - x1;
    let y = y2 - y1;
    return Math.sqrt((x * x) + (y * y));
}