import cron from 'node-cron';
import { PrismaClient, PaymentType, PaymentStatus } from '@prisma/client';
import { logger } from '../config/logger'


const prisma = new PrismaClient();

export const generatePendingPayments = async () => {
  logger.info('▶️  Ejecutando cron job: Verificando y generando pagos pendientes...');

  const activeContracts = await prisma.contract.findMany({
    where: { status: 'ACTIVE' },
    include: { payments: true },
  });

  // La fecha de hoy, normalizada a medianoche UTC para comparaciones seguras.
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  
  const paymentsToCreate = [];

  // Iteramos contrato por contrato.
  for (const contract of activeContracts) {
    const periodToGenerate = new Date(contract.startDate);
    const contractEndDate = new Date(contract.endDate);
    
    // Bucle que avanza mes a mes desde el inicio del contrato hasta hoy.
    while (periodToGenerate <= todayUTC && periodToGenerate <= contractEndDate) {
      
      const year = periodToGenerate.getUTCFullYear();
      const month = periodToGenerate.getUTCMonth();
      
      // ¿Existe ya un pago VÁLIDO para este período (mes y año)?
      const validPaymentExists = contract.payments.some(p => {
        const paymentPeriodDate = new Date(p.periodStart!);
        const terminalStatuses: PaymentStatus[] = ['CANCELLED', 'REFUNDED'];

        return (
          paymentPeriodDate.getUTCFullYear() === year &&
          paymentPeriodDate.getUTCMonth() === month &&
          !terminalStatuses.includes(p.status)
        );
      });

      // Si no existe, preparamos uno nuevo para ser creado.
      if (!validPaymentExists) {
        const startDate = new Date(periodToGenerate);
        
        // El fin del período es el día anterior al mismo día del mes siguiente.
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1);

        logger.info(`- Preparando pago para contrato ${contract.id.slice(-6)} para el período: ${startDate.toLocaleDateString()}`);

        paymentsToCreate.push({
          contractId: contract.id,
          tenantId: contract.tenantId,
          organizationId: contract.organizationId,
          amount: contract.monthlyRent,
          dueDate: startDate, // El pago se vence al inicio del período.
          type: 'RENT' as PaymentType,
          status: 'PENDING' as PaymentStatus,
          notes: 'Generado automáticamente por el sistema.',
          periodStart: startDate,
          periodEnd: endDate,
        });
      }      
      // Avanzamos al siguiente mes para seguir verificando.
      periodToGenerate.setMonth(periodToGenerate.getMonth() + 1);
    }
  }

  // Al final, creamos todos los pagos necesarios en una sola operación eficiente.
  if (paymentsToCreate.length > 0) {
    logger.info(`✨ Generando ${paymentsToCreate.length} nuevo(s) pago(s)...`);
    await prisma.payment.createMany({
      data: paymentsToCreate,
    });
  } else {
    logger.info('👍 No se necesitaron generar nuevos pagos.');
  }

  logger.info('✅ Cron job finalizado.');
};

// ... (tu función para iniciar el cron no necesita cambios)
export const startPaymentGeneratorCron = () => {
    cron.schedule('0 1 * * *', generatePendingPayments, {
        timezone: "America/Bogota"
    });
};