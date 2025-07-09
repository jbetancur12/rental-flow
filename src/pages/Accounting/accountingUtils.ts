import { AccountingEntry } from './AccountingTable';

export function getAccountingPageTotal(entries: AccountingEntry[]): number {
  return entries.reduce((acc, e) => acc + e.amount, 0);
} 