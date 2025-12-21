import { Router } from 'express';
import { initProject } from '../controllers/projectController.ts';

const router = Router();

router.post('/init-project', initProject);

export default router;
