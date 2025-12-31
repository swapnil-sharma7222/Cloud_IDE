import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import { createServer } from 'http'
import dotenv from 'dotenv'
import { connectdb } from './db.ts'
import { initSocket } from './socket.ts'

// Import routes
import authRoutes from './routes/authRoutes.ts'
import roomRoutes from './routes/roomRoutes.ts'
import projectRoutes from './routes/projectRoutes.ts'
import fileRoutes from './routes/fileRoutes.ts'

export const app = express()
const server = createServer(app)

// Middleware
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())
dotenv.config({ path: './.env' })

// Initialize database and socket
// connectdb();
initSocket(server)

// Data maps
interface RoomInfo {
  containerName: string
  containerId: string
}

export const roomContainerMap: Record<string, RoomInfo> = {}
export const userProjectMap: Record<string, string> = {}
export const userContainerMap: Record<string, string> = {}

// Sample data
userProjectMap["69676096-bb01-46a1-811d-f277373682e0"] = "pro1"
userProjectMap["swapnil"] = "swapnil_node"

export const userUserIdMap: Record<string, string> = {}
userUserIdMap["69676096-bb01-46a1-811d-f277373682e0"] = "swapnil"

export const userIdMap: Map<string, string> = new Map();
userIdMap.set("swapnil", "swapnil");
userIdMap.set("sharma", "sharma");

export const userRoomIdMap: Map<string, string[]> = new Map();
// Base route
const BASE_ROUTE = '/v1/api';

// Mount routes
app.use(BASE_ROUTE, authRoutes);
app.use(BASE_ROUTE, roomRoutes);
app.use(BASE_ROUTE, projectRoutes);
app.use(BASE_ROUTE, fileRoutes);

// Health check route
const PORT: string | number = process.env.PORT || 4200
app.get('/', (req, res): void => {
  res.send(`Server is running on port ${PORT}`)
})

server.listen(PORT, (): void => {
  console.log(`Socket.IO server started at http://localhost:${PORT}`)
})


