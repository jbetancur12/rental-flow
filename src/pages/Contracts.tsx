import { useState, useEffect } from 'react';
import { Header } from '../components/Layout/Header';
import { ContractForm } from '../components/Contracts/ContractForm';
import { ContractDetails } from '../components/Contracts/ContractDetails';
import { useApp } from '../context/AppContext';
import { generateContractPDF } from '../utils/reportGenerator';
import { FileText, Calendar, DollarSign, User, Home, Download, Edit, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Contract } from '../types';

export function Contracts() {
  const { state, updateContract, createContract, loadContracts, deleteContract } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | undefined>();
  const [selectedContract, setSelectedContract] = useState<Contract | undefined>();

  const fetchContracts = async () => {
    await loadContracts();
  }

  useEffect(() => {
    if (state.contracts.length === 0) {
      fetchContracts();
    }
  }, [state.contracts.length]);

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-emerald-100 text-emerald-800',
      EXPIRED: 'bg-red-100 text-red-800',
      TERMINATED: 'bg-slate-100 text-slate-800'
    };
    return colors[status as keyof typeof colors] || colors.DRAFT;
  };

  const getPropertyName = (propertyId: string) => {
    const property = state.properties.find(p => p.id === propertyId);
    return property?.name || 'Unknown Property';
  };

  const getTenantName = (tenantId: string) => {
    const tenant = state.tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown Tenant';
  };

  const handleNewContract = () => {
    setEditingContract(undefined);
    setIsFormOpen(true);
  };

  const handleEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setIsFormOpen(true);
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setIsDetailsOpen(true);
  };

  const handleDeleteContract = async (id: string) => {
    if (confirm('Are you sure you want to delete this contract?')) {
      // In a real app, you'd dispatch a DELETE_CONTRACT action
      await deleteContract(id);
    }
  };

  const handleSaveContract = async (contractData: Omit<Contract, 'id'>) => {
    if (editingContract) {
      await updateContract(
        editingContract.id,
          contractData,
        );
      setEditingContract(undefined);
      setIsFormOpen(false);
    } else {
      await createContract({
          ...contractData,
          id: `contract-${Date.now()}`
        });
    }
  };

  const handleDownloadContract = (contract: Contract) => {
    const property = state.properties.find(p => p.id === contract.propertyId);
    const tenant = state.tenants.find(t => t.id === contract.tenantId);
    
    if (property && tenant) {
      generateContractPDF(contract, property, tenant);
    }
  };

console.log(state.contracts);
  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Contracts" 
        onNewItem={handleNewContract}
        newItemLabel="New Contract"
      />
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {state.contracts.map((contract) => (
            <div key={contract.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">Contract #{contract.id.slice(-6).toUpperCase()}</h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(contract.status)}`}>
                        {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => handleViewContract(contract)}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                    disabled={contract.status === "TERMINATED" || contract.status === "EXPIRED"}
                      onClick={() => handleEditContract(contract)}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDownloadContract(contract)}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteContract(contract.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-slate-600">
                    <Home className="w-4 h-4 mr-3" />
                    <span className="text-sm">{getPropertyName(contract.propertyId)}</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <User className="w-4 h-4 mr-3" />
                    <span className="text-sm">{getTenantName(contract.tenantId)}</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <DollarSign className="w-4 h-4 mr-3" />
                    <span className="text-sm">${contract.monthlyRent.toLocaleString()}/month</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <Calendar className="w-4 h-4 mr-3" />
                    <span className="text-sm">
                      {format(contract.startDate, 'MMM d, yyyy')} - {format(contract.endDate, 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Security Deposit</span>
                      <p className="font-medium text-slate-900">${contract.securityDeposit.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Duration</span>
                      <p className="font-medium text-slate-900">
                        {Math.round((new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                      </p>
                    </div>
                  </div>
                </div>

                {contract.terms.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500 mb-2">Key Terms:</p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {contract.terms.slice(0, 2).map((term, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1 h-1 bg-slate-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {term}
                        </li>
                      ))}
                      {contract.terms.length > 2 && (
                        <li className="text-slate-400">+{contract.terms.length - 2} more terms</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="mt-6 flex space-x-2">
                  <button 
                    onClick={() => handleViewContract(contract)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleDownloadContract(contract)}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {state.contracts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <FileText className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No contracts found</h3>
            <p className="text-slate-600 mb-4">Create your first rental contract to get started.</p>
            <button 
              onClick={handleNewContract}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Contract
            </button>
          </div>
        )}
      </div>

      <ContractForm
        contract={editingContract}
        properties={state.properties}
        tenants={state.tenants}
        isOpen={isFormOpen}
        onClose={() => {setIsFormOpen(false); setEditingContract(undefined);}}
        onSave={handleSaveContract}
      />

      {selectedContract && (
        <ContractDetails
          contract={selectedContract}
          property={state.properties.find(p => p.id === selectedContract.propertyId)}
          tenant={state.tenants.find(t => t.id === selectedContract.tenantId)}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onEdit={() => {
            setIsDetailsOpen(false);
            handleEditContract(selectedContract);
          }}
        />
      )}
    </div>
  );
}