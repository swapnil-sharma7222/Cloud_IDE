import express, { Request, Response } from 'express';
import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const docker = new Docker();
const PORT = 3000;

interface RoomInfo {
  containerName: string;
  containerId: string;
}

const roomContainerMap: Record<string, RoomInfo> = {};

app.get('/start', (req: Request, res: Response) => {
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
});

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
