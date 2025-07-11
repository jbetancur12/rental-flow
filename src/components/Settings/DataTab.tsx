import { Download, Upload, Trash2 } from 'lucide-react';
import React from 'react';

export function DataTab({ handleExportData, handleImportData, handleDeleteAllData, isAdmin }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Gestión de Datos</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Exportar e Importar Datos</h4>
            <div className="flex space-x-4">
              <button onClick={handleExportData} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800">
                <Download className="w-4 h-4 mr-2" />
                Exportar Datos
              </button>
              <button onClick={handleImportData} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
                <Upload className="w-4 h-4 mr-2" />
                Importar Datos
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Exporta todos tus datos en formato JSON o importa datos desde un archivo de respaldo.</p>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 text-red-600 dark:text-red-400">Zona de Peligro</h4>
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">Eliminar Todos los Datos</h5>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">Esta acción eliminará permanentemente todos los datos de tu organización. Esta acción no se puede deshacer.</p>
              <button onClick={isAdmin ? handleDeleteAllData : undefined} className={`flex items-center px-4 py-2 rounded-lg ${isAdmin ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'}`} disabled={!isAdmin} title={!isAdmin ? 'Solo un administrador puede eliminar todos los datos' : ''}>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Todos los Datos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 