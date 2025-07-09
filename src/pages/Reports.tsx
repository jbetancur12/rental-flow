import { useMemo, useState } from 'react';
import { Header } from '../components/Layout/Header';
import { useApp } from '../context/useApp';
import { generatePropertyReport, generateTenantReport, generateFinancialReport, generateMaintenanceReport, generateUnitReport } from '../utils/reportGenerator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, FileText, Download, Filter } from 'lucide-react';

export function Reports() {
  const { payments, tenants, properties, contracts, units, maintenanceRequests } = useApp();
  
  // NEW: Filtros para KPIs
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    unitId: '',
    propertyType: 'all'
  });

  // Filtrar datos basado en filtros
  const getFilteredData = () => {
    let filteredPayments = payments;
    let filteredProperties = properties;
    let filteredContracts = contracts;

    // Filtro por mes/año
    if (filters.month && filters.year) {
      filteredPayments = filteredPayments.filter(p => {
        const paymentDate = p.paidDate || p.dueDate;
        return new Date(paymentDate).getMonth() + 1 === filters.month && 
               new Date(paymentDate).getFullYear() === filters.year;
      });
    }

    // Filtro por unidad
    if (filters.unitId) {
      filteredProperties = filteredProperties.filter(p => p.unitId === filters.unitId);
      const propertyIds = filteredProperties.map(p => p.id);
      filteredContracts = filteredContracts.filter(c => propertyIds.includes(c.propertyId));
      filteredPayments = filteredPayments.filter(p => 
        filteredContracts.some(c => c.id === p.contractId)
      );
    }

    // Filtro por tipo de propiedad
    if (filters.propertyType !== 'all') {
      filteredProperties = filteredProperties.filter(p => p.type === filters.propertyType);
      const propertyIds = filteredProperties.map(p => p.id);
      filteredContracts = filteredContracts.filter(c => propertyIds.includes(c.propertyId));
      filteredPayments = filteredPayments.filter(p => 
        filteredContracts.some(c => c.id === p.contractId)
      );
    }

    return { filteredPayments, filteredProperties, filteredContracts };
  };

  const { filteredPayments, filteredProperties, filteredContracts } = getFilteredData();

  // KPIs calculados con filtros
  const totalRevenue = filteredPayments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
  const averageRent = filteredProperties.length > 0 ? 
    filteredProperties.reduce((sum, p) => sum + p.rent, 0) / filteredProperties.length : 0;
  const occupancyRate = filteredProperties.length > 0 ? 
    (filteredProperties.filter(p => p.status === 'RENTED').length / filteredProperties.length) * 100 : 0;
  const maintenanceCost = maintenanceRequests
    .filter(m => filteredProperties.some(p => p.id === m.propertyId))
    .reduce((sum, m) => sum + (m.actualCost || m.estimatedCost || 0), 0);

  // Sample data for charts (you can make this dynamic based on actual data)
