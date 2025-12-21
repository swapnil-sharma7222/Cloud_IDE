import { Router } from 'express';
import { login } from '../controllers/authController.ts';

const router = Router();

router.post('/login', login);

export default router;
