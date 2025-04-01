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

const worms = {};
let myWorm = new Worm("green", playerName);

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

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#2b2b2b"; // Ground color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    myWorm.move();
    myWorm.draw();

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
