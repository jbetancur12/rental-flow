// src/cron/paymentGenerator.ts

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// VERSIÓN CORREGIDA DE LA FUNCIÓN
export const generatePendingPayments = async () => {
    console.log('▶️  Ejecutando cron job: Verificando pagos por fecha de vencimiento...');

    const activeContracts = await prisma.contract.findMany({
        where: { status: 'ACTIVE' },
        include: { payments: { orderBy: { dueDate: 'desc' } } },
    });

    // Obtenemos la fecha de hoy sin la hora para comparaciones precisas
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const contract of activeContracts) {
        console.log('------', contract.monthlyRent)
        const lastPayment = contract.payments.length > 0     ? contract.payments[0] : null;
        console.log("🚀 ~ generatePendingPayments ~ lastPayment:", lastPayment)

        let nextPeriodStart = (lastPayment && lastPayment.periodEnd)
            ? new Date(lastPayment.periodEnd)
            : new Date(contract.startDate);

        nextPeriodStart.setHours(0, 0, 0, 0);

        const dueDay = new Date(contract.startDate).getDate();

        // Bucle para crear todos los pagos que falten hasta hoy
        while (true) {
            // 1. Calculamos cuál sería la fecha de vencimiento del SIGUIENTE pago
            const nextDueDate = nextPeriodStart;
            if (today < nextDueDate) {
                break;
            }

            
            const paymentExists = contract.payments.some(p => {
                if (!p.periodStart) return false;

                const existingDate = new Date(p.periodStart);
                return existingDate.getFullYear() === nextDueDate.getFullYear() &&
                    existingDate.getMonth() === nextDueDate.getMonth();
            });

            if (!paymentExists) {
                // Calculamos el fin del nuevo período
                const year = nextDueDate.getFullYear();
                const month = nextDueDate.getMonth() + 1;
                let periodEnd = new Date(year, month, dueDay);

                if (periodEnd.getMonth() !== (month % 12)) {
                    periodEnd = new Date(year, month + 1, 0);
                }
                periodEnd.setHours(0, 0, 0, 0);

                console.log(`- Generando pago para contrato ${contract.id.slice(-6)} con período: ${nextDueDate.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`);

                const newPayment = await prisma.payment.create({
                    data: {
                        contractId: contract.id,
                        tenantId: contract.tenantId,
                        organizationId: contract.organizationId,
                        amount: contract.monthlyRent,
                        dueDate: periodEnd,
                        type: 'RENT',
                        status: 'PENDING',
                        notes: 'Generado automáticamente por el sistema.',
                        periodStart: nextDueDate,
                        periodEnd: periodEnd,
                    },
                });

                // Añadimos el nuevo pago a la lista en memoria para la siguiente iteración
                contract.payments.unshift(newPayment);
            }

            // 4. Actualizamos nuestra fecha de partida y continuamos el bucle
            // para ver si faltan aún más meses por generar.
            const year = nextPeriodStart.getFullYear();
            const month = nextPeriodStart.getMonth() + 1;
            nextPeriodStart = new Date(year, month, dueDay);
            if (nextPeriodStart.getMonth() !== (month % 12)) {
                nextPeriodStart = new Date(year, month + 1, 0);
            }
            nextPeriodStart.setHours(0, 0, 0, 0);
        }
    }

    console.log('✅ Cron job finalizado.');
};


// ... (el resto de tu archivo con cron.schedule no necesita cambios)

// Configura el cron para que se ejecute todos los días a la 1:00 AM.
// El formato es: (minuto hora día-del-mes mes día-de-la-semana)
export const startPaymentGeneratorCron = () => {
    cron.schedule('0 1 * * *', generatePendingPayments, {
        timezone: "America/Bogota" // Asegúrate de usar la zona horaria correcta
    });
};