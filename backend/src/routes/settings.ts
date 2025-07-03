import express, {Request, Response} from 'express';
import { body } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { handleValidationErrors, validateOrganizationAccess } from '../middleware/validation';
import { logger } from '../config/logger';

const router = express.Router();

// Get organization settings
router.get('/organization',
  authenticateToken,
  validateOrganizationAccess,
  async (req:Request, res:Response) => {
    try {
      const organizationId = (req as any).organizationId;

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          logo: true,
          address: true,
          phone: true,
          email: true,
          planId: true,
          isActive: true,
          settings: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!organization) {
        return res.status(404).json({
          error: 'Organization not found',
          code: 'ORGANIZATION_NOT_FOUND'
        });
      }

      return res.json(organization);
    } catch (error) {
      logger.error('Get organization settings error:', error);
      return res.status(500).json({
        error: 'Failed to fetch organization settings',
        code: 'FETCH_SETTINGS_ERROR'
      });
    }
  }
);

// Update organization settings
router.put('/organization',
  authenticateToken,
  requireRole(['ADMIN']),
  validateOrganizationAccess,
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().isLength({ max: 20 }),
    body('address').optional().trim().isLength({ max: 500 }),
    body('settings').optional().isObject(),
    body('settings.currency').optional().isIn(['USD', 'EUR', 'MXN', 'CAD', 'GBP']),
    body('settings.timezone').optional().isString(),
    body('settings.dateFormat').optional().isIn(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
    body('settings.language').optional().isIn(['en', 'es', 'fr', 'de'])
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const organizationId = (req as any).organizationId;
      const updateData = { ...req.body };

      // If settings are provided, merge with existing settings
      if (updateData.settings) {
        const currentOrg = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { settings: true }
        });

        if (currentOrg) {
          updateData.settings = {
            ...currentOrg.settings,
            ...updateData.settings
          };
        }
      }

      const organization = await prisma.organization.update({
        where: { id: organizationId },
        data: updateData,
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          logo: true,
          address: true,
          phone: true,
          email: true,
          planId: true,
          isActive: true,
          settings: true,
          updatedAt: true
        }
      });

      logger.info('Organization settings updated:', { organizationId });

      return res.json({
        message: 'Organization settings updated successfully',
        organization
      });
    } catch (error) {
      logger.error('Update organization settings error:', error);
      return res.status(500).json({
        error: 'Failed to update organization settings',
        code: 'UPDATE_SETTINGS_ERROR'
      });
    }
  }
);

// Get user preferences
router.get('/preferences',
  authenticateToken,
  async (req:Request, res:Response) => {
    try {
      const userId = (req as any).user.id;

      // For now, we'll return default preferences
      // In the future, you could add a user_preferences table
      const preferences = {
        notifications: {
          email: true,
          sms: false,
          push: true,
          paymentReminders: true,
          maintenanceAlerts: true,
          contractExpirations: true,
          overduePayments: true,
          newApplications: true
        },
        display: {
          theme: 'light',
          language: 'es',
          timezone: 'America/Mexico_City',
          dateFormat: 'DD/MM/YYYY'
        }
      };

      return res.json(preferences);
    } catch (error) {
      logger.error('Get user preferences error:', error);
      return res.status(500).json({
        error: 'Failed to fetch user preferences',
        code: 'FETCH_PREFERENCES_ERROR'
      });
    }
  }
);

// Update user preferences
router.put('/preferences',
  authenticateToken,
  [
    body('notifications').optional().isObject(),
    body('display').optional().isObject()
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const userId = (req as any).user.id;
      const preferences = req.body;

      // For now, we'll just return success
      // In the future, you could store these in a user_preferences table
      logger.info('User preferences updated:', { userId, preferences });

      return res.json({
        message: 'Preferences updated successfully',
        preferences
      });
    } catch (error) {
      logger.error('Update user preferences error:', error);
      return res.status(500).json({
        error: 'Failed to update preferences',
        code: 'UPDATE_PREFERENCES_ERROR'
      });
    }
  }
);

// Get subscription info
router.get('/subscription',
  authenticateToken,
  validateOrganizationAccess,
  async (req:Request, res:Response) => {
    try {
      const organizationId = (req as any).organizationId;

      const subscription = await prisma.subscription.findFirst({
        where: { organizationId },
        orderBy: { createdAt: 'desc' }
      });

      if (!subscription) {
        return res.status(404).json({
          error: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        });
      }

      return res.json(subscription);
    } catch (error) {
      logger.error('Get subscription error:', error);
      return res.status(500).json({
        error: 'Failed to fetch subscription',
        code: 'FETCH_SUBSCRIPTION_ERROR'
      });
    }
  }
);

// Export organization data
router.get('/export',
  authenticateToken,
  requireRole(['ADMIN']),
  validateOrganizationAccess,
  async (req:Request, res:Response) => {
    try {
      const organizationId = (req as any).organizationId;

      const [
        organization,
        users,
        properties,
        units,
        tenants,
        contracts,
        payments,
        maintenance
      ] = await Promise.all([
        prisma.organization.findUnique({
          where: { id: organizationId },
          include: {
            subscriptions: true
          }
        }),
        prisma.user.findMany({
          where: { organizationId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        }),
        prisma.property.findMany({
          where: { organizationId }
        }),
        prisma.unit.findMany({
          where: { organizationId }
        }),
        prisma.tenant.findMany({
          where: { organizationId }
        }),
        prisma.contract.findMany({
          where: { organizationId }
        }),
        prisma.payment.findMany({
          where: { organizationId }
        }),
        prisma.maintenanceRequest.findMany({
          where: { organizationId }
        })
      ]);

      const exportData = {
        organization,
        users,
        properties,
        units,
        tenants,
        contracts,
        payments,
        maintenance,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      logger.info('Data export requested:', { organizationId });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="rentflow-export-${new Date().toISOString().split('T')[0]}.json"`);
      
      return res.json(exportData);
    } catch (error) {
      logger.error('Export data error:', error);
      return res.status(500).json({
        error: 'Failed to export data',
        code: 'EXPORT_ERROR'
      });
    }
  }
);

