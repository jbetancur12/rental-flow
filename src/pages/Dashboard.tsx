import { useMemo, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout/Header';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { RecentActivity } from '../components/Dashboard/RecentActivity';
import { 
    Building2, 
    Users, 
    DollarSign, 
    AlertTriangle,
    TrendingUp,
    Calendar,
    Plus
} from 'lucide-react';
import { useApp } from '../context/useApp';
import { es } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

const FinancialChart = lazy(() => import('../components/Dashboard/FinancialChart').then(m => ({ default: m.FinancialChart })));

// Skeleton loader para Dashboard
function DashboardSkeleton() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
            <div className="h-6 w-16 bg-slate-200 rounded mb-4" />
            <div className="h-8 w-24 bg-slate-300 rounded mb-2" />
            <div className="h-4 w-12 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse h-80" />
        </div>
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse h-80" />
        </div>
      </div>
      <div className="mt-8">
        <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-white border border-slate-200 rounded-lg animate-pulse h-28" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
    const { payments, tenants, properties, maintenanceRequests } = useApp();
    const navigate = useNavigate();

    // --- CÁLCULO DE DATOS PARA EL GRÁFICO (BLOQUE AÑADIDO) ---
    const chartData = useMemo(() => {
        const dataPoints = [];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const targetDate = new Date();
            targetDate.setMonth(today.getMonth() - i);
            const targetMonth = targetDate.getMonth();
            const targetYear = targetDate.getFullYear();

            const monthlyRevenue = payments
                .filter(p => {
                    const paymentDate = p.paidDate ? new Date(p.paidDate) : null;
                    return (
                        p.status === 'PAID' &&
                        paymentDate &&
                        paymentDate.getMonth() === targetMonth &&
                        paymentDate.getFullYear() === targetYear
                    );
                })
                .reduce((sum, p) => sum + p.amount, 0);

            const monthlyExpenses = maintenanceRequests
                .filter(req => {
                    const completionDate = req.completedDate ? new Date(req.completedDate) : null;
                    return (
                        req.status === 'COMPLETED' &&
                        completionDate &&
                        completionDate.getMonth() === targetMonth &&
                        completionDate.getFullYear() === targetYear
                    );
                })
                .reduce((sum, req) => sum + (req.actualCost || 0), 0);
            
            dataPoints.push({
                month: formatInTimeZone(targetDate, 'UTC', 'MMM', { locale: es }),
                revenue: monthlyRevenue,
                expenses: monthlyExpenses,
            });
        }
        return dataPoints;
    }, [payments, maintenanceRequests]);

    // Calcular ingresos del mes actual y anterior
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const currentMonthRevenue = payments
        .filter(p => {
            if (p.status !== 'PAID' || p.type !== 'RENT') return false;
            const paidDate = p.paidDate ? new Date(p.paidDate) : null;
            return paidDate && paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + p.amount, 0);

    const lastMonthRevenue = payments
        .filter(p => {
            if (p.status !== 'PAID' || p.type !== 'RENT') return false;
            const paidDate = p.paidDate ? new Date(p.paidDate) : null;
            return paidDate && paidDate.getMonth() === lastMonth && paidDate.getFullYear() === lastMonthYear;
        })
        .reduce((sum, p) => sum + p.amount, 0);

    let revenueChange = '0%';
    if (lastMonthRevenue > 0) {
        const diff = currentMonthRevenue - lastMonthRevenue;
        const percent = (diff / lastMonthRevenue) * 100;
        revenueChange = `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;
    }

    // Calcular inquilinos activos del mes actual y anterior
    const currentMonthActiveTenants = tenants.filter(t => {
        if (t.status !== 'ACTIVE') return false;
        const createdAt = t.createdAt ? new Date(t.createdAt) : null;
        return createdAt && createdAt.getMonth() <= currentMonth && createdAt.getFullYear() <= currentYear;
    }).length;

    const lastMonthActiveTenants = tenants.filter(t => {
        if (t.status !== 'ACTIVE') return false;
        const createdAt = t.createdAt ? new Date(t.createdAt) : null;
        // Debe haber sido creado antes o durante el mes anterior y seguir activo
        return createdAt && createdAt.getMonth() <= lastMonth && createdAt.getFullYear() <= lastMonthYear;
    }).length;

    let tenantsChange = '0 este mes';
    let tenantsChangeType: 'positive' | 'negative' | 'neutral' = 'neutral';
    const diffTenants = currentMonthActiveTenants - lastMonthActiveTenants;
    if (diffTenants > 0) {
        tenantsChange = `+${diffTenants} este mes`;
        tenantsChangeType = 'positive';
    } else if (diffTenants < 0) {
        tenantsChange = `${diffTenants} este mes`;
        tenantsChangeType = 'negative';
    }

    // --- RESTO DE LA LÓGICA DEL COMPONENTE (SIN CAMBIOS) ---
    const totalProperties = properties.length;
    const occupiedProperties = properties.filter(p => p.status === 'RENTED').length;
    const occupancyRate = totalProperties > 0 ? ((occupiedProperties / totalProperties) * 100).toFixed(1) : '0';
    
    const totalRevenue = payments
        .filter(p => p.status === 'PAID' && p.type === 'RENT')
        .reduce((sum, p) => sum + p.amount, 0);
    
    const overduePayments = payments.filter(p => {
        if (p.status !== 'PENDING') return false;
        return new Date(p.dueDate) < new Date();
    }).length;

    const pendingMaintenance = maintenanceRequests.filter(
        m => m.status === 'OPEN' || m.status === 'IN_PROGRESS'
    ).length;

    const handleAddProperty = () => navigate('/properties');
    const handleProcessApplication = () => navigate('/tenants');
    const handleScheduleInspection = () => navigate('/maintenance');

    return (
        <div className="flex-1 overflow-auto">
            <Header title="Resumen del Panel" />
            
            <div className="p-6">
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
                        value={tenants.filter(t => t.status === 'ACTIVE').length}
                        change={tenantsChange}
                        changeType={tenantsChangeType}
                        icon={Users}
                        iconColor="text-emerald-600"
                    />
                    <StatsCard
                        title="Ingresos Mensuales"
                        value={`$${totalRevenue.toLocaleString()}`}
                        change={revenueChange}
                        changeType={revenueChange.startsWith('-') ? 'negative' : revenueChange === '0%' ? 'neutral' : 'positive'}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Suspense fallback={<DashboardSkeleton />}>
                            <FinancialChart data={chartData} />
                        </Suspense>
                    </div>
                    
                    <div>
                        <RecentActivity />
                    </div>
                </div>

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