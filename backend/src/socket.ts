import { Server, Socket } from "socket.io";
import { Server as HttpServer } from 'http';
import Docker from 'dockerode';

const docker = new Docker();

interface TerminalSession {
  containerId: string;
  workingDir: string;
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
    console.log(`✅ User connected: ${socket.id}`);

    // Initialize terminal session
    socket.on('terminal:init', async (containerId: string) => {
      sessions.set(socket.id, {
        containerId,
        workingDir: '/home/appuser/folder',
      });
      
      const prompt = getPrompt('/home/appuser/folder');
      socket.emit('terminal:data', `\x1b[32m●\x1b[0m Terminal ready\r\n${prompt}`);
    });

    // Execute command in Docker container
    socket.on('terminal:exec', async (command: string) => {
      const session = sessions.get(socket.id);
      
      if (!session) {
        socket.emit('terminal:data', '\r\n\x1b[31mError: Terminal not initialized\x1b[0m\r\n$ ');
        return;
      }

      try {
        // ✅ Handle cd command separately to update working directory
        if (command.trim().startsWith('cd ')) {
          const newDir = command.trim().substring(3).trim() || '~';
          
          // ✅ Handle special cases
          let targetPath: string;
          if (newDir === '~' || newDir === '') {
            targetPath = '/home/appuser/folder';
          } else if (newDir === '..') {
            // Go up one directory
            const parts = session.workingDir.split('/').filter(Boolean);
            parts.pop();
            targetPath = '/' + parts.join('/');
          } else if (newDir.startsWith('/')) {
            // Absolute path
            targetPath = newDir;
          } else {
            // Relative path
            targetPath = `${session.workingDir}/${newDir}`;
          }

          // ✅ Test if directory exists and is accessible
          const testResult = await executeInContainer(
            session.containerId,
            `test -d "${targetPath}" && echo "OK" || echo "ERROR"`,
            session.workingDir
          );

          if (testResult.output.trim() === 'OK') {
            // ✅ Directory exists, update session
            session.workingDir = targetPath;
            const prompt = getPrompt(session.workingDir);
            socket.emit('terminal:data', `\r\n${prompt}`);
          } else {
            // ✅ Directory doesn't exist
            const prompt = getPrompt(session.workingDir);
            socket.emit('terminal:data', `\r\ncd: ${newDir}: No such file or directory\r\n${prompt}`);
          }
          return;
        }

        // ✅ Execute regular command in current working directory
        const result = await executeInContainer(
          session.containerId,
          command,
          session.workingDir
        );

        const formattedOutput = result.output.replace(/\n/g, '\r\n');
        const prompt = getPrompt(session.workingDir);
        
        if (formattedOutput) {
          socket.emit('terminal:data', `\r\n${formattedOutput}\r\n${prompt}`);
        } else {
          socket.emit('terminal:data', `\r\n${prompt}`);
        }
        
      } catch (err) {
        const prompt = getPrompt(session.workingDir);
        socket.emit('terminal:data', `\r\n\x1b[31mError: ${err}\x1b[0m\r\n${prompt}`);
      }
    });

    socket.on("join-playground", (playgroundId: string) => {
      console.log(`User ${socket.id} joined ${playgroundId}`);
      socket.join(playgroundId);
    });

    socket.on("code-change", (playgroundId: string, content: string) => {
      console.log(`Code change in ${playgroundId}: ${content}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ User ${socket.id} disconnected`);
      sessions.delete(socket.id);
    });
  });
}

// ✅ Execute command in Docker container
async function executeInContainer(
  containerId: string,
  command: string,
  workingDir: string
): Promise<{ success: boolean; output: string }> {
  const container = docker.getContainer(containerId);
  
  // ✅ Use proper shell command with explicit working directory
  const exec = await container.exec({
    Cmd: ['sh', '-c', `cd "${workingDir}" && ${command} 2>&1`], // ✅ Added quotes and stderr redirect
    AttachStdout: true,
    AttachStderr: true,
    Tty: false, // ✅ Changed back to false for better error handling
  });

  const stream = await exec.start({ hijack: true, stdin: false });

  return new Promise((resolve) => {
    let output = '';

    stream.on('data', (chunk: Buffer) => {
      // ✅ Parse Docker stream properly
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
  
  // Option 4: Minimal with emoji
  // return `📁 \x1b[36m${folderName}\x1b[0m → `;
}
