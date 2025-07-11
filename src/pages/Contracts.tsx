import { useState, useEffect } from 'react';
import { Header } from '../components/Layout/Header';
import { ContractForm } from '../components/Contracts/ContractForm';
import { ContractDetails } from '../components/Contracts/ContractDetails';
import { useApp } from '../context/useApp';
import { generateContractPDF } from '../utils/reportGenerator';
import { FileText, Calendar, DollarSign, User, Home, Download, Edit, Eye, Trash2 } from 'lucide-react';
import { Contract } from '../types';
import { formatInTimeZone } from 'date-fns-tz';
import { useToast } from '../hooks/useToast';

export function Contracts() {
  const toast = useToast();
  const { contracts, tenants, properties, updateContract, createContract, loadContracts, deleteContract } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | undefined>();
  const [selectedContract, setSelectedContract] = useState<Contract | undefined>();

  const fetchContracts = async () => {
    await loadContracts();
  }

  useEffect(() => {
    if (contracts.length === 0) {
      loadContracts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts.length]);

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
    const property = properties.find(p => p.id === propertyId);
    return property?.name || 'Unknown Property';
  };

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
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

  const handleSaveContract = async (contractData: Omit<Contract, 'id'>) => {
    if (editingContract) {
      await updateContract(editingContract.id, contractData);
      setEditingContract(undefined);
      setIsFormOpen(false);
    } else {
      await createContract(contractData);
      setIsFormOpen(false); 
    }
    // await fetchContracts(); // <-- Recarga contratos después de guardar
  };

  const handleDeleteContract = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este contrato?')) {
      try {
        await deleteContract(id);
        await fetchContracts();
        toast.success('Contrato eliminado', 'El contrato se eliminó correctamente.');
      } catch (error: any) {
        const msg = error?.error || error?.message || 'No se pudo eliminar el contrato.';
        toast.error('Error al eliminar contrato', msg);
      }
    }
  };

  const handleDownloadContract = (contract: Contract) => {
    const property = properties.find(p => p.id === contract.propertyId);
    const tenant = tenants.find(t => t.id === contract.tenantId);
    
    if (property && tenant) {
      generateContractPDF(contract, property, tenant);
    }
  };


  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Contratos" 
        onNewItem={handleNewContract}
        newItemLabel="Nuevo Contrato"
      />
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {contracts.map((contract) => (
            <div key={contract.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">Contrato #{contract.id.slice(-6).toUpperCase()}</h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(contract.status)} dark:bg-opacity-80`}>
                        {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => handleViewContract(contract)}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                    disabled={contract.status === "TERMINATED" || contract.status === "EXPIRED"}
                      onClick={() => handleEditContract(contract)}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDownloadContract(contract)}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteContract(contract.id)}
                      className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-slate-600 dark:text-slate-300">
                    <Home className="w-4 h-4 mr-3" />
                    <span className="text-sm">{getPropertyName(contract.propertyId)}</span>
                  </div>
                  <div className="flex items-center text-slate-600 dark:text-slate-300">
                    <User className="w-4 h-4 mr-3" />
                    <span className="text-sm">{getTenantName(contract.tenantId)}</span>
                  </div>
                  <div className="flex items-center text-slate-600 dark:text-slate-300">
                    <DollarSign className="w-4 h-4 mr-3" />
                    <span className="text-sm">${contract.monthlyRent.toLocaleString()}/mes</span>
                  </div>
                  <div className="flex items-center text-slate-600 dark:text-slate-300">
                    <Calendar className="w-4 h-4 mr-3" />
                    <span className="text-sm">
                      {formatInTimeZone(contract.startDate, 'UTC', 'd MMM yyyy')} - {formatInTimeZone(new Date(contract.endDate), 'UTC', 'd MMM yyyy')}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Depósito de Seguridad</span>
                      <p className="font-medium text-slate-900 dark:text-white">${contract.securityDeposit.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Duración</span>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {Math.round((new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} meses
                      </p>
                    </div>
                  </div>
                </div>

                {contract.terms.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Términos Clave:</p>
                    <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                      {contract.terms.slice(0, 2).map((term, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1 h-1 bg-slate-400 dark:bg-slate-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {term}
                        </li>
                      ))}
                      {contract.terms.length > 2 && (
                        <li className="text-slate-400 dark:text-slate-500">+{contract.terms.length - 2} términos más</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="mt-6 flex space-x-2">
                  <button 
                    onClick={() => handleViewContract(contract)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm"
                  >
                    Ver Detalles
                  </button>
                  <button 
                    onClick={() => handleDownloadContract(contract)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-sm"
                  >
                    Descargar PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {contracts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <FileText className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No contracts found</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">Create your first rental contract to get started.</p>
            <button 
              onClick={handleNewContract}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            >
              Create New Contract
            </button>
          </div>
        )}
      </div>

      <ContractForm
        contract={editingContract}
        properties={properties}
        tenants={tenants}
        isOpen={isFormOpen}
        onClose={() => {setIsFormOpen(false); setEditingContract(undefined);}}
        onSave={handleSaveContract}
      />

      {selectedContract && (
        <ContractDetails
          contract={selectedContract}
          property={properties.find(p => p.id === selectedContract.propertyId)}
          tenant={tenants.find(t => t.id === selectedContract.tenantId)}
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