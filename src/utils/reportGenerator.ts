import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePropertyReport = async (properties: any[]) => {
  const pdf = new jsPDF();
  
  // Title
  pdf.setFontSize(20);
  pdf.text('Reporte de Propiedades', 20, 30);
  
  // Date
  pdf.setFontSize(12);
  pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 45);
  
  // Summary
  pdf.setFontSize(14);
  pdf.text('Resumen', 20, 65);
  pdf.setFontSize(10);
  pdf.text(`Total de Propiedades: ${properties.length}`, 20, 80);
  pdf.text(`Disponibles: ${properties.filter(p => p.status === 'available').length}`, 20, 90);
  pdf.text(`Alquiladas: ${properties.filter(p => p.status === 'rented').length}`, 20, 100);
  pdf.text(`En Mantenimiento: ${properties.filter(p => p.status === 'maintenance').length}`, 20, 110);
  
  // Property details
  let yPosition = 130;
  pdf.setFontSize(14);
  pdf.text('Detalles de Propiedades', 20, yPosition);
  yPosition += 15;
  
  properties.forEach((property, index) => {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 30;
    }
    
    pdf.setFontSize(10);
    pdf.text(`${index + 1}. ${property.name}`, 20, yPosition);
    pdf.text(`Dirección: ${property.address}`, 30, yPosition + 10);
    pdf.text(`Tipo: ${property.type}`, 30, yPosition + 20);
    pdf.text(`Alquiler: $${property.rent.toLocaleString()}`, 30, yPosition + 30);
    pdf.text(`Estado: ${property.status}`, 30, yPosition + 40);
    yPosition += 55;
  });
  
  pdf.save('reporte-propiedades.pdf');
};

// NEW: Unit Report Generator
export const generateUnitReport = async (units: any[], properties: any[]) => {
  const pdf = new jsPDF();
  
  pdf.setFontSize(20);
  pdf.text('Reporte de Unidades', 20, 30);
  
  pdf.setFontSize(12);
  pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 45);
  
  pdf.setFontSize(14);
  pdf.text('Resumen', 20, 65);
  pdf.setFontSize(10);
  pdf.text(`Total de Unidades: ${units.length}`, 20, 80);
  pdf.text(`Edificios: ${units.filter(u => u.type === 'building').length}`, 20, 90);
  pdf.text(`Casas: ${units.filter(u => u.type === 'house').length}`, 20, 100);
  pdf.text(`Comerciales: ${units.filter(u => u.type === 'commercial').length}`, 20, 110);
  
  let yPosition = 130;
  pdf.setFontSize(14);
  pdf.text('Detalles de Unidades', 20, yPosition);
  yPosition += 15;
  
  units.forEach((unit, index) => {
    if (yPosition > 240) {
      pdf.addPage();
      yPosition = 30;
    }
    
    const unitProperties = properties.filter(p => p.unitId === unit.id);
    
    pdf.setFontSize(12);
    pdf.text(`${index + 1}. ${unit.name}`, 20, yPosition);
    pdf.setFontSize(10);
    pdf.text(`Tipo: ${unit.type}`, 30, yPosition + 10);
    pdf.text(`Dirección: ${unit.address}`, 30, yPosition + 20);
    pdf.text(`Propiedades: ${unitProperties.length}`, 30, yPosition + 30);
    pdf.text(`Disponibles: ${unitProperties.filter(p => p.status === 'available').length}`, 30, yPosition + 40);
    pdf.text(`Alquiladas: ${unitProperties.filter(p => p.status === 'rented').length}`, 30, yPosition + 50);
    yPosition += 65;
  });
  
  pdf.save('reporte-unidades.pdf');
};

