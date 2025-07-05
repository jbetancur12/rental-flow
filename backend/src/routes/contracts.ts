import express, { Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { handleValidationErrors, validateOrganizationAccess } from '../middleware/validation';
import { logger } from '../config/logger';

const router = express.Router();

// Get all contracts for organization
router.get('/',
  authenticateToken,
  validateOrganizationAccess,
  [
    query('status').optional().isIn(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED']),
    query('propertyId').optional().isUUID(),
    query('tenantId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { status, propertyId, tenantId, page = 1, limit = 50 } = req.query;
      const organizationId = (req as any).organizationId;

      const where: any = { organizationId };
      if (status) where.status = status;
      if (propertyId) where.propertyId = propertyId;
      if (tenantId) where.tenantId = tenantId;

      const [contracts, total] = await Promise.all([
        prisma.contract.findMany({
          where,
          include: {
            property: true,
            tenant: true,
            payments: {
              orderBy: { dueDate: 'asc' }
            }
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.contract.count({ where })
      ]);

      return res.json({
        contracts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get contracts error:', error);
      return res.status(500).json({
        error: 'Failed to fetch contracts',
        code: 'FETCH_CONTRACTS_ERROR'
      });
    }
  }
);

// Get contract by ID
router.get('/:id',
  authenticateToken,
  validateOrganizationAccess,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const contract = await prisma.contract.findFirst({
        where: { id, organizationId },
        include: {
          property: true,
          tenant: true,
          payments: {
            orderBy: { dueDate: 'asc' }
          }
        }
      });

      if (!contract) {
        return res.status(404).json({
          error: 'Contract not found',
          code: 'CONTRACT_NOT_FOUND'
        });
      }

      return res.json(contract);
    } catch (error) {
      logger.error('Get contract error:', error);
      return res.status(500).json({
        error: 'Failed to fetch contract',
        code: 'FETCH_CONTRACT_ERROR'
      });
    }
  }
);

// Create contract
router.post('/',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  validateOrganizationAccess,
  [
    body('propertyId').isUUID().withMessage('Valid property ID required'),
    body('tenantId').isUUID().withMessage('Valid tenant ID required'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').isISO8601().withMessage('Valid end date required'),
    body('monthlyRent').isInt({ min: 0 }).withMessage('Monthly rent must be a positive integer'),
    body('securityDeposit').isInt({ min: 0 }).withMessage('Security deposit must be a positive integer'),
    body('terms').optional().isArray(),
    body('status').optional().isIn(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED']),
    body('signedDate').optional().isISO8601()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const organizationId = (req as any).organizationId;
      const currentUser = (req as any).user;
      // Verify property and tenant belong to organization
      const [property, tenant] = await Promise.all([
        prisma.property.findFirst({
          where: { id: req.body.propertyId, organizationId },
          include: {
            unit: {
              select: {
                name: true
              }
            }
          }
        }),
        prisma.tenant.findFirst({
          where: { id: req.body.tenantId, organizationId }
        })
      ]);

      if (!property) {
        return res.status(400).json({
          error: 'Property not found or does not belong to organization',
          code: 'INVALID_PROPERTY'
        });
      }

      if (!tenant) {
        return res.status(400).json({
          error: 'Tenant not found or does not belong to organization',
          code: 'INVALID_TENANT'
        });
      }

      const contractData = {
        ...req.body,
        organizationId,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        signedDate: req.body.signedDate ? new Date(req.body.signedDate) : undefined,
        terms: req.body.terms || []
      };

      const contract = await prisma.contract.create({
        data: contractData,
        include: {
          property: true,
          tenant: true
        }
      });

      // Update property status if contract is active
      if (contract.status === 'ACTIVE') {
        await prisma.property.update({
          where: { id: contract.propertyId },
          data: { status: 'RENTED' }
        });
      }

      await prisma.activityLog.create({
        data: {
          organizationId: currentUser.organizationId,
          userId: currentUser.id,
          entityType: 'CONTRACT',
          entityId: contract.id, // <-- Usa el ID de la propiedad ya actualizada
          action: 'CREATE',
          description: `Se creo el contrato "${contract.id}" para la propiedad "${property.unit?.name} - ${property.name}"`,
          isSystemAction: false,
        }
      });

      logger.info('Contract created:', { contractId: contract.id, organizationId });

      return res.status(201).json({
        message: 'Contract created successfully',
        contract
      });
    } catch (error) {
      logger.error('Create contract error:', error);
      return res.status(500).json({
        error: 'Failed to create contract',
        code: 'CREATE_CONTRACT_ERROR'
      });
    }
  }
);

// Update contract
router.put('/:id',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  validateOrganizationAccess,
  [
    param('id').isString(),
    body('propertyId').optional().isUUID(),
    body('tenantId').optional().isUUID(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('monthlyRent').optional().isInt({ min: 0 }),
    body('securityDeposit').optional().isInt({ min: 0 }),
    body('terms').optional().isArray(),
    body('status').optional().isIn(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED']),
    body('signedDate').optional().isISO8601(),
    body('terminationDate').optional({ checkFalsy: true }).isISO8601()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      const currentUser = (req as any).user;


      const {
        propertyId,
        tenantId,
        startDate,
        endDate,
        monthlyRent,
        securityDeposit,
        terms,
        status,
        signedDate,
        terminationDate,
        actionContext
      } = req.body;

      const existingContract = await prisma.contract.findFirst({
        where: { id, organizationId }
      });

      if (!existingContract) {
        return res.status(404).json({
          error: 'Contract not found',
          code: 'CONTRACT_NOT_FOUND'
        });
      }

      // Verify property and tenant if provided
      if (req.body.propertyId) {
        const property = await prisma.property.findFirst({
          where: { id: req.body.propertyId, organizationId }
        });
        if (!property) {
          return res.status(400).json({
            error: 'Property not found or does not belong to organization',
            code: 'INVALID_PROPERTY'
          });
        }
      }

      if (req.body.tenantId) {
        const tenant = await prisma.tenant.findFirst({
          where: { id: req.body.tenantId, organizationId }
        });
        if (!tenant) {
          return res.status(400).json({
            error: 'Tenant not found or does not belong to organization',
            code: 'INVALID_TENANT'
          });
        }
      }

      const updateData: any = {};

      // Asigna solo los campos que existen en la solicitud
      if (monthlyRent !== undefined) updateData.monthlyRent = monthlyRent;
      if (securityDeposit !== undefined) updateData.securityDeposit = securityDeposit;
      if (terms !== undefined) updateData.terms = terms;
      if (status !== undefined) updateData.status = status;

      // Convierte las fechas a objetos Date
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (signedDate) updateData.signedDate = new Date(signedDate);
      if (terminationDate) { // Puede ser null, pero si existe, es una fecha
        updateData.terminationDate = new Date(terminationDate);
      } else if (Object.prototype.hasOwnProperty.call(req.body, 'terminationDate') && req.body.terminationDate === null) {
        updateData.terminationDate = null; // Permite establecer la fecha en null
      }

      // 3. Usa "connect" para actualizar las relaciones
      if (propertyId) {
        updateData.property = { connect: { id: propertyId } };
      }
      if (tenantId) {
        updateData.tenant = { connect: { id: tenantId } };
      }



      // 4. Llama a Prisma con el objeto `data` limpio y correcto
      const contract = await prisma.contract.update({
        where: { id },
        data: { ...updateData }, // 👍
        include: {
          property: {
            include: {
              unit: {
                select: {
                  name: true
                }
              }
            }
          },
          tenant: true
        }
      });

      // Update property status based on contract status
      // if (req.body.status) {
      //   let propertyStatus = 'AVAILABLE';
      //   if (req.body.status === 'DRAFT') propertyStatus = 'RENTED';

      //   await prisma.property.update({
      //     where: { id: contract.propertyId },
      //     data: { status: propertyStatus as any }
      //   });
      // }

         let description = '';
      switch (actionContext) {
        case 'ACTIVED':
          description = `Se activo el contrato "${contract.id}" para la propiedad "${contract.property.unit?.name} - ${contract.property.name}".`;
          break;
        case 'EXPIRED':
          description = `Expiro el contrato "${contract.id}" para la propiedad "${contract.property.unit?.name} - ${contract.property.name}".`;
          break;
        case 'TERMINATED':
          description = `Se cancelo el contrato "${contract.id}" para la propiedad "${contract.property.unit?.name} - ${contract.property.name}".`;
          break;
        default:
          description = `Se actualizo el contrato "${contract.id}" para la propiedad "${contract.property.unit?.name} - ${contract.property.name}".`;

      }

      await prisma.activityLog.create({
        data: {
          organizationId: currentUser.organizationId,
          userId: currentUser.id,
          entityType: 'CONTRACT',
          entityId: contract.id, // <-- Usa el ID de la propiedad ya actualizada
          action: 'UPDATE',
          description,
          isSystemAction: false,
        }
      });

      logger.info('Contract updated:', { contractId: contract.id, organizationId });

      return res.json({
        message: 'Contract updated successfully',
        contract
      });
    } catch (error) {
      logger.error('Update contract error:', error);
      return res.status(500).json({
        error: 'Failed to update contract',
        code: 'UPDATE_CONTRACT_ERROR'
      });
    }
  }
);

// Delete contract
router.delete('/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  validateOrganizationAccess,
  [param('id').isString()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const contract = await prisma.contract.findFirst({
        where: { id, organizationId },
        include: {
          payments: true
        }
      });

      if (!contract) {
        return res.status(404).json({
          error: 'Contract not found',
          code: 'CONTRACT_NOT_FOUND'
        });
      }

      if (contract.payments.length > 0) {
        return res.status(400).json({
          error: 'Cannot delete contract with existing payments',
          code: 'CONTRACT_HAS_PAYMENTS'
        });
      }

      await prisma.contract.delete({
        where: { id }
      });

      // Update property status to available
      await prisma.property.update({
        where: { id: contract.propertyId },
        data: { status: 'AVAILABLE' }
      });

      logger.info('Contract deleted:', { contractId: id, organizationId });

      return res.json({
        message: 'Contract deleted successfully'
      });
    } catch (error) {
      logger.error('Delete contract error:', error);
      return res.status(500).json({
        error: 'Failed to delete contract',
        code: 'DELETE_CONTRACT_ERROR'
      });
    }
  }
);

export default router;