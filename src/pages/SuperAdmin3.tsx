import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Crown,
  Search,

  Download,
  Eye,
  Ban,
  CheckCircle,
  LogOut,
  
  PlusCircle
} from 'lucide-react';
import apiClient from '../config/api';
import { useToast } from '../hooks/useToast';
import { OrganizationSummary, PaginationInfo, Plan } from '../types';
import { useApp } from '../context/useApp';
import { PlanEditorModal } from '../components/SuperAdmin/PlanEditorModal';
import { PlanCard } from '../components/SuperAdmin/PlanCard';

// Mock data for organizations

type StatusKey = 'ACTIVE' | 'TRIALING' | 'DEMO' | 'INACTIVE';

const statusConfig: Record<StatusKey, { text: string; color: string }> = {
  ACTIVE: { text: 'Activo', color: 'bg-emerald-100 text-emerald-800' },
  TRIALING: { text: 'Prueba', color: 'bg-orange-100 text-orange-800' },
  DEMO: { text: 'Demo', color: 'bg-purple-100 text-purple-800' },
  // PLATFORM: { text: 'Plataforma', color: 'bg-slate-100 text-slate-800' },
  INACTIVE: { text: 'Inactivo', color: 'bg-red-100 text-red-800' },
  // Añade otros estados si los necesitas
};

