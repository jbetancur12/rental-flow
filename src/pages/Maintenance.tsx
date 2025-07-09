import { useState, useEffect, useMemo } from 'react';
import { Header } from '../components/Layout/Header';
import { MaintenanceForm } from '../components/Maintenance/MaintenanceForm';
import { useApp } from '../context/useApp';
import { generateMaintenanceReport } from '../utils/reportGenerator';
import { Wrench, AlertTriangle, User, Home, Calendar, DollarSign, Clock, Download, Edit, Trash2, Filter, UserPlus, Eye, X } from 'lucide-react';
import { MaintenanceRequest } from '../types';
import { formatInTimeZone } from 'date-fns-tz';
import { ConfirmDialog } from '../components/UI/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';

export function Maintenance() {
  const { maintenanceRequests, units, properties, tenants, updateMaintenanceRequest, createMaintenanceRequest, markMaintenanceAsComplete, loadMaintenanceRequests, loadProperties, loadUnits, asignMaintenanceTechinician } = useApp();
    const { isOpen: isConfirmOpen, options: confirmOptions, confirm, handleConfirm, handleCancel } = useConfirm();
    const toast = useToast();
  
  // FIX: Estados para filtros funcionando
  const [statusFilter, setStatusFilter] = useState<'all' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('all');
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

    const [isCostModalOpen, setIsCostModalOpen] = useState(false);
    const [completingRequest, setCompletingRequest] = useState<MaintenanceRequest | undefined>();
    const [actualCost, setActualCost] = useState(0);

useEffect(() => {
  // 1. Definimos una única función para cargar todos los datos iniciales.
  const loadInitialData = async () => {
    try {
      // 2. Preparamos un array con todas las promesas de carga de datos.
      //    Solo añadimos la promesa si los datos correspondientes no han sido cargados.
      const promisesToFetch = [];

      if (units.length === 0) {
        promisesToFetch.push(loadUnits());
      }
      if (properties.length === 0) {
        promisesToFetch.push(loadProperties());
      }
      if (maintenanceRequests.length === 0) {
        promisesToFetch.push(loadMaintenanceRequests());
      }
      
      // 3. Usamos Promise.all para ejecutar todas las cargas de datos en paralelo.
      //    Esto es mucho más rápido que llamarlas una por una.
      if (promisesToFetch.length > 0) {
        await Promise.all(promisesToFetch);
      }
      
    } catch (error) {
      console.error("Error al cargar los datos iniciales:", error);
      // Aquí podrías usar tu hook de toast para notificar al usuario.
    }
  };

  loadInitialData();

}, [

  
]);

  // FIX: Filtros funcionando correctamente
    const filteredRequests = useMemo(() => {
      
        return maintenanceRequests.filter(request => {
            if (statusFilter !== 'all' && request.status !== statusFilter) {
                return false;
            }
            
            if (monthFilter !== 'all' || yearFilter) {
                const reportedDate = new Date(request.reportedDate);
                const requestMonth = reportedDate.getUTCMonth() + 1;
                const requestYear = reportedDate.getUTCFullYear();

                if (monthFilter !== 'all' && requestMonth !== monthFilter) {
                    return false;
                }
                if (yearFilter && requestYear !== yearFilter) {
                    return false;
                }
            }
            return true;
        });
    }, [maintenanceRequests, statusFilter, monthFilter, yearFilter]);

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      emergency: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.LOW;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      OPEN: 'bg-red-100 text-red-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-emerald-100 text-emerald-800',
      CANCELLED: 'bg-slate-100 text-slate-800'
    };
    return colors[status as keyof typeof colors] || colors.OPEN;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      PLUMBING: '🔧',
      ELECTRICAL: '⚡',
      HVAC: '🌡️',
      APPLIANCE: '📱',
      STRUCTURAL: '🏗️',
      OTHER: '🔨'
    };
    return icons[category as keyof typeof icons] || icons.OTHER;
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || 'Propiedad Desconocida';
  };

  const getTenantName = (tenantId?: string) => {
    if (!tenantId) return 'Administración de Propiedades';
    const tenant = tenants.find(t => t.id === tenantId);
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

  const handleDeleteRequest = async (id: string) => {

       const confirmed = await confirm({
      title: 'Anular Pago',
      message: '¿Está seguro de que desea eliminar esta solicitud de mantenimiento?',
      confirmText: 'Sí, Elimminar',
      type: 'danger' // Un color de advertencia es más adecuado que 'danger'
    });
    
    if (confirmed) {
      // In a real app, you'd dispatch a DELETE_MAINTENANCE_REQUEST action
      alert('Funcionalidad aún no habilitada - ' + id);
    }
  };

  // NEW: Función para asignar técnico
  const handleAssignTechnician = (request: MaintenanceRequest) => {
    setAssigningRequest(request);
    setTechnicianName(request.assignedTo || '');
    setIsAssignModalOpen(true);
  };


  const handleViewDetails = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  // NEW: Función para marcar como completada
const handleMarkComplete = async (request: MaintenanceRequest) => {
  const confirmed = await confirm({
    title: 'Completar Solicitud',
    message: '¿Está seguro de que desea marcar esta solicitud como completada?',
    confirmText: 'Sí, Completar',
    type: 'danger'
  });

  if (confirmed) {
    // Si el costo ya existe, la completamos directamente.
    if (request.actualCost && request.actualCost > 0) {
      try {
        await markMaintenanceAsComplete(request.id, { status: 'COMPLETED', completedDate: new Date() });
        toast.success('Solicitud completada', 'La solicitud de mantenimiento fue marcada como completada.');
      } catch (error: any) {
        let msg = error?.error || error?.message || 'No se pudo marcar como completada.';
        if (error?.details && Array.isArray(error.details)) {
          msg = error.details.map((d: any) => `${d.field ? d.field + ': ' : ''}${d.message}`).join(' | ');
        }
        toast.error('Error al completar solicitud', msg);
      }
    } else {
      // Si no hay costo, abrimos el nuevo modal para que el usuario lo ingrese.
      setCompletingRequest(request);
      setActualCost(request.estimatedCost || 0); // Pre-rellenamos con el costo estimado si existe
      setIsCostModalOpen(true);
    }
  }
};

    const handleSaveCostAndComplete = async () => {
  if (!completingRequest) return;

  if (actualCost <= 0) {
    toast.error('Error al completar solicitud', 'Por favor, ingrese un costo real válido.');
    return;
  }

  const dataToUpdate = {
    status: 'COMPLETED' as const,
    completedDate: new Date(),
    actualCost: actualCost
  };

  try {
    await markMaintenanceAsComplete(completingRequest.id, dataToUpdate);
    toast.success('Solicitud completada', 'La solicitud de mantenimiento fue marcada como completada.');
    setIsCostModalOpen(false); // Cierra el modal si todo sale bien
  } catch (error: any) {
    let msg = error?.error || error?.message || 'No se pudo marcar como completada.';
    if (error?.details && Array.isArray(error.details)) {
      msg = error.details.map((d: any) => `${d.field ? d.field + ': ' : ''}${d.message}`).join(' | ');
    }
    toast.error('Error al completar solicitud', msg);
  }
};
  // NEW: Guardar asignación de técnico
  const handleSaveAssignment = async () => {
    if (!assigningRequest || !technicianName.trim()) {
      toast.error('Error al asignar técnico', 'Por favor ingrese el nombre del técnico');
      return;
    }

    const updatedRequest = {
      ...assigningRequest,
      assignedTo: technicianName.trim(),
      status: 'IN_PROGRESS' as const
    };

    try {
      await asignMaintenanceTechinician(
        updatedRequest.id,
        updatedRequest
      );
      toast.success('Técnico asignado', 'El técnico fue asignado correctamente.');
      setIsAssignModalOpen(false);
      setAssigningRequest(undefined);
      setTechnicianName('');
    } catch (error: any) {
      let msg = error?.error || error?.message || 'No se pudo asignar el técnico.';
      if (error?.details && Array.isArray(error.details)) {
        msg = error.details.map((d: any) => `${d.field ? d.field + ': ' : ''}${d.message}`).join(' | ');
      }
      toast.error('Error al asignar técnico', msg);
    }
  };

  const handleSaveRequest = async (requestData: Omit<MaintenanceRequest, 'id'>) => {
    if (editingRequest) {
     
       await updateMaintenanceRequest(
        editingRequest.id,
        requestData
      );
      setEditingRequest(undefined);
    } else {
      await createMaintenanceRequest({
        ...requestData,
        id: crypto.randomUUID(),
        reportedDate: new Date(),
        status: 'OPEN' as const
      });
    }
  };

  const handleGenerateReport = () => {
    generateMaintenanceReport(filteredRequests, properties);
  };

  // Contadores para tabs
  const getStatusCount = (status: string) => {
    if (status === 'all') return maintenanceRequests.length;
    return maintenanceRequests.filter(r => r.status === status).length;
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
                  {maintenanceRequests.filter(r => r.status === 'OPEN').length}
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
                  {maintenanceRequests.filter(r => r.status === 'IN_PROGRESS').length}
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
                  {maintenanceRequests.filter(r => r.status === 'COMPLETED').length}
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
                  ${maintenanceRequests.reduce((sum, r) => sum + (r.actualCost || r.estimatedCost || 0), 0).toLocaleString()}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 gap-y-2">
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
          <div className="flex flex-wrap gap-2 overflow-x-auto whitespace-nowrap">
            {['all', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'all')}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
                style={{ minWidth: '120px' }}
              >
                {status === 'all' ? 'Todas' :
                 status === 'OPEN' ? 'Abiertas' :
                 status === 'IN_PROGRESS' ? 'En Progreso' :
                 status === 'COMPLETED' ? 'Completadas' :
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
          {filteredRequests.map((request) => {
            return (
            <div key={request.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start">
                  <div className="text-2xl mr-3">{getCategoryIcon(request.category)}</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{request.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority === 'LOW' ? 'Baja' :
                         request.priority === 'MEDIUM' ? 'Media' :
                         request.priority === 'HIGH' ? 'Alta' : 'Emergencia'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status === 'OPEN' ? 'Abierta' :
                         request.status === 'IN_PROGRESS' ? 'En Progreso' :
                         request.status === 'COMPLETED' ? 'Completada' : 'Cancelada'}
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
  Reportado: {request.reportedDate ? formatInTimeZone(request.reportedDate, 'UTC', 'MMM d, yyyy') : 'N/A'}
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
                {request.status === 'OPEN' && (
                  <button 
                    onClick={() => handleAssignTechnician(request)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Asignar Técnico
                  </button>
                )}
                {request.status === 'IN_PROGRESS' && (
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
          )})}
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
        properties={properties}
        tenants={tenants}
        units={units || []}
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
                      {selectedRequest.priority === 'LOW' ? 'Baja' :
                       selectedRequest.priority === 'MEDIUM' ? 'Media' :
                       selectedRequest.priority === 'HIGH' ? 'Alta' : 'Emergencia'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status === 'OPEN' ? 'Abierta' :
                       selectedRequest.status === 'IN_PROGRESS' ? 'En Progreso' :
                       selectedRequest.status === 'COMPLETED' ? 'Completada' : 'Cancelada'}
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
                  <p className="text-slate-700">{formatInTimeZone(selectedRequest.reportedDate, 'UTC', 'dd/MM/yyyy')}</p>
                </div>
                {selectedRequest.completedDate && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Fecha de Completado</h4>
                    <p className="text-slate-700">{formatInTimeZone(selectedRequest.completedDate, 'UTC', 'dd/MM/yyyy')}</p>
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
      {isCostModalOpen && completingRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl max-w-md w-full mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-900">Registrar Costo Final</h2>
                            <button
                                onClick={() => setIsCostModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="mb-4">
                                <h3 className="font-medium text-slate-900 mb-2">{completingRequest.title}</h3>
                                <p className="text-sm text-slate-600">{getPropertyName(completingRequest.propertyId)}</p>
                            </div>
                            
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Costo Real ($)
                                </label>
                                <input
                                    type="number"
                                    value={actualCost}
                                    onChange={(e) => setActualCost(parseFloat(e.target.value) || 0)}
                                    placeholder="Ingrese el costo final del trabajo"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsCostModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:text-slate-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveCostAndComplete}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                >
                                    Guardar y Completar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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