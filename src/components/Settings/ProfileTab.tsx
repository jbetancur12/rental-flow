import { Save } from 'lucide-react';
import React from 'react';

export function ProfileTab({ settings, setSettings, handleSaveProfile, authState }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Información Personal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
            <input type="text" value={settings.profile.firstName} onChange={(e) => setSettings((prev: any) => ({ ...prev, profile: { ...prev.profile, firstName: e.target.value } }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Apellido</label>
            <input type="text" value={settings.profile.lastName} onChange={(e) => setSettings((prev: any) => ({ ...prev, profile: { ...prev.profile, lastName: e.target.value } }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Correo Electrónico</label>
            <input type="email" value={settings.profile.email} onChange={(e) => setSettings((prev: any) => ({ ...prev, profile: { ...prev.profile, email: e.target.value } }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
            <input type="tel" value={settings.profile.phone} onChange={(e) => setSettings((prev: any) => ({ ...prev, profile: { ...prev.profile, phone: e.target.value } }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rol</label>
            <input type="text" value={authState.user?.role === 'SUPER_ADMIN' ? 'Super Administrador' : authState.user?.role === 'ADMIN' ? 'Administrador' : authState.user?.role === 'MANAGER' ? 'Gerente' : 'Usuario'} disabled className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500" />
            <p className="text-xs text-slate-500 mt-1">Contacta al administrador para cambiar tu rol</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={handleSaveProfile} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
} 