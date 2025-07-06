import { Router, Request, Response } from 'express';
import { query } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { logger } from '../config/logger';
import { SubscriptionStatus } from '@prisma/client';

const router = Router();

// GET /v1/super-admin/organizations
// Obtiene una lista paginada de todas las organizaciones en el sistema.
router.get('/organizations',
  authenticateToken,
  requireRole(['SUPER_ADMIN']), // Middleware que asegura que solo un SUPER_ADMIN puede acceder
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isString(),
    query('search').optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {

    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const { status, search } = req.query;

      const where: any = {};

      where.planId = { not: 'platform' };

        if (search) {
                where.OR = [
                    { name: { contains: search.toString(), mode: 'insensitive' } },
                    { email: { contains: search.toString(), mode: 'insensitive' } }
                ];
            }

    if (status && status !== 'all') {
                const statusString = status.toString().toUpperCase();

                switch (statusString) {
                    case 'PLATFORM':
                        // Asumimos que la organización de la plataforma tiene un planId específico
                        where.planId = 'platform'; 
                        break;
                    case 'INACTIVE':
                        // Buscamos organizaciones marcadas como inactivas en su propio modelo
                        where.isActive = false;
                        break;
                    default:
                        // Para el resto de los estados, sí buscamos en la suscripción
                        where.subscriptions = {
                            some: { status: statusString as SubscriptionStatus }
                        };
                        break;
                }
            }

   

      const [organizations, total] = await prisma.$transaction([
        prisma.organization.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            users: { select: { id: true } },
            tenants: { select: { id: true } },
            properties: { select: { id: true } },
            subscriptions: { take: 1, orderBy: { createdAt: 'desc' } }
          }
        }),
        prisma.organization.count({ where })
      ]);

      const responseData = organizations.map(org => {

        const subscription = org.subscriptions && org.subscriptions.length > 0
          ? org.subscriptions[0]
          : null;

        const plan = subscription?.planId || 'N/A';
        const status = subscription?.status || 'PLATFORM'; 
        const mrr = subscription?.status === 'ACTIVE' ? 79 : 0; 

        return {
          id: org.id,
          name: org.name,
          email: org.email,
          plan: plan,
          status: status,
          users: org.users.length,
          properties: org.properties.length,
          mrr: mrr,
          createdAt: org.createdAt,
          lastActivity: org.updatedAt
        };
      });

      return res.json({
        data: responseData,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      });

    } catch (error) {
      logger.error('Failed to fetch organizations for super admin:', error);
      return res.status(500).json({ error: 'Failed to fetch organizations' });
    }
  }
);

export default router;