import { useState, useEffect } from 'react';
import { Plan } from '../../types';
import { X } from 'lucide-react';

interface PlanEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: Plan) => void;
  plan: Plan | null;
}

export function PlanEditorModal({ isOpen, onClose, onSave, plan }: PlanEditorModalProps) {
  const [formData, setFormData] = useState<Plan | null>(null);

  useEffect(() => {
    setFormData(plan);
  }, [plan]);

  if (!isOpen || !formData) return null;

  const handleSave = () => {
      console.log("🚀 ~ handleSave ~ formData:", formData)
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">{formData.createdAt ? 'Editar Plan' : 'Crear Nuevo Plan'}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Aquí reutilizas la lógica de los inputs del PlanEditor que ya tenías */}
          <div>
            <label>ID del Plan</label>
            <input type="text" value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} disabled={!!formData.createdAt} className="w-full p-2 border rounded bg-slate-100 disabled:cursor-not-allowed" />
          </div>
          <div>
            <label>Nombre del Plan</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label>Precio</label>
            <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label>Límite de Propiedades</label>
            <input type="number" value={formData.limits.properties} onChange={(e) => setFormData({...formData, limits: {...formData.limits, properties: parseInt(e.target.value)}})} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label>Límite de Inquilinos</label>
            <input type="number" value={formData.limits.tenants} onChange={(e) => setFormData({...formData, limits: {...formData.limits, tenants: parseInt(e.target.value)}})} className="w-full p-2 border rounded" />
          
          </div>
          <div>
            <label>Límite de Usuarios</label>
            <input type="number" value={formData.limits.users} onChange={(e) => setFormData({...formData, limits: {...formData.limits, users: parseInt(e.target.value)}})} className="w-full p-2 border rounded" />
          </div>
        </div>
        <div className="p-4 border-t flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
}