import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { prisma } from '../config/database';
import { handleValidationErrors } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../config/logger';

const router = express.Router();

// Register new organization and admin user
router.post('/register', [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('organizationName').trim().isLength({ min: 2 }).withMessage('Organization name must be at least 2 characters'),
  body('planId').isIn(['plan-basic', 'plan-professional', 'plan-enterprise']).withMessage('Valid plan required')
], handleValidationErrors, async (req:Request, res:Response) => {
  try {
    const { firstName, lastName, email, password, organizationName, planId } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx:any) => {
      // Create organization
      const organizationSlug = organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: organizationSlug,
          planId,
          settings: {
            currency: 'USD',
            timezone: 'America/Mexico_City',
            dateFormat: 'DD/MM/YYYY',
            language: 'es',
            features: {
              multipleProperties: planId !== 'plan-basic',
              advancedReports: planId === 'plan-enterprise',
              apiAccess: planId === 'plan-enterprise',
              customBranding: planId === 'plan-enterprise',
              prioritySupport: planId !== 'plan-basic'
            },
            limits: {
              maxProperties: planId === 'plan-basic' ? 10 : planId === 'plan-professional' ? 100 : 1000,
              maxTenants: planId === 'plan-basic' ? 20 : planId === 'plan-professional' ? 200 : 2000,
              maxUsers: planId === 'plan-basic' ? 2 : planId === 'plan-professional' ? 5 : 20,
              storageGB: planId === 'plan-basic' ? 5 : planId === 'plan-professional' ? 10 : 100
            }
          }
        }
      });

      // Create subscription
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14); // 14 days trial

      const subscription = await tx.subscription.create({
        data: {
          organizationId: organization.id,
          planId,
          status: 'TRIALING',
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEnd,
          trialEnd
        }
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
          role: 'ADMIN'
        }
      });

      return { user, organization, subscription };
    });

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const token = jwt.sign(
      { userId: result.user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('New organization registered:', { organizationId: result.organization.id, email });

    return res.status(201).json({
      message: 'Organization created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        organizationId: result.user.organizationId
      },
      organization: result.organization,
      subscription: result.subscription,
      token
    });

  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], handleValidationErrors, async (req:Request, res:Response) => {
  try {
    const { email, password } = req.body;

    // Get user with organization and subscription info
    const user = await prisma.user.findUnique({
      where: { email },
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
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    console.log('User found:', user);

    // Check if organization is active (except for super admin)
    if (user.role !== 'SUPER_ADMIN' && !user.organization.isActive) {
      return res.status(403).json({
        error: 'Organization is inactive',
        code: 'ORGANIZATION_INACTIVE'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
  
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    logger.info('User logged in:', { userId: user.id, email });

    const subscription = user.organization.subscriptions[0] || null;

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        lastLogin: user.lastLogin
      },
      organization: user.role !== 'SUPER_ADMIN' ? {
        ...user.organization,
      } : null,
      subscription: user.role !== 'SUPER_ADMIN' && subscription ? {
        id: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEnd: subscription.trialEnd
      } : null,
      token
    });

  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req:Request, res:Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
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

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const subscription = user.organization.subscriptions[0] || null;

   return res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      organization: user.role !== 'SUPER_ADMIN' ? {
        ...user.organization,
      } : null,
      subscription: user.role !== 'SUPER_ADMIN' && subscription ? {
        id: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEnd: subscription.trialEnd
      } : null
    });

  } catch (error) {
    logger.error('Get user error:', error);
    return res.status(500).json({
      error: 'Failed to get user information',
      code: 'GET_USER_ERROR'
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req:Request, res:Response) => {
  try {
    logger.info('User logged out:', { userId: (req as any).user.id });
    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req:Request, res:Response) => {
  try {
    // Generate new token
    const token = jwt.sign(
      { userId: (req as any).user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      code: 'TOKEN_REFRESH_ERROR'
    });
  }
});

export default router;