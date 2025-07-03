import express, {Request, Response} from 'express';
import { body, param, query } from 'express-validator';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { handleValidationErrors, validateOrganizationAccess } from '../middleware/validation';
import { logger } from '../config/logger';

const router = express.Router();

// Get all users in organization
router.get('/',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  validateOrganizationAccess,
  [
    query('role').optional().isIn(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']),
    query('isActive').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { role, isActive, page = 1, limit = 50 } = req.query;
      const organizationId = (req as any).organizationId;

      const where: any = { organizationId };
      if (role) where.role = role;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      return res.json({
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get users error:', error);
      return res.status(500).json({
        error: 'Failed to fetch users',
        code: 'FETCH_USERS_ERROR'
      });
    }
  }
);

// Get user by ID
router.get('/:id',
  authenticateToken,
  validateOrganizationAccess,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      const currentUser = (req as any).user;

      // Users can only view their own profile unless they're admin/manager
      if (currentUser.id !== id && !['ADMIN', 'MANAGER'].includes(currentUser.role)) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      const user = await prisma.user.findFirst({
        where: { id, organizationId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      return res.json(user);
    } catch (error) {
      logger.error('Get user error:', error);
      return res.status(500).json({
        error: 'Failed to fetch user',
        code: 'FETCH_USER_ERROR'
      });
    }
  }
);

// Create new user (invite)
router.post('/',
  authenticateToken,
  requireRole(['ADMIN']),
  validateOrganizationAccess,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name required (max 50 characters)'),
    body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name required (max 50 characters)'),
    body('role').isIn(['ADMIN', 'MANAGER', 'USER']).withMessage('Valid role required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { email, firstName, lastName, role, password } = req.body;
      const organizationId = (req as any).organizationId;

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Email already registered',
          code: 'EMAIL_EXISTS'
        });
      }

      // Check organization user limits
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          users: true
        }
      });

      if (!organization) {
        return res.status(404).json({
          error: 'Organization not found',
          code: 'ORGANIZATION_NOT_FOUND'
        });
      }

      let maxUsers = 1;
      if (organization.settings) {
        let settingsObj: any;
        if (typeof organization.settings === 'string') {
          try {
            settingsObj = JSON.parse(organization.settings);
          } catch {
            settingsObj = {};
          }
        } else {
          settingsObj = organization.settings;
        }
        maxUsers = settingsObj?.limits?.maxUsers || 1;
      }
      if (organization.users.length >= maxUsers) {
        return res.status(400).json({
          error: 'User limit reached for current plan',
          code: 'USER_LIMIT_REACHED',
          limit: maxUsers
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          organizationId,
          email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
          role
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });

      logger.info('User created:', { userId: user.id, email, organizationId });

      return res.status(201).json({
        message: 'User created successfully',
        user
      });
    } catch (error) {
      logger.error('Create user error:', error);
      return res.status(500).json({
        error: 'Failed to create user',
        code: 'CREATE_USER_ERROR'
      });
    }
  }
);

// Update user
router.put('/:id',
    authenticateToken,
    validateOrganizationAccess,
    [
        param('id').isUUID(),
        body('email').optional().isEmail().normalizeEmail(),
        body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
        body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
        body('role').optional().isIn(['ADMIN', 'MANAGER', 'USER']),
        body('isActive').optional().isBoolean()
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = (req as any).organizationId;
            const currentUser = (req as any).user;

            // Lógica de permisos (ya la tenías y está bien)
            if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Access denied' });
            }
            if (currentUser.role !== 'ADMIN' && (req.body.role || req.body.isActive !== undefined)) {
                return res.status(403).json({ error: 'Insufficient permissions to modify role or status' });
            }

            const existingUser = await prisma.user.findFirst({
                where: { id, organizationId }
            });

            if (!existingUser) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // ... (tu lógica para comprobar si el email existe está bien)

            // --- INICIO DE LA CORRECCIÓN ---

            // 1. Desestructuramos solo los campos que nos interesan del body.
            const { firstName, lastName, email, role, isActive } = req.body;

            // 2. Creamos un objeto 'dataToUpdate' con solo los campos permitidos.
            const dataToUpdate: {
                firstName?: string;
                lastName?: string;
                email?: string;
                role?: 'ADMIN' | 'MANAGER' | 'USER';
                isActive?: boolean;
            } = {};

            if (firstName) dataToUpdate.firstName = firstName;
            if (lastName) dataToUpdate.lastName = lastName;
            if (email) dataToUpdate.email = email;

            // 3. Añadimos campos que solo un ADMIN puede cambiar.
            if (currentUser.role === 'ADMIN') {
                if (role) dataToUpdate.role = role;
                if (isActive !== undefined) dataToUpdate.isActive = isActive;
            }

            // 4. Usamos el objeto seguro 'dataToUpdate' en la llamada a Prisma.
            const user = await prisma.user.update({
                where: { id },
                data: dataToUpdate,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true,
                    lastLogin: true,
                    updatedAt: true
                }
            });

            // --- FIN DE LA CORRECCIÓN ---

            logger.info('User updated:', { userId: user.id, organizationId });
            return res.json({
                message: 'User updated successfully',
                user
            });
        } catch (error) {
            logger.error('Update user error:', error);
            return res.status(500).json({ error: 'Failed to update user' });
        }
    }
);

