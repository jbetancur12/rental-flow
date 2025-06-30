import React, { useState } from 'react';
import { Property, Tenant } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, FileText, Calendar, DollarSign, User } from 'lucide-react';

interface QuickRentModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickRentModal({ property, isOpen, onClose }: QuickRentModalProps) {
  const { state, updateProperty, updateContract, updateTenant,createPayment } = useApp();
  const [selectedContract, setSelectedContract] = useState('');

  // Filtrar contratos disponibles (ACTIVE y sin asignar a propiedades)
  const availableContracts = state.contracts.filter(c => 
    c.status === 'DRAFT' && 
    c.propertyId === property.id // Contratos que no tienen propiedad asignada
  );

  const handleQuickRent = async () => {
    if (!selectedContract) {
      alert('Please select a contract');
      return;
    }

    const contract = availableContracts.find(c => c.id === selectedContract);
    if (!contract) return;

    try {
      // Actualizar la propiedad con el contractId
      const updatedProperty = {
        ...property,
        status: 'rented' as const,
        updatedAt: new Date()
      };

      // Actualizar contrato con propertyId
      const updatedContract = {
        ...contract,
        propertyId: property.id
      };

      // Actualizar tenant status si no está activo
      const tenant = state.tenants.find(t => t.id === contract.tenantId);
      if (tenant && tenant.status !== 'ACTIVE') {
        const updatedTenant = {
          ...tenant,
          status: 'ACTIVE' as const
        };
        // Si tienes updateTenant disponible
        await updateTenant(updatedTenant.id, updatedTenant);
      }

      // Crear primer pago si no existe
      const existingPayment = state.payments?.find(p => 
        p.contractId === contract.id && 
        p.type === 'RENT' && 
        p.dueDate.getMonth() === new Date(new Date(contract.startDate)).getMonth()
      );

      if (!existingPayment) {
        const firstPayment = {
          id: `payment-${Date.now()}`,
          contractId: contract.id,
          tenantId: contract.tenantId,
          amount: contract.monthlyRent,
          type: 'RENT' as const,
          dueDate: new Date(new Date(contract.startDate)),
          status: 'PENDING' as const
        };
        await createPayment(firstPayment);
      }

      await updateProperty(updatedProperty.id, updatedProperty);
      await updateContract(updatedContract.id, updatedContract);

      alert('Property rented successfully!');
      onClose();
    } catch (error) {
      console.error('Error assigning contract to property:', error);
      alert('Error occurred while renting property');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Assign Contract: {property.name}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Property Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 mb-2">Property Details</h4>
            <div className="text-sm text-slate-600 space-y-1">
              <p><strong>Name:</strong> {property.name}</p>
              <p><strong>Address:</strong> {property.address}</p>
              <p><strong>Type:</strong> {property.type}</p>
              <p><strong>Suggested Rent:</strong> ${property.rent.toLocaleString()}/month</p>
            </div>
          </div>

          {/* Contract Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Available Contract
            </label>
            {availableContracts.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">No available contracts found</p>
                <p className="text-sm text-slate-500 mt-1">Create an active contract first before assigning to property</p>
              </div>
            ) : (
              <select
                value={selectedContract}
                onChange={(e) => setSelectedContract(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a contract...</option>
                {availableContracts.map((contract) => {
                  const tenant = state.tenants.find(t => t.id === contract.tenantId);
                  return (
                    <option key={contract.id} value={contract.id}>
                      Contract #{contract.id.slice(-6).toUpperCase()} - {tenant?.firstName} {tenant?.lastName} - ${contract.monthlyRent.toLocaleString()}/month
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Contract Details */}
          {selectedContract && (() => {
            const contract = availableContracts.find(c => c.id === selectedContract);
            const tenant = state.tenants.find(t => t.id === contract?.tenantId);
            
            if (!contract || !tenant) return null;

            return (
              <div className="space-y-4">
                {/* Contract Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Contract Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>
                      <p className="flex items-center mb-2">
                        <User className="w-4 h-4 mr-2" />
                        <strong>Tenant:</strong> {tenant.firstName} {tenant.lastName}
                      </p>
                      <p className="flex items-center mb-2">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <strong>Monthly Rent:</strong> ${contract.monthlyRent.toLocaleString()}
                      </p>
                      <p className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <strong>Security Deposit:</strong> ${contract.securityDeposit.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="flex items-center mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        <strong>Start Date:</strong> {new Date(contract.startDate).toLocaleDateString()}
                      </p>
                      <p className="flex items-center mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        <strong>End Date:</strong> {new Date(contract.endDate).toLocaleDateString()}
                      </p>
                      <p className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <strong>Duration:</strong> {Math.round((new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))} months
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tenant Info */}
                <div className="bg-emerald-50 rounded-lg p-4">
                  <h4 className="font-medium text-emerald-900 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Tenant Information
                  </h4>
                  <div className="text-sm text-emerald-800 space-y-1">
                    <p><strong>Email:</strong> {tenant.email}</p>
                    <p><strong>Phone:</strong> {tenant.phone}</p>
                    <p><strong>Employment:</strong> {tenant.employment.employer} - ${tenant.employment.income.toLocaleString()}/year</p>
                    <p><strong>Status:</strong> {tenant.status}</p>
                  </div>
                </div>

                {/* Contract Terms */}
                {contract.terms.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-3">Contract Terms</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {contract.terms.map((term, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1 h-1 bg-slate-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {term}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Assignment Summary */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h4 className="font-medium text-yellow-900 mb-2">⚠️ Assignment Summary</h4>
                  <div className="text-sm text-yellow-800">
                    <p>This action will:</p>
                    <ul className="mt-2 space-y-1 ml-4">
                      <li>• Assign contract #{contract.id.slice(-6).toUpperCase()} to {property.name}</li>
                      <li>• Change property status to "Rented"</li>
                      <li>• Set tenant status to "Active" (if not already)</li>
                      <li>• Create first rent payment if needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleQuickRent}
            disabled={!selectedContract || availableContracts.length === 0}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Assign Contract to Property
          </button>
        </div>
      </div>
    </div>
  );
}