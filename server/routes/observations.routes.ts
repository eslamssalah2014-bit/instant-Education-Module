import { Router, Response } from 'express';
import { storage } from '../services/storage.js';
import { AuthenticatedRequest, requirePermission, requireRole } from '../middleware/auth.js';
import { ObservationType, ObservationStatus } from '../types.js';

export const observationsRouter = Router();

// List observations with filters & pagination
observationsRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      teacherId,
      trackId,
      groupId,
      observerId,
      observationType,
      startDate,
      endDate,
      search,
      status,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    const result = storage.getObservations(
      {
        teacherId: teacherId as string,
        trackId: trackId as string,
        groupId: groupId as string,
        observerId: observerId as string,
        observationType: observationType as ObservationType,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
        status: status as ObservationStatus,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      },
      req.user
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to query observations' });
  }
});

// Get active criteria template for an observation type
observationsRouter.get('/template-preview/:type', (req: AuthenticatedRequest, res: Response) => {
  try {
    const type = req.params.type.toUpperCase() as ObservationType;
    const template = storage.getActiveTemplateByType(type);
    if (!template) {
      return res.status(404).json({ error: `No active template found for observation type ${type}` });
    }
    res.json(template);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch template preview' });
  }
});

// Get single observation details
observationsRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const obs = storage.getObservationById(req.params.id, req.user);
    if (!obs) {
      return res.status(404).json({ error: 'Observation not found' });
    }
    res.json(obs);
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Access denied' });
  }
});

// Create new observation (Authorized: Education Manager, Head of Track, QA Team)
observationsRouter.post(
  '/',
  requireRole(['EDUCATION_MANAGER', 'HEAD_OF_TRACK', 'QA_TEAM']),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        instructorId,
        groupId,
        observationType,
        observationDate,
        scores,
        feedback,
      } = req.body;

      if (!instructorId || !groupId || !observationType || !scores || !feedback) {
        return res.status(400).json({
          error: 'Missing required fields: instructorId, groupId, observationType, scores, feedback',
        });
      }

      if (
        !feedback.generalComments ||
        !feedback.strengths ||
        !feedback.areasForImprovement ||
        !feedback.recommendations
      ) {
        return res.status(400).json({
          error: 'All feedback sections are mandatory: generalComments, strengths, areasForImprovement, recommendations',
        });
      }

      const newObs = storage.createObservation(
        {
          instructorId,
          groupId,
          observationType,
          observationDate,
          scores,
          feedback,
        },
        req.user!
      );

      res.status(201).json(newObs);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to submit observation' });
    }
  }
);
