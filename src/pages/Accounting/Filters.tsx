import React from 'react';

const RANGE_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'year', label: 'Este año' },
  { value: 'custom', label: 'Personalizado' },
];

interface FiltersProps {
  type: string;
  concept: string;
  range: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onRangeChange: (range: string) => void;
  onReset: () => void;
  chartToggle?: React.ReactNode;
}

export function Filters({ type, concept, range, dateFrom, dateTo, minAmount, maxAmount, onChange, onRangeChange, onReset, chartToggle }: FiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap items-end gap-4 justify-between">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-slate-500">Rango</label>
          <select name="range" value={range} onChange={e => onRangeChange(e.target.value)} className="border rounded px-2 py-1">
            {RANGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {range === 'custom' && (
          <>
            <div>
              <label className="block text-xs text-slate-500">Desde</label>
              <input name="dateFrom" type="date" value={dateFrom} onChange={onChange} className="border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Hasta</label>
              <input name="dateTo" type="date" value={dateTo} onChange={onChange} className="border rounded px-2 py-1" />
            </div>
          </>
        )}
        <div>
          <label className="block text-xs text-slate-500">Tipo</label>
          <select name="type" value={type} onChange={onChange} className="border rounded px-2 py-1">
            <option value="">Todos</option>
            <option value="INCOME">Ingreso</option>
            <option value="EXPENSE">Gasto</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500">Concepto</label>
          <input name="concept" value={concept} onChange={onChange} className="border rounded px-2 py-1" placeholder="Buscar concepto..." />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Monto mín.</label>
          <input name="minAmount" type="number" value={minAmount} onChange={onChange} className="border rounded px-2 py-1 w-24" />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Monto máx.</label>
          <input name="maxAmount" type="number" value={maxAmount} onChange={onChange} className="border rounded px-2 py-1 w-24" />
        </div>
        <button type="button" onClick={onReset} className="ml-2 bg-slate-200 text-slate-700 px-4 py-2 rounded">Limpiar</button>
      </div>
      {chartToggle && <div className="ml-auto flex-shrink-0">{chartToggle}</div>}
    </div>
  );
}
