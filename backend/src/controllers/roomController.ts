import { Request, Response } from 'express';
import { generateRoomId } from '../utils/generateRoomId.ts';
import { userRoomIdMap } from '../index.ts';

export const validateRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = req.query.roomId as string;

    if (!roomId) {
      res.status(400).json({ error: 'Missing roomId' });
      return;
    }

    const isValid = userRoomIdMap.has(roomId);
    res.json({ valid: isValid });
  } catch (error) {
    console.error('Validate room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = generateRoomId();
    res.json({ roomId });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
