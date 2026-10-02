import { Router, Response } from 'express';
import { storage } from '../services/storage.js';
import { AuthenticatedRequest, requirePermission } from '../middleware/auth.js';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/analytics',
  requirePermission('dashboard:view_track'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const trackFilter = req.query.trackId as string | undefined;
      const analytics = storage.getDashboardAnalytics(req.user, trackFilter);
      res.json(analytics);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch dashboard analytics' });
    }
  }
);
