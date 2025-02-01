const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const players = []

app.use(express.static("public"));

io.on("connection", (socket) => {
    const player = { name: undefined, bingoes: 0 };

    socket.on("join", (playerName) => {
        player.name = playerName;
        players.push(player);
        socket.broadcast.emit("addPlayer", player);
        players.forEach(socket.emit.bind(socket, "addPlayer"));
        socket.emit("joinFinished");
    })

    socket.on("sendMessage", (message) => {
        socket.broadcast.emit("sendMessage", `${player.name}: ${message}`);
    });

    socket.on("disconnect", () => {
        let playerIndex = players.indexOf(player);
        socket.broadcast.emit("removePlayer", playerIndex)
        players.splice(playerIndex, 1);
    });

    socket.on("updateBingoes", (newBingoes) => {
        player.bingoes = newBingoes;
        io.emit("updateBingoes", {playerIndex: players.indexOf(player), newBingoes: newBingoes});
    })
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
