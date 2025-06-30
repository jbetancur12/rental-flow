import React, { useState, useEffect } from 'react';
import { Contract, Property, Tenant } from '../../types';
import { X } from 'lucide-react';

interface ContractFormProps {
  contract?: Contract;
  properties: Property[];
  tenants: Tenant[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (contract: Omit<Contract, 'id'>) => void;
}

export function ContractForm({ contract, properties, tenants, isOpen, onClose, onSave }: ContractFormProps) {
  const [formData, setFormData] = useState({
    propertyId: '',
    tenantId: '',
    startDate: '',
    endDate: '',
    monthlyRent: 0,
    securityDeposit: 0,
    terms: [] as string[],
    status: 'draft' as Contract['status'],
    signedDate: ''
  });

  const [newTerm, setNewTerm] = useState('');

  // Filter only available properties for new contracts
  const availableProperties = contract 
    ? properties 
    : properties.filter(p => p.status === 'available');

  useEffect(() => {
    if (contract) {
      setFormData({
        propertyId: contract.propertyId,
        tenantId: contract.tenantId,
        startDate: contract.startDate.toISOString().split('T')[0],
        endDate: contract.endDate.toISOString().split('T')[0],
        monthlyRent: contract.monthlyRent,
        securityDeposit: contract.securityDeposit,
        terms: [...contract.terms],
        status: contract.status,
        signedDate: contract.signedDate ? contract.signedDate.toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({
        propertyId: '',
        tenantId: '',
        startDate: '',
        endDate: '',
        monthlyRent: 0,
        securityDeposit: 0,
        terms: [],
        status: 'draft',
        signedDate: ''
      });
    }
  }, [contract]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      signedDate: formData.signedDate ? new Date(formData.signedDate) : undefined
    });
    onClose();
  };

  const addTerm = () => {
    if (newTerm.trim() && !formData.terms.includes(newTerm.trim())) {
      setFormData({
        ...formData,
        terms: [...formData.terms, newTerm.trim()]
      });
      setNewTerm('');
    }
  };

  const removeTerm = (term: string) => {
    setFormData({
      ...formData,
      terms: formData.terms.filter(t => t !== term)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {contract ? 'Edit Contract' : 'Create New Contract'}
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
                Property {!contract && <span className="text-xs text-slate-500">(Available only)</span>}
              </label>
              <select
                required
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a property</option>
                {availableProperties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.address} {property.status === 'available' ? '✅' : ''}
                  </option>
                ))}
              </select>
              {!contract && availableProperties.length === 0 && (
                <p className="text-sm text-red-600 mt-1">No available properties found</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tenant
              </label>
              <select
                required
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a tenant</option>
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
                Start Date
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Monthly Rent ($)
              </label>
              <input
                type="number"
                required
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Security Deposit ($)
              </label>
              <input
                type="number"
                required
                value={formData.securityDeposit}
                onChange={(e) => setFormData({ ...formData, securityDeposit: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Contract['status'] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Signed Date (Optional)
              </label>
              <input
                type="date"
                value={formData.signedDate}
                onChange={(e) => setFormData({ ...formData, signedDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contract Terms
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Add contract term"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTerm())}
              />
              <button
                type="button"
                onClick={addTerm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {formData.terms.map((term, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <span className="text-sm text-slate-700">{term}</span>
                  <button
                    type="button"
                    onClick={() => removeTerm(term)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {contract ? 'Update Contract' : 'Create Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}