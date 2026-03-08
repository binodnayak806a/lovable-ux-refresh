import { useState, useMemo } from 'react';
import {
  X, IndianRupee, Calculator, Banknote, CreditCard,
  Smartphone, Globe, Shield, Loader2, Building2,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { cn } from '../../../lib/utils';
import { supabase } from '../../../lib/supabase';

interface BillInfo {
  id: string;
  bill_number: string;
  patient_name?: string;
  total_amount: number;
  paid_amount: number;
  status: string;
}

interface Props {
  open: boolean;
  bill: BillInfo | null;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentMode = 'cash' | 'card' | 'upi' | 'online' | 'insurance' | 'rtgs';

const PAYMENT_MODES: Array<{ value: PaymentMode; label: string; icon: typeof Banknote }> = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'online', label: 'Online', icon: Globe },
  { value: 'rtgs', label: 'RTGS/NEFT', icon: Building2 },
  { value: 'insurance', label: 'Insurance', icon: Shield },
];

const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function CollectPaymentDialog({ open, bill, onClose, onSuccess }: Props) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const balanceDue = (bill?.total_amount ?? 0) - (bill?.paid_amount ?? 0);
  const payAmount = parseFloat(amountStr) || 0;
  const cashReceivedNum = parseFloat(cashReceived) || 0;

  const change = useMemo(() => {
    if (paymentMode !== 'cash') return 0;
    return Math.max(0, cashReceivedNum - payAmount);
  }, [paymentMode, cashReceivedNum, payAmount]);

  const handleSubmit = async () => {
    if (!bill || payAmount <= 0) return;
    setSubmitting(true);
    try {
      const newPaid = (bill.paid_amount || 0) + payAmount;
      const isFullyPaid = newPaid >= bill.total_amount;

      await supabase
        .from('bills')
        .update({
          paid_amount: newPaid,
          amount_paid: newPaid,
          status: isFullyPaid ? 'paid' : 'partial',
          payment_status: isFullyPaid ? 'paid' : 'partial',
          payment_mode: paymentMode,
          payment_reference: paymentRef || null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', bill.id);

      onSuccess();
      handleClose();
    } catch {
      //
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setPaymentMode('cash');
    setPaymentRef('');
    setAmountStr('');
    setCashReceived('');
    onClose();
  };

  if (!open || !bill) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Collect Payment</h2>
            <p className="text-sm text-gray-500">{bill.bill_number} - {bill.patient_name}</p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-sm font-bold font-mono text-gray-900">{formatCurrency(bill.total_amount)}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <p className="text-xs text-emerald-600 mb-1">Paid</p>
              <p className="text-sm font-bold font-mono text-emerald-700">{formatCurrency(bill.paid_amount)}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <p className="text-xs text-amber-600 mb-1">Balance Due</p>
              <p className="text-sm font-bold font-mono text-amber-700">{formatCurrency(balanceDue)}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Amount to Collect *</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={amountStr} onChange={e => setAmountStr(e.target.value)}
                type="number" min={0} max={balanceDue} placeholder="0.00"
                className="pl-10 h-12 text-lg font-mono" />
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setAmountStr(String(balanceDue))}
                className="text-xs px-2.5 py-1 rounded-md border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors font-medium">
                Full Amount ({formatCurrency(balanceDue)})
              </button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Payment Mode</Label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_MODES.map(m => {
                const Icon = m.icon;
                return (
                  <button key={m.value} onClick={() => setPaymentMode(m.value)}
                    className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all',
                      paymentMode === m.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    )}>
                    <Icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {(paymentMode === 'card' || paymentMode === 'upi' || paymentMode === 'online') && (
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Transaction Reference</Label>
              <Input value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="Txn ID / Ref number" className="h-9" />
            </div>
          )}

          {paymentMode === 'cash' && payAmount > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                <Calculator className="w-4 h-4" />
                Change Calculator
              </div>
              <div>
                <Label className="text-xs text-emerald-700 mb-1 block">Cash Received</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <Input value={cashReceived} onChange={e => setCashReceived(e.target.value)}
                    type="number" min={0} placeholder="0.00"
                    className="pl-10 h-10 text-lg font-mono border-emerald-200 focus-visible:border-emerald-400 focus-visible:ring-emerald-200" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DENOMINATIONS.map(d => (
                  <button key={d} onClick={() => setCashReceived(String((parseFloat(cashReceived) || 0) + d))}
                    className="px-2 py-1 text-xs font-medium bg-white border border-emerald-200 rounded-md text-emerald-700 hover:bg-emerald-100 transition-colors">
                    +{d}
                  </button>
                ))}
              </div>
              {cashReceivedNum >= payAmount && payAmount > 0 && (
                <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-emerald-200">
                  <span className="text-sm text-emerald-700 font-medium">Change to Return</span>
                  <span className="text-lg font-bold font-mono text-emerald-700">{formatCurrency(change)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={payAmount <= 0 || payAmount > balanceDue || submitting}
            className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : `Collect ${formatCurrency(payAmount)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
