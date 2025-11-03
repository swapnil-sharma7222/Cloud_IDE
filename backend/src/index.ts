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
import { containerPath } from './utils/containerPath.ts'
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

// const containerPath = path.join(os.homedir(), '/Desktop/newFolder/folder')

export interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

// export function getFolderStructure(dir: string): FileNode[] {
//   const items = fs.readdirSync(dir)

//   return items.map((item) => {
//     const fullPath = path.join(dir, item)
//     const stats = fs.statSync(fullPath)

//     if (stats.isDirectory()) {
//       return {
//         name: item,
//         type: 'folder',
//         children: getFolderStructure(fullPath),
//       }
//     } else {
//       return {
//         name: item,
//         type: 'file',
//       }
//     }
//   })
// }
// Add near the top (after interfaces) or above getFolderStructure
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.cache',
  '.next',
  'dist',
  'build',
])

export function getFolderStructure(dir: string): FileNode[] {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    // Unable to read this directory (permissions, etc.) → skip
    return []
  }

  return entries.map((entry): FileNode => {
    const name = entry.name

    // Skip known heavy/system folders
    if (entry.isDirectory() && IGNORED_DIRS.has(name)) {
      return {
        name,
        type: 'folder',
        children: [],
      }
    }

    // Do not follow symlinks to avoid permission issues and cycles
    if (entry.isSymbolicLink()) {
      return {
        name,
        type: 'file',
      }
    }

    if (entry.isDirectory()) {
      const fullPath = path.join(dir, name)
      return {
        name,
        type: 'folder',
        children: getFolderStructure(fullPath),
      }
    }

    return {
      name,
      type: 'file',
    }
  })
}

app.get('/v1/api/file-data', (req, res) => {
  let filePath = req.query.path as string
  filePath = containerPath + filePath
  console.log(filePath)

  if (!filePath) {
    return res.status(400).json({ error: 'Missing file path' })
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    res.json({ content })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to read file' })
  }
})

app.get('/v1/api/folder-structure', (req, res) => {
  console.log(containerPath);
  
  try {
    const structure = getFolderStructure(containerPath)
    res.json(structure)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to read folder structure' })
  }
})

app.post('/v1/api/save-file', express.json(), async (req, res) => {
  const { filepath, content } = req.body

  if (!filepath || content === undefined) {
    res.status(400).json({ error: 'filepath and content are required' })
    return
  }

  try {
    const fullPath = path.join(containerPath, filepath)

    // Ensure directory exists
    const dir = path.dirname(fullPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Write file
    fs.writeFileSync(fullPath, content, 'utf8')

    console.log(`✅ Saved file: ${filepath}`)
    res.json({ success: true, message: 'File saved successfully' })
  } catch (err) {
    console.error('❌ Failed to save file:', err)
    res.status(500).json({ error: 'Failed to save file' })
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
