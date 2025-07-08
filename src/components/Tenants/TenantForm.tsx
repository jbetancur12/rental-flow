import { useState, useEffect } from 'react';
import { Tenant } from '../../types';
import { X } from 'lucide-react';
import { toMidnightUTC } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';

interface TenantFormProps {
  tenant?: Tenant;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tenant: Omit<Tenant, 'id'>) => void;
}

export function TenantForm({ tenant, isOpen, onClose, onSave }: TenantFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    employment: {
      employer: '',
      position: '',
      income: 0
    },
    references: [] as any[],
    applicationDate: toMidnightUTC(new Date()),
    status: 'PENDING' as Tenant['status'],
    creditScore: 0
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email,
        phone: tenant.phone,
        emergencyContact: { ...tenant.emergencyContact },
        employment: { ...tenant.employment },
        references: [...tenant.references],
        applicationDate: tenant.applicationDate,
        status: tenant.status,
        creditScore: tenant.creditScore || 0
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        employment: {
          employer: '',
          position: '',
          income: 0
        },
        references: [],
        applicationDate: toMidnightUTC(new Date()),
        status: 'PENDING',
        creditScore: 0
      });
    }
  }, [tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      toast.success(
        tenant ? 'Inquilino actualizado' : 'Inquilino creado',
        tenant ? 'El inquilino se actualizó correctamente.' : 'El inquilino se creó correctamente.'
      );
      onClose();
    } catch (error: any) {
      let msg = error?.error || error?.message || 'No se pudo guardar el inquilino.';
      if (error?.details && Array.isArray(error.details)) {
        msg = error.details.map((d: any) => `${d.field ? d.field + ': ' : ''}${d.message}`).join(' | ');
      }
      toast.error('Error al guardar inquilino', msg);
      console.error('Error saving tenant:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {tenant ? 'Editar Inquilino' : 'Agregar Nuevo Inquilino'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Puntaje de Crédito
                </label>
                <input
                  type="number"
                  min="300"
                  max="850"
                  value={formData.creditScore}
                  onChange={(e) => setFormData({ ...formData, creditScore: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Tenant['status'] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="APPROVED">Aprobado</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="FORMER">Anterior</option>
                  <option value="REJECTED">Rechazado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Información de Empleo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Empleado por
                </label>
                <input
                  type="text"
                  required
                  value={formData.employment.employer}
                  onChange={(e) => setFormData({
                    ...formData,
                    employment: { ...formData.employment, employer: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Puesto
                </label>
                <input
                  type="text"
                  required
                  value={formData.employment.position}
                  onChange={(e) => setFormData({
                    ...formData,
                    employment: { ...formData.employment, position: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ingreso Anual ($)
                </label>
                <input
                  type="number"
                  required
                  value={formData.employment.income}
                  onChange={(e) => setFormData({
                    ...formData,
                    employment: { ...formData.employment, income: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Contacto de Emergencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={formData.emergencyContact.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  required
                  value={formData.emergencyContact.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Parentesco
                </label>
                <input
                  type="text"
                  required
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
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
            >
              {tenant ? 'Actualizar Inquilino' : 'Crear Inquilino'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}