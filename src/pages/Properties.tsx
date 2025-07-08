import { useState, useMemo, useEffect } from 'react';
import { Header } from '../components/Layout/Header';
import { PropertyCard } from '../components/Properties/PropertyCard';
import { PropertyForm } from '../components/Properties/PropertyForm';
import { QuickRentModal } from '../components/Properties/QuickRentModal';
import { QuickPaymentModal } from '../components/Payments/QuickPaymentModal';
import { Property } from '../types';
import { useApp } from '../context/useApp';
import { ConfirmDialog } from '../components/UI/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../hooks/useToast';

export function Properties() {
  const { properties, contracts, tenants, payments, units, updateProperty, updateTenant, updateContract, deleteProperty, createProperty, loadUnits, loadProperties } = useApp();
  const { limits, isLimitExceeded } = useSubscription();
  const toast = useToast();

  const { isOpen: isConfirmOpen, options: confirmOptions, confirm, handleConfirm, handleCancel } = useConfirm();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQuickRentOpen, setIsQuickRentOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>();
  const [rentingProperty, setRentingProperty] = useState<Property | undefined>();
  const [paymentProperty, setPaymentProperty] = useState<Property | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  // FIX: Filtros funcionando correctamente
  const [filter, setFilter] = useState<'all' | Property['status']>('all');

 const limitReached = isLimitExceeded('properties');

  // Cargar unidades y propiedades al montar la página
  useEffect(() => {
    if (units.length === 0) {
      loadUnits();
    }
    if (properties.length === 0) {
      loadProperties();
    }
  }, [units.length, properties.length, loadUnits, loadProperties]);

  const filteredProperties = useMemo(() => {
    let filtered = properties;
    if (filter !== 'all') {
      filtered = filtered.filter(p => p.status === filter);
    }
    if (searchQuery) {
      filtered = filtered.filter(property =>
        property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.unitName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [properties, filter, searchQuery]);

  const handleNewProperty = () => {
    setEditingProperty(undefined);
    setIsFormOpen(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setIsFormOpen(true);
  };

  const handleRentProperty = (property: Property) => {
    setRentingProperty(property);
    setIsQuickRentOpen(true);
  };

  const handleViewContract = () => {
    // Navigate to contracts page with filter
    window.location.href = '/contracts';
  };

  const handleRecordPayment = (property: Property) => {
    setPaymentProperty(property);
    setIsPaymentModalOpen(true);
  };

  const handleTerminateContract = async (property: Property) => {
    const confirmed = await confirm({
      title: 'Delete Unit',
      message: `¿Está seguro de que desea terminar el contrato de esta propiedad?`,
      confirmText: 'Delete',
      type: 'danger'
    });
    if (confirmed) {
      const activeContract = contracts.find(c =>
        c.propertyId === property.id && c.status === 'ACTIVE'
      );
      if (activeContract) {
        const updatedContract = {
          ...activeContract,
          status: 'TERMINATED' as const,
          terminationDate: new Date(),
          actionContext: "TERMINATED"
        };
        const updatedProperty = {
          ...property,
          status: 'AVAILABLE' as const,
          updatedAt: new Date(),
          actionContext: "MAKE_AVAILABLE"
        };
        const tenant = tenants.find(t => t.id === activeContract.tenantId);
        if (tenant) {
          const updatedTenant = {
            ...tenant,
            status: 'FORMER' as const
          };
          await updateTenant(updatedTenant.id, updatedTenant);
        }
        await updateContract(updatedContract.id, updatedContract);
        await updateProperty(updatedProperty.id, updatedProperty);
      }
    }
  };

  const handleDeleteProperty = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Unit',
      message: `¿Está seguro de que desea eliminar esta propiedad?`,
      confirmText: 'Eliminar',
      type: 'danger'
    });
    if (confirmed) {
      try {
        await deleteProperty(id);
        toast.success('Propiedad eliminada', 'La propiedad se eliminó correctamente.');
      } catch (error: any) {
        const msg = error?.error || error?.message || 'No se pudo eliminar la propiedad.';
        toast.error('Error al eliminar propiedad', msg);
      }
    }
  };

  const handleSaveProperty = async (propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProperty) {
      await updateProperty(editingProperty.id, propertyData);
    } else {
      await createProperty(propertyData);
    }
  };

  // Calculate overdue properties
  const overdueProperties = properties.filter(property => {
    if (property.status !== 'RENTED') return false;
    const activeContract = contracts.find(c =>
      c.propertyId === property.id && c.status === 'ACTIVE'
    );
    if (!activeContract) return false;
    const overduePayments = payments.filter(p =>
      p.contractId === activeContract.id &&
      p.status === 'PENDING' &&
      new Date(p.dueDate) < new Date()
    );
    return overduePayments.length > 0;
  });

  // Get payment modal data
  const getPaymentModalData = () => {
    if (!paymentProperty) return {};
    const activeContract = contracts.find(c =>
      c.propertyId === paymentProperty.id && c.status === 'ACTIVE'
    );
    if (!activeContract) return {};
    const tenant = tenants.find(t => t.id === activeContract.tenantId);
    const overduePayments = payments.filter(p =>
      p.contractId === activeContract.id &&
      p.status === 'PENDING' &&
      new Date(p.dueDate) < new Date()
    );
    return { tenant, contract: activeContract, overduePayments };
  };

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title="Propiedades"
        onNewItem={handleNewProperty}
        newItemLabel="Agregar Propiedad"
        showSearch={true}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por nombre o dirección..."
        isNewItemDisabled={limitReached} 

      />
      {limitReached && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          Has alcanzado el límite de **{limits.maxProperties} propiedades** de tu plan actual. Para añadir más, por favor <a href="/settings?tab=subscription" className="font-bold underline">actualiza tu plan</a>.
        </div>
      )}
      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total de Propiedades</p>
                <p className="text-2xl font-bold text-slate-900">{properties.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Disponibles</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {properties.filter(p => p.status === 'AVAILABLE').length}
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
                <p className="text-sm text-slate-600">Alquiladas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {properties.filter(p => p.status === 'RENTED').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔑</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pagos Vencidos</p>
                <p className="text-2xl font-bold text-red-600">
                  {overdueProperties.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
        </div>

        {/* FIX: Filtros funcionando */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {['all', 'AVAILABLE', 'RENTED', 'RESERVED', 'MAINTENANCE'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as 'all' | 'AVAILABLE' | 'RENTED' | 'RESERVED' | 'MAINTENANCE')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
              >
                {status === 'all' ? 'Todas' :
                  status === 'AVAILABLE' ? 'Disponibles' :
                    status === 'RENTED' ? 'Alquiladas' :
                      status === 'RESERVED' ? 'Reservadas' :
                        'Mantenimiento'}
                {status !== 'all' && (
                  <span className="ml-2 text-xs">
                    ({properties.filter(p => p.status === status).length})
                  </span>
                )}
                {status === 'all' && (
                  <span className="ml-2 text-xs">({properties.length})</span>
                )}
              </button>
            ))}
          </div>
        </div>
        {/* Properties Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={handleEditProperty}
                onDelete={handleDeleteProperty}
                onRent={handleRentProperty}
                onViewContract={handleViewContract}
                onRecordPayment={handleRecordPayment}
                onTerminateContract={handleTerminateContract}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No se encontraron propiedades</h3>
            <p className="text-slate-600 mb-4">
              {filter === 'all'
                ? "Aún no has agregado ninguna propiedad."
                : `No se encontraron propiedades con estado "${filter === 'AVAILABLE' ? 'disponibles' :
                  filter === 'RENTED' ? 'alquiladas' :
                    filter === 'RESERVED' ? 'reservadas' : 'en mantenimiento'}".`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={handleNewProperty}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                data-testid="add-property-btn"
              >
                Agregar Tu Primera Propiedad
              </button>
            )}
          </div>
        )}
      </div>

      <PropertyForm
        property={editingProperty}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveProperty}
      />

      {rentingProperty && (
        <QuickRentModal
          property={rentingProperty}
          isOpen={isQuickRentOpen}
          onClose={() => setIsQuickRentOpen(false)}
        />
      )}

      {paymentProperty && (
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