import express, { Request, Response } from 'express'
import Docker from 'dockerode'
import { v4 as uuidv4 } from 'uuid'
import cors from 'cors'
import { findFreePort } from './utils/checkFreePort.js'

const app = express()

app.use(cors())
app.use(express.json())
const docker = new Docker()
const PORT = 3000

interface RoomInfo {
  containerName: string
  containerId: string
}

const roomContainerMap: Record<string, RoomInfo> = {}
const string = 'console.log("hello world swapnil")'
const containerId = "b4ee9b032e1e0a930a178c4c107e6bceb2445b5db8fdcec6bcdd2630181b708e"

async function startContainerFromLocalImage(imageName: string, containerName: string, portMappings: string[] = []) : Promise<string | undefined> {
  try {
    // Check if the image exists locally
    const images = await docker.listImages({ filters: { reference: [imageName] } });
    if (images.length === 0) {
      console.error(`Image "${imageName}" not found locally. Please ensure it's pulled or built.`);
      return;
    }

    const exposedPorts: Record<string, {}> = {};
    const portBindings: Record<string, Array<{ HostPort: string }>> = {};

    portMappings.forEach(mapping => {
      const [hostPort, containerPort] = mapping.split(':');
      const portKey = `${containerPort}/tcp`;

      exposedPorts[portKey] = {};
      portBindings[portKey] = [{ HostPort: hostPort }];
    });

    console.log('📦 Creating container with port mappings:', {
      exposedPorts,
      portBindings
    });


    // Create and start the container
    const container = await docker.createContainer({
      Image: imageName,
      name: containerName,
      Tty: true, // ✅ Add Tty for interactive shell
      Cmd: ['/bin/sh'], // ✅ Keep container running
      ExposedPorts: exposedPorts,
      HostConfig: {
        PortBindings: portBindings,
        AutoRemove: false,
      },
    });

    await container.start();
    console.log(`Container "${containerName}" started successfully from image "${imageName}".`);
    console.log(`Container ID: ${container.id}`);

    // You can also inspect the container for more details
    const containerInfo = await container.inspect();
    console.log('🔌 Port Mappings:', containerInfo.NetworkSettings.Ports);
    console.log('Container IP Address:', containerInfo.NetworkSettings.IPAddress);
    return container.id;

  } catch (err) {
    console.error('Error starting container:', err);
    throw err;
  }
}

const createAndRunContainer = (req: Request, res: Response) => {
  const roomId = uuidv4()
  const containerName = `cloud_ide_container_${roomId}`
  const imageName = 'pushpak01/cloud_ide-node-alpine'

  docker.pull(imageName, (err: Error | null, stream: NodeJS.ReadableStream) => {
    if (err) {
      console.error('Pull error:', err)
      return res.status(500).send('Failed to pull image')
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
        })

        await container.start()

        roomContainerMap[roomId] = {
          containerName,
          containerId: container.id,
        }

        console.log(`✅ Container started for room ${roomId}: ${containerName}`)
        res.send({ roomId, containerName })
      } catch (createErr) {
        console.error('Container creation error:', createErr)
        res.status(500).send('Failed to create/start container')
      }
    })
  })
}

app.post('/v1/api/init-container', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const freePort = await findFreePort(4000, 4100, 50);

    if (!freePort) {
      res.status(503).json({ error: 'No available ports' });
      return;
    }

    console.log(`🔍 Starting container for user ${userId} on port ${freePort}`);

    const containerId = await startContainerFromLocalImage(
      'sharky_node',
      `sharky_node-${userId}`,
      [`${freePort}:4000`] // Maps host:freePort -> container:4000
    );

    if (!containerId) {
      res.status(500).json({ error: 'Failed to start container' });
      return;
    }

    res.json({
      message: 'Project initialization started',
      userId,
      containerId,
      freePort,
      previewUrl: `http://localhost:${freePort}`
    });
  } catch (err) {
    console.error('Init container error:', err);
    res.status(500).json({
      error: 'Failed to initialize container',
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the Cloud IDE API')
})

app.get('/start', (req: Request, res: Response) => {
  var container = docker.getContainer(containerId)
  container.inspect(function (err, data) {
    console.log(data)
  })

  container.start(function (err, data) {
    console.log(data)
  })
  res.send('Container started')
})

async function execute(command: string[], req: Request, res: Response) {
  try {
    const container = docker.getContainer(containerId)

    // Create exec instance
    const exec = await container.exec({
      Cmd: command,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
    })

    // Start the exec and get output
    const stream = await exec.start({ hijack: true, stdin: false })
    
    let output = ''

    stream.on('data', (chunk: Buffer) => {
      output += chunk.toString('utf8')
    })

    stream.on('end', () => {
      console.log(`✅ Executed command in container`)
      try {
        output = output.replace(/\u001b\[.*?m/g, '') // Remove ANSI escape codes
        output = output.replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
        output = output.replace(/\r\n/g, '\n') // Normalize newlines
        console.log('Raw output:', output)

        const outputJson = { output: output.trim() }
        res.json(outputJson)
      } catch (err) {
        console.error('❌ Failed to parse container output as JSON:', err)
        res.json({ output: output.trim() }) // fallback: send raw text
      }
    })

    stream.on('error', (err: Error) => {
      console.error('Stream error:', err)
      res.status(500).send('Failed to execute command')
    })
  } catch (err) {
    console.error('Execution error:', err)
    res.status(500).send('Failed to execute command')
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
  const commandString =
    'cd home/appuser/folder && mkdir express && cd express && touch index.js'
  const command = ['sh', '-c', commandString]
  await execute(command, req, res)
})

let viteStarted = false // ✅ Persist across requests

app.post('/run', async (req: Request, res: Response) => {
  const { filePath, content } = req.body

  const escapedContent = content.replace(/'/g, "'\\''")

  async function startViteOnce() {
    if (viteStarted) return
    viteStarted = true

    const command = [
      'sh',
      '-c',
      `cd /home/app/user/my-react-app && npm run dev -- --port 3000`,
    ]

    await execute(command, req, res)
  }

  // ✅ Only start once when first /run call happens
  await startViteOnce()

})


app.get('/rooms', (req: Request, res: Response) => {
  res.send(roomContainerMap)
})

app.get('/stop/:roomId', (req: Request, res: Response) => {
  const { roomId } = req.params
  const roomInfo = roomContainerMap[roomId]

  if (!roomInfo) {
    res.status(404).send('Room not found')
    return
  }

  const container = docker.getContainer(roomInfo.containerId)
  container
    .stop()
    .then(() => {
      delete roomContainerMap[roomId]
      console.log(`🛑 Stopped and removed container for room ${roomId}`)
      res.send(`Container for room ${roomId} stopped and removed.`)
    })
    .catch((err: any) => {
      console.error('Error stopping container:', err)
      res.status(500).send('Failed to stop container')
    })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
})
