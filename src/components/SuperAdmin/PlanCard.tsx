import { Plan } from '../../types';
import { Edit } from 'lucide-react';

interface PlanCardProps {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  isFeatured?: boolean;
}

export function PlanCard({ plan, onEdit, isFeatured = false }: PlanCardProps) {
  return (
    <div className={`border-2 rounded-lg p-6 relative ${isFeatured ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
      <button 
        onClick={() => onEdit(plan)}
        className="absolute top-3 right-3 p-2 text-slate-400 hover:text-blue-600"
        title="Editar Plan"
      >
        <Edit className="w-4 h-4" />
      </button>

      <h5 className="font-medium text-slate-900 text-lg">{plan.name}</h5>
      <p className="text-3xl font-bold text-slate-900 mt-2">${plan.price}/mes</p>
      <ul className="text-sm text-slate-600 mt-4 space-y-2">
        <li>• {plan.limits.properties === -1 ? 'Propiedades ilimitadas' : `${plan.limits.properties} propiedades`}</li>
        <li>• {plan.limits.tenants === -1 ? 'Inquilinos ilimitados' : `${plan.limits.tenants} inquilinos`}</li>
        <li>• {plan.limits.users === -1 ? 'Usuarios ilimitados' : `${plan.limits.users} usuarios`}</li>
      </ul>
    </div>
  );
}