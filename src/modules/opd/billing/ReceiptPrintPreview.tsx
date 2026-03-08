/**
 * Professional OPD Bill Print — A4 format with hospital branding.
 * Opens in a new window for print/PDF.
 */
import { useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  hospitalHeaderHTML, openPrintWindow, formatCurrencyINR, formatDateIN,
  calculateAge, numberToWordsINR,
} from '../../../lib/printStyles';
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

function buildOPDBillHTML(bill: BillRecord, patient: PatientInfo, items: BillItem[], totals: Props['totals']): string {
  const paymentLabel = PAYMENT_MODES.find(m => m.value === bill.payment_mode)?.label || bill.payment_mode;

  const itemRows = items.map((item, idx) => `
    <tr>
      <td class="c">${idx + 1}</td>
      <td>${item.itemName}</td>
      <td><span class="type-badge">${ITEM_TYPES.find(t => t.value === item.itemType)?.label || item.itemType}</span></td>
      <td class="c">${item.quantity}</td>
      <td class="r">${formatCurrencyINR(item.unitPrice)}</td>
      <td class="r">${formatCurrencyINR(item.totalPrice)}</td>
    </tr>
  `).join('');

  return `
    ${hospitalHeaderHTML()}
    <div class="doc-title">TAX INVOICE / OPD RECEIPT</div>

    <div class="info-grid">
      <div class="info-box">
        <h4>Patient Details</h4>
        <div class="info-row"><span class="lbl">Name</span><span class="val">${patient.full_name}</span></div>
        <div class="info-row"><span class="lbl">UHID</span><span class="val">${patient.uhid}</span></div>
        <div class="info-row"><span class="lbl">Age / Gender</span><span class="val">${calculateAge(patient.date_of_birth)} / ${patient.gender}</span></div>
      </div>
      <div class="info-box">
        <h4>Invoice Details</h4>
        <div class="info-row"><span class="lbl">Invoice No</span><span class="val">${bill.bill_number}</span></div>
        <div class="info-row"><span class="lbl">Date</span><span class="val">${formatDateIN(bill.bill_date)}</span></div>
        <div class="info-row"><span class="lbl">Type</span><span class="val">${bill.bill_type}</span></div>
      </div>
    </div>

    <table class="bill-table">
      <thead>
        <tr>
          <th class="c" style="width:5%">#</th>
          <th style="width:35%">Description</th>
          <th style="width:15%">Type</th>
          <th class="c" style="width:10%">Qty</th>
          <th class="r" style="width:17%">Rate</th>
          <th class="r" style="width:18%">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <div class="summary-wrap">
      <div class="summary-tbl">
        <div class="summary-row"><span class="lbl">Subtotal</span><span class="val">${formatCurrencyINR(totals.subtotal)}</span></div>
        ${totals.discountAmount > 0 ? `<div class="summary-row"><span class="lbl">Discount (${bill.discount_percentage}%)</span><span class="val" style="color:#dc2626">-${formatCurrencyINR(totals.discountAmount)}</span></div>` : ''}
        <div class="summary-row"><span class="lbl">GST (${bill.tax_percentage}%)</span><span class="val">+${formatCurrencyINR(totals.taxAmount)}</span></div>
        <div class="summary-row total"><span class="lbl">Total</span><span class="val">${formatCurrencyINR(totals.totalAmount)}</span></div>
      </div>
    </div>

    <div class="words-box">
      <strong>Amount in words:</strong> ${numberToWordsINR(totals.totalAmount)}
    </div>

    <div class="payment-bar">
      <div><strong>Payment Status:</strong> <span class="paid">PAID</span></div>
      <div><strong>Payment Mode:</strong> ${paymentLabel}</div>
      <div><strong>Amount Paid:</strong> ${formatCurrencyINR(bill.amount_paid)}</div>
    </div>

    <div class="footer">
      <div class="barcode">${bill.bill_number}</div>
      <div class="sig"><div class="sig-line">Authorized Signature</div></div>
    </div>

    <div class="thank-you">Thank you for choosing WellNotes Healthcare. Get well soon!</div>
  `;
}

