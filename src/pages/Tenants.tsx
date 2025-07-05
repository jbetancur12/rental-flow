import { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Layout/Header';
import { TenantForm } from '../components/Tenants/TenantForm';
import { TenantDetails } from '../components/Tenants/TenantDetails';
import { TenantCard } from '../components/Tenants/TenantCard';
import { QuickPaymentModal } from '../components/Payments/QuickPaymentModal';
import { useApp } from '../context/useApp';
import { generateTenantReport } from '../utils/reportGenerator';
import { User, AlertTriangle, Download } from 'lucide-react';
import { Tenant } from '../types';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/UI/ConfirmDialog';
import { useSubscription } from '../hooks/useSubscription';

export function Tenants() {
  const { state, createTenant, updateTenant, getTenants, deleteTenant } = useApp();
  const { isOpen: isConfirmOpen, options: confirmOptions, confirm, handleConfirm, handleCancel } = useConfirm();
  const { limits, isLimitExceeded } = useSubscription();

  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'ACTIVE' | 'FORMER' | 'OVERDUE'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | undefined>();
  const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>();
  const [paymentTenant, setPaymentTenant] = useState<Tenant | undefined>();

const limitReached = isLimitExceeded('tenants');

  const fetchTenants = useCallback(async () => {
    try {
      // Simulate fetching tenants from an API
      await getTenants();

    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    }
  }, [getTenants]);

  useEffect(() => {
    if (state.tenants.length === 0) {
      fetchTenants();
    }
  }, [state.tenants.length, fetchTenants]);

  // Get tenants with OVERDUE payments
  const tenantsWithOverdue = state.tenants.filter(tenant => {
    const overduePayments = state.payments.filter(p =>
      p.tenantId === tenant.id &&
      p.status === 'PENDING' &&
      new Date(p.dueDate) < new Date()
    );
    return overduePayments.length > 0;
  });

  const filteredTenants = (() => {
    if (filter === 'OVERDUE') return tenantsWithOverdue;
    if (filter === 'all') return state.tenants;
    return state.tenants.filter(t => t.status === filter);
  })();
  console.log("🚀 ~ filteredTenants ~ filteredTenants:", filteredTenants)

  const handleNewTenant = () => {
    setEditingTenant(undefined);
    setIsFormOpen(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsFormOpen(true);
  };

  const handleViewTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDetailsOpen(true);
  };

  const handleCollectPayment = (tenant: Tenant) => {
    setPaymentTenant(tenant);
    setIsPaymentModalOpen(true);
  };

  const handleDeleteTenant = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Tenant',
      message: 'Are you sure you want to delete this tenant?',
      confirmText: 'Delete',
      type: 'danger'
    });
    if (confirmed) {
      await deleteTenant(id);
    }

  };

  const handleSaveTenant = async (tenantData: Omit<Tenant, 'id'>) => {
    if (editingTenant) {
      await updateTenant(editingTenant.id, tenantData);
      setEditingTenant(undefined);
      setIsFormOpen(false);
    } else {
      await createTenant(tenantData);
      setIsFormOpen(false);
    }
  };

  const handleGenerateReport = () => {
    generateTenantReport(filteredTenants);
  };

  // Get payment modal data
  const getPaymentModalData = () => {
    if (!paymentTenant) return {};

    const activeContract = state.contracts.find(c =>
      c.tenantId === paymentTenant.id && c.status === 'ACTIVE'
    );

    if (!activeContract) return { tenant: paymentTenant };

    const overduePayments = state.payments.filter(p =>
      p.contractId === activeContract.id &&
      p.status === 'PENDING' &&
      new Date(p.dueDate) < new Date()
    );

    return { tenant: paymentTenant, contract: activeContract, overduePayments };
  };

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title="Tenants"
        onNewItem={handleNewTenant}
        newItemLabel="Add Tenant"
        isNewItemDisabled={limitReached}
      />

       {limitReached && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          Has alcanzado el límite de **{limits.maxTenants} iniquilinos** de tu plan actual. Para añadir más, por favor <a href="/settings?tab=subscription" className="font-bold underline">actualiza tu plan</a>.
        </div>
      )}

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Tenants</p>
                <p className="text-2xl font-bold text-slate-900">{state.tenants.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {state.tenants.filter(t => t.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {state.tenants.filter(t => t.status === 'PENDING').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Approved</p>
                <p className="text-2xl font-bold text-blue-600">
                  {state.tenants.filter(t => t.status === 'APPROVED').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👍</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {tenantsWithOverdue.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Alert */}
        {tenantsWithOverdue.length > 0 && filter !== 'OVERDUE' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <span className="font-medium text-red-800">
                  {tenantsWithOverdue.length} tenant{tenantsWithOverdue.length > 1 ? 's have' : ' has'} OVERDUE payments
                </span>
              </div>
              <button
                onClick={() => setFilter('OVERDUE')}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                View Overdue
              </button>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2">
            {['all', 'PENDING', 'APPROVED', 'ACTIVE', 'FORMER', 'OVERDUE'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as 'all' | 'PENDING' | 'APPROVED' | 'ACTIVE' | 'FORMER' | 'OVERDUE')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-2 text-xs">
                  ({status === 'OVERDUE' ? tenantsWithOverdue.length :
                    status === 'all' ? state.tenants.length :
                      state.tenants.filter(t => t.status === status).length})
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateReport}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>

        {/* Tenants Grid */}
        {filteredTenants.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTenants.map((tenant) => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                onEdit={handleEditTenant}
                onView={handleViewTenant}
                onDelete={handleDeleteTenant}
                onCollectPayment={handleCollectPayment}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <User className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No tenants found</h3>
            <p className="text-slate-600 mb-4">
              {filter === 'all'
                ? "You haven't added any tenants yet."
                : filter === 'OVERDUE'
                  ? "No tenants have OVERDUE payments."
                  : `No tenants with status "${filter}" found.`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={handleNewTenant}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Tenant
              </button>
            )}
          </div>
        )}
      </div>

      <TenantForm
        tenant={editingTenant}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveTenant}
      />

   {selectedTenant && (
        (() => {
            // 1. Filtra los pagos para el inquilino seleccionado
            const paymentsForSelectedTenant = state.payments
                .filter(p => p.tenantId === selectedTenant.id)
                .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()); // Opcional: ordenar por fecha

                const contractsForSelectedTenant = state.contracts
                .filter(c => c.tenantId === selectedTenant.id)

                const propertiesForSelectedTenant = state.properties
                .filter(p => contractsForSelectedTenant.some(c => c.propertyId === p.id))

            


            return (
                <TenantDetails
                    tenant={selectedTenant}
                    payments={paymentsForSelectedTenant} 
                    contracts={contractsForSelectedTenant}
                    properties={propertiesForSelectedTenant}
                    isOpen={isDetailsOpen}
                    onClose={() => setIsDetailsOpen(false)}
                    onEdit={() => {
                        setIsDetailsOpen(false);
                        handleEditTenant(selectedTenant);
                    }}
                />
            );
        })()
    )}

      {paymentTenant && (
        <QuickPaymentModal
          {...getPaymentModalData()}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={confirmOptions.title}
        message={confirmOptions.message}
        confirmText={confirmOptions.confirmText}
        cancelText={confirmOptions.cancelText}
        type={confirmOptions.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}