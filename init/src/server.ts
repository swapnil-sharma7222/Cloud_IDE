import express, { Request, Response } from 'express';
import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
const docker = new Docker();
const PORT = 3000;
const containerID = "6752d7b18eb8b8fc0754dfdda55e2972973df8f720a81224d5eb1b6d9751c275"

interface RoomInfo {
  containerName: string;
  containerId: string;
}

const roomContainerMap: Record<string, RoomInfo> = {};
const string = 'console.log("hello world swapnil")';

const createAndRunContainer = (req: Request, res: Response) => {
  const roomId = uuidv4();
  const containerName = `cloud_ide_container_${roomId}`;
  const imageName = 'pushpak01/cloud_ide-node-alpine';

  docker.pull(imageName, (err: Error | null, stream: NodeJS.ReadableStream) => {
    if (err) {
      console.error('Pull error:', err);
      return res.status(500).send('Failed to pull image');
    }

    docker.modem.followProgress(stream, async () => {
      try {
        const container = await docker.createContainer({
          Image: imageName,
          name: containerName,
          Tty: true,
          Cmd: ['/bin/sh'],
          HostConfig: {
            AutoRemove: true,
          },
        });

        await container.start();

        roomContainerMap[roomId] = {
          containerName,
          containerId: container.id,
        };

        console.log(`✅ Container started for room ${roomId}: ${containerName}`);
        res.send({ roomId, containerName });
      } catch (createErr) {
        console.error('Container creation error:', createErr);
        res.status(500).send('Failed to create/start container');
      }
    });
  });
}

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Cloud IDE API");
});

app.get('/start', (req: Request, res: Response) => {
  var container = docker.getContainer(containerID);
  // container.inspect(function (err, data) {
  //   console.log(data);
  // });

  container.start(function (err, data) {
    console.log(data);
  });

});

async function execute(command: string[], req: Request, res: Response) {
  try {
    const container = docker.getContainer(containerID);

    // Create exec instance
    const exec = await container.exec({
      Cmd: command,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
    });

    // Start the exec and get output
    const stream = await exec.start({ hijack: true, stdin: false });

    let output = '';

    stream.on('data', (chunk: Buffer) => {
      output += chunk.toString('utf8');
    });

    stream.on('end', () => {
      console.log(`✅ Executed command in container`);
      try {
        output = output.replace(/\u001b\[.*?m/g, ''); // Remove ANSI escape codes
        output = output.replace(/^\s+|\s+$/g, ''); // Trim leading/trailing whitespace
        output = output.replace(/\r\n/g, '\n'); // Normalize newlines
        console.log('Raw output:', output);

        const outputJson = { output: output.trim() };
        res.json(outputJson);
      } catch (err) {
        console.error("❌ Failed to parse container output as JSON:", err);
        res.json({ output: output.trim() }); // fallback: send raw text
      }
    });

    stream.on('error', (err: Error) => {
      console.error('Stream error:', err);
      res.status(500).send('Failed to execute command');
    });

  } catch (err) {
    console.error('Execution error:', err);
    res.status(500).send('Failed to execute command');
  }
}

// Add this new endpoint to execute commands in a container
app.get('/execute/', express.json(), async (req: Request, res: Response) => {
  // const { roomId } = req.params;
  // const { command } = req.body; // command should be an array like ['sh', '-c', 'cd /home/appuser && touch hello.js']

  // const roomInfo = roomContainerMap[roomId];

  // if (!roomInfo) {
  //   res.status(404).send('Room not found');
  //   return;
  // }
  /**
   * const express= require("express")

    const app= express();
    app.use(express.json());

    app.listen(1000, ()=> {
        console.log("Server is running on port 1000")
    })
   */  
  const commandString = "cd home/appuser/folder/express && touch inde.js"
  const command= ['sh', '-c', commandString]
  await execute(command, req, res)
});

app.post('/run', async (req: Request, res: Response) => {
  const { filePath } = req.body; // filePath: 'home/node/app/express'
  
  const escapedContent = string.replace(/'/g, "'\\''");

  // const commandString = `echo '${escapedContent}' > ${filePath} && node hello.js`;
  // const c= "node hello.js"
  const commandString = `cd ${filePath} && node index.js`;
  // const commandString = `ls -a`;
  const command = ['sh', '-c', commandString];

  await execute(command, req, res);
})


app.get('/rooms', (req: Request, res: Response) => {
  res.send(roomContainerMap);
});

app.get('/stop/:roomId', (req: Request, res: Response) => {
    const { roomId } = req.params;
    const roomInfo = roomContainerMap[roomId];
  
    if (!roomInfo) {
      res.status(404).send('Room not found');
      return;
    }
  
    const container = docker.getContainer(roomInfo.containerId);
    container.stop()
      .then(() => {
        delete roomContainerMap[roomId];
        console.log(`🛑 Stopped and removed container for room ${roomId}`);
        res.send(`Container for room ${roomId} stopped and removed.`);
      })
      .catch((err: any) => {
        console.error('Error stopping container:', err);
        res.status(500).send('Failed to stop container');
      });
  });
  

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});


