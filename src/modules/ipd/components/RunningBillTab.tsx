import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Loader2, Printer, Trash2, Search, CreditCard,
  BedDouble, Pill, Stethoscope, FlaskConical,
  UserRound, HeartPulse, Package, Receipt, IndianRupee,
} from 'lucide-react';
import ServiceGroupPicker from '../../../components/billing/ServiceGroupPicker';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { useReactToPrint } from 'react-to-print';
import { useAppSelector } from '../../../store';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { useToast } from '../../../hooks/useToast';
import { useDebounce } from '../../../hooks/useDebounce';
import ipdService from '../../../services/ipd.service';
import type {
  Admission,
  IpdBillItem,
  BillItemType,
  ServiceMaster,
  PackageMaster,
  GstMaster,
  IpdPayment,
  EnhancedBillSummary,
} from '../types';
import { BILL_ITEM_TYPE_CONFIG, PAYMENT_MODES } from '../types';
import { format, parseISO } from 'date-fns';

interface Props {
  admission: Admission;
  onUpdate?: () => void;
}

const ITEM_TYPE_ICONS: Record<BillItemType, React.ElementType> = {
  bed_charges: BedDouble,
  medication: Pill,
  procedure: Stethoscope,
  investigation: FlaskConical,
  consultation: UserRound,
  nursing: HeartPulse,
  misc: Package,
};

export default function RunningBillTab({ admission, onUpdate }: Props) {
  const { user } = useAppSelector((s) => s.auth);
  const hospitalId = useHospitalId();
  const { toast } = useToast();

  const [items, setItems] = useState<IpdBillItem[]>([]);
  const [payments, setPayments] = useState<IpdPayment[]>([]);
  const [gstRates, setGstRates] = useState<GstMaster[]>([]);
  const [packages, setPackages] = useState<PackageMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [useIGST, setUseIGST] = useState(false);

  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [serviceSearch, setServiceSearch] = useState('');
  const debouncedSearch = useDebounce(serviceSearch, 300);
  const [serviceResults, setServiceResults] = useState<ServiceMaster[]>([]);
  const [searchingServices, setSearchingServices] = useState(false);

  const [newItem, setNewItem] = useState({
    item_type: 'misc' as BillItemType,
    item_name: '',
    item_description: '',
    quantity: 1,
    unit_price: 0,
    gst_rate: 0,
    hsn_code: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_mode: 'Cash',
    notes: '',
  });

  const receiptRef = useRef<HTMLDivElement>(null);

  const billPrintRef = useRef<HTMLDivElement>(null);
  const handlePrintBill = useReactToPrint({ content: () => billPrintRef.current });

  const loadData = async () => {
    try {
      const [itemsData, paymentsData, gstData, pkgData] = await Promise.all([
        ipdService.getIpdBillItems(admission.id),
        ipdService.getIpdPayments(admission.id),
        ipdService.getGstRates(hospitalId),
        ipdService.getPackagesMaster(hospitalId),
      ]);
      setItems(itemsData);
      setPayments(paymentsData);
      setGstRates(gstData);
      setPackages(pkgData);
    } catch {
      toast('Error', { description: 'Failed to load billing data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (admission.status === 'active' && user?.id) {
        try {
          const newCharge = await ipdService.generateDailyBedCharge(admission.id, user.id);
          if (newCharge) {
            toast('Daily Bed Charge Added', {
              description: `Today's bed charge of Rs. ${Number(newCharge.unit_price).toLocaleString('en-IN')} has been auto-billed.`,
              type: 'info',
            });
          }
        } catch { /* best effort */ }
      }
      await loadData();
    };
    init();
  }, [admission.id]);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setServiceResults([]);
      return;
    }
    const search = async () => {
      setSearchingServices(true);
      try {
        const results = await ipdService.searchServices(hospitalId, debouncedSearch);
        setServiceResults(results);
      } catch {
        setServiceResults([]);
      } finally {
        setSearchingServices(false);
      }
    };
    search();
  }, [debouncedSearch, hospitalId]);

  const handleAddItem = async () => {
    if (!newItem.item_name.trim()) {
      toast('Enter Item Name', { description: 'Please enter an item name', type: 'error' });
      return;
    }
    if (newItem.unit_price <= 0) {
      toast('Enter Price', { description: 'Please enter a valid price', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await ipdService.addBillItemWithGst(admission.id, {
        item_type: newItem.item_type,
        item_name: newItem.item_name,
        item_description: newItem.item_description,
        quantity: newItem.quantity,
        unit_price: newItem.unit_price,
        gst_rate: newItem.gst_rate,
        hsn_code: newItem.hsn_code,
      }, user?.id ?? '');
      toast('Item Added', { type: 'success' });
      setShowAddItem(false);
      resetNewItem();
      loadData();
      onUpdate?.();
    } catch {
      toast('Error', { description: 'Failed to add item', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddServiceItem = async (service: ServiceMaster) => {
    setSubmitting(true);
    try {
      await ipdService.addBillItemWithGst(admission.id, {
        service_id: service.id,
        item_type: mapCategory(service.category),
        item_name: service.service_name,
        category: service.category,
        quantity: 1,
        unit_price: service.price,
        gst_rate: service.gst_rate,
        hsn_code: service.hsn_code || undefined,
      }, user?.id ?? '');
      toast('Service Added', { type: 'success' });
      setShowAddService(false);
      setServiceSearch('');
      setServiceResults([]);
      loadData();
      onUpdate?.();
    } catch {
      toast('Error', { description: 'Failed to add service', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPackage = async (pkg: PackageMaster) => {
    setSubmitting(true);
    try {
      await ipdService.addPackageToAdmission(admission.id, pkg, user?.id ?? '');
      toast('Package Added', { description: `${pkg.package_name} items added to bill`, type: 'success' });
      setShowPackages(false);
      loadData();
      onUpdate?.();
    } catch {
      toast('Error', { description: 'Failed to add package', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeletingId(itemId);
    try {
      await ipdService.deleteBillItem(itemId);
      toast('Item Removed', { type: 'success' });
      loadData();
      onUpdate?.();
    } catch {
      toast('Error', { description: 'Failed to remove item', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleGenerateBedCharge = async () => {
    try {
      const result = await ipdService.generateDailyBedCharge(admission.id, user?.id ?? '');
      if (result) {
        toast('Bed Charge Added', { type: 'success' });
        loadData();
        onUpdate?.();
      } else {
        toast('Already Added', { description: "Today's bed charge already exists", type: 'info' });
      }
    } catch {
      toast('Error', { description: 'Failed to generate bed charge', type: 'error' });
    }
  };

  const handleAddPayment = async () => {
    if (paymentForm.amount <= 0) {
      toast('Enter Amount', { description: 'Please enter a valid amount', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await ipdService.addIpdPayment(
        admission.id,
        hospitalId,
        paymentForm.amount,
        paymentForm.payment_mode,
        paymentForm.notes,
        user?.id ?? ''
      );
      toast('Payment Recorded', { type: 'success' });
      setShowAddPayment(false);
      setPaymentForm({ amount: 0, payment_mode: 'Cash', notes: '' });
      loadData();
      onUpdate?.();
    } catch {
      toast('Error', { description: 'Failed to record payment', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetNewItem = () => {
    setNewItem({
      item_type: 'misc',
      item_name: '',
      item_description: '',
      quantity: 1,
      unit_price: 0,
      gst_rate: 0,
      hsn_code: '',
    });
  };

  const groupedItems = useMemo(() => {
    const groups: Record<string, IpdBillItem[]> = {};
    items.forEach((item) => {
      const date = item.item_date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const summary: EnhancedBillSummary = useMemo(() => {
    return ipdService.calculateEnhancedBillSummary(items, payments, gstRates, useIGST);
  }, [items, payments, gstRates, useIGST]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-700">Running Bill</h4>
          <p className="text-xs text-gray-500 mt-0.5">{items.length} items</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleGenerateBedCharge} className="gap-1 h-7 text-xs">
            <BedDouble className="w-3.5 h-3.5" /> Bed Charge
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAddService(true)} className="gap-1 h-7 text-xs">
            <Search className="w-3.5 h-3.5" /> Service
          </Button>
          {packages.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setShowPackages(true)} className="gap-1 h-7 text-xs">
              <Package className="w-3.5 h-3.5" /> Package
            </Button>
          )}
          <Button size="sm" onClick={() => setShowAddItem(true)} className="gap-1 h-7 text-xs bg-blue-600 hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> Manual
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No bill items yet</div>
      ) : (
        <div className="space-y-4">
          {groupedItems.map(([date, dateItems]) => (
            <div key={date}>
              <div className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                {format(parseISO(date), 'dd MMM yyyy, EEEE')}
              </div>
              <div className="space-y-1.5">
                {dateItems.map((item) => {
                  const Icon = ITEM_TYPE_ICONS[item.item_type];
                  const config = BILL_ITEM_TYPE_CONFIG[item.item_type];
                  const gstAmt = Number(item.gst_amount) || 0;
                  const gstRate = Number(item.gst_rate) || 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border transition-all ${
                        item.is_billable ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${config.color.split(' ')[0]}`}>
                          <Icon className={`w-3.5 h-3.5 ${config.color.split(' ')[1]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800 truncate">{item.item_name}</span>
                            <Badge className={`${config.color} text-[10px] px-1.5`}>{config.label}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.item_description && (
                              <span className="text-xs text-gray-500 truncate">{item.item_description}</span>
                            )}
                            {gstRate > 0 && (
                              <span className="text-[10px] text-emerald-600 font-medium">
                                GST {gstRate}% = Rs. {gstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-800">
                            Rs. {Number(item.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {item.quantity} x Rs. {Number(item.unit_price).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <BillSummaryCard
            summary={summary}
            useIGST={useIGST}
            onToggleIGST={() => setUseIGST(!useIGST)}
          />

          {payments.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payments Received</h5>
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <div>
                      <span className="text-xs font-medium text-emerald-700">{p.payment_mode}</span>
                      {p.receipt_number && (
                        <span className="text-[10px] text-emerald-500 ml-2">#{p.receipt_number}</span>
                      )}
                      {p.notes && <div className="text-[10px] text-gray-500">{p.notes}</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-emerald-700">
                      Rs. {Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {format(new Date(p.created_at), 'dd MMM, hh:mm a')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowAddPayment(true)} className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              <IndianRupee className="w-3.5 h-3.5" /> Collect Payment
            </Button>
            <Button size="sm" variant="outline" onClick={() => handlePrintBill()} className="flex-1 gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print Bill
            </Button>
          </div>
        </div>
      )}

      <AddItemDialog
        open={showAddItem}
        onOpenChange={setShowAddItem}
        newItem={newItem}
        setNewItem={setNewItem}
        gstRates={gstRates}
        onSubmit={handleAddItem}
        submitting={submitting}
      />

      <ServiceSearchDialog
        open={showAddService}
        onOpenChange={(v) => { setShowAddService(v); if (!v) { setServiceSearch(''); setServiceResults([]); } }}
        search={serviceSearch}
        onSearchChange={setServiceSearch}
        results={serviceResults}
        searching={searchingServices}
        onSelect={handleAddServiceItem}
        submitting={submitting}
      />

      <PackageDialog
        open={showPackages}
        onOpenChange={setShowPackages}
        packages={packages}
        onSelect={handleAddPackage}
        submitting={submitting}
      />

      <PaymentDialog
        open={showAddPayment}
        onOpenChange={setShowAddPayment}
        form={paymentForm}
        setForm={setPaymentForm}
        balanceDue={summary.balanceDue}
        onSubmit={handleAddPayment}
        submitting={submitting}
      />

      <div style={{ display: 'none' }}>
        <div ref={billPrintRef} style={{ padding: '32px', fontFamily: 'Arial, sans-serif', fontSize: '11px' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>IPD RUNNING BILL</div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              Patient: {admission.patient?.full_name} | UHID: {admission.patient?.uhid} | Adm#: {admission.admission_number}
            </div>
            <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
              Bed: {admission.bed?.bed_number} | Doctor: Dr. {admission.doctor?.full_name}
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '4px' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '4px' }}>Item</th>
                <th style={{ textAlign: 'center', padding: '4px' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '4px' }}>Rate</th>
                <th style={{ textAlign: 'right', padding: '4px' }}>GST</th>
                <th style={{ textAlign: 'right', padding: '4px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.filter(i => i.is_billable).map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '3px 4px' }}>{format(parseISO(item.item_date), 'dd-MMM')}</td>
                  <td style={{ padding: '3px 4px' }}>{item.item_name}</td>
                  <td style={{ textAlign: 'center', padding: '3px 4px' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '3px 4px' }}>{Number(item.unit_price).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '3px 4px' }}>{(Number(item.gst_amount) || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '3px 4px' }}>{Number(item.total_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop: '2px solid #333', marginTop: '8px', paddingTop: '8px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span>Subtotal:</span><span>Rs. {summary.subtotal.toFixed(2)}</span>
            </div>
            {summary.gstBreakup.cgst > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>CGST:</span><span>Rs. {summary.gstBreakup.cgst.toFixed(2)}</span>
              </div>
            )}
            {summary.gstBreakup.sgst > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>SGST:</span><span>Rs. {summary.gstBreakup.sgst.toFixed(2)}</span>
              </div>
            )}
            {summary.gstBreakup.igst > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>IGST:</span><span>Rs. {summary.gstBreakup.igst.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px', borderTop: '1px solid #333', paddingTop: '4px', marginTop: '4px' }}>
              <span>Grand Total:</span><span>Rs. {summary.total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span>Total Paid:</span><span>Rs. {summary.totalPaid.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: summary.balanceDue > 0 ? '#dc2626' : '#16a34a' }}>
              <span>Balance Due:</span><span>Rs. {summary.balanceDue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {payments.length > 0 && (
        <div style={{ display: 'none' }}>
          <div ref={receiptRef} style={{ padding: '24px', fontFamily: 'Arial, sans-serif', fontSize: '11px', width: '300px' }}>
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800 }}>PAYMENT RECEIPT</div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                {admission.patient?.full_name} | {admission.patient?.uhid}
              </div>
            </div>
            {payments.map(p => (
              <div key={p.id} style={{ borderBottom: '1px dashed #ccc', padding: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                <span>{p.payment_mode} {p.receipt_number && `#${p.receipt_number}`}</span>
                <span style={{ fontWeight: 700 }}>Rs. {Number(p.amount).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ marginTop: '8px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', paddingTop: '4px' }}>
              <span>Total Paid:</span>
              <span>Rs. {summary.totalPaid.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BillSummaryCard({
  summary,
  useIGST,
  onToggleIGST,
}: {
  summary: EnhancedBillSummary;
  useIGST: boolean;
  onToggleIGST: () => void;
}) {
  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>Rs. {summary.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="border-t border-gray-200 pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">GST Breakup</span>
            <button
              type="button"
              onClick={onToggleIGST}
              className="text-[10px] text-blue-600 hover:underline font-medium"
            >
              {useIGST ? 'Switch to CGST+SGST' : 'Switch to IGST'}
            </button>
          </div>
          {!useIGST ? (
            <>
              <div className="flex justify-between text-gray-600">
                <span className="text-xs">CGST</span>
                <span className="text-xs">Rs. {summary.gstBreakup.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="text-xs">SGST</span>
                <span className="text-xs">Rs. {summary.gstBreakup.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-gray-600">
              <span className="text-xs">IGST</span>
              <span className="text-xs">Rs. {summary.gstBreakup.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-300 pt-2 mt-2">
          <div className="flex justify-between text-lg font-bold text-gray-800">
            <span>Grand Total</span>
            <span>Rs. {summary.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="flex justify-between text-emerald-600">
          <span>Total Paid</span>
          <span>Rs. {summary.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className={`flex justify-between font-bold text-base ${summary.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
          <span>Balance Due</span>
          <span>Rs. {summary.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}

function mapCategory(category: string): BillItemType {
  const map: Record<string, BillItemType> = {
    Consultation: 'consultation',
    Investigation: 'investigation',
    Procedure: 'procedure',
    Nursing: 'nursing',
    Therapy: 'procedure',
    'Bed Charges': 'bed_charges',
    Medication: 'medication',
  };
  return map[category] || 'misc';
}

function AddItemDialog({
  open, onOpenChange, newItem, setNewItem, gstRates, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  newItem: { item_type: BillItemType; item_name: string; item_description: string; quantity: number; unit_price: number; gst_rate: number; hsn_code: string };
  setNewItem: (v: typeof newItem) => void;
  gstRates: GstMaster[];
  onSubmit: () => void;
  submitting: boolean;
}) {
  const baseAmt = newItem.quantity * newItem.unit_price;
  const gstAmt = (baseAmt * newItem.gst_rate) / 100;
  const total = baseAmt + gstAmt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Bill Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Item Type</label>
            <Select value={newItem.item_type} onValueChange={(v) => setNewItem({ ...newItem, item_type: v as BillItemType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(BILL_ITEM_TYPE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Item Name *</label>
            <input
              type="text"
              value={newItem.item_name}
              onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
              placeholder="Enter item name"
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Description</label>
            <input
              type="text"
              value={newItem.item_description}
              onChange={(e) => setNewItem({ ...newItem, item_description: e.target.value })}
              placeholder="Additional details"
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Quantity</label>
              <input
                type="number"
                min="1"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Unit Price (Rs.)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newItem.unit_price}
                onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">GST Rate (%)</label>
              <Select
                value={String(newItem.gst_rate)}
                onValueChange={(v) => {
                  const rate = parseFloat(v);
                  const gst = gstRates.find(g => g.gst_rate === rate);
                  setNewItem({ ...newItem, gst_rate: rate, hsn_code: gst?.hsn_code || '' });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="18">18%</SelectItem>
                  <SelectItem value="28">28%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">HSN Code</label>
              <input
                type="text"
                value={newItem.hsn_code}
                onChange={(e) => setNewItem({ ...newItem, hsn_code: e.target.value })}
                placeholder="HSN/SAC"
                className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Base: Rs. {baseAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <span>GST: Rs. {gstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-blue-700">
              <span>Total</span>
              <span>Rs. {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ServiceSearchDialog({
  open, onOpenChange, onSelect, hospitalId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  search: string;
  onSearchChange: (v: string) => void;
  results: ServiceMaster[];
  searching: boolean;
  onSelect: (s: ServiceMaster) => void;
  submitting: boolean;
  hospitalId?: string;
}) {
  const handlePickerSelect = (svc: { id: string; name: string; code: string | null; category: string; rate: number; tax_percentage: number }) => {
    onSelect({
      id: svc.id,
      hospital_id: hospitalId || '',
      service_name: svc.name,
      category: svc.category,
      price: svc.rate,
      gst_rate: svc.tax_percentage,
      hsn_code: '',
      is_active: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Service</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {hospitalId ? (
            <ServiceGroupPicker
              hospitalId={hospitalId}
              filterType="IPD"
              onSelect={handlePickerSelect}
            />
          ) : (
            <div className="text-center py-6 text-muted-foreground text-xs">No hospital configured</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PackageDialog({
  open, onOpenChange, packages, onSelect, submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  packages: PackageMaster[];
  onSelect: (p: PackageMaster) => void;
  submitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Package</DialogTitle>
        </DialogHeader>
        <div className="py-2 max-h-80 overflow-y-auto space-y-2">
          {packages.map((pkg) => (
            <div key={pkg.id} className="p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-gray-800">{pkg.package_name}</div>
                  {pkg.description && <div className="text-xs text-gray-500">{pkg.description}</div>}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600">
                    Rs. {pkg.total_price.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-gray-400">{pkg.services.length} items</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {pkg.services.map((svc, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] h-5">{svc.name}</Badge>
                ))}
              </div>
              <Button
                size="sm"
                onClick={() => onSelect(pkg)}
                disabled={submitting}
                className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add to Bill'}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({
  open, onOpenChange, form, setForm, balanceDue, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: { amount: number; payment_mode: string; notes: string };
  setForm: (v: typeof form) => void;
  balanceDue: number;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            Collect Payment
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex justify-between text-sm">
              <span className="text-amber-700">Balance Due</span>
              <span className="font-bold text-amber-700">
                Rs. {balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Amount (Rs.) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount || ''}
              onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 text-lg font-semibold"
            />
            {balanceDue > 0 && (
              <button
                type="button"
                onClick={() => setForm({ ...form, amount: balanceDue })}
                className="text-[10px] text-blue-600 hover:underline mt-1"
              >
                Pay full balance
              </button>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Payment Mode</label>
            <Select value={form.payment_mode} onValueChange={(v) => setForm({ ...form, payment_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Reference / remarks"
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
