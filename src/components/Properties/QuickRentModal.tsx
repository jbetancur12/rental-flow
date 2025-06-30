import React, { useState } from 'react';
import { Property, Tenant } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, User, Calendar, DollarSign } from 'lucide-react';

interface QuickRentModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickRentModal({ property, isOpen, onClose }: QuickRentModalProps) {
  const { state, dispatch, updateTenant, createContract, createPayment, updateProperty } = useApp();
  const [selectedTenant, setSelectedTenant] = useState('');
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState(12); // months
  const [monthlyRent, setMonthlyRent] = useState(property.rent);
  const [securityDeposit, setSecurityDeposit] = useState(property.rent);

  const approvedTenants = state.tenants.filter(t => t.status === 'APPROVED');

  const handleQuickRent = async () => {
    if (!selectedTenant || !startDate) {
      alert('Please select a tenant and start date');
      return;
    }

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + duration);

    // Create contract
    const newContract = {
      id: `contract-${Date.now()}`,
      propertyId: property.id,
      tenantId: selectedTenant,
      startDate: new Date(startDate),
      endDate,
      monthlyRent,
      securityDeposit,
      terms: [
        'No pets allowed without written permission',
        'No smoking inside the property',
        'Tenant responsible for utilities',
        '24-hour notice required for property entry'
      ],
      status: 'ACTIVE' as const,
      signedDate: new Date()
    };

    // Update property
    const updatedProperty = {
      ...property,
      status: 'rented' as const,
      updatedAt: new Date()
    };

    // Update tenant
    const tenant = state.tenants.find(t => t.id === selectedTenant);
    if (tenant) {
      const updatedTenant = {
        ...tenant,
        status: 'ACTIVE' as const
      };
      await updateTenant(updatedTenant.id, updatedTenant);
    }

    // Create first payment
    const firstPayment = {
      id: `payment-${Date.now()}`,
      contractId: newContract.id,
      tenantId: selectedTenant,
      amount: monthlyRent,
      type: 'rent' as const,
      dueDate: new Date(startDate),
      status: 'pending' as const
    };

    await createContract(newContract);
    await updateProperty(updatedProperty.id, updatedProperty);
    await createPayment(firstPayment);
  

    alert('Property rented successfully!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Quick Rent: {property.name}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tenant Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Approved Tenant
            </label>
            {approvedTenants.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <User className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">No approved tenants available</p>
              </div>
            ) : (
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a tenant...</option>
                {approvedTenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.firstName} {tenant.lastName} - ${tenant.employment.income.toLocaleString()}/year
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Contract Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Duration (months)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
                <option value={24}>24 months</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Monthly Rent ($)
              </label>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Security Deposit ($)
              </label>
              <input
                type="number"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Summary */}
          {selectedTenant && startDate && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Rental Summary</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>Tenant: {approvedTenants.find(t => t.id === selectedTenant)?.firstName} {approvedTenants.find(t => t.id === selectedTenant)?.lastName}</p>
                <p>Start: {new Date(startDate).toLocaleDateString()}</p>
                <p>End: {new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + duration)).toLocaleDateString()}</p>
                <p>Monthly Rent: ${monthlyRent.toLocaleString()}</p>
                <p>Security Deposit: ${securityDeposit.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleQuickRent}
            disabled={!selectedTenant || !startDate}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Rent Property
          </button>
        </div>
      </div>
    </div>
  );
}