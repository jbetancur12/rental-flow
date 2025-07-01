// src/scripts/test-cron.ts
import { generatePendingPayments } from '../cron/paymentGenerator';

const runTest = async () => {
  console.log('--- 🚀 Iniciando prueba manual del cron job ---');
  await generatePendingPayments();
  console.log('--- ✅ Prueba finalizada ---');
};

runTest()
  .catch((e) => {
    console.error('La prueba del cron falló:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });