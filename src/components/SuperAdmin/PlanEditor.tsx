import React from 'react';
import { Plan } from '../../types'; // Asegúrate de que la ruta a tus tipos sea correcta
import { PlusCircle } from 'lucide-react';

interface PlanEditorProps {
  plans: Plan[];
  onPlanChange: (index: number, field: keyof Plan, value: any) => void;
  onPlanLimitChange: (index: number, limitField: keyof Plan['limits'], value: number) => void;
  onAddNewPlan: () => void;
}

export function PlanEditor({ plans, onPlanChange, onPlanLimitChange, onAddNewPlan }: PlanEditorProps) {
  if (plans.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
        <h3 className="text-lg font-medium text-slate-800">No hay planes de suscripción definidos.</h3>
        <p className="text-slate-500 mt-2">Empieza por crear el primer plan para tu plataforma.</p>
        <button 
          onClick={onAddNewPlan}
          className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Crear Nuevo Plan
        </button>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-medium text-slate-900 mb-4">Planes de Suscripción</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-4 bg-white">
            <div>
              <label className="text-xs font-medium text-slate-600">ID del Plan (ej: plan-basic)</label>
              <input 
                type="text" 
                value={plan.id} 
                onChange={(e) => onPlanChange(index, 'id', e.target.value)} 
                className="w-full mt-1 p-2 border rounded-md bg-slate-50"
                // Deshabilitar si el plan ya existe (opcional, para evitar cambiar IDs)
                disabled={!!plan.createdAt} 
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Nombre del Plan</label>
              <input 
                type="text" 
                value={plan.name} 
                onChange={(e) => onPlanChange(index, 'name', e.target.value)} 
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Precio (USD/mes)</label>
              <input 
                type="number" 
                value={plan.price} 
                onChange={(e) => onPlanChange(index, 'price', parseInt(e.target.value) || 0)} 
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Límite de Propiedades</label>
              <input 
                type="number" 
                value={plan.limits.properties} 
                onChange={(e) => onPlanLimitChange(index, 'properties', parseInt(e.target.value) || 0)} 
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Límite de Inquilinos</label>
              <input 
                type="number" 
                value={plan.limits.tenants} 
                onChange={(e) => onPlanLimitChange(index, 'tenants', parseInt(e.target.value) || 0)} 
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Límite de Usuarios</label>
              <input 
                type="number" 
                value={plan.limits.users} 
                onChange={(e) => onPlanLimitChange(index, 'users', parseInt(e.target.value) || 0)} 
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
          </div>
        ))}
        {/* Botón para añadir un nuevo plan al final de la lista */}
        <div className="flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer" onClick={onAddNewPlan}>
            <div className="text-center">
                <PlusCircle className="w-8 h-8 mx-auto text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-600">Añadir Nuevo Plan</p>
            </div>
        </div>
      </div>
    </div>
  );
}