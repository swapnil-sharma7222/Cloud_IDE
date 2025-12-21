import { Router } from 'express';
import { getFileData, getFolderStructureData, saveFile } from '../controllers/fileController.ts';

const router = Router();

router.get('/file-data', getFileData);
router.get('/folder-structure', getFolderStructureData);
router.post('/save-file', saveFile);

export default router;
