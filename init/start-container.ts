import Docker, { Container } from 'dockerode';
import Stream from 'stream';

const docker = new Docker(); // Defaults to Docker socket
const imageName = 'pushpak01/cloud_ide-node-alpine:latest';
const containerName = 'cloud_ide_container';

function pullImage(image: string): Promise<void> {
  return new Promise((resolve, reject) => {
    docker.pull(image, (err: Error | null, stream: Stream.Readable) => {
      if (err) return reject(err);

      docker.modem.followProgress(
        stream,
        (error: any, _output: any) => {
          if (error) return reject(error);
          resolve();
        },
        (event: any) => {
          if (event.status) {
            console.log(`${event.status} ${event.progress || ''}`);
          }
        }
      );
    });
  });
}

async function createAndRunContainer(): Promise<void> {
  try {
    console.log(`📦 Pulling image: ${imageName}`);
    await pullImage(imageName);
    console.log(`✅ Image pulled: ${imageName}`);

    const containers = await docker.listContainers({ all: true });
    const existing = containers.find(c =>
      c.Names.includes(`/${containerName}`)
    );

    if (existing) {
      console.log(`♻️ Removing old container: ${containerName}`);
      const oldContainer: Container = docker.getContainer(existing.Id);
      await oldContainer.remove({ force: true });
    }

    console.log(`🚀 Creating and starting container: ${containerName}`);
    const container = await docker.createContainer({
      Image: imageName,
      name: containerName,
      Tty: true,
      Cmd: ['node'],
      HostConfig: {
        PortBindings: {
          '3000/tcp': [{ HostPort: '3000' }],
        },
      },
    });

    await container.start();
    console.log(`✅ Container '${containerName}' is now running.`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createAndRunContainer();
