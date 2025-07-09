import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../config/api';
import { useToast } from '../hooks/useToast';
import { Filters } from './Accounting/Filters';
import { AccountingTable, AccountingEntry, AccountingPagination, getAccountingPageTotal } from './Accounting/AccountingTable';
import { AccountingForm, AccountingFormValues } from './Accounting/AccountingForm';
import { AccountingChart } from './Accounting/AccountingChart';
import { ExportButton } from './Accounting/ExportButton';
import { Button } from '../components/ui/button';
import { Info, BarChart3, ChevronUp, ChevronDown } from 'lucide-react';

interface Report {
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  monthly: { month: string; ingresos: number; gastos: number }[];
}

function getTodayString() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

function getRangeDates(range: string): { dateFrom: string; dateTo: string } {
  const today = new Date();
  let from: Date, to: Date;
  switch (range) {
    case 'today':
      from = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      to = new Date(from);
      break;
    case 'week': {
      // Calcular lunes de la semana actual
      const dayOfWeek = today.getDay(); // 0 (domingo) - 6 (sábado)
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
      from = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
      // Calcular domingo de la semana actual
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      to = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());
      break;
    }
    case 'month':
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'year':
      from = new Date(today.getFullYear(), 0, 1);
      to = new Date(today.getFullYear(), 11, 31);
      break;
    default:
      from = new Date('1970-01-01');
      to = today;
  }
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  };
}

