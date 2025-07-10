import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';

export interface AccountingEntry {
  id: string;
  type: string;
  concept: string;
  amount: number;
  date: string;
  notes?: string;
  unit?: { name: string };
  property?: { name: string };
}

interface AccountingTableProps {
  entries: AccountingEntry[];
  loading: boolean;
  onEdit: (entry: AccountingEntry) => void;
  onDelete: (id: string) => void;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
}

export function AccountingTable({ entries, loading, onEdit, onDelete, sortBy, sortDir, onSort }: AccountingTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => onSort('date')} className="cursor-pointer dark:text-slate-200">Fecha {sortBy==='date' ? (sortDir==='asc'?'▲':'▼') : ''}</TableHead>
            <TableHead onClick={() => onSort('type')} className="cursor-pointer dark:text-slate-200">Tipo {sortBy==='type' ? (sortDir==='asc'?'▲':'▼') : ''}</TableHead>
            <TableHead onClick={() => onSort('concept')} className="cursor-pointer dark:text-slate-200">Concepto {sortBy==='concept' ? (sortDir==='asc'?'▲':'▼') : ''}</TableHead>
            <TableHead onClick={() => onSort('amount')} className="cursor-pointer dark:text-slate-200">Monto {sortBy==='amount' ? (sortDir==='asc'?'▲':'▼') : ''}</TableHead>
            <TableHead className="dark:text-slate-200">Notas</TableHead>
            <TableHead className="dark:text-slate-200">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8 dark:text-slate-400">Cargando...</TableCell></TableRow>
          ) : entries.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400 dark:text-slate-500">No hay asientos contables</TableCell></TableRow>
          ) : entries.map((entry) => (
            <TableRow key={entry.id} className="dark:hover:bg-slate-800">
              <TableCell className="dark:text-slate-100">{entry.date.slice(0, 10)}</TableCell>
              <TableCell className="dark:text-slate-100">{entry.type === 'INCOME' ? 'Ingreso' : 'Gasto'}</TableCell>
              <TableCell className="dark:text-slate-100">{entry.concept}</TableCell>
              <TableCell className="dark:text-slate-100">${entry.amount.toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {entry.unit?.name && <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs px-2 py-0.5 rounded">Unidad: {entry.unit.name}</span>}
                  {entry.property?.name && <span className="inline-block bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 text-xs px-2 py-0.5 rounded">Propiedad: {entry.property.name}</span>}
                  {entry.notes && <span className="text-xs text-slate-600 dark:text-slate-400">{entry.notes}</span>}
                  {!(entry.unit?.name || entry.property?.name || entry.notes) && <span className="dark:text-slate-500">-</span>}
                </div>
              </TableCell>
              <TableCell>
                <Button type="button" onClick={() => onEdit(entry)} className="bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100 px-2 py-1 rounded transition-colors hover:bg-yellow-300 dark:hover:bg-yellow-800">Editar</Button>
                <Button type="button" onClick={() => onDelete(entry.id)} className="bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-100 px-2 py-1 rounded ml-2 transition-colors hover:bg-red-300 dark:hover:bg-red-800">Eliminar</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AccountingPagination({ page, pageSize, total, onPageChange }: { page: number, pageSize: number, total: number, onPageChange: (page: number) => void }) {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="flex justify-end items-center gap-2 mt-2">
      <Button type="button" disabled={page===1} onClick={()=>onPageChange(page-1)} className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-100 px-3 py-1 rounded transition-colors hover:bg-slate-300 dark:hover:bg-slate-700">Anterior</Button>
      <span className="text-slate-700 dark:text-slate-100">Página {page} de {totalPages}</span>
      <Button type="button" disabled={page===totalPages} onClick={()=>onPageChange(page+1)} className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-100 px-3 py-1 rounded transition-colors hover:bg-slate-300 dark:hover:bg-slate-700">Siguiente</Button>
    </div>
  );
}
