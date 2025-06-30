import React, { useState, useEffect } from 'react';
import { Header } from '../components/Layout/Header';
import { MaintenanceForm } from '../components/Maintenance/MaintenanceForm';
import { useApp } from '../context/AppContext';
import { mockMaintenanceRequests } from '../data/mockData';
import { mockProperties } from '../data/mockData';
import { mockUnits } from '../data/mockUnits';
import { generateMaintenanceReport } from '../utils/reportGenerator';
import { Wrench, AlertTriangle, User, Home, Calendar, DollarSign, Clock, Download, Edit, Trash2, Filter, UserPlus, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import { MaintenanceRequest } from '../types';

export function Maintenance() {
  const { state, dispatch } = useApp();
  
  // FIX: Estados para filtros funcionando
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [monthFilter, setMonthFilter] = useState<'all' | number>('all');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | undefined>();
  
  // NEW: Estados para modales de asignar técnico y ver detalles
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | undefined>();
  const [assigningRequest, setAssigningRequest] = useState<MaintenanceRequest | undefined>();
  const [technicianName, setTechnicianName] = useState('');

  useEffect(() => {
    // FIX: Cargar unidades y propiedades primero, luego mantenimiento
    if (state.units.length === 0) {
      mockUnits.forEach(unit => {
        dispatch({ type: 'ADD_UNIT', payload: unit });
      });
    }
    
    if (state.properties.length === 0) {
      mockProperties.forEach(property => {
        dispatch({ type: 'ADD_PROPERTY', payload: property });
      });
    }
    
    if (state.maintenanceRequests.length === 0) {
      mockMaintenanceRequests.forEach(request => {
        dispatch({ type: 'ADD_MAINTENANCE_REQUEST', payload: request });
      });
    }
  }, [state.units.length, state.properties.length, state.maintenanceRequests.length, dispatch]);

  // FIX: Filtros funcionando correctamente
  const filteredRequests = state.maintenanceRequests.filter(request => {
    // Filtro por status
    if (statusFilter !== 'all' && request.status !== statusFilter) {
      return false;
    }
    
    // Filtro por mes y año
    if (monthFilter !== 'all') {
      const requestMonth = request.reportedDate.getMonth() + 1;
      const requestYear = request.reportedDate.getFullYear();
      
      if (requestMonth !== monthFilter || requestYear !== yearFilter) {
        return false;
      }
    } else if (yearFilter) {
      const requestYear = request.reportedDate.getFullYear();
      if (requestYear !== yearFilter) {
        return false;
      }
    }
    
    return true;
  });

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      emergency: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-slate-100 text-slate-800'
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      plumbing: '🔧',
      electrical: '⚡',
      hvac: '🌡️',
      appliance: '📱',
      structural: '🏗️',
      other: '🔨'
    };
    return icons[category as keyof typeof icons] || icons.other;
  };

  const getPropertyName = (propertyId: string) => {
    const property = state.properties.find(p => p.id === propertyId);
    return property?.name || 'Propiedad Desconocida';
  };

  const getTenantName = (tenantId?: string) => {
    if (!tenantId) return 'Administración de Propiedades';
    const tenant = state.tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Inquilino Desconocido';
  };

  const handleNewRequest = () => {
    setEditingRequest(undefined);
    setIsFormOpen(true);
  };

  const handleEditRequest = (request: MaintenanceRequest) => {
    setEditingRequest(request);
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar esta solicitud de mantenimiento?')) {
      // In a real app, you'd dispatch a DELETE_MAINTENANCE_REQUEST action
      console.log('Delete maintenance request:', id);
    }
  };

  // NEW: Función para asignar técnico
  const handleAssignTechnician = (request: MaintenanceRequest) => {
    setAssigningRequest(request);
    setTechnicianName(request.assignedTo || '');
    setIsAssignModalOpen(true);
  };

  // NEW: Función para ver detalles
  const handleViewDetails = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  // NEW: Función para marcar como completada
  const handleMarkComplete = (request: MaintenanceRequest) => {
    if (confirm('¿Está seguro de que desea marcar esta solicitud como completada?')) {
      const updatedRequest = {
        ...request,
        status: 'completed' as const,
        completedDate: new Date()
      };
      dispatch({ type: 'UPDATE_MAINTENANCE_REQUEST', payload: updatedRequest });
    }
  };

  // NEW: Guardar asignación de técnico
  const handleSaveAssignment = () => {
    if (!assigningRequest || !technicianName.trim()) {
      alert('Por favor ingrese el nombre del técnico');
      return;
    }

    const updatedRequest = {
      ...assigningRequest,
      assignedTo: technicianName.trim(),
      status: 'in_progress' as const
    };

    dispatch({ type: 'UPDATE_MAINTENANCE_REQUEST', payload: updatedRequest });
    setIsAssignModalOpen(false);
    setAssigningRequest(undefined);
    setTechnicianName('');
  };

  const handleSaveRequest = (requestData: Omit<MaintenanceRequest, 'id'>) => {
    if (editingRequest) {
      dispatch({
        type: 'UPDATE_MAINTENANCE_REQUEST',
        payload: {
          ...requestData,
          id: editingRequest.id
        }
      });
    } else {
      dispatch({
        type: 'ADD_MAINTENANCE_REQUEST',
        payload: {
          ...requestData,
          id: `maint-${Date.now()}`
        }
      });
    }
  };

  const handleGenerateReport = () => {
    generateMaintenanceReport(filteredRequests);
  };

  // Contadores para tabs
  const getStatusCount = (status: string) => {
    if (status === 'all') return state.maintenanceRequests.length;
    return state.maintenanceRequests.filter(r => r.status === status).length;
  };

  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Mantenimiento" 
        onNewItem={handleNewRequest}
        newItemLabel="Nueva Solicitud"
      />
      
      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Solicitudes Abiertas</p>
                <p className="text-2xl font-bold text-red-600">
                  {state.maintenanceRequests.filter(r => r.status === 'open').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">En Progreso</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {state.maintenanceRequests.filter(r => r.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Completadas</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {state.maintenanceRequests.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <Wrench className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Costo Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${state.maintenanceRequests.reduce((sum, r) => sum + (r.actualCost || r.estimatedCost || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* NEW: Filtros por Mes/Año */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mes</label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los Meses</option>
                <option value={1}>Enero</option>
                <option value={2}>Febrero</option>
                <option value={3}>Marzo</option>
                <option value={4}>Abril</option>
                <option value={5}>Mayo</option>
                <option value={6}>Junio</option>
                <option value={7}>Julio</option>
                <option value={8}>Agosto</option>
                <option value={9}>Septiembre</option>
                <option value={10}>Octubre</option>
                <option value={11}>Noviembre</option>
                <option value={12}>Diciembre</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Año</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2023, 2022].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Reporte
              </button>
            </div>
          </div>
        </div>

        {/* FIX: Status Tabs funcionando */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2">
            {['all', 'open', 'in_progress', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {status === 'all' ? 'Todas' :
                 status === 'open' ? 'Abiertas' :
                 status === 'in_progress' ? 'En Progreso' :
                 status === 'completed' ? 'Completadas' :
                 'Canceladas'}
                <span className="ml-2 text-xs">
                  ({getStatusCount(status)})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Maintenance Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start">
                  <div className="text-2xl mr-3">{getCategoryIcon(request.category)}</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{request.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority === 'low' ? 'Baja' :
                         request.priority === 'medium' ? 'Media' :
                         request.priority === 'high' ? 'Alta' : 'Emergencia'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status === 'open' ? 'Abierta' :
                         request.status === 'in_progress' ? 'En Progreso' :
                         request.status === 'completed' ? 'Completada' : 'Cancelada'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => handleEditRequest(request)}
                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteRequest(request.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-slate-600 text-sm mb-4 line-clamp-2">{request.description}</p>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-slate-600">
                  <Home className="w-4 h-4 mr-3" />
                  <span className="text-sm">{getPropertyName(request.propertyId)}</span>
                </div>
                <div className="flex items-center text-slate-600">
                  <User className="w-4 h-4 mr-3" />
                  <span className="text-sm">{getTenantName(request.tenantId)}</span>
                </div>
                <div className="flex items-center text-slate-600">
                  <Calendar className="w-4 h-4 mr-3" />
                  <span className="text-sm">Reportado: {format(request.reportedDate, 'MMM d, yyyy')}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Costo Estimado</span>
                    <p className="font-medium text-slate-900">
                      {request.estimatedCost ? `$${request.estimatedCost.toLocaleString()}` : 'Por Determinar'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Asignado a</span>
                    <p className="font-medium text-slate-900">{request.assignedTo || 'Sin Asignar'}</p>
                  </div>
                </div>
              </div>

              {request.actualCost && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-700">Costo Real:</span>
                    <span className="font-medium text-emerald-800">${request.actualCost.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* FIX: Botones funcionando */}
              <div className="mt-6 flex space-x-2">
                {request.status === 'open' && (
                  <button 
                    onClick={() => handleAssignTechnician(request)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Asignar Técnico
                  </button>
                )}
                {request.status === 'in_progress' && (
                  <button 
                    onClick={() => handleMarkComplete(request)}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                  >
                    Marcar Completa
                  </button>
                )}
                <button 
                  onClick={() => handleViewDetails(request)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm flex items-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <Wrench className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No se encontraron solicitudes de mantenimiento</h3>
            <p className="text-slate-600 mb-4">
              {statusFilter === 'all' && monthFilter === 'all'
                ? "No se han enviado solicitudes de mantenimiento."
                : `No se encontraron solicitudes para los filtros seleccionados.`
              }
            </p>
            <button
              onClick={handleNewRequest}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear Primera Solicitud
            </button>
          </div>
        )}
      </div>

      {/* Maintenance Form Modal */}
      <MaintenanceForm
        request={editingRequest}
        properties={state.properties}
        tenants={state.tenants}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveRequest}
      />

      {/* NEW: Assign Technician Modal */}
      {isAssignModalOpen && assigningRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Asignar Técnico</h2>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-medium text-slate-900 mb-2">{assigningRequest.title}</h3>
                <p className="text-sm text-slate-600">{getPropertyName(assigningRequest.propertyId)}</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre del Técnico
                </label>
                <input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  placeholder="Ingrese el nombre del técnico"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAssignment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Asignar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Details Modal */}
      {isDetailsModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Detalles de Solicitud</h2>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start">
                <div className="text-3xl mr-4">{getCategoryIcon(selectedRequest.category)}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{selectedRequest.title}</h3>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                      {selectedRequest.priority === 'low' ? 'Baja' :
                       selectedRequest.priority === 'medium' ? 'Media' :
                       selectedRequest.priority === 'high' ? 'Alta' : 'Emergencia'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status === 'open' ? 'Abierta' :
                       selectedRequest.status === 'in_progress' ? 'En Progreso' :
                       selectedRequest.status === 'completed' ? 'Completada' : 'Cancelada'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Descripción</h4>
                <p className="text-slate-700">{selectedRequest.description}</p>
              </div>

              {/* Property and Tenant Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Propiedad</h4>
                  <p className="text-slate-700">{getPropertyName(selectedRequest.propertyId)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Reportado por</h4>
                  <p className="text-slate-700">{getTenantName(selectedRequest.tenantId)}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Fecha de Reporte</h4>
                  <p className="text-slate-700">{format(selectedRequest.reportedDate, 'dd/MM/yyyy')}</p>
                </div>
                {selectedRequest.completedDate && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Fecha de Completado</h4>
                    <p className="text-slate-700">{format(selectedRequest.completedDate, 'dd/MM/yyyy')}</p>
                  </div>
                )}
              </div>

              {/* Assignment and Costs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Asignado a</h4>
                  <p className="text-slate-700">{selectedRequest.assignedTo || 'Sin asignar'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Costo</h4>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600">
                      Estimado: {selectedRequest.estimatedCost ? `$${selectedRequest.estimatedCost.toLocaleString()}` : 'N/A'}
                    </p>
                    {selectedRequest.actualCost && (
                      <p className="text-sm text-emerald-600 font-medium">
                        Real: ${selectedRequest.actualCost.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Notas</h4>
                  <p className="text-slate-700">{selectedRequest.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}