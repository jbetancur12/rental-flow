
import { NavLink } from 'react-router-dom';
import {
  Home,
  Building2,
  Users,
  FileText,
  CreditCard,
  Wrench,
  BarChart3,
  Settings,
  HelpCircle,
  Building,
  LogOut
} from 'lucide-react';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Panel Principal', href: '/', icon: Home },
  { name: 'Unidades', href: '/units', icon: Building },
  { name: 'Propiedades', href: '/properties', icon: Building2 },
  { name: 'Inquilinos', href: '/tenants', icon: Users },
  { name: 'Contratos', href: '/contracts', icon: FileText },
  { name: 'Pagos', href: '/payments', icon: CreditCard },
  { name: 'Mantenimiento', href: '/maintenance', icon: Wrench },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
  { name: 'Configuración', href: '/settings', icon: Settings },
  { name: 'Ayuda', href: '/help', icon: HelpCircle },
];

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col w-64 bg-slate-900 border-r border-slate-200">
      <div className="flex items-center justify-center h-16 px-4 bg-slate-800">
        <Building2 className="w-8 h-8 text-blue-500 mr-2" />
        <span className="text-xl font-bold text-white">RentFlow</span>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      {/* Logout Button - Always visible */}
      <div className="px-4 pb-4">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-900/20 hover:text-red-200 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </button>
      </div>
      
      <div className="p-4 border-t border-slate-700">
        <OrganizationSwitcher />
      </div>
    </div>
  );
}