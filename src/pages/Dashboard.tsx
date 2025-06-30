import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout/Header';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { RecentActivity } from '../components/Dashboard/RecentActivity';
import { FinancialChart } from '../components/Dashboard/FinancialChart';
import { 
  Building2, 
  Users, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Dashboard() {
  const { state } = useApp();
  const navigate = useNavigate();

  const totalProperties = state.properties.length;
  const occupiedProperties = state.properties.filter(p => p.status === 'rented').length;
  const occupancyRate = totalProperties > 0 ? ((occupiedProperties / totalProperties) * 100).toFixed(1) : '0';
  
  const totalRevenue = state.payments
    .filter(p => p.status === 'paid' && p.type === 'rent')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const overduePayments = state.payments.filter(p => {
    if (p.status !== 'pending') return false;
    return new Date(p.dueDate) < new Date();
  }).length;

  const pendingMaintenance = state.maintenanceRequests.filter(
    m => m.status === 'open' || m.status === 'in_progress'
  ).length;

  // FIX: Quick Actions funcionando
  const handleAddProperty = () => {
    navigate('/properties');
    // Trigger new property modal after navigation
    setTimeout(() => {
      const addButton = document.querySelector('[data-testid="add-property-btn"]') as HTMLButtonElement;
      if (addButton) addButton.click();
    }, 100);
  };

  const handleProcessApplication = () => {
    navigate('/tenants');
  };

  const handleScheduleInspection = () => {
    navigate('/maintenance');
  };

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Resumen del Panel" />
      
      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total de Propiedades"
            value={totalProperties}
            change={`${occupancyRate}% ocupadas`}
            changeType="positive"
            icon={Building2}
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Inquilinos Activos"
            value={state.tenants.filter(t => t.status === 'active').length}
            change="+2 este mes"
            changeType="positive"
            icon={Users}
            iconColor="text-emerald-600"
          />
          <StatsCard
            title="Ingresos Mensuales"
            value={`$${totalRevenue.toLocaleString()}`}
            change="+8.2%"
            changeType="positive"
            icon={DollarSign}
            iconColor="text-green-600"
          />
          <StatsCard
            title="Problemas Pendientes"
            value={pendingMaintenance + overduePayments}
            change={`${overduePayments} vencidos`}
            changeType={overduePayments > 0 ? 'negative' : 'neutral'}
            icon={AlertTriangle}
            iconColor="text-orange-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Chart */}
          <div className="lg:col-span-2">
            <FinancialChart />
          </div>
          
          {/* Recent Activity */}
          <div>
            <RecentActivity />
          </div>
        </div>

        {/* Quick Actions - FIX: Ahora funcionan */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={handleAddProperty}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-center mb-2">
                <TrendingUp className="w-6 h-6 text-blue-600 mr-2 group-hover:scale-110 transition-transform" />
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-medium text-slate-900">Agregar Nueva Propiedad</h3>
              <p className="text-sm text-slate-600">Listar una nueva propiedad en alquiler</p>
            </button>
            
            <button 
              onClick={handleProcessApplication}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-center mb-2">
                <Users className="w-6 h-6 text-emerald-600 mr-2 group-hover:scale-110 transition-transform" />
                <Plus className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-medium text-slate-900">Procesar Solicitud</h3>
              <p className="text-sm text-slate-600">Revisar solicitudes de inquilinos</p>
            </button>
            
            <button 
              onClick={handleScheduleInspection}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-center mb-2">
                <Calendar className="w-6 h-6 text-purple-600 mr-2 group-hover:scale-110 transition-transform" />
                <Plus className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="font-medium text-slate-900">Programar Inspección</h3>
              <p className="text-sm text-slate-600">Reservar inspección de propiedad</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}