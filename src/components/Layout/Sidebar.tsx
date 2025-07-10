
import { useState, useEffect } from 'react';
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
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { useAuth } from '../../context/AuthContext';
import { useMemo } from 'react';
import { useTheme } from '../../hooks/useTheme';

function useSubscriptionBannerVisible() {
  const { state } = useAuth();
  const { subscription } = state;
  return useMemo(() => {
    if (!subscription) return false;
    if (subscription.status === 'DEMO') return true;
    const isTrialExpired = subscription.trialEnd && new Date(subscription.trialEnd) < new Date();
    if (subscription.status === 'TRIALING' && !isTrialExpired) return true;
    if (subscription.status === 'PAST_DUE' || (subscription.status === 'TRIALING' && isTrialExpired)) return true;
    return false;
  }, [subscription]);
}

const navigation = [
  { name: 'Panel Principal', href: '/', icon: Home },
  { name: 'Unidades', href: '/units', icon: Building },
  { name: 'Propiedades', href: '/properties', icon: Building2 },
  { name: 'Inquilinos', href: '/tenants', icon: Users },
  { name: 'Contratos', href: '/contracts', icon: FileText },
  { name: 'Pagos', href: '/payments', icon: CreditCard },
  { name: 'Mantenimiento', href: '/maintenance', icon: Wrench },
  { name: 'Contabilidad', href: '/accounting', icon: BarChart3 },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
  { name: 'Configuración', href: '/settings', icon: Settings },
  { name: 'Ayuda', href: '/help', icon: HelpCircle },
];

export function Sidebar() {
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [minimized, setMinimized] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarMinimized') === 'true';
    }
    return false;
  });
  const bannerVisible = useSubscriptionBannerVisible();
  const [theme, setTheme] = useTheme();

  // Guardar el estado minimizado en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarMinimized', minimized ? 'true' : 'false');
    }
  }, [minimized]);

  // Responsive: show/hide sidebar on mobile
  // Minimize/expand on desktop
  return (
    <>
      {/* Burger menu button (mobile only) */}
      <button
        className={`fixed ${bannerVisible ? 'top-20' : 'top-4'} left-4 z-60 md:hidden bg-slate-900 p-2 rounded-lg shadow-lg`}
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed z-50 top-0 left-0 h-full bg-slate-900 border-r border-slate-200
          flex flex-col transition-all duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:static md:translate-x-0
          ${minimized ? 'w-20' : 'w-64'}
          ${bannerVisible ? 'pt-16 md:pt-14' : ''}
        `}
        style={{ minWidth: minimized ? 80 : 256 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-slate-800">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-blue-500 mr-2" />
            {!minimized && <span className="text-xl font-bold text-white">RentFlow</span>}
          </div>
          {/* Close button (mobile) */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="w-6 h-6" />
          </button>
          {/* Minimize/expand button (desktop) */}
          <button
            className="hidden md:block text-white ml-2"
            onClick={() => setMinimized((m) => !m)}
            aria-label={minimized ? 'Expandir menú' : 'Minimizar menú'}
          >
            {minimized ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-6 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap
                ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                ${minimized ? 'justify-center px-0' : ''}`
              }
              title={minimized ? item.name : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className={`w-5 h-5 ${minimized ? '' : 'mr-3'}`} />
              {!minimized && item.name}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className={`px-2 pb-4 ${minimized ? 'flex justify-center' : ''}`}>
          <button
            onClick={logout}
            className={`flex items-center w-full px-3 py-3 text-sm font-medium text-red-300 hover:bg-red-900/20 hover:text-red-200 rounded-lg transition-colors ${minimized ? 'justify-center px-0' : ''}`}
            title={minimized ? 'Cerrar Sesión' : undefined}
          >
            <LogOut className={`w-5 h-5 ${minimized ? '' : 'mr-3'}`} />
            {!minimized && 'Cerrar Sesión'}
          </button>
        </div>

        {/* Organization Switcher */}
        <div className={`p-2 border-t border-slate-700 ${minimized ? 'flex justify-center' : ''}`}>
          {!minimized && <OrganizationSwitcher />}
        </div>
        {/* Theme Toggle */}
        <div className={`p-2 border-t border-slate-700 flex items-center justify-center`}>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-slate-800 text-slate-300 hover:text-white"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="hidden md:inline text-sm">{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
          </button>
        </div>
      </div>
    </>
  );
}