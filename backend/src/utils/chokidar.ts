import chokidar, { FSWatcher } from "chokidar";
import { getFolderStructure } from "./generateFolderStructure.js";
import { containerPath } from "./containerPath.js";
import { Server, Socket } from "socket.io";
import { userProjectMap } from "../index.js";

// ✅ Store watchers per userId to avoid duplicates
const watchers = new Map<string, FSWatcher>();

// Optional: Export a function so you can start the watcher from your server
export function chokidarWatcher(io: Server, socket: Socket): void {
  const userId = socket.handshake.query.userId as string;

  if (!userId) {
    console.error('❌ No userId for chokidar watcher');
    return;
  }

  const userProject = userProjectMap[userId];

  if (!userProject) {
    console.warn(`⚠️ No project found for user: ${userId}`);
    return;
  }

  // ✅ Check if watcher already exists for this user
  if (watchers.has(userId)) {
    console.log(`📂 Reusing existing watcher for user: ${userId}`);
    return;
  }

  const watchPath = containerPath(userProject);
  console.log(`👀 Starting file watcher for user ${userId} at: ${watchPath}`);

  // ✅ Watch the correct user-specific path
  const watcher = chokidar.watch(watchPath, {
    ignored: /(^|[\/\\])\../, // Ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    depth: 10, // Limit depth
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
  });

  const emitStructureUpdate = (eventType: string, path?: string) => {
    try {
      const structure = getFolderStructure(watchPath);

      // ✅ Emit only to this specific user's socket
      socket.emit("folderStructureUpdate", structure);

      console.log(`📁 [${userId}] ${eventType}: ${path || 'structure updated'}`);
    } catch (error) {
      console.error(`❌ Failed to get folder structure for ${userId}:`, error);
    }
  };

  watcher
    .on("add", (path) => emitStructureUpdate("File added", path))
    .on("addDir", (path) => emitStructureUpdate("Directory added", path))
    .on("unlink", (path) => emitStructureUpdate("File removed", path))
    .on("unlinkDir", (path) => emitStructureUpdate("Directory removed", path))
    // .on("change", (path) => emitStructureUpdate("File changed", path))
    .on("ready", () => console.log(`✅ Watcher ready for user: ${userId}`))
    .on("error", (error) => console.error(`❌ Watcher error for ${userId}:`, error));

  // ✅ Store watcher
  watchers.set(userId, watcher);

  // ✅ Cleanup watcher when user disconnects
  socket.on("disconnect", () => {
    console.log(`🧹 Cleaning up watcher for user: ${userId}`);
    const userWatcher = watchers.get(userId);
    if (userWatcher) {
      userWatcher.close();
      watchers.delete(userId);
    }
  });
}

// ✅ Export function to cleanup all watchers on server shutdown
export function closeAllWatchers(): void {
  console.log('🧹 Closing all file watchers...');
  watchers.forEach((watcher, userId) => {
    watcher.close();
    console.log(`Closed watcher for user: ${userId}`);
  });
  watchers.clear();
}