// import express, { Request, Response } from 'express';
// import Docker from 'dockerode';
// import { v4 as uuidv4 } from 'uuid';

// const app = express();
// app.use(express.json());
// const docker = new Docker();
// const PORT = 3000;

// interface RoomInfo {
//   containerName: string;
//   containerId: string;
//   exposedPorts: Record<number, number>; // container port -> host port
// }

// const roomContainerMap: Record<string, RoomInfo> = {};

// // ✅ Port pool management
// const PORT_POOL_START = 4000;
// const PORT_POOL_END = 4100;
// const usedPorts = new Set<number>();

// function allocatePort(): number | null {
//   for (let port = PORT_POOL_START; port <= PORT_POOL_END; port++) {
//     if (!usedPorts.has(port)) {
//       usedPorts.add(port);
//       return port;
//     }
//   }
//   return null;
// }

// function releasePort(port: number): void {
//   usedPorts.delete(port);
// }

// // ✅ Create container with multiple port mappings
// app.get('/create-container', async (req: Request, res: Response) => {
//   const roomId = uuidv4();
//   const containerName = `cloud_ide_container_${roomId}`;
//   const imageName = 'pushpak01/cloud_ide-node-alpine';

//   // Allocate 10 ports for this container (3000-3009, 5000-5009, etc.)
//   const portMappings: Record<number, number> = {};
//   const portsToExpose = [3000, 4000, 5000, 6000, 7000, 8000, 8080, 9000];

//   for (const containerPort of portsToExpose) {
//     const hostPort = allocatePort();
//     if (!hostPort) {
//       // Release all allocated ports if we can't allocate enough
//       Object.values(portMappings).forEach(p => releasePort(p));
//       res.status(503).send('Not enough available ports');
//       return;
//     }
//     portMappings[containerPort] = hostPort;
//   }

//   try {
//     // await new Promise((resolve, reject) => {
//     //   docker.pull(imageName, (err: Error | null, stream: NodeJS.ReadableStream) => {
//     //     if (err) return reject(err);
//     //     docker.modem.followProgress(stream, (err: Error | null) => {
//     //       if (err) return reject(err);
//     //       resolve(true);
//     //     });
//     //   });
//     // });

//     const exposedPorts: Record<string, {}> = {};
//     const portBindings: Record<string, Array<{ HostPort: string }>> = {};

//     Object.entries(portMappings).forEach(([containerPort, hostPort]) => {
//       const portKey = `${containerPort}/tcp`;
//       exposedPorts[portKey] = {};
//       portBindings[portKey] = [{ HostPort: hostPort.toString() }];
//     });

//     const container = await docker.createContainer({
//       Image: "sha256:4e054ccae2353f14becf53c122e3f70f1893bf9993496569c89690dbff171eaf",
//       name: containerName,
//       Tty: true,
//       Cmd: ['/bin/sh'],
//       ExposedPorts: exposedPorts,
//       HostConfig: {
//         PortBindings: portBindings,
//         AutoRemove: true,
//       },
//     });

//     await container.start();

//     const containerInfo = await container.inspect();

//     roomContainerMap[roomId] = {
//       containerName,
//       containerId: containerInfo.Id,
//       exposedPorts: portMappings,
//     };

