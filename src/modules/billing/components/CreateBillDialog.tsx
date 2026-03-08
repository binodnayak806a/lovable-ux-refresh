import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X, Search, Plus, Trash2, IndianRupee, Calculator,
  Banknote, CreditCard, Smartphone, Globe, Shield,
  Loader2, Receipt,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { useDebounce } from '../../../hooks/useDebounce';
import { supabase } from '../../../lib/supabase';
import { billingService } from '../../../services/billing.service';
import { cn } from '../../../lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hospitalId: string;
  userId: string;
}

interface PatientResult {
  id: string;
  full_name: string;
  uhid: string;
  phone: string;
  gender: string | null;
}

interface ServiceItemOption {
  id: string;
  name: string;
  code: string;
  category: string;
  rate: number;
  tax_percent: number;
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
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function createLineItem(svc?: ServiceItemOption): LineItem {
  return {
    uid: crypto.randomUUID(),
    name: svc?.name ?? '',
    category: svc?.category ?? 'consultation',
    quantity: 1,
    unitPrice: svc?.rate ?? 0,
    taxPercent: svc?.tax_percent ?? 18,
  };
}

export default function CreateBillDialog({ open, onClose, onSuccess, hospitalId, userId }: Props) {
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [serviceItems, setServiceItems] = useState<ServiceItemOption[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([createLineItem()]);
  const [serviceSearch, setServiceSearch] = useState('');

  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [notes, setNotes] = useState('');
  const [cashReceived, setCashReceived] = useState('');

  const [billType, setBillType] = useState<'opd' | 'ipd' | 'pharmacy' | 'lab' | 'other'>('opd');
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(patientSearch, 300);

  useEffect(() => {
    if (!open) return;
    billingService.getServiceItems(hospitalId).then(data => {
      setServiceItems(data as ServiceItemOption[]);
    }).catch(() => {});
  }, [open, hospitalId]);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setPatients([]);
      return;
    }
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
      } catch {
        setPatients([]);
      } finally {
        setSearchLoading(false);
      }
    })();
  }, [debouncedSearch, hospitalId]);

  const filteredServices = useMemo(() => {
    if (!serviceSearch) return serviceItems.slice(0, 12);
    const q = serviceSearch.toLowerCase();
    return serviceItems.filter(s =>
      s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [serviceItems, serviceSearch]);

  const addServiceItem = useCallback((svc: ServiceItemOption) => {
    setLineItems(prev => [...prev, createLineItem(svc)]);
    setServiceSearch('');
  }, []);

  const addBlankItem = () => setLineItems(prev => [...prev, createLineItem()]);

  const removeItem = (uid: string) => {
    setLineItems(prev => prev.length <= 1 ? prev : prev.filter(i => i.uid !== uid));
  };

  const updateItem = (uid: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item =>
      item.uid === uid ? { ...item, [field]: value } : item
    ));
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
        itemName: i.name,
        description: '',
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.quantity * i.unitPrice,
      }));

      await billingService.createBill(
        selectedPatient.id,
        null,
        null,
        billItems,
        {
          discountPercentage: discountPercent,
          taxPercentage: totals.totalTax > 0 ? Math.round((totals.totalTax / totals.taxable) * 100 * 100) / 100 : 0,
          paymentMode,
          paymentReference: paymentRef,
          notes,
          isSplitPayment: false,
          splitEntries: [],
        },
        {
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmt,
          taxAmount: totals.totalTax,
          totalAmount: totals.grandTotal,
        },
        userId
      );
      onSuccess();
      handleClose();
    } catch {
      //
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setLineItems([createLineItem()]);
    setDiscountPercent(0);
    setPaymentMode('cash');
    setPaymentRef('');
    setNotes('');
    setCashReceived('');
    setBillType('opd');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mb-8">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              Create New Bill
            </h2>
            <p className="text-sm text-gray-500">Add items, apply GST, and generate invoice</p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Patient *</Label>
              {selectedPatient ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                    {selectedPatient.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{selectedPatient.full_name}</p>
                    <p className="text-xs text-gray-500">{selectedPatient.uhid} | {selectedPatient.phone}</p>
                  </div>
                  <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input value={patientSearch} onChange={e => setPatientSearch(e.target.value)} placeholder="Search patient..." className="pl-10" />
                  {(patients.length > 0 || searchLoading) && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {searchLoading ? (
                        <p className="text-sm text-gray-500 text-center py-3">Searching...</p>
                      ) : patients.map(p => (
                        <button key={p.id} onClick={() => { setSelectedPatient(p); setPatients([]); setPatientSearch(''); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-b-0">
                          <p className="font-medium text-gray-900">{p.full_name}</p>
                          <p className="text-xs text-gray-500">{p.uhid} | {p.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Bill Type</Label>
              <div className="flex flex-wrap gap-2">
                {(['opd', 'ipd', 'pharmacy', 'lab', 'other'] as const).map(t => (
                  <button key={t} onClick={() => setBillType(t)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all uppercase',
                      billType === t ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    )}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-gray-700">Line Items</Label>
              <div className="relative">
                <Input value={serviceSearch} onChange={e => setServiceSearch(e.target.value)}
                  placeholder="Quick add service..." className="h-8 text-xs w-56 pr-3" />
                {serviceSearch && filteredServices.length > 0 && (
                  <div className="absolute z-10 mt-1 right-0 w-72 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredServices.map(svc => (
                      <button key={svc.id} onClick={() => addServiceItem(svc)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-b-0">
                        <div>
                          <p className="text-xs font-medium text-gray-900">{svc.name}</p>
                          <p className="text-[10px] text-gray-500">{svc.code} | {svc.category}</p>
                        </div>
                        <span className="text-xs font-mono text-gray-700">{formatCurrency(svc.rate)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-2 px-3 text-xs font-semibold text-gray-500 text-left">Item</th>
                    <th className="py-2 px-3 text-xs font-semibold text-gray-500 text-center w-16">Qty</th>
                    <th className="py-2 px-3 text-xs font-semibold text-gray-500 text-right w-24">Rate</th>
                    <th className="py-2 px-3 text-xs font-semibold text-gray-500 text-center w-20">GST %</th>
                    <th className="py-2 px-3 text-xs font-semibold text-gray-500 text-right w-24">Total</th>
                    <th className="py-2 px-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map(item => (
                    <tr key={item.uid} className="border-b border-gray-100 last:border-b-0">
                      <td className="py-1.5 px-3">
                        <input value={item.name} onChange={e => updateItem(item.uid, 'name', e.target.value)}
                          placeholder="Item name" className="w-full text-sm outline-none bg-transparent" />
                      </td>
                      <td className="py-1.5 px-3">
                        <input type="number" min={1} value={item.quantity}
                          onChange={e => updateItem(item.uid, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full text-sm text-center outline-none bg-transparent" />
                      </td>
                      <td className="py-1.5 px-3">
                        <input type="number" min={0} value={item.unitPrice}
                          onChange={e => updateItem(item.uid, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full text-sm text-right outline-none bg-transparent font-mono" />
                      </td>
                      <td className="py-1.5 px-3">
                        <input type="number" min={0} max={100} value={item.taxPercent}
                          onChange={e => updateItem(item.uid, 'taxPercent', parseFloat(e.target.value) || 0)}
                          className="w-full text-sm text-center outline-none bg-transparent" />
                      </td>
                      <td className="py-1.5 px-3 text-right text-sm font-mono font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                      <td className="py-1.5 px-3">
                        <button onClick={() => removeItem(item.uid)}
                          className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-30"
                          disabled={lineItems.length <= 1}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                <Button variant="ghost" size="sm" onClick={addBlankItem} className="gap-1.5 h-7 text-xs text-gray-500">
                  <Plus className="w-3 h-3" /> Add line
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
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

              {paymentMode === 'cash' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                    <Calculator className="w-4 h-4" />
                    Cash Change Calculator
                  </div>
                  <div>
                    <Label className="text-xs text-emerald-700 mb-1 block">Cash Received</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                      <Input value={cashReceived}
                        onChange={e => setCashReceived(e.target.value)}
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
                  {(parseFloat(cashReceived) || 0) >= totals.grandTotal && totals.grandTotal > 0 && (
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-emerald-200">
                      <span className="text-sm text-emerald-700 font-medium">Change to Return</span>
                      <span className="text-lg font-bold font-mono text-emerald-700">
                        {formatCurrency(totals.change)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Notes (optional)</Label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..."
                  rows={2} className="w-full rounded-lg border border-gray-200 text-sm px-3 py-2 outline-none focus:border-blue-400 resize-none" />
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3 h-fit">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Bill Summary</h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Discount</span>
                    <input type="number" min={0} max={100} value={discountPercent}
                      onChange={e => setDiscountPercent(parseFloat(e.target.value) || 0)}
                      className="w-12 h-5 px-1 rounded border border-gray-300 text-xs text-center outline-none" />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                  <span className="font-mono text-red-600">-{formatCurrency(totals.discountAmt)}</span>
                </div>

                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Taxable Amount</span>
                    <span className="font-mono">{formatCurrency(totals.taxable)}</span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">CGST</span>
                  <span className="font-mono text-gray-700">+{formatCurrency(totals.cgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SGST</span>
                  <span className="font-mono text-gray-700">+{formatCurrency(totals.sgst)}</span>
                </div>

                <div className="border-t-2 border-gray-300 pt-3 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Grand Total</span>
                    <span className="text-xl font-bold font-mono text-blue-600">
                      {formatCurrency(totals.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {totals.totalTax > 0 && (
                <Badge variant="outline" className="text-xs text-gray-500 border-gray-300 mt-2">
                  GST: {formatCurrency(totals.totalTax)} (CGST {formatCurrency(totals.cgst)} + SGST {formatCurrency(totals.sgst)})
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between rounded-b-2xl">
          <p className="text-sm text-gray-500">
            {lineItems.filter(i => i.name.trim()).length} item(s) | {formatCurrency(totals.grandTotal)}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleClose} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit}
              disabled={!selectedPatient || lineItems.every(i => !i.name.trim()) || submitting}
              className="bg-blue-600 hover:bg-blue-700 gap-1.5">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Generate Bill'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
