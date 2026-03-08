import { Plus, Trash2, Banknote, CreditCard, Smartphone, Globe, Shield, Building2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import type { SplitPaymentEntry, PaymentMode } from './types';
import { PAYMENT_MODES, createEmptySplitEntry } from './types';
import { cn } from '../../../lib/utils';

interface Props {
  entries: SplitPaymentEntry[];
  totalAmount: number;
  onChange: (entries: SplitPaymentEntry[]) => void;
}

const MODE_ICONS: Record<PaymentMode, typeof Banknote> = {
  cash: Banknote, card: CreditCard, upi: Smartphone,
  online: Globe, rtgs: Building2, insurance: Shield,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
}

export default function SplitPaymentPanel({ entries, totalAmount, onChange }: Props) {
  const allocated = entries.reduce((s, e) => s + e.amount, 0);
  const remaining = totalAmount - allocated;

  const addEntry = () => {
    const usedModes = entries.map(e => e.mode);
    const nextMode = PAYMENT_MODES.find(m => !usedModes.includes(m.value))?.value || 'cash';
    onChange([...entries, { ...createEmptySplitEntry(nextMode), amount: Math.max(0, remaining) }]);
  };

  const updateEntry = (id: string, field: keyof SplitPaymentEntry, value: string | number) => {
    onChange(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 2) return;
    onChange(entries.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-border">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Split Payment</h4>
        <span className={cn('text-xs font-mono font-medium', remaining === 0 ? 'text-emerald-600' : remaining > 0 ? 'text-amber-600' : 'text-destructive')}>
          {remaining === 0 ? '✓ Fully allocated' : `Remaining: ${formatCurrency(remaining)}`}
        </span>
      </div>

      {entries.map((entry, idx) => {
        const Icon = MODE_ICONS[entry.mode] || Banknote;
        return (
          <div key={entry.id} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
            <Select value={entry.mode} onValueChange={v => updateEntry(entry.id, 'mode', v as PaymentMode)}>
              <SelectTrigger className="w-36 h-9">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
              <Input
                type="number" min={0} value={entry.amount || ''}
                onChange={e => updateEntry(entry.id, 'amount', parseFloat(e.target.value) || 0)}
                className="pl-7 h-9 font-mono"
                placeholder="0.00"
              />
            </div>
            {(entry.mode !== 'cash') && (
              <Input
                value={entry.reference}
                onChange={e => updateEntry(entry.id, 'reference', e.target.value)}
                placeholder="Ref #"
                className="h-9 w-28 text-xs"
              />
            )}
            <button onClick={() => removeEntry(entry.id)} disabled={entries.length <= 2}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      {entries.length < 4 && (
        <Button variant="outline" size="sm" onClick={addEntry} className="gap-1.5 h-8 border-dashed w-full">
          <Plus className="w-3.5 h-3.5" /> Add Payment Mode
        </Button>
      )}
    </div>
  );
}
