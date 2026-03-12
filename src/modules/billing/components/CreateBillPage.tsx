import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Search, Plus, Trash2, IndianRupee, Calculator,
  Banknote, CreditCard, Smartphone, Globe, Shield,
  Loader2, Receipt, ArrowLeft, Building2, Share2,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  description: string;
  category: string;
  quantity: number;
  unit: 'NONE' | 'Nos' | 'Pcs' | 'Hrs' | 'Days';
  unitPrice: number;
  priceWithTax: boolean;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  amount: number;
}

type PaymentMode = 'cash' | 'card' | 'upi' | 'online' | 'insurance' | 'rtgs';
type BillingMode = 'cash' | 'credit';

const PAYMENT_MODES: Array<{ value: PaymentMode; label: string; icon: typeof Banknote }> = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'online', label: 'Online', icon: Globe },
  { value: 'rtgs', label: 'RTGS/NEFT', icon: Building2 },
  { value: 'insurance', label: 'Insurance', icon: Shield },
];

const UNITS = ['NONE', 'Nos', 'Pcs', 'Hrs', 'Days'] as const;
const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
}

function calcLineItem(item: LineItem): LineItem {
  const base = item.quantity * item.unitPrice;
  const discAmt = item.discountPercent > 0 ? (base * item.discountPercent) / 100 : item.discountAmount;
  const discPct = item.discountAmount > 0 && item.discountPercent === 0 && base > 0 ? (item.discountAmount / base) * 100 : item.discountPercent;
  const afterDiscount = base - discAmt;
  const taxAmt = (afterDiscount * item.taxPercent) / 100;
  const amount = afterDiscount + taxAmt;
  return { ...item, discountAmount: discAmt, discountPercent: discPct, taxAmount: taxAmt, amount };
}

function createLineItem(svc?: ServicePickerItem): LineItem {
  const base: LineItem = {
    uid: crypto.randomUUID(),
    name: svc?.name ?? '',
    description: '',
    category: svc?.category ?? 'consultation',
    quantity: 1,
    unit: 'Nos',
    unitPrice: svc?.rate ?? 0,
    priceWithTax: false,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: svc?.tax_percentage ?? 0,
    taxAmount: 0,
    amount: svc?.rate ?? 0,
  };
  return calcLineItem(base);
}

