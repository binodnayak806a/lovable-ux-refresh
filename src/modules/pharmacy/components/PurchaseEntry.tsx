import { useState, useMemo } from 'react';
import {
  Search, Plus, Trash2, Loader2, Package, Save,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import { mockMasterStore } from '../../../lib/mockMasterStore';

interface PurchaseItem {
  id: string;
  medicine_name: string;
  medication_id: string;
  batch: string;
  expiry: string;
  quantity: number;
  purchase_rate: number;
  mrp: number;
  gst_rate: number;
  amount: number;
}

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export default function PurchaseEntry() {
  const { user, hospitalId: rawHospitalId } = useAppSelector((s) => s.auth);
  const hospitalId = rawHospitalId ?? SAMPLE_HOSPITAL_ID;
  const { toast } = useToast();

  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [medSearch, setMedSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const medOptions = useMemo(() => {
    if (medSearch.length < 2) return [];
    const q = medSearch.toLowerCase();
    return mockMasterStore.getAll<Record<string, unknown>>('medications', hospitalId)
      .filter(m => m.is_active !== false && (
        ((m.generic_name as string) || '').toLowerCase().includes(q) ||
        ((m.brand_name as string) || '').toLowerCase().includes(q)
      ))
      .slice(0, 10)
      .map(m => ({
        id: m.id as string,
        medication_name: `${m.generic_name || ''} ${m.brand_name ? `(${m.brand_name})` : ''} ${m.strength || ''}`.trim(),
        medication_id: m.id as string,
      }));
  }, [medSearch, hospitalId]);

  const addMedicine = (med: { id: string; medication_name: string; medication_id: string }) => {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      medicine_name: med.medication_name,
      medication_id: med.medication_id,
      batch: '',
      expiry: '',
      quantity: 0,
      purchase_rate: 0,
      mrp: 0,
      gst_rate: 0,
      amount: 0,
    }]);
    setMedSearch('');
  };

  const addBlankRow = () => {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      medicine_name: '',
      medication_id: '',
      batch: '',
      expiry: '',
      quantity: 0,
      purchase_rate: 0,
      mrp: 0,
      gst_rate: 0,
      amount: 0,
    }]);
  };

  const updateItem = (id: string, field: string, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      updated.amount = updated.quantity * updated.purchase_rate;
      return updated;
    }));
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const totalGst = items.reduce((s, i) => s + (i.amount * i.gst_rate / 100), 0);
  const grandTotal = subtotal + totalGst;

  const handleSubmit = async () => {
    if (!supplierName || !invoiceNumber) {
      toast('Missing Fields', { description: 'Supplier name and invoice number are required', type: 'error' });
      return;
    }
    if (items.length === 0 || items.some(i => !i.medicine_name || !i.batch || !i.expiry || i.quantity <= 0)) {
      toast('Incomplete Items', { description: 'Fill all item fields with valid values', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      // Record purchase
      mockMasterStore.insert('pharmacy_purchases', {
        hospital_id: hospitalId,
        supplier_name: supplierName,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        items: items.map(i => ({
          medicine_name: i.medicine_name,
          medication_id: i.medication_id,
          batch: i.batch,
          expiry: i.expiry,
          quantity: i.quantity,
          purchase_rate: i.purchase_rate,
          mrp: i.mrp,
          gst_rate: i.gst_rate,
          amount: i.amount,
        })),
        subtotal,
        gst_amount: totalGst,
        total: grandTotal,
        created_by: user?.id || null,
      });

      // Update inventory for each item
      for (const item of items) {
        const existing = mockMasterStore.getAll<Record<string, unknown>>('pharmacy_inventory', hospitalId)
          .find(i => i.medication_name === item.medicine_name && i.batch_number === item.batch);

        if (existing) {
          mockMasterStore.update('pharmacy_inventory', existing.id as string, {
            quantity_in_stock: (existing.quantity_in_stock as number) + item.quantity,
            purchase_price: item.purchase_rate,
            mrp: item.mrp,
            selling_price: item.mrp,
            gst_percent: item.gst_rate,
          });
        } else {
          mockMasterStore.insert('pharmacy_inventory', {
            hospital_id: hospitalId,
            medication_id: item.medication_id || null,
            medication_name: item.medicine_name,
            batch_number: item.batch,
            expiry_date: item.expiry,
            quantity_in_stock: item.quantity,
            reorder_level: 20,
            purchase_price: item.purchase_rate,
            mrp: item.mrp,
            selling_price: item.mrp,
            gst_percent: item.gst_rate,
            supplier_name: supplierName,
          });
        }
      }

      toast('Purchase Saved', { description: `Invoice ${invoiceNumber} recorded and stock updated`, type: 'success' });
      setSupplierName('');
      setInvoiceNumber('');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setItems([]);
    } catch (err) {
      toast('Error', { description: (err as Error).message || 'Failed to save purchase', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Purchase Details
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Supplier Name *</label>
              <input type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Enter supplier name" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Invoice Number *</label>
              <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Enter invoice number" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Invoice Date *</label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Medicine Items</h3>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={medSearch} onChange={(e) => setMedSearch(e.target.value)}
                  placeholder="Search medicine master..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
                {medOptions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {medOptions.map((m) => (
                      <button key={m.id} type="button" onClick={() => addMedicine(m)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-b-0">
                        {m.medication_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={addBlankRow} className="gap-1">
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Medicine Name</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-28">Batch</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-32">Expiry</th>
                  <th className="text-center px-3 py-2.5 font-medium text-gray-600 w-20">Qty</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600 w-24">Purchase Rate</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600 w-24">MRP</th>
                  <th className="text-center px-3 py-2.5 font-medium text-gray-600 w-20">GST %</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600 w-24">Amount</th>
                  <th className="px-3 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-400">Search or add medicines to create a purchase entry</td></tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50/50">
                      <td className="px-4 py-2">
                        {item.medicine_name ? (
                          <span className="font-medium text-gray-800">{item.medicine_name}</span>
                        ) : (
                          <input type="text" value={item.medicine_name} onChange={(e) => updateItem(item.id, 'medicine_name', e.target.value)}
                            placeholder="Medicine name" className="w-full h-7 px-2 rounded border border-gray-200 text-sm" />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={item.batch} onChange={(e) => updateItem(item.id, 'batch', e.target.value)}
                          placeholder="Batch" className="w-full h-7 px-2 rounded border border-gray-200 text-sm font-mono" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="date" value={item.expiry} onChange={(e) => updateItem(item.id, 'expiry', e.target.value)}
                          className="w-full h-7 px-2 rounded border border-gray-200 text-sm" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={item.quantity || ''} onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-16 h-7 text-center rounded border border-gray-200 text-sm" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} step="0.01" value={item.purchase_rate || ''} onChange={(e) => updateItem(item.id, 'purchase_rate', parseFloat(e.target.value) || 0)}
                          className="w-20 h-7 text-right rounded border border-gray-200 text-sm" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} step="0.01" value={item.mrp || ''} onChange={(e) => updateItem(item.id, 'mrp', parseFloat(e.target.value) || 0)}
                          className="w-20 h-7 text-right rounded border border-gray-200 text-sm" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} max={28} value={item.gst_rate || ''} onChange={(e) => updateItem(item.id, 'gst_rate', parseFloat(e.target.value) || 0)}
                          className="w-14 h-7 text-center rounded border border-gray-200 text-sm" />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">Rs. {item.amount.toFixed(2)}</td>
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
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex gap-8 text-sm">
                  <span className="text-gray-500">Subtotal: <span className="text-gray-800 font-medium">Rs. {subtotal.toFixed(2)}</span></span>
                  <span className="text-gray-500">GST: <span className="text-gray-800 font-medium">Rs. {totalGst.toFixed(2)}</span></span>
                  <span className="text-gray-800 font-semibold text-base">Grand Total: Rs. {grandTotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-400">{items.length} item(s)</p>
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <><Save className="w-4 h-4" />Save Purchase & Update Stock</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
