import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { query, getClient } from '../config/database.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../config/logger.js';
import { setCache, deleteCache } from '../config/redis.js';

const router = express.Router();

// Register new organization and admin user
router.post('/register', [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('organizationName').trim().isLength({ min: 2 }).withMessage('Organization name must be at least 2 characters'),
  body('planId').isIn(['plan-basic', 'plan-professional', 'plan-enterprise']).withMessage('Valid plan required')
], handleValidationErrors, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const { firstName, lastName, email, password, organizationName, planId } = req.body;

    // Check if email already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create organization
    const organizationId = uuidv4();
    const organizationSlug = organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const orgResult = await client.query(`
      INSERT INTO organizations (id, name, slug, plan_id, settings, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [
      organizationId,
      organizationName,
      organizationSlug,
      planId,
      JSON.stringify({
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
      })
    ]);

    // Create subscription
    const subscriptionId = uuidv4();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14); // 14 days trial

    await client.query(`
      INSERT INTO subscriptions (id, organization_id, plan_id, status, current_period_start, current_period_end, trial_end, created_at)
      VALUES ($1, $2, $3, 'trialing', NOW(), $4, $4, NOW())
    `, [subscriptionId, organizationId, planId, trialEnd]);

    // Create admin user
    const userId = uuidv4();
    const userResult = await client.query(`
      INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'admin', true, NOW(), NOW())
      RETURNING id, email, first_name, last_name, role, organization_id, created_at
    `, [userId, organizationId, email, hashedPassword, firstName, lastName]);

    await client.query('COMMIT');

    // Generate JWT token
    const token = jwt.sign(
      { userId: userResult.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info('New organization registered:', { organizationId, email });

    res.status(201).json({
      message: 'Organization created successfully',
      user: userResult.rows[0],
      organization: orgResult.rows[0],
      subscription: {
        id: subscriptionId,
        planId,
        status: 'trialing',
        trialEnd
      },
      token
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  } finally {
    client.release();
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user with organization and subscription info
    const userResult = await query(`
      SELECT 
        u.*,
        o.id as org_id, o.name as org_name, o.slug as org_slug, o.plan_id, o.settings as org_settings, o.is_active as org_active,
        s.id as sub_id, s.status as sub_status, s.current_period_start, s.current_period_end, s.trial_end
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      LEFT JOIN subscriptions s ON o.id = s.organization_id
      WHERE u.email = $1 AND u.is_active = true
    `, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = userResult.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if organization is active (except for super admin)
    if (user.role !== 'super_admin' && !user.org_active) {
      return res.status(403).json({
        error: 'Organization is inactive',
        code: 'ORGANIZATION_INACTIVE'
      });
    }

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Cache user session
    await setCache(`user:${user.id}`, {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id
    }, 3600);

    logger.info('User logged in:', { userId: user.id, email });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        organizationId: user.organization_id,
        lastLogin: user.last_login
      },
      organization: user.role !== 'super_admin' ? {
        id: user.org_id,
        name: user.org_name,
        slug: user.org_slug,
        planId: user.plan_id,
        settings: user.org_settings,
        isActive: user.org_active
      } : null,
      subscription: user.role !== 'super_admin' ? {
        id: user.sub_id,
        planId: user.plan_id,
        status: user.sub_status,
        currentPeriodStart: user.current_period_start,
        currentPeriodEnd: user.current_period_end,
        trialEnd: user.trial_end
      } : null,
      token
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await query(`
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.organization_id, u.last_login, u.created_at,
        o.id as org_id, o.name as org_name, o.slug as org_slug, o.plan_id, o.settings as org_settings, o.is_active as org_active,
        s.id as sub_id, s.status as sub_status, s.current_period_start, s.current_period_end, s.trial_end
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      LEFT JOIN subscriptions s ON o.id = s.organization_id
      WHERE u.id = $1
    `, [req.user.id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        organizationId: user.organization_id,
        lastLogin: user.last_login,
        createdAt: user.created_at
      },
      organization: user.role !== 'super_admin' ? {
        id: user.org_id,
        name: user.org_name,
        slug: user.org_slug,
        planId: user.plan_id,
        settings: user.org_settings,
        isActive: user.org_active
      } : null,
      subscription: user.role !== 'super_admin' ? {
        id: user.sub_id,
        planId: user.plan_id,
        status: user.sub_status,
        currentPeriodStart: user.current_period_start,
        currentPeriodEnd: user.current_period_end,
        trialEnd: user.trial_end
      } : null
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user information',
      code: 'GET_USER_ERROR'
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Clear user cache
    await deleteCache(`user:${req.user.id}`);
    
    logger.info('User logged out:', { userId: req.user.id });
    
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
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // Generate new token
    const token = jwt.sign(
      { userId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
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