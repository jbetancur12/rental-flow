import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Plan } from '../../types';
import { PlanEditorModal } from './PlanEditorModal';
import { PlanCard } from './PlanCard';



interface SettingsTabProps {
  plans: Plan[];
  isLoading: boolean;
  onPlanSave: (planData: Plan) => Promise<void>;
  onRefreshPlans: () => Promise<void>;
}

export function SettingsTab({ plans, isLoading, onPlanSave, onRefreshPlans }: SettingsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const handleOpenNewPlanModal = () => {
    setEditingPlan({
      id: '',
      name: 'Nuevo Plan',
      price: 0,
      limits: { properties: 0, tenants: 0, users: 0 },
      features: [],
      isActive: true,
      currency: 'usd'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleSavePlan = async (planData: Plan) => {
    try {
      await onPlanSave(planData);
      await onRefreshPlans();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save plan", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Configuración de la Plataforma</h3>

        <div className="space-y-6">
          {/* Plans Section */}
          <div>
            <h4 className="font-medium text-slate-900 mb-3">Planes de Suscripción</h4>
            {isLoading ? (
              <p className="text-slate-600">Cargando planes...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map(plan => (
                  <PlanCard 
                    key={plan.id} 
                    plan={plan} 
                    onEdit={handleOpenEditModal} 
                    isFeatured={plan.id === 'plan-professional'} 
                  />
                ))}
                <button 
                  onClick={handleOpenNewPlanModal} 
                  className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 hover:border-slate-400 min-h-[200px] transition-colors"
                >
                  <PlusCircle className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Crear Nuevo Plan</span>
                </button>
              </div>
            )}

            <PlanEditorModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              plan={editingPlan}
              onSave={handleSavePlan}
            />
          </div>

          {/* Global Settings Section */}
          <div>
            <h4 className="font-medium text-slate-900 mb-3">Configuración Global</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Registro Abierto</p>
                  <p className="text-sm text-slate-600">Permitir que nuevos usuarios se registren</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Prueba Gratuita</p>
                  <p className="text-sm text-slate-600">Duración de la prueba gratuita (días)</p>
                </div>
                <input
                  type="number"
                  defaultValue={14}
                  className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Mantenimiento</p>
                  <p className="text-sm text-slate-600">Activar modo de mantenimiento</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Límite de Organizaciones</p>
                  <p className="text-sm text-slate-600">Máximo número de organizaciones permitidas</p>
                </div>
                <input
                  type="number"
                  defaultValue={1000}
                  className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Notificaciones Email</p>
                  <p className="text-sm text-slate-600">Enviar notificaciones por email a administradores</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* API Settings Section */}
          <div>
            <h4 className="font-medium text-slate-900 mb-3">Configuración API</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Rate Limiting</p>
                  <p className="text-sm text-slate-600">Límite de peticiones por minuto</p>
                </div>
                <input
                  type="number"
                  defaultValue={1000}
                  className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">API Keys Expiration</p>
                  <p className="text-sm text-slate-600">Días hasta que expiren las API keys</p>
                </div>
                <input
                  type="number"
                  defaultValue={365}
                  className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}