import { Router, Response } from 'express';
import { storage } from '../services/storage.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const instructorsRouter = Router();

// List instructors
instructorsRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = storage.getInstructors();
    // If user is Head of Track, optionally filter to track
    if (req.user?.roleType === 'HEAD_OF_TRACK' && req.user.trackId) {
      return res.json(list.filter((i) => i.trackId === req.user!.trackId));
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Instructor portal: get my own observations, metrics, and recommendations
instructorsRouter.get('/portal/me', (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const data = storage.getInstructorPortalData(req.user.id);
    res.json(data);
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Instructor profile not found' });
  }
});

// Get single instructor
instructorsRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const inst = storage.getInstructorById(req.params.id);
    if (!inst) return res.status(404).json({ error: 'Instructor not found' });
    res.json(inst);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-load groups assigned to selected instructor (for Create Observation Form!)
instructorsRouter.get('/:id/groups', (req: AuthenticatedRequest, res: Response) => {
  try {
    const groups = storage.getGroupsByInstructorId(req.params.id);
    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