export const generateTenantReport = async (tenants: any[]) => {
  const pdf = new jsPDF();
  
  pdf.setFontSize(20);
  pdf.text('Reporte de Inquilinos', 20, 30);
  
  pdf.setFontSize(12);
  pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 45);
  
  pdf.setFontSize(14);
  pdf.text('Resumen', 20, 65);
  pdf.setFontSize(10);
  pdf.text(`Total de Inquilinos: ${tenants.length}`, 20, 80);
  pdf.text(`Activos: ${tenants.filter(t => t.status === 'active').length}`, 20, 90);
  pdf.text(`Pendientes: ${tenants.filter(t => t.status === 'pending').length}`, 20, 100);
  
  let yPosition = 120;
  pdf.setFontSize(14);
  pdf.text('Detalles de Inquilinos', 20, yPosition);
  yPosition += 15;
  
  tenants.forEach((tenant, index) => {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 30;
    }
    
    pdf.setFontSize(10);
    pdf.text(`${index + 1}. ${tenant.firstName} ${tenant.lastName}`, 20, yPosition);
    pdf.text(`Email: ${tenant.email}`, 30, yPosition + 10);
    pdf.text(`Teléfono: ${tenant.phone}`, 30, yPosition + 20);
    pdf.text(`Estado: ${tenant.status}`, 30, yPosition + 30);
    pdf.text(`Ingresos: $${tenant.employment.income.toLocaleString()}`, 30, yPosition + 40);
    yPosition += 55;
  });
  
  pdf.save('reporte-inquilinos.pdf');
};

export const generateFinancialReport = async (payments: any[], contracts: any[]) => {
  const pdf = new jsPDF();
  
  pdf.setFontSize(20);
  pdf.text('Reporte Financiero', 20, 30);
  
  pdf.setFontSize(12);
  pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 45);
  
  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const overduePayments = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
  
  pdf.setFontSize(14);
  pdf.text('Resumen Financiero', 20, 65);
  pdf.setFontSize(10);
  pdf.text(`Ingresos Totales: $${totalRevenue.toLocaleString()}`, 20, 80);
  pdf.text(`Pagos Pendientes: $${pendingPayments.toLocaleString()}`, 20, 90);
  pdf.text(`Pagos Vencidos: $${overduePayments.toLocaleString()}`, 20, 100);
  pdf.text(`Contratos Activos: ${contracts.filter(c => c.status === 'active').length}`, 20, 110);
  
  pdf.save('reporte-financiero.pdf');
};

export const generateMaintenanceReport = async (requests: any[]) => {
  const pdf = new jsPDF();
  
  pdf.setFontSize(20);
  pdf.text('Reporte de Mantenimiento', 20, 30);
  
  pdf.setFontSize(12);
  pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 45);
  
  const totalCost = requests.reduce((sum, r) => sum + (r.actualCost || r.estimatedCost || 0), 0);
  
  pdf.setFontSize(14);
  pdf.text('Resumen de Mantenimiento', 20, 65);
  pdf.setFontSize(10);
  pdf.text(`Total de Solicitudes: ${requests.length}`, 20, 80);
  pdf.text(`Abiertas: ${requests.filter(r => r.status === 'open').length}`, 20, 90);
  pdf.text(`En Progreso: ${requests.filter(r => r.status === 'in_progress').length}`, 20, 100);
  pdf.text(`Completadas: ${requests.filter(r => r.status === 'completed').length}`, 20, 110);
  pdf.text(`Costo Total: $${totalCost.toLocaleString()}`, 20, 120);
  
  let yPosition = 140;
  pdf.setFontSize(14);
  pdf.text('Detalles de Solicitudes', 20, yPosition);
  yPosition += 15;
  
  requests.forEach((request, index) => {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 30;
    }
    
    pdf.setFontSize(10);
    pdf.text(`${index + 1}. ${request.title}`, 20, yPosition);
    pdf.text(`Prioridad: ${request.priority}`, 30, yPosition + 10);
    pdf.text(`Estado: ${request.status}`, 30, yPosition + 20);
    pdf.text(`Costo: $${(request.actualCost || request.estimatedCost || 0).toLocaleString()}`, 30, yPosition + 30);
    yPosition += 45;
  });
  
  pdf.save('reporte-mantenimiento.pdf');
};

