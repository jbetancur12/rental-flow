import { Building2, Eye, Ban } from 'lucide-react';
import { OrganizationSummary } from '../../types';

interface OrganizationsTableProps {
  organizations: OrganizationSummary[];
  isLoading: boolean;
  searchTerm: string;
  statusFilter: string;
}

const statusConfig = {
  ACTIVE: { text: 'Activo', color: 'bg-emerald-100 text-emerald-800' },
  TRIALING: { text: 'Prueba', color: 'bg-orange-100 text-orange-800' },
  DEMO: { text: 'Demo', color: 'bg-purple-100 text-purple-800' },
  INACTIVE: { text: 'Inactivo', color: 'bg-red-100 text-red-800' },
};

export function OrganizationsTable({ 
  organizations, 
  isLoading, 
  searchTerm, 
  statusFilter 
}: OrganizationsTableProps) {
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.email ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Organización</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Plan</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Estado</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Usuarios</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Propiedades</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Inquilinos</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Última Actividad</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-8">Cargando...</td>
              </tr>
            ) : (
              filteredOrganizations.map((org) => {
                const currentStatusConfig = statusConfig[org.status as keyof typeof statusConfig] || 
                  { text: org.status, color: 'bg-slate-100 text-slate-800' };
                
                return (
                  <tr key={org.id} className="hover:bg-slate-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{org.name}</p>
                          <p className="text-sm text-slate-500">{org.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {org.plan}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentStatusConfig.color}`}>
                        {currentStatusConfig.text}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-900">{org.users}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-900">{org.properties}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-900">{org.tenants}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-600">
                        {new Date(org.lastActivity).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}