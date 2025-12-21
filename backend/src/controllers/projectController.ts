import { Request, Response } from 'express';
import axios from 'axios';
import { userProjectMap, userContainerMap, roomContainerMap } from '../index.ts';

export const initProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.body.userId;
    const projectName = req.body.name;

    console.log('Received init-project request for userId:', userId, 'projectName:', projectName);

    const response = await axios.post('http://localhost:3000/v1/api/init-container', {
      userId,
      projectName
    });

    if (response) {
      userProjectMap[userId] = projectName;
      userContainerMap[userId] = response.data.containerId;
      roomContainerMap[userId] = {
        containerName: `sharky_node-${userId}`,
        containerId: response.data.containerId,
      };
    }

    res.json({
      userId,
      containerId: response.data.containerId,
      freePort: response.data.freePort
    });
  } catch (err: any) {
    console.error('Failed to initialize project:', err);
    res.status(500).json({
      error: 'Failed to initialize project',
      message: err.response?.data?.error || err.message || 'Unknown error',
      details: err.response?.data
    });
  }
};