const monthlyRevenueData = useMemo(() => {
    const dataPoints = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setMonth(today.getMonth() - i);
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();

      const revenue = payments
        .filter(p => {
          const paidDate = p.paidDate ? new Date(p.paidDate) : null;
          return p.status === 'PAID' && paidDate && paidDate.getMonth() === targetMonth && paidDate.getFullYear() === targetYear;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const expenses = maintenanceRequests
        .filter(req => {
          const completedDate = req.completedDate ? new Date(req.completedDate) : null;
          return req.status === 'COMPLETED' && completedDate && completedDate.getMonth() === targetMonth && completedDate.getFullYear() === targetYear;
        })
        .reduce((sum, req) => sum + (req.actualCost || 0), 0);

      dataPoints.push({
        month: new Date(targetYear, targetMonth).toLocaleString('default', { month: 'short' }),
        revenue,
        expenses,
        profit: revenue - expenses,
      });
    }
    return dataPoints;
  }, [payments, maintenanceRequests]);

  const propertyTypeData = [
    { name: 'Apartamentos', value: 60, count: filteredProperties.filter(p => p.type === 'APARTMENT').length },
    { name: 'Casas', value: 25, count: filteredProperties.filter(p => p.type === 'HOUSE').length },
    { name: 'Comercial', value: 15, count: filteredProperties.filter(p => p.type === 'COMMERCIAL').length },
  ];

const occupancyData = useMemo(() => {
    const dataPoints = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setMonth(today.getMonth() - i);
        const targetMonth = targetDate.getMonth();
        const targetYear = targetDate.getFullYear();
        // Contamos contratos activos en ese mes
        const activeContractsThisMonth = contracts.filter(c => {
            const startDate = new Date(c.startDate);
            const endDate = new Date(c.endDate);
            return c.status === 'ACTIVE' && startDate <= targetDate && endDate >= targetDate;
        }).length;
        const totalProperties = properties.length > 0 ? properties.length : 1;
        const rate = (activeContractsThisMonth / totalProperties) * 100;
        dataPoints.push({
            month: new Date(targetYear, targetMonth).toLocaleString('default', { month: 'short' }),
            rate: parseFloat(rate.toFixed(1)),
        });
    }
    return dataPoints;
  }, [contracts, properties]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const handleGeneratePropertyReport = () => {
    generatePropertyReport(filteredProperties);
  };

  const handleGenerateTenantReport = () => {
    generateTenantReport(tenants);
  };

  const handleGenerateFinancialReport = () => {
    generateFinancialReport(filteredPayments, filteredContracts, tenants, properties);
  };

  const handleGenerateMaintenanceReport = () => {
    generateMaintenanceReport(maintenanceRequests, properties);
  };

  // NEW: Unit Report
  const handleGenerateUnitReport = () => {
    generateUnitReport(units, properties);
  };

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Reportes y Analíticas" />
      
      <div className="p-6">
        {/* NEW: Filtros */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 gap-y-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mes</label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({...filters, month: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={i+1} value={i+1}>
                    {new Date(0, i).toLocaleString('es-ES', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Año</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({...filters, year: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2023, 2022].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Unidad</label>
              <select
                value={filters.unitId}
                onChange={(e) => setFilters({...filters, unitId: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las Unidades</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Propiedad</label>
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los Tipos</option>
                <option value="APARTMENT">Apartamentos</option>
                <option value="HOUSE">Casas</option>
                <option value="COMMERCIAL">Comercial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics - NOW WITH FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ingreso Total</p>
                <p className="text-2xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-emerald-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Filtrado
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Alquiler Promedio</p>
                <p className="text-2xl font-bold text-slate-900">${Math.round(averageRent).toLocaleString()}</p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Filtrado
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Tasa de Ocupación</p>
                <p className="text-2xl font-bold text-slate-900">{Math.round(occupancyRate)}%</p>
                <p className="text-sm text-emerald-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Filtrado
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Costo de Mantenimiento</p>
                <p className="text-2xl font-bold text-slate-900">${maintenanceCost.toLocaleString()}</p>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1 rotate-180" />
                  Filtrado
                </p>
              </div>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Ingreso vs Gastos</h3>
              <button className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Property Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Distribución de Propiedades</h3>
              <button className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={propertyTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {propertyTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Occupancy Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Tendencia de Ocupación</h3>
            <button className="flex items-center text-sm text-blue-600 hover:text-blue-800">
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  domain={[70, 100]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value}%`, 'Tasa de Ocupación']}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Report Actions - NOW WITH UNIT REPORT */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Reporte de Propiedad</h3>
            <p className="text-sm text-slate-600 mb-4">
              Resumen completo de la propiedad, incluyendo ocupación, alquiler y detalles de estado.
            </p>
            <button 
              onClick={handleGeneratePropertyReport}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Generar Reporte
            </button>
          </div>
          
          {/* NEW: Unit Report */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Reporte de Unidad</h3>
            <p className="text-sm text-slate-600 mb-4">
              Análisis detallado de unidades, incluyendo edificios, casas y espacios comerciales.
            </p>
            <button 
              onClick={handleGenerateUnitReport}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              Generar Reporte
            </button>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Reporte de Inquilino</h3>
            <p className="text-sm text-slate-600 mb-4">
              Información detallada de inquilinos, detalles de empleo y estado de aplicación.
            </p>
            <button 
              onClick={handleGenerateTenantReport}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
            >
              Generar Reporte
            </button>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Reporte Financiero</h3>
            <p className="text-sm text-slate-600 mb-4">
              Análisis de ingresos, seguimiento de pagos y métricas de rendimiento financiero.
            </p>
            <button 
              onClick={handleGenerateFinancialReport}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              Generar Reporte
            </button>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Reporte de Mantenimiento</h3>
            <p className="text-sm text-slate-600 mb-4">
              Tendencias de solicitudes de mantenimiento, costos y análisis de condición de la propiedad.
            </p>
            <button 
              onClick={handleGenerateMaintenanceReport}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
            >
              Generar Reporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}