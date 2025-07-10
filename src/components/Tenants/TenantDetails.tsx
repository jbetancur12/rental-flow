
import { Contract, Payment, Property, Tenant } from '../../types';
import { X, User, Mail, Phone, Building, DollarSign, Calendar, Star, FileText } from 'lucide-react';
import { PaymentHistory } from '../Payments/PaymentHistory';
import { generateTenantFinancialStatement } from '../../utils/reportGenerator';
import { formatInTimeZone } from 'date-fns-tz';

interface TenantDetailsProps {
  tenant: Tenant;
  payments: Payment[];
  contracts: Contract[];
  properties: Property[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function TenantDetails({ tenant, isOpen, payments=[],contracts, properties, onClose, onEdit }: TenantDetailsProps) {
  if (!isOpen) return null;

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'text-emerald-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-emerald-100 text-emerald-800',
      FORMER: 'bg-slate-100 text-slate-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.PENDING;
  };

   const handleGenerateStatement = () => {
        // Usamos los datos que ya tenemos para generar el reporte específico
        generateTenantFinancialStatement(tenant, contracts, payments, properties);
    };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {tenant.firstName} {tenant.lastName}
              </h2>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(tenant.status)} dark:bg-opacity-80`}>
                {tenant.status === 'PENDING' && 'Pendiente'}
                {tenant.status === 'APPROVED' && 'Aprobado'}
                {tenant.status === 'ACTIVE' && 'Activo'}
                {tenant.status === 'FORMER' && 'Anterior'}
                {tenant.status === 'REJECTED' && 'Rechazado'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
                    onClick={handleGenerateStatement}
                    className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors text-sm"
                >
                    <FileText className="w-4 h-4 mr-2" />
                    Estado de Cuenta
                </button>

            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            >
              Editar Inquilino
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-slate-400 dark:text-slate-300 mr-3" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Correo Electrónico</p>
                  <p className="font-medium text-slate-900 dark:text-white">{tenant.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-slate-400 dark:text-slate-300 mr-3" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Teléfono</p>
                  <p className="font-medium text-slate-900 dark:text-white">{tenant.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Información Laboral</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <Building className="w-5 h-5 text-slate-400 dark:text-slate-300 mr-3" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Empleador</p>
                  <p className="font-medium text-slate-900 dark:text-white">{tenant.employment.employer}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Puesto</p>
                <p className="font-medium text-slate-900 dark:text-white">{tenant.employment.position}</p>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-slate-400 dark:text-slate-300 mr-3" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Ingreso Anual</p>
                  <p className="font-medium text-slate-900 dark:text-white">${tenant.employment.income.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Contacto de Emergencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Nombre</p>
                <p className="font-medium text-slate-900 dark:text-white">{tenant.emergencyContact.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Teléfono</p>
                <p className="font-medium text-slate-900 dark:text-white">{tenant.emergencyContact.phone}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Parentesco</p>
                <p className="font-medium text-slate-900 dark:text-white">{tenant.emergencyContact.relationship}</p>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Detalles de la Aplicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-300 mr-3" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Fecha de Aplicación</p>
                  <p className="font-medium text-slate-900 dark:text-white">{formatInTimeZone(tenant.applicationDate, 'UTC', 'MMM d, yyyy')}</p>
                </div>
              </div>
              {tenant.creditScore && (
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-slate-400 dark:text-slate-300 mr-3" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Puntaje de Crédito</p>
                    <p className={`font-medium ${getCreditScoreColor(tenant.creditScore)} dark:text-yellow-400`}> {/* Mantener color personalizado para score alto */}
                      {tenant.creditScore}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment History*/}
          <PaymentHistory payments={payments} />

          {/* References */}
          {tenant.references.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Referencias</h3>
              <div className="space-y-4">
                {tenant.references.map((reference) => (
                  <div key={reference.id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Nombre</p>
                        <p className="font-medium text-slate-900 dark:text-white">{reference.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Parentesco</p>
                        <p className="font-medium text-slate-900 dark:text-white">{reference.relationship}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Teléfono</p>
                        <p className="font-medium text-slate-900 dark:text-white">{reference.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Correo Electrónico</p>
                        <p className="font-medium text-slate-900 dark:text-white">{reference.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}