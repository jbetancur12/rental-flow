import { useState, useEffect } from 'react';
import { Payment, Contract, Tenant } from '../../types';
import { X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface PaymentFormProps {
  payment?: Payment;
  contracts: Contract[];
  tenants: Tenant[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Omit<Payment, 'id'>) => void;
}

export function PaymentForm({ payment, contracts, tenants, isOpen, onClose, onSave }: PaymentFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    contractId: '',
    tenantId: '',
    amount: 0,
    type: 'rent' as Payment['type'],
    dueDate: '',
    paidDate: '',
    status: 'PENDING' as Payment['status'],
    method: 'BANK_TRANSFER' as Payment['method'],
    notes: ''
  });

  const [generateReceipt, setGenerateReceipt] = useState(true);

    const isFinalized = payment?.status === 'CANCELLED' || payment?.status === 'REFUNDED';
  const isPaid = payment?.status === 'PAID';

  useEffect(() => {
    if (payment) {
      setFormData({
        contractId: payment.contractId,
        tenantId: payment.tenantId,
        amount: payment.amount,
        type: payment.type,
        dueDate: new Date(payment.dueDate).toISOString().split('T')[0],
        paidDate: payment.paidDate ? new Date(payment.paidDate).toISOString().split('T')[0] : '',
        status: payment.status,
        method: payment.method || 'BANK_TRANSFER',
        notes: payment.notes || ''
      });
    } else {
      setFormData({
        contractId: '',
        tenantId: '',
        amount: 0,
        type: 'RENT',
        dueDate: '',
        paidDate: '',
        status: 'PENDING',
        method: 'BANK_TRANSFER',
        notes: ''
      });
    }
  }, [payment]);

  const handleContractChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedContractId = e.target.value;
    const selectedContract = contracts.find(c => c.id === selectedContractId);

    setFormData(prev => ({
      ...prev,
      contractId: selectedContractId,
      // Llena el tenantId basado en el contrato seleccionado
      tenantId: selectedContract ? selectedContract.tenantId : '',
      // Opcional: También puedes llenar el monto de la renta mensual del contrato
      amount: selectedContract ? selectedContract.monthlyRent : 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const paymentData = {
      ...formData,
      dueDate: new Date(formData.dueDate),
      paidDate: formData.paidDate ? new Date(formData.paidDate) : undefined
    };
    try {
      await onSave(paymentData);
      toast.success(
        payment ? 'Pago actualizado' : 'Pago registrado',
        payment ? 'El pago se actualizó correctamente.' : 'El pago se registró correctamente.'
      );
      // NEW: Generate receipt if payment is marked as PAID and option is checked
      if (formData.status === 'PAID' && formData.paidDate && generateReceipt) {
        setTimeout(() => {
          const event = new CustomEvent('generateReceipt', {
            detail: {
              paymentData,
              isNewPayment: !payment
            }
          });
          window.dispatchEvent(event);
        }, 100);
      }
      onClose();
    } catch (error: any) {
      let msg = error?.error || error?.message || 'No se pudo guardar el pago.';
      if (error?.details && Array.isArray(error.details)) {
        msg = error.details.map((d: any) => `${d.field ? d.field + ': ' : ''}${d.message}`).join(' | ');
      }
      toast.error('Error al guardar pago', msg);
      console.error('Error saving payment:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {payment ? 'Editar Pago' : 'Registrar Nuevo Pago'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Contrato
              </label>
              <select
                required
                value={formData.contractId}
                disabled={isPaid || isFinalized}
                onChange={handleContractChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:cursor-not-allowed bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="">Seleccionar un contrato</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    Contrato #{contract.id.slice(-6).toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Inquilino
              </label>
              <select
                required
                value={formData.tenantId}
                disabled
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formData.contractId ? 'bg-slate-50 dark:bg-slate-900 cursor-not-allowed' : 'bg-white dark:bg-slate-900'} text-slate-900 dark:text-white`}
              >
                <option value="">Seleccionar un inquilino</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.firstName} {tenant.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Monto ($)
              </label>
              <input
                type="number"
                disabled={isPaid || isFinalized}
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:cursor-not-allowed bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tipo de Pago
              </label>
              <select
                value={formData.type}
                disabled={isPaid || isFinalized}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Payment['type'] })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:cursor-not-allowed bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="RENT">Alquiler</option>
                <option value="DEPOSIT">Depósito</option>
                <option value="LATE_FEE">Recargo por Mora</option>
                <option value="UTILITY">Servicios</option>
                <option value="MAINTENANCE">Mantenimiento</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fecha de Pago (Opcional)
              </label>
              <input
                type="date"
                value={formData.paidDate}
                disabled={isFinalized}
                onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Payment['status'] })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="PENDING">Pendiente</option>
                <option value="PAID">Pagado</option>
                <option value="overdue">Vencido</option>
                <option value="partial">Parcial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Método de Pago
              </label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as Payment['method'] })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="BANK_TRANSFER">Transferencia Bancaria</option>
                <option value="CHECK">Cheque</option>
                <option value="CASH">Efectivo</option>
                <option value="ONLINE">Pago en Línea</option>
              </select>
            </div>
          </div>

          {/* NEW: Generate Receipt Option */}
          {formData.status === 'PAID' && formData.paidDate && (
            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="generateReceipt"
                  checked={generateReceipt}
                  onChange={(e) => setGenerateReceipt(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="generateReceipt" className="ml-2 block text-sm text-blue-900 dark:text-blue-200">
                  Generar comprobante de pago automáticamente
                </label>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Se descargará un PDF con el comprobante de pago al guardar
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="Notas adicionales sobre este pago..."
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            >
              {payment ? 'Actualizar Pago' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}