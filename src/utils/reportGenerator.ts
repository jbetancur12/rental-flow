import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Contract, MaintenanceRequest, Payment, Property, Tenant, Unit } from '../types';
import { formatDate } from '../lib/utils';
import { formatInTimeZone } from 'date-fns-tz';

const propertyTypeSpanish = {
  APARTMENT: 'Apartamento',
  HOUSE: 'Casa',
  COMMERCIAL: 'Comercial',
  BUILDING: 'Edificio'
};

const propertyStatusSpanish = {
  AVAILABLE: 'Disponible',
  RENTED: 'Alquilada',
  MAINTENANCE: 'En Mantenimiento',
  RESERVED: 'Reservada',
  SOLD: 'Vendida',
  PENDING: 'Pendiente',
  CANCELLED: 'Cancelada'
};

const unitTypeSpanish = {
  BUILDING: 'Edificio',
  HOUSE: 'Casa',
  COMMERCIAL: 'Comercial'
};

const tenantStatusSpanish = {
  ACTIVE: 'Activo',
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  FORMER: 'Ex-Inquilino',
  REJECTED: 'Rechazado',
};

const paymentStatusSpanish = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  OVERDUE: 'Vencido',
  PARTIAL: 'Parcial',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado'
};

const paymentTypeSpanish = {
  RENT: 'Alquiler',
  DEPOSIT: 'Depósito',
  LATE_FEE: 'Recargo por Mora',
  UTILITY: 'Servicios',
  MAINTENANCE: 'Mantenimiento'
};

const maintenanceStatusSpanish = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado'
};

const maintenancePrioritySpanish = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  EMERGENCY: 'Emergencia'
};


export const generatePropertyReport = async (properties: Property[]) => {
  const pdf = new jsPDF();

  pdf.setFontSize(20);
  pdf.text('Reporte de Propiedades', 14, 22);
  
  pdf.setFontSize(10);
  pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);

  // Resumen
  pdf.setFontSize(12);
  pdf.text('Resumen de Propiedades', 14, 45);
  pdf.setFontSize(10);
  pdf.text(`Total de Propiedades: ${properties.length}`, 14, 52);
  pdf.text(`Disponibles: ${properties.filter(p => p.status === 'AVAILABLE').length}`, 14, 59);
  pdf.text(`Alquiladas: ${properties.filter(p => p.status === 'RENTED').length}`, 14, 66);
  pdf.text(`En Mantenimiento: ${properties.filter(p => p.status === 'MAINTENANCE').length}`, 14, 73);

  // 1. Preparamos los datos para la tabla
  const tableHead = [['#', 'Nombre', 'Dirección', 'Tipo', 'Alquiler', 'Estado']];
  const tableBody = properties.map((property, index) => [
    index + 1,
    property.name,
    property.unitName as string,
    propertyTypeSpanish[property.type] || property.type,
    `$${property.rent.toLocaleString()}`,
    propertyStatusSpanish[property.status] || property.status
  ]);

  // 2. Usamos autoTable para generar la tabla
  autoTable(pdf, {
    head: tableHead,
    body: tableBody,
    startY: 85,
    headStyles: {
      fillColor: [67, 56, 202], // Un morado elegante
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      1: { halign: 'left' },
      2: { halign: 'left' },
      4: { halign: 'right' }
    }
  });

  pdf.save('reporte-propiedades.pdf');
};

// NEW: Unit Report Generator
export const generateUnitReport = async (units: Unit[], properties: Property[]) => {
  const pdf = new jsPDF();

  pdf.setFontSize(20);
  pdf.text('Reporte de Unidades', 14, 22);

  pdf.setFontSize(10);
  pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);

  // Resumen
  pdf.setFontSize(12);
  pdf.text('Resumen de Unidades', 14, 45);
  pdf.setFontSize(10);
  pdf.text(`Total de Unidades: ${units.length}`, 14, 52);
  pdf.text(`Edificios: ${units.filter(u => u.type === 'BUILDING').length}`, 14, 59);
  pdf.text(`Casas: ${units.filter(u => u.type === 'HOUSE').length}`, 14, 66);
  pdf.text(`Comerciales: ${units.filter(u => u.type === 'COMMERCIAL').length}`, 14, 73);

  // 1. Preparamos los datos para la tabla
  const tableHead = [['#', 'Nombre de la Unidad', 'Tipo', 'Dirección', '# Prop.', 'Disp.', 'Ocup.']];
  const tableBody = units.map((unit, index) => {
    const unitProperties = properties.filter(p => p.unitId === unit.id);
    const available = unitProperties.filter(p => p.status === 'AVAILABLE').length;
    const rented = unitProperties.filter(p => p.status === 'RENTED').length;

    return [
      index + 1,
      unit.name,
      unitTypeSpanish[unit.type] || unit.type,
      unit.address,
      unitProperties.length,
      available,
      rented,
    ];
  });

  // 2. Usamos autoTable para generar la tabla
  autoTable(pdf, {
    head: tableHead,
    body: tableBody,
    startY: 85,
    headStyles: {
      fillColor: [100, 116, 139], // Un gris pizarra
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'left' },
      2: { halign: 'center' },
      3: { halign: 'left' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
    }
  });

  pdf.save('reporte-unidades.pdf');
};

