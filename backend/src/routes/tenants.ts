import express, {Request, Response} from 'express';
import { body, param, query } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { handleValidationErrors, validateOrganizationAccess } from '../middleware/validation';
import { logger } from '../config/logger';

const router = express.Router();

// Get all tenants for organization
router.get('/', 
  authenticateToken,
  validateOrganizationAccess,
  [
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'FORMER']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { status, page = 1, limit = 50 } = req.query;
      const organizationId = (req as any).organizationId;

      const where: any = { organizationId };
      if (status) where.status = status;

      const [tenants, total] = await Promise.all([
        prisma.tenant.findMany({
          where,
          include: {
            contracts: {
              where: { status: 'ACTIVE' },
              include: { 
                property: true,
                payments: {
                  where: { status: 'PENDING' },
                  orderBy: { dueDate: 'asc' }
                }
              }
            }
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.tenant.count({ where })
      ]);

      return res.json({
        tenants,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get tenants error:', error);
      return res.status(500).json({
        error: 'Failed to fetch tenants',
        code: 'FETCH_TENANTS_ERROR'
      });
    }
  }
);

// Get tenant by ID
router.get('/:id',
  authenticateToken,
  validateOrganizationAccess,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const tenant = await prisma.tenant.findFirst({
        where: { id, organizationId },
        include: {
          contracts: {
            include: { 
              property: true,
              payments: true
            }
          }
        }
      });

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found',
          code: 'TENANT_NOT_FOUND'
        });
      }

      return res.json(tenant);
    } catch (error) {
      logger.error('Get tenant error:', error);
      return res.status(500).json({
        error: 'Failed to fetch tenant',
        code: 'FETCH_TENANT_ERROR'
      });
    }
  }
);

// Create tenant
router.post('/',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  validateOrganizationAccess,
  [
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('phone').trim().isLength({ min: 1 }).withMessage('Phone is required'),
    body('emergencyContact').isObject().withMessage('Emergency contact is required'),
    body('employment').isObject().withMessage('Employment information is required'),
    body('applicationDate').isISO8601().withMessage('Valid application date required'),
    body('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'FORMER']),
    body('creditScore').optional().isInt({ min: 300, max: 850 }),
    body('references').optional().isArray()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const organizationId = (req as any).organizationId;
      const tenantData = {
        ...req.body,
        organizationId,
        applicationDate: new Date(req.body.applicationDate),
        references: req.body.references || []
      };

      const tenant = await prisma.tenant.create({
        data: tenantData
      });

      logger.info('Tenant created:', { tenantId: tenant.id, organizationId });

      return res.status(201).json({
        message: 'Tenant created successfully',
        tenant
      });
    } catch (error) {
      logger.error('Create tenant error:', error);
      return res.status(500).json({
        error: 'Failed to create tenant',
        code: 'CREATE_TENANT_ERROR'
      });
    }
  }
);

// Update tenant
router.put('/:id',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  validateOrganizationAccess,
  [
    param('id').isUUID(),
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().isLength({ min: 1 }),
    body('emergencyContact').optional().isObject(),
    body('employment').optional().isObject(),
    body('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'FORMER']),
    body('creditScore').optional().isInt({ min: 300, max: 850 }),
    body('references').optional().isArray()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const existingTenant = await prisma.tenant.findFirst({
        where: { id, organizationId }
      });

      if (!existingTenant) {
        return res.status(404).json({
          error: 'Tenant not found',
          code: 'TENANT_NOT_FOUND'
        });
      }

      const tenant = await prisma.tenant.update({
        where: { id },
        data: req.body
      });

      logger.info('Tenant updated:', { tenantId: tenant.id, organizationId });

      return res.json({
        message: 'Tenant updated successfully',
        tenant
      });
    } catch (error) {
      logger.error('Update tenant error:', error);
      return res.status(500).json({
        error: 'Failed to update tenant',
        code: 'UPDATE_TENANT_ERROR'
      });
    }
  }
);

// Delete tenant
router.delete('/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  validateOrganizationAccess,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const tenant = await prisma.tenant.findFirst({
        where: { id, organizationId },
        include: {
          contracts: { where: { status: 'ACTIVE' } }
        }
      });

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found',
          code: 'TENANT_NOT_FOUND'
        });
      }

      if (tenant.contracts.length > 0) {
        return res.status(400).json({
          error: 'Cannot delete tenant with active contracts',
          code: 'TENANT_HAS_ACTIVE_CONTRACTS'
        });
      }

      await prisma.tenant.delete({
        where: { id }
      });

      logger.info('Tenant deleted:', { tenantId: id, organizationId });

      return res.json({
        message: 'Tenant deleted successfully'
      });
    } catch (error) {
      logger.error('Delete tenant error:', error);
      return res.status(500).json({
        error: 'Failed to delete tenant',
        code: 'DELETE_TENANT_ERROR'
      });
    }
  }
);

export default router;