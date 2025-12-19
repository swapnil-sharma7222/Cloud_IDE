import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import jwt from 'jsonwebtoken'
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
import { getFolderStructure } from './utils/generateFolderStructure.ts'
import { randomUUID } from 'crypto'
import axios from 'axios'
import { generateRoomId } from './utils/generateRoomId.ts'
// import io from './socket'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export const app = express()
const server = createServer(app)
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())
dotenv.config({ path: './.env' })
// connectdb();
initSocket(server)
interface RoomInfo {
  containerName: string
  containerId: string
}

export const roomContainerMap: Record<string, RoomInfo> = {}
export const userProjectMap: Record<string, string> = {}
export const userContainerMap: Record<string, string> = {}
userProjectMap["69676096-bb01-46a1-811d-f277373682e0"] = "pro1"
userProjectMap["swapnil"] = "swapnil_node"

// http://localhost:5173/69676096-bb01-46a1-811d-f277373682e0/dashboard
// http://localhost:5173/swapnil/dashboard
export const userUserIdMap: Record<string, string> = {}
userUserIdMap["69676096-bb01-46a1-811d-f277373682e0"] = "swapnil"
export const userIdMap: Map<string, string> = new Map();
userIdMap.set("swapnil", "swapnil");
userIdMap.set("sharma", "sharma");

export const userRoomIdMap: Set<string> = new Set();

app.post('/v1/api/login', async (req, res) => {
  const { name, password } = req.body;
  if (userIdMap.has(name) && userIdMap.get(name) === password) {
    const jwtPayload = { name, isAuth: true };
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.sendStatus(500);
    const token = jwt.sign(jwtPayload, secret, { expiresIn: '1h' });
    res.cookie('jwt_token', token, {
      httpOnly: false, // Prevents JS access (XSS defense)
      secure: false,   // Only send over HTTPS
      sameSite: 'strict', // Mitigates CSRF
      maxAge: 3600000 // Token expiry in milliseconds (e.g., 1 hour)
    })
    res.json({ success: true, name: name, token });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/v1/api/rooms', async (req, res) => {
  const roomId = req.query.roomId as string;
  if (!roomId) {
    return res.status(400).json({ error: 'Missing roomId' });
  }
  const isValid = userRoomIdMap.has(roomId);
  res.json({ valid: isValid });
});

app.get('/v1/api/create-room', async (req, res) => {
  const roomId = generateRoomId();
  userRoomIdMap.add(roomId);
  res.json({ roomId });
});

app.post('/v1/api/init-project', async(req, res) => {
try {
  const userId = req.body.userId;
  const projectName = req.body.name;
  console.log('Received init-project request for userId:', userId, 'projectName:', projectName)

  const response = await axios.post('http://localhost:3000/v1/api/init-container', { userId, projectName })
  if (response) {
    userProjectMap[userId] = projectName;
    userContainerMap[userId] = response.data.containerId;
    roomContainerMap[userId] = {
      containerName: `sharky_node-${userId}`,
      containerId: response.data.containerId,
    };
  }
  res.json({ userId, containerId: response.data.containerId, freePort: response.data.freePort })
} catch (err :any) {
  console.error('Failed to initialize project:', err)
  res.status(500).json({
    error: 'Failed to initialize project',
    message: err.response?.data?.error || err.message || 'Unknown error',
    details: err.response?.data
  });
}
})

app.get('/v1/api/file-data', (req, res) => {
  let filePath = req.query.path as string
  const userId = req.query.userId as string;
  const userProject = userProjectMap[userId];
  filePath = path.join(containerPath(userProject), filePath);
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
  const userId = req.query.userId as string;
  let filePath = req.query.filePath as string;
  // console.log(`User ID for folder structure request: ${userId}`);
  const userProject = userProjectMap[userId];
  if (filePath === '/') {
    filePath = userProject;
  } else {
    filePath = userProject + '/'+ filePath;
  }
  console.log(containerPath(filePath));
  try {
    const structure = getFolderStructure(containerPath(filePath));
    res.json(structure)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to read folder structure' })
  }
})

app.post('/v1/api/save-file', express.json(), async (req, res) => {
  const { filepath, content } = req.body
  const userId = req.query.userId as string;
  const userProject = userProjectMap[userId];

  if (!filepath || content === undefined) {
    res.status(400).json({ error: 'filepath and content are required' })
    return
  }

  try {
    const fullPath = path.join(containerPath(userProject), filepath)

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

