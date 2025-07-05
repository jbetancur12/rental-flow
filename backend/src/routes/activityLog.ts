import { Router, Request, Response } from 'express';
import { query } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors, validateOrganizationAccess } from '../middleware/validation';
import { logger } from '../config/logger';



const router = Router();

// GET /v1/activity-log
router.get('/',
    authenticateToken,
    validateOrganizationAccess,
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const organizationId = (req as any).organizationId;

            // Leemos los parámetros de la URL (query params)
            const limit = parseInt(req.query.limit as string) || 10;
            const isSystemActionQuery = req.query.isSystemAction as string;

            // Construimos la condición de búsqueda
            const whereCondition: any = {
                organizationId: organizationId,
            };

            if (isSystemActionQuery === 'false') {
                whereCondition.isSystemAction = false;
            } else if (isSystemActionQuery === 'true') {
                whereCondition.isSystemAction = true;
            }

            const logs = await prisma.activityLog.findMany({
                where: whereCondition,
                orderBy: {
                    createdAt: 'desc', // Ordenamos por más reciente
                },
                take: limit, // Tomamos solo la cantidad solicitada
                include: {
                    // Incluimos el nombre del usuario que realizó la acción
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        }
                    }
                }
            });

            return res.json({ data: logs });

        } catch (error) {
            logger.error('Failed to fetch activity log:', error);
            return res.status(500).json({ error: 'Failed to fetch activity log' });
        }
    }
);

export default router;