// Change password
router.put('/:id/password',
  authenticateToken,
  validateOrganizationAccess,
  [
    param('id').isUUID(),
    body('currentPassword').isLength({ min: 1 }).withMessage('Current password required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;
      const organizationId = (req as any).organizationId;
      const currentUser = (req as any).user;

      // Users can only change their own password unless they're admin
      if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      const user = await prisma.user.findFirst({
        where: { id, organizationId }
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verify current password (admins can skip this for other users)
      if (currentUser.id === id) {
        const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
          return res.status(400).json({
            error: 'Current password is incorrect',
            code: 'INVALID_PASSWORD'
          });
        }
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id },
        data: { passwordHash: hashedPassword }
      });

      logger.info('Password changed:', { userId: id, organizationId });

      return res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      return res.status(500).json({
        error: 'Failed to change password',
        code: 'CHANGE_PASSWORD_ERROR'
      });
    }
  }
);

// Deactivate user
router.patch('/:id/deactivate',
  authenticateToken,
  requireRole(['ADMIN']),
  validateOrganizationAccess,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      const currentUser = (req as any).user;

      // Cannot deactivate yourself
      if (currentUser.id === id) {
        return res.status(400).json({
          error: 'Cannot deactivate your own account',
          code: 'CANNOT_DEACTIVATE_SELF'
        });
      }

      const user = await prisma.user.findFirst({
        where: { id, organizationId }
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      await prisma.user.update({
        where: { id },
        data: { isActive: false }
      });

      logger.info('User deactivated:', { userId: id, organizationId });

      return res.json({
        message: 'User deactivated successfully'
      });
    } catch (error) {
      logger.error('Deactivate user error:', error);
      return res.status(500).json({
        error: 'Failed to deactivate user',
        code: 'DEACTIVATE_USER_ERROR'
      });
    }
  }
);

// Activate user
router.patch('/:id/activate',
  authenticateToken,
  requireRole(['ADMIN']),
  validateOrganizationAccess,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const user = await prisma.user.findFirst({
        where: { id, organizationId }
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      await prisma.user.update({
        where: { id },
        data: { isActive: true }
      });

      logger.info('User activated:', { userId: id, organizationId });

      return res.json({
        message: 'User activated successfully'
      });
    } catch (error) {
      logger.error('Activate user error:', error);
      return res.status(500).json({
        error: 'Failed to activate user',
        code: 'ACTIVATE_USER_ERROR'
      });
    }
  }
);

// Delete user
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
      const currentUser = (req as any).user;

      // Cannot delete yourself
      if (currentUser.id === id) {
        return res.status(400).json({
          error: 'Cannot delete your own account',
          code: 'CANNOT_DELETE_SELF'
        });
      }

      const user = await prisma.user.findFirst({
        where: { id, organizationId }
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      await prisma.user.delete({
        where: { id }
      });

      logger.info('User deleted:', { userId: id, organizationId });

      return res.json({
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      return res.status(500).json({
        error: 'Failed to delete user',
        code: 'DELETE_USER_ERROR'
      });
    }
  }
);

export default router;