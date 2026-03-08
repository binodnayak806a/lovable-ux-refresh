import { Landmark, Wallet, Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Account } from '../types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
}

interface Props {
  accounts: Account[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddAccount: () => void;
}

export default function AccountsList({ accounts, selectedId, onSelect, onAddAccount }: Props) {
  const cashAccounts = accounts.filter(a => a.type === 'cash');
  const bankAccounts = accounts.filter(a => a.type === 'bank');
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="flex flex-col h-full border-r border-border/50">
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accounts</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddAccount}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Balance</p>
          <p className="text-lg font-bold text-primary font-mono">{formatCurrency(totalBalance)}</p>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Cash */}
        {cashAccounts.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Cash</p>
            {cashAccounts.map(acc => (
              <AccountRow key={acc.id} account={acc} selected={selectedId === acc.id} onSelect={onSelect} />
            ))}
          </div>
        )}

        {/* Bank */}
        {bankAccounts.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Bank</p>
            {bankAccounts.map(acc => (
              <AccountRow key={acc.id} account={acc} selected={selectedId === acc.id} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AccountRow({ account, selected, onSelect }: { account: Account; selected: boolean; onSelect: (id: string) => void }) {
  const Icon = account.type === 'cash' ? Wallet : Landmark;

  return (
    <button
      onClick={() => onSelect(account.id)}
      className={cn(
        'w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-all text-sm',
        selected
          ? 'bg-primary/10 border border-primary/20 shadow-sm'
          : 'hover:bg-muted/50 border border-transparent'
      )}
    >
      <div className={cn(
        'flex items-center justify-center h-8 w-8 rounded-lg shrink-0',
        selected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-medium truncate', selected ? 'text-primary' : 'text-foreground')}>{account.name}</p>
        <p className={cn('text-xs font-mono font-semibold', account.balance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
          {formatCurrency(account.balance)}
        </p>
      </div>
    </button>
  );
}
