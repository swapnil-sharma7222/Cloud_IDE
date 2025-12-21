import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { containerPath } from '../utils/containerPath.ts';
import { getFolderStructure } from '../utils/generateFolderStructure.ts';
import { userProjectMap } from '../index.ts';

export const getFileData = (req: Request, res: Response): void => {
  try {
    let filePath = req.query.path as string;
    const userId = req.query.userId as string;
    const userProject = userProjectMap[userId];

    filePath = path.join(containerPath(userProject), filePath);
    console.log(filePath);

    if (!filePath) {
      res.status(400).json({ error: 'Missing file path' });
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read file' });
  }
};

export const getFolderStructureData = (req: Request, res: Response): void => {
  try {
    const userId = req.query.userId as string;
    let filePath = req.query.filePath as string;
    const userProject = userProjectMap[userId];

    if (filePath === '/') {
      filePath = userProject;
    } else {
      filePath = userProject + '/' + filePath;
    }

    console.log(containerPath(filePath));

    const structure = getFolderStructure(containerPath(filePath));
    res.json(structure);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read folder structure' });
  }
};

export const saveFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filepath, content } = req.body;
    const userId = req.query.userId as string;
    const userProject = userProjectMap[userId];

    if (!filepath || content === undefined) {
      res.status(400).json({ error: 'filepath and content are required' });
      return;
    }

    const fullPath = path.join(containerPath(userProject), filepath);

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, content, 'utf8');

    console.log(`✅ Saved file: ${filepath}`);
    res.json({ success: true, message: 'File saved successfully' });
  } catch (err) {
    console.error('❌ Failed to save file:', err);
    res.status(500).json({ error: 'Failed to save file' });
  }
};
