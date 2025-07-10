import express, {Request, Response} from 'express';
import { body, param } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { logger } from '../config/logger';

const router = express.Router();

// Get all organizations (Super Admin only)
router.get('/', 
  authenticateToken,
  requireSuperAdmin,
  async (req:Request, res:Response) => {
    try {
      const organizations = await prisma.organization.findMany({
        include: {
          subscriptions: {
            where: { status: { in: ['ACTIVE', 'TRIALING', 'DEMO'] } },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          users: {
            select: { id: true, email: true, role: true, isActive: true }
          },
          _count: {
            select: {
              properties: true,
              tenants: true,
              contracts: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({ organizations });
    } catch (error) {
      logger.error('Get organizations error:', error);
      return res.status(500).json({
        error: 'Failed to fetch organizations',
        code: 'FETCH_ORGANIZATIONS_ERROR'
      });
    }
  }
);

// Get organization by ID
router.get('/:id',
  authenticateToken,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Super admin can access any organization, others only their own
      if (user.role !== 'SUPER_ADMIN' && user.organizationId !== id) {
        return res.status(403).json({
          error: 'Access denied to this organization',
          code: 'ORGANIZATION_ACCESS_DENIED'
        });
      }

      const organization = await prisma.organization.findUnique({
        where: { id },
        include: {
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          users: {
            select: { 
              id: true, 
              email: true, 
              firstName: true, 
              lastName: true, 
              role: true, 
              isActive: true,
              lastLogin: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              properties: true,
              tenants: true,
              contracts: true,
              payments: true,
              maintenance: true
            }
          }
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
      logger.error('Get organization error:', error);
      return res.status(500).json({
        error: 'Failed to fetch organization',
        code: 'FETCH_ORGANIZATION_ERROR'
      });
    }
  }
);

// Update organization
router.put('/:id',
    authenticateToken,
    [
        param('id').isUUID(),
        body('name').optional().trim().isLength({ min: 1 }),
        body('email').optional().isEmail().normalizeEmail(),
        body('phone').optional().trim(),
        body('address').optional().trim(),
        body('settings').optional().isObject()
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            // Lógica de permisos (esta parte está bien)
            if (user.role !== 'SUPER_ADMIN' && user.organizationId !== id) {
                return res.status(403).json({
                    error: 'Access denied to this organization',
                    code: 'ORGANIZATION_ACCESS_DENIED'
                });
            }

            const organization = await prisma.organization.findUnique({
                where: { id }
            });

            if (!organization) {
                return res.status(404).json({
                    error: 'Organization not found',
                    code: 'ORGANIZATION_NOT_FOUND'
                });
            }

            // --- INICIO DE LA CORRECCIÓN ---

            // 1. Desestructuramos solo los campos que permitimos cambiar del body.
            const { name, email, phone, address, settings, isActive } = req.body;

            // 2. Creamos un objeto 'dataToUpdate' seguro.
            const dataToUpdate: any = {};

            // 3. Añadimos los campos solo si fueron proporcionados en la petición.
            if (name) dataToUpdate.name = name;
            if (email) dataToUpdate.email = email;
            if (phone) dataToUpdate.phone = phone;
            if (address) dataToUpdate.address = address;
            if (typeof isActive === 'boolean') dataToUpdate.isActive = isActive;

            // 4. Fusionamos los 'settings' para no borrar datos existentes en el JSON.
            if (settings) {
                const existingSettings = organization.settings as object || {};
                dataToUpdate.settings = { ...existingSettings, ...settings };
            }

            // 5. Usamos el objeto seguro 'dataToUpdate' en la llamada a Prisma.
            const updatedOrganization = await prisma.organization.update({
                where: { id },
                data: dataToUpdate
            });

            // --- FIN DE LA CORRECCIÓN ---

            logger.info('Organization updated:', { organizationId: id, updatedBy: user.id });

            return res.json({
                message: 'Organization updated successfully',
                organization: updatedOrganization
            });
        } catch (error) {
            logger.error('Update organization error:', error);
            return res.status(500).json({
                error: 'Failed to update organization',
                code: 'UPDATE_ORGANIZATION_ERROR'
            });
        }
    }
);

// Deactivate organization (Super Admin only)
router.patch('/:id/deactivate',
  authenticateToken,
  requireSuperAdmin,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;

      const organization = await prisma.organization.findUnique({
        where: { id }
      });

      if (!organization) {
        return res.status(404).json({
          error: 'Organization not found',
          code: 'ORGANIZATION_NOT_FOUND'
        });
      }

      await prisma.organization.update({
        where: { id },
        data: { isActive: false }
      });

      logger.info('Organization deactivated:', { organizationId: id });

      return res.json({
        message: 'Organization deactivated successfully'
      });
    } catch (error) {
      logger.error('Deactivate organization error:', error);
      return res.status(500).json({
        error: 'Failed to deactivate organization',
        code: 'DEACTIVATE_ORGANIZATION_ERROR'
      });
    }
  }
);

// Activate organization (Super Admin only)
router.patch('/:id/activate',
  authenticateToken,
  requireSuperAdmin,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;

      const organization = await prisma.organization.findUnique({
        where: { id }
      });

      if (!organization) {
        return res.status(404).json({
          error: 'Organization not found',
          code: 'ORGANIZATION_NOT_FOUND'
        });
      }

      await prisma.organization.update({
        where: { id },
        data: { isActive: true }
      });

      logger.info('Organization activated:', { organizationId: id });

      return res.json({
        message: 'Organization activated successfully'
      });
    } catch (error) {
      logger.error('Activate organization error:', error);
      return res.status(500).json({
        error: 'Failed to activate organization',
        code: 'ACTIVATE_ORGANIZATION_ERROR'
      });
    }
  }
);

// PATCH /v1/organizations/:id/subscription - Actualiza plan y estado de la suscripción activa
router.patch('/:id/subscription', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { planId, status } = req.body;
    // Buscar la suscripción activa más reciente
    const subscription = await prisma.subscription.findFirst({
      where: { organizationId: id },
      orderBy: { createdAt: 'desc' }
    });
    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found for this organization' });
    }
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        ...(planId && { planId }),
        ...(status && { status })
      }
    });
    return res.json({ message: 'Subscription updated', subscription: updated });
  } catch (error) {
    logger.error('Failed to update subscription:', error);
    return res.status(500).json({ error: 'Failed to update subscription' });
  }
});

export default router;