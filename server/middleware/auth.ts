import { Request, Response, NextFunction } from 'express';
import { RoleType, User } from '../types.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const ROLE_PERMISSIONS: Record<RoleType, string[]> = {
  EDUCATION_MANAGER: [
    '*', // Full system access
    'observations:view_all',
    'observations:view_track',
    'observations:create',
    'observations:edit',
    'templates:manage',
    'criteria:manage',
    'reports:access',
    'reports:export',
    'dashboard:view_all',
    'dashboard:view_track',
    'analytics:view_all',
    'analytics:view_track',
    'audit:view',
  ],
  HEAD_OF_TRACK: [
    'observations:create',
    'observations:view_track',
    'dashboard:view_track',
    'analytics:view_track',
    'reports:access',
    'reports:view_track',
  ],
  QA_TEAM: [
    'observations:create',
    'observations:view_all',
    'observations:view_track',
    'dashboard:view_all',
    'dashboard:view_track',
    'analytics:view_all',
    'analytics:view_track',
    'reports:access',
    'reports:export',
  ],
  INSTRUCTOR: [
    'observations:view_own',
    'feedback:view_own',
  ],
};

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    const permissions = ROLE_PERMISSIONS[user.roleType] || [];
    if (permissions.includes('*') || permissions.includes(permission)) {
      return next();
    }

    // Role-specific relaxations e.g. view_all satisfies view_track
    if (
      (permission === 'observations:view_track' && permissions.includes('observations:view_all')) ||
      (permission === 'dashboard:view_track' && permissions.includes('dashboard:view_all')) ||
      (permission === 'analytics:view_track' && permissions.includes('analytics:view_all'))
    ) {
      return next();
    }

    return res.status(403).json({
      error: `Forbidden: User role '${user.roleType}' lacks permission '${permission}'`,
    });
  };
}

export function requireRole(allowedRoles: RoleType[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    if (!allowedRoles.includes(user.roleType)) {
      return res.status(403).json({
        error: `Forbidden: Action restricted to roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}
