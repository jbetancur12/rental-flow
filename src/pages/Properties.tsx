import React, { useState, useEffect } from 'react';
import { Header } from '../components/Layout/Header';
import { PropertyCard } from '../components/Properties/PropertyCard';
import { PropertyForm } from '../components/Properties/PropertyForm';
import { QuickRentModal } from '../components/Properties/QuickRentModal';
import { QuickPaymentModal } from '../components/Payments/QuickPaymentModal';
import { Property } from '../types';
import { useApp } from '../context/AppContext';
import { mockProperties } from '../data/mockData';
import { mockUnits } from '../data/mockUnits';

export function Properties() {
  const { state, dispatch } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQuickRentOpen, setIsQuickRentOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>();
  const [rentingProperty, setRentingProperty] = useState<Property | undefined>();
  const [paymentProperty, setPaymentProperty] = useState<Property | undefined>();
  
  // FIX: Filtros funcionando correctamente
  const [filter, setFilter] = useState<'all' | Property['status']>('all');

  useEffect(() => {
    // FIX: Cargar unidades primero, luego propiedades
    // if (state.units.length === 0) {
    //   mockUnits.forEach(unit => {
    //     dispatch({ type: 'ADD_UNIT', payload: unit });
    //   });
    // }
    
    // if (state.properties.length === 0) {
    //   mockProperties.forEach(property => {
    //     dispatch({ type: 'ADD_PROPERTY', payload: property });
    //   });
    // }
  }, [state.units.length, state.properties.length, dispatch]);

  // FIX: Filtros funcionando correctamente
  const filteredProperties = filter === 'all' 
    ? state.properties 
    : state.properties.filter(p => p.status === filter);

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

  const handleViewContract = (property: Property) => {
    // Navigate to contracts page with filter
    window.location.href = '/contracts';
  };

  const handleRecordPayment = (property: Property) => {
    setPaymentProperty(property);
    setIsPaymentModalOpen(true);
  };

  const handleTerminateContract = (property: Property) => {
    if (confirm('¿Está seguro de que desea terminar el contrato de esta propiedad?')) {
      // Find active contract
      const activeContract = state.contracts.find(c => 
        c.propertyId === property.id && c.status === 'active'
      );
      
      if (activeContract) {
        // Update contract status
        const updatedContract = {
          ...activeContract,
          status: 'terminated' as const,
          terminationDate: new Date()
        };
        
        // Update property status
        const updatedProperty = {
          ...property,
          status: 'available' as const,
          updatedAt: new Date()
        };
        
        // Update tenant status
        const tenant = state.tenants.find(t => t.id === activeContract.tenantId);
        if (tenant) {
          const updatedTenant = {
            ...tenant,
            status: 'former' as const
          };
          dispatch({ type: 'UPDATE_TENANT', payload: updatedTenant });
        }
        
        dispatch({ type: 'UPDATE_CONTRACT', payload: updatedContract });
        dispatch({ type: 'UPDATE_PROPERTY', payload: updatedProperty });
        
        alert('Contrato terminado exitosamente. La propiedad ahora está disponible.');
      }
    }
  };

  const handleDeleteProperty = (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar esta propiedad?')) {
      dispatch({ type: 'DELETE_PROPERTY', payload: id });
    }
  };

  const handleSaveProperty = (propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProperty) {
      dispatch({
        type: 'UPDATE_PROPERTY',
        payload: {
          ...propertyData,
          id: editingProperty.id,
          createdAt: editingProperty.createdAt,
          updatedAt: new Date()
        }
      });
    } else {
      dispatch({
        type: 'ADD_PROPERTY',
        payload: {
          ...propertyData,
          id: `prop-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  };

  // Calculate overdue properties
  const overdueProperties = state.properties.filter(property => {
    if (property.status !== 'rented') return false;
    const activeContract = state.contracts.find(c => 
      c.propertyId === property.id && c.status === 'active'
    );
    if (!activeContract) return false;
    
    const overduePayments = state.payments.filter(p => 
      p.contractId === activeContract.id && 
      p.status === 'pending' && 
      new Date(p.dueDate) < new Date()
    );
    
    return overduePayments.length > 0;
  });

  // Get payment modal data
  const getPaymentModalData = () => {
    if (!paymentProperty) return {};
    
    const activeContract = state.contracts.find(c => 
      c.propertyId === paymentProperty.id && c.status === 'active'
    );
    
    if (!activeContract) return {};
    
    const tenant = state.tenants.find(t => t.id === activeContract.tenantId);
    const overduePayments = state.payments.filter(p => 
      p.contractId === activeContract.id && 
      p.status === 'pending' && 
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
      />
      
      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total de Propiedades</p>
                <p className="text-2xl font-bold text-slate-900">{state.properties.length}</p>
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
                  {state.properties.filter(p => p.status === 'available').length}
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
                  {state.properties.filter(p => p.status === 'rented').length}
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
            {['all', 'available', 'rented', 'reserved', 'maintenance'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {status === 'all' ? 'Todas' :
                 status === 'available' ? 'Disponibles' :
                 status === 'rented' ? 'Alquiladas' :
                 status === 'reserved' ? 'Reservadas' :
                 'Mantenimiento'}
                {status !== 'all' && (
                  <span className="ml-2 text-xs">
                    ({state.properties.filter(p => p.status === status).length})
                  </span>
                )}
                {status === 'all' && (
                  <span className="ml-2 text-xs">({state.properties.length})</span>
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
                : `No se encontraron propiedades con estado "${filter === 'available' ? 'disponibles' : 
                    filter === 'rented' ? 'alquiladas' : 
                    filter === 'reserved' ? 'reservadas' : 'en mantenimiento'}".`
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
    </div>
  );
}