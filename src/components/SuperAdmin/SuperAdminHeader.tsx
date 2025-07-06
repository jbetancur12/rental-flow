import { Crown, LogOut } from 'lucide-react';

interface SuperAdminHeaderProps {
  user: any;
  onLogout: () => void;
}

export function SuperAdminHeader({ user, onLogout }: SuperAdminHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Crown className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Panel de Super Administración</h1>
              <p className="text-slate-600">Gestión completa de la plataforma RentFlow</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600">
              Conectado como: {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={onLogout}
              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}