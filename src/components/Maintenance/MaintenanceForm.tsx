import { useState, useEffect } from 'react';
import { MaintenanceRequest, Property, Tenant } from '../../types';
import { X } from 'lucide-react';
import { formatDateToYYYYMMDD } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';

interface MaintenanceFormProps {
  request?: MaintenanceRequest;
  properties: Property[];
  tenants: Tenant[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (request: Omit<MaintenanceRequest, 'id'>) => void;
}

export function MaintenanceForm({ request, properties, tenants, isOpen, onClose, onSave }: MaintenanceFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    propertyId: '',
    tenantId: '',
    title: '',
    description: '',
    priority: 'MEDIUM' as MaintenanceRequest['priority'],
    category: 'OTHER' as MaintenanceRequest['category'],
    status: 'OPEN' as MaintenanceRequest['status'],
    reportedDate: new Date().toISOString().split('T')[0],
    completedDate: '',
    assignedTo: '',
    estimatedCost: 0,
    actualCost: 0,
    notes: ''
  });

  useEffect(() => {
    if (request) {
      setFormData({
        propertyId: request.propertyId,
        tenantId: request.tenantId || '',
        title: request.title,
        description: request.description,
        priority: request.priority,
        category: request.category,
        status: request.status,
        reportedDate: formatDateToYYYYMMDD(request.reportedDate),
            completedDate: request.completedDate ? formatDateToYYYYMMDD(request.completedDate) : '',
            assignedTo: request.assignedTo || '',
        estimatedCost: request.estimatedCost || 0,
        actualCost: request.actualCost || 0,
        notes: request.notes || ''
      });
    } else {
      setFormData({
        propertyId: '',
        tenantId: '',
        title: '',
        description: '',
        priority: 'MEDIUM',
        category: 'OTHER',
        status: 'OPEN',
        reportedDate: new Date().toISOString().split('T')[0],
        completedDate: '',
        assignedTo: '',
        estimatedCost: 0,
        actualCost: 0,
        notes: ''
      });
    }
  }, [request]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave({
        ...formData,
        reportedDate: new Date(`${formData.reportedDate}T00:00:00`),
        completedDate: formData.completedDate ? new Date(`${formData.completedDate}T00:00:00`) : undefined,
        tenantId: formData.tenantId || undefined,
        estimatedCost: formData.estimatedCost || undefined,
        actualCost: formData.actualCost || undefined
      });
      toast.success(
        request ? 'Mantenimiento actualizado' : 'Mantenimiento creado',
        request ? 'La solicitud se actualizó correctamente.' : 'La solicitud se creó correctamente.'
      );
      onClose();
    } catch (error: any) {
      let msg = error?.error || error?.message || 'No se pudo guardar la solicitud.';
      if (error?.details && Array.isArray(error.details)) {
        msg = error.details.map((d: any) => `${d.field ? d.field + ': ' : ''}${d.message}`).join(' | ');
      }
      toast.error('Error al guardar solicitud', msg);
      console.error('Error saving maintenance:', error);
    }
  };

  if (!isOpen) return null;

  // DEBUG: Log para verificar propiedades disponibles

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {request ? 'Editar Solicitud de Mantenimiento' : 'Crear Solicitud de Mantenimiento'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Propiedad
              </label>
              {properties.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ No hay propiedades disponibles. Por favor, cree propiedades primero.
                  </p>
                </div>
              ) : (
                <select
                  required
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar una propiedad</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name} - {property.address}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Inquilino (Opcional)
              </label>
              <select
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar un inquilino</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.firstName} {tenant.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Título
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción breve del problema"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descripción
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción detallada del problema de mantenimiento"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as MaintenanceRequest['priority'] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="EMERGENCY">Emergencia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Categoría
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as MaintenanceRequest['category'] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="PLUMBING">Plomería</option>
                <option value="ELECTRICAL">Eléctrico</option>
                <option value="HVAC">Climatización</option>
                <option value="APPLIANCE">Electrodomésticos</option>
                <option value="STRUCTURAL">Estructural</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MaintenanceRequest['status'] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="OPEN">Abierta</option>
                <option value="IN_PROGRESS">En Progreso</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Reporte
              </label>
              <input
                type="date"
                required
                value={formData.reportedDate}
                onChange={(e) => setFormData({ ...formData, reportedDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Completado (Opcional)
              </label>
              <input
                type="date"
                value={formData.completedDate}
                onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Asignado a (Opcional)
            </label>
            <input
              type="text"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre del técnico o contratista"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Costo Estimado ($)
              </label>
              <input
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Costo Real ($)
              </label>
              <input
                type="number"
                value={formData.actualCost}
                onChange={(e) => setFormData({ ...formData, actualCost: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Notas adicionales o actualizaciones"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={properties.length === 0}
            >
              {request ? 'Actualizar Solicitud' : 'Crear Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}