export const generateContractPDF = async (contract: any, property: any, tenant: any) => {
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
export const generatePaymentReceipt = async (payment: any, tenant: any, property: any, contract: any) => {
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(20);
  pdf.text('COMPROBANTE DE PAGO', 105, 30, { align: 'center' });
  
  // Receipt Info
  pdf.setFontSize(12);
  pdf.text(`Recibo #: ${payment.id.slice(-8).toUpperCase()}`, 20, 50);
  pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 50);
  
  // Company Info (Header)
  pdf.setFontSize(14);
  pdf.text('RentFlow Gestión de Propiedades', 20, 70);
  pdf.setFontSize(10);
  pdf.text('123 Calle Principal, Ciudad, Estado 12345', 20, 80);
  pdf.text('Teléfono: (555) 123-4567 | Email: info@rentflow.com', 20, 90);
  
  // Divider line
  pdf.line(20, 100, 190, 100);
  
  // Payment Details
  pdf.setFontSize(14);
  pdf.text('DETALLES DEL PAGO', 20, 115);
  
  pdf.setFontSize(10);
  pdf.text(`Inquilino: ${tenant.firstName} ${tenant.lastName}`, 20, 130);
  pdf.text(`Email: ${tenant.email}`, 20, 140);
  pdf.text(`Teléfono: ${tenant.phone}`, 20, 150);
  
  pdf.text(`Propiedad: ${property.name}`, 20, 165);
  pdf.text(`Dirección: ${property.address}`, 20, 175);
  
  // Payment Info
  pdf.setFontSize(12);
  pdf.text('INFORMACIÓN DEL PAGO', 20, 195);
  pdf.setFontSize(10);
  
  const paymentTypeSpanish = {
    rent: 'Alquiler',
    deposit: 'Depósito',
    late_fee: 'Recargo por Mora',
    utility: 'Servicios',
    maintenance: 'Mantenimiento'
  };
  
  const paymentMethodSpanish = {
    cash: 'Efectivo',
    check: 'Cheque',
    bank_transfer: 'Transferencia Bancaria',
    online: 'Pago en Línea'
  };
  
  pdf.text(`Concepto: ${paymentTypeSpanish[payment.type as keyof typeof paymentTypeSpanish] || payment.type}`, 20, 210);
  pdf.text(`Monto: $${payment.amount.toLocaleString()}`, 20, 220);
  pdf.text(`Fecha de Vencimiento: ${payment.dueDate.toLocaleDateString()}`, 20, 230);
  
  if (payment.paidDate) {
    pdf.text(`Fecha de Pago: ${payment.paidDate.toLocaleDateString()}`, 20, 240);
  }
  
  if (payment.method) {
    pdf.text(`Método de Pago: ${paymentMethodSpanish[payment.method as keyof typeof paymentMethodSpanish] || payment.method}`, 20, 250);
  }
  
  if (payment.notes) {
    pdf.text(`Notas: ${payment.notes}`, 20, 260);
  }
  
  // Total Box
  pdf.setFontSize(14);
  pdf.rect(120, 200, 60, 30);
  pdf.text('TOTAL PAGADO', 125, 215);
  pdf.setFontSize(16);
  pdf.text(`$${payment.amount.toLocaleString()}`, 125, 225);
  
  // Footer
  pdf.setFontSize(8);
  pdf.text('Gracias por su pago puntual. Conserve este comprobante para sus registros.', 105, 280, { align: 'center' });
  
  const fileName = `comprobante-pago-${payment.id.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

// NEW: Generate receipt for existing payment
export const generateReceiptForPayment = async (paymentId: string, payments: any[], tenants: any[], properties: any[], contracts: any[]) => {
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
  
  await generatePaymentReceipt(payment, tenant, property, contract);
};