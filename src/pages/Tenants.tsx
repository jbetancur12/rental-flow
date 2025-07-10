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
import { useToast } from '../hooks/useToast';

export function Tenants() {
  const { tenants, contracts, payments, properties, createTenant, updateTenant, getTenants, deleteTenant } = useApp();
  const { isOpen: isConfirmOpen, options: confirmOptions, confirm, handleConfirm, handleCancel } = useConfirm();
  const { limits, isLimitExceeded } = useSubscription();
  const toast = useToast();

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
    fetchTenants();
  }, [fetchTenants]);

  // Get tenants with OVERDUE payments
  const tenantsWithOverdue = tenants.filter(tenant => {
    const overduePayments = payments.filter(p =>
      p.tenantId === tenant.id &&
      p.status === 'PENDING' &&
      new Date(p.dueDate) < new Date()
    );
    return overduePayments.length > 0;
  });

  const filteredTenants = (() => {
    if (filter === 'OVERDUE') return tenantsWithOverdue;
    if (filter === 'all') return tenants;
    return tenants.filter(t => t.status === filter);
  })();

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
      title: 'Eliminar Inquilino',
      message: '¿Estás seguro de que deseas eliminar este inquilino?',
      confirmText: 'Eliminar',
      type: 'danger'
    });
    if (confirmed) {
      try {
        await deleteTenant(id);
        toast.success('Inquilino eliminado', 'El inquilino se eliminó correctamente.');
      } catch (error: any) {
        const msg = error?.error || error?.message || 'No se pudo eliminar el inquilino.';
        toast.error('Error al eliminar inquilino', msg);
      }
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

    const activeContract = contracts.find(c =>
      c.tenantId === paymentTenant.id && c.status === 'ACTIVE'
    );
    if (!activeContract) return { tenant: paymentTenant };
    const overduePayments = payments.filter(p =>
      p.contractId === activeContract.id &&
      p.status === 'PENDING' &&
      new Date(p.dueDate) < new Date()
    );
    return { tenant: paymentTenant, contract: activeContract, overduePayments };
  };

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title="Inquilinos"
        onNewItem={handleNewTenant}
        newItemLabel="Agregar Inquilino"
        isNewItemDisabled={limitReached}
      />

      {limitReached && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm">
          Has alcanzado el límite de **{limits.maxTenants} iniquilinos** de tu plan actual. Para añadir más, por favor <a href="/settings?tab=subscription" className="font-bold underline">actualiza tu plan</a>.
        </div>
      )}

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Total Inquilinos</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{tenants.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Activos</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-white">
                  {tenants.filter(t => t.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-white">
                  {tenants.filter(t => t.status === 'PENDING').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Aprobados</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-white">
                  {tenants.filter(t => t.status === 'APPROVED').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👍</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Anteriores</p>
                <p className="text-2xl font-bold text-slate-600 dark:text-white">
                  {tenants.filter(t => t.status === 'FORMER').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📁</span>
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
                  {tenantsWithOverdue.length} inquilino{tenantsWithOverdue.length > 1 ? 's tienen' : ' tiene'} pagos VENCIDOS
                </span>
              </div>
              <button
                onClick={() => setFilter('OVERDUE')}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Ver Vencidos
              </button>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
          <div className="flex flex-wrap gap-2 overflow-x-auto whitespace-nowrap">
            {['all', 'PENDING', 'APPROVED', 'ACTIVE', 'FORMER', 'OVERDUE'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as 'all' | 'PENDING' | 'APPROVED' | 'ACTIVE' | 'FORMER' | 'OVERDUE')}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                  ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800'
                  }`}
                style={{ minWidth: '120px' }}
              >
                {status === 'all' && 'Todos'}
                {status === 'PENDING' && 'Pendientes'}
                {status === 'APPROVED' && 'Aprobados'}
                {status === 'ACTIVE' && 'Activos'}
                {status === 'FORMER' && 'Anteriores'}
                {status === 'OVERDUE' && 'Vencidos'}
                <span className="ml-2 text-xs">
                  ({status === 'OVERDUE' ? tenantsWithOverdue.length :
                    status === 'all' ? tenants.length :
                      tenants.filter(t => t.status === status).length})
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateReport}
            className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors mt-2 sm:mt-0 sm:ml-4 w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Reporte
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
            <h3 className="text-lg font-medium text-slate-900 mb-2">No se encontraron inquilinos</h3>
            <p className="text-slate-600 mb-4">
              {filter === 'all'
                ? "Aún no has agregado ningún inquilino."
                : filter === 'OVERDUE'
                  ? "Ningún inquilino tiene pagos VENCIDOS."
                  : `No se encontraron inquilinos con estado "${
                      statusToSpanish(filter)
                    }".`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={handleNewTenant}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agrega tu Primer Inquilino
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
          const paymentsForSelectedTenant = payments
          .filter(p => p.tenantId === selectedTenant.id)
          .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
          const contractsForSelectedTenant = contracts
          .filter(c => c.tenantId === selectedTenant.id)
          const propertiesForSelectedTenant = properties
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

// Agregar función para traducir el estado a español
function statusToSpanish(status: string) {
  switch (status) {
    case 'PENDING': return 'Pendiente';
    case 'APPROVED': return 'Aprobado';
    case 'ACTIVE': return 'Activo';
    case 'FORMER': return 'Anterior';
    case 'OVERDUE': return 'Vencido';
    default: return status;
  }
}