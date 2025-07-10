import { Building2, Eye, Ban, Edit } from 'lucide-react';
import { OrganizationSummary, Plan } from '../../types';
import { useState, useEffect } from 'react';
import { useApp } from '../../context/useApp';
import { SubscriptionStatus } from '../../types/auth';
import { useToast } from '../../hooks/useToast';

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
  const [editingOrg, setEditingOrg] = useState<OrganizationSummary | null>(null);
  const [drawerState, setDrawerState] = useState<{ planId: string; status: SubscriptionStatus } | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [saving, setSaving] = useState(false);
  const { getPlans } = useApp();
  const toast = useToast();

  useEffect(() => {
    if (editingOrg) {
      getPlans().then((data) => setPlans(data.filter((p) => p.isActive)));
      setDrawerState({ planId: editingOrg.plan, status: editingOrg.status as SubscriptionStatus });
    }
  }, [editingOrg, getPlans]);

  const handleDrawerChange = (field: 'planId' | 'status', value: string) => {
    setDrawerState((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSave = async () => {
    if (!editingOrg || !drawerState) return;
    setSaving(true);
    try {
      await import('../../config/api').then(({ apiClient }) =>
        apiClient.updateOrganizationSubscription(editingOrg.id, drawerState)
      );
      toast.success('Cambios guardados');
      setEditingOrg(null);
    } catch (e) {
      toast.error('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.email ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const subscriptionStatusOptions: { value: SubscriptionStatus, label: string, color: string }[] = [
    { value: 'ACTIVE', label: 'Activo', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'TRIALING', label: 'Prueba', color: 'bg-orange-100 text-orange-800' },
    { value: 'DEMO', label: 'Demo', color: 'bg-purple-100 text-purple-800' },
    { value: 'PAST_DUE', label: 'Vencido', color: 'bg-red-100 text-red-800' },
    { value: 'CANCELED', label: 'Cancelado', color: 'bg-slate-200 text-slate-600' },
  ];

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
                        <button className="text-slate-600 hover:text-blue-600" onClick={() => setEditingOrg(org)} title="Editar organización">
                          <Edit className="w-4 h-4" />
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
      {/* Drawer lateral para editar estado y plan */}
      {editingOrg && drawerState && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40 flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-xl p-8 relative z-50">
            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-700" onClick={() => setEditingOrg(null)}>
              ×
            </button>
            <h2 className="text-xl font-bold mb-6">Editar Organización</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  value={drawerState.status}
                  onChange={e => handleDrawerChange('status', e.target.value)}
                  disabled={saving}
                >
                  {subscriptionStatusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  value={drawerState.planId}
                  onChange={e => handleDrawerChange('planId', e.target.value)}
                  disabled={saving}
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name} (${plan.price}/mes)</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 mt-8">
                <button className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700" onClick={() => setEditingOrg(null)} disabled={saving}>Cancelar</button>
                <button
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  onClick={handleSave}
                  disabled={saving || (drawerState.planId === editingOrg.plan && drawerState.status === editingOrg.status)}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}