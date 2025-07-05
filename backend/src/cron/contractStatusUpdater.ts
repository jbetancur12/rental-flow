// src/cron/contractStatusUpdater.ts

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export const expireContracts = async () => {
  logger.info('▶️  Ejecutando cron job: Verificando contratos expirados...');

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Para comparar solo con la fecha

  // 1. Encontrar y actualizar todos los contratos activos cuya fecha de fin ya pasó
  const result = await prisma.contract.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        lt: today, // 'lt' significa "less than" (menor que)
      },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  if (result.count > 0) {
    logger.info(`✅ ${result.count} contratos han sido marcados como EXPIRED.`);
    // Opcional: Podrías añadir lógica aquí para liberar las propiedades asociadas.
  } else {
    logger.info('ℹ️  No se encontraron contratos para expirar.');
  }
};

export const startContractStatusCron = () => {
  // Se ejecuta todos los días a las 2:00 AM
  cron.schedule('0 2 * * *', expireContracts, {
    timezone: "America/Bogota",
  });
};