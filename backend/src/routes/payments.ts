import express, { Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { handleValidationErrors, validateOrganizationAccess } from '../middleware/validation';
import { logger } from '../config/logger';
import { PaymentType } from '@prisma/client';

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
  async (req: Request, res: Response) => {
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
  async (req: Request, res: Response) => {
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
  async (req: Request, res: Response) => {
    try {
      const organizationId = (req as any).organizationId;
      const io = req.app.get('io');
      const currentUser = (req as any).user;

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

      let periodStart;
      let periodEnd;
      const dueDateFromRequest = new Date(req.body.dueDate);

      const lastRentPayment = await prisma.payment.findFirst({
        where: { contractId: req.body.contractId, type: 'RENT' },
        orderBy: { dueDate: 'desc' },
      });

      if (req.body.type === 'RENT') {
        if (lastRentPayment) {
          // Es un pago de alquiler subsecuente. El período empieza donde terminó el anterior.
          periodStart = lastRentPayment.periodEnd;
          periodEnd = dueDateFromRequest;
        } else {
          // ¡Es el PRIMER pago de alquiler!
          // El período empieza y vence en la misma fecha del contrato.
          periodStart = dueDateFromRequest;

          // Debemos CALCULAR el fin del período (un mes después).
          const year = periodStart.getFullYear();
          const month = periodStart.getMonth() + 1;
          const day = periodStart.getDate();

          let calculatedEnd = new Date(year, month, day);
          // Corregimos el desbordamiento de mes (ej. 31 de Ene -> 28 de Feb)
          if (calculatedEnd.getMonth() !== (month % 12)) {
            calculatedEnd = new Date(year, month + 1, 0);
          }
          periodEnd = calculatedEnd;
        }
      } else {
        // Para otros tipos de pago (Depósito, Multa), el período es solo el día del vencimiento.
        periodStart = dueDateFromRequest;
        periodEnd = dueDateFromRequest;
      }

      const paymentData = {
        ...req.body,
        organizationId,
        dueDate: new Date(req.body.dueDate),
        paidDate: req.body.paidDate ? new Date(req.body.paidDate) : undefined,
        periodStart,
        periodEnd,
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

      // Lógica de contabilidad automática: si el pago se crea con status PAID
      if (payment.status === 'PAID') {
        // Verificar si ya existe un entry para este pago
        const existingEntry = await prisma.accountingEntry.findFirst({
          where: {
            contractId: payment.contractId,
            amount: payment.amount,
            date: payment.paidDate || undefined,
            type: 'INCOME',
          }
        });
        if (!existingEntry) {
          // Construir concepto informativo
          let concept = 'Arriendo pagado';
          if (payment.contract?.property?.unitNumber) {
            concept = `Arriendo pagado por Apto ${payment.contract.property.unitNumber}`;
          } else if (payment.contract?.property?.name) {
            concept = `Arriendo pagado por ${payment.contract.property.name}`;
          }

          // Obtener info de unidad y propiedad
          let unitName = '';
          let propertyName = '';
          let unitId = undefined;
          if (payment.contract?.property?.unitId) {
            const unit = await prisma.unit.findUnique({ where: { id: payment.contract.property.unitId } });
            if (unit) {
              unitName = unit.name;
              unitId = unit.id;
            }
          }
          if (payment.contract?.property?.name) propertyName = payment.contract.property.name;

          let accountingNotes = '';
          if (unitName || propertyName) {
            accountingNotes = `Unidad: ${unitName || '-'}, Propiedad: ${propertyName || '-'}.`;
          }
          if (payment.notes) {
            accountingNotes += ` ${payment.notes}`;
          }

          const entry = await prisma.accountingEntry.create({
            data: {
              organizationId,
              type: 'INCOME',
              concept,
              amount: payment.amount,
              date: payment.paidDate || new Date(),
              propertyId: payment.contract?.property?.id,
              contractId: payment.contractId,
              unitId: unitId,
              createdById: currentUser.id,
              notes: accountingNotes || undefined
            }
          });
          // Emitir evento socket.io
          if (io) {
            io.to(`org-${organizationId}`).emit('accounting:created', { entry });
          }
        }
      }

      logger.info('Payment created:', { paymentId: payment.id, organizationId });
      io.to(`org-${organizationId}`).emit('payment:created', { payment, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}` });

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
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      const io = req.app.get('io');
      const currentUser = (req as any).user;

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

      const updateData: any = {};

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
      } else if (Object.prototype.hasOwnProperty.call(req.body, 'paidDate') && req.body.paidDate === null) {
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

      // Lógica de contabilidad automática: solo si el status cambió a PAID y antes no era PAID
      if (status === 'PAID' && existingPayment.status !== 'PAID') {
        // Verificar si ya existe un entry para este pago
        const existingEntry = await prisma.accountingEntry.findFirst({
          where: {
            contractId: payment.contractId,
            amount: payment.amount,
            date: payment.paidDate || undefined,
            type: 'INCOME',
            // El concepto ya no es relevante para buscar duplicados
          }
        });
        if (!existingEntry) {
          // Construir concepto informativo
          let concept = 'Arriendo pagado';
          if (payment.contract?.property?.unitNumber) {
            concept = `Arriendo pagado por Apto ${payment.contract.property.unitNumber}`;
          } else if (payment.contract?.property?.name) {
            concept = `Arriendo pagado por ${payment.contract.property.name}`;
          }

          // Obtener info de unidad y propiedad
          let unitName = '';
          let propertyName = '';
          let unitId = undefined;
          if (payment.contract?.property?.unitId) {
            const unit = await prisma.unit.findUnique({ where: { id: payment.contract.property.unitId } });
            if (unit) {
              unitName = unit.name;
              unitId = unit.id;
            }
          }
          if (payment.contract?.property?.name) propertyName = payment.contract.property.name;

          let accountingNotes = '';
          if (unitName || propertyName) {
            accountingNotes = `Unidad: ${unitName || '-'}, Propiedad: ${propertyName || '-'}.`;
          }
          if (payment.notes) {
            accountingNotes += ` ${payment.notes}`;
          }

          const entry = await prisma.accountingEntry.create({
            data: {
              organizationId,
              type: 'INCOME',
              concept,
              amount: payment.amount,
              date: payment.paidDate || new Date(),
              propertyId: payment.contract?.property?.id,
              contractId: payment.contractId,
              unitId: unitId,
              createdById: currentUser.id,
              notes: accountingNotes || undefined
            }
          });
          // Emitir evento socket.io
          if (io) {
            io.to(`org-${organizationId}`).emit('accounting:created', { entry });
          }
        }
      }

      logger.info('Payment updated:', { paymentId: payment.id, organizationId });
      io.to(`org-${organizationId}`).emit('payment:updated', { payment, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}` });

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
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      const io = req.app.get('io');
      const currentUser = (req as any).user;

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
      io.to(`org-${organizationId}`).emit('payment:deleted', { paymentId: id, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}` });
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

router.patch('/:id',
    authenticateToken,
    requireRole(['ADMIN']),
    validateOrganizationAccess,
    [
        param('id').isUUID(),
        body('status').isIn(['CANCELLED', 'REFUNDED']),
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const organizationId = (req as any).organizationId;

            const paymentToUpdate = await prisma.payment.findFirst({
                where: { id, organizationId }
            });

            if (!paymentToUpdate) {
                return res.status(404).json({ error: 'Payment not found' });
            }

            if (paymentToUpdate.status === 'CANCELLED' || paymentToUpdate.status === 'REFUNDED') {
                return res.status(400).json({ 
                    error: `Payment is already in a final state (${paymentToUpdate.status}).` 
                });
            }

            const result = await prisma.$transaction(async (tx) => {
                const updatedPayment = await tx.payment.update({
                    where: { id: paymentToUpdate.id },
                    data: { status }
                });

                // Lista de tipos de pago que deben regenerarse tras un reembolso.
                const regenerableTypes: PaymentType[] = ['RENT', 'DEPOSIT'];

                // --- NUEVO: Eliminar asiento contable asociado si es REFUNDED ---
                if (status === 'REFUNDED') {
                  await tx.accountingEntry.deleteMany({
                    where: {
                      contractId: updatedPayment.contractId,
                      amount: updatedPayment.amount,
                      date: updatedPayment.paidDate || undefined,
                      type: 'INCOME',
                      organizationId
                    }
                  });
                }
                // --- FIN NUEVO ---

                if (status === 'REFUNDED' && regenerableTypes.includes(updatedPayment.type)) {
                    const contract = await tx.contract.findUnique({
                        where: { id: updatedPayment.contractId }
                    });

                    if (contract && contract.status === 'ACTIVE') {
                        const newPendingPayment = await tx.payment.create({
                            data: {
                                contractId: updatedPayment.contractId,
                                tenantId: updatedPayment.tenantId,
                                organizationId: updatedPayment.organizationId,
                                amount: updatedPayment.amount,
                                dueDate: updatedPayment.dueDate,
                                type: updatedPayment.type, // Usamos el tipo del pago original
                                status: 'PENDING',
                                notes: `Regenerado automáticamente tras reembolso del pago #${updatedPayment.id.slice(-6)}.`,
                                periodStart: updatedPayment.periodStart,
                                periodEnd: updatedPayment.periodEnd,
                            }
                        });
                        return { updatedPayment, newPayment: newPendingPayment };
                    }
                }
                return { updatedPayment, newPayment: null };
            });

            logger.info(`Payment status updated to ${status}:`, { paymentId: id, organizationId });
            
            return res.json({
                message: `Payment status successfully updated to ${status}.`,
                ...result
            });

        } catch (error) {
            logger.error('Update payment status error:', { error });
            return res.status(500).json({ error: 'Failed to update payment status' });
        }
    }
);

// Export the router
export default router;