export default function ReceiptPrintPreview({ bill, patient, items, totals, onClose }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    openPrintWindow(`OPD_Bill_${bill.bill_number}`, buildOPDBillHTML(bill, patient, items, totals));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">OPD Bill Preview</h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePrint} className="gap-1.5 bg-primary hover:bg-primary/90">
              <Printer className="w-4 h-4" />
              Print / PDF
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-muted/30">
          <div
            ref={previewRef}
            className="bg-white p-8 shadow-sm border border-border rounded-lg max-w-[210mm] mx-auto"
            style={{ fontSize: '11px', fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}
          >
            {/* In-page preview */}
            <div className="text-center pb-3 mb-4 border-b-[3px] border-double border-[#1a3a5c]">
              <h1 className="text-xl font-extrabold text-[#1a3a5c] tracking-wider">WELLNOTES HEALTHCARE</h1>
              <p className="text-[10px] text-muted-foreground font-medium">Multi-Specialty Hospital & Research Centre</p>
              <p className="text-[9px] text-muted-foreground mt-1">
                123 Healthcare Avenue, Medical District, City - 400001<br />
                Phone: +91 22 1234 5678 | GSTIN: 27AAAAA0000A1Z5
              </p>
            </div>

            <div className="text-center text-xs font-bold text-white bg-[#1a3a5c] py-1.5 rounded mb-4 tracking-widest">
              TAX INVOICE / OPD RECEIPT
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <h4 className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold mb-1.5">Patient Details</h4>
                <div className="space-y-0.5 text-[10.5px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-semibold">{patient.full_name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">UHID</span><span className="font-semibold">{patient.uhid}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Age/Gender</span><span className="font-semibold">{calculateAge(patient.date_of_birth)} / {patient.gender}</span></div>
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <h4 className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold mb-1.5">Invoice Details</h4>
                <div className="space-y-0.5 text-[10.5px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Invoice No</span><span className="font-semibold font-mono">{bill.bill_number}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-semibold">{formatDateIN(bill.bill_date)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-semibold">{bill.bill_type}</span></div>
                </div>
              </div>
            </div>

            <table className="w-full text-[10.5px] mb-4">
              <thead>
                <tr className="bg-[#1a3a5c] text-white">
                  <th className="py-1.5 px-2 text-center text-[9px] font-semibold w-[5%]">#</th>
                  <th className="py-1.5 px-2 text-left text-[9px] font-semibold">Description</th>
                  <th className="py-1.5 px-2 text-left text-[9px] font-semibold w-[15%]">Type</th>
                  <th className="py-1.5 px-2 text-center text-[9px] font-semibold w-[10%]">Qty</th>
                  <th className="py-1.5 px-2 text-right text-[9px] font-semibold w-[17%]">Rate</th>
                  <th className="py-1.5 px-2 text-right text-[9px] font-semibold w-[18%]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 1 ? 'bg-muted/30' : ''}>
                    <td className="py-1.5 px-2 text-center">{idx + 1}</td>
                    <td className="py-1.5 px-2 font-medium">{item.itemName}</td>
                    <td className="py-1.5 px-2">
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px]">
                        {ITEM_TYPES.find(t => t.value === item.itemType)?.label}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-center">{item.quantity}</td>
                    <td className="py-1.5 px-2 text-right font-mono">{formatCurrencyINR(item.unitPrice)}</td>
                    <td className="py-1.5 px-2 text-right font-mono font-medium">{formatCurrencyINR(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-3">
              <div className="w-[260px] space-y-1 text-[10.5px]">
                <div className="flex justify-between border-b border-border/50 pb-1">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{formatCurrencyINR(totals.subtotal)}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between border-b border-border/50 pb-1">
                    <span className="text-muted-foreground">Discount ({bill.discount_percentage}%)</span>
                    <span className="font-mono text-destructive">-{formatCurrencyINR(totals.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-border/50 pb-1">
                  <span className="text-muted-foreground">GST ({bill.tax_percentage}%)</span>
                  <span className="font-mono">+{formatCurrencyINR(totals.taxAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-[#1a3a5c]">
                  <span className="font-extrabold text-sm text-[#1a3a5c]">Total</span>
                  <span className="font-extrabold text-sm text-[#1a3a5c] font-mono">{formatCurrencyINR(totals.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[10px] italic mb-3">
              <strong>Amount in words:</strong> {numberToWordsINR(totals.totalAmount)}
            </div>

            <div className="flex justify-between p-2 bg-emerald-50 border border-emerald-200 rounded text-[10.5px] mb-6">
              <span><strong>Status:</strong> <span className="text-emerald-700 font-bold">PAID</span></span>
              <span><strong>Mode:</strong> {PAYMENT_MODES.find(m => m.value === bill.payment_mode)?.label}</span>
              <span><strong>Paid:</strong> {formatCurrencyINR(bill.amount_paid)}</span>
            </div>

            <div className="flex justify-between items-end mt-8">
              <span className="font-mono text-[11px] tracking-widest text-muted-foreground">{bill.bill_number}</span>
              <div className="text-center">
                <div className="w-[180px] border-t border-foreground pt-1 text-[10px] text-muted-foreground mt-12">Authorized Signature</div>
              </div>
            </div>

            <p className="text-center text-[10px] text-muted-foreground mt-4 pt-2 border-t border-dashed border-border">
              Thank you for choosing WellNotes Healthcare. Get well soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
