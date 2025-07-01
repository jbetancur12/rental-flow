import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import { Contract, Payment, Property, Tenant } from '../types';


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


export const generatePaymentReceipt = (payment: Payment, tenant: Tenant, property:Property, contract:Contract) => {
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
console.log(">>>", payment)
  const tableHead = [['Descripción', 'Propiedad', 'Método de Pago', 'Monto']];
  const tableBody = [[
    paymentTypeSpanish[payment.type] || payment.type,
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