export default function CreateBillPage() {
  const navigate = useNavigate();
  const hospitalId = useHospitalId();
  const userId = useAppSelector(s => s.auth.user?.id ?? '');
  const { toast } = useToast();

  // Patient
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Invoice
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [stateOfSupply, setStateOfSupply] = useState('');
  const [billingMode, setBillingMode] = useState<BillingMode>('cash');

  // Items
  const [lineItems, setLineItems] = useState<LineItem[]>([createLineItem()]);
  const [roundOff, setRoundOff] = useState(true);

  // Payment
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [notes, setNotes] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // UI
  const [showServices, setShowServices] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const debouncedSearch = useDebounce(patientSearch, 300);

  // Generate invoice number on mount
  useEffect(() => {
    billingService.generateBillNumber().then(setInvoiceNumber);
  }, []);

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

  const addBlankRow = () => setLineItems(prev => [...prev, createLineItem()]);

  const removeItem = (uid: string) => {
    setLineItems(prev => prev.length <= 1 ? prev : prev.filter(i => i.uid !== uid));
  };

  const updateItem = (uid: string, field: keyof LineItem, value: string | number | boolean) => {
    setLineItems(prev => prev.map(item => {
      if (item.uid !== uid) return item;
      const updated = { ...item, [field]: value };
      return calcLineItem(updated);
    }));
  };

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const totalDiscount = lineItems.reduce((s, i) => s + i.discountAmount, 0);
    const totalTax = lineItems.reduce((s, i) => s + i.taxAmount, 0);
    const total = lineItems.reduce((s, i) => s + i.amount, 0);
    const roundOffAmt = roundOff ? Math.round(total) - total : 0;
    const grandTotal = total + roundOffAmt;
    const cashReceivedNum = parseFloat(cashReceived) || 0;
    const change = paymentMode === 'cash' ? Math.max(0, cashReceivedNum - grandTotal) : 0;
    return { subtotal, totalDiscount, totalTax, total, roundOffAmt, grandTotal, change };
  }, [lineItems, roundOff, cashReceived, paymentMode]);

  const handleSubmit = async () => {
    if (!selectedPatient) { toast('Select Patient', { description: 'Please search and select a patient', type: 'error' }); return; }
    const validItems = lineItems.filter(i => i.name.trim() && i.unitPrice > 0);
    if (validItems.length === 0) { toast('No Items', { description: 'Add at least one billable item', type: 'error' }); return; }
    setSubmitting(true);
    try {
      const billItems = validItems.map(i => ({
        id: i.uid,
        itemType: 'other' as const,
        itemName: i.name, description: i.description, quantity: i.quantity,
        unitPrice: i.unitPrice, totalPrice: i.amount,
      }));
      await billingService.createBill(selectedPatient.id, null, null, billItems, {
        discountPercentage: 0, taxPercentage: 0,
        paymentMode, paymentReference: paymentRef, notes,
        isSplitPayment: false, splitEntries: [],
      }, { subtotal: totals.subtotal, discountAmount: totals.totalDiscount, taxAmount: totals.totalTax, totalAmount: totals.grandTotal }, userId);
      toast('Bill Generated', { description: `Invoice ${invoiceNumber} created successfully`, type: 'success' });
      navigate('/billing');
    } catch {
      toast('Error', { description: 'Could not generate bill', type: 'error' });
    } finally { setSubmitting(false); }
  };

  const inputCellClass = 'w-full h-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground';

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      {/* ─── Top Bar ─── */}
      <div className="flex-shrink-0 border-b border-border bg-card px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/billing')} className="h-8 w-8 shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>

        {/* Patient Search */}
        <div className="relative flex-1 max-w-xs">
          {selectedPatient ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {selectedPatient.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{selectedPatient.full_name}</p>
                <p className="text-[10px] text-muted-foreground">{selectedPatient.uhid}</p>
              </div>
              <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={patientSearch} onChange={e => setPatientSearch(e.target.value)} placeholder="Search patient by name, UHID, phone..." className="pl-9 h-8 text-xs" />
              {(patients.length > 0 || searchLoading) && (
                <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {searchLoading ? (
                    <p className="text-xs text-muted-foreground text-center py-3">Searching...</p>
                  ) : patients.map(p => (
                    <button key={p.id} onClick={() => { setSelectedPatient(p); setPatients([]); setPatientSearch(''); }}
                      className="w-full text-left px-3 py-2 hover:bg-accent text-xs border-b border-border last:border-b-0">
                      <p className="font-medium text-foreground">{p.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.uhid} · {p.phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="h-6 border-l border-border" />

        {/* Invoice Number */}
        <div className="flex items-center gap-1.5">
          <Label className="text-[10px] text-muted-foreground uppercase font-semibold whitespace-nowrap">Invoice #</Label>
          <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="h-8 w-32 text-xs font-mono" />
        </div>

        {/* Invoice Date */}
        <div className="flex items-center gap-1.5">
          <Label className="text-[10px] text-muted-foreground uppercase font-semibold whitespace-nowrap">Date</Label>
          <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="h-8 w-36 text-xs" />
        </div>

        {/* State of Supply */}
        <div className="flex items-center gap-1.5">
          <Label className="text-[10px] text-muted-foreground uppercase font-semibold whitespace-nowrap">State</Label>
          <Input value={stateOfSupply} onChange={e => setStateOfSupply(e.target.value)} placeholder="e.g. Maharashtra" className="h-8 w-32 text-xs" />
        </div>

        <div className="h-6 border-l border-border" />

        {/* Cash / Credit Toggle */}
        <div className="flex items-center gap-2 bg-muted rounded-lg p-0.5">
          <button
            onClick={() => setBillingMode('cash')}
            className={cn('px-3 py-1 rounded-md text-xs font-semibold transition-all',
              billingMode === 'cash' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Cash
          </button>
          <button
            onClick={() => setBillingMode('credit')}
            className={cn('px-3 py-1 rounded-md text-xs font-semibold transition-all',
              billingMode === 'credit' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Credit
          </button>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto p-4 space-y-4">

          {/* Service Group Picker (Collapsible) */}
          <Collapsible open={showServices} onOpenChange={setShowServices}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-2.5 bg-card border border-border rounded-xl hover:bg-accent/30 transition-colors">
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  Add from Service Master
                </span>
                {showServices ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 border border-border rounded-xl p-4 bg-card">
                <ServiceGroupPicker hospitalId={hospitalId} filterType={null} onSelect={addServiceItem} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* ─── Invoice Table ─── */}
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="py-2.5 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center w-10">#</th>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-left min-w-[180px]">Item</th>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-left min-w-[140px]">Description</th>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center w-16">Qty</th>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center w-20">Unit</th>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right w-28">
                      <span>Price/Unit</span>
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center w-20">Disc %</th>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right w-24">Disc Amt</th>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center w-16">Tax %</th>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right w-24">Tax Amt</th>
                    <th className="py-2.5 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right w-28">Amount</th>
                    <th className="py-2.5 px-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={item.uid} className="border-b border-border last:border-b-0 hover:bg-accent/20 transition-colors group">
                      <td className="py-1.5 px-3 text-center text-xs text-muted-foreground font-medium">{idx + 1}</td>
                      <td className="py-1.5 px-3">
                        <input value={item.name} onChange={e => updateItem(item.uid, 'name', e.target.value)}
                          placeholder="Item name" className={inputCellClass} />
                      </td>
                      <td className="py-1.5 px-3">
                        <input value={item.description} onChange={e => updateItem(item.uid, 'description', e.target.value)}
                          placeholder="Description" className={cn(inputCellClass, 'text-muted-foreground')} />
                      </td>
                      <td className="py-1.5 px-3">
                        <input type="number" min={1} value={item.quantity}
                          onChange={e => updateItem(item.uid, 'quantity', parseInt(e.target.value) || 1)}
                          className={cn(inputCellClass, 'text-center font-mono')} />
                      </td>
                      <td className="py-1.5 px-3">
                        <select value={item.unit} onChange={e => updateItem(item.uid, 'unit', e.target.value)}
                          className="w-full h-full bg-transparent outline-none text-xs text-foreground cursor-pointer">
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="py-1.5 px-3">
                        <input type="number" min={0} value={item.unitPrice}
                          onChange={e => updateItem(item.uid, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className={cn(inputCellClass, 'text-right font-mono')} />
                      </td>
                      <td className="py-1.5 px-3">
                        <input type="number" min={0} max={100} value={item.discountPercent}
                          onChange={e => updateItem(item.uid, 'discountPercent', parseFloat(e.target.value) || 0)}
                          className={cn(inputCellClass, 'text-center font-mono')} />
                      </td>
                      <td className="py-1.5 px-3 text-right text-xs font-mono text-muted-foreground">
                        {item.discountAmount > 0 ? formatCurrency(item.discountAmount) : '—'}
                      </td>
                      <td className="py-1.5 px-3">
                        <input type="number" min={0} max={100} value={item.taxPercent}
                          onChange={e => updateItem(item.uid, 'taxPercent', parseFloat(e.target.value) || 0)}
                          className={cn(inputCellClass, 'text-center font-mono')} />
                      </td>
                      <td className="py-1.5 px-3 text-right text-xs font-mono text-muted-foreground">
                        {item.taxAmount > 0 ? formatCurrency(item.taxAmount) : '—'}
                      </td>
                      <td className="py-1.5 px-3 text-right text-sm font-semibold font-mono text-foreground">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-1.5 px-3">
                        <button onClick={() => removeItem(item.uid)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all disabled:opacity-0"
                          disabled={lineItems.length <= 1}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* TOTAL row */}
                <tfoot>
                  <tr className="bg-muted/40 border-t-2 border-border">
                    <td colSpan={3} className="py-2.5 px-3">
                      <button onClick={addBlankRow} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> ADD ROW
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center text-xs font-semibold text-foreground font-mono">
                      {lineItems.reduce((s, i) => s + i.quantity, 0)}
                    </td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3 text-right text-xs font-semibold font-mono text-destructive">
                      {totals.totalDiscount > 0 ? `-${formatCurrency(totals.totalDiscount)}` : ''}
                    </td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3 text-right text-xs font-semibold font-mono text-foreground">
                      {totals.totalTax > 0 ? formatCurrency(totals.totalTax) : ''}
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm font-bold font-mono text-foreground">
                      {formatCurrency(totals.total)}
                    </td>
                    <td className="py-2.5 px-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ─── Bottom Section ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Notes + Payment */}
            <div className="space-y-4">
              {/* Notes */}
              <div className="border border-border rounded-xl p-4 bg-card">
                <Label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-2 block">Description / Notes</Label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Add any notes or terms for this invoice..."
                  rows={3} className="w-full rounded-lg border border-border bg-background text-sm px-3 py-2 outline-none focus:border-ring resize-none text-foreground" />
              </div>

              {/* Payment (Collapsible) */}
              <Collapsible open={showPayment} onOpenChange={setShowPayment}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between px-4 py-2.5 bg-card border border-border rounded-xl hover:bg-accent/30 transition-colors">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-primary" />
                      Payment Details
                    </span>
                    {showPayment ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 border border-border rounded-xl p-4 bg-card space-y-4">
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

                    {(paymentMode !== 'cash' && paymentMode !== 'insurance') && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Transaction Reference</Label>
                        <Input value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="Txn ID / Ref" className="h-8" />
                      </div>
                    )}

                    {paymentMode === 'cash' && totals.grandTotal > 0 && (
                      <div className="p-3 bg-accent/50 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Calculator className="w-4 h-4" /> Cash Calculator
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
                            <span className="text-sm font-medium text-foreground">Change</span>
                            <span className="text-lg font-bold font-mono text-foreground">{formatCurrency(totals.change)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Right: Summary + Actions */}
            <div className="space-y-4">
              <div className="border border-border rounded-xl p-4 bg-card space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sub Total</span>
                    <span className="font-mono text-foreground">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.totalDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-mono text-destructive">-{formatCurrency(totals.totalDiscount)}</span>
                    </div>
                  )}
                  {totals.totalTax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (GST)</span>
                      <span className="font-mono text-foreground">+{formatCurrency(totals.totalTax)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 py-1">
                    <Checkbox
                      checked={roundOff}
                      onCheckedChange={(v) => setRoundOff(!!v)}
                      id="roundoff"
                    />
                    <label htmlFor="roundoff" className="text-xs text-muted-foreground cursor-pointer">Round Off</label>
                    {roundOff && totals.roundOffAmt !== 0 && (
                      <span className="ml-auto text-xs font-mono text-muted-foreground">
                        {totals.roundOffAmt > 0 ? '+' : ''}{totals.roundOffAmt.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="border-t-2 border-border pt-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg text-foreground">Total</span>
                      <span className="text-2xl font-bold font-mono text-primary">
                        {formatCurrency(totals.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2 flex-1" disabled={submitting}>
                  <Share2 className="w-4 h-4" /> Share
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedPatient || lineItems.every(i => !i.name.trim()) || submitting}
                  className="gap-2 flex-[2]"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
