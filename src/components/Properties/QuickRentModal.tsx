import { useState } from 'react';
import { Property } from '../../types';
import { useApp } from '../../context/useApp';
import { X, FileText, Calendar, DollarSign, User } from 'lucide-react';
import { formatDateInOrgTimezone } from '../../utils/formatDate';

interface QuickRentModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickRentModal({ property, isOpen, onClose }: QuickRentModalProps) {
  const { state, updateProperty, updateContract, updateTenant, createPayment } = useApp();
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
        const paymentsToCreate = [];
        const today = new Date();
        const contractStartDate = new Date(contract.startDate);
        const contractEndDate = new Date(contract.endDate);

        if (contract.securityDeposit > 0) {
            paymentsToCreate.push({
                contractId: contract.id,
                tenantId: contract.tenantId,
                amount: contract.securityDeposit,
                type: 'DEPOSIT' as const,
                dueDate: new Date(contractStartDate),
                status: 'PENDING' as const,
            });
        }

        const periodIterator = new Date(contractStartDate);

        while (periodIterator <= today && periodIterator < contractEndDate) {
            
            const periodStart = new Date(periodIterator);
            const periodEnd = new Date(periodIterator);
            
            // LÓGICA CORREGIDA PARA EL FIN DEL PERÍODO
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            periodEnd.setDate(periodEnd.getDate() - 1); // Restamos un día

            paymentsToCreate.push({
                contractId: contract.id,
                tenantId: contract.tenantId,
                amount: contract.monthlyRent,
                type: 'RENT' as const,
                dueDate: periodStart,
                status: 'PENDING' as const,
                periodStart: periodStart,
                periodEnd: periodEnd,
            });

            periodIterator.setMonth(periodIterator.getMonth() + 1);
        }
        
        if (paymentsToCreate.length > 0) {
            for (const paymentData of paymentsToCreate) {
                await createPayment(paymentData);
            }
        }
        
        const contractUpdatePayload = {
            status: 'ACTIVE' as const,
            propertyId: property.id,
            signedDate: contract.signedDate || new Date(),
        };

        await updateProperty(property.id, { status: 'RENTED' });
        await updateContract(contract.id, contractUpdatePayload);
        const tenant = state.tenants.find(t => t.id === contract.tenantId);
        if (tenant && tenant.status !== 'ACTIVE') {
            await updateTenant(tenant.id, { ...tenant, status: 'ACTIVE' });
        }

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
                        <strong>Start Date:</strong> {formatDateInOrgTimezone(contract.startDate, state.organization?.settings.timezone)}

                      </p>
                      <p className="flex items-center mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        <strong>End Date:</strong> {formatDateInOrgTimezone(contract.endDate, state.organization?.settings.timezone)}
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