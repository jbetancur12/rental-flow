// components/tenants/PaymentHistory.tsx

import { Payment } from '../../types';
import { DollarSign, Calendar, Tag, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { formatDateInOrgTimezone } from '../../utils/formatDate';
import { useAuth } from '../../context/AuthContext';
import { OrganizationSettings } from '../../types/auth';

interface PaymentHistoryProps {
  payments: Payment[];
}

// Función para obtener el color y el ícono según el estado del pago
const getPaymentStatusStyle = (status: Payment['status']) => {
  switch (status) {
    case 'PAID':
      return {
        icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
        badge: 'bg-emerald-100 text-emerald-800',
      };
    case 'PENDING':
      return {
        icon: <Clock className="w-4 h-4 text-yellow-600" />,
        badge: 'bg-yellow-100 text-yellow-800',
      };
    case 'OVERDUE':
      return {
        icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
        badge: 'bg-red-100 text-red-800',
      };
    case 'PARTIAL':
      return {
        icon: <CheckCircle className="w-4 h-4 text-blue-600" />,
        badge: 'bg-blue-100 text-blue-800',
      };
    case 'CANCELLED':
      return {
        icon: <AlertTriangle className="w-4 h-4 text-gray-600" />,
        badge: 'bg-gray-100 text-gray-800',
      };
    case 'REFUNDED':
      return {
        icon: <CheckCircle className="w-4 h-4 text-purple-600" />,
        badge: 'bg-purple-100 text-purple-800',
      };
    default:
      return {
        icon: <Clock className="w-4 h-4 text-yellow-600" />,
        badge: 'bg-yellow-100 text-yellow-800',
      };
  }
};

export function PaymentHistory({ payments }: PaymentHistoryProps) {

    const { state: authState } = useAuth();

   const settings = authState.organization?.settings as OrganizationSettings;
  const orgTimezone = settings?.timezone || 'UTC';

  if (!payments || payments.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Historial de Pagos</h3>
        <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-slate-500 dark:text-slate-400">No hay historial de pagos disponible para este inquilino.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Historial de Pagos</h3>
      <div className="space-y-3">
        {payments.map((payment) => {
          const statusStyle = getPaymentStatusStyle(payment.status);
          return (
            <div key={payment.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                {/* Monto */}
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-slate-400 dark:text-slate-300 mr-3" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Monto</p>
                    <p className="font-bold text-slate-900 dark:text-white text-lg">
                      ${payment.amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Fecha */}
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-300 mr-3" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Fecha de Pago</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {payment.paidDate ? formatDateInOrgTimezone(payment.paidDate, orgTimezone) : '-'}

                    </p>
                  </div>
                </div>
                
                {/* Tipo */}
                <div className="flex items-center">
                  <Tag className="w-5 h-5 text-slate-400 dark:text-slate-300 mr-3" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tipo</p>
                    <p className="font-medium text-slate-900 dark:text-white capitalize">
                      {payment.type === 'RENT' && 'Renta'}
                      {payment.type === 'DEPOSIT' && 'Depósito'}
                      {payment.type === 'LATE_FEE' && 'Recargo'}
                      {payment.type === 'UTILITY' && 'Servicio'}
                      {payment.type === 'MAINTENANCE' && 'Mantenimiento'}
                    </p>
                  </div>
                </div>

                {/* Estado */}
                <div className="flex justify-end">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusStyle.badge} dark:bg-opacity-80`}> 
                    {statusStyle.icon}
                    <span className="ml-2">
                      {payment.status === 'PAID' && 'Pagado'}
                      {payment.status === 'PENDING' && 'Pendiente'}
                      {payment.status === 'OVERDUE' && 'Vencido'}
                      {payment.status === 'PARTIAL' && 'Parcial'}
                      {payment.status === 'CANCELLED' && 'Cancelado'}
                      {payment.status === 'REFUNDED' && 'Reembolsado'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}