import { useMemo, useState } from 'react';
import { Header } from '../components/Layout/Header';
import { useApp } from '../context/useApp';
import { generatePropertyReport, generateTenantReport, generateFinancialReport, generateMaintenanceReport, generateUnitReport } from '../utils/reportGenerator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, FileText, Download, Filter } from 'lucide-react';

export function Reports() {
  const { state } = useApp();
  
  // NEW: Filtros para KPIs
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    unitId: '',
    propertyType: 'all'
  });

  // Filtrar datos basado en filtros
  const getFilteredData = () => {
    let filteredPayments = state.payments;
    let filteredProperties = state.properties;
    let filteredContracts = state.contracts;

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
  const maintenanceCost = state.maintenanceRequests
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

      const revenue = state.payments
        .filter(p => {
          const paidDate = p.paidDate ? new Date(p.paidDate) : null;
          return p.status === 'PAID' && paidDate && paidDate.getMonth() === targetMonth && paidDate.getFullYear() === targetYear;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const expenses = state.maintenanceRequests
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
  }, [state.payments, state.maintenanceRequests]);

  const propertyTypeData = [
    { name: 'Apartments', value: 60, count: filteredProperties.filter(p => p.type === 'APARTMENT').length },
    { name: 'Houses', value: 25, count: filteredProperties.filter(p => p.type === 'HOUSE').length },
    { name: 'Commercial', value: 15, count: filteredProperties.filter(p => p.type === 'COMMERCIAL').length },
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
        const activeContractsThisMonth = state.contracts.filter(c => {
            const startDate = new Date(c.startDate);
            const endDate = new Date(c.endDate);
            return c.status === 'ACTIVE' && startDate <= targetDate && endDate >= targetDate;
        }).length;
        
        const totalProperties = state.properties.length > 0 ? state.properties.length : 1;
        const rate = (activeContractsThisMonth / totalProperties) * 100;

        dataPoints.push({
            month: new Date(targetYear, targetMonth).toLocaleString('default', { month: 'short' }),
            rate: parseFloat(rate.toFixed(1)),
        });
    }
    return dataPoints;
  }, [state.contracts, state.properties]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const handleGeneratePropertyReport = () => {
    generatePropertyReport(filteredProperties);
  };

  const handleGenerateTenantReport = () => {
    generateTenantReport(state.tenants);
  };

  const handleGenerateFinancialReport = () => {
    generateFinancialReport(filteredPayments, filteredContracts, state.tenants, state.properties);
  };

  const handleGenerateMaintenanceReport = () => {
    generateMaintenanceReport(state.maintenanceRequests, state.properties);
  };

  // NEW: Unit Report
  const handleGenerateUnitReport = () => {
    generateUnitReport(state.units, state.properties);
  };

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Reports & Analytics" />
      
      <div className="p-6">
        {/* NEW: Filtros */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Month</label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({...filters, month: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={i+1} value={i+1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Unit</label>
              <select
                value={filters.unitId}
                onChange={(e) => setFilters({...filters, unitId: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Units</option>
                {state.units.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Property Type</label>
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="APARTMENT">Apartments</option>
                <option value="HOUSE">Houses</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics - NOW WITH FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-emerald-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Filtered
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Average Rent</p>
                <p className="text-2xl font-bold text-slate-900">${Math.round(averageRent).toLocaleString()}</p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Filtered
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Occupancy Rate</p>
                <p className="text-2xl font-bold text-slate-900">{Math.round(occupancyRate)}%</p>
                <p className="text-sm text-emerald-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Filtered
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Maintenance Cost</p>
                <p className="text-2xl font-bold text-slate-900">${maintenanceCost.toLocaleString()}</p>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1 rotate-180" />
                  Filtered
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
              <h3 className="text-lg font-semibold text-slate-900">Revenue vs Expenses</h3>
              <button className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                <Download className="w-4 h-4 mr-1" />
                Export
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
              <h3 className="text-lg font-semibold text-slate-900">Property Distribution</h3>
              <button className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                <Download className="w-4 h-4 mr-1" />
                Export
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
            <h3 className="text-lg font-semibold text-slate-900">Occupancy Rate Trend</h3>
            <button className="flex items-center text-sm text-blue-600 hover:text-blue-800">
              <Download className="w-4 h-4 mr-1" />
              Export
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
                  formatter={(value) => [`${value}%`, 'Occupancy Rate']}
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
            <h3 className="font-semibold text-slate-900 mb-3">Property Report</h3>
            <p className="text-sm text-slate-600 mb-4">
              Comprehensive property overview including occupancy, rent, and status details.
            </p>
            <button 
              onClick={handleGeneratePropertyReport}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Generate Report
            </button>
          </div>
          
          {/* NEW: Unit Report */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Unit Report</h3>
            <p className="text-sm text-slate-600 mb-4">
              Detailed unit analysis including buildings, houses, and commercial spaces.
            </p>
            <button 
              onClick={handleGenerateUnitReport}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              Generate Report
            </button>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Tenant Report</h3>
            <p className="text-sm text-slate-600 mb-4">
              Detailed tenant information, employment details, and application status.
            </p>
            <button 
              onClick={handleGenerateTenantReport}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
            >
              Generate Report
            </button>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Financial Report</h3>
            <p className="text-sm text-slate-600 mb-4">
              Revenue analysis, payment tracking, and financial performance metrics.
            </p>
            <button 
              onClick={handleGenerateFinancialReport}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              Generate Report
            </button>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Maintenance Report</h3>
            <p className="text-sm text-slate-600 mb-4">
              Maintenance request trends, costs, and property condition analysis.
            </p>
            <button 
              onClick={handleGenerateMaintenanceReport}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}