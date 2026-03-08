import { Search, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Receipt } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Account, Transaction } from '../types';
import { TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_COLORS } from '../types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
}

interface Props {
  transactions: Transaction[];
  accounts: Account[];
  selectedAccountId: string | null;
  search: string;
  onSearchChange: (v: string) => void;
}

function getTransactionIcon(type: Transaction['type']) {
  if (type === 'deposit' || type === 'bill_payment') return ArrowDownLeft;
  if (type === 'withdraw' || type === 'refund') return ArrowUpRight;
  return ArrowLeftRight;
}

function isCredit(type: Transaction['type']) {
  return type === 'deposit' || type === 'bill_payment';
}

export default function TransactionTable({ transactions, accounts, selectedAccountId, search, onSearchChange }: Props) {
  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]));
  const selectedAccount = selectedAccountId ? accountMap[selectedAccountId] : null;

  const filtered = transactions
    .filter(t => {
      if (!selectedAccountId) return true;
      return t.fromAccountId === selectedAccountId || t.toAccountId === selectedAccountId;
    })
    .filter(t => {
      if (!search) return true;
      const q = search.toLowerCase();
      return t.description.toLowerCase().includes(q) ||
        t.billNumber?.toLowerCase().includes(q) ||
        t.patientName?.toLowerCase().includes(q) ||
        t.referenceNumber?.toLowerCase().includes(q);
    });

  return (
    <div className="flex flex-col h-full">
      {/* Account header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {selectedAccount?.name || 'All Accounts'}
          </h2>
          {selectedAccount?.accountNumber && (
            <p className="text-xs text-muted-foreground font-mono">{selectedAccount.accountNumber}</p>
          )}
        </div>
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Transactions heading */}
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-foreground">Transactions</h3>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
              <Receipt className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground">No Transactions to show</p>
            <p className="text-xs text-muted-foreground mt-0.5">You haven't added any transactions yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs w-28">Type</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs w-32">Date</TableHead>
                <TableHead className="text-xs text-right w-28">Amount</TableHead>
                <TableHead className="text-xs w-32">Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(txn => {
                const TxnIcon = getTransactionIcon(txn.type);
                const credit = isCredit(txn.type);

                return (
                  <TableRow key={txn.id} className="group hover:bg-muted/20">
                    <TableCell>
                      <Badge variant="secondary" className={cn('text-[10px] font-medium gap-1', TRANSACTION_TYPE_COLORS[txn.type])}>
                        <TxnIcon className="h-3 w-3" />
                        {TRANSACTION_TYPE_LABELS[txn.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-medium text-foreground">{txn.description}</p>
                      {txn.billNumber && (
                        <p className="text-[10px] text-muted-foreground">
                          Bill: <span className="font-mono">{txn.billNumber}</span>
                          {txn.patientName && <> • {txn.patientName}</>}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(txn.date), 'dd MMM yyyy')}
                      <br />
                      <span className="text-[10px]">{format(new Date(txn.date), 'hh:mm a')}</span>
                    </TableCell>
                    <TableCell className={cn('text-right text-xs font-mono font-semibold', credit ? 'text-emerald-600' : 'text-red-600')}>
                      {credit ? '+' : '-'}{formatCurrency(txn.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {txn.referenceNumber || '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
