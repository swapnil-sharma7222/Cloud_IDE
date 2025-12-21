import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { userIdMap } from '../index.ts';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, password } = req.body;

    if (userIdMap.has(name) && userIdMap.get(name) === password) {
      const jwtPayload = { name, isAuth: true };
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        res.sendStatus(500);
        return;
      }

      const token = jwt.sign(jwtPayload, secret, { expiresIn: '1h' });

      res.cookie('jwt_token', token, {
        httpOnly: false,
        secure: false,
        sameSite: 'strict',
        maxAge: 3600000
      });

      res.json({ success: true, name: name, token });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
