import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Search, Plus, Trash2, IndianRupee, Calculator,
  Banknote, CreditCard, Smartphone, Globe, Shield,
  Loader2, Receipt, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { useHospitalId } from '@/hooks/useHospitalId';
import { useAppSelector } from '@/store';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import { billingService } from '@/services/billing.service';
import ServiceGroupPicker, { type ServicePickerItem } from '@/components/billing/ServiceGroupPicker';
import { cn } from '@/lib/utils';

interface PatientResult {
  id: string;
  full_name: string;
  uhid: string;
  phone: string;
  gender: string | null;
}

interface LineItem {
  uid: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
}

type PaymentMode = 'cash' | 'card' | 'upi' | 'online' | 'insurance';

const PAYMENT_MODES: Array<{ value: PaymentMode; label: string; icon: typeof Banknote }> = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'online', label: 'Online', icon: Globe },
  { value: 'insurance', label: 'Insurance', icon: Shield },
];

const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
}

function createLineItem(svc?: ServicePickerItem): LineItem {
  return {
    uid: crypto.randomUUID(),
    name: svc?.name ?? '',
    category: svc?.category ?? 'consultation',
    quantity: 1,
    unitPrice: svc?.rate ?? 0,
    taxPercent: svc?.tax_percentage ?? 18,
  };
}

