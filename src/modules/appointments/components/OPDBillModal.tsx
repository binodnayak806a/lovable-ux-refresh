import { useState, useRef, forwardRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Receipt, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import appointmentsService from '../../../services/appointments.service';

interface Props {
  hospitalId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  doctorId: string;
  doctorName: string;
  visitType: string;
  amount: number;
  canEditAmount: boolean;
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

interface BillData {
  bill_number: string;
  amount: number;
  gst_amount: number;
  discount: number;
  total_amount: number;
  payment_mode: string;
  created_at: string;
}

const PAYMENT_MODES = ['cash', 'card', 'upi', 'netbanking'];

const ReceiptContent = forwardRef<HTMLDivElement, {
  patientName: string;
  patientUhid: string;
  doctorName: string;
  visitType: string;
  bill: BillData;
}>(({ patientName, patientUhid, doctorName, visitType, bill }, ref) => {
  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
  return (
    <div ref={ref} className="bg-white p-8" style={{ width: '400px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '2px solid #0f172a', paddingBottom: '12px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>OPD Bill Receipt</div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{bill.bill_number}</div>
      </div>

      <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>Patient:</span>
          <span>{patientName} ({patientUhid})</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>Doctor:</span>
          <span>Dr. {doctorName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>Visit Type:</span>
          <span>{visitType}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>Date:</span>
          <span>{new Date(bill.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      <div style={{ margin: '12px 0', borderTop: '1px dashed #cbd5e1', paddingTop: '12px', fontSize: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Consultation Fee</span>
          <span>{formatter.format(bill.amount)}</span>
        </div>
        {bill.gst_amount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#64748b' }}>
            <span>GST</span>
            <span>{formatter.format(bill.gst_amount)}</span>
          </div>
        )}
        {bill.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#16a34a' }}>
            <span>Discount</span>
            <span>-{formatter.format(bill.discount)}</span>
          </div>
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontWeight: 700, fontSize: '14px',
          borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px',
        }}>
          <span>Total</span>
          <span>{formatter.format(bill.total_amount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
          <span>Payment Mode</span>
          <span style={{ textTransform: 'uppercase' }}>{bill.payment_mode}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
        Thank you for visiting. Get well soon!
      </div>
    </div>
  );
});
ReceiptContent.displayName = 'ReceiptContent';

export default function OPDBillModal({
  hospitalId, appointmentId, patientId, patientName, patientUhid,
  doctorId, doctorName, visitType, amount, canEditAmount, userId,
  onComplete, onSkip,
}: Props) {
  const [editAmount, setEditAmount] = useState(amount);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [saving, setSaving] = useState(false);
  const [savedBill, setSavedBill] = useState<BillData | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `OPD_Bill_${patientUhid}`,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const bill = await appointmentsService.createOPDBill({
        hospital_id: hospitalId,
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        amount: editAmount,
        discount,
        payment_mode: paymentMode,
        visit_type: visitType,
        created_by: userId,
      });
      setSavedBill({
        bill_number: bill.bill_number,
        amount: Number(bill.amount),
        gst_amount: Number(bill.gst_amount),
        discount: Number(bill.discount),
        total_amount: Number(bill.total_amount),
        payment_mode: bill.payment_mode,
        created_at: bill.created_at,
      });
    } catch {
      toast.error('Failed to generate bill');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintAndClose = () => {
    handlePrint();
    onComplete();
  };

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const totalPreview = editAmount - discount;

  if (savedBill) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Bill Generated</h3>
                <p className="text-xs text-gray-500">{savedBill.bill_number}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4 flex justify-center">
            <ReceiptContent
              ref={receiptRef}
              patientName={patientName}
              patientUhid={patientUhid}
              doctorName={doctorName}
              visitType={visitType}
              bill={savedBill}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="flex-1" onClick={onComplete}>
              Done
            </Button>
            <Button className="flex-1 gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={handlePrintAndClose}>
              <Printer className="w-4 h-4" />
              Print Receipt
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Confirm OPD Bill</h3>
          </div>
          <button onClick={onSkip} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-5">
          <div className="flex justify-between text-xs text-gray-600">
            <span>{patientName}</span>
            <span className="text-gray-400">{patientUhid}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Dr. {doctorName}</span>
            <span className="text-gray-400">{visitType}</span>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <Label className="text-xs font-medium text-gray-600 mb-1 block">Consultation Fee</Label>
            <Input
              type="number"
              value={editAmount}
              onChange={e => setEditAmount(Number(e.target.value))}
              disabled={!canEditAmount}
              className="h-10"
            />
            {!canEditAmount && (
              <p className="text-[10px] text-gray-400 mt-1">Only Admin/Receptionist can edit the amount</p>
            )}
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-600 mb-1 block">Discount</Label>
            <Input
              type="number"
              value={discount}
              onChange={e => setDiscount(Number(e.target.value))}
              className="h-10"
              disabled={!canEditAmount}
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-600 mb-1 block">Payment Mode</Label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_MODES.map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                    paymentMode === m
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-800">Total Amount</span>
            <span className="text-xl font-bold text-emerald-700">{formatter.format(totalPreview)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex-1 text-xs" onClick={onSkip}>
            Skip Bill
          </Button>
          <Button
            className="flex-1 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSave}
            disabled={saving || editAmount <= 0}
          >
            {saving ? 'Saving...' : 'Generate Bill'}
          </Button>
        </div>
      </div>
    </div>
  );
}
