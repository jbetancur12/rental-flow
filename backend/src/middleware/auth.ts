import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

interface AuthRequest extends Request {
  user?: any;
  organizationId?: string;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: {
          include: {
            subscriptions: {
              where: { status: { in: ['ACTIVE', 'TRIALING'] } },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Invalid token - user not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if organization is active (except for super admin)
    if (user.role !== 'SUPER_ADMIN' && !user.organization.isActive) {
      return res.status(403).json({ 
        error: 'Organization is inactive',
        code: 'ORGANIZATION_INACTIVE'
      });
    }

    req.user = user;
    req.organizationId = user.organizationId;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    logger.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
}

export function requireRole(roles: string | string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
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

    return next();
  };
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  return requireRole('SUPER_ADMIN')(req, res, next);
}

export function requireOrganizationAccess(req: AuthRequest, res: Response, next: NextFunction) {
  const organizationId = req.headers['x-organization-id'] || req.params.organizationId || req.body.organizationId;
  
  // Super admin can access any organization
  if (req.user?.role === 'SUPER_ADMIN') {
    return next();
  }

  // Check if user belongs to the organization
  if (req.user?.organizationId !== organizationId) {
    return res.status(403).json({ 
      error: 'Access denied to this organization',
      code: 'ORGANIZATION_ACCESS_DENIED'
    });
  }

  next();
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true }
    });

    if (user && user.isActive) {
      req.user = user;
      req.organizationId = user.organizationId;
    }

    next();
  } catch (error) {
    // For optional auth, we don't return errors, just continue without user
    next();
  }
}