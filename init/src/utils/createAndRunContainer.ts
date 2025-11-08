import { v4 as uuidv4 } from 'uuid'
import Docker from 'dockerode'
import { Request, Response } from 'express'
const docker = new Docker()

interface RoomInfo {
  containerName: string
  containerId: string
}
const roomContainerMap: Record<string, RoomInfo> = {}

export const createAndRunContainer = (req: Request, res: Response) => {
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