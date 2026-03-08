import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IndianRupee, Loader2, Download, Upload,
  ArrowDownLeft, Receipt, Printer,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { useToast } from '../../../hooks/useToast';
import { supabase } from '../../../lib/supabase';
import type { Admission, IpdBillItem } from '../types';
import { PAYMENT_MODES, BILL_ITEM_TYPE_CONFIG } from '../types';
import ipdService from '../../../services/ipd.service';
import { cn } from '../../../lib/utils';
import { printIpdBill } from './IpdBillPrint';

interface Props {
  admission: Admission;
  userId: string;
}

interface DepositRecord {
  id: string;
  admission_id: string;
  type: 'deposit' | 'refund';
  amount: number;
  payment_mode: string;
  receipt_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
}

export default function IpdBillingTab({ admission, userId }: Props) {
  const { toast } = useToast();
  const [billItems, setBillItems] = useState<IpdBillItem[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [depositForm, setDepositForm] = useState({ amount: 0, payment_mode: 'Cash', notes: '' });
  const [refundForm, setRefundForm] = useState({ amount: 0, payment_mode: 'Cash', notes: '' });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const items = await ipdService.getIpdBillItems(admission.id);
      setBillItems(items);

      const { data: deps } = await supabase
        .from('ipd_deposits')
        .select('*')
        .eq('admission_id', admission.id)
        .order('created_at', { ascending: false });
      setDeposits((deps ?? []) as DepositRecord[]);
    } catch {
      toast('Error loading billing data', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [admission.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const summary = useMemo(() => {
    const billTotal = billItems.filter(i => i.is_billable).reduce((s, i) => s + Number(i.total_price), 0);
    const totalDeposits = deposits.filter(d => d.type === 'deposit').reduce((s, d) => s + d.amount, 0);
    const totalRefunds = deposits.filter(d => d.type === 'refund').reduce((s, d) => s + d.amount, 0);
    const netDeposit = totalDeposits - totalRefunds;
    const balance = billTotal - netDeposit;
    return { billTotal, totalDeposits, totalRefunds, netDeposit, balance };
  }, [billItems, deposits]);

  const handleCollectDeposit = async () => {
    if (depositForm.amount <= 0) return;
    setSaving(true);
    try {
      const receiptNum = `DEP-${Date.now().toString(36).toUpperCase()}`;
      await supabase.from('ipd_deposits').insert({
        admission_id: admission.id,
        hospital_id: admission.hospital_id,
        type: 'deposit',
        amount: depositForm.amount,
        payment_mode: depositForm.payment_mode,
        receipt_number: receiptNum,
        notes: depositForm.notes || null,
        created_by: userId,
      } as never);
      toast('Deposit collected successfully', { type: 'success' });
      setShowDepositDialog(false);
      setDepositForm({ amount: 0, payment_mode: 'Cash', notes: '' });
      loadData();
    } catch {
      toast('Failed to collect deposit', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRefund = async () => {
    if (refundForm.amount <= 0 || refundForm.amount > summary.netDeposit) return;
    setSaving(true);
    try {
      const receiptNum = `REF-${Date.now().toString(36).toUpperCase()}`;
      await supabase.from('ipd_deposits').insert({
        admission_id: admission.id,
        hospital_id: admission.hospital_id,
        type: 'refund',
        amount: refundForm.amount,
        payment_mode: refundForm.payment_mode,
        receipt_number: receiptNum,
        notes: refundForm.notes || null,
        created_by: userId,
      } as never);
      toast('Refund processed successfully', { type: 'success' });
      setShowRefundDialog(false);
      setRefundForm({ amount: 0, payment_mode: 'Cash', notes: '' });
      loadData();
    } catch {
      toast('Failed to process refund', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <SummaryCard label="Bill Total" value={formatCurrency(summary.billTotal)} color="text-foreground" bg="bg-muted/50" />
        <SummaryCard label="Total Deposits" value={formatCurrency(summary.totalDeposits)} color="text-emerald-700" bg="bg-emerald-50" />
        <SummaryCard label="Total Refunds" value={formatCurrency(summary.totalRefunds)} color="text-amber-700" bg="bg-amber-50" />
        <SummaryCard label="Net Deposit" value={formatCurrency(summary.netDeposit)} color="text-blue-700" bg="bg-blue-50" />
        <SummaryCard
          label={summary.balance > 0 ? 'Balance Due' : 'Excess Deposit'}
          value={formatCurrency(Math.abs(summary.balance))}
          color={summary.balance > 0 ? 'text-destructive' : 'text-emerald-700'}
          bg={summary.balance > 0 ? 'bg-red-50' : 'bg-emerald-50'}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setShowDepositDialog(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          <Download className="w-3.5 h-3.5" /> Collect Deposit
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowRefundDialog(true)} disabled={summary.netDeposit <= 0} className="gap-1.5">
          <Upload className="w-3.5 h-3.5" /> Process Refund
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => printIpdBill({ admission, billItems, deposits: deposits as any, summary })}
          className="gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" /> Print Bill
        </Button>
      </div>

      {/* Running Bill Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" /> Running Bill Items ({billItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Item</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Rate</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {billItems.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No bill items yet</td></tr>
                ) : billItems.map(item => {
                  const typeConf = BILL_ITEM_TYPE_CONFIG[item.item_type];
                  return (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-2 text-muted-foreground">{item.item_date}</td>
                      <td className="px-4 py-2 font-medium">{item.item_name}</td>
                      <td className="px-4 py-2">
                        <Badge variant="secondary" className={cn('text-[10px]', typeConf?.color)}>{typeConf?.label}</Badge>
                      </td>
                      <td className="px-4 py-2 text-right font-mono">{item.quantity}</td>
                      <td className="px-4 py-2 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-2 text-right font-mono font-medium">{formatCurrency(item.total_price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deposit/Refund History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-primary" /> Deposit & Refund History ({deposits.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Receipt #</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Mode</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody>
                {deposits.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No deposits or refunds yet</td></tr>
                ) : deposits.map(dep => (
                  <tr key={dep.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground">{new Date(dep.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary" className={dep.type === 'deposit' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                        {dep.type === 'deposit' ? '↓ Deposit' : '↑ Refund'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{dep.receipt_number || '-'}</td>
                    <td className="px-4 py-2">{dep.payment_mode}</td>
                    <td className={cn('px-4 py-2 text-right font-mono font-medium', dep.type === 'deposit' ? 'text-emerald-700' : 'text-amber-700')}>
                      {dep.type === 'refund' ? '-' : '+'}{formatCurrency(dep.amount)}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">{dep.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={showDepositDialog} onOpenChange={o => !o && setShowDepositDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Download className="w-5 h-5 text-emerald-600" /> Collect Deposit</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase mb-1.5 block">Amount (₹) *</Label>
              <Input type="number" min={0} value={depositForm.amount || ''} onChange={e => setDepositForm({ ...depositForm, amount: parseFloat(e.target.value) || 0 })} className="font-mono text-lg" placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase mb-1.5 block">Payment Mode</Label>
              <Select value={depositForm.payment_mode} onValueChange={v => setDepositForm({ ...depositForm, payment_mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase mb-1.5 block">Notes</Label>
              <Textarea value={depositForm.notes} onChange={e => setDepositForm({ ...depositForm, notes: e.target.value })} rows={2} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepositDialog(false)}>Cancel</Button>
            <Button onClick={handleCollectDeposit} disabled={saving || depositForm.amount <= 0} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : `Collect ${formatCurrency(depositForm.amount)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={o => !o && setShowRefundDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowDownLeft className="w-5 h-5 text-amber-600" /> Process Refund</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <span className="text-muted-foreground">Available for refund:</span>
              <span className="ml-2 font-mono font-bold">{formatCurrency(summary.netDeposit)}</span>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase mb-1.5 block">Refund Amount (₹) *</Label>
              <Input type="number" min={0} max={summary.netDeposit} value={refundForm.amount || ''} onChange={e => setRefundForm({ ...refundForm, amount: parseFloat(e.target.value) || 0 })} className="font-mono text-lg" placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase mb-1.5 block">Refund Mode</Label>
              <Select value={refundForm.payment_mode} onValueChange={v => setRefundForm({ ...refundForm, payment_mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase mb-1.5 block">Reason / Notes *</Label>
              <Textarea value={refundForm.notes} onChange={e => setRefundForm({ ...refundForm, notes: e.target.value })} rows={2} placeholder="Reason for refund..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>Cancel</Button>
            <Button onClick={handleRefund} disabled={saving || refundForm.amount <= 0 || refundForm.amount > summary.netDeposit} variant="destructive">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : `Refund ${formatCurrency(refundForm.amount)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div className={cn('rounded-xl p-3 text-center', bg)}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={cn('text-sm font-bold font-mono', color)}>{value}</div>
    </div>
  );
}
