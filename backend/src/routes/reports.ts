import express, {Request, Response} from 'express';
import { query } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { handleValidationErrors, validateOrganizationAccess } from '../middleware/validation';
import { logger } from '../config/logger';

const router = express.Router();

// Get dashboard overview report
router.get('/dashboard',
  authenticateToken,
  validateOrganizationAccess,
  async (req:Request, res:Response) => {
    try {
      const organizationId = (req as any).organizationId;

      const [
        totalProperties,
        totalTenants,
        totalContracts,
        totalPayments,
        totalMaintenance,
        propertiesStats,
        tenantsStats,
        paymentsStats,
        maintenanceStats
      ] = await Promise.all([
        // Total counts
        prisma.property.count({ where: { organizationId } }),
        prisma.tenant.count({ where: { organizationId } }),
        prisma.contract.count({ where: { organizationId } }),
        prisma.payment.count({ where: { organizationId } }),
        prisma.maintenanceRequest.count({ where: { organizationId } }),

        // Properties by status
        prisma.property.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: { status: true }
        }),

        // Tenants by status
        prisma.tenant.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: { status: true }
        }),

        // Payments summary
        prisma.payment.aggregate({
          where: { organizationId },
          _sum: { amount: true },
          _count: { status: true }
        }),

        // Maintenance by status
        prisma.maintenanceRequest.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: { status: true }
        })
      ]);

      // Calculate revenue metrics
      const [paidPayments, pendingPayments, overduePayments] = await Promise.all([
        prisma.payment.aggregate({
          where: { organizationId, status: 'PAID' },
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: { organizationId, status: 'PENDING' },
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: { 
            organizationId, 
            status: 'PENDING',
            dueDate: { lt: new Date() }
          },
          _sum: { amount: true }
        })
      ]);

      // Calculate occupancy rate
      const availableProperties = propertiesStats.find(p => p.status === 'AVAILABLE')?._count.status || 0;
      const rentedProperties = propertiesStats.find(p => p.status === 'RENTED')?._count.status || 0;
      const occupancyRate = totalProperties > 0 ? ((rentedProperties / totalProperties) * 100) : 0;

      return res.json({
        overview: {
          totalProperties,
          totalTenants,
          totalContracts,
          totalPayments,
          totalMaintenance,
          occupancyRate: Math.round(occupancyRate * 100) / 100
        },
        properties: {
          total: totalProperties,
          byStatus: propertiesStats.reduce((acc, item) => {
            acc[item.status.toLowerCase()] = item._count.status;
            return acc;
          }, {} as Record<string, number>)
        },
        tenants: {
          total: totalTenants,
          byStatus: tenantsStats.reduce((acc, item) => {
            acc[item.status.toLowerCase()] = item._count.status;
            return acc;
          }, {} as Record<string, number>)
        },
        revenue: {
          totalCollected: paidPayments._sum.amount || 0,
          totalPending: pendingPayments._sum.amount || 0,
          totalOverdue: overduePayments._sum.amount || 0,
          totalRevenue: paymentsStats._sum.amount || 0
        },
        maintenance: {
          total: totalMaintenance,
          byStatus: maintenanceStats.reduce((acc, item) => {
            acc[item.status.toLowerCase()] = item._count.status;
            return acc;
          }, {} as Record<string, number>)
        }
      });
    } catch (error) {
      logger.error('Get dashboard report error:', error);
      return res.status(500).json({
        error: 'Failed to fetch dashboard report',
        code: 'FETCH_DASHBOARD_REPORT_ERROR'
      });
    }
  }
);

