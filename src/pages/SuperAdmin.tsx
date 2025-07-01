import { useState } from 'react';
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
  Filter,
  Download,
  Eye,
  Ban,
  CheckCircle,
  LogOut
} from 'lucide-react';

// Mock data for organizations
const mockOrganizations = [
  {
    id: 'org-1',
    name: 'Inmobiliaria Demo',
    email: 'admin@inmobiliaria-demo.com',
    plan: 'Profesional',
    status: 'active',
    users: 3,
    properties: 45,
    mrr: 79,
    createdAt: new Date('2024-01-15'),
    lastActivity: new Date('2024-01-28')
  },
  {
    id: 'org-2',
    name: 'Propiedades García',
    email: 'info@propiedadesgarcia.com',
    plan: 'Básico',
    status: 'trialing',
    users: 1,
    properties: 8,
    mrr: 0,
    createdAt: new Date('2024-01-20'),
    lastActivity: new Date('2024-01-27')
  },
  {
    id: 'org-3',
    name: 'Mega Inmobiliaria',
    email: 'contacto@megainmobiliaria.com',
    plan: 'Empresarial',
    status: 'active',
    users: 12,
    properties: 250,
    mrr: 199,
    createdAt: new Date('2023-12-01'),
    lastActivity: new Date('2024-01-28')
  }
];

export function SuperAdmin() {
  const { state, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Check if user is super admin
  if (state.user?.role !== 'super_admin') {
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

  const filteredOrganizations = mockOrganizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalMRR = mockOrganizations.reduce((sum, org) => sum + org.mrr, 0);
  const totalOrganizations = mockOrganizations.length;
  const activeOrganizations = mockOrganizations.filter(org => org.status === 'active').length;
  const trialingOrganizations = mockOrganizations.filter(org => org.status === 'trialing').length;

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
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
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
                    <p className="text-xs text-purple-600 mt-1">{Math.round((activeOrganizations/totalOrganizations)*100)}% conversión</p>
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
                  {mockOrganizations.slice(0, 5).map((org) => (
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
                        <p className={`text-xs ${org.status === 'active' ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {org.status === 'active' ? 'Activo' : 'Prueba'}
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="active">Activos</option>
                  <option value="trialing">En Prueba</option>
                  <option value="past_due">Vencidos</option>
                  <option value="canceled">Cancelados</option>
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
                      <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">MRR</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Última Actividad</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredOrganizations.map((org) => (
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            org.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                            org.status === 'trialing' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {org.status === 'active' ? 'Activo' :
                             org.status === 'trialing' ? 'Prueba' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-slate-900">{org.users}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-slate-900">{org.properties}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-slate-900">${org.mrr}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-slate-600">
                            {org.lastActivity.toLocaleDateString()}
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
                    ))}
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
                  const count = mockOrganizations.filter(org => org.plan === plan).length;
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
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Planes de Suscripción</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-slate-200 rounded-lg p-4">
                      <h5 className="font-medium text-slate-900">Plan Básico</h5>
                      <p className="text-2xl font-bold text-slate-900 mt-2">$29/mes</p>
                      <ul className="text-sm text-slate-600 mt-2 space-y-1">
                        <li>• 10 propiedades</li>
                        <li>• 20 inquilinos</li>
                        <li>• 2 usuarios</li>
                      </ul>
                    </div>
                    <div className="border border-blue-500 rounded-lg p-4 bg-blue-50">
                      <h5 className="font-medium text-slate-900">Plan Profesional</h5>
                      <p className="text-2xl font-bold text-slate-900 mt-2">$79/mes</p>
                      <ul className="text-sm text-slate-600 mt-2 space-y-1">
                        <li>• 100 propiedades</li>
                        <li>• 200 inquilinos</li>
                        <li>• 5 usuarios</li>
                      </ul>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-4">
                      <h5 className="font-medium text-slate-900">Plan Empresarial</h5>
                      <p className="text-2xl font-bold text-slate-900 mt-2">$199/mes</p>
                      <ul className="text-sm text-slate-600 mt-2 space-y-1">
                        <li>• Propiedades ilimitadas</li>
                        <li>• Inquilinos ilimitados</li>
                        <li>• 20 usuarios</li>
                      </ul>
                    </div>
                  </div>
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