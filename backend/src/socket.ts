import { Server, Socket } from 'socket.io'
import { Server as HttpServer } from 'http'
import { createTerminalManager } from './services/pseudoTerminal.ts'

const terminalManager = createTerminalManager()

export function initSocket(server: HttpServer): void {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  })

  io.on('connection', (socket: Socket) => {
    console.log('WebSocket server is ready.')
    console.log(`User connected: ${socket.id}`)

    // Create a shell for this socket
    terminalManager.createPty(socket, (data: string) => {
      console.log('data from terminal', data);
      socket.emit('terminal:data', data)
    })

    socket.on('terminal:write', (data: string): void => {
      console.log('data from client', data)
      terminalManager.write(socket.id, data)
    })

    socket.on('join-playground', (playgroundId: string) => {
      console.log(`User ${socket.id} joined ${playgroundId}`)
      socket.join(playgroundId)
    })

    socket.on('code-change', (playgroundId: string, content: string) => {
      console.log(`Code change in ${playgroundId}: ${content}`)
    })

    socket.on('disconnect', () => {
      terminalManager.clear(socket.id)
      console.log(`User ${socket.id} disconnected`)
    })
  })
}
