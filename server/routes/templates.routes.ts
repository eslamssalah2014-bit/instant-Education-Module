import { Router, Response } from 'express';
import { storage } from '../services/storage.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';

export const templatesRouter = Router();

// List templates
templatesRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const templates = storage.getTemplates();
    res.json(templates);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list templates' });
  }
});

// Get single template
templatesRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const tmpl = storage.getTemplateById(req.params.id);
    if (!tmpl) return res.status(404).json({ error: 'Template not found' });
    res.json(tmpl);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new template (Education Manager only)
templatesRouter.post('/', requireRole(['EDUCATION_MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, code, type, description, criteria } = req.body;
    if (!name || !code || !type || !criteria || !criteria.length) {
      return res.status(400).json({ error: 'Missing required fields: name, code, type, criteria' });
    }

    const created = storage.createTemplate({
      name,
      code,
      type,
      description: description || '',
      criteria,
      userId: req.user!.id,
    });

    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create template' });
  }
});

// Update / Bump template version (Education Manager only)
templatesRouter.post(
  '/:id/version',
  requireRole(['EDUCATION_MANAGER']),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { versionNumber, changeLog, criteria } = req.body;
      if (!versionNumber || !changeLog || !criteria || !criteria.length) {
        return res.status(400).json({
          error: 'Missing required version fields: versionNumber, changeLog, criteria',
        });
      }

      const updatedVersion = storage.updateTemplateVersion({
        templateId: req.params.id,
        versionNumber,
        changeLog,
        criteria,
        userId: req.user!.id,
      });

      res.status(201).json(updatedVersion);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update template version' });
    }
  }
);

// Clone template (Education Manager only)
templatesRouter.post(
  '/:id/clone',
  requireRole(['EDUCATION_MANAGER']),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const cloned = storage.cloneTemplate(req.params.id, req.user!.id);
      res.status(201).json(cloned);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to clone template' });
    }
  }
);

// Toggle active status (Education Manager only)
templatesRouter.patch(
  '/:id/status',
  requireRole(['EDUCATION_MANAGER']),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { isActive } = req.body;
      const updated = storage.toggleTemplateStatus(req.params.id, Boolean(isActive), req.user!.id);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Archive / Unarchive template (Education Manager only)
templatesRouter.patch(
  '/:id/archive',
  requireRole(['EDUCATION_MANAGER']),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { isArchived } = req.body;
      const updated = storage.archiveTemplate(req.params.id, Boolean(isArchived), req.user!.id);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);
