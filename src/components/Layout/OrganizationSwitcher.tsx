import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, ChevronDown, Settings, Users, CreditCard, Crown } from 'lucide-react';

export function OrganizationSwitcher() {
  const { state } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!state.user) return null;

  // Special display for super admin
  if (state.user.role === 'SUPER_ADMIN') {
    return (
      <div className="flex items-center w-full p-3 text-left bg-purple-900/20 rounded-lg">
        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">Super Admin</p>
          <p className="text-xs text-slate-400 truncate">
            {state.user.firstName} {state.user.lastName}
          </p>
        </div>
      </div>
    );
  }

  if (!state.organization) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full p-3 text-left hover:bg-slate-800 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{state.organization.name}</p>
          <p className="text-xs text-slate-400 truncate">
            {state.user.firstName} {state.user.lastName}
          </p>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 py-2">
          <div className="px-4 py-2 border-b border-slate-200">
            <p className="text-sm font-medium text-slate-900">{state.organization.name}</p>
            <p className="text-xs text-slate-500">
              Plan {state.subscription?.status === 'TRIALING' ? 'Prueba' : 'Activo'}
            </p>
          </div>
          
          <div className="py-1">
            <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Users className="w-4 h-4 mr-3" />
              Gestionar Usuarios
            </button>
            <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <CreditCard className="w-4 h-4 mr-3" />
              Facturación
            </button>
            <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Settings className="w-4 h-4 mr-3" />
              Configuración
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
