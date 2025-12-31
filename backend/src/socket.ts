import { Server, Socket } from "socket.io";
import { Server as HttpServer } from 'http';
import Docker from 'dockerode';
import { chokidarWatcher } from "./utils/chokidar";
import { getFolderStructure } from "./utils/generateFolderStructure";
import { containerPath } from "./utils/containerPath";
import { userProjectMap, userRoomIdMap } from ".";

const docker = new Docker();

interface TerminalSession {
  containerId: string;
  workingDir: string;
  userId: string;
}

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

const sessions = new Map<string, TerminalSession>();

export function initSocket(server: HttpServer): void {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });
  console.log('Socket.IO server initialized');

  io.on("connection", (socket: Socket) => {
    // ✅ Extract userId from socket handshake
    const userId = socket.handshake.query.userId as string;

    if (!userId) {
      console.error('❌ No userId provided');
      socket.emit('error', 'userId is required');
      socket.disconnect();
      return;
    }

    console.log(`✅ User connected: ${socket.id}, userId: ${userId}`);

    const userProject = userProjectMap[userId];
    let structure: FileNode[];

    if (userProject) {
      try {
        structure = getFolderStructure(containerPath(userProject));
        socket.emit("folderStructureUpdate", structure);
        console.log(`📁 Sent initial folder structure to user: ${userId}`);
      } catch (error) {
        console.error(`❌ Failed to send initial structure to ${userId}:`, error);
      }

      chokidarWatcher(io, socket);
    } else {
      console.warn(`⚠️ No project found for user: ${userId}`);
    }

    // Initialize terminal session
    socket.on('terminal:init', async (containerId: string) => {
      sessions.set(socket.id, {
        containerId,
        workingDir: `/home/appuser/folder/${userProject}`,
        userId,
      });

      const prompt = getPrompt(`${userProject}`);
      socket.emit('terminal:data', { text: `\x1b[32m●\x1b[0m Terminal ready\r\n${prompt}`, folderStructure: structure });
    });

    // Execute command in Docker container
    socket.on('terminal:exec', async (cmds: string) => {
      const session = sessions.get(socket.id);

      if (!session) {
        socket.emit('terminal:data', { text: `\r\n\x1b[31mError: Terminal not initialized\x1b[0m\r\n$ ` });
        return;
      }
      const commands = cmds.trim().split('&&').map(cmd => cmd.trim()).filter(cmd => cmd.length > 0);
      for (const command of commands) {
        try {
          if (command.trim().startsWith('cd')) {
            let newDir = command.trim().substring(2).trim() || '~';
            if (newDir.startsWith('./')) newDir = newDir.slice(2);

            let targetPath: string;
            if (newDir === '~' || newDir === '') {
              targetPath = `/home/appuser/folder/${userProject}`;
            } else if (newDir.startsWith('..')) {
              const numberOfFolders = (newDir.match(/\.\./g) || []).length;
              const parts = session.workingDir.split('/').filter(Boolean);
              parts.splice(-numberOfFolders, numberOfFolders);
              targetPath = '/' + parts.join('/');
            } else {
              targetPath = `${session.workingDir}/${newDir}`;
            }

            const testResult = await executeInContainer(
              session.containerId,
              `test -d "${targetPath}" && echo "OK" || echo "ERROR"`,
              session.workingDir
            );

            if (testResult.output.trim() === 'OK') {
              session.workingDir = targetPath;
              const folderStructure = getFolderStructure(containerPath(session.workingDir.slice(session.workingDir.lastIndexOf(userProject))));
              const prompt = getPrompt(session.workingDir.slice(session.workingDir.indexOf(userProject)));
              socket.emit('terminal:data', { text: `\r\n${prompt}`, folderStructure });
            } else {
              const prompt = getPrompt(session.workingDir.slice(session.workingDir.indexOf(userProject)));
              socket.emit('terminal:data', `\r\ncd: ${newDir}: No such file or directory\r\n${prompt}`);
            }
            continue;
          }

          const result = await executeInContainer(
            session.containerId,
            command,
            session.workingDir
          );

          const formattedOutput = result.output.replace(/\n/g, '\r\n');
          const prompt = getPrompt(session.workingDir.slice(session.workingDir.indexOf(userProject)));

          if (formattedOutput) {
            socket.emit('terminal:data', { text: `\r\n${formattedOutput}\r\n${prompt}` });
          } else {
            socket.emit('terminal:data', { text: `\r\n${prompt}` });
          }

        } catch (err) {
          const prompt = getPrompt(session.workingDir.slice(session.workingDir.indexOf(userProject)));
          socket.emit('terminal:data', { text: `\r\n\x1b[31mError: ${err}\x1b[0m\r\n${prompt}` });
        }
      }
    });

    socket.on("join-room", (data) => {
      const { roomId, userId } = data;
      if (userRoomIdMap.get(roomId)) {
        userRoomIdMap.get(roomId)?.push(userId);
      } else {
        return "This room do not exists"
      }

      socket.join(roomId);
      socket.emit('room:joined', { roomId, userId, message: 'Successfully joined room' });
      socket.to(roomId).emit("user-joined", { userId });
      console.log(`✅ User ${userId} joined room ${roomId}`);
    });

    socket.on('webRTC-offer', ({ roomId, offer }) => {
      console.log(`[SIGNAL] offer from ${userId} (${socket.id}) -> room ${roomId}`);
      socket.to(roomId).emit('webRTC-offer', {
        offer,
        from: socket.id,
        userId
      });
    });

    socket.on('webRTC-answer', ({ roomId, answer, to }) => {
      console.log(`[SIGNAL] answer from ${userId} (${socket.id}) -> ${to || roomId}`);
      if (to) {
        console.log(`📤 Sending WebRTC answer to ${to} in room ${roomId}`);
        io.to(to).emit('webRTC-answer', {
          answer,
          from: socket.id,
          userId
        });
      } else {
        console.log(`📤 Broadcasting WebRTC answer in room ${roomId}`);
        socket.to(roomId).emit('webRTC-answer', {
          answer,
          from: socket.id,
          userId
        });
      }
    });


    socket.on('webrtc:ice-candidate', ({ roomId, candidate }: { roomId: string; candidate: RTCIceCandidateInit }) => {
      console.log(`📤 Forwarding ICE candidate in room ${roomId}`);
      socket.to(roomId).emit('webrtc:ice-candidate', { candidate, from: socket.id });
    });

    socket.on('leave-room', ({ roomId }: { roomId: string }) => {
      console.log(`🚪 User ${userId} leaving room: ${roomId}`);

      socket.leave(roomId);
      userRoomIdMap.delete(roomId);

      // Notify others
      socket.to(roomId).emit('user:left', { userId, roomId });
    });

    socket.on('create-room', ({ userId }: { userId: string }, callback: Function) => {
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`🏠 Creating room ${roomId} for user ${userId}`);

      socket.join(roomId);
      userRoomIdMap.set(roomId, [userId])
      callback({ success: true, roomId });
    });

    socket.on("join-playground", (playgroundId: string) => {
      console.log(`User ${socket.id} joined ${playgroundId}`);
      socket.join(playgroundId);
    });

    socket.on("code-change", (playgroundId: string, content: string) => {
      console.log(`Code change in ${playgroundId}: ${content}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ User ${socket.id} (userId: ${userId}) disconnected`);
      sessions.delete(socket.id);
    });
  });
}

