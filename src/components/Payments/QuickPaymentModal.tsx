import { useState } from 'react';
import { Payment, Contract, Tenant } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, CreditCard, Calendar, DollarSign } from 'lucide-react';

interface QuickPaymentModalProps {
  tenant?: Tenant;
  contract?: Contract;
  overduePayments?: Payment[];
  isOpen: boolean;
  onClose: () => void;
}

export function QuickPaymentModal({ tenant, contract, overduePayments, isOpen, onClose }: QuickPaymentModalProps) {
  const { createPayment, updatePayment} = useApp();
  const [paymentData, setPaymentData] = useState({
    amount: overduePayments ? overduePayments.reduce((sum, p) => sum + p.amount, 0) : 0,
    method: 'BANK_TRANSFER' as Payment['method'],
    paidDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // FIX: Record Payment funcionando
  const handleRecordPayment = async () => {
    if (!tenant || !contract) {
      alert('Missing tenant or contract information');
      return;
    }

    if (overduePayments && overduePayments.length > 0) {
      // Mark overdue payments as paid
      overduePayments.forEach(async payment => {
        const updatedPayment = {
          ...payment,
          status: 'PAID' as const,
          paidDate: new Date(paymentData.paidDate),
          method: paymentData.method,
          notes: paymentData.notes
        };
        await updatePayment(updatedPayment.id, updatedPayment);
      });
    } else {
      // Create new payment record
      const newPayment: Payment = {
        id: `payment-${Date.now()}`,
        contractId: contract.id,
        tenantId: tenant.id,
        amount: paymentData.amount,
        type: 'RENT',
        dueDate: new Date(),
        paidDate: new Date(paymentData.paidDate),
        status: 'PAID',
        method: paymentData.method,
        notes: paymentData.notes
      };
      await createPayment(newPayment);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Record Payment
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {tenant && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="font-medium text-blue-900">{tenant.firstName} {tenant.lastName}</p>
              <p className="text-sm text-blue-700">{tenant.email}</p>
            </div>
          )}

          {overduePayments && overduePayments.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <p className="font-medium text-red-900">Overdue Payments</p>
              <p className="text-sm text-red-700">{overduePayments.length} payment(s) overdue</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Amount ($)
            </label>
            <input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Payment Method
            </label>
            <select
              value={paymentData.method}
              onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value as Payment['method'] })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHECK">Check</option>
              <option value="CASH">Cash</option>
              <option value="ONLINE">Online Payment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Payment Date
            </label>
            <input
              type="date"
              value={paymentData.paidDate}
              onChange={(e) => setPaymentData({ ...paymentData, paidDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Payment notes..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleRecordPayment}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}