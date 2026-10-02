import { Router, Response } from 'express';
import { storage } from '../services/storage.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';

export const auditRouter = Router();

auditRouter.get('/', requireRole(['EDUCATION_MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = storage.getAuditLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