export default function Accounting() {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<AccountingFormValues>({ type: 'INCOME', concept: '', amount: 0, date: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    concept: '',
    range: 'month',
    dateFrom: getRangeDates('month').dateFrom,
    dateTo: getRangeDates('month').dateTo,
    minAmount: '',
    maxAmount: '',
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [showChartPanel, setShowChartPanel] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAccountingEntries();
      setEntries(data);
    } catch {
      toast.error('Error', 'Error al cargar asientos contables');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      const data = await apiClient.getAccountingReport();
      setReport(data);
    } catch {
      setReport(null);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchReport();

    // --- Actualización en tiempo real de contabilidad ---
    // @ts-expect-error to show in the console
    const socket = window.__rentflow_socket;
    if (!socket) return;
    const onCreated = ({ entry, userName }: { entry: AccountingEntry, userName?: string }) => {
      setEntries((prev) => [entry, ...prev]);
      toast.info('Nueva entrada contable', `${userName ? userName + ' agregó' : 'Se agregó'} un asiento: ${entry.concept}`);
    };
    const onUpdated = ({ entry, userName }: { entry: AccountingEntry, userName?: string }) => {
      setEntries((prev) => prev.map((e) => e.id === entry.id ? entry : e));
      toast.info('Entrada contable actualizada', `${userName ? userName + ' actualizó' : 'Se actualizó'} el asiento: ${entry.concept}`);
    };
    const onDeleted = ({ entryId, userName }: { entryId: string, userName?: string }) => {
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast.info('Entrada contable eliminada', `${userName ? userName + ' eliminó' : 'Se eliminó'} un asiento.`);
    };
    socket.on('accounting:created', onCreated);
    socket.on('accounting:updated', onUpdated);
    socket.on('accounting:deleted', onDeleted);
    return () => {
      socket.off('accounting:created', onCreated);
      socket.off('accounting:updated', onUpdated);
      socket.off('accounting:deleted', onDeleted);
    };
  }, []);

  // Filtros y ordenamiento en memoria (puedes migrar a backend si hay muchos datos)
  const filteredEntries = useMemo(() => {
    let filtered = entries;
    // Rango de fechas
    if (filters.range === 'today') {
      const todayStr = getTodayString();
      filtered = filtered.filter(e => e.date.slice(0, 10) === todayStr);
    } else if (filters.range !== 'custom') {
      const { dateFrom, dateTo } = getRangeDates(filters.range);
      filtered = filtered.filter(e => e.date >= dateFrom && e.date <= dateTo);
    } else {
      if (filters.dateFrom) filtered = filtered.filter(e => e.date >= filters.dateFrom);
      if (filters.dateTo) filtered = filtered.filter(e => e.date <= filters.dateTo);
    }
    if (filters.type) filtered = filtered.filter(e => e.type === filters.type);
    if (filters.concept) filtered = filtered.filter(e => e.concept.toLowerCase().includes(filters.concept.toLowerCase()));
    if (filters.minAmount) filtered = filtered.filter(e => e.amount >= Number(filters.minAmount));
    if (filters.maxAmount) filtered = filtered.filter(e => e.amount <= Number(filters.maxAmount));
    filtered = filtered.sort((a, b) => {
      const vA = a[sortBy as keyof AccountingEntry];
      const vB = b[sortBy as keyof AccountingEntry];
      if (sortBy === 'amount') {
        return sortDir === 'asc' ? (a.amount - b.amount) : (b.amount - a.amount);
      }
      if (sortBy === 'date') {
        return sortDir === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      }
      if (typeof vA === 'string' && typeof vB === 'string') {
        return sortDir === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      return 0;
    });
    return filtered;
  }, [entries, filters, sortBy, sortDir]);

  const pagedEntries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, page, pageSize]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };
  const handleRangeChange = (range: string) => {
    if (range === 'custom') {
      setFilters(f => ({ ...f, range, dateFrom: '', dateTo: '' }));
    } else {
      const { dateFrom, dateTo } = getRangeDates(range);
      setFilters(f => ({ ...f, range, dateFrom, dateTo }));
    }
    setPage(1);
  };
  const handleFilterReset = () => {
    const { dateFrom, dateTo } = getRangeDates('month');
    setFilters({ type: '', concept: '', range: 'month', dateFrom, dateTo, minAmount: '', maxAmount: '' });
    setPage(1);
  };

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOpenModal = () => {
    setForm({ type: 'INCOME', concept: '', amount: 0, date: '' });
    setEditingId(null);
    setModalOpen(true);
  };
  const handleEdit = (entry: AccountingEntry) => {
    setForm(entry);
    setEditingId(entry.id);
    setModalOpen(true);
  };
  const handleCancel = () => {
    setForm({ type: 'INCOME', concept: '', amount: 0, date: '' });
    setEditingId(null);
    setModalOpen(false);
  };
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.updateAccountingEntry(editingId, form);
        toast.success('Éxito', 'Asiento actualizado');
      } else {
        await apiClient.createAccountingEntry(form);
        toast.success('Éxito', 'Asiento creado');
      }
      setForm({ type: 'INCOME', concept: '', amount: 0, date: '' });
      setEditingId(null);
      setModalOpen(false);
      fetchEntries();
      fetchReport();
    } catch (e) {
      toast.error('Error', 'Error al guardar el asiento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este asiento?')) return;
    try {
      await apiClient.deleteAccountingEntry(id);
      toast.success('Éxito', 'Asiento eliminado');
      fetchEntries();
      fetchReport();
    } catch (e) {
      toast.error('Error', 'Error al eliminar el asiento');
    }
  };

  // Datos para la gráfica adaptados al rango
  const chartData = useMemo(() => {
    if (filteredEntries.length === 0) return [];
    // Determinar granularidad
    const { dateFrom, dateTo } = filters.range === 'custom'
      ? { dateFrom: filters.dateFrom, dateTo: filters.dateTo }
      : getRangeDates(filters.range);
    if (!dateFrom || !dateTo) return [];
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    // Hoy: por hora, Semana/Mes/<31d: por día, Año/>31d: por mes
    if (filters.range === 'today') {
      const todayStr = getTodayString();
      // Solo entradas de hoy (por si acaso)
      const todayEntries = filteredEntries.filter(e => e.date.slice(0, 10) === todayStr);
      // Agrupar por hora
      const hours = Array.from({ length: 24 }, (_, h) => h);
      return hours.map(h => {
        const ingresos = todayEntries.filter(e => e.type === 'INCOME' && new Date(e.date).getHours() === h).reduce((a, b) => a + b.amount, 0);
        const gastos = todayEntries.filter(e => e.type === 'EXPENSE' && new Date(e.date).getHours() === h).reduce((a, b) => a + b.amount, 0);
        return { month: `${h}:00`, ingresos, gastos };
      });
    } else if (diffDays <= 31) {
      // Agrupar por día
      const days: string[] = [];
      for (let d = 0; d <= diffDays; d++) {
        const date = new Date(from);
        date.setDate(from.getDate() + d);
        days.push(date.toISOString().slice(0, 10));
      }
      return days.map(day => {
        const ingresos = filteredEntries.filter(e => e.type === 'INCOME' && e.date.slice(0, 10) === day).reduce((a, b) => a + b.amount, 0);
        const gastos = filteredEntries.filter(e => e.type === 'EXPENSE' && e.date.slice(0, 10) === day).reduce((a, b) => a + b.amount, 0);
        return { month: day, ingresos, gastos };
      });
    } else {
      // Agrupar por mes
      const months: { [key: string]: { ingresos: number; gastos: number } } = {};
      filteredEntries.forEach(e => {
        const m = e.date.slice(0, 7); // YYYY-MM
        if (!months[m]) months[m] = { ingresos: 0, gastos: 0 };
        if (e.type === 'INCOME') months[m].ingresos += e.amount;
        if (e.type === 'EXPENSE') months[m].gastos += e.amount;
      });
      return Object.entries(months).map(([month, vals]) => ({ month, ...vals }));
    }
  }, [filteredEntries, filters]);

  // Determinar si mostrar gráfica
  const showChart = useMemo(() => {
    if (filters.range === 'today') return false;
    let from: Date, to: Date;
    if (filters.range === 'custom' && filters.dateFrom && filters.dateTo) {
      from = new Date(filters.dateFrom);
      to = new Date(filters.dateTo);
    } else if (filters.range !== 'custom') {
      const { dateFrom, dateTo } = getRangeDates(filters.range);
      from = new Date(dateFrom);
      to = new Date(dateTo);
    } else {
      return false;
    }
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 1;
  }, [filters]);

  // Botón para mostrar/ocultar gráfica
  const chartToggleButton = showChart && (
    <button
      type="button"
      onClick={() => setShowChartPanel((v) => !v)}
      className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded shadow text-slate-600 text-sm"
      aria-label={showChartPanel ? 'Ocultar gráfica' : 'Mostrar gráfica'}
    >
      <BarChart3 className="w-4 h-4" />
      {showChartPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      {showChartPanel ? 'Ocultar gráfica' : 'Mostrar gráfica'}
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen h-screen">
      <div className="p-6 max-w-6xl mx-auto w-full flex-1 flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Contabilidad</h1>
        {report && (
          <div className="mb-6 p-4 bg-slate-100 rounded-lg flex gap-8 items-center justify-between">
            <div className="flex gap-8">
              <div>
                <div className="text-slate-500 text-xs">Ingresos</div>
                <div className="text-green-600 font-bold text-lg">${report.totalIngresos?.toLocaleString() || 0}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Gastos</div>
                <div className="text-red-600 font-bold text-lg">${report.totalGastos?.toLocaleString() || 0}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Balance</div>
                <div className="text-blue-600 font-bold text-lg">${report.balance?.toLocaleString() || 0}</div>
              </div>
            </div>
            <Button type="button" onClick={handleOpenModal} className="bg-blue-600 text-white px-4 py-2 rounded shadow">+ Agregar entrada</Button>
          </div>
        )}
        {/* Modal para crear/editar entrada */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative animate-fade-in">
              <h2 className="text-xl font-semibold mb-4">{editingId ? 'Editar entrada' : 'Agregar entrada'}</h2>
              <button onClick={handleCancel} className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 text-2xl">×</button>
              <AccountingForm values={form} onChange={handleFormChange} onSubmit={handleFormSubmit} onCancel={handleCancel} editing={!!editingId} loading={loading} />
            </div>
          </div>
        )}
        {/* Gráfica o mensaje informativo */}
        {showChart && (
          <div className="relative">
            <div className={`transition-all duration-300 ${showChartPanel ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <AccountingChart data={chartData} />
            </div>
          </div>
        )}
        {!showChart && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4 flex items-center gap-3 text-slate-500">
            <Info className="w-6 h-6 text-blue-400" />
            <span>Selecciona un rango de al menos dos días para visualizar la gráfica de ingresos y gastos.</span>
          </div>
        )}
        <Filters
          type={filters.type}
          concept={filters.concept}
          range={filters.range}
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          minAmount={filters.minAmount}
          maxAmount={filters.maxAmount}
          onChange={handleFilterChange}
          onRangeChange={handleRangeChange}
          onReset={handleFilterReset}
          chartToggle={chartToggleButton}
        />
        <ExportButton entries={filteredEntries} />
        <div className="w-full max-h-[60vh] overflow-y-auto mb-2 flex-1">
          <AccountingTable
            entries={pagedEntries}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            page={page}
            pageSize={pageSize}
            total={filteredEntries.length}
            onPageChange={setPage}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </div>
        <div className="sticky bottom-0 left-0 w-full bg-white border-t border-slate-200 z-20 py-3 px-6 shadow-lg">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="font-bold text-slate-700">Total página: <span className="text-blue-700">${getAccountingPageTotal(pagedEntries).toLocaleString()}</span></div>
            <AccountingPagination
              page={page}
              pageSize={pageSize}
              total={filteredEntries.length}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 