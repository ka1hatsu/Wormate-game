const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const socket = new WebSocket("wss://your-server-url"); // Replace with your WebSocket server

let playerName = prompt("Enter your name:") || "Player";

class Worm {
    constructor(color, name) {
        this.segments = [{ x: Math.random() * canvas.width, y: Math.random() * canvas.height }];
        this.direction = { x: 1, y: 0 };
        this.speed = 2;
        this.color = color;
        this.name = name;
    }

    move() {
        const head = {
            x: this.segments[0].x + this.direction.x * this.speed,
            y: this.segments[0].y + this.direction.y * this.speed,
        };
        this.segments.unshift(head);
        if (this.segments.length > 10) this.segments.pop();
    }

    grow() {
        this.segments.push({ ...this.segments[this.segments.length - 1] });
    }

    draw() {
        ctx.fillStyle = this.color;
        this.segments.forEach(segment => {
            ctx.beginPath();
            ctx.arc(segment.x, segment.y, 10, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(this.name, this.segments[0].x - 10, this.segments[0].y - 15);
    }
}

class Food {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = 5;
    }

    draw() {
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const worms = {};
let myWorm = new Worm("green", playerName);
let food = new Food();

socket.onopen = () => {
    socket.send(JSON.stringify({ type: "join", name: myWorm.name, color: myWorm.color }));
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "update") {
        worms[data.id] = data.worm;
    }
};

document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "ArrowUp":
            if (myWorm.direction.y === 0) myWorm.direction = { x: 0, y: -1 };
            break;
        case "ArrowDown":
            if (myWorm.direction.y === 0) myWorm.direction = { x: 0, y: 1 };
            break;
        case "ArrowLeft":
            if (myWorm.direction.x === 0) myWorm.direction = { x: -1, y: 0 };
            break;
        case "ArrowRight":
            if (myWorm.direction.x === 0) myWorm.direction = { x: 1, y: 0 };
            break;
    }
    socket.send(JSON.stringify({ type: "move", worm: myWorm }));
});

// Touch controls for mobile
canvas.addEventListener("touchstart", (event) => {
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    if (touchX < centerX && Math.abs(touchX - centerX) > Math.abs(touchY - centerY)) {
        myWorm.direction = { x: -1, y: 0 }; // Left
    } else if (touchX > centerX && Math.abs(touchX - centerX) > Math.abs(touchY - centerY)) {
        myWorm.direction = { x: 1, y: 0 }; // Right
    } else if (touchY < centerY) {
        myWorm.direction = { x: 0, y: -1 }; // Up
    } else {
        myWorm.direction = { x: 0, y: 1 }; // Down
    }
    socket.send(JSON.stringify({ type: "move", worm: myWorm }));
});

function checkFoodCollision() {
    const head = myWorm.segments[0];
    const distance = Math.hypot(head.x - food.x, head.y - food.y);
    if (distance < 10) {
        myWorm.grow();
        food = new Food();
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#2b2b2b"; // Ground color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    myWorm.move();
    checkFoodCollision();
    myWorm.draw();
    food.draw();

    for (let id in worms) {
        const worm = worms[id];
        ctx.fillStyle = worm.color;
        worm.segments.forEach(segment => {
            ctx.beginPath();
            ctx.arc(segment.x, segment.y, 10, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(worm.name, worm.segments[0].x - 10, worm.segments[0].y - 15);
    }
    requestAnimationFrame(gameLoop);
}

gameLoop();