export function SuperAdmin() {
  const { state, logout } = useAuth();
  const { getPlans, updatePlans, createPlan } = useApp();
  const toast = useToast();

  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('organizations');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [plans, setPlans] = useState<Plan[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);


const fetchOrganizations = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 10,
                status: statusFilter === 'all' ? undefined : statusFilter,
                search: searchTerm || undefined,
            };
            const response = await apiClient.getSuperAdminOrganizations(params);
            setOrganizations(response.data);
            setPagination(response.pagination);
        } catch (error: any) {
            toast.error('Error', error.message || 'No se pudieron cargar las organizaciones.');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, searchTerm, statusFilter, toast]);

    const fetchPlans = useCallback(async () => {
        setIsLoading(true);
        try {
            const loadedPlans = await getPlans();
            setPlans(loadedPlans);
        } catch (error) {
          console.error('Error al cargar los planes', error);
            toast.error('Error', 'No se pudieron cargar los planes.');
        } finally {
            setIsLoading(false);
        }
    }, [getPlans, toast]);

    useEffect(() => {
        if (state.user?.role === 'SUPER_ADMIN') {
            if (activeTab === 'organizations') {
                fetchOrganizations();
            } else if (activeTab === 'settings') {
                fetchPlans();
            }
        }
    }, [state.user, activeTab, fetchOrganizations, fetchPlans]);

  // Función para manejar el cambio en los inputs de filtro
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Resetea a la primera página al buscar
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Resetea a la primera página al filtrar
  };



   const handleOpenNewPlanModal = () => {
    setEditingPlan({ // Plantilla para un nuevo plan
      id: '', name: 'Nuevo Plan', price: 0, 
      limits: { properties: 0, tenants: 0, users: 0 },
      features: [], isActive: true, currency: 'usd'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: Plan) => {
    console.log("🚀 ~ handleOpenEditModal ~ plan:", plan)
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  // Función para guardar los cambios desde el modal
  const handleSavePlan = async (planData: Plan) => {
    try {
      if (planData.createdAt) { // Si tiene 'createdAt', es un plan existente
        await updatePlans([planData]); // La API de bulk-update puede manejar uno solo
      } else {
        await createPlan(planData);
      }
      await fetchPlans();
      setIsModalOpen(false);
      // Volver a cargar los planes para reflejar los cambios
 
    } catch (error) {
      // El toast ya se maneja en el contexto
      console.error("Failed to save plan", error);
    }
  };

  const totalMRR = useMemo(() => organizations.reduce((sum, org) => sum + org.mrr, 0), [organizations]);
  const activeOrganizations = useMemo(() => organizations.filter(org => org.status === 'ACTIVE').length, [organizations]);
  const trialingOrganizations = useMemo(() => organizations.filter(org => org.status === 'TRIALING').length, [organizations]);

  // El total de organizaciones ahora viene de la paginación para ser preciso
  const totalOrganizations = pagination?.total || 0;


  // Check if user is super admin
  if (state.user?.role !== 'SUPER_ADMIN') {
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



  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.email ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });




  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'organizations', label: 'Organizaciones', icon: Building2 },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'billing', label: 'Facturación', icon: CreditCard },
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];



  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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
                Conectado como: {state.user?.firstName} {state.user?.lastName}
              </span>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Ingresos Mensuales</p>
                    <p className="text-2xl font-bold text-emerald-600">${totalMRR.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600 mt-1">+12% vs mes anterior</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-emerald-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Organizaciones</p>
                    <p className="text-2xl font-bold text-blue-600">{totalOrganizations}</p>
                    <p className="text-xs text-blue-600 mt-1">+3 este mes</p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Clientes Activos</p>
                    <p className="text-2xl font-bold text-purple-600">{activeOrganizations}</p>
                    <p className="text-xs text-purple-600 mt-1">{Math.round((activeOrganizations / totalOrganizations) * 100)}% conversión</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">En Prueba</p>
                    <p className="text-2xl font-bold text-orange-600">{trialingOrganizations}</p>
                    <p className="text-xs text-orange-600 mt-1">Potencial: ${trialingOrganizations * 79}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Organizaciones Recientes</h3>
                <div className="space-y-4">
                  {organizations.slice(0, 5).map((org) => (
                    <div key={org.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{org.name}</p>
                          <p className="text-sm text-slate-500">{org.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">{org.plan}</p>
                        <p className={`text-xs ${org.status === 'ACTIVE' ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {org.status === 'ACTIVE' ? 'Activo' : 'Prueba'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Métricas de Crecimiento</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Tasa de Conversión</span>
                    <span className="font-semibold text-slate-900">75%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Churn Rate</span>
                    <span className="font-semibold text-slate-900">2.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">LTV/CAC</span>
                    <span className="font-semibold text-slate-900">4.2x</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">ARR</span>
                    <span className="font-semibold text-slate-900">${(totalMRR * 12).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Organizations Tab */}
        {activeTab === 'organizations' && (
          <div className="space-y-6">
            {/* Filters */}
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
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={handleStatusChange}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los Estados</option>
                  {Object.keys(statusConfig).map(statusKey => (
                    <option key={statusKey} value={statusKey}>
                      {statusConfig[statusKey as keyof typeof statusConfig].text}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Organizations Table */}
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
                      <tr><td colSpan={8} className="text-center py-8">Cargando...</td></tr>
                    ) : (filteredOrganizations.map((org) => {
                      const currentStatusConfig = statusConfig[org.status as StatusKey] || { text: org.status, color: 'bg-slate-100 text-slate-800' };
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
                      )
                    }))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Resumen de Facturación</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">${totalMRR.toLocaleString()}</p>
                  <p className="text-slate-600">MRR Total</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">${(totalMRR * 12).toLocaleString()}</p>
                  <p className="text-slate-600">ARR Proyectado</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">${Math.round(totalMRR / activeOrganizations)}</p>
                  <p className="text-slate-600">ARPU</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Distribución por Plan</h3>
              <div className="space-y-4">
                {['Básico', 'Profesional', 'Empresarial'].map((plan) => {
                  const count = organizations.filter(org => org.plan === plan).length;
                  const percentage = Math.round((count / totalOrganizations) * 100);
                  return (
                    <div key={plan} className="flex items-center justify-between">
                      <span className="text-slate-700">{plan}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-slate-600 w-12">{count} ({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Configuración de la Plataforma</h3>

              <div className="space-y-6">
                <div className="p-6"> {/* Asumiendo que esto está dentro de la pestaña 'settings' */}
                  <h4 className="font-medium text-slate-900 mb-3">Planes de Suscripción</h4>
                  {isLoading ? (
                    <p>Cargando planes...</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {plans.map(plan => (
                        <PlanCard key={plan.id} plan={plan} onEdit={handleOpenEditModal} isFeatured={plan.id === 'plan-professional'} />
                      ))}
                      <button onClick={handleOpenNewPlanModal} className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 hover:border-slate-400">
                        <PlusCircle className="w-8 h-8" />
                        <span className="mt-2 text-sm font-medium">Crear Nuevo Plan</span>
                      </button>
                    </div>
                  )}

                  <PlanEditorModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    plan={editingPlan}
                    onSave={handleSavePlan}
                  />
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Configuración Global</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">Registro Abierto</p>
                        <p className="text-sm text-slate-600">Permitir que nuevos usuarios se registren</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">Prueba Gratuita</p>
                        <p className="text-sm text-slate-600">Duración de la prueba gratuita (días)</p>
                      </div>
                      <input
                        type="number"
                        defaultValue={14}
                        className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}