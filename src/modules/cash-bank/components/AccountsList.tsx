import { useState } from 'react';
import { Landmark, Wallet, Plus, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  onUpdateAccount: (id: string, updates: Partial<Account>) => void;
}

export default function AccountsList({ accounts, selectedId, onSelect, onAddAccount, onUpdateAccount }: Props) {
  const cashAccounts = accounts.filter(a => a.type === 'cash');
  const bankAccounts = accounts.filter(a => a.type === 'bank');
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="flex flex-col h-full border-r border-border/40">
      {/* Header */}
      <div className="p-3 border-b border-border/40">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Accounts</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={onAddAccount}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="glass-card p-3 !rounded-xl">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Total Balance</p>
          <p className="text-lg font-bold text-primary font-mono mt-0.5">{formatCurrency(totalBalance)}</p>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {cashAccounts.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1.5">Cash</p>
            <div className="space-y-1">
              {cashAccounts.map(acc => (
                <AccountRow key={acc.id} account={acc} selected={selectedId === acc.id} onSelect={onSelect} onUpdate={onUpdateAccount} />
              ))}
            </div>
          </div>
        )}

        {bankAccounts.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1.5">Bank</p>
            <div className="space-y-1">
              {bankAccounts.map(acc => (
                <AccountRow key={acc.id} account={acc} selected={selectedId === acc.id} onSelect={onSelect} onUpdate={onUpdateAccount} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountRow({ account, selected, onSelect, onUpdate }: {
  account: Account; selected: boolean; onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Account>) => void;
}) {
  const Icon = account.type === 'cash' ? Wallet : Landmark;
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(account.name);
  const [editBalance, setEditBalance] = useState(String(account.balance));

  const handleSave = () => {
    onUpdate(account.id, {
      name: editName.trim() || account.name,
      balance: parseFloat(editBalance) || account.balance,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditName(account.name);
    setEditBalance(String(account.balance));
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="p-2.5 rounded-xl border border-primary/30 bg-accent/50 space-y-2">
        <Input
          value={editName}
          onChange={e => setEditName(e.target.value)}
          className="h-7 text-xs"
          placeholder="Account name"
          autoFocus
        />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground shrink-0">₹</span>
          <Input
            type="number"
            value={editBalance}
            onChange={e => setEditBalance(e.target.value)}
            className="h-7 text-xs font-mono"
            placeholder="Balance"
          />
        </div>
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={handleCancel}>
            <X className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={handleSave}>
            <Check className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <button
        onClick={() => onSelect(account.id)}
        className={cn(
          'w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all text-sm',
          selected
            ? 'bg-accent border border-primary/20 shadow-sm'
            : 'hover:bg-muted/60 border border-transparent'
        )}
      >
        <div className={cn(
          'flex items-center justify-center h-8 w-8 rounded-lg shrink-0',
          selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs font-medium truncate', selected ? 'text-accent-foreground' : 'text-foreground')}>{account.name}</p>
          <p className={cn('text-xs font-mono font-semibold', account.balance >= 0 ? 'text-[hsl(var(--success))]' : 'text-destructive')}>
            {formatCurrency(account.balance)}
          </p>
        </div>
      </button>
      {/* Edit button on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        className="absolute top-2 right-2 h-6 w-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-muted hover:bg-muted-foreground/10 text-muted-foreground"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  );
}
