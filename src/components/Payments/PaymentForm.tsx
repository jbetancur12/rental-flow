import React, { useState, useEffect } from 'react';
import { Payment, Contract, Tenant } from '../../types';
import { X } from 'lucide-react';

interface PaymentFormProps {
  payment?: Payment;
  contracts: Contract[];
  tenants: Tenant[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Omit<Payment, 'id'>) => void;
}

export function PaymentForm({ payment, contracts, tenants, isOpen, onClose, onSave }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    contractId: '',
    tenantId: '',
    amount: 0,
    type: 'rent' as Payment['type'],
    dueDate: '',
    paidDate: '',
    status: 'pending' as Payment['status'],
    method: 'bank_transfer' as Payment['method'],
    notes: ''
  });

  const [generateReceipt, setGenerateReceipt] = useState(true);

  useEffect(() => {
    if (payment) {
      setFormData({
        contractId: payment.contractId,
        tenantId: payment.tenantId,
        amount: payment.amount,
        type: payment.type,
        dueDate: payment.dueDate.toISOString().split('T')[0],
        paidDate: payment.paidDate ? payment.paidDate.toISOString().split('T')[0] : '',
        status: payment.status,
        method: payment.method || 'bank_transfer',
        notes: payment.notes || ''
      });
    } else {
      setFormData({
        contractId: '',
        tenantId: '',
        amount: 0,
        type: 'rent',
        dueDate: '',
        paidDate: '',
        status: 'pending',
        method: 'bank_transfer',
        notes: ''
      });
    }
  }, [payment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentData = {
      ...formData,
      dueDate: new Date(formData.dueDate),
      paidDate: formData.paidDate ? new Date(formData.paidDate) : undefined
    };
    
    onSave(paymentData);
    
    // NEW: Generate receipt if payment is marked as paid and option is checked
    if (formData.status === 'paid' && formData.paidDate && generateReceipt) {
      // This will be handled in the parent component
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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {payment ? 'Editar Pago' : 'Registrar Nuevo Pago'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contrato
              </label>
              <select
                required
                value={formData.contractId}
                onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Inquilino
              </label>
              <select
                required
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Monto ($)
              </label>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Pago
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Payment['type'] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="rent">Alquiler</option>
                <option value="deposit">Depósito</option>
                <option value="late_fee">Recargo por Mora</option>
                <option value="utility">Servicios</option>
                <option value="maintenance">Mantenimiento</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Pago (Opcional)
              </label>
              <input
                type="date"
                value={formData.paidDate}
                onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Payment['status'] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="overdue">Vencido</option>
                <option value="partial">Parcial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Método de Pago
              </label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as Payment['method'] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="bank_transfer">Transferencia Bancaria</option>
                <option value="check">Cheque</option>
                <option value="cash">Efectivo</option>
                <option value="online">Pago en Línea</option>
              </select>
            </div>
          </div>

          {/* NEW: Generate Receipt Option */}
          {formData.status === 'paid' && formData.paidDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="generateReceipt"
                  checked={generateReceipt}
                  onChange={(e) => setGenerateReceipt(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="generateReceipt" className="ml-2 block text-sm text-blue-900">
                  Generar comprobante de pago automáticamente
                </label>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Se descargará un PDF con el comprobante de pago al guardar
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Notas adicionales sobre este pago..."
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {payment ? 'Actualizar Pago' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}