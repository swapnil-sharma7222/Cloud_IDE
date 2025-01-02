import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
// import { Server, Socket } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv"
import { connectdb } from './db.js'
import { initSocket } from "./socket.js";
// import io from './socket'


const app = express();
const server= createServer(app);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
dotenv.config({ path: './.env' });
// connectdb();
initSocket(server)


const PORT: string|number  = process.env.PORT || 4200;
app.get("/", (req, res):void => {
  res.send(`Server is running on port ${PORT}`);
});

server.listen(PORT, (): void => {
  console.log(`Socket.IO server started at http://localhost:${PORT}`);
});


// const io = new Server(server, {
//   cors: {
//     origin: '*', // Allow all origins for testing
//   },
// });

// io.on('connection', (socket: Socket) => {
//   console.log(`User connected: ${socket.id}`);

//   socket.on('join-playground', (playgroundId: string) => {
//     console.log(`User ${socket.id} joined ${playgroundId}`);
//     socket.join(playgroundId);
//   });

//   socket.on('code-change', (playgroundId: string, content: string) => {
//     console.log(`Code change in ${playgroundId}: ${content}`);
//   });

//   socket.on('disconnect', () => {
//     console.log(`User ${socket.id} disconnected`);
//   });
//   // Log server ready
//   console.log("WebSocket server is ready.");
// });

