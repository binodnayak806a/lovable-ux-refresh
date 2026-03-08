/**
 * IPD Bill Print — Professional A4 format with itemized charges,
 * deposit history, and GST breakdown. Opens in print window.
 */
import {
  hospitalHeaderHTML, openPrintWindow, formatCurrencyINR, formatDateIN,
  calculateAge, numberToWordsINR,
} from '../../../lib/printStyles';
import type { Admission, IpdBillItem } from '../types';
import { BILL_ITEM_TYPE_CONFIG } from '../types';

interface DepositRecord {
  id: string;
  type: 'deposit' | 'refund';
  amount: number;
  payment_mode: string;
  receipt_number: string | null;
  created_at: string;
}

interface Props {
  admission: Admission;
  billItems: IpdBillItem[];
  deposits: DepositRecord[];
  summary: {
    billTotal: number;
    totalDeposits: number;
    totalRefunds: number;
    netDeposit: number;
    balance: number;
  };
}

export function printIpdBill({ admission, billItems, deposits, summary }: Props) {
  const patient = admission.patient;
  const doctor = admission.doctor;

  const itemRows = billItems
    .filter(i => i.is_billable)
    .map((item, idx) => {
      const typeConf = BILL_ITEM_TYPE_CONFIG[item.item_type];
      return `
        <tr>
          <td class="c">${idx + 1}</td>
          <td>${formatDateIN(item.item_date)}</td>
          <td>${item.item_name}${item.item_description ? `<br/><span style="font-size:9px;color:#888">${item.item_description}</span>` : ''}</td>
          <td><span class="type-badge">${typeConf?.label || item.item_type}</span></td>
          <td class="c">${item.quantity}</td>
          <td class="r">${formatCurrencyINR(item.unit_price)}</td>
          <td class="r">${formatCurrencyINR(item.total_price)}</td>
        </tr>`;
    }).join('');

  const depositRows = deposits.map(dep => `
    <tr>
      <td>${formatDateIN(dep.created_at)}</td>
      <td><span class="badge ${dep.type === 'deposit' ? 'badge-green' : 'badge-amber'}">${dep.type === 'deposit' ? '↓ Deposit' : '↑ Refund'}</span></td>
      <td>${dep.receipt_number || '-'}</td>
      <td>${dep.payment_mode}</td>
      <td class="r" style="color:${dep.type === 'deposit' ? '#166534' : '#92400e'}">${dep.type === 'refund' ? '-' : '+'}${formatCurrencyINR(dep.amount)}</td>
    </tr>
  `).join('');

  const daysAdmitted = Math.max(1, Math.ceil(
    (new Date(admission.discharge_date || new Date()).getTime() - new Date(admission.admission_date).getTime()) / 86400000
  ));

  const html = `
    ${hospitalHeaderHTML()}
    <div class="doc-title">IPD BILL / FINAL SETTLEMENT</div>

    <div class="info-grid">
      <div class="info-box">
        <h4>Patient Details</h4>
        <div class="info-row"><span class="lbl">Name</span><span class="val">${patient?.full_name || '-'}</span></div>
        <div class="info-row"><span class="lbl">UHID</span><span class="val">${patient?.uhid || '-'}</span></div>
        <div class="info-row"><span class="lbl">Age / Gender</span><span class="val">${calculateAge(patient?.date_of_birth || null)} / ${patient?.gender || '-'}</span></div>
        <div class="info-row"><span class="lbl">Blood Group</span><span class="val">${patient?.blood_group || '-'}</span></div>
      </div>
      <div class="info-box">
        <h4>Admission Details</h4>
        <div class="info-row"><span class="lbl">Admission No</span><span class="val">${admission.admission_number}</span></div>
        <div class="info-row"><span class="lbl">Admitted</span><span class="val">${formatDateIN(admission.admission_date)}</span></div>
        <div class="info-row"><span class="lbl">Discharged</span><span class="val">${formatDateIN(admission.discharge_date)}</span></div>
        <div class="info-row"><span class="lbl">Duration</span><span class="val">${daysAdmitted} day(s)</span></div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box" style="flex:0 0 48%">
        <h4>Doctor & Ward</h4>
        <div class="info-row"><span class="lbl">Doctor</span><span class="val">Dr. ${doctor?.full_name || '-'}</span></div>
        <div class="info-row"><span class="lbl">Ward / Bed</span><span class="val">${admission.bed?.ward?.name || '-'} / ${admission.bed?.bed_number || '-'}</span></div>
        <div class="info-row"><span class="lbl">Diagnosis</span><span class="val">${admission.primary_diagnosis || '-'}</span></div>
      </div>
      <div class="info-box" style="flex:0 0 48%">
        <h4>Billing Info</h4>
        <div class="info-row"><span class="lbl">Category</span><span class="val">${admission.billing_category}</span></div>
        ${admission.insurance_company ? `<div class="info-row"><span class="lbl">Insurance</span><span class="val">${admission.insurance_company}</span></div>` : ''}
        ${admission.policy_number ? `<div class="info-row"><span class="lbl">Policy No</span><span class="val">${admission.policy_number}</span></div>` : ''}
      </div>
    </div>

    <h3 style="font-size:12px;font-weight:700;color:#1a3a5c;margin:16px 0 8px;">Itemized Charges</h3>
    <table class="bill-table">
      <thead>
        <tr>
          <th class="c" style="width:4%">#</th>
          <th style="width:12%">Date</th>
          <th style="width:30%">Item</th>
          <th style="width:14%">Type</th>
          <th class="c" style="width:8%">Qty</th>
          <th class="r" style="width:16%">Rate</th>
          <th class="r" style="width:16%">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="7" style="text-align:center;padding:16px;color:#999">No bill items</td></tr>'}
      </tbody>
    </table>

    <div class="summary-wrap">
      <div class="summary-tbl">
        <div class="summary-row"><span class="lbl">Bill Total</span><span class="val">${formatCurrencyINR(summary.billTotal)}</span></div>
        <div class="summary-row"><span class="lbl">Total Deposits</span><span class="val" style="color:#166534">+${formatCurrencyINR(summary.totalDeposits)}</span></div>
        ${summary.totalRefunds > 0 ? `<div class="summary-row"><span class="lbl">Total Refunds</span><span class="val" style="color:#92400e">-${formatCurrencyINR(summary.totalRefunds)}</span></div>` : ''}
        <div class="summary-row"><span class="lbl">Net Deposit</span><span class="val">${formatCurrencyINR(summary.netDeposit)}</span></div>
        <div class="summary-row total">
          <span class="lbl">${summary.balance > 0 ? 'Balance Due' : 'Excess Deposit'}</span>
          <span class="val" style="color:${summary.balance > 0 ? '#dc2626' : '#166534'}">${formatCurrencyINR(Math.abs(summary.balance))}</span>
        </div>
      </div>
    </div>

    <div class="words-box">
      <strong>Amount in words:</strong> ${numberToWordsINR(summary.billTotal)}
    </div>

    ${deposits.length > 0 ? `
      <h3 style="font-size:12px;font-weight:700;color:#1a3a5c;margin:16px 0 8px;">Payment / Deposit History</h3>
      <table class="bill-table">
        <thead>
          <tr>
            <th style="width:18%">Date</th>
            <th style="width:15%">Type</th>
            <th style="width:22%">Receipt #</th>
            <th style="width:20%">Mode</th>
            <th class="r" style="width:25%">Amount</th>
          </tr>
        </thead>
        <tbody>${depositRows}</tbody>
      </table>
    ` : ''}

    <div class="footer">
      <div class="barcode">${admission.admission_number}</div>
      <div class="sig"><div class="sig-line">Patient / Attendant</div></div>
      <div class="sig"><div class="sig-line">Authorized Signature</div></div>
    </div>

    <div class="thank-you">Thank you for choosing WellNotes Healthcare. Wishing you a speedy recovery!</div>
  `;

  openPrintWindow(`IPD_Bill_${admission.admission_number}`, html);
}
