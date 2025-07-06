import { Search, Download } from 'lucide-react';

interface OrganizationFiltersProps {
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const statusConfig = {
  ACTIVE: { text: 'Activo', color: 'bg-emerald-100 text-emerald-800' },
  TRIALING: { text: 'Prueba', color: 'bg-orange-100 text-orange-800' },
  DEMO: { text: 'Demo', color: 'bg-purple-100 text-purple-800' },
  INACTIVE: { text: 'Inactivo', color: 'bg-red-100 text-red-800' },
};

export function OrganizationFilters({ 
  searchTerm, 
  statusFilter, 
  onSearchChange, 
  onStatusChange 
}: OrganizationFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Gestión de Organizaciones</h3>
        <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar organizaciones..."
            value={searchTerm}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={onStatusChange}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los Estados</option>
          {Object.entries(statusConfig).map(([key, value]) => (
            <option key={key} value={key}>
              {value.text}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
