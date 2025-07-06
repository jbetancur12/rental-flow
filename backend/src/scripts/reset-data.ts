// src/scripts/reset-data.ts

import { logger } from '../config/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  logger.info('🔴 Iniciando el proceso para vaciar las tablas...');
  logger.info('ADVERTENCIA: Esta acción es destructiva y no se puede deshacer.');

  // El orden es importante para evitar errores de llaves foráneas.
  // Se eliminan primero las tablas que dependen de otras.

 logger.info('Borrando pagos...');
await prisma.payment.deleteMany({});

logger.info('Borrando contratos...');
await prisma.contract.deleteMany({});

logger.info('Borrando propiedades...');
await prisma.property.deleteMany({});

logger.info('Borrando inquilinos...');
await prisma.tenant.deleteMany({});

logger.info('Borrando unidades...');
await prisma.unit.deleteMany({});

logger.info('Borrando suscripciones...');
await prisma.subscription.deleteMany({});

logger.info('Borrando usuarios...');
await prisma.user.deleteMany({});

logger.info('Borrando organizaciones...');
await prisma.organization.deleteMany({});

logger.info('Borrando Logs');
await prisma.activityLog.deleteMany();

logger.info('Borrando Plans');
await prisma.plan.deleteMany();

  logger.info('✅ Proceso completado. Todas las tablas especificadas están vacías.');
}

main()
  .catch((e) => {
    logger.error('Ocurrió un error durante el reseteo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });