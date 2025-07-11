import React from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '../../components/ui/button';
import { AccountingEntry } from './AccountingTable';

interface ExportButtonProps {
  entries: AccountingEntry[];
  className?: string;
}

export function ExportButton({ entries, className }: ExportButtonProps) {
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(entries.map(e => ({
      Fecha: e.date.slice(0, 10),
      Tipo: e.type === 'INCOME' ? 'Ingreso' : 'Gasto',
      Concepto: e.concept,
      Monto: e.amount,
      Notas: e.notes || ''
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asientos');
    XLSX.writeFile(wb, 'asientos-contables.xlsx');
  };
  return (
    <Button type="button" onClick={handleExport} className={`flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 mb-4 ${className || ''}`.trim()}>
      <Download className="w-4 h-4 mr-2" />
      Exportar a Excel
    </Button>
  );
}
