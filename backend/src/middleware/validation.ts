import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

interface AuthRequest extends Request {
  user?: any;
  organizationId?: string;
}

export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined
      }))
    });
    return;
  }

  next();
}

export function validateOrganizationAccess(req: AuthRequest, res: Response, next: NextFunction) {
  const organizationId = req.headers['x-organization-id'] || req.params.organizationId;
  
  if (!organizationId) {
    return res.status(400).json({
      error: 'Organization ID required',
      code: 'ORGANIZATION_ID_REQUIRED'
    });
  }

  // Super admin can access any organization
  if (req.user?.role === 'SUPER_ADMIN') {
    req.organizationId = organizationId as string;
    return next();
  }

  // Regular users can only access their own organization
  if (req.user?.organizationId !== organizationId) {
    return res.status(403).json({
      error: 'Access denied to this organization',
      code: 'ORGANIZATION_ACCESS_DENIED'
    });
  }

  req.organizationId = organizationId as string;
  next();
}