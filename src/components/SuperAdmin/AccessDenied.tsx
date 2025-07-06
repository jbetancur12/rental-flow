import { AlertTriangle } from 'lucide-react';

export function AccessDenied() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Acceso Denegado</h1>
        <p className="text-slate-600">No tienes permisos para acceder a esta sección.</p>
      </div>
    </div>
  );
}