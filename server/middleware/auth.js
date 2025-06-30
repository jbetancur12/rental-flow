import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { logger } from '../config/logger.js';

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const userResult = await query(
      'SELECT u.*, o.id as organization_id, o.name as organization_name, o.is_active as org_active FROM users u LEFT JOIN organizations o ON u.organization_id = o.id WHERE u.id = $1 AND u.is_active = true',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid token - user not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    // Check if organization is active (except for super admin)
    if (user.role !== 'super_admin' && !user.org_active) {
      return res.status(403).json({ 
        error: 'Organization is inactive',
        code: 'ORGANIZATION_INACTIVE'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    logger.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: userRoles,
        current: req.user.role
      });
    }

    next();
  };
}

export function requireSuperAdmin(req, res, next) {
  return requireRole('super_admin')(req, res, next);
}

export function requireOrganizationAccess(req, res, next) {
  const organizationId = req.headers['x-organization-id'] || req.params.organizationId || req.body.organizationId;
  
  // Super admin can access any organization
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Check if user belongs to the organization
  if (req.user.organization_id !== organizationId) {
    return res.status(403).json({ 
      error: 'Access denied to this organization',
      code: 'ORGANIZATION_ACCESS_DENIED'
    });
  }

  next();
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await query(
      'SELECT u.*, o.id as organization_id, o.name as organization_name FROM users u LEFT JOIN organizations o ON u.organization_id = o.id WHERE u.id = $1 AND u.is_active = true',
      [decoded.userId]
    );

    if (userResult.rows.length > 0) {
      req.user = userResult.rows[0];
    }

    next();
  } catch (error) {
    // For optional auth, we don't return errors, just continue without user
    next();
  }
}