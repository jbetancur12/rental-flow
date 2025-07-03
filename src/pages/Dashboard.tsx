import { useMemo } from 'react';
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function Dashboard() {
    const { state } = useApp();
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

            const monthlyRevenue = state.payments
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

            const monthlyExpenses = state.maintenanceRequests
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
                month: format(targetDate, 'MMM', { locale: es }),
                revenue: monthlyRevenue,
                expenses: monthlyExpenses,
            });
        }
        return dataPoints;
    }, [state.payments, state.maintenanceRequests]);

    // --- RESTO DE LA LÓGICA DEL COMPONENTE (SIN CAMBIOS) ---
    const totalProperties = state.properties.length;
    const occupiedProperties = state.properties.filter(p => p.status === 'RENTED').length;
    const occupancyRate = totalProperties > 0 ? ((occupiedProperties / totalProperties) * 100).toFixed(1) : '0';
    
    const totalRevenue = state.payments
        .filter(p => p.status === 'PAID' && p.type === 'RENT')
        .reduce((sum, p) => sum + p.amount, 0);
    
    const overduePayments = state.payments.filter(p => {
        if (p.status !== 'PENDING') return false;
        return new Date(p.dueDate) < new Date();
    }).length;

    const pendingMaintenance = state.maintenanceRequests.filter(
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
                        value={state.tenants.filter(t => t.status === 'ACTIVE').length}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <FinancialChart data={chartData} />
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