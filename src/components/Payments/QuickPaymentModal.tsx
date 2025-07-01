import React, { useState, useMemo } from 'react';
import { Payment, Contract, Tenant } from '../../types';
import { useApp } from '../../context/AppContext';
import { CheckCircle, X } from 'lucide-react';

const formatDate = (dateString: string | Date) => {
  return new Date(dateString).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

interface QuickPaymentModalProps {
  tenant?: Tenant;
  contract?: Contract;
  overduePayments?: Payment[];
  isOpen: boolean;
  onClose: () => void;
}

export function QuickPaymentModal({ tenant, contract, overduePayments = [], isOpen, onClose }: QuickPaymentModalProps) {
  const { updatePayment } = useApp();

  // Guarda los IDs de los pagos seleccionados. Por defecto, todos están seleccionados.
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>(
    overduePayments.map(p => p.id)
  );

  const [paymentDetails, setPaymentDetails] = useState({
    method: 'BANK_TRANSFER' as Payment['method'],
    paidDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // El monto total se calcula basado en la selección
  const totalAmount = useMemo(() => {
    return overduePayments
      .filter(p => selectedPaymentIds.includes(p.id))
      .reduce((sum, p) => sum + p.amount, 0);
  }, [selectedPaymentIds, overduePayments]);

  const handleTogglePayment = (paymentId: string) => {
    setSelectedPaymentIds(prevIds =>
      prevIds.includes(paymentId)
        ? prevIds.filter(id => id !== paymentId)
        : [...prevIds, paymentId]
    );
  };

  const handleRecordPayment = async () => {
    if (selectedPaymentIds.length === 0) {
      alert('Please select at least one payment to record.');
      return;
    }

    const paymentsToUpdate = overduePayments.filter(p => selectedPaymentIds.includes(p.id));

    for (const payment of paymentsToUpdate) {
      await updatePayment(payment.id, {
        status: 'PAID',
        paidDate: new Date(paymentDetails.paidDate),
        method: paymentDetails.method,
        notes: paymentDetails.notes,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  const noPaymentsDue = overduePayments.length === 0;


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Registrar Pago</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {tenant && (
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="font-medium text-blue-900">{tenant.firstName} {tenant.lastName}</p>
              <p className="text-sm text-blue-700">{tenant.email}</p>
            </div>
          )}

          {/* --- 👇 INICIO DEL CAMBIO --- */}
          {noPaymentsDue ? (
            // Si no hay pagos, muestra este mensaje
            <div className="text-center py-8 px-4 bg-slate-50 rounded-lg">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-800">Todo al día</h3>
              <p className="text-slate-500 mt-1">No hay períodos pendientes de pago para este inquilino.</p>
            </div>
          ) : (
            // Si hay pagos, muestra el formulario completo
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Períodos a Pagar
                </label>
                <div className="border rounded-lg bg-white">
                  {overduePayments.map((payment, index) => (
                    <div key={payment.id} className={`flex items-center p-3 space-x-3 ${index < overduePayments.length - 1 ? 'border-b' : ''}`}>
                      <input
                        type="checkbox"
                        id={`payment-${payment.id}`}
                        checked={selectedPaymentIds.includes(payment.id)}
                        onChange={() => handleTogglePayment(payment.id)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor={`payment-${payment.id}`} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-800">
                            {payment.periodStart ? formatDate(payment.periodStart) : 'N/A'} - {payment.periodEnd ? formatDate(payment.periodEnd) : 'N/A'}
                          </span>
                          <span className="font-semibold text-slate-900">
                            ${payment.amount.toLocaleString('es-CO')}
                          </span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Monto Total a Pagar ($)</label>
                <input
                  type="text"
                  readOnly
                  value={`$${totalAmount.toLocaleString('es-CO')}`}
                  className="w-full px-3 py-2 border bg-slate-50 border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Método de Pago</label>
                <select
                  value={paymentDetails.method}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, method: e.target.value as Payment['method'] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BANK_TRANSFER">Transferencia</option>
                  <option value="CHECK">Cheque</option>
                  <option value="CASH">Efectivo</option>
                  <option value="ONLINE">Pago en Línea</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de Pago</label>
                <input
                  type="date"
                  value={paymentDetails.paidDate}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, paidDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notas (Opcional)</label>
                <textarea
                  value={paymentDetails.notes}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Notas del pago..."
                />
              </div>
            </>
          )}
          {/* --- FIN DEL CAMBIO --- */}
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-800">
            Cancelar
          </button>
          <button
            onClick={handleRecordPayment}
            // El botón se deshabilita si no hay pagos o si no hay ninguno seleccionado
            disabled={noPaymentsDue || selectedPaymentIds.length === 0}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Registrar Pago
          </button>
        </div>
      </div>
    </div>)
}