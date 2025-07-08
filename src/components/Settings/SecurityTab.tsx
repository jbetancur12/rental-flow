import { Eye, EyeOff } from 'lucide-react';
import React from 'react';

export function SecurityTab({ settings, setSettings, showPassword, setShowPassword, handleChangePassword }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Cambiar Contraseña</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña Actual</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={settings.security.currentPassword} onChange={(e) => setSettings((prev: any) => ({ ...prev, security: { ...prev.security, currentPassword: e.target.value } }))} className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setShowPassword((prev: boolean) => !prev)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nueva Contraseña</label>
            <input type={showPassword ? 'text' : 'password'} value={settings.security.newPassword} onChange={(e) => setSettings((prev: any) => ({ ...prev, security: { ...prev.security, newPassword: e.target.value } }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Confirmar Nueva Contraseña</label>
            <input type={showPassword ? 'text' : 'password'} value={settings.security.confirmPassword} onChange={(e) => setSettings((prev: any) => ({ ...prev, security: { ...prev.security, confirmPassword: e.target.value } }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={handleChangePassword} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Cambiar Contraseña</button>
        </div>
      </div>
    </div>
  );
} 