//     console.log(`✅ Container created: ${roomId}`);
//     console.log(`   Port mappings:`, portMappings);

//     res.json({
//       roomId,
//       containerId: containerInfo.Id,
//       ports: portMappings,
//     });
//   } catch (err) {
//     console.error('❌ Failed to create container:', err);
//     Object.values(portMappings).forEach(p => releasePort(p));
//     res.status(500).send('Failed to create container');
//   }
// });

// // ✅ Get preview URL for a specific port
// app.get('/preview-url/:roomId/:containerPort', (req: Request, res: Response) => {
//   const { roomId, containerPort } = req.params;
//   const roomInfo = roomContainerMap[roomId];

//   if (!roomInfo) {
//     res.status(404).json({ error: 'Room not found' });
//     return;
//   }

//   const hostPort = roomInfo.exposedPorts[parseInt(containerPort)];

//   if (!hostPort) {
//     res.status(404).json({ error: `Port ${containerPort} not exposed for this container` });
//     return;
//   }

//   res.json({
//     containerPort: parseInt(containerPort),
//     hostPort,
//     previewUrl: `http://localhost:${hostPort}`,
//   });
// });

// // ✅ Execute command in container
// async function execute(command: string[], containerId: string): Promise<string> {
//   const container = docker.getContainer(containerId);

//   const exec = await container.exec({
//     Cmd: command,
//     AttachStdout: true,
//     AttachStderr: true,
//     Tty: false,
//   });

//   const stream = await exec.start({ hijack: true, stdin: false });

//   return new Promise((resolve, reject) => {
//     let output = '';

//     stream.on('data', (chunk: Buffer) => {
//       output += chunk.toString('utf8');
//     });

//     stream.on('end', () => {
//       resolve(output.replace(/\u001b\[.*?m/g, '').trim());
//     });

//     stream.on('error', (err: Error) => {
//       reject(err);
//     });
//   });
// }

// // ✅ Start app on specific port
// app.post('/start-app/:roomId', async (req: Request, res: Response) => {
//   const { roomId } = req.params;
//   const { command, port, workDir } = req.body; 
//   // e.g., { command: "node index.js", port: 6000, workDir: "/home/appuser/folder/express" }

//   const roomInfo = roomContainerMap[roomId];

//   if (!roomInfo) {
//     res.status(404).send('Room not found');
//     return;
//   }

//   if (!roomInfo.exposedPorts[port]) {
//     res.status(400).send(`Port ${port} is not exposed for this container`);
//     return;
//   }

//   try {
//     // Kill any existing process on that port first
//     const killCmd = `lsof -ti:${port} | xargs kill -9 || true`;
//     const startCmd = `cd ${workDir} && PORT=${port} ${command} > /tmp/app_${port}.log 2>&1 &`;
    
//     await execute(['sh', '-c', killCmd], roomInfo.containerId);
//     await execute(['sh', '-c', startCmd], roomInfo.containerId);

//     const hostPort = roomInfo.exposedPorts[port];

//     res.json({
//       success: true,
//       message: `App started on container port ${port}`,
//       previewUrl: `http://localhost:${hostPort}`,
//       containerPort: port,
//       hostPort,
//     });
//   } catch (err) {
//     console.error('❌ Failed to start app:', err);
//     res.status(500).send('Failed to start application');
//   }
// });

// // ✅ Stop container and release ports
// app.delete('/stop-container/:roomId', async (req: Request, res: Response) => {
//   const { roomId } = req.params;
//   const roomInfo = roomContainerMap[roomId];

//   if (!roomInfo) {
//     res.status(404).send('Room not found');
//     return;
//   }

//   try {
//     const container = docker.getContainer(roomInfo.containerId);
//     await container.stop();

//     Object.values(roomInfo.exposedPorts).forEach(port => releasePort(port));
//     delete roomContainerMap[roomId];

//     res.send(`Container ${roomId} stopped and ports released`);
//   } catch (err) {
//     console.error('❌ Failed to stop container:', err);
//     res.status(500).send('Failed to stop container');
//   }
// });

// app.get('/rooms', (req: Request, res: Response) => {
//   res.json(roomContainerMap);
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });