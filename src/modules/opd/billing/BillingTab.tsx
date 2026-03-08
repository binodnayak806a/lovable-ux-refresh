import { useState, useCallback, useMemo } from 'react';
import {
  Plus, Receipt, Banknote, CreditCard, Smartphone,
  Globe, Shield, Printer, Save, Loader2, CheckCircle2, Percent,
  Building2,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Switch } from '../../../components/ui/switch';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import { billingService } from '../../../services/billing.service';
import BillItemRow from './BillItemRow';
import ReceiptPrintPreview from './ReceiptPrintPreview';
import SplitPaymentPanel from './SplitPaymentPanel';
import type { BillItem, BillFormData, BillRecord, PaymentMode } from './types';
import { createEmptyBillItem, createEmptySplitEntry, EMPTY_BILL_FORM, PAYMENT_MODES, COMMON_SERVICES } from './types';

interface PatientInfo {
  id: string;
  uhid: string;
  full_name: string;
  gender: string;
  date_of_birth: string | null;
}

interface Props {
  patient: PatientInfo | null;
  consultationId: string | null;
  prescriptionId?: string | null;
}

const PaymentModeIcon = ({ mode }: { mode: PaymentMode }) => {
  switch (mode) {
    case 'cash': return <Banknote className="w-4 h-4" />;
    case 'card': return <CreditCard className="w-4 h-4" />;
    case 'upi': return <Smartphone className="w-4 h-4" />;
    case 'online': return <Globe className="w-4 h-4" />;
    case 'rtgs': return <Building2 className="w-4 h-4" />;
    case 'insurance': return <Shield className="w-4 h-4" />;
    default: return null;
  }
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function BillingTab({ patient, consultationId, prescriptionId }: Props) {
  const { user } = useAppSelector((s) => s.auth);
  const { toast } = useToast();

  const [items, setItems] = useState<BillItem[]>([
    {
      ...createEmptyBillItem('consultation'),
      itemName: 'Doctor Consultation',
      unitPrice: 500,
      totalPrice: 500,
    },
  ]);
  const [form, setForm] = useState<BillFormData>(EMPTY_BILL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [savedBill, setSavedBill] = useState<BillRecord | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const addItem = () => {
    setItems([...items, createEmptyBillItem()]);
    setSavedBill(null);
  };

  const addCommonService = (service: { name: string; type: 'consultation' | 'procedure' | 'medication' | 'lab' | 'room' | 'other'; price: number }) => {
    setItems([
      ...items,
      {
        ...createEmptyBillItem(service.type),
        itemName: service.name,
        unitPrice: service.price,
        totalPrice: service.price,
      },
    ]);
    setSavedBill(null);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter((i) => i.id !== id));
    setSavedBill(null);
  };

  const updateItem = useCallback(
    (id: string, field: keyof BillItem, value: string | number) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
      setSavedBill(null);
    },
    []
  );

  const handleFormChange = (field: keyof BillFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSavedBill(null);
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = (subtotal * form.discountPercentage) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * form.taxPercentage) / 100;
    const totalAmount = taxableAmount + taxAmount;
    return { subtotal, discountAmount, taxableAmount, taxAmount, totalAmount };
  }, [items, form.discountPercentage, form.taxPercentage]);

  const handleGenerateBill = async () => {
    if (!patient) {
      toast('No Patient', { description: 'Please select a patient first.', type: 'error' });
      return;
    }

    const validItems = items.filter((i) => i.itemName.trim() && i.totalPrice > 0);
    if (validItems.length === 0) {
      toast('No Items', { description: 'Add at least one billable item.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const bill = await billingService.createBill(
        patient.id,
        consultationId,
        prescriptionId || null,
        validItems,
        form,
        totals,
        user?.id ?? ''
      );
      setSavedBill(bill);
      toast('Bill Generated', {
        description: `Invoice ${bill.bill_number} created successfully`,
        type: 'success',
      });
    } catch (err: unknown) {
      toast('Bill Failed', {
        description: err instanceof Error ? err.message : 'Could not generate bill.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateAndPrint = async () => {
    await handleGenerateBill();
    setShowReceipt(true);
  };

  if (showReceipt && savedBill && patient) {
    return (
      <ReceiptPrintPreview
        bill={savedBill}
        patient={patient}
        items={items.filter((i) => i.itemName.trim() && i.totalPrice > 0)}
        totals={totals}
        onClose={() => setShowReceipt(false)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-blue-500" />
          Billing
        </h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateAndPrint}
            disabled={submitting || !patient || items.every((i) => !i.itemName.trim())}
            className="gap-1.5 h-8"
          >
            <Printer className="w-3.5 h-3.5" />
            Generate & Print
          </Button>
          <Button
            size="sm"
            onClick={handleGenerateBill}
            disabled={submitting || !patient || items.every((i) => !i.itemName.trim())}
            className={`gap-1.5 h-8 min-w-[140px] ${
              savedBill ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {submitting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
            ) : savedBill ? (
              <><CheckCircle2 className="w-3.5 h-3.5" /> Bill Created</>
            ) : (
              <><Save className="w-3.5 h-3.5" /> Generate Bill</>
            )}
          </Button>
        </div>
      </div>

      <Card className="border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-2.5 px-3 text-xs font-semibold text-gray-500 text-center w-10">#</th>
                <th className="py-2.5 px-3 text-xs font-semibold text-gray-500 text-left">Item</th>
                <th className="py-2.5 px-3 text-xs font-semibold text-gray-500 text-left w-28">Type</th>
                <th className="py-2.5 px-3 text-xs font-semibold text-gray-500 text-center w-20">Qty</th>
                <th className="py-2.5 px-3 text-xs font-semibold text-gray-500 text-right w-28">Unit Price</th>
                <th className="py-2.5 px-3 text-xs font-semibold text-gray-500 text-right w-28">Total</th>
                <th className="py-2.5 px-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <BillItemRow
                  key={item.id}
                  item={item}
                  index={idx}
                  onChange={updateItem}
                  onRemove={removeItem}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-gray-100 bg-gray-50/50">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addItem}
              className="gap-1.5 h-8 border-dashed"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </Button>
            <div className="w-px bg-gray-200 mx-1" />
            {COMMON_SERVICES.slice(0, 5).map((svc) => (
              <button
                key={svc.name}
                type="button"
                onClick={() => addCommonService(svc)}
                className="text-xs px-2.5 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 transition-all"
              >
                + {svc.name}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payment Mode</h4>
            
            <div className="flex items-center gap-2 mb-3">
              <Switch
                checked={form.isSplitPayment}
                onCheckedChange={(v) => {
                  handleFormChange('isSplitPayment', v);
                  if (v && form.splitEntries.length === 0) {
                    setForm(prev => ({
                      ...prev,
                      isSplitPayment: true,
                      splitEntries: [
                        createEmptySplitEntry('cash'),
                        createEmptySplitEntry('upi'),
                      ],
                    }));
                  }
                }}
              />
              <span className="text-xs text-gray-600 font-medium">Split Payment</span>
            </div>

            {form.isSplitPayment ? (
              <SplitPaymentPanel
                entries={form.splitEntries}
                totalAmount={totals.totalAmount}
                onChange={(entries) => setForm(prev => ({ ...prev, splitEntries: entries }))}
              />
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PAYMENT_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => handleFormChange('paymentMode', mode.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                        form.paymentMode === mode.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <PaymentModeIcon mode={mode.value} />
                      <span className="text-xs font-medium">{mode.label}</span>
                    </button>
                  ))}
                </div>

                {(form.paymentMode === 'card' || form.paymentMode === 'upi' || form.paymentMode === 'online' || form.paymentMode === 'rtgs') && (
                  <div className="mt-3">
                    <label className="text-xs text-gray-500 mb-1 block">Reference / Transaction ID</label>
                    <input
                      type="text"
                      value={form.paymentReference}
                      onChange={(e) => handleFormChange('paymentReference', e.target.value)}
                      placeholder="Enter transaction reference"
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Additional notes for this bill…"
                rows={2}
                className="w-full rounded-lg border border-gray-200 text-sm px-3 py-2 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Bill Summary</h4>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <Percent className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">Discount</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPercentage}
                    onChange={(e) => handleFormChange('discountPercentage', parseFloat(e.target.value) || 0)}
                    className="w-14 h-6 px-1.5 rounded border border-gray-200 text-xs text-center outline-none focus:border-blue-400"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
                <span className="font-mono text-red-600">-{formatCurrency(totals.discountAmount)}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">GST</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.taxPercentage}
                    onChange={(e) => handleFormChange('taxPercentage', parseFloat(e.target.value) || 0)}
                    className="w-14 h-6 px-1.5 rounded border border-gray-200 text-xs text-center outline-none focus:border-blue-400"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
                <span className="font-mono">+{formatCurrency(totals.taxAmount)}</span>
              </div>

              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800">Total Amount</span>
                  <span className="font-bold text-lg text-blue-600 font-mono">
                    {formatCurrency(totals.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {savedBill && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-center justify-between">
          <span>
            Invoice <span className="font-mono font-semibold">{savedBill.bill_number}</span> generated successfully.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowReceipt(true)}
            className="gap-1.5 h-7 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Receipt
          </Button>
        </div>
      )}
    </div>
  );
}