export const generateTenantReport = async (tenants: Tenant[]) => {
  const pdf = new jsPDF();
  
  pdf.setFontSize(20);
  pdf.text('Reporte de Inquilinos', 14, 22);
  
  pdf.setFontSize(10);
  pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Resumen
  pdf.setFontSize(12);
  pdf.text('Resumen de Inquilinos', 14, 45);
  pdf.setFontSize(10);
  pdf.text(`Total de Inquilinos: ${tenants.length}`, 14, 52);
  pdf.text(`Activos: ${tenants.filter(t => t.status === 'ACTIVE').length}`, 14, 59);
  pdf.text(`Pendientes: ${tenants.filter(t => t.status === 'PENDING').length}`, 14, 66);

  // 1. Preparamos los datos para la tabla
  const tableHead = [['#', 'Nombre', 'Email', 'Teléfono', 'Estado', 'Ingreso Anual']];
  const tableBody = tenants.map((tenant, index) => [
    index + 1,
    `${tenant.firstName} ${tenant.lastName}`,
    tenant.email,
    tenant.phone,
    tenantStatusSpanish[tenant.status] || tenant.status,
    `$${tenant.employment.income.toLocaleString()}`
  ]);

  // 2. Usamos autoTable para generar la tabla
  autoTable(pdf, {
    head: tableHead,
    body: tableBody,
    startY: 75,
    headStyles: {
      fillColor: [74, 98, 226], // Un azul corporativo
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      halign: 'center'
    },
    columnStyles: {
      1: { halign: 'left' }, // Alinear nombre
      2: { halign: 'left' }, // Alinear email
      5: { halign: 'right' } // Alinear ingreso
    }
  });
  
  pdf.save('reporte-inquilinos.pdf');
};

export const generateFinancialReport = async (
  payments: Payment[], 
  contracts: Contract[],
  tenants: Tenant[],
  properties: Property[]
) => {
  const pdf = new jsPDF();
  
  pdf.setFontSize(20);
  pdf.text('Reporte Financiero', 14, 22);
  
  pdf.setFontSize(10);
  pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // La sección de resumen se mantiene igual
  const totalRevenue = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
  const overduePayments = payments.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0);
  
  pdf.setFontSize(12);
  pdf.text('Resumen Financiero', 14, 45);
  pdf.setFontSize(10);
  pdf.text(`Ingresos Totales (Pagados): $${totalRevenue.toLocaleString()}`, 14, 52);
  pdf.text(`Monto Pendiente: $${pendingPayments.toLocaleString()}`, 14, 59);
  pdf.text(`Monto Vencido: $${overduePayments.toLocaleString()}`, 14, 66);
  pdf.text(`Contratos Activos: ${contracts.filter(c => c.status === 'ACTIVE').length}`, 14, 73);

  // 2. Preparamos los datos para la tabla de transacciones
  const tableHead = [['Fecha', 'Inquilino', 'Propiedad', 'Tipo', 'Monto', 'Estado']];
  const tableBody = payments.map(payment => {
    const contract = contracts.find(c => c.id === payment.contractId);
    const tenantName = tenants.find(t => t.id === payment.tenantId)?.firstName || 'N/A';
    const propertyName = properties.find(p => p.id === contract?.propertyId)?.name || 'N/A';
    const paymentDate = payment.paidDate ? formatInTimeZone(payment.paidDate, 'UTC', 'dd/MM/yyyy') : formatInTimeZone(payment.dueDate, 'UTC', 'dd/MM/yyyy');
    const paymentType = paymentTypeSpanish[payment.type] || payment.type
    return [
      paymentDate,
      tenantName,
      propertyName,
      paymentType,
      `$${payment.amount.toLocaleString()}`,
      paymentStatusSpanish[payment.status] || payment.status
    ];
  });

  // 3. Generamos la tabla con autoTable
  autoTable(pdf, {
    head: tableHead,
    body: tableBody,
    startY: 85,
    headStyles: {
      fillColor: [34, 139, 34], // Un verde financiero
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      halign: 'center',
    },
    columnStyles: {
      1: { halign: 'left' },
      2: { halign: 'left' },
      4: { halign: 'right' },
    }
  });

  pdf.save('reporte-financiero.pdf');
};

