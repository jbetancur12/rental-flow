import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { validateOrganizationAccess } from '../middleware/validation';

const prisma = new PrismaClient();
const router = Router();

// Listar todas las entradas contables (ingresos y gastos)
router.get('/', authenticateToken, validateOrganizationAccess, async (req, res) => {
  try {
    const organizationId = (req as any).organizationId;
    const { type, from, to, concept } = req.query;
    const where: any = { organizationId };
    if (type && (type === 'INCOME' || type === 'EXPENSE')) where.type = type;
    if (from) where.date = { ...where.date, gte: new Date(from as string) };
    if (to)   where.date = { ...where.date, lte: new Date(to as string) };
    if (concept) where.concept = { contains: concept as string, mode: 'insensitive' };
    const entries = await prisma.accountingEntry.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { property: true, unit: true, contract: true, createdBy: true }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({
      error: 'Error al listar entradas contables',
      details: Object.assign(
        {},
        error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) },
        typeof error === 'object' && error !== null ? error : {}
      )
    });
  }
});

// Crear una nueva entrada contable
router.post('/', authenticateToken, validateOrganizationAccess, async (req, res) => {
  try {
    const organizationId = (req as any).organizationId;
    const userId = (req as any).user?.id;
    const io = req.app.get('io');
    const { type, concept, amount, date, notes, propertyId, unitId, contractId } = req.body;
    if (!type || !concept || !amount || !date) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    if (!organizationId) {
      return res.status(400).json({ error: 'No se encontró organizationId en la sesión o request.' });
    }
    const entry = await prisma.accountingEntry.create({
      data: {
        organizationId,
        type,
        concept,
        amount: Number(amount),
        date: new Date(date),
        notes,
        propertyId,
        unitId,
        contractId,
        createdById: userId
      }
    });
    // Emitir evento socket.io
    if (io) {
      io.to(`org-${organizationId}`).emit('accounting:created', { entry });
    }
    return res.status(201).json(entry);
  } catch (error) {
    return res.status(500).json({
      error: 'Error al crear entrada contable',
      details: Object.assign(
        {},
        error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) },
        typeof error === 'object' && error !== null ? error : {}
      )
    });
  }
});

// Actualizar una entrada contable
router.put('/:id', authenticateToken, validateOrganizationAccess, async (req, res) => {
  try {
    const organizationId = (req as any).organizationId;
    const { id } = req.params;
    const { type, concept, amount, date, notes, propertyId, unitId, contractId } = req.body;
    const entry = await prisma.accountingEntry.update({
      where: { id, organizationId },
      data: {
        type,
        concept,
        amount: amount !== undefined ? Number(amount) : undefined,
        date: date ? new Date(date) : undefined,
        notes,
        propertyId,
        unitId,
        contractId
      }
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({
      error: 'Error al actualizar entrada contable',
      details: Object.assign(
        {},
        error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) },
        typeof error === 'object' && error !== null ? error : {}
      )
    });
  }
});

// Eliminar una entrada contable
router.delete('/:id', authenticateToken, validateOrganizationAccess, async (req, res) => {
  try {
    const organizationId = (req as any).organizationId;
    const { id } = req.params;
    await prisma.accountingEntry.delete({ where: { id, organizationId } });
    res.json({ message: 'Entrada contable eliminada' });
  } catch (error) {
    res.status(500).json({
      error: 'Error al eliminar entrada contable',
      details: Object.assign(
        {},
        error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) },
        typeof error === 'object' && error !== null ? error : {}
      )
    });
  }
});

// Reporte de totales y balance
router.get('/report', authenticateToken, validateOrganizationAccess, async (req, res) => {
  try {
    const organizationId = (req as any).organizationId;
    const { from, to, groupBy } = req.query;
    const where: any = { organizationId };
    if (from) where.date = { ...where.date, gte: new Date(from as string) };
    if (to)   where.date = { ...where.date, lte: new Date(to as string) };

    // Obtener todas las entradas filtradas
    const entries = await prisma.accountingEntry.findMany({ where });

    // Calcular totales
    let totalIngresos = 0;
    let totalGastos = 0;
    for (const entry of entries) {
      if (entry.type === 'INCOME') totalIngresos += entry.amount;
      if (entry.type === 'EXPENSE') totalGastos += entry.amount;
    }
    const balance = totalIngresos - totalGastos;

    // Agrupación opcional por mes o día
    let grouped: any = undefined;
    if (groupBy === 'month' || groupBy === 'day') {
      grouped = {};
      for (const entry of entries) {
        let key = '';
        const date = new Date(entry.date);
        if (groupBy === 'month') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
          key = date.toISOString().slice(0, 10);
        }
        if (!grouped[key]) grouped[key] = { ingresos: 0, gastos: 0 };
        if (entry.type === 'INCOME') grouped[key].ingresos += entry.amount;
        if (entry.type === 'EXPENSE') grouped[key].gastos += entry.amount;
      }
    }

    res.json({ totalIngresos, totalGastos, balance, grouped });
  } catch (error) {
    res.status(500).json({
      error: 'Error al generar el reporte',
      details: Object.assign(
        {},
        error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) },
        typeof error === 'object' && error !== null ? error : {}
      )
    });
  }
});

export default router; 