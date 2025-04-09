import express from 'express';
import Docker from 'dockerode';
import { PassThrough } from 'stream';

const app = express();
const port = 3000;
const docker = new Docker();

const imageName = 'pushpak01/cloud_ide-node-alpine';

app.get('/run-container', async (_req, res) => {
    try {
      console.log(`Pulling image ${imageName}...`);
      await new Promise((resolve, reject) => {
        docker.pull(imageName, (err: Error | null, stream: PassThrough) => {
          if (err) return reject(err);
          docker.modem.followProgress(stream, onFinished, onProgress);
  
          function onFinished(err: Error | null) {
            if (err) return reject(err);
            resolve(true);
          }
  
          function onProgress(event: any) {
            process.stdout.write('.');
          }
        });
      });
  
      console.log('\nImage pulled.');
  
      const containerName = 'cloud_ide_container';
  
      // Check if container exists
      const containers = await docker.listContainers({ all: true });
      const existingContainerInfo = containers.find(c => c.Names.includes(`/${containerName}`));
  
      if (existingContainerInfo) {
        const existingContainer = docker.getContainer(existingContainerInfo.Id);
        if (existingContainerInfo.State === 'running') {
          console.log('Stopping existing container...');
          await existingContainer.stop();
        }
        console.log('Removing existing container...');
        await existingContainer.remove();
      }
  
      // Create and start new container
      console.log('Creating and starting container...');
      const container = await docker.createContainer({
        Image: imageName,
        name: containerName,
        Tty: true,
      });
  
      await container.start();
      console.log(`Container started with ID: ${container.id}`);
      res.send(`Container started with ID: ${container.id}`);
    } catch (err) {
      console.error('Error:', err);
      res.status(500).send('Failed to pull and run the container.');
    }
  });
  

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Hello 