export const generateMaintenanceReport = async (
  requests: MaintenanceRequest[], 
  properties: Property[]
) => {
  const pdf = new jsPDF();
  
  pdf.setFontSize(20);
  pdf.text('Reporte de Mantenimiento', 14, 22);
  
  pdf.setFontSize(10);
  pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // La sección de resumen se mantiene igual
  const totalCost = requests.reduce((sum, r) => sum + (r.actualCost || 0), 0);
  pdf.setFontSize(12);
  pdf.text('Resumen de Mantenimiento', 14, 45);
  pdf.setFontSize(10);
  pdf.text(`Total de Solicitudes: ${requests.length}`, 14, 52);
  pdf.text(`Abiertas: ${requests.filter(r => r.status === 'OPEN').length}`, 14, 59);
  pdf.text(`En Progreso: ${requests.filter(r => r.status === 'IN_PROGRESS').length}`, 14, 66);
  pdf.text(`Completadas: ${requests.filter(r => r.status === 'COMPLETED').length}`, 14, 73);
  pdf.text(`Costo Total (Completadas): $${totalCost.toLocaleString()}`, 14, 80);

  // 2. Preparamos los datos para la tabla
  const tableHead = [['#', 'Título', 'Propiedad', 'Prioridad', 'Estado', 'Costo']];
  const tableBody = requests.map((request, index) => {
    const propertyName = properties.find(p => p.id === request.propertyId)?.name || 'N/A';
    const cost = request.actualCost || request.estimatedCost || 0;
    
    return [
      index + 1,
      request.title,
      propertyName,
      maintenancePrioritySpanish[request.priority] || request.priority,
      maintenanceStatusSpanish[request.status] || request.status,
      `$${cost.toLocaleString()}`
    ];
  });

  // 3. Usamos autoTable para generar la tabla automáticamente
  autoTable(pdf, {
    head: tableHead,
    body: tableBody,
    startY: 90, // Posición donde empieza la tabla
    headStyles: {
      fillColor: [41, 128, 185], // Un color de cabecera profesional (azul)
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      halign: 'center',
    },
    columnStyles: {
      1: { halign: 'left' }, // Alinear el título a la izquierda
      2: { halign: 'left' }, // Alinear la propiedad a la izquierda
      5: { halign: 'right' }, // Alinear el costo a la derecha
    }
  });
  
  pdf.save('reporte-mantenimiento.pdf');
};

export const generateContractPDF = async (contract: Contract, property: Property, tenant: Tenant) => {
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(20);
  pdf.text('CONTRATO DE ALQUILER', 105, 30, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(`ID del Contrato: ${contract.id.slice(-8).toUpperCase()}`, 20, 50);
  pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 50);
  
  // Property Information
  pdf.setFontSize(14);
  pdf.text('INFORMACIÓN DE LA PROPIEDAD', 20, 70);
  pdf.setFontSize(10);
  pdf.text(`Propiedad: ${property.name}`, 20, 85);
  pdf.text(`Dirección: ${property.address}`, 20, 95);
  pdf.text(`Tipo: ${property.type}`, 20, 105);
  pdf.text(`Tamaño: ${property.size} m²`, 20, 115);
  
  // Tenant Information
  pdf.setFontSize(14);
  pdf.text('INFORMACIÓN DEL INQUILINO', 20, 135);
  pdf.setFontSize(10);
  pdf.text(`Nombre: ${tenant.firstName} ${tenant.lastName}`, 20, 150);
  pdf.text(`Email: ${tenant.email}`, 20, 160);
  pdf.text(`Teléfono: ${tenant.phone}`, 20, 170);
  
  // Contract Terms
  pdf.setFontSize(14);
  pdf.text('TÉRMINOS DEL CONTRATO', 20, 190);
  pdf.setFontSize(10);
  pdf.text(`Fecha de Inicio: ${contract.startDate.toLocaleDateString()}`, 20, 205);
  pdf.text(`Fecha de Fin: ${contract.endDate.toLocaleDateString()}`, 20, 215);
  pdf.text(`Alquiler Mensual: $${contract.monthlyRent.toLocaleString()}`, 20, 225);
  pdf.text(`Depósito de Seguridad: $${contract.securityDeposit.toLocaleString()}`, 20, 235);
  
  // Terms and Conditions
  if (contract.terms.length > 0) {
    pdf.setFontSize(14);
    pdf.text('TÉRMINOS Y CONDICIONES', 20, 255);
    let yPos = 270;
    contract.terms.forEach((term: string, index: number) => {
      if (yPos > 280) {
        pdf.addPage();
        yPos = 30;
      }
      pdf.setFontSize(10);
      pdf.text(`${index + 1}. ${term}`, 20, yPos);
      yPos += 10;
    });
  }
  
  pdf.save(`contrato-${contract.id.slice(-8)}.pdf`);
};

// NEW: Payment Receipt Generator


