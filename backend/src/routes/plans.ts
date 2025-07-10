import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { logger } from '../config/logger';

// Usamos una transacción para asegurar que todas las actualizaciones se completen
interface PlanLimits {
    properties: number;
    tenants: number;
    users: number;
}

interface PlanUpdateInput {
    id: string;
    name?: string;
    price: number;
    features?: any; // Replace 'any' with a more specific type if available
    limits: PlanLimits;
}

const router = Router();

// ENDPOINT PÚBLICO: GET /v1/plans/public - Obtiene todos los planes activos (para registro)
router.get('/public', async (req: Request, res: Response) => {
    try {
        const plans = await prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { price: 'asc' }
        });
        return res.json({ data: plans });
    } catch (error) {
        logger.error('Failed to fetch public plans:', error);
        return res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

// Middleware para asegurar que solo un SUPER_ADMIN acceda a las rutas siguientes
router.use(authenticateToken, requireRole(['SUPER_ADMIN']));

// GET /v1/super-admin/plans - Obtiene todos los planes
router.get('/', async (req: Request, res: Response) => {
    try {
        const plans = await prisma.plan.findMany({
            orderBy: { price: 'asc' } // Ordenamos por precio
        });
        console.log("🚀 ~ router.get ~ plans:", plans)
        return res.json({ data: plans });
    } catch (error) {
        logger.error('Failed to fetch plans:', error);
        return res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

// PATCH /v1/super-admin/plans - Actualiza múltiples planes
router.patch('/',
    [
        body().isArray().withMessage('Request body must be an array of plans.'),
        body('*.id').isString().notEmpty(),
        body('*.price').isNumeric(),
        body('*.limits.properties').isNumeric(),
        body('*.limits.tenants').isNumeric(),
        body('*.limits.users').isNumeric(),
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const plansToUpdate = req.body; // El body es un array de objetos de plan



            const updatePromises = (plansToUpdate as PlanUpdateInput[]).map((plan: PlanUpdateInput) =>
                prisma.plan.update({
                    where: { id: plan.id },
                    data: {
                        name: plan.name,
                        price: plan.price,
                        features: plan.features,
                        limits: { ...plan.limits },
                    }
                })
            );

            const updatedPlans = await prisma.$transaction(updatePromises);

            logger.info('Subscription plans updated by super admin', { userId: (req as any).user.id });

            return res.json({
                message: 'Planes actualizados exitosamente.',
                data: updatedPlans
            });

        } catch (error) {
            logger.error('Failed to update plans:', error);
            return res.status(500).json({ error: 'Failed to update plans' });
        }
    }
);

router.post('/',
    [
        body('id').isString().notEmpty().withMessage('El ID del plan es requerido.'),
        body('name').isString().notEmpty().withMessage('El nombre del plan es requerido.'),
        body('price').isNumeric().withMessage('El precio debe ser un número.'),
        body('limits').isObject().withMessage('Los límites deben ser un objeto.')
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const { id, name, price, features, limits } = req.body;
            const user = (req as any).user;

            // Verificar si ya existe un plan con ese ID
            const existingPlan = await prisma.plan.findUnique({ where: { id } });
            if (existingPlan) {
                return res.status(409).json({
                    error: 'A plan with this ID already exists.',
                    code: 'PLAN_ID_CONFLICT'
                });
            }

            // Crear el nuevo plan
            const newPlan = await prisma.plan.create({
                data: {
                    id,
                    name,
                    price,
                    features,
                    limits,
                    isActive: true,
                }
            });

            // Registrar la actividad
            await prisma.activityLog.create({
                data: {
                    organizationId: user.organizationId,
                    userId: user.id,
                    entityType: 'PLAN', // Necesitarás añadir 'PLAN' a tu enum EntityType
                    entityId: newPlan.id,
                    action: 'CREATE',
                    description: `El Super Admin ${user.firstName} creó el plan "${newPlan.name}".`
                }
            });

            return res.status(201).json({ 
                message: 'Plan created successfully.',
                data: newPlan 
            });

        } catch (error) {
            logger.error('Failed to create plan:', error);
            return res.status(500).json({ error: 'Failed to create plan' });
        }
    }
);

export default router;