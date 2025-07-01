import express, {Request, Response} from 'express';
import { body, param, query } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { handleValidationErrors, validateOrganizationAccess } from '../middleware/validation';
import { logger } from '../config/logger';

const router = express.Router();

// Get all payments for organization
router.get('/', 
  authenticateToken,
  validateOrganizationAccess,
  [
    query('status').optional().isIn(['PENDING', 'PAID', 'OVERDUE', 'PARTIAL']),
    query('type').optional().isIn(['RENT', 'DEPOSIT', 'LATE_FEE', 'UTILITY', 'MAINTENANCE']),
    query('contractId').optional().isUUID(),
    query('tenantId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { status, type, contractId, tenantId, page = 1, limit = 50 } = req.query;
      const organizationId = (req as any).organizationId;

      const where: any = { organizationId };
      if (status) where.status = status;
      if (type) where.type = type;
      if (contractId) where.contractId = contractId;
      if (tenantId) where.tenantId = tenantId;

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            contract: {
              include: { property: true }
            },
            tenant: true
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { dueDate: 'desc' }
        }),
        prisma.payment.count({ where })
      ]);

      return res.json({
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get payments error:', error);
      return res.status(500).json({
        error: 'Failed to fetch payments',
        code: 'FETCH_PAYMENTS_ERROR'
      });
    }
  }
);

// Get payment by ID
router.get('/:id',
  authenticateToken,
  validateOrganizationAccess,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const payment = await prisma.payment.findFirst({
        where: { id, organizationId },
        include: {
          contract: {
            include: { property: true }
          },
          tenant: true
        }
      });

      if (!payment) {
        return res.status(404).json({
          error: 'Payment not found',
          code: 'PAYMENT_NOT_FOUND'
        });
      }

      return res.json(payment);
    } catch (error) {
      logger.error('Get payment error:', error);
      return res.status(500).json({
        error: 'Failed to fetch payment',
        code: 'FETCH_PAYMENT_ERROR'
      });
    }
  }
);

// Create payment
router.post('/',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  validateOrganizationAccess,
  [
    body('contractId').isString().withMessage('Valid contract ID required'),
    body('tenantId').isUUID().withMessage('Valid tenant ID required'),
    body('amount').isInt({ min: 0 }).withMessage('Amount must be a positive integer'),
    body('type').isIn(['RENT', 'DEPOSIT', 'LATE_FEE', 'UTILITY', 'MAINTENANCE']).withMessage('Valid payment type required'),
    body('dueDate').isISO8601().withMessage('Valid due date required'),
    body('paidDate').optional().isISO8601(),
    body('status').optional().isIn(['PENDING', 'PAID', 'OVERDUE', 'PARTIAL']),
    body('method').optional().isIn(['CASH', 'CHECK', 'BANK_TRANSFER', 'ONLINE']),
    body('notes').optional().trim()
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const organizationId = (req as any).organizationId;
      
      // Verify contract and tenant belong to organization
      const [contract, tenant] = await Promise.all([
        prisma.contract.findFirst({
          where: { id: req.body.contractId, organizationId }
        }),
        prisma.tenant.findFirst({
          where: { id: req.body.tenantId, organizationId }
        })
      ]);

      if (!contract) {
        return res.status(400).json({
          error: 'Contract not found or does not belong to organization',
          code: 'INVALID_CONTRACT'
        });
      }

      if (!tenant) {
        return res.status(400).json({
          error: 'Tenant not found or does not belong to organization',
          code: 'INVALID_TENANT'
        });
      }

      const paymentData = {
        ...req.body,
        organizationId,
        dueDate: new Date(req.body.dueDate),
        paidDate: req.body.paidDate ? new Date(req.body.paidDate) : undefined
      };

      const payment = await prisma.payment.create({
        data: paymentData,
        include: {
          contract: {
            include: { property: true }
          },
          tenant: true
        }
      });

      logger.info('Payment created:', { paymentId: payment.id, organizationId });

      return res.status(201).json({
        message: 'Payment created successfully',
        payment
      });
    } catch (error) {
      logger.error('Create payment error:', error);
      return res.status(500).json({
        error: 'Failed to create payment',
        code: 'CREATE_PAYMENT_ERROR'
      });
    }
  }
);

// Update payment
router.put('/:id',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  validateOrganizationAccess,
  [
    param('id').isString(),
    body('amount').optional().isInt({ min: 0 }),
    body('type').optional().isIn(['RENT', 'DEPOSIT', 'LATE_FEE', 'UTILITY', 'MAINTENANCE']),
    body('dueDate').optional().isISO8601(),
    body('paidDate').optional().isISO8601(),
    body('status').optional().isIn(['PENDING', 'PAID', 'OVERDUE', 'PARTIAL']),
    body('method').optional().isIn(['CASH', 'CHECK', 'BANK_TRANSFER', 'ONLINE']),
    body('notes').optional().trim()
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const existingPayment = await prisma.payment.findFirst({
        where: { id, organizationId }
      });

      if (!existingPayment) {
        return res.status(404).json({
          error: 'Payment not found',
          code: 'PAYMENT_NOT_FOUND'
        });
      }

      const {
        amount,
        type,
        dueDate,
        paidDate,
        status,
        method,
        notes
      } = req.body;

      const updateData: any = { };

      if (amount !== undefined) updateData.amount = amount;
      if (type !== undefined) updateData.type = type;
      if (status !== undefined) updateData.status = status;
      if (method !== undefined) updateData.method = method;
      if (notes !== undefined) updateData.notes = notes;

      // Maneja las fechas correctamente (permitiendo null)
      if (dueDate) {
        updateData.dueDate = new Date(dueDate);
      }
      if (paidDate) {
        updateData.paidDate = new Date(paidDate);
      } else if (req.body.hasOwnProperty('paidDate') && req.body.paidDate === null) {
        updateData.paidDate = null;
      }

       const payment = await prisma.payment.update({
        where: { id },
        data: updateData, // 👍 ¡CORRECTO!
        include: {
          contract: {
            include: { property: true }
          },
          tenant: true
        }
      });

     

      logger.info('Payment updated:', { paymentId: payment.id, organizationId });

      return res.json({
        message: 'Payment updated successfully',
        payment
      });
    } catch (error) {
      logger.error('Update payment error:', error);
      return res.status(500).json({
        error: 'Failed to update payment',
        code: 'UPDATE_PAYMENT_ERROR'
      });
    }
  }
);

// Delete payment
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

      const payment = await prisma.payment.findFirst({
        where: { id, organizationId }
      });

      if (!payment) {
        return res.status(404).json({
          error: 'Payment not found',
          code: 'PAYMENT_NOT_FOUND'
        });
      }
      await prisma.payment.delete({
        where: { id }
      });
      logger.info('Payment deleted:', { paymentId: id, organizationId });
      return res.json({
        message: 'Payment deleted successfully'
      });
    } catch (error) {
      logger.error('Delete payment error:', error);
      return res.status(500).json({
        error: 'Failed to delete payment',
        code: 'DELETE_PAYMENT_ERROR'
      });
    }
  }
);

// Export the router
export default router;