import express, {Request, Response} from 'express';
import { body, param, query } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { handleValidationErrors, validateOrganizationAccess } from '../middleware/validation';
import { logger } from '../config/logger';

const router = express.Router();

// Get all maintenance requests for organization
router.get('/', 
  authenticateToken,
  validateOrganizationAccess,
  [
    query('status').optional().isIn(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']),
    query('category').optional().isIn(['PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL', 'OTHER']),
    query('propertyId').optional().isUUID(),
    query('tenantId').optional().isUUID(),
    query('assignedTo').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { 
        status, 
        priority, 
        category, 
        propertyId, 
        tenantId, 
        assignedTo, 
        page = 1, 
        limit = 50 
      } = req.query;
      const organizationId = (req as any).organizationId;

      const where: any = { organizationId };
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (category) where.category = category;
      if (propertyId) where.propertyId = propertyId;
      if (tenantId) where.tenantId = tenantId;
      if (assignedTo) where.assignedTo = { contains: assignedTo as string, mode: 'insensitive' };

      const [maintenanceRequests, total] = await Promise.all([
        prisma.maintenanceRequest.findMany({
          where,
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                type: true
              }
            },
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: [
            { priority: 'desc' },
            { reportedDate: 'desc' }
          ]
        }),
        prisma.maintenanceRequest.count({ where })
      ]);

      return res.json({
        maintenanceRequests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get maintenance requests error:', error);
      return res.status(500).json({
        error: 'Failed to fetch maintenance requests',
        code: 'FETCH_MAINTENANCE_ERROR'
      });
    }
  }
);

// Get maintenance request by ID
router.get('/:id',
  authenticateToken,
  validateOrganizationAccess,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
        where: { id, organizationId },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              type: true,
              unitId: true,
              unitNumber: true,
              floor: true
            }
          },
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        }
      });

      if (!maintenanceRequest) {
        return res.status(404).json({
          error: 'Maintenance request not found',
          code: 'MAINTENANCE_NOT_FOUND'
        });
      }

      return res.json(maintenanceRequest);
    } catch (error) {
      logger.error('Get maintenance request error:', error);
      return res.status(500).json({
        error: 'Failed to fetch maintenance request',
        code: 'FETCH_MAINTENANCE_ERROR'
      });
    }
  }
);

// Create maintenance request
router.post('/',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER', 'USER']),
  validateOrganizationAccess,
  [
    body('propertyId').isUUID().withMessage('Valid property ID required'),
    body('tenantId').optional().isUUID().withMessage('Valid tenant ID required'),
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 characters)'),
    body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Description is required (max 2000 characters)'),
    body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).withMessage('Valid priority required'),
    body('category').isIn(['PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL', 'OTHER']).withMessage('Valid category required'),
    body('reportedDate').isISO8601().withMessage('Valid reported date required'),
    body('assignedTo').optional().trim().isLength({ max: 100 }),
    body('estimatedCost').optional().isInt({ min: 0 }),
    body('notes').optional().trim().isLength({ max: 1000 })
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const organizationId = (req as any).organizationId;
      const io = req.app.get('io');
      const currentUser = (req as any).user;
      
      // Verify property belongs to organization
      const property = await prisma.property.findFirst({
        where: { id: req.body.propertyId, organizationId }
      });

      if (!property) {
        return res.status(400).json({
          error: 'Property not found or does not belong to organization',
          code: 'INVALID_PROPERTY'
        });
      }

      // Verify tenant belongs to organization if provided
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

      const maintenanceData = {
        ...req.body,
        organizationId,
        reportedDate: new Date(req.body.reportedDate),
        status: 'OPEN' as const,
        photos: req.body.photos || []
      };

      const maintenanceRequest = await prisma.maintenanceRequest.create({
        data: maintenanceData,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              type: true
            }
          },
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      logger.info('Maintenance request created:', { 
        maintenanceId: maintenanceRequest.id, 
        organizationId,
        priority: maintenanceRequest.priority 
      });
      io.to(`org-${organizationId}`).emit('maintenance:created', { maintenance: maintenanceRequest, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}` });

      return res.status(201).json({
        message: 'Maintenance request created successfully',
        maintenanceRequest
      });
    } catch (error) {
      logger.error('Create maintenance request error:', error);
      return res.status(500).json({
        error: 'Failed to create maintenance request',
        code: 'CREATE_MAINTENANCE_ERROR'
      });
    }
  }
);

// Update maintenance request
router.put('/:id',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER', 'USER']),
  validateOrganizationAccess,
  [
    param('id').isUUID(),
    body('propertyId').optional().isUUID(),
    body('tenantId').optional().isUUID(),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ min: 1, max: 2000 }),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']),
    body('category').optional().isIn(['PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL', 'OTHER']),
    body('status').optional().isIn(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    body('reportedDate').optional().isISO8601(),
    body('completedDate').optional().isISO8601(),
    body('assignedTo').optional().trim().isLength({ max: 100 }),
    body('estimatedCost').optional().isInt({ min: 0 }),
    body('actualCost').optional().isInt({ min: 0 }),
    body('notes').optional().trim().isLength({ max: 1000 })
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      const io = req.app.get('io');
      const currentUser = (req as any).user;

      const existingRequest = await prisma.maintenanceRequest.findFirst({
        where: { id, organizationId }
      });

      if (!existingRequest) {
        return res.status(404).json({
          error: 'Maintenance request not found',
          code: 'MAINTENANCE_NOT_FOUND'
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

      const updateData: any = { ...req.body };
      if (req.body.reportedDate) updateData.reportedDate = new Date(req.body.reportedDate);
      if (req.body.completedDate) updateData.completedDate = new Date(req.body.completedDate);

      // Auto-set completed date when status changes to COMPLETED
      if (req.body.status === 'COMPLETED' && !existingRequest.completedDate && !req.body.completedDate) {
        updateData.completedDate = new Date();
      }

      const maintenanceRequest = await prisma.maintenanceRequest.update({
        where: { id },
        data: updateData,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              type: true
            }
          },
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      logger.info('Maintenance request updated:', { 
        maintenanceId: maintenanceRequest.id, 
        organizationId,
        status: maintenanceRequest.status 
      });
      io.to(`org-${organizationId}`).emit('maintenance:updated', { maintenance: maintenanceRequest, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}` });

      return res.json({
        message: 'Maintenance request updated successfully',
        maintenanceRequest
      });
    } catch (error) {
      logger.error('Update maintenance request error:', error);
      return res.status(500).json({
        error: 'Failed to update maintenance request',
        code: 'UPDATE_MAINTENANCE_ERROR'
      });
    }
  }
);

// Delete maintenance request
router.delete('/:id',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  validateOrganizationAccess,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      const io = req.app.get('io');
      const currentUser = (req as any).user;

      const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
        where: { id, organizationId }
      });

      if (!maintenanceRequest) {
        return res.status(404).json({
          error: 'Maintenance request not found',
          code: 'MAINTENANCE_NOT_FOUND'
        });
      }

      // Only allow deletion of OPEN or CANCELLED requests
      if (!['OPEN', 'CANCELLED'].includes(maintenanceRequest.status)) {
        return res.status(400).json({
          error: 'Cannot delete maintenance request in current status',
          code: 'INVALID_STATUS_FOR_DELETION'
        });
      }

      await prisma.maintenanceRequest.delete({
        where: { id }
      });

      logger.info('Maintenance request deleted:', { maintenanceId: id, organizationId });
      io.to(`org-${organizationId}`).emit('maintenance:deleted', { maintenanceId: id, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}` });

      return res.json({
        message: 'Maintenance request deleted successfully'
      });
    } catch (error) {
      logger.error('Delete maintenance request error:', error);
      return res.status(500).json({
        error: 'Failed to delete maintenance request',
        code: 'DELETE_MAINTENANCE_ERROR'
      });
    }
  }
);

// Get maintenance statistics
router.get('/stats/summary',
  authenticateToken,
  validateOrganizationAccess,
  async (req:Request, res:Response) => {
    try {
      const organizationId = (req as any).organizationId;

      const [
        totalRequests,
        openRequests,
        inProgressRequests,
        completedRequests,
        emergencyRequests,
        totalCost,
        avgCompletionTime
      ] = await Promise.all([
        prisma.maintenanceRequest.count({ where: { organizationId } }),
        prisma.maintenanceRequest.count({ where: { organizationId, status: 'OPEN' } }),
        prisma.maintenanceRequest.count({ where: { organizationId, status: 'IN_PROGRESS' } }),
        prisma.maintenanceRequest.count({ where: { organizationId, status: 'COMPLETED' } }),
        prisma.maintenanceRequest.count({ where: { organizationId, priority: 'EMERGENCY' } }),
        prisma.maintenanceRequest.aggregate({
          where: { organizationId, actualCost: { not: null } },
          _sum: { actualCost: true }
        }),
        prisma.maintenanceRequest.findMany({
          where: { 
            organizationId, 
            status: 'COMPLETED',
            completedDate: { not: null }
          },
          select: {
            reportedDate: true,
            completedDate: true
          }
        })
      ]);

      // Calculate average completion time in days
      let avgDays = 0;
      if (avgCompletionTime.length > 0) {
        const totalDays = avgCompletionTime.reduce((sum, request) => {
          if (request.completedDate) {
            const days = Math.ceil(
              (request.completedDate.getTime() - request.reportedDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            return sum + days;
          }
          return sum;
        }, 0);
        avgDays = Math.round(totalDays / avgCompletionTime.length);
      }

      return res.json({
        totalRequests,
        openRequests,
        inProgressRequests,
        completedRequests,
        emergencyRequests,
        totalCost: totalCost._sum.actualCost || 0,
        avgCompletionDays: avgDays
      });
    } catch (error) {
      logger.error('Get maintenance stats error:', error);
      return res.status(500).json({
        error: 'Failed to fetch maintenance statistics',
        code: 'FETCH_STATS_ERROR'
      });
    }
  }
);

// Assign technician to maintenance request
router.patch('/:id/assign',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  validateOrganizationAccess,
  [
    param('id').isUUID(),
    body('assignedTo').trim().isLength({ min: 1, max: 100 }).withMessage('Technician name is required')
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;
      const organizationId = (req as any).organizationId;

      const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
        where: { id, organizationId }
      });

      if (!maintenanceRequest) {
        return res.status(404).json({
          error: 'Maintenance request not found',
          code: 'MAINTENANCE_NOT_FOUND'
        });
      }

      const updatedRequest = await prisma.maintenanceRequest.update({
        where: { id },
        data: {
          assignedTo,
          status: maintenanceRequest.status === 'OPEN' ? 'IN_PROGRESS' : maintenanceRequest.status
        },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true
            }
          }
        }
      });

      logger.info('Technician assigned to maintenance request:', { 
        maintenanceId: id, 
        assignedTo, 
        organizationId 
      });

      return res.json({
        message: 'Technician assigned successfully',
        maintenanceRequest: updatedRequest
      });
    } catch (error) {
      logger.error('Assign technician error:', error);
      return res.status(500).json({
        error: 'Failed to assign technician',
        code: 'ASSIGN_TECHNICIAN_ERROR'
      });
    }
  }
);

// Mark maintenance request as completed
router.patch('/:id/complete',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER', 'USER']),
  validateOrganizationAccess,
  [
    param('id').isUUID(),
    body('actualCost').optional().isInt({ min: 0 }),
    body('notes').optional().trim().isLength({ max: 1000 })
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;
      const { actualCost, notes } = req.body;
      const organizationId = (req as any).organizationId;

      const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
        where: { id, organizationId }
      });

      if (!maintenanceRequest) {
        return res.status(404).json({
          error: 'Maintenance request not found',
          code: 'MAINTENANCE_NOT_FOUND'
        });
      }

      if (maintenanceRequest.status === 'COMPLETED') {
        return res.status(400).json({
          error: 'Maintenance request is already completed',
          code: 'ALREADY_COMPLETED'
        });
      }

      const updateData: any = {
        status: 'COMPLETED',
        completedDate: new Date()
      };

      if (actualCost !== undefined) updateData.actualCost = actualCost;
      if (notes) updateData.notes = notes;

      const updatedRequest = await prisma.maintenanceRequest.update({
        where: { id },
        data: updateData,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true
            }
          }
        }
      });

      logger.info('Maintenance request completed:', { 
        maintenanceId: id, 
        actualCost, 
        organizationId 
      });

      return res.json({
        message: 'Maintenance request marked as completed',
        maintenanceRequest: updatedRequest
      });
    } catch (error) {
      logger.error('Complete maintenance request error:', error);
      return res.status(500).json({
        error: 'Failed to complete maintenance request',
        code: 'COMPLETE_MAINTENANCE_ERROR'
      });
    }
  }
);

export default router;