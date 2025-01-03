import { Server, Socket } from "socket.io";
import { Server as HttpServer} from 'http'

import { ptyProcess } from "./services/pseudoTerminal.ts";

import cors from "cors";
// import { log } from "console";

// Disable input echoing
ptyProcess.write('stty -echo\n');

export function initSocket(server :HttpServer): void {
  const io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins for testing
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("WebSocket server is ready.");

    socket.on('terminal:write', (data: string): void => {
      // console.log(data + " Hi");
      
      ptyProcess.write(`${data}\n`);
    })
    
    socket.on("join-playground", (playgroundId: string) => {
      console.log(`User ${socket.id} joined ${playgroundId}`);
      socket.join(playgroundId);
    });

    socket.on("code-change", (playgroundId: string, content: string) => {
      console.log(`Code change in ${playgroundId}: ${content}`);
    });

    socket.on("disconnect", () => {
      console.log(`User ${socket.id} disconnected`);
    });
    // Log server ready
  });

  ptyProcess.onData((data: string):void =>{
    console.log(`Io Edit started ${data}`);
    
    io.emit('terminal:data', data);

    // console.log(data);
    
  })
}
