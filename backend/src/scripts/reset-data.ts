// src/scripts/reset-data.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔴 Iniciando el proceso para vaciar las tablas...');
  console.log('ADVERTENCIA: Esta acción es destructiva y no se puede deshacer.');

  // El orden es importante para evitar errores de llaves foráneas.
  // Se eliminan primero las tablas que dependen de otras.

 console.log('Borrando pagos...');
await prisma.payment.deleteMany({});

console.log('Borrando contratos...');
await prisma.contract.deleteMany({});

console.log('Borrando propiedades...');
await prisma.property.deleteMany({});

console.log('Borrando inquilinos...');
await prisma.tenant.deleteMany({});

console.log('Borrando unidades...');
await prisma.unit.deleteMany({});

console.log('Borrando suscripciones...');
await prisma.subscription.deleteMany({});

console.log('Borrando usuarios...');
await prisma.user.deleteMany({});

console.log('Borrando organizaciones...');
await prisma.organization.deleteMany({});

  console.log('✅ Proceso completado. Todas las tablas especificadas están vacías.');
}

main()
  .catch((e) => {
    console.error('Ocurrió un error durante el reseteo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });