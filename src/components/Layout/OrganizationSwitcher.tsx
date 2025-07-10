import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, ChevronDown, Settings, Users, CreditCard, Crown, HelpCircle, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

export function OrganizationSwitcher() {
  const { state, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useTheme();

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
        <button
          className="ml-4 flex items-center gap-2 px-2 py-1 rounded-lg transition-colors hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-300 dark:text-slate-200 hover:text-white"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    );
  }

  if (!state.organization) return null;

  return (
    <div className="relative flex items-center">
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
      <button
        className="ml-2 flex items-center gap-2 px-2 py-1 rounded-lg transition-colors hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-300 dark:text-slate-200 hover:text-white"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Cambiar tema"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-slate-200">
            <p className="text-sm font-medium text-slate-900">{state.organization.name}</p>
            <p className="text-xs text-slate-500">
              Plan {state.subscription?.status === 'TRIALING' ? 'Prueba' : 'Activo'}
            </p>
          </div>
          <div className="py-1">
            {/* <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Users className="w-4 h-4 mr-3" />
              Gestionar Usuarios
            </button>
            <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <CreditCard className="w-4 h-4 mr-3" />
              Facturación
            </button> */}
            {/* <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Settings className="w-4 h-4 mr-3" />
              Configuración
            </button> */}
            <NavLink to="/settings">
              <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <Settings className="w-4 h-4 mr-3" />
                Configuración
              </button>
            </NavLink>
            <NavLink to="/help">
              <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <HelpCircle className="w-4 h-4 mr-3" />
                Ayuda
              </button>
            </NavLink>
          </div>
          <div className="border-t border-slate-200 my-1" />
          <button
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