export default function CreateBillPage() {
  const navigate = useNavigate();
  const hospitalId = useHospitalId();
  const userId = useAppSelector(s => s.auth.user?.id ?? '');
  const { toast } = useToast();

  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [lineItems, setLineItems] = useState<LineItem[]>([createLineItem()]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [notes, setNotes] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [billType, setBillType] = useState<'opd' | 'ipd' | 'pharmacy' | 'lab' | 'other'>('opd');
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(patientSearch, 300);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) { setPatients([]); return; }
    setSearchLoading(true);
    (async () => {
      try {
        const { data } = await supabase
          .from('patients')
          .select('id, full_name, uhid, phone, gender')
          .eq('hospital_id', hospitalId)
          .or(`full_name.ilike.%${debouncedSearch}%,uhid.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`)
          .limit(8);
        setPatients((data ?? []) as PatientResult[]);
      } catch { setPatients([]); }
      finally { setSearchLoading(false); }
    })();
  }, [debouncedSearch, hospitalId]);

  const addServiceItem = useCallback((svc: ServicePickerItem) => {
    setLineItems(prev => [...prev.filter(i => i.name.trim()), createLineItem(svc)]);
  }, []);

  const addBlankItem = () => setLineItems(prev => [...prev, createLineItem()]);

  const removeItem = (uid: string) => {
    setLineItems(prev => prev.length <= 1 ? prev : prev.filter(i => i.uid !== uid));
  };

  const updateItem = (uid: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item => item.uid === uid ? { ...item, [field]: value } : item));
  };

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const discountAmt = (subtotal * discountPercent) / 100;
    const taxable = subtotal - discountAmt;
    let totalTax = 0;
    for (const item of lineItems) {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemTotal / (subtotal || 1)) * discountAmt;
      totalTax += ((itemTotal - itemDiscount) * item.taxPercent) / 100;
    }
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;
    const grandTotal = taxable + totalTax;
    const cashReceivedNum = parseFloat(cashReceived) || 0;
    const change = paymentMode === 'cash' ? Math.max(0, cashReceivedNum - grandTotal) : 0;
    return { subtotal, discountAmt, taxable, totalTax, cgst, sgst, grandTotal, change };
  }, [lineItems, discountPercent, cashReceived, paymentMode]);

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    const validItems = lineItems.filter(i => i.name.trim() && i.unitPrice > 0);
    if (validItems.length === 0) return;
    setSubmitting(true);
    try {
      const billItems = validItems.map(i => ({
        id: i.uid,
        itemType: i.category as 'consultation' | 'procedure' | 'medication' | 'lab' | 'room' | 'other',
        itemName: i.name, description: '', quantity: i.quantity,
        unitPrice: i.unitPrice, totalPrice: i.quantity * i.unitPrice,
      }));
      await billingService.createBill(selectedPatient.id, null, null, billItems, {
        discountPercentage: discountPercent,
        taxPercentage: totals.totalTax > 0 ? Math.round((totals.totalTax / totals.taxable) * 100 * 100) / 100 : 0,
        paymentMode, paymentReference: paymentRef, notes,
        isSplitPayment: false, splitEntries: [],
      }, { subtotal: totals.subtotal, discountAmount: totals.discountAmt, taxAmount: totals.totalTax, totalAmount: totals.grandTotal }, userId);
      toast('Bill Generated', { description: 'Invoice created successfully', type: 'success' });
      navigate('/billing');
    } catch {
      toast('Error', { description: 'Could not generate bill', type: 'error' });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/billing')} className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Create New Bill
            </h1>
            <p className="text-sm text-muted-foreground">Add services, apply GST, and generate invoice</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {lineItems.filter(i => i.name.trim()).length} item(s) · {formatCurrency(totals.grandTotal)}
          </span>
          <Button variant="outline" onClick={() => navigate('/billing')} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit}
            disabled={!selectedPatient || lineItems.every(i => !i.name.trim()) || submitting}
            className="gap-1.5">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Generate Bill'}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Patient + Bill Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Patient *</Label>
              {selectedPatient ? (
                <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {selectedPatient.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{selectedPatient.full_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedPatient.uhid} | {selectedPatient.phone}</p>
                  </div>
                  <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={patientSearch} onChange={e => setPatientSearch(e.target.value)} placeholder="Search patient..." className="pl-10" />
                  {(patients.length > 0 || searchLoading) && (
                    <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {searchLoading ? (
                        <p className="text-sm text-muted-foreground text-center py-3">Searching...</p>
                      ) : patients.map(p => (
                        <button key={p.id} onClick={() => { setSelectedPatient(p); setPatients([]); setPatientSearch(''); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-accent text-sm border-b border-border last:border-b-0">
                          <p className="font-medium text-foreground">{p.full_name}</p>
                          <p className="text-xs text-muted-foreground">{p.uhid} | {p.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Bill Type</Label>
              <div className="flex flex-wrap gap-2">
                {(['opd', 'ipd', 'pharmacy', 'lab', 'other'] as const).map(t => (
                  <button key={t} onClick={() => setBillType(t)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all uppercase',
                      billType === t ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/50 border-border text-muted-foreground hover:border-foreground/20'
                    )}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Two column: Left = services + items, Right = payment + summary */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column - 3/5 */}
            <div className="lg:col-span-3 space-y-4">
              {/* Service Group Picker */}
              <div className="border border-border rounded-xl p-4 bg-card">
                <h3 className="text-sm font-semibold text-foreground mb-3">Add from Service Master</h3>
                <ServiceGroupPicker
                  hospitalId={hospitalId}
                  filterType={billType === 'opd' ? 'OPD' : billType === 'ipd' ? 'IPD' : null}
                  onSelect={addServiceItem}
                  compact
                />
              </div>

              {/* Line Items Table */}
              <div className="border border-border rounded-xl overflow-hidden bg-card">
                <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground">Line Items</Label>
                  <Button variant="ghost" size="sm" onClick={addBlankItem} className="gap-1.5 h-7 text-xs">
                    <Plus className="w-3 h-3" /> Add manual
                  </Button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Item</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-center w-16">Qty</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-right w-24">Rate</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-center w-20">GST%</th>
                      <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-right w-24">Total</th>
                      <th className="py-2 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map(item => (
                      <tr key={item.uid} className="border-b border-border last:border-b-0">
                        <td className="py-1.5 px-3">
                          <input value={item.name} onChange={e => updateItem(item.uid, 'name', e.target.value)}
                            placeholder="Item name" className="w-full text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground" />
                        </td>
                        <td className="py-1.5 px-3">
                          <input type="number" min={1} value={item.quantity}
                            onChange={e => updateItem(item.uid, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full text-sm text-center outline-none bg-transparent text-foreground" />
                        </td>
                        <td className="py-1.5 px-3">
                          <input type="number" min={0} value={item.unitPrice}
                            onChange={e => updateItem(item.uid, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm text-right outline-none bg-transparent font-mono text-foreground" />
                        </td>
                        <td className="py-1.5 px-3">
                          <input type="number" min={0} max={100} value={item.taxPercent}
                            onChange={e => updateItem(item.uid, 'taxPercent', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm text-center outline-none bg-transparent text-foreground" />
                        </td>
                        <td className="py-1.5 px-3 text-right text-sm font-mono font-medium text-foreground">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                        <td className="py-1.5 px-3">
                          <button onClick={() => removeItem(item.uid)}
                            className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                            disabled={lineItems.length <= 1}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column - 2/5 */}
            <div className="lg:col-span-2 space-y-4">
              {/* Payment Mode */}
              <div className="border border-border rounded-xl p-4 bg-card space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment Mode</h3>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_MODES.map(m => {
                    const Icon = m.icon;
                    return (
                      <button key={m.value} onClick={() => setPaymentMode(m.value)}
                        className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all',
                          paymentMode === m.value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-foreground/20'
                        )}>
                        <Icon className="w-3.5 h-3.5" />
                        {m.label}
                      </button>
                    );
                  })}
                </div>

                {(paymentMode === 'card' || paymentMode === 'upi' || paymentMode === 'online') && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Transaction Reference</Label>
                    <Input value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="Txn ID / Ref" className="h-9" />
                  </div>
                )}

                {paymentMode === 'cash' && totals.grandTotal > 0 && (
                  <div className="p-3 bg-accent/50 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calculator className="w-4 h-4" />
                      Cash Calculator
                    </div>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={cashReceived} onChange={e => setCashReceived(e.target.value)}
                        type="number" min={0} placeholder="0.00" className="pl-10 h-10 text-lg font-mono" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {DENOMINATIONS.map(d => (
                        <button key={d} onClick={() => setCashReceived(String((parseFloat(cashReceived) || 0) + d))}
                          className="px-2 py-1 text-xs font-medium bg-card border border-border rounded-md hover:bg-accent transition-colors">
                          +{d}
                        </button>
                      ))}
                    </div>
                    {(parseFloat(cashReceived) || 0) >= totals.grandTotal && (
                      <div className="flex items-center justify-between p-2 bg-card rounded-lg border border-border">
                        <span className="text-sm font-medium">Change</span>
                        <span className="text-lg font-bold font-mono">{formatCurrency(totals.change)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</Label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..."
                    rows={2} className="w-full rounded-lg border border-border bg-background text-sm px-3 py-2 outline-none focus:border-ring resize-none text-foreground" />
                </div>
              </div>

              {/* Bill Summary */}
              <div className="border border-border rounded-xl p-4 bg-card space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bill Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono text-foreground">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Discount</span>
                      <input type="number" min={0} max={100} value={discountPercent}
                        onChange={e => setDiscountPercent(parseFloat(e.target.value) || 0)}
                        className="w-12 h-5 px-1 rounded border border-border text-xs text-center outline-none bg-background text-foreground" />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <span className="font-mono text-destructive">-{formatCurrency(totals.discountAmt)}</span>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Taxable</span><span className="font-mono text-foreground">{formatCurrency(totals.taxable)}</span></div>
                  </div>
                  <div className="flex justify-between"><span className="text-muted-foreground">CGST</span><span className="font-mono">+{formatCurrency(totals.cgst)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">SGST</span><span className="font-mono">+{formatCurrency(totals.sgst)}</span></div>
                  <div className="border-t-2 border-border pt-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">Grand Total</span>
                      <span className="text-xl font-bold font-mono text-primary">{formatCurrency(totals.grandTotal)}</span>
                    </div>
                  </div>
                </div>
                {totals.totalTax > 0 && (
                  <Badge variant="outline" className="text-xs mt-2">
                    GST: {formatCurrency(totals.totalTax)} (CGST {formatCurrency(totals.cgst)} + SGST {formatCurrency(totals.sgst)})
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
