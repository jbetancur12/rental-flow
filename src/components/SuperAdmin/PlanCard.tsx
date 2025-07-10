import { Plan } from '../../types';
import { Edit } from 'lucide-react';

interface PlanCardProps {
  plan: Plan;
  onEdit?: (plan: Plan) => void;
  isFeatured?: boolean;
  onDelete?: (planId: string) => void;
  isDisabled?: boolean;
  onEnable?: (planId: string) => void;
}

export function PlanCard({ plan, onEdit, isFeatured = false, onDelete, isDisabled = false, onEnable }: PlanCardProps) {
  return (
    <div className={`border-2 rounded-lg p-6 relative ${isFeatured ? 'border-blue-500 bg-blue-50' : 'border-slate-200'} ${isDisabled ? 'bg-slate-100 border-slate-200 opacity-60' : ''}`}>
      {!isDisabled && onEdit && (
        <button 
          onClick={() => onEdit(plan)}
          className="absolute top-3 right-3 p-2 text-slate-400 hover:text-blue-600"
          title="Editar Plan"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}
      {!isDisabled && onDelete && plan.isActive && (
        <button
          onClick={() => onDelete(plan.id)}
          className="absolute top-3 left-3 p-2 text-slate-400 hover:text-red-600"
          title="Deshabilitar Plan"
        >
          <span className="font-bold">✖</span>
        </button>
      )}
      <h5 className="font-medium text-slate-900 text-lg">{plan.name}</h5>
      <p className="text-3xl font-bold text-slate-900 mt-2">${plan.price}/mes</p>
      <ul className="text-sm text-slate-600 mt-4 space-y-2">
        <li>• {plan.limits.properties === -1 ? 'Propiedades ilimitadas' : `${plan.limits.properties} propiedades`}</li>
        <li>• {plan.limits.tenants === -1 ? 'Inquilinos ilimitados' : `${plan.limits.tenants} inquilinos`}</li>
        <li>• {plan.limits.users === -1 ? 'Usuarios ilimitados' : `${plan.limits.users} usuarios`}</li>
      </ul>
      {isDisabled && (
        <div className="mt-4 text-center text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Deshabilitado
          {onEnable && (
            <button
              onClick={() => onEnable(plan.id)}
              className="ml-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
            >
              Habilitar
            </button>
          )}
        </div>
      )}
    </div>
  );
}