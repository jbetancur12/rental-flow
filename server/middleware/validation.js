import { validationResult } from 'express-validator';

export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
}

export function validateOrganizationAccess(req, res, next) {
  const organizationId = req.headers['x-organization-id'] || req.params.organizationId;
  
  if (!organizationId) {
    return res.status(400).json({
      error: 'Organization ID required',
      code: 'ORGANIZATION_ID_REQUIRED'
    });
  }

  // Super admin can access any organization
  if (req.user.role === 'super_admin') {
    req.organizationId = organizationId;
    return next();
  }

  // Regular users can only access their own organization
  if (req.user.organization_id !== organizationId) {
    return res.status(403).json({
      error: 'Access denied to this organization',
      code: 'ORGANIZATION_ACCESS_DENIED'
    });
  }

  req.organizationId = organizationId;
  next();
}