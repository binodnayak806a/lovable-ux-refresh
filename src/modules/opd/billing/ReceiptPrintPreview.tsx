import { useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { BillItem, BillRecord } from './types';
import { ITEM_TYPES, PAYMENT_MODES } from './types';

interface PatientInfo {
  id: string;
  uhid: string;
  full_name: string;
  gender: string;
  date_of_birth: string | null;
}

interface Props {
  bill: BillRecord;
  patient: PatientInfo;
  items: BillItem[];
  totals: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
  };
  onClose: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function calculateAge(dob: string | null): string {
  if (!dob) return '-';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + numberToWords(-num);

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let words = '';

  if (rupees >= 10000000) {
    words += numberToWords(Math.floor(rupees / 10000000)) + ' Crore ';
    num = rupees % 10000000;
  }
  if (rupees >= 100000) {
    words += numberToWords(Math.floor((rupees % 10000000) / 100000)) + ' Lakh ';
  }
  if (rupees >= 1000) {
    words += numberToWords(Math.floor((rupees % 100000) / 1000)) + ' Thousand ';
  }
  if (rupees >= 100) {
    words += numberToWords(Math.floor((rupees % 1000) / 100)) + ' Hundred ';
  }
  const remainder = rupees % 100;
  if (remainder > 0) {
    if (remainder < 20) {
      words += ones[remainder];
    } else {
      words += tens[Math.floor(remainder / 10)] + ' ' + ones[remainder % 10];
    }
  }

  words = words.trim() + ' Rupees';
  if (paise > 0) {
    words += ' and ' + (paise < 20 ? ones[paise] : tens[Math.floor(paise / 10)] + ' ' + ones[paise % 10]) + ' Paise';
  }
  return words.trim() + ' Only';
}

export default function ReceiptPrintPreview({ bill, patient, items, totals, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const paymentModeLabel = PAYMENT_MODES.find((m) => m.value === bill.payment_mode)?.label || bill.payment_mode;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${bill.bill_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 15px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #0066cc; padding-bottom: 12px; margin-bottom: 12px; }
            .hospital-name { font-size: 18px; font-weight: 700; color: #0066cc; margin-bottom: 3px; }
            .hospital-info { font-size: 10px; color: #666; line-height: 1.5; }
            .receipt-title { font-size: 14px; font-weight: 600; text-align: center; margin: 10px 0; padding: 6px; background: #f0f7ff; border-radius: 4px; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 12px; gap: 20px; }
            .info-box { flex: 1; padding: 10px; background: #f8f9fa; border-radius: 6px; }
            .info-box h4 { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .info-row span:first-child { color: #666; }
            .info-row span:last-child { font-weight: 500; }
            .items-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
            .items-table th { background: #0066cc; color: white; padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 600; }
            .items-table th:nth-child(3), .items-table th:nth-child(4), .items-table th:nth-child(5) { text-align: right; }
            .items-table td { padding: 8px 10px; border-bottom: 1px solid #e5e5e5; }
            .items-table td:nth-child(3), .items-table td:nth-child(4), .items-table td:nth-child(5) { text-align: right; font-family: monospace; }
            .items-table tr:nth-child(even) { background: #f9f9f9; }
            .type-badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; background: #e8f4fd; color: #0066cc; }
            .summary-box { display: flex; justify-content: flex-end; margin-top: 10px; }
            .summary-table { width: 280px; }
            .summary-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
            .summary-row span:last-child { font-family: monospace; }
            .summary-row.total { border-top: 2px solid #0066cc; border-bottom: none; padding-top: 10px; margin-top: 6px; }
            .summary-row.total span { font-size: 14px; font-weight: 700; color: #0066cc; }
            .amount-words { padding: 10px; background: #fff9e6; border-radius: 4px; margin: 12px 0; font-style: italic; font-size: 10px; }
            .payment-info { display: flex; justify-content: space-between; padding: 10px; background: #e8f5e9; border-radius: 4px; margin: 10px 0; }
            .footer { margin-top: 30px; display: flex; justify-content: space-between; }
            .signature { text-align: center; width: 150px; }
            .signature-line { border-top: 1px solid #333; padding-top: 5px; margin-top: 40px; font-size: 10px; }
            .barcode { font-family: monospace; font-size: 12px; letter-spacing: 2px; color: #666; }
            .thank-you { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 11px; color: #666; }
            @media print {
              body { padding: 0; }
              @page { margin: 10mm; size: A4; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Receipt Preview</h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePrint} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div
            ref={printRef}
            className="bg-white p-8 shadow-sm border border-gray-200 rounded-lg max-w-[210mm] mx-auto"
          >
            <div className="header">
              <div className="hospital-name">HEALTHRAY MEDICAL CENTER</div>
              <div className="hospital-info">
                123 Healthcare Avenue, Medical District, City - 400001<br />
                Phone: +91 22 1234 5678 | Email: info@healthray.com<br />
                GSTIN: 27AAAAA0000A1Z5 | Reg. No: MH/2024/12345
              </div>
            </div>

            <div className="receipt-title">TAX INVOICE / RECEIPT</div>

            <div className="info-grid">
              <div className="info-box">
                <h4>Patient Details</h4>
                <div className="info-row">
                  <span>Name:</span>
                  <span>{patient.full_name}</span>
                </div>
                <div className="info-row">
                  <span>UHID:</span>
                  <span>{patient.uhid}</span>
                </div>
                <div className="info-row">
                  <span>Age/Gender:</span>
                  <span>{calculateAge(patient.date_of_birth)} / {patient.gender}</span>
                </div>
              </div>
              <div className="info-box">
                <h4>Invoice Details</h4>
                <div className="info-row">
                  <span>Invoice No:</span>
                  <span>{bill.bill_number}</span>
                </div>
                <div className="info-row">
                  <span>Date:</span>
                  <span>{formatDate(bill.bill_date)}</span>
                </div>
                <div className="info-row">
                  <span>Type:</span>
                  <span>{bill.bill_type}</span>
                </div>
              </div>
            </div>

            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '40%' }}>Description</th>
                  <th style={{ width: '15%' }}>Type</th>
                  <th style={{ width: '10%' }}>Qty</th>
                  <th style={{ width: '15%' }}>Rate</th>
                  <th style={{ width: '15%' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td>{item.itemName}</td>
                    <td>
                      <span className="type-badge">
                        {ITEM_TYPES.find((t) => t.value === item.itemType)?.label}
                      </span>
                    </td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="summary-box">
              <div className="summary-table">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="summary-row">
                    <span>Discount ({bill.discount_percentage}%):</span>
                    <span>-{formatCurrency(totals.discountAmount)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>GST ({bill.tax_percentage}%):</span>
                  <span>+{formatCurrency(totals.taxAmount)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>{formatCurrency(totals.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="amount-words">
              <strong>Amount in words:</strong> {numberToWords(totals.totalAmount)}
            </div>

            <div className="payment-info">
              <div>
                <strong>Payment Status:</strong> <span style={{ color: '#2e7d32' }}>PAID</span>
              </div>
              <div>
                <strong>Payment Mode:</strong> {paymentModeLabel}
              </div>
              <div>
                <strong>Amount Paid:</strong> {formatCurrency(bill.amount_paid)}
              </div>
            </div>

            <div className="footer">
              <div>
                <div className="barcode">{bill.bill_number}</div>
              </div>
              <div className="signature">
                <div className="signature-line">Authorized Signature</div>
              </div>
            </div>

            <div className="thank-you">
              Thank you for choosing Healthray Medical Center. Get well soon!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
