import { Router, Response } from 'express';
import { storage } from '../services/storage.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const authRouter = Router();

// Get list of active users/personas for switching
authRouter.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const users = storage.getUsers();
  res.json(users);
});

// Get current logged-in user profile
authRouter.get('/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(req.user);
});
