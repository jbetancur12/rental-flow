import { Save } from 'lucide-react';
import React from 'react';

export function OrganizationTab({ settings, setSettings, handleSaveOrganization, isAdmin }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Información de la Organización</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ...campos de organización... */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Nombre de la Organización</label>
            <input type="text" value={settings.organization.name} onChange={(e) => setSettings((prev: any) => ({ ...prev, organization: { ...prev.organization, name: e.target.value } }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email de Contacto</label>
            <input type="email" value={settings.organization.email} onChange={(e) => setSettings((prev: any) => ({ ...prev, organization: { ...prev.organization, email: e.target.value } }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
            <input type="tel" value={settings.organization.phone} onChange={(e) => setSettings((prev: any) => ({ ...prev, organization: { ...prev.organization, phone: e.target.value } }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Dirección</label>
            <input type="text" value={settings.organization.address} onChange={(e) => setSettings((prev: any) => ({ ...prev, organization: { ...prev.organization, address: e.target.value } }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Moneda</label>
            <select value={settings.organization.currency} onChange={(e) => setSettings((prev: any) => ({ ...prev, organization: { ...prev.organization, currency: e.target.value } }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="COP">COP - Peso Colombiano</option>
              <option value="USD">USD - Dólar Estadounidense</option>
              <option value="EUR">EUR - Euro</option>
              <option value="MXN">MXN - Peso Mexicano</option>
              <option value="CAD">CAD - Dólar Canadiense</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Zona Horaria</label>
            <select value={settings.organization.timezone} onChange={(e) => setSettings((prev: any) => ({ ...prev, organization: { ...prev.organization, timezone: e.target.value } }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="America/Bogota">Bogotá, Lima, Quito (UTC-5)</option>
              <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
              <option value="America/Sao_Paulo">Sao Paulo (UTC-3)</option>
              <option value="America/Buenos_Aires">Buenos Aires (UTC-3)</option>
              <option value="America/New_York">Hora del Este (NY)</option>
              <option value="America/Chicago">Hora Central (Chicago)</option>
              <option value="America/Los_Angeles">Hora del Pacífico (LA)</option>
              <option value="Europe/Madrid">Madrid, París, Berlín (UTC+2)</option>
              <option value="Europe/London">Londres, Lisboa (UTC+1)</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={isAdmin ? handleSaveOrganization : undefined} className={`flex items-center px-4 py-2 rounded-lg ${isAdmin ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`} disabled={!isAdmin} title={!isAdmin ? 'Solo un administrador puede guardar cambios en la organización' : ''}>
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
} 