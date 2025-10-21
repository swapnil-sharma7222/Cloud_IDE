import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
// import { Server, Socket } from "socket.io";
import { createServer } from 'http'
import dotenv from 'dotenv'
import { connectdb } from './db.ts'
import { initSocket } from './socket.ts'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import os from 'os'
// import io from './socket'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const server = createServer(app)
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())
dotenv.config({ path: './.env' })
// connectdb();
initSocket(server)

const ROOT_DIR = path.join(os.homedir(), '/Desktop/newFolder/folder')

export interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

export function getFolderStructure(dir: string): FileNode[] {
  const items = fs.readdirSync(dir)

  return items.map((item) => {
    const fullPath = path.join(dir, item)
    const stats = fs.statSync(fullPath)

    if (stats.isDirectory()) {
      return {
        name: item,
        type: 'folder',
        children: getFolderStructure(fullPath),
      }
    } else {
      return {
        name: item,
        type: 'file',
      }
    }
  })
}

app.get('/v1/api/folder-structure', (req, res) => {
  try {
    const structure = getFolderStructure(ROOT_DIR)
    res.json(structure)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to read folder structure' })
  }
})

const PORT: string | number = process.env.PORT || 4200
app.get('/', (req, res): void => {
  res.send(`Server is running on port ${PORT}`)
})

server.listen(PORT, (): void => {
  console.log(`Socket.IO server started at http://localhost:${PORT}`)
})

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
