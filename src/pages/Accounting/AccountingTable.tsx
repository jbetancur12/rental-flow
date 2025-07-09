import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooter } from '../../components/ui/table';
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
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
}

export function AccountingTable({ entries, loading, onEdit, onDelete, page, pageSize, total, onPageChange, sortBy, sortDir, onSort }: AccountingTableProps) {
  const totalPages = Math.ceil(total / pageSize);
  const sum = entries.reduce((acc, e) => acc + e.amount, 0);
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => onSort('date')} className="cursor-pointer">Fecha {sortBy==='date' ? (sortDir==='asc'?'▲':'▼') : ''}</TableHead>
            <TableHead onClick={() => onSort('type')} className="cursor-pointer">Tipo {sortBy==='type' ? (sortDir==='asc'?'▲':'▼') : ''}</TableHead>
            <TableHead onClick={() => onSort('concept')} className="cursor-pointer">Concepto {sortBy==='concept' ? (sortDir==='asc'?'▲':'▼') : ''}</TableHead>
            <TableHead onClick={() => onSort('amount')} className="cursor-pointer">Monto {sortBy==='amount' ? (sortDir==='asc'?'▲':'▼') : ''}</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
          ) : entries.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No hay asientos contables</TableCell></TableRow>
          ) : entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.date.slice(0, 10)}</TableCell>
              <TableCell>{entry.type === 'INCOME' ? 'Ingreso' : 'Gasto'}</TableCell>
              <TableCell>{entry.concept}</TableCell>
              <TableCell>${entry.amount.toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {entry.unit?.name && <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">Unidad: {entry.unit.name}</span>}
                  {entry.property?.name && <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">Propiedad: {entry.property.name}</span>}
                  {entry.notes && <span className="text-xs text-slate-600">{entry.notes}</span>}
                  {!(entry.unit?.name || entry.property?.name || entry.notes) && '-'}
                </div>
              </TableCell>
              <TableCell>
                <Button type="button" onClick={() => onEdit(entry)} className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Editar</Button>
                <Button type="button" onClick={() => onDelete(entry.id)} className="bg-red-200 text-red-800 px-2 py-1 rounded ml-2">Eliminar</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="font-bold">Total página</TableCell>
            <TableCell className="font-bold">${sum.toLocaleString()}</TableCell>
            <TableCell colSpan={2}></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      {/* Paginación */}
      <div className="flex justify-end items-center gap-2 mt-2">
        <Button type="button" disabled={page===1} onClick={()=>onPageChange(page-1)}>Anterior</Button>
        <span>Página {page} de {totalPages}</span>
        <Button type="button" disabled={page===totalPages} onClick={()=>onPageChange(page+1)}>Siguiente</Button>
      </div>
    </div>
  );
}
