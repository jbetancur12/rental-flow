import React from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export interface AccountingFormValues {
  type: string;
  concept: string;
  amount: number;
  date: string;
  notes?: string;
}

interface AccountingFormProps {
  values: AccountingFormValues;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  editing: boolean;
  loading: boolean;
}

export function AccountingForm({ values, onChange, onSubmit, onCancel, editing, loading }: AccountingFormProps) {
  return (
    <form onSubmit={onSubmit} className="mb-4 flex flex-wrap gap-4 items-end bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400">Tipo</label>
        <select name="type" value={values.type} onChange={onChange} className="border rounded px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700" required>
          <option value="INCOME">Ingreso</option>
          <option value="EXPENSE">Gasto</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400">Concepto</label>
        <Input name="concept" value={values.concept || ''} onChange={onChange} required minLength={2} maxLength={100} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400">Monto</label>
        <Input name="amount" type="number" value={values.amount || ''} onChange={onChange} required min={0.01} step={0.01} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400">Fecha</label>
        <Input name="date" type="date" value={values.date ? values.date.slice(0, 10) : ''} onChange={onChange} required className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400">Notas</label>
        <Input name="notes" value={values.notes || ''} onChange={onChange} maxLength={200} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700" />
      </div>
      <Button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors" disabled={loading}>
        {editing ? 'Actualizar' : 'Crear'}
      </Button>
      {editing && (
        <Button type="button" onClick={onCancel} className="ml-2 bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded transition-colors hover:bg-slate-400 dark:hover:bg-slate-700" disabled={loading}>
          Cancelar
        </Button>
      )}
    </form>
  );
}
