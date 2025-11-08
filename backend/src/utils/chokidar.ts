import chokidar from "chokidar";
import { getFolderStructure } from "./generateFolderStructure.ts";
import { containerPath } from "./containerPath.js";
import { Server, DefaultEventsMap } from "socket.io";

// Optional: Export a function so you can start the watcher from your server
export function chokidarWatcher(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
  const watcher = chokidar.watch(containerPath, {
    ignored: /^\./,
    persistent: true,
    ignoreInitial: true,
  });

  const emitStructureUpdate = () => {
    try {
      const structure = getFolderStructure(containerPath);
      io.emit("folderStructureUpdate", structure);
      console.log("Folder structure updated");
    } catch (error) {
      console.error("Failed to get updated folder structure:", error);
    }
  };

  watcher
    .on("add", emitStructureUpdate)
    .on("addDir", emitStructureUpdate)
    .on("unlink", emitStructureUpdate)
    .on("unlinkDir", emitStructureUpdate)
    .on("error", error => console.error("Watcher error:", error));
}