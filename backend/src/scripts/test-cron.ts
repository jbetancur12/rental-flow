// src/scripts/test-cron.ts
import { logger } from '../config/logger';
import { generatePendingPayments } from '../cron/paymentGenerator';

const runTest = async () => {
  logger.info('--- 🚀 Iniciando prueba manual del cron job ---');
  await generatePendingPayments();
  logger.info('--- ✅ Prueba finalizada ---');
};

runTest()
  .catch((e) => {
    logger.error('La prueba del cron falló:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });