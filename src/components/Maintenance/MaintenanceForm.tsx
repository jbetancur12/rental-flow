import { useState, useEffect } from 'react';
import { MaintenanceRequest, Property, Tenant, Unit } from '../../types';
import { X } from 'lucide-react';
import { formatDateToYYYYMMDD } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';

interface MaintenanceFormProps {
  request?: MaintenanceRequest;
  properties: Property[];
  tenants: Tenant[];
  units: Unit[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (request: Omit<MaintenanceRequest, 'id'>) => void;
}

export function MaintenanceForm({ request, properties, units, isOpen, onClose, onSave }: MaintenanceFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    unitId: '',
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
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const isCompleted = request?.status === 'COMPLETED';

  useEffect(() => {
    if (request) {
      setFormData({
        unitId: request.unitId || '',
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
        unitId: '',
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

  // Filtrar propiedades por unidad seleccionada
  useEffect(() => {
    if (formData.unitId) {
      setFilteredProperties(properties.filter(p => p.unitId === formData.unitId));
      setFormData(f => ({ ...f, propertyId: '' }));
    } else {
      setFilteredProperties([]);
      setFormData(f => ({ ...f, propertyId: '' }));
    }
  }, [formData.unitId, properties]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unitId || !formData.propertyId) {
      toast.error('Unidad y propiedad requeridas', 'Debes seleccionar una unidad y una propiedad asociada.');
      return;
    }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {request ? 'Editar Solicitud de Mantenimiento' : 'Crear Solicitud de Mantenimiento'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Unidad
              </label>
              <select
                required
                value={formData.unitId}
                onChange={e => setFormData({ ...formData, unitId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                disabled={isCompleted}
              >
                <option value="">Seleccionar una unidad</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Propiedad
              </label>
              {filteredProperties.length === 0 ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    ⚠️ Selecciona una unidad para ver propiedades asociadas.
                  </p>
                </div>
              ) : (
                <select
                  required
                  value={formData.propertyId}
                  onChange={e => setFormData({ ...formData, propertyId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  disabled={isCompleted || !formData.unitId}
                >
                  <option value="">Seleccionar una propiedad</option>
                  {filteredProperties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name} - {property.address}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Título
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="Descripción breve del problema"
              disabled={isCompleted}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Descripción
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="Descripción detallada del problema de mantenimiento"
              disabled={isCompleted}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as MaintenanceRequest['priority'] })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                disabled={isCompleted}
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="EMERGENCY">Emergencia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Categoría
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as MaintenanceRequest['category'] })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                disabled={isCompleted}
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MaintenanceRequest['status'] })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                disabled={isCompleted}
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fecha de Reporte
              </label>
              <input
                type="date"
                required
                value={formData.reportedDate}
                onChange={(e) => setFormData({ ...formData, reportedDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                disabled={isCompleted}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fecha de Completado (Opcional)
              </label>
              <input
                type="date"
                value={formData.completedDate}
                onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                disabled={isCompleted}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Asignado a (Opcional)
            </label>
            <input
              type="text"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="Nombre del técnico o contratista"
              disabled={isCompleted}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Costo Estimado ($)
              </label>
              <input
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                disabled={isCompleted}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Costo Real ($)
              </label>
              <input
                type="number"
                value={formData.actualCost}
                onChange={(e) => setFormData({ ...formData, actualCost: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                disabled={isCompleted}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus-border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="Notas adicionales o actualizaciones"
              disabled={false}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
              disabled={properties.length === 0 || (isCompleted && formData.notes === (request?.notes || ''))}
            >
              {request ? 'Actualizar Solicitud' : 'Crear Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}