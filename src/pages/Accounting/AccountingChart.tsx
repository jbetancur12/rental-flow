import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Detectar dark mode
function useIsDark() {
  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    const root = document.documentElement;
    const check = () => setIsDark(root.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

interface ChartData {
  month: string;
  ingresos: number;
  gastos: number;
}

export function AccountingChart({ data }: { data: ChartData[] }) {
  const isDark = useIsDark();
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Resumen Mensual</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : 'white', color: isDark ? '#f1f5f9' : '#0f172a', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} labelStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }} itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }} />
            <Bar dataKey="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center space-x-6 mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm text-slate-600 dark:text-slate-300">Ingresos</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm text-slate-600 dark:text-slate-300">Gastos</span>
        </div>
      </div>
    </div>
  );
}
