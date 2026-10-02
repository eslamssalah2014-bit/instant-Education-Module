import { Router, Response } from 'express';
import { storage } from '../services/storage.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const notificationsRouter = Router();

notificationsRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const notifs = storage.getNotifications(req.user.id);
  res.json(notifs);
});

notificationsRouter.patch('/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const success = storage.markNotificationAsRead(req.params.id);
  res.json({ success });
});

notificationsRouter.post('/read-all', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  storage.markAllNotificationsAsRead(req.user.id);
  res.json({ success: true });
});
