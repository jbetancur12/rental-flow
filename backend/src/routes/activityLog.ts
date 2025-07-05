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

          const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            // Leemos los parámetros de la URL (query params)

            const isSystemActionQuery = req.query.isSystemAction as string;

            // Construimos la condición de búsqueda
            const whereCondition: any = {
                organizationId,
                ...(isSystemActionQuery === 'false' && { isSystemAction: false }),
                ...(isSystemActionQuery === 'true' && { isSystemAction: true }),
            };



            const [logs, totalLogs] = await prisma.$transaction([
                prisma.activityLog.findMany({
                    where: whereCondition,
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    skip: skip,
                    include: {
                        user: {
                            select: { firstName: true, lastName: true }
                        }
                    }
                }),
                prisma.activityLog.count({ where: whereCondition })
            ]);

            return res.json({
                data: logs,
                pagination: {
                    total: totalLogs,
                    page,
                    pages: Math.ceil(totalLogs / limit),
                    limit
                }
            });
        } catch (error) {
            logger.error('Failed to fetch activity log:', error);
            return res.status(500).json({ error: 'Failed to fetch activity log' });
        }
    }
);

export default router;