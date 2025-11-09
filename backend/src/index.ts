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
import { getFolderStructure } from './utils/generateFolderStructure.ts'
import { randomUUID } from 'crypto'
import axios from 'axios'
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
// http://localhost:5173/69676096-bb01-46a1-811d-f277373682e0/dashboard

app.post('/v1/api/init-project', async(req, res) => {
try {
  const userId = randomUUID();
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
} catch (err) {
  console.error('Failed to initialize project:', err)
  res.json({ error: 'Failed to initialize project', message: err })
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
  console.log(`User ID for folder structure request: ${userId}`);
  const userProject = userProjectMap[userId];
  console.log("this is folder structure ",containerPath(userProject));
  try {
    const structure = getFolderStructure(containerPath(userProject));
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

