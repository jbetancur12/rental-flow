import { useState } from 'react';
import { Property, Tenant, Contract } from '../../types';
import { useApp } from '../../context/useApp';
import { X, User,  CheckCircle } from 'lucide-react';

interface RentalProcessProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export function RentalProcess({ property, isOpen, onClose }: RentalProcessProps) {
  const { state, dispatch, createContract, createPayment, updateProperty } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [contractData, setContractData] = useState({
    startDate: '',
    endDate: '',
    monthlyRent: property.rent,
    securityDeposit: property.rent,
    terms: [
      'No pets allowed without written permission',
      'No smoking inside the property',
      'Tenant responsible for utilities',
      '24-hour notice required for property entry'
    ]
  });

  const availableTenants = state.tenants.filter(t => t.status === 'APPROVED');

  const handleRentProperty = async () => {
    if (!selectedTenant || !contractData.startDate || !contractData.endDate) {
      alert('Please complete all required fields');
      return;
    }

    // Create contract
    const newContract: Contract = {
      id: `contract-${Date.now()}`,
      propertyId: property.id,
      tenantId: selectedTenant,
      startDate: new Date(contractData.startDate),
      endDate: new Date(contractData.endDate),
      monthlyRent: contractData.monthlyRent,
      securityDeposit: contractData.securityDeposit,
      terms: contractData.terms,
      status: 'ACTIVE',
      signedDate: new Date()
    };

    // Update property status
    const updatedProperty = {
      ...property,
      status: 'rented' as Property['status'],
      updatedAt: new Date()
    };

    // Update tenant status
    const tenant = state.tenants.find(t => t.id === selectedTenant);
    if (tenant) {
      const updatedTenant = {
        ...tenant,
        status: 'ACTIVE' as Tenant['status']
      };
      dispatch({ type: 'UPDATE_TENANT', payload: updatedTenant });
    }

    // Create initial payment record
    const initialPayment = {
      id: `payment-${Date.now()}`,
      contractId: newContract.id,
      tenantId: selectedTenant,
      amount: contractData.monthlyRent,
      type: 'rent' as const,
      dueDate: new Date(contractData.startDate),
      status: 'pending' as const
    };

    // Dispatch updates
    await createContract(newContract);
    await updateProperty(updatedProperty.id, updatedProperty);
    await createPayment(initialPayment);


    alert('Property successfully rented! Contract created and tenant activated.');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Rent Property: {property.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Select Tenant</span>
            </div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Contract Terms</span>
            </div>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Finalize</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Select Tenant */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Approved Tenant</h3>
              {availableTenants.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No approved tenants available</p>
                  <p className="text-sm text-slate-500">Please approve tenant applications first</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableTenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTenant === tenant.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedTenant(tenant.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-slate-900">
                            {tenant.firstName} {tenant.lastName}
                          </h4>
                          <p className="text-sm text-slate-600">{tenant.email}</p>
                          <p className="text-sm text-slate-600">
                            Income: ${tenant.employment.income.toLocaleString()}/year
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Credit Score</p>
                          <p className={`font-medium ${
                            tenant.creditScore && tenant.creditScore >= 750 ? 'text-emerald-600' :
                            tenant.creditScore && tenant.creditScore >= 650 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {tenant.creditScore || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Contract Terms */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Contract Terms</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={contractData.startDate}
                      onChange={(e) => setContractData({ ...contractData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={contractData.endDate}
                      onChange={(e) => setContractData({ ...contractData, endDate: e.target.value })}
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
                      value={contractData.monthlyRent}
                      onChange={(e) => setContractData({ ...contractData, monthlyRent: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Security Deposit ($)
                    </label>
                    <input
                      type="number"
                      value={contractData.securityDeposit}
                      onChange={(e) => setContractData({ ...contractData, securityDeposit: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contract Terms
                  </label>
                  <div className="space-y-2">
                    {contractData.terms.map((term, index) => (
                      <div key={index} className="flex items-center p-3 bg-slate-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-emerald-600 mr-3" />
                        <span className="text-sm text-slate-700">{term}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Finalize */}
          {currentStep === 3 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Review & Finalize</h3>
              <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Property</p>
                    <p className="font-medium text-slate-900">{property.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Tenant</p>
                    <p className="font-medium text-slate-900">
                      {availableTenants.find(t => t.id === selectedTenant)?.firstName} {availableTenants.find(t => t.id === selectedTenant)?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Monthly Rent</p>
                    <p className="font-medium text-slate-900">${contractData.monthlyRent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Security Deposit</p>
                    <p className="font-medium text-slate-900">${contractData.securityDeposit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Start Date</p>
                    <p className="font-medium text-slate-900">{new Date(contractData.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">End Date</p>
                    <p className="font-medium text-slate-900">{new Date(contractData.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between p-6 border-t border-slate-200">
          <button
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            {currentStep === 1 ? 'Cancelar' : 'Anterior'}
          </button>
          
          <div className="flex space-x-2">
            {currentStep < 3 ? (
              <button
                onClick={() => {
                  if (currentStep === 1 && !selectedTenant) {
                    alert('Por favor selecciona un inquilino');
                    return;
                  }
                  if (currentStep === 2 && (!contractData.startDate || !contractData.endDate)) {
                    alert('Por favor completa todos los detalles del contrato');
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={currentStep === 1 && availableTenants.length === 0}
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleRentProperty}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Completar Renta
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}