export const generatePaymentReceipt = (payment: Payment, tenant: Tenant, property:Property) => {
  const pdf = new jsPDF();

  // --- Colores y Márgenes ---
  const primaryColor = '#4A90E2'; // Un azul moderno
  const secondaryColor = '#F5F5F5'; // Un gris claro para fondos
  const fontColor = '#333333';
  const docWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;

  // --- Encabezado ---
  pdf.setFillColor(primaryColor);
  pdf.rect(0, 0, docWidth, 30, 'F'); // Barra de color superior
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor('#FFFFFF');
  pdf.text('RECIBO DE PAGO', docWidth / 2, 20, { align: 'center' });

  // --- Información del Recibo ---
  pdf.setFontSize(10);
  pdf.setTextColor(fontColor);
  pdf.text(`Recibo #: ${payment.id.slice(-8).toUpperCase()}`, margin, 45);
  pdf.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, docWidth - margin, 45, { align: 'right' });

  // --- Información de las Partes (Cliente y Empresa) ---
  pdf.setDrawColor(secondaryColor);
  pdf.line(margin, 55, docWidth - margin, 55); // Línea divisoria

  pdf.setFont('helvetica', 'bold');
  pdf.text('Pagado Por:', margin, 65);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${tenant.firstName} ${tenant.lastName}`, margin, 72);
  pdf.text(tenant.email, margin, 79);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Pagado A:', docWidth / 2, 65);
  pdf.setFont('helvetica', 'normal');
  pdf.text('RentFlow Gestión Inmobiliaria', docWidth / 2, 72);
  pdf.text('info@rentflow.com', docWidth / 2, 79);

  // --- Tabla de Detalles del Pago ---
  const paymentTypeSpanish = {
    RENT: 'Alquiler',
    DEPOSIT: 'Depósito',
    LATE_FEE: 'Recargo por Mora',
    UTILITY: 'Servicios',
    MAINTENANCE: 'Mantenimiento'
  };
  const paymentMethodSpanish = {
    CASH: 'Efectivo',
    CHECK: 'Cheque',
    BANK_TRANSFER: 'Transferencia',
    ONLINE: 'Pago en Línea'
  };
  const tableHead = [['Descripción', 'Período Cubierto', 'Propiedad', 'Método de Pago', 'Monto']];
  const periodText = (payment.periodStart && payment.periodEnd)
    ? `${formatDate(payment.periodStart)} - ${formatDate(payment.periodEnd)}`
    : formatDate(payment.dueDate);
  const paymentType = paymentTypeSpanish[payment.type] || payment.type

  const tableBody = [[
    paymentType,
    periodText,
    property.name,
    paymentMethodSpanish[payment.method] || payment.method,
    `$${payment.amount.toLocaleString('es-CO')}`
  ]];

  autoTable(pdf, {
    startY: 95,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: '#FFFFFF',
      fontStyle: 'bold'
    },
    styles: {
      halign: 'center'
    },
    columnStyles: {
      3: { halign: 'right' } // Alinear el monto a la derecha
    }
  });

  // --- Resumen y Total ---
  const finalY = (pdf as any).lastAutoTable.finalY;
  const total = payment.amount;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL PAGADO:', docWidth - margin - 75, finalY + 20);
  pdf.setFontSize(16);
  pdf.setTextColor(primaryColor);
  pdf.text(`$${total.toLocaleString('es-CO')}`, docWidth - margin, finalY + 20, { align: 'right' });

  // --- Notas Adicionales ---
  if (payment.notes) {
    pdf.setFontSize(10);
    pdf.setTextColor(fontColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Notas Adicionales:', margin, finalY + 40);
    pdf.setFont('helvetica', 'normal');
    pdf.text(payment.notes, margin, finalY + 47);
  }

  // --- Pie de Página ---
  pdf.setFontSize(8);
  pdf.setTextColor('#AAAAAA');
  const footerText = 'Gracias por su pago. Este es un comprobante generado por computadora.';
  pdf.text(footerText, docWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });

  // --- Guardar el PDF ---
  const fileName = `recibo-pago-${payment.id.slice(-8)}.pdf`;
  pdf.save(fileName);
};

// NEW: Generate receipt for existing payment
export const generateReceiptForPayment = async (paymentId: string, payments: Payment[], tenants: Tenant[], properties: Property[], contracts: Contract[]) => {
  const payment = payments.find(p => p.id === paymentId);
  if (!payment) {
    alert('Pago no encontrado');
    return;
  }
  
  const contract = contracts.find(c => c.id === payment.contractId);
  if (!contract) {
    alert('Contrato no encontrado');
    return;
  }
  
  const tenant = tenants.find(t => t.id === payment.tenantId);
  const property = properties.find(p => p.id === contract.propertyId);
  
  if (!tenant || !property) {
    alert('Información del inquilino o propiedad no encontrada');
    return;
  }
  
  await generatePaymentReceipt(payment, tenant, property);
};