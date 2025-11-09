import Docker from 'dockerode';
import { containerPath } from './containerPath.js';

const docker = new Docker();

export async function startContainerFromLocalImage(imageName: string, containerName: string, portMappings: string[] = [], projectName: string): Promise<string | undefined> {
  try {
    // Check if the image exists locally
    const images = await docker.listImages({ filters: { reference: [imageName] } });
    if (images.length === 0) {
      console.error(`Image "${imageName}" not found locally. Please ensure it's pulled or built.`);
      return;
    }

    const hostPath= containerPath+ `${projectName}`;
    console.log('Host path for volume mounting:', hostPath);

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
      Tty: true,
      Cmd: ['/bin/sh'],
      ExposedPorts: exposedPorts,
      HostConfig: {
        PortBindings: portBindings,
        AutoRemove: false,
        Binds: [
          `${hostPath}:/home/appuser/folder`,
        ],
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