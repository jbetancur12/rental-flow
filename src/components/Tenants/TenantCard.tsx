import { Tenant } from '../../types';
import { useApp } from '../../context/useApp';
import { User, Mail, Phone, DollarSign, Calendar, AlertTriangle, CreditCard, Edit, Eye, Trash2 } from 'lucide-react';

interface TenantCardProps {
  tenant: Tenant;
  onEdit: (tenant: Tenant) => void;
  onView: (tenant: Tenant) => void;
  onDelete: (id: string) => void;
  onCollectPayment?: (tenant: Tenant) => void;
}

export function TenantCard({ tenant, onEdit, onView, onDelete, onCollectPayment }: TenantCardProps) {
  const { state } = useApp();

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
  const activeContract = state.contracts.find(c => 
    c.tenantId === tenant.id && c.status === 'ACTIVE'
  );

  const overduePayments = state.payments.filter(p => 
    p.tenantId === tenant.id && 
    p.status === 'PENDING' && 
    new Date(p.dueDate) < new Date()
  );

  const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);

  // Get property name
  const property = activeContract ? 
    state.properties.find(p => p.id === activeContract.propertyId) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header with alerts */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {tenant.firstName} {tenant.lastName}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
              </span>
              {overduePayments.length > 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {overduePayments.length} Overdue
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => onView(tenant)}
            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onEdit(tenant)}
            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(tenant.id)}
            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overdue Payment Alert */}
      {totalOverdue > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-800">
                Overdue Payment Alert
              </span>
            </div>
            <span className="text-sm font-bold text-red-800">
              ${totalOverdue.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-red-700 mt-1">
            {overduePayments.length} payment{overduePayments.length > 1 ? 's' : ''} overdue
          </p>
        </div>
      )}

      {/* Contact Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-slate-600">
          <Mail className="w-4 h-4 mr-3" />
          <span className="text-sm">{tenant.email}</span>
        </div>
        <div className="flex items-center text-slate-600">
          <Phone className="w-4 h-4 mr-3" />
          <span className="text-sm">{tenant.phone}</span>
        </div>
        <div className="flex items-center text-slate-600">
          <DollarSign className="w-4 h-4 mr-3" />
          <span className="text-sm">Income: ${tenant.employment.income.toLocaleString()}/year</span>
        </div>
        <div className="flex items-center text-slate-600">
          <Calendar className="w-4 h-4 mr-3" />
          <span className="text-sm">Applied: {new Date(tenant.applicationDate).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Current Property (if active) */}
      {property && tenant.status === 'ACTIVE' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-900">Current Property</p>
          <p className="text-sm text-blue-800">{property.name}</p>
          <p className="text-xs text-blue-700">{property.address}</p>
        </div>
      )}

      {/* Employment Info */}
      <div className="border-t border-slate-100 pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Employer:</span>
            <p className="font-medium text-slate-900">{tenant.employment.employer}</p>
          </div>
          <div>
            <span className="text-slate-500">Position:</span>
            <p className="font-medium text-slate-900">{tenant.employment.position}</p>
          </div>
        </div>
      </div>

      {/* Credit Score */}
      {tenant.creditScore && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Credit Score</span>
            <span className={`text-sm font-medium ${
              tenant.creditScore >= 750 ? 'text-emerald-600' :
              tenant.creditScore >= 650 ? 'text-yellow-600' : 'text-red-600'
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
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Collect Payment
          </button>
        ) : (
          <button 
            onClick={() => onView(tenant)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            View Details
          </button>
        )}
        <button className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm">
          Contact
        </button>
      </div>
    </div>
  );
}