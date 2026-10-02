import { Router, Response } from 'express';
import { storage } from '../services/storage.js';
import { AuthenticatedRequest, requirePermission } from '../middleware/auth.js';

export const reportsRouter = Router();

reportsRouter.get(
  '/:type',
  requirePermission('reports:access'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const type = req.params.type.toUpperCase() as any;
      const { trackId, startDate, endDate } = req.query;

      // Head of track constraint
      let effectiveTrackId = trackId as string | undefined;
      if (req.user?.roleType === 'HEAD_OF_TRACK' && req.user.trackId) {
        effectiveTrackId = req.user.trackId;
      }

      const reportData = storage.generateReport(type, {
        trackId: effectiveTrackId,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      // Audit log the report generation / export
      storage.addAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.roleType,
        action: 'REPORT_ACCESSED',
        entity: 'Report',
        entityId: type,
        details: { reportType: type, filters: { trackId: effectiveTrackId } },
      });

      res.json({
        reportType: type,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user?.name,
        data: reportData,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate report' });
    }
  }
);
