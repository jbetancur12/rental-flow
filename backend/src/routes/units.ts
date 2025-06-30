import express, {Request, Response} from 'express';
import { body, param, query } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { handleValidationErrors, validateOrganizationAccess } from '../middleware/validation';
import { logger } from '../config/logger';

const router = express.Router();

// Get all units for organization
router.get('/', 
  authenticateToken,
  validateOrganizationAccess,
  [
    query('type').optional().isIn(['BUILDING', 'HOUSE', 'COMMERCIAL']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { type, page = 1, limit = 50 } = req.query;
      const organizationId = (req as any).organizationId;

      const where: any = { organizationId };
      if (type) where.type = type;

      const [units, total] = await Promise.all([
        prisma.unit.findMany({
          where,
          include: {
            properties: {
              include: {
                contracts: {
                  where: { status: 'ACTIVE' },
                  include: { tenant: true }
                }
              }
            }
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.unit.count({ where })
      ]);

      return res.json({
        units,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get units error:', error);
      return res.status(500).json({
        error: 'Failed to fetch units',
        code: 'FETCH_UNITS_ERROR'
      });
    }
  }
);

// Get unit by ID
router.get('/:id',
  authenticateToken,
  validateOrganizationAccess,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const unit = await prisma.unit.findFirst({
        where: { id, organizationId },
        include: {
          properties: {
            include: {
              contracts: {
                where: { status: 'ACTIVE' },
                include: { tenant: true }
              }
            }
          }
        }
      });

      if (!unit) {
        return res.status(404).json({
          error: 'Unit not found',
          code: 'UNIT_NOT_FOUND'
        });
      }

      return res.json(unit);
    } catch (error) {
      logger.error('Get unit error:', error);
      return res.status(500).json({
        error: 'Failed to fetch unit',
        code: 'FETCH_UNIT_ERROR'
      });
    }
  }
);

// Create unit
router.post('/',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  validateOrganizationAccess,
  [
    body('name').trim().isLength({ min: 1 }).withMessage('Unit name is required'),
    body('type').isIn(['BUILDING', 'HOUSE', 'COMMERCIAL']).withMessage('Valid unit type required'),
    body('address').trim().isLength({ min: 1 }).withMessage('Address is required'),
    body('description').optional().trim(),
    body('totalFloors').optional().isInt({ min: 1 }),
    body('floors').optional().isInt({ min: 1 }),
    body('size').optional().isInt({ min: 1 }),
    body('amenities').optional().isArray(),
    body('photos').optional().isArray(),
    body('manager').optional().trim()
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const organizationId = (req as any).organizationId;
      const unitData = {
        ...req.body,
        organizationId,
        amenities: req.body.amenities || [],
        photos: req.body.photos || []
      };

      const unit = await prisma.unit.create({
        data: unitData
      });

      logger.info('Unit created:', { unitId: unit.id, organizationId });

      return res.status(201).json({
        message: 'Unit created successfully',
        unit
      });
    } catch (error) {
      logger.error('Create unit error:', error);
      return res.status(500).json({
        error: 'Failed to create unit',
        code: 'CREATE_UNIT_ERROR'
      });
    }
  }
);

// Update unit
router.put('/:id',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  validateOrganizationAccess,
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1 }),
    body('type').optional().isIn(['BUILDING', 'HOUSE', 'COMMERCIAL']),
    body('address').optional().trim().isLength({ min: 1 }),
    body('description').optional().trim(),
    body('totalFloors').optional().isInt({ min: 1 }),
    body('floors').optional().isInt({ min: 1 }),
    body('size').optional().isInt({ min: 1 }),
    body('amenities').optional().isArray(),
    body('photos').optional().isArray(),
    body('manager').optional().trim()
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      // Check if unit exists and belongs to organization
      const existingUnit = await prisma.unit.findFirst({
        where: { id, organizationId }
      });

      if (!existingUnit) {
        return res.status(404).json({
          error: 'Unit not found',
          code: 'UNIT_NOT_FOUND'
        });
      }

      const unit = await prisma.unit.update({
        where: { id },
        data: req.body
      });

      logger.info('Unit updated:', { unitId: unit.id, organizationId });

      return res.json({
        message: 'Unit updated successfully',
        unit
      });
    } catch (error) {
      logger.error('Update unit error:', error);
      return res.status(500).json({
        error: 'Failed to update unit',
        code: 'UPDATE_UNIT_ERROR'
      });
    }
  }
);

// Delete unit
router.delete('/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  validateOrganizationAccess,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      // Check if unit exists and belongs to organization
      const unit = await prisma.unit.findFirst({
        where: { id, organizationId },
        include: {
          properties: {
            include: {
              contracts: { where: { status: 'ACTIVE' } }
            }
          }
        }
      });

      if (!unit) {
        return res.status(404).json({
          error: 'Unit not found',
          code: 'UNIT_NOT_FOUND'
        });
      }

      // Check if unit has properties with active contracts
      const hasActiveContracts = unit.properties.some(property => 
        property.contracts.length > 0
      );

      if (hasActiveContracts) {
        return res.status(400).json({
          error: 'Cannot delete unit with properties that have active contracts',
          code: 'UNIT_HAS_ACTIVE_CONTRACTS'
        });
      }

      // Delete unit and all its properties
      await prisma.$transaction(async (tx) => {
        // Delete all properties in the unit
        await tx.property.deleteMany({
          where: { unitId: id }
        });

        // Delete the unit
        await tx.unit.delete({
          where: { id }
        });
      });

      logger.info('Unit deleted:', { unitId: id, organizationId });

      return res.json({
        message: 'Unit and all its properties deleted successfully'
      });
    } catch (error) {
      logger.error('Delete unit error:', error);
      return res.status(500).json({
        error: 'Failed to delete unit',
        code: 'DELETE_UNIT_ERROR'
      });
    }
  }
);

export default router;