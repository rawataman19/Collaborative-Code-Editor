import axios from "axios";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";

const app = express();
const server = http.createServer(app);

const url = `https://real-time-collaborative-code-editor-i9bo.onrender.com`;
const interval = 30000;

function reloadWebsite() {
  axios
    .get(url)
    .then((response) => {
      console.log("website reloded");
    })
    .catch((error) => {
      console.error(`Error : ${error.message}`);
    });
}

setInterval(reloadWebsite, interval);  

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  let currentRoom = null;
  let currentUser = null;

  // Join room
  socket.on("join", ({ roomId, username }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom)?.delete(currentUser);
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom) || [])
      );
    }

    currentUser = username;
    currentRoom = roomId;

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(username);

    io.to(roomId).emit("userJoined", Array.from(rooms.get(roomId)));
  });

  // Code change
  socket.on("codeChange", ({ roomId, code }) => {
    socket.to(roomId).emit("codeUpdate", { code });
  });

  // Leave room
  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom)?.delete(currentUser);
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom) || [])
      );
      socket.leave(currentRoom);
      currentRoom = null;
      currentUser = null;
    }
  });

  socket.on("typing", ({ roomId, username }) => {
  socket.to(roomId).emit("userTyping", { user: username });
});
socket.on("languageChange", ({ roomId, language }) => {
  socket.to(roomId).emit("languageUpdate", { language });
});
 
socket.on("runCode", async({ roomId, code, language,version }) => {
  if(rooms.has(roomId)){
    const room = rooms.get(roomId);
    const response= await axios.post("https://emkc.org/api/v2/piston/execute", {
      language,
      version,
      files: [
        {
          content: code
        }
      ] 
    });
    room.output = response.data.output;
    io.to(roomId).emit("codeOutput", response.data);
  }
});



  // Disconnect
  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom)?.delete(currentUser);
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom) || [])
      );
    }
  });
});

const port = process.env.PORT || 5000;

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'frontend/dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/dist/index.html'));
});



server.listen(port, () => {
  console.log("server is working on port", port);
});