// Get financial report
router.get('/financial',
  authenticateToken,
  validateOrganizationAccess,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['month', 'quarter', 'year'])
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { startDate, endDate, groupBy = 'month' } = req.query;
      const organizationId = (req as any).organizationId;

      const dateFilter: any = { organizationId };
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.gte = new Date(startDate as string);
        if (endDate) dateFilter.createdAt.lte = new Date(endDate as string);
      }

      const [
        paymentsOverview,
        paymentsByType,
        paymentsByStatus,
        monthlyRevenue,
        contractsRevenue,
        maintenanceCosts
      ] = await Promise.all([
        // Payments overview
        prisma.payment.aggregate({
          where: dateFilter,
          _sum: { amount: true },
          _count: { id: true },
          _avg: { amount: true }
        }),

        // Payments by type
        prisma.payment.groupBy({
          by: ['type'],
          where: dateFilter,
          _sum: { amount: true },
          _count: { type: true }
        }),

        // Payments by status
        prisma.payment.groupBy({
          by: ['status'],
          where: dateFilter,
          _sum: { amount: true },
          _count: { status: true }
        }),

        // Monthly revenue trend (last 12 months)
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', due_date) as month,
            SUM(amount) as revenue,
            COUNT(*) as payment_count
          FROM payments 
          WHERE organization_id = ${organizationId}
            AND due_date >= NOW() - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', due_date)
          ORDER BY month DESC
        `,

        // Revenue by contract
        prisma.contract.findMany({
          where: { organizationId },
          include: {
            payments: {
              where: { status: 'PAID' }
            },
            property: {
              select: { name: true, address: true }
            },
            tenant: {
              select: { firstName: true, lastName: true }
            }
          }
        }),

        // Maintenance costs
        prisma.maintenanceRequest.aggregate({
          where: { 
            organizationId,
            actualCost: { not: null }
          },
          _sum: { actualCost: true },
          _count: { id: true },
          _avg: { actualCost: true }
        })
      ]);

      // Calculate contract revenues
      const contractRevenues = contractsRevenue.map(contract => ({
        contractId: contract.id,
        property: contract.property.name,
        tenant: `${contract.tenant.firstName} ${contract.tenant.lastName}`,
        monthlyRent: contract.monthlyRent,
        totalPaid: contract.payments.reduce((sum, payment) => sum + payment.amount, 0),
        paymentCount: contract.payments.length
      }));

      return res.json({
        summary: {
          totalRevenue: paymentsOverview._sum.amount || 0,
          totalPayments: paymentsOverview._count || 0,
          averagePayment: Math.round((paymentsOverview._avg.amount || 0) * 100) / 100,
          maintenanceCosts: maintenanceCosts._sum.actualCost || 0,
          netRevenue: (paymentsOverview._sum.amount || 0) - (maintenanceCosts._sum.actualCost || 0)
        },
        paymentsByType: paymentsByType.map(item => ({
          type: item.type.toLowerCase(),
          amount: item._sum.amount || 0,
          count: item._count.type
        })),
        paymentsByStatus: paymentsByStatus.map(item => ({
          status: item.status.toLowerCase(),
          amount: item._sum.amount || 0,
          count: item._count.status
        })),
        monthlyTrend: monthlyRevenue,
        contractRevenues,
        maintenanceStats: {
          totalCost: maintenanceCosts._sum.actualCost || 0,
          requestCount: maintenanceCosts._count || 0,
          averageCost: Math.round((maintenanceCosts._avg.actualCost || 0) * 100) / 100
        }
      });
    } catch (error) {
      logger.error('Get financial report error:', error);
      return res.status(500).json({
        error: 'Failed to fetch financial report',
        code: 'FETCH_FINANCIAL_REPORT_ERROR'
      });
    }
  }
);

// Get property performance report
router.get('/properties',
  authenticateToken,
  validateOrganizationAccess,
  [
    query('unitId').optional().isUUID(),
    query('type').optional().isIn(['APARTMENT', 'HOUSE', 'COMMERCIAL']),
    query('status').optional().isIn(['AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE'])
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { unitId, type, status } = req.query;
      const organizationId = (req as any).organizationId;

      const where: any = { organizationId };
      if (unitId) where.unitId = unitId;
      if (type) where.type = type;
      if (status) where.status = status;

      const [
        properties,
        propertiesWithRevenue,
        occupancyStats,
        maintenanceByProperty
      ] = await Promise.all([
        // Properties with basic info
        prisma.property.findMany({
          where,
          include: {
            unit: {
              select: { name: true, type: true }
            },
            contracts: {
              where: { status: 'ACTIVE' },
              include: {
                tenant: {
                  select: { firstName: true, lastName: true, email: true }
                },
                payments: {
                  where: { status: 'PAID' }
                }
              }
            }
          }
        }),

        // Properties with revenue data
        prisma.property.findMany({
          where,
          include: {
            contracts: {
              include: {
                payments: {
                  where: { status: 'PAID' }
                }
              }
            }
          }
        }),

        // Occupancy statistics
        prisma.property.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: { status: true }
        }),

        // Maintenance requests by property
        prisma.maintenanceRequest.groupBy({
          by: ['propertyId'],
          where: { organizationId },
          _count: { propertyId: true },
          _sum: { actualCost: true, estimatedCost: true }
        })
      ]);

      // Calculate property performance metrics
      const propertyPerformance = properties.map(property => {
        const revenue = propertiesWithRevenue
          .find(p => p.id === property.id)
          ?.contracts.reduce((sum, contract) => 
            sum + contract.payments.reduce((paySum, payment) => paySum + payment.amount, 0), 0
          ) || 0;

        const maintenance = maintenanceByProperty.find(m => m.propertyId === property.id);
        const maintenanceCost = maintenance?._sum.actualCost || maintenance?._sum.estimatedCost || 0;

        const activeContract = property.contracts.find(c => c.status === 'ACTIVE');
        const daysOccupied = activeContract ? 
          Math.ceil((new Date().getTime() - activeContract.startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        return {
          id: property.id,
          name: property.name,
          address: property.address,
          type: property.type,
          status: property.status,
          rent: property.rent,
          size: property.size,
          unit: property.unit?.name,
          currentTenant: activeContract ? 
            `${activeContract.tenant.firstName} ${activeContract.tenant.lastName}` : null,
          totalRevenue: revenue,
          maintenanceCost,
          netRevenue: revenue - maintenanceCost,
          maintenanceRequests: maintenance?._count.propertyId || 0,
          daysOccupied,
          occupancyRate: daysOccupied > 0 ? 100 : 0
        };
      });

      // Calculate overall metrics
      const totalRevenue = propertyPerformance.reduce((sum, p) => sum + p.totalRevenue, 0);
      const totalMaintenanceCost = propertyPerformance.reduce((sum, p) => sum + p.maintenanceCost, 0);
      const averageRent = properties.length > 0 ? 
        properties.reduce((sum, p) => sum + p.rent, 0) / properties.length : 0;

      return res.json({
        summary: {
          totalProperties: properties.length,
          totalRevenue,
          totalMaintenanceCost,
          netRevenue: totalRevenue - totalMaintenanceCost,
          averageRent: Math.round(averageRent * 100) / 100,
          occupancyRate: occupancyStats.find(s => s.status === 'RENTED')?._count.status || 0
        },
        occupancyStats: occupancyStats.map(stat => ({
          status: stat.status.toLowerCase(),
          count: stat._count.status
        })),
        properties: propertyPerformance.sort((a, b) => b.netRevenue - a.netRevenue)
      });
    } catch (error) {
      logger.error('Get property report error:', error);
      return res.status(500).json({
        error: 'Failed to fetch property report',
        code: 'FETCH_PROPERTY_REPORT_ERROR'
      });
    }
  }
);

// Get tenant report
router.get('/tenants',
  authenticateToken,
  validateOrganizationAccess,
  [
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'FORMER'])
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { status } = req.query;
      const organizationId = (req as any).organizationId;

      const where: any = { organizationId };
      if (status) where.status = status;

      const [
        tenants,
        tenantStats,
        paymentHistory,
        maintenanceRequests
      ] = await Promise.all([
        // Tenants with contracts and payments
        prisma.tenant.findMany({
          where,
          include: {
            contracts: {
              include: {
                property: {
                  select: { name: true, address: true, rent: true }
                },
                payments: true
              }
            }
          }
        }),

        // Tenant statistics
        prisma.tenant.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: { status: true }
        }),

        // Payment history by tenant
        prisma.payment.groupBy({
          by: ['tenantId'],
          where: { organizationId },
          _sum: { amount: true },
          _count: { tenantId: true }
        }),

        // Maintenance requests by tenant
        prisma.maintenanceRequest.groupBy({
          by: ['tenantId'],
          where: { organizationId, tenantId: { not: null } },
          _count: { tenantId: true }
        })
      ]);

      // Calculate tenant performance
      const tenantPerformance = tenants.map(tenant => {
        const payments = paymentHistory.find(p => p.tenantId === tenant.id);
        const maintenance = maintenanceRequests.find(m => m.tenantId === tenant.id);
        
        const activeContract = tenant.contracts.find(c => c.status === 'ACTIVE');
        const totalPaid = payments?._sum.amount || 0;
        const paymentCount = payments?._count.tenantId || 0;
        const maintenanceCount = maintenance?._count.tenantId || 0;

        // Calculate payment reliability
        const totalPayments = tenant.contracts.reduce((sum, contract) => sum + contract.payments.length, 0);
        const paidPayments = tenant.contracts.reduce((sum, contract) => 
          sum + contract.payments.filter(p => p.status === 'PAID').length, 0
        );
        const paymentReliability = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;

        // Calculate days as tenant
        const daysAsTenant = activeContract ? 
          Math.ceil((new Date().getTime() - activeContract.startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        return {
          id: tenant.id,
          name: `${tenant.firstName} ${tenant.lastName}`,
          email: tenant.email,
          phone: tenant.phone,
          status: tenant.status,
          creditScore: tenant.creditScore,
          employment: tenant.employment,
          applicationDate: tenant.applicationDate,
          currentProperty: activeContract?.property.name || null,
          currentRent: activeContract?.property.rent || 0,
          totalPaid,
          paymentCount,
          maintenanceRequests: maintenanceCount,
          paymentReliability: Math.round(paymentReliability * 100) / 100,
          daysAsTenant
        };
      });

      return res.json({
        summary: {
          totalTenants: tenants.length,
          averageCreditScore: tenants.filter(t => t.creditScore).length > 0 ? 
            Math.round(tenants.filter(t => t.creditScore).reduce((sum, t) => sum + (t.creditScore || 0), 0) / 
            tenants.filter(t => t.creditScore).length) : 0,
          averageIncome: tenants.length > 0 ? 
            Math.round(
              tenants.reduce((sum, t) => {
                if (
                  t.employment &&
                  typeof t.employment === 'object' &&
                  'income' in t.employment &&
                  typeof (t.employment as any).income === 'number'
                ) {
                  return sum + (t.employment as any).income;
                }
                return sum;
              }, 0) / tenants.length
            ) : 0
        },
        tenantStats: tenantStats.map(stat => ({
          status: stat.status.toLowerCase(),
          count: stat._count.status
        })),
        tenants: tenantPerformance.sort((a, b) => b.totalPaid - a.totalPaid)
      });
    } catch (error) {
      logger.error('Get tenant report error:', error);
      return res.status(500).json({
        error: 'Failed to fetch tenant report',
        code: 'FETCH_TENANT_REPORT_ERROR'
      });
    }
  }
);

// Get maintenance report
router.get('/maintenance',
  authenticateToken,
  validateOrganizationAccess,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']),
    query('category').optional().isIn(['PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL', 'OTHER'])
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { startDate, endDate, priority, category } = req.query;
      const organizationId = (req as any).organizationId;

      const where: any = { organizationId };
      if (startDate || endDate) {
        where.reportedDate = {};
        if (startDate) where.reportedDate.gte = new Date(startDate as string);
        if (endDate) where.reportedDate.lte = new Date(endDate as string);
      }
      if (priority) where.priority = priority;
      if (category) where.category = category;

      const [
        maintenanceRequests,
        statusStats,
        priorityStats,
        categoryStats,
        costAnalysis,
        completionTimes
      ] = await Promise.all([
        // Maintenance requests with details
        prisma.maintenanceRequest.findMany({
          where,
          include: {
            property: {
              select: { name: true, address: true }
            },
            tenant: {
              select: { firstName: true, lastName: true }
            }
          },
          orderBy: { reportedDate: 'desc' }
        }),

        // Status statistics
        prisma.maintenanceRequest.groupBy({
          by: ['status'],
          where,
          _count: { status: true }
        }),

        // Priority statistics
        prisma.maintenanceRequest.groupBy({
          by: ['priority'],
          where,
          _count: { priority: true }
        }),

        // Category statistics
        prisma.maintenanceRequest.groupBy({
          by: ['category'],
          where,
          _count: { category: true }
        }),

        // Cost analysis
        prisma.maintenanceRequest.aggregate({
          where: { ...where, actualCost: { not: null } },
          _sum: { actualCost: true },
          _avg: { actualCost: true },
          _count: { actualCost: true }
        }),

        // Completion times for completed requests
        prisma.maintenanceRequest.findMany({
          where: { 
            ...where, 
            status: 'COMPLETED',
            completedDate: { not: null }
          },
          select: {
            reportedDate: true,
            completedDate: true,
            priority: true
          }
        })
      ]);

      // Calculate completion time statistics
      const completionStats = completionTimes.map(request => {
        const days = Math.ceil(
          (request.completedDate!.getTime() - request.reportedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return { days, priority: request.priority };
      });

      const avgCompletionTime = completionStats.length > 0 ? 
        Math.round(completionStats.reduce((sum, stat) => sum + stat.days, 0) / completionStats.length) : 0;

      // Completion time by priority
      const completionByPriority = ['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW'].map(priority => {
        const priorityTimes = completionStats.filter(stat => stat.priority === priority);
        return {
          priority: priority.toLowerCase(),
          avgDays: priorityTimes.length > 0 ? 
            Math.round(priorityTimes.reduce((sum, stat) => sum + stat.days, 0) / priorityTimes.length) : 0,
          count: priorityTimes.length
        };
      });

      return res.json({
        summary: {
          totalRequests: maintenanceRequests.length,
          totalCost: costAnalysis._sum.actualCost || 0,
          averageCost: Math.round((costAnalysis._avg.actualCost || 0) * 100) / 100,
          avgCompletionDays: avgCompletionTime,
          completedRequests: statusStats.find(s => s.status === 'COMPLETED')?._count.status || 0
        },
        statusStats: statusStats.map(stat => ({
          status: stat.status.toLowerCase(),
          count: stat._count.status
        })),
        priorityStats: priorityStats.map(stat => ({
          priority: stat.priority.toLowerCase(),
          count: stat._count.priority
        })),
        categoryStats: categoryStats.map(stat => ({
          category: stat.category.toLowerCase(),
          count: stat._count.category
        })),
        completionByPriority,
        requests: maintenanceRequests.map(request => ({
          id: request.id,
          title: request.title,
          priority: request.priority.toLowerCase(),
          category: request.category.toLowerCase(),
          status: request.status.toLowerCase(),
          property: request.property.name,
          tenant: request.tenant ? 
            `${request.tenant.firstName} ${request.tenant.lastName}` : 'Property Management',
          reportedDate: request.reportedDate,
          completedDate: request.completedDate,
          estimatedCost: request.estimatedCost,
          actualCost: request.actualCost,
          assignedTo: request.assignedTo
        }))
      });
    } catch (error) {
      logger.error('Get maintenance report error:', error);
      return res.status(500).json({
        error: 'Failed to fetch maintenance report',
        code: 'FETCH_MAINTENANCE_REPORT_ERROR'
      });
    }
  }
);

// Get units report
router.get('/units',
  authenticateToken,
  validateOrganizationAccess,
  [
    query('type').optional().isIn(['BUILDING', 'HOUSE', 'COMMERCIAL'])
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { type } = req.query;
      const organizationId = (req as any).organizationId;

      const where: any = { organizationId };
      if (type) where.type = type;

      const [
        units,
        unitStats,
        propertiesByUnit,
        revenueByUnit
      ] = await Promise.all([
        // Units with basic info
        prisma.unit.findMany({
          where,
          include: {
            properties: {
              include: {
                contracts: {
                  where: { status: 'ACTIVE' },
                  include: {
                    payments: {
                      where: { status: 'PAID' }
                    }
                  }
                }
              }
            }
          }
        }),

        // Unit type statistics
        prisma.unit.groupBy({
          by: ['type'],
          where: { organizationId },
          _count: { type: true }
        }),

        // Properties count by unit
        prisma.property.groupBy({
          by: ['unitId'],
          where: { organizationId, unitId: { not: null } },
          _count: { unitId: true }
        }),

        // Revenue by unit
        prisma.payment.findMany({
          where: {
            organizationId,
            status: 'PAID',
            contract: {
              property: {
                unitId: { not: null }
              }
            }
          },
          include: {
            contract: {
              include: {
                property: {
                  select: { unitId: true }
                }
              }
            }
          }
        })
      ]);

      // Calculate unit performance
      const unitPerformance = units.map(unit => {
        const propertiesCount = propertiesByUnit.find(p => p.unitId === unit.id)?._count.unitId || 0;
        
        // Calculate revenue for this unit
        const unitRevenue = revenueByUnit
          .filter(payment => payment.contract.property.unitId === unit.id)
          .reduce((sum, payment) => sum + payment.amount, 0);

        // Calculate occupancy
        const totalProperties = unit.properties.length;
        const occupiedProperties = unit.properties.filter(p => p.status === 'RENTED').length;
        const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;

        // Calculate average rent
        const averageRent = totalProperties > 0 ? 
          unit.properties.reduce((sum, p) => sum + p.rent, 0) / totalProperties : 0;

        return {
          id: unit.id,
          name: unit.name,
          type: unit.type.toLowerCase(),
          address: unit.address,
          totalFloors: unit.totalFloors,
          floors: unit.floors,
          size: unit.size,
          manager: unit.manager,
          totalProperties,
          occupiedProperties,
          availableProperties: totalProperties - occupiedProperties,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          totalRevenue: unitRevenue,
          averageRent: Math.round(averageRent * 100) / 100,
          amenities: unit.amenities
        };
      });

      // Calculate overall metrics
      const totalUnits = units.length;
      const totalProperties = unitPerformance.reduce((sum, unit) => sum + unit.totalProperties, 0);
      const totalRevenue = unitPerformance.reduce((sum, unit) => sum + unit.totalRevenue, 0);
      const overallOccupancyRate = totalProperties > 0 ? 
        (unitPerformance.reduce((sum, unit) => sum + unit.occupiedProperties, 0) / totalProperties) * 100 : 0;

      return res.json({
        summary: {
          totalUnits,
          totalProperties,
          totalRevenue,
          overallOccupancyRate: Math.round(overallOccupancyRate * 100) / 100,
          averagePropertiesPerUnit: totalUnits > 0 ? Math.round(totalProperties / totalUnits * 100) / 100 : 0
        },
        unitTypeStats: unitStats.map(stat => ({
          type: stat.type.toLowerCase(),
          count: stat._count.type
        })),
        units: unitPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue)
      });
    } catch (error) {
      logger.error('Get units report error:', error);
      return res.status(500).json({
        error: 'Failed to fetch units report',
        code: 'FETCH_UNITS_REPORT_ERROR'
      });
    }
  }
);

// Export data for external reporting
router.get('/export',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  validateOrganizationAccess,
  [
    query('type').isIn(['properties', 'tenants', 'contracts', 'payments', 'maintenance', 'all']).withMessage('Valid export type required'),
    query('format').optional().isIn(['json', 'csv']).withMessage('Valid format required')
  ],
  handleValidationErrors,
  async (req:Request, res:Response) => {
    try {
      const { type, format = 'json' } = req.query;
      const organizationId = (req as any).organizationId;

      let data: any = {};

      if (type === 'all' || type === 'properties') {
        data.properties = await prisma.property.findMany({
          where: { organizationId },
          include: {
            unit: { select: { name: true, type: true } },
            contracts: { include: { tenant: true } }
          }
        });
      }

      if (type === 'all' || type === 'tenants') {
        data.tenants = await prisma.tenant.findMany({
          where: { organizationId },
          include: {
            contracts: { include: { property: true } }
          }
        });
      }

      if (type === 'all' || type === 'contracts') {
        data.contracts = await prisma.contract.findMany({
          where: { organizationId },
          include: {
            property: true,
            tenant: true,
            payments: true
          }
        });
      }

      if (type === 'all' || type === 'payments') {
        data.payments = await prisma.payment.findMany({
          where: { organizationId },
          include: {
            contract: { include: { property: true, tenant: true } }
          }
        });
      }

      if (type === 'all' || type === 'maintenance') {
        data.maintenance = await prisma.maintenanceRequest.findMany({
          where: { organizationId },
          include: {
            property: true,
            tenant: true
          }
        });
      }

      // Set appropriate headers for download
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `rentflow-${type}-export-${timestamp}.${format}`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');

      if (format === 'csv') {
        // For CSV, we'd need to implement CSV conversion
        // For now, return JSON with CSV headers
        res.setHeader('Content-Type', 'application/json');
      }

      logger.info('Data export requested:', { 
        type, 
        format, 
        organizationId,
        recordCount: Object.keys(data).reduce((sum, key) => sum + (data[key]?.length || 0), 0)
      });

      return res.json({
        exportType: type,
        format,
        timestamp: new Date().toISOString(),
        data
      });
    } catch (error) {
      logger.error('Export data error:', error);
      return res.status(500).json({
        error: 'Failed to export data',
        code: 'EXPORT_DATA_ERROR'
      });
    }
  }
);

export default router;