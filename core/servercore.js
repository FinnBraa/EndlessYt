const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const fs = require('fs');
const io = new Server(server, {
    cors: "*"
});

const ids = [];

app.get('/', (req, res) => {
    res.send("HELLO WORLD")
});

io.on('connection', (socket) => {
    socket.emit("TYPECHECK");

    socket.on("YoutubeAPI", () => {
        console.log("YoutubeApi connected sucessfull to the server ");
    });

    socket.on("NEXT_VIDEO_FIRST", (arg1, arg2) => {
        socket.broadcast.emit("YT-DATA-REQUEST-GET-FIRST", arg1, arg2);
    })

    socket.on("DATA_READY", (arg2, arg3) => {
        console.log("GET DATA");
        socket.broadcast.to(arg3).emit('NEW_VIDEO', arg2);
        console.log(ids);
    })

    socket.on("NEXT_VIDEO", (arg1, socketid) => {
        ids.push(socket.id);
        socket.broadcast.emit("YT-DATA-REQUEST-GET", arg1, socketid);
        socket.on("DATA_READY", (arg2) => {
            socket.to(socketid).broadcast.emit("NEW_VIDEO", arg2);
            ids.splice(0, 1);
        })
    })
});

server.listen(4000, () => {
    console.log('listening on *:4000');
});