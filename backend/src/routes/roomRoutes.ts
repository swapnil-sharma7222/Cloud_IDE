import { Router } from 'express';
import { validateRoom, createRoom } from '../controllers/roomController.ts';

const router = Router();

router.get('/rooms', validateRoom);
router.get('/create-room', createRoom);

export default router;
