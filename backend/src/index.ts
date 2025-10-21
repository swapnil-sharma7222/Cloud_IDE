import express from 'express'
import bodyParser from "body-parser";
import cors from "cors";
// import { Server, Socket } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv"
import { connectdb } from './db.ts'
import { initSocket } from "./socket.ts";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import { containerPath } from './utils/containerPath.ts';

const app = express();
const server= createServer(app);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
dotenv.config({ path: './.env' });
// connectdb();
initSocket(server)


export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

export function getFolderStructure(dir: string): FileNode[] {
  const items = fs.readdirSync(dir);

  return items.map((item) => {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      return {
        name: item,
        type: "folder",
        children: getFolderStructure(fullPath),
      };
    } else {
      return {
        name: item,
        type: "file",
      };
    }
  });
}

app.get("/v1/api/file-data", (req, res) => {
  let filePath = req.query.path as string;
  filePath = containerPath + filePath
  console.log(filePath);

  if (!filePath) {
    return res.status(400).json({ error: "Missing file path" });
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read file" });
  }
});

app.get("/v1/api/folder-structure", (req, res) => {
  try {
    const structure = getFolderStructure(containerPath);
    res.json(structure);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read folder structure" });
  }
});

const PORT: string|number  = process.env.PORT || 4200;
app.get("/", (req, res):void => {
  res.send(`Server is running on port ${PORT}`);
});

server.listen(PORT, (): void => {
  console.log(`Socket.IO server started at http://localhost:${PORT}`);
});