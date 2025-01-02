
import cors from "cors"
import { Server, Socket } from "socket.io";
import { Server as HttpServer} from 'http'

// const io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>= new Server(server, {
//   cors: {
//     origin: '*',
//   }
// });

// io.on('connection', (socket)=>{
//   console.log('User has joined: ', socket.id);

//   socket.on('join-playground', (playgroundId): void => {
//     console.log(`User ${socket.id} joined ${playgroundId}`);
//     socket.join(playgroundId);
//   })

//   socket.on('code-change', (playgroundId: string, content)=> {
//     console.log("this is the code change", content);
//   })

//   socket.on('disconnection', ()=> {
//     console.log(`User ${socket.id} disconnected`);

//   })
// })

export function initSocket(server :HttpServer): void {
  const io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins for testing
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

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
    console.log("WebSocket server is ready.");
  });
}
