import express from 'express'
import http from 'http'
import {Server} from "socket.io";

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors:{
        origin:"*",
    },
});

const rooms = new Map();

io.on("connection",(socket)=>{
    console.log("user connectd", socket.id);
    let currrentRoom = null;
    let currentUser = null;

    socket.on("join",({roomId,username})=>{
        if(currrentRoom){
            socket.leave(currrentRoom);
            rooms.get(currrentRoom).delete(currentUser);
        io.to(currrentRoom).emit("userJoined",Array.from(rooms.get(currrentRoom)));
        }

        currentUser = username;
        currrentRoom = roomId;

        socket.join(roomId);

        if(!rooms.has(roomId)){
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(username);
        io.to(roomId).emit("userJoined",Array.from(rooms.get(currrentRoom)));
    }
    );
})

const port = process.env.PORT || 5000;

server.listen(port, ()=>{
    console.log("server is working on port 5000");
})