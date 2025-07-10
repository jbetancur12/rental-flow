import { Tenant } from '../../types';
import { useApp } from '../../context/useApp';
import { User, Mail, Phone, DollarSign, Calendar, AlertTriangle, CreditCard, Edit, Eye, Trash2 } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';

interface TenantCardProps {
  tenant: Tenant;
  onEdit: (tenant: Tenant) => void;
  onView: (tenant: Tenant) => void;
  onDelete: (id: string) => void;
  onCollectPayment?: (tenant: Tenant) => void;
}

export function TenantCard({ tenant, onEdit, onView, onDelete, onCollectPayment }: TenantCardProps) {
  const { contracts, payments, properties } = useApp();

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

  // Get tenant's active contract and overdue payments
  const activeContract = contracts.find(c => 
    c.tenantId === tenant.id && c.status === 'ACTIVE'
  );

  const overduePayments = payments.filter(p => 
    p.tenantId === tenant.id && 
    p.status === 'PENDING' && 
    new Date(p.dueDate) < new Date()
  );

  const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);

  // Get property name
  const property = activeContract ? 
    properties.find(p => p.id === activeContract.propertyId) : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
      {/* Header with alerts */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
            <User className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {tenant.firstName} {tenant.lastName}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tenant.status)} dark:bg-opacity-80` }>
                {tenant.status === 'PENDING' && 'Pendiente'}
                {tenant.status === 'APPROVED' && 'Aprobado'}
                {tenant.status === 'ACTIVE' && 'Activo'}
                {tenant.status === 'FORMER' && 'Anterior'}
                {tenant.status === 'REJECTED' && 'Rechazado'}
              </span>
              {overduePayments.length > 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {overduePayments.length} Vencido(s)
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => onView(tenant)}
            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onEdit(tenant)}
            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(tenant.id)}
            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overdue Payment Alert */}
      {totalOverdue > 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 text-red-600 dark:text-red-200 mr-2" />
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                Alerta de Pago Vencido
              </span>
            </div>
            <span className="text-sm font-bold text-red-800 dark:text-red-200">
              ${totalOverdue.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
            {overduePayments.length} pago{overduePayments.length > 1 ? 's' : ''} vencido
          </p>
        </div>
      )}

      {/* Contact Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-slate-600 dark:text-slate-300">
          <Mail className="w-4 h-4 mr-3" />
          <span className="text-sm">{tenant.email}</span>
        </div>
        <div className="flex items-center text-slate-600 dark:text-slate-300">
          <Phone className="w-4 h-4 mr-3" />
          <span className="text-sm">{tenant.phone}</span>
        </div>
        <div className="flex items-center text-slate-600 dark:text-slate-300">
          <DollarSign className="w-4 h-4 mr-3" />
          <span className="text-sm">Ingreso: ${tenant.employment.income.toLocaleString()}/año</span>
        </div>
        <div className="flex items-center text-slate-600 dark:text-slate-300">
          <Calendar className="w-4 h-4 mr-3" />
          <span className="text-sm">Aplicó: {formatInTimeZone(tenant.applicationDate, 'UTC', 'd MMM yyyy')}</span>
        </div>
      </div>

      {/* Current Property (if active) */}
      {property && tenant.status === 'ACTIVE' && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Propiedad Actual</p>
          <p className="text-sm text-blue-800 dark:text-blue-200">{property.name}</p>
          <p className="text-xs text-blue-700 dark:text-blue-300">{property.address}</p>
        </div>
      )}

      {/* Employment Info */}
      <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Empleador:</span>
            <p className="font-medium text-slate-900 dark:text-white">{tenant.employment.employer}</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Puesto:</span>
            <p className="font-medium text-slate-900 dark:text-white">{tenant.employment.position}</p>
          </div>
        </div>
      </div>

      {/* Credit Score */}
      {tenant.creditScore && (
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-300">Puntaje de Crédito</span>
            <span className={`text-sm font-medium ${
              tenant.creditScore >= 750 ? 'text-emerald-600 dark:text-emerald-400' :
              tenant.creditScore >= 650 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {tenant.creditScore}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex space-x-2">
        {overduePayments.length > 0 ? (
          <button 
            onClick={() => onCollectPayment && onCollectPayment(tenant)}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors text-sm font-medium"
          >
            Cobrar Pago
          </button>
        ) : (
          <button 
            onClick={() => onView(tenant)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm"
          >
            Ver Detalles
          </button>
        )}
        <button className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-sm">
          Contactar
        </button>
      </div>
    </div>
  );
}