import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Trash2, Loader2, Printer, ShoppingCart,
  User, CreditCard, Banknote, Smartphone,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../../../components/ui/dialog';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import { supabase } from '../../../lib/supabase';
import { useSearchParams } from 'react-router-dom';

interface SaleItem {
  id: string;
  medicine_name: string;
  medication_id: string;
  inventory_id: string;
  batch: string;
  expiry: string;
  qty: number;
  available_qty: number;
  mrp: number;
  discount_pct: number;
  gst_rate: number;
  amount: number;
}

interface StockOption {
  id: string;
  medication_id: string;
  medication_name: string;
  batch_number: string;
  expiry_date: string;
  quantity_in_stock: number;
  mrp: number;
  selling_price: number;
  gst_percent: number;
  generic_name?: string;
  brand_name?: string;
  strength?: string;
}

interface PatientOption {
  id: string;
  full_name: string;
  uhid: string;
  phone: string;
}

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export default function SaleBilling() {
  const { user, hospitalId: rawHospitalId } = useAppSelector((s) => s.auth);
  const hospitalId = rawHospitalId ?? SAMPLE_HOSPITAL_ID;
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const consultationId = searchParams.get('consultation_id');
  const printRef = useRef<HTMLDivElement>(null);

  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');

  const [medSearch, setMedSearch] = useState('');
  const [stockOptions, setStockOptions] = useState<StockOption[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState<{ sale_number: string; total: number } | null>(null);

  useEffect(() => {
    if (consultationId) {
      loadPrescriptionItems();
    }
  }, [consultationId]);

  const loadPrescriptionItems = async () => {
    if (!consultationId) return;
    const { data: prescription } = await supabase
      .from('prescriptions')
      .select('id, patient_id, items:prescription_items(medication_name, dosage, quantity)')
      .eq('consultation_id', consultationId)
      .maybeSingle();

    if (!prescription) return;

    const rx = prescription as {
      id: string;
      patient_id: string;
      items: Array<{ medication_name: string; dosage: string; quantity: number }>;
    };

    if (rx.patient_id) {
      const { data: patient } = await supabase
        .from('patients')
        .select('id, full_name, uhid, phone')
        .eq('id', rx.patient_id)
        .maybeSingle();
      if (patient) {
        setSelectedPatient(patient as PatientOption);
        setPatientSearch(`${(patient as PatientOption).full_name} (${(patient as PatientOption).uhid})`);
      }
    }

    if (rx.items?.length) {
      for (const rxItem of rx.items) {
        const { data: stock } = await supabase
          .from('pharmacy_inventory')
          .select('id, medication_id, medication_name, batch_number, expiry_date, quantity_in_stock, mrp, selling_price, gst_percent')
          .eq('hospital_id', hospitalId)
          .ilike('medication_name', `%${rxItem.medication_name}%`)
          .gt('quantity_in_stock', 0)
          .order('expiry_date', { ascending: true })
          .limit(1);

        if (stock && stock.length > 0) {
          const s = stock[0] as StockOption;
          const qty = rxItem.quantity || 1;
          const mrp = Number(s.mrp) || Number(s.selling_price);
          const gst = Number(s.gst_percent) || 0;
          const amount = qty * mrp;
          setItems(prev => [...prev, {
            id: crypto.randomUUID(),
            medicine_name: s.medication_name,
            medication_id: s.medication_id || '',
            inventory_id: s.id,
            batch: s.batch_number,
            expiry: s.expiry_date,
            qty,
            available_qty: s.quantity_in_stock,
            mrp,
            discount_pct: 0,
            gst_rate: gst,
            amount,
          }]);
        }
      }
    }
  };

  const searchPatients = async (query: string) => {
    if (query.length < 2) { setPatients([]); return; }
    const { data } = await supabase
      .from('patients')
      .select('id, full_name, uhid, phone')
      .or(`full_name.ilike.%${query}%,uhid.ilike.%${query}%,phone.ilike.%${query}%`)
      .eq('hospital_id', hospitalId)
      .limit(8);
    setPatients((data ?? []) as PatientOption[]);
  };

  const searchMedicines = async (query: string) => {
    if (query.length < 2) { setStockOptions([]); return; }
    const { data } = await supabase
      .from('pharmacy_inventory')
      .select('id, medication_id, medication_name, batch_number, expiry_date, quantity_in_stock, mrp, selling_price, gst_percent')
      .eq('hospital_id', hospitalId)
      .gt('quantity_in_stock', 0)
      .ilike('medication_name', `%${query}%`)
      .order('expiry_date', { ascending: true })
      .limit(15);
    setStockOptions((data ?? []) as StockOption[]);
  };

  const addItem = (stock: StockOption) => {
    const existing = items.find(i => i.inventory_id === stock.id);
    if (existing) {
      toast('Already Added', { description: 'This batch is already in the list', type: 'warning' });
      return;
    }
    const mrp = Number(stock.mrp) || Number(stock.selling_price);
    const gst = Number(stock.gst_percent) || 0;
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      medicine_name: stock.medication_name,
      medication_id: stock.medication_id || '',
      inventory_id: stock.id,
      batch: stock.batch_number,
      expiry: stock.expiry_date,
      qty: 1,
      available_qty: stock.quantity_in_stock,
      mrp,
      discount_pct: 0,
      gst_rate: gst,
      amount: mrp,
    }]);
    setMedSearch('');
    setStockOptions([]);
  };

  const updateItem = (id: string, field: keyof SaleItem, value: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      const base = updated.qty * updated.mrp;
      const discounted = base - (base * updated.discount_pct / 100);
      updated.amount = discounted;
      return updated;
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const { subtotal, totalGst, grandTotal } = useMemo(() => {
    let sub = 0;
    let gst = 0;
    for (const item of items) {
      sub += item.amount;
      gst += item.amount * item.gst_rate / (100 + item.gst_rate);
    }
    return { subtotal: sub, totalGst: gst, grandTotal: sub };
  }, [items]);

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast('No Items', { description: 'Add at least one medicine', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      const saleNum = `PS${Date.now().toString(36).toUpperCase()}`;
      const saleItems = items.map(i => ({
        medicine_name: i.medicine_name,
        medication_id: i.medication_id,
        inventory_id: i.inventory_id,
        batch: i.batch,
        expiry: i.expiry,
        qty: i.qty,
        mrp: i.mrp,
        discount_pct: i.discount_pct,
        gst_rate: i.gst_rate,
        amount: i.amount,
      }));

      const { error: saleError } = await supabase
        .from('pharmacy_sales')
        .insert({
          hospital_id: hospitalId,
          patient_id: selectedPatient?.id || null,
          consultation_id: consultationId || null,
          sale_number: saleNum,
          items: saleItems,
          subtotal: subtotal - totalGst,
          gst_amount: totalGst,
          total: grandTotal,
          payment_mode: paymentMode,
          patient_name: isWalkIn ? walkInName : selectedPatient?.full_name || null,
          patient_phone: isWalkIn ? walkInPhone : selectedPatient?.phone || null,
          created_by: user?.id || null,
        } as never);

      if (saleError) throw saleError;

      for (const item of items) {
        await supabase
          .from('pharmacy_inventory')
          .update({
            quantity_in_stock: item.available_qty - item.qty,
            last_updated: new Date().toISOString(),
          } as never)
          .eq('id', item.inventory_id);
      }

      setLastSale({ sale_number: saleNum, total: grandTotal });
      setShowInvoice(true);
      toast('Sale Complete', { description: `Invoice ${saleNum} created`, type: 'success' });
    } catch (err) {
      toast('Error', { description: (err as Error).message || 'Failed to process sale', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setItems([]);
    setSelectedPatient(null);
    setPatientSearch('');
    setIsWalkIn(false);
    setWalkInName('');
    setWalkInPhone('');
    setPaymentMode('cash');
    setShowInvoice(false);
    setLastSale(null);
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Invoice</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .text-right { text-align: right; }
        .header { text-align: center; margin-bottom: 15px; }
        .total-row { font-weight: bold; background: #f0f9ff; }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-4 h-4" />
              Patient Details
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setIsWalkIn(!isWalkIn); setSelectedPatient(null); setPatientSearch(''); }}
              className="text-xs"
            >
              {isWalkIn ? 'Search Patient' : 'Walk-in (No Patient)'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isWalkIn ? (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                placeholder="Customer name (optional)"
                className="h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
              />
              <input
                type="text"
                value={walkInPhone}
                onChange={(e) => setWalkInPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
              />
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => { setPatientSearch(e.target.value); searchPatients(e.target.value); }}
                placeholder="Search by UHID, name, or phone..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
              />
              {patients.length > 0 && !selectedPatient && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(p);
                        setPatientSearch(`${p.full_name} (${p.uhid})`);
                        setPatients([]);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-b-0"
                    >
                      <span className="font-medium">{p.full_name}</span>
                      <span className="text-gray-500 ml-2">{p.uhid}</span>
                      <span className="text-gray-400 ml-2">{p.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedPatient && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="bg-blue-50 text-blue-700">{selectedPatient.uhid}</Badge>
                  <span className="text-sm text-gray-600">{selectedPatient.full_name}</span>
                  <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="text-xs text-red-500 hover:underline ml-2">Clear</button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Sale Items
            </h3>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={medSearch}
                onChange={(e) => { setMedSearch(e.target.value); searchMedicines(e.target.value); }}
                placeholder="Search medicine..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
              />
              {stockOptions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {stockOptions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addItem(s)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-b-0"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{s.medication_name}</span>
                        <span className="text-emerald-600 font-medium">Rs. {Number(s.mrp || s.selling_price).toFixed(2)}</span>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                        <span>Batch: {s.batch_number}</span>
                        <span>Exp: {s.expiry_date}</span>
                        <span>Stock: {s.quantity_in_stock}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Medicine</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-24">Batch</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-24">Expiry</th>
                  <th className="text-center px-3 py-2.5 font-medium text-gray-600 w-16">Qty</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600 w-20">MRP</th>
                  <th className="text-center px-3 py-2.5 font-medium text-gray-600 w-20">Disc %</th>
                  <th className="text-center px-3 py-2.5 font-medium text-gray-600 w-20">GST %</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600 w-24">Amount</th>
                  <th className="px-3 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-400">
                      Search and add medicines to create a sale
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50/50">
                      <td className="px-4 py-2">
                        <span className="font-medium text-gray-800">{item.medicine_name}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-600 font-mono text-xs">{item.batch}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs">{item.expiry}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          max={item.available_qty}
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', Math.min(parseInt(e.target.value) || 1, item.available_qty))}
                          className="w-14 h-7 text-center rounded border border-gray-200 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-gray-800">{item.mrp.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.discount_pct}
                          onChange={(e) => updateItem(item.id, 'discount_pct', parseFloat(e.target.value) || 0)}
                          className="w-14 h-7 text-center rounded border border-gray-200 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600">{item.gst_rate}%</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">
                        Rs. {item.amount.toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm lg:col-span-1">
            <CardContent className="p-4 space-y-3">
              <h4 className="font-medium text-gray-700 text-sm">Payment Method</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'cash', label: 'Cash', icon: Banknote },
                  { value: 'card', label: 'Card', icon: CreditCard },
                  { value: 'upi', label: 'UPI', icon: Smartphone },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setPaymentMode(value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                      paymentMode === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal (excl. GST)</span>
                  <span className="text-gray-800">Rs. {(subtotal - totalGst).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST</span>
                  <span className="text-gray-800">Rs. {totalGst.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg">
                  <span className="font-semibold text-gray-800">Total</span>
                  <span className="font-bold text-blue-700">Rs. {grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 h-10 gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Complete Sale - Rs. {grandTotal.toFixed(2)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showInvoice} onOpenChange={(open) => { if (!open) resetForm(); setShowInvoice(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sale Invoice</DialogTitle>
          </DialogHeader>
          <div ref={printRef}>
            <div className="header">
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>PHARMACY INVOICE</h2>
              <p style={{ fontSize: '12px', color: '#666' }}>Invoice No: {lastSale?.sale_number}</p>
              <p style={{ fontSize: '12px', color: '#666' }}>Date: {new Date().toLocaleDateString('en-IN')}</p>
            </div>
            {(selectedPatient || walkInName) && (
              <div style={{ marginBottom: '10px', fontSize: '12px' }}>
                <strong>Patient:</strong> {selectedPatient?.full_name || walkInName}
                {selectedPatient?.uhid && <span> | UHID: {selectedPatient.uhid}</span>}
              </div>
            )}
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">MRP</th>
                  <th className="text-right">Disc%</th>
                  <th className="text-right">GST%</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td>{item.medicine_name}</td>
                    <td>{item.batch}</td>
                    <td className="text-right">{item.qty}</td>
                    <td className="text-right">{item.mrp.toFixed(2)}</td>
                    <td className="text-right">{item.discount_pct}%</td>
                    <td className="text-right">{item.gst_rate}%</td>
                    <td className="text-right">{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7} className="text-right"><strong>Subtotal:</strong></td>
                  <td className="text-right">Rs. {(subtotal - totalGst).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={7} className="text-right"><strong>GST:</strong></td>
                  <td className="text-right">Rs. {totalGst.toFixed(2)}</td>
                </tr>
                <tr className="total-row">
                  <td colSpan={7} className="text-right"><strong>Total:</strong></td>
                  <td className="text-right"><strong>Rs. {grandTotal.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
              Payment Mode: {paymentMode.toUpperCase()}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { resetForm(); }}>
              New Sale
            </Button>
            <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4" />
              Print Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
