import express, { Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { handleValidationErrors, validateOrganizationAccess } from '../middleware/validation';
import { logger } from '../config/logger';

export interface OrganizationSettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  language: string;
  features: {
    multipleProperties: boolean;
    advancedReports: boolean;
    apiAccess: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
  };
  limits: {
    maxProperties: number;
    maxTenants: number;
    maxUsers: number;
    storageGB: number;
  };
}

const router = express.Router();

// Get all properties for organization
router.get('/',
  authenticateToken,
  validateOrganizationAccess,
  [
    query('status').optional().isIn(['AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE']),
    query('type').optional().isIn(['APARTMENT', 'HOUSE', 'COMMERCIAL']),
    query('unitId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { status, type, unitId, page = 1, limit = 50 } = req.query;
      const organizationId = (req as any).organizationId;

      const where: any = { organizationId };

      if (status) where.status = status;
      if (type) where.type = type;
      if (unitId) where.unitId = unitId;

      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where,
          include: {
            unit: true,
            contracts: {
              where: { status: { in: ['ACTIVE', 'DRAFT'] } },
              include: { tenant: true }
            }
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.property.count({ where })
      ]);

      return res.json({
        properties,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get properties error:', error);
      return res.status(500).json({
        error: 'Failed to fetch properties',
        code: 'FETCH_PROPERTIES_ERROR'
      });
    }
  }
);

// Get property by ID
router.get('/:id',
  authenticateToken,
  validateOrganizationAccess,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const property = await prisma.property.findFirst({
        where: { id, organizationId },
        include: {
          unit: true,
          contracts: {
            include: {
              tenant: true,
              payments: true
            }
          },
          maintenance: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!property) {
        return res.status(404).json({
          error: 'Property not found',
          code: 'PROPERTY_NOT_FOUND'
        });
      }

      return res.json(property);
    } catch (error) {
      logger.error('Get property error:', error);
      return res.status(500).json({
        error: 'Failed to fetch property',
        code: 'FETCH_PROPERTY_ERROR'
      });
    }
  }
);

// Create property
router.post('/',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  validateOrganizationAccess,
  [
    body('name').trim().isLength({ min: 1 }).withMessage('Property name is required'),
    body('type').isIn(['APARTMENT', 'HOUSE', 'COMMERCIAL']).withMessage('Valid property type required'),
    body('address').trim().isLength({ min: 1 }).withMessage('Address is required'),
    body('size').isInt({ min: 1 }).withMessage('Size must be a positive integer'),
    body('rooms').isInt({ min: 0 }).withMessage('Rooms must be a non-negative integer'),
    body('bathrooms').isFloat({ min: 0 }).withMessage('Bathrooms must be a non-negative number'),
    body('rent').isInt({ min: 0 }).withMessage('Rent must be a non-negative integer'),
    body('unitId').optional().isUUID().withMessage('Valid unit ID required'),
    body('unitNumber').optional().trim(),
    body('floor').optional().isInt({ min: 1 }),
    body('amenities').optional().isArray(),
    body('photos').optional().isArray()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const organizationId = (req as any).organizationId;
      const io = req.app.get('io');
      const currentUser = (req as any).user;

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      const settings = organization.settings as unknown as OrganizationSettings;
      const limit = settings?.limits?.maxProperties;

      const currentCount = await prisma.property.count({
        where: { organizationId }
      });

      if (limit !== undefined && currentCount >= limit) {
        return res.status(403).json({ // 403 Forbidden o 402 Payment Required
          error: 'Plan limit reached. Upgrade your plan to add more properties.',
          code: 'PLAN_LIMIT_REACHED'
        });
      }

      const propertyData = {
        ...req.body,
        organizationId,
        amenities: req.body.amenities || [],
        photos: req.body.photos || []
      };

      // Verify unit belongs to organization if provided
      if (propertyData.unitId) {
        const unit = await prisma.unit.findFirst({
          where: { id: propertyData.unitId, organizationId }
        });

        if (!unit) {
          return res.status(400).json({
            error: 'Unit not found or does not belong to organization',
            code: 'INVALID_UNIT'
          });
        }
      }

      const property = await prisma.property.create({
        data: propertyData,
        include: {
          unit: true
        }
      });

      logger.info('Property created:', { propertyId: property.id, organizationId });
      // Emitir evento socket.io
      io.to(`org-${organizationId}`).emit('property:created', { property, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}` });

      return res.status(201).json({
        message: 'Property created successfully',
        property
      });
    } catch (error) {
      logger.error('Create property error:', error);
      return res.status(500).json({
        error: 'Failed to create property',
        code: 'CREATE_PROPERTY_ERROR'
      });
    }
  }
);

// Update property
router.put('/:id', // Usar PATCH para actualizaciones parciales
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  validateOrganizationAccess,
  [
    param('id').isUUID(),
    // ... tus otras validaciones ...
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params; // ID de la propiedad a actualizar
      const organizationId = (req as any).organizationId;
      const io = req.app.get('io');
      const currentUser = (req as any).user;

      // --- Lógica segura para la actualización (Evitar Mass Assignment) ---
      const { actionContext = 'OTHER', name, type, address, size, rooms, bathrooms, rent, status, unitId, unitNumber, floor, amenities, photos } = req.body;

      const dataToUpdate: any = {};
      if (name) dataToUpdate.name = name;
      if (type) dataToUpdate.type = type;
      if (address) dataToUpdate.address = address;
      if (size) dataToUpdate.size = size;
      if (rooms) dataToUpdate.rooms = rooms;
      if (bathrooms) dataToUpdate.bathrooms = bathrooms;
      if (rent) dataToUpdate.rent = rent;
      if (status) dataToUpdate.status = status;
      if (unitNumber) dataToUpdate.unitNumber = unitNumber;
      if (floor) dataToUpdate.floor = floor;
      if (amenities) dataToUpdate.amenities = amenities;
      if (photos) dataToUpdate.photos = photos;

      if (unitId) {
        dataToUpdate.unit = { connect: { id: unitId } };
      }

      // --- FIN de la lógica segura ---

      const updatedProperty = await prisma.property.update({
        where: { id },
        data: dataToUpdate,
        include: {
          unit: {
            select: {
              name: true
            }
          }
        }
      });

      let description = '';
      switch (actionContext) {
        case 'RENT':
          description = `La propiedad "${updatedProperty.unit?.name} - ${updatedProperty.name}" fue rentada.`;
          break;
        case 'RESERVE':
          description = `La propiedad "${updatedProperty.unit?.name} - ${updatedProperty.name}" fue reservada.`;
          break;
        case 'MAKE_AVAILABLE':
          description = `La propiedad "${updatedProperty.unit?.name} - ${updatedProperty.name}" ahora está disponible.`;
          break;
        default:
          description = `El usuario ${currentUser.firstName} actualizó la propiedad "${updatedProperty.unit?.name} - ${updatedProperty.name}".`;

      }
      await prisma.activityLog.create({
        data: {
          organizationId: currentUser.organizationId,
          userId: currentUser.id,
          entityType: 'PROPERTY',
          entityId: updatedProperty.id, // <-- Usa el ID de la propiedad ya actualizada
          action: 'UPDATE',
          description,
          isSystemAction: false,
        }
      });


      logger.info('Property updated:', { propertyId: updatedProperty.id, organizationId });
      // Emitir evento socket.io
      io.to(`org-${organizationId}`).emit('property:updated', { property: updatedProperty, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}` });

      return res.json({
        message: 'Property updated successfully',
        property: updatedProperty
      });
    } catch (error) {
      logger.error('Update property error:', error);
      return res.status(500).json({
        error: 'Failed to update property',
        code: 'UPDATE_PROPERTY_ERROR'
      });
    }
  }
);

// Delete property
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
      const io = req.app.get('io');
      const currentUser = (req as any).user;

      // Check if property exists and belongs to organization
      const property = await prisma.property.findFirst({
        where: { id, organizationId },
        include: {
          contracts: { where: { status: 'ACTIVE' } }
        }
      });

      if (!property) {
        return res.status(404).json({
          error: 'Property not found',
          code: 'PROPERTY_NOT_FOUND'
        });
      }

      // Check if property has active contracts
      if (property.contracts.length > 0) {
        return res.status(400).json({
          error: 'Cannot delete property with active contracts',
          code: 'PROPERTY_HAS_ACTIVE_CONTRACTS'
        });
      }

      await prisma.property.delete({
        where: { id }
      });

      logger.info('Property deleted:', { propertyId: id, organizationId });
      // Emitir evento socket.io
      io.to(`org-${organizationId}`).emit('property:deleted', { propertyId: id, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}` });

      return res.json({
        message: 'Property deleted successfully'
      });
    } catch (error) {
      logger.error('Delete property error:', error);
      return res.status(500).json({
        error: 'Failed to delete property',
        code: 'DELETE_PROPERTY_ERROR'
      });
    }
  }
);

export default router;