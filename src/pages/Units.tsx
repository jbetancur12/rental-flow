import { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Layout/Header';
import { UnitCard } from '../components/Units/UnitCard';
import { UnitForm } from '../components/Units/UnitForm';
import { UnitDetails } from '../components/Units/UnitDetails';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/UI/ConfirmDialog';
import { Building2, Home, Store } from 'lucide-react';
import { Unit } from '../types';

export function Units() {
  const { state, dispatch, loadUnits, deleteUnit } = useApp();
  const { isOpen: isConfirmOpen, options: confirmOptions, confirm, handleConfirm, handleCancel } = useConfirm();
  const [filter, setFilter] = useState<'all' | 'BUILDING' | 'HOUSE' | 'COMMERCIAL'>('all');
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | undefined>();
  const [selectedUnit, setSelectedUnit] = useState<Unit | undefined>();



  const fetchUnits = useCallback(async () => {
    try {
      await loadUnits();
    } catch (error) {
      console.error('Failed to load units:', error);
    }
  }, [loadUnits]);

  useEffect(() => {
    if (state.units.length === 0) {
      fetchUnits();
    }
  }, [state.units.length, fetchUnits]);

  const filteredUnits = filter === 'all' 
    ? state.units 
    : state.units.filter(u => u.type === filter);

  const handleNewUnit = () => {
    setEditingUnit(undefined);
    setIsUnitFormOpen(true);
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsUnitFormOpen(true);
  };

  const handleViewUnit = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsDetailsOpen(true);
  };

  const handleDeleteUnit = async (id: string) => {
    const unit = state.units.find(u => u.id === id);
    const propertiesInUnit = state.properties.filter(p => p.unitId === id);
    
    const confirmed = await confirm({
      title: 'Delete Unit',
      message: `Are you sure you want to delete "${unit?.name}"? This will also delete ${propertiesInUnit.length} properties within it.`,
      confirmText: 'Delete',
      type: 'danger'
    });

    if (confirmed) {
      await deleteUnit(id);
    }
  };

  const handleSaveUnit = (unitData: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingUnit) {
      dispatch({
        type: 'UPDATE_UNIT',
        payload: {
          ...unitData,
          id: editingUnit.id,
          createdAt: editingUnit.createdAt,
          updatedAt: new Date()
        }
      });
    } else {
      dispatch({
        type: 'ADD_UNIT',
        payload: {
          ...unitData,
          id: `unit-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  };

  // Get properties for each unit
  const getPropertiesForUnit = (unitId: string) => {
    return state.properties.filter(p => p.unitId === unitId);
  };

  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Units Management" 
        onNewItem={handleNewUnit}
        newItemLabel="Add Unit"
      />
      
      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Units</p>
                <p className="text-2xl font-bold text-slate-900">{state.units.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Buildings</p>
                <p className="text-2xl font-bold text-blue-600">
                  {state.units.filter(u => u.type === 'BUILDING').length}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Houses</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {state.units.filter(u => u.type === 'HOUSE').length}
                </p>
              </div>
              <Home className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Commercial</p>
                <p className="text-2xl font-bold text-orange-600">
                  {state.units.filter(u => u.type === 'COMMERCIAL').length}
                </p>
              </div>
              <Store className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {['all', 'BUILDING', 'HOUSE', 'COMMERCIAL'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type as 'all' | 'BUILDING' | 'HOUSE' | 'COMMERCIAL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
                {type !== 'all' && (
                  <span className="ml-2 text-xs">
                    ({state.units.filter(u => u.type === type).length})
                  </span>
                )}
                {type === 'all' && (
                  <span className="ml-2 text-xs">({state.units.length})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Units Grid */}
        {filteredUnits.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                properties={getPropertiesForUnit(unit.id)}
                onEdit={handleEditUnit}
                onView={handleViewUnit}
                onDelete={handleDeleteUnit}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <Building2 className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No units found</h3>
            <p className="text-slate-600 mb-4">
              {filter === 'all' 
                ? "You haven't added any units yet."
                : `No ${filter} units found.`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={handleNewUnit}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Unit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Unit Form Modal */}
      <UnitForm
        unit={editingUnit}
        isOpen={isUnitFormOpen}
        onClose={() => setIsUnitFormOpen(false)}
        onSave={handleSaveUnit}
      />

      {/* Unit Details Modal */}
      {selectedUnit && (
        <UnitDetails
          unit={selectedUnit}
          properties={getPropertiesForUnit(selectedUnit.id)}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onEdit={() => {
            setIsDetailsOpen(false);
            handleEditUnit(selectedUnit);
          }}
        />
      )}

      {/* Confirm Dialog */}
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