import { Save } from 'lucide-react';
import React from 'react';

export function NotificationsTab({ settings, setSettings, handleSaveNotifications }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Preferencias de Notificación</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Notificaciones por Email</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Recibir notificaciones por correo electrónico</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.notifications.emailNotifications} onChange={(e) => setSettings((prev: any) => ({ ...prev, notifications: { ...prev.notifications, emailNotifications: e.target.checked } }))} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-900 after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-700"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Recordatorios de Pago</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Notificar sobre próximos pagos de alquiler</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.notifications.paymentReminders} onChange={(e) => setSettings((prev: any) => ({ ...prev, notifications: { ...prev.notifications, paymentReminders: e.target.checked } }))} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-900 after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-700"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Alertas de Mantenimiento</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Notificar sobre nuevas solicitudes de mantenimiento</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.notifications.maintenanceAlerts} onChange={(e) => setSettings((prev: any) => ({ ...prev, notifications: { ...prev.notifications, maintenanceAlerts: e.target.checked } }))} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-900 after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-700"></div>
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={handleSaveNotifications} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
            <Save className="w-4 h-4 mr-2" />
            Guardar Preferencias
          </button>
        </div>
      </div>
    </div>
  );
} 