async function executeInContainer(
  containerId: string,
  command: string,
  workingDir: string
): Promise<{ success: boolean; output: string }> {
  const container = docker.getContainer(containerId);

  const exec = await container.exec({
    Cmd: ['sh', '-c', `cd "${workingDir}" && ${command} 2>&1`],
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
  });

  const stream = await exec.start({ hijack: true, stdin: false });

  return new Promise((resolve) => {
    let output = '';

    stream.on('data', (chunk: Buffer) => {
      let offset = 0;
      while (offset < chunk.length) {
        if (chunk.length - offset < 8) break;

        const header = chunk.slice(offset, offset + 8);
        const payloadLength = header.readUInt32BE(4);

        offset += 8;

        if (chunk.length - offset < payloadLength) break;

        const payload = chunk.slice(offset, offset + payloadLength);
        output += payload.toString('utf8');

        offset += payloadLength;
      }
    });

    stream.on('end', async () => {
      try {
        const inspect = await exec.inspect();
        resolve({
          success: inspect.ExitCode === 0,
          output: output.trim(),
        });
      } catch (err) {
        resolve({
          success: false,
          output: output.trim(),
        });
      }
    });

    stream.on('error', (err: Error) => {
      resolve({
        success: false,
        output: `Error: ${err.message}`,
      });
    });

    setTimeout(() => {
      resolve({
        success: false,
        output: output.trim() || 'Command timed out',
      });
    }, 10000);
  });
}
// ✅ Generate colored prompt with current directory
function getPrompt(workingDir: string): string {
  // Get just the folder name (last part of path)
  const folderName = workingDir

  // Style options - choose one:

  // Option 1: Simple colored prompt with full path
  // return `\x1b[36m${workingDir}\x1b[0m $ `;

  // Option 2: With username and folder (like user@host:~/folder$)
  return `\x1b[32muser\x1b[0m@\x1b[34mcontainer\x1b[0m:\x1b[36m~${folderName}\x1b[0m$ `;

  // Option 3: Just folder name with arrow (like folder >)
  // return `\x1b[36m${folderName}\x1b[0m > `;
}
