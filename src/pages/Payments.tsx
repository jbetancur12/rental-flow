import { useState, useEffect } from 'react';
import { Header } from '../components/Layout/Header';
import { PaymentForm } from '../components/Payments/PaymentForm';
import { useApp } from '../context/AppContext';
import { generateFinancialReport,  generateReceiptForPayment } from '../utils/reportGenerator';
import { CreditCard, Calendar, User, Home, AlertCircle, CheckCircle, Clock, Download, Edit, Trash2, Filter, BarChart3, Receipt } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { Payment } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Payments() {
  const { state, dispatch, loadPayments } = useApp();
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'PAID' | 'OVERDUE'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>();
  
  // NEW: Filtros para KPIs
  const [kpiFilters, setKpiFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    unitId: '',
    propertyType: 'all'
  });
  
  const [showKPIs, setShowKPIs] = useState(true);

  const fetchPayments = async () => {
    try {
      await loadPayments();
    } catch (error) {
      
    }
  }

  useEffect(() => {
    if (state.payments.length === 0) {
      fetchPayments()
    }
  }, [state.payments.length]);

  // NEW: Listen for receipt generation events
  useEffect(() => {
    const handleGenerateReceipt = async (event: any) => {
      const { paymentData, isNewPayment } = event.detail;
      
      if (isNewPayment) {
        // For new payments, we need to wait for the payment to be created
        setTimeout(async () => {
          const latestPayment = state.payments[state.payments.length - 1];
          if (latestPayment) {
            await generateReceiptForPayment(latestPayment.id, state.payments, state.tenants, state.properties, state.contracts);
          }
        }, 500);
      } else {
        // For existing payments, generate receipt immediately
        const payment = state.payments.find(p => p.contractId === paymentData.contractId && p.tenantId === paymentData.tenantId);
        if (payment) {
          await generateReceiptForPayment(payment.id, state.payments, state.tenants, state.properties, state.contracts);
        }
      }
    };

    window.addEventListener('generateReceipt', handleGenerateReceipt);
    return () => window.removeEventListener('generateReceipt', handleGenerateReceipt);
  }, [state.payments, state.tenants, state.properties, state.contracts]);

  const getPaymentStatus = (payment: any) => {
    if (payment.status === 'PAID') return 'PAID';
    if (payment.status === 'PENDING' && isAfter(new Date(), payment.dueDate)) return 'OVERDUE';
    return payment.status;
  };

  const filteredPayments = state.payments.filter(payment => {
    if (filter === 'all') return true;
    if (filter === 'OVERDUE') return getPaymentStatus(payment) === 'OVERDUE';
    return payment.status === filter;
  });

  // NEW: Filtrar datos para KPIs
  const getFilteredKPIData = () => {
    let filtered = state.payments;

    // Filtro por mes/año
    if (kpiFilters.month && kpiFilters.year) {
      filtered = filtered.filter(p => {
        const paymentDate = p.paidDate || p.dueDate;
        return new Date(paymentDate).getMonth() + 1 === kpiFilters.month && 
               new Date(paymentDate).getFullYear() === kpiFilters.year;
      });
    }

    // Filtro por unidad
    if (kpiFilters.unitId) {
      const unitProperties = state.properties.filter(p => p.unitId === kpiFilters.unitId);
      const unitContracts = state.contracts.filter(c => 
        unitProperties.some(p => p.id === c.propertyId)
      );
      filtered = filtered.filter(p => 
        unitContracts.some(c => c.id === p.contractId)
      );
    }

    // Filtro por tipo de propiedad
    if (kpiFilters.propertyType !== 'all') {
      const typeProperties = state.properties.filter(p => p.type === kpiFilters.propertyType);
      const typeContracts = state.contracts.filter(c => 
        typeProperties.some(p => p.id === c.propertyId)
      );
      filtered = filtered.filter(p => 
        typeContracts.some(c => c.id === p.contractId)
      );
    }

    return filtered;
  };

  const kpiData = getFilteredKPIData();

  // KPIs calculados
  const totalCollected = kpiData.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = kpiData.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
  const overdueAmount = kpiData.filter(p => getPaymentStatus(p) === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0);
  const thisMonthAmount = kpiData.filter(p => p.dueDate.getMonth() === new Date().getMonth()).reduce((sum, p) => sum + p.amount, 0);

  // Datos para gráficos
  const paymentTypeData = [
    { name: 'Alquiler', value: kpiData.filter(p => p.type === 'RENT').reduce((sum, p) => sum + p.amount, 0) },
    { name: 'Depósito', value: kpiData.filter(p => p.type === 'DEPOSIT').reduce((sum, p) => sum + p.amount, 0) },
    { name: 'Recargo', value: kpiData.filter(p => p.type === 'LATE_FEE').reduce((sum, p) => sum + p.amount, 0) },
    { name: 'Servicios', value: kpiData.filter(p => p.type === 'UTILITY').reduce((sum, p) => sum + p.amount, 0) },
  ].filter(item => item.value > 0);

  const monthlyTrendData = Array.from({length: 6}, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (5 - i));
    const monthPayments = state.payments.filter(p => 
      p.dueDate.getMonth() === month.getMonth() && 
      p.dueDate.getFullYear() === month.getFullYear()
    );
    return {
      month: month.toLocaleDateString('default', { month: 'short' }),
      collected: monthPayments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
      PENDING: monthPayments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0)
    };
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'OVERDUE':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PAID: 'bg-emerald-100 text-emerald-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      OVERDUE: 'bg-red-100 text-red-800',
      partial: 'bg-orange-100 text-orange-800'
    };
    return colors[status as keyof typeof colors] || colors.PENDING;
  };

  const getTenantName = (tenantId: string) => {
    const tenant = state.tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Inquilino Desconocido';
  };

  const getPropertyName = (contractId: string) => {
    const contract = state.contracts.find(c => c.id === contractId);
    if (!contract) return 'Propiedad Desconocida';
    const property = state.properties.find(p => p.id === contract.propertyId);
    return property?.name || 'Propiedad Desconocida';
  };

  const handleNewPayment = () => {
    setEditingPayment(undefined);
    setIsFormOpen(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setIsFormOpen(true);
  };

  const handleDeletePayment = (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar este pago?')) {
      // In a real app, you'd dispatch a DELETE_PAYMENT action
      console.log('Delete payment:', id);
    }
  };

  // NEW: Generate receipt for existing payment
  const handleGenerateReceipt = async (payment: Payment) => {
    await generateReceiptForPayment(payment.id, state.payments, state.tenants, state.properties, state.contracts);
  };

  const handleSavePayment = (paymentData: Omit<Payment, 'id'>) => {
    if (editingPayment) {
      dispatch({
        type: 'UPDATE_PAYMENT',
        payload: {
          ...paymentData,
          id: editingPayment.id
        }
      });
    } else {
      const newPayment = {
        ...paymentData,
        id: `payment-${Date.now()}`
      };
      dispatch({
        type: 'ADD_PAYMENT',
        payload: newPayment
      });
    }
  };

  const handleGenerateReport = () => {
    generateFinancialReport(filteredPayments, state.contracts);
  };

  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Pagos" 
        onNewItem={handleNewPayment}
        newItemLabel="Registrar Pago"
      />
      
      <div className="p-6">
        {/* NEW: Toggle KPIs */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowKPIs(!showKPIs)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {showKPIs ? 'Ocultar' : 'Mostrar'} Análisis
          </button>
        </div>

        {/* NEW: KPIs Section */}
        {showKPIs && (
          <>
            {/* Filtros para KPIs */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filtros de Análisis
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mes</label>
                  <select
                    value={kpiFilters.month}
                    onChange={(e) => setKpiFilters({...kpiFilters, month: parseInt(e.target.value)})}
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Año</label>
                  <select
                    value={kpiFilters.year}
                    onChange={(e) => setKpiFilters({...kpiFilters, year: parseInt(e.target.value)})}
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
                    value={kpiFilters.unitId}
                    onChange={(e) => setKpiFilters({...kpiFilters, unitId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas las Unidades</option>
                    {state.units.map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Propiedad</label>
                  <select
                    value={kpiFilters.propertyType}
                    onChange={(e) => setKpiFilters({...kpiFilters, propertyType: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los Tipos</option>
                    <option value="apartment">Apartamentos</option>
                    <option value="house">Casas</option>
                    <option value="commercial">Comerciales</option>
                  </select>
                </div>
              </div>
            </div>

            {/* KPIs Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Recaudado</p>
                    <p className="text-2xl font-bold text-emerald-600">${totalCollected.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">Datos filtrados</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Pendiente</p>
                    <p className="text-2xl font-bold text-yellow-600">${pendingAmount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">Datos filtrados</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Vencido</p>
                    <p className="text-2xl font-bold text-red-600">${overdueAmount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">Datos filtrados</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Este Mes</p>
                    <p className="text-2xl font-bold text-blue-600">${thisMonthAmount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">Datos filtrados</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Payment Trend */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Tendencia de Pagos (6 Meses)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="collected" fill="#10b981" name="Recaudado" />
                      <Bar dataKey="PENDING" fill="#f59e0b" name="Pendiente" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Types */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Tipos de Pago</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                      >
                        {paymentTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Summary Cards - Original */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Recaudado</p>
                <p className="text-2xl font-bold text-emerald-600">
                  ${state.payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pendiente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${state.payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Vencido</p>
                <p className="text-2xl font-bold text-red-600">
                  ${filteredPayments.filter(p => getPaymentStatus(p) === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Este Mes</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${state.payments.filter(p => p.dueDate.getMonth() === new Date().getMonth()).reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2">
            {['all', 'PENDING', 'PAID', 'OVERDUE'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {status === 'all' ? 'Todos' :
                 status === 'PENDING' ? 'Pendientes' :
                 status === 'PAID' ? 'Pagados' : 'Vencidos'}
                <span className="ml-2 text-xs">
                  ({filter === 'all' ? state.payments.length : 
                    filter === 'OVERDUE' ? filteredPayments.filter(p => getPaymentStatus(p) === 'OVERDUE').length :
                    state.payments.filter(p => p.status === status).length})
                </span>
              </button>
            ))}
          </div>
          
          <button
            onClick={handleGenerateReport}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Reporte
          </button>
        </div>

        {/* Payments List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Pago</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Inquilino</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Propiedad</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Monto</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Fecha de Vencimiento</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Estado</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPayments.map((payment) => {
                  const status = getPaymentStatus(payment);
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          {getStatusIcon(status)}
                          <div className="ml-3">
                            <p className="font-medium text-slate-900">
                              {payment.type === 'RENT' ? 'Alquiler' :
                               payment.type === 'DEPOSIT' ? 'Depósito' :
                               payment.type === 'LATE_FEE' ? 'Recargo por Mora' :
                               payment.type === 'UTILITY' ? 'Servicios' : 'Mantenimiento'}
                            </p>
                            <p className="text-sm text-slate-500">#{payment.id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-slate-400 mr-2" />
                          <span className="text-sm text-slate-900">{getTenantName(payment.tenantId)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <Home className="w-4 h-4 text-slate-400 mr-2" />
                          <span className="text-sm text-slate-900">{getPropertyName(payment.contractId)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium text-slate-900">${payment.amount.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                          <span className="text-sm text-slate-900">{format(payment.dueDate, 'MMM d, yyyy')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {status === 'PAID' ? 'Pagado' :
                           status === 'PENDING' ? 'Pendiente' :
                           status === 'OVERDUE' ? 'Vencido' : 'Parcial'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          {/* NEW: Generate Receipt Button */}
                          {payment.status === 'PAID' && (
                            <button 
                              onClick={() => handleGenerateReceipt(payment)}
                              className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                              title="Generar Comprobante"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleEditPayment(payment)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <CreditCard className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No se encontraron pagos</h3>
            <p className="text-slate-600 mb-4">
              {filter === 'all' 
                ? "No hay registros de pagos disponibles."
                : `No se encontraron pagos ${filter === 'PENDING' ? 'pendientes' : 
                    filter === 'PAID' ? 'pagados' : 'vencidos'}.`
              }
            </p>
            <button
              onClick={handleNewPayment}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Registrar Primer Pago
            </button>
          </div>
        )}
      </div>

      <PaymentForm
        payment={editingPayment}
        contracts={state.contracts}
        tenants={state.tenants}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSavePayment}
      />
    </div>
  );
}