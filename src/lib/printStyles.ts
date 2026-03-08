/**
 * Shared print styles and utilities for OPD Bill, IPD Bill, and Discharge Summary.
 */

export const HOSPITAL_HEADER = {
  name: 'WellNotes Healthcare',
  tagline: 'Multi-Specialty Hospital & Research Centre',
  address: '123 Healthcare Avenue, Medical District, City - 400001',
  phone: '+91 22 1234 5678',
  email: 'info@wellnotes.in',
  gstin: '27AAAAA0000A1Z5',
  regNo: 'MH/2024/12345',
};

export function numberToWordsINR(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero Rupees Only';
  const rupees = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - rupees) * 100);

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return (tens[Math.floor(n / 10)] + ' ' + ones[n % 10]).trim();
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + convert(n % 100);
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand ' + convert(n % 1000);
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh ' + convert(n % 100000);
    return convert(Math.floor(n / 10000000)) + ' Crore ' + convert(n % 10000000);
  }

  let words = convert(rupees).trim() + ' Rupees';
  if (paise > 0) words += ' and ' + convert(paise).trim() + ' Paise';
  return words + ' Only';
}

export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
}

export function formatDateIN(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function calculateAge(dob: string | null): string {
  if (!dob) return '-';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}

export function openPrintWindow(title: string, bodyHTML: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print documents');
    return;
  }
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #1a1a2e; font-size: 11px; line-height: 1.5; }
  .page { max-width: 210mm; margin: 0 auto; padding: 12mm 15mm; }
  
  /* Header */
  .hdr { text-align: center; padding-bottom: 10px; margin-bottom: 14px; border-bottom: 3px double #1a3a5c; }
  .hdr h1 { font-size: 22px; font-weight: 800; color: #1a3a5c; letter-spacing: 1.5px; margin-bottom: 2px; }
  .hdr .tagline { font-size: 10px; color: #5a7a9a; font-weight: 500; margin-bottom: 6px; }
  .hdr .contact { font-size: 9px; color: #888; line-height: 1.6; }
  
  /* Document title */
  .doc-title { text-align: center; font-size: 13px; font-weight: 700; color: #fff; background: #1a3a5c; padding: 6px 0; margin-bottom: 14px; letter-spacing: 1px; border-radius: 3px; }
  
  /* Info grid */
  .info-grid { display: flex; gap: 16px; margin-bottom: 14px; }
  .info-box { flex: 1; padding: 10px 12px; border: 1px solid #e0e6ed; border-radius: 6px; background: #f8fafc; }
  .info-box h4 { font-size: 8px; color: #8899aa; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; font-weight: 700; }
  .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 10.5px; }
  .info-row .lbl { color: #6b7d8e; }
  .info-row .val { font-weight: 600; color: #1a2a3a; }
  
  /* Table */
  .bill-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .bill-table th { background: #1a3a5c; color: #fff; padding: 7px 10px; text-align: left; font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .bill-table th.r { text-align: right; }
  .bill-table th.c { text-align: center; }
  .bill-table td { padding: 7px 10px; border-bottom: 1px solid #eef1f5; font-size: 10.5px; }
  .bill-table td.r { text-align: right; font-family: 'Consolas', monospace; }
  .bill-table td.c { text-align: center; }
  .bill-table tr:nth-child(even) { background: #f8fafc; }
  .bill-table .type-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; background: #e8f0fe; color: #1a3a5c; }
  
  /* Summary */
  .summary-wrap { display: flex; justify-content: flex-end; margin-bottom: 10px; }
  .summary-tbl { width: 260px; }
  .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10.5px; border-bottom: 1px solid #f0f0f0; }
  .summary-row .lbl { color: #6b7d8e; }
  .summary-row .val { font-family: 'Consolas', monospace; font-weight: 500; }
  .summary-row.total { border-top: 2px solid #1a3a5c; border-bottom: none; padding-top: 8px; margin-top: 4px; }
  .summary-row.total .lbl, .summary-row.total .val { font-size: 14px; font-weight: 800; color: #1a3a5c; }
  
  /* Amount words */
  .words-box { padding: 8px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; font-size: 10px; font-style: italic; margin-bottom: 10px; }
  
  /* Payment info */
  .payment-bar { display: flex; justify-content: space-between; padding: 8px 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 4px; font-size: 10.5px; margin-bottom: 16px; }
  .payment-bar .paid { color: #166534; font-weight: 700; }
  
  /* Section */
  .section { margin-bottom: 12px; }
  .section h3 { font-size: 11px; font-weight: 700; color: #1a3a5c; border-bottom: 1px solid #e0e6ed; padding-bottom: 3px; margin-bottom: 6px; }
  .section p { font-size: 10.5px; white-space: pre-wrap; line-height: 1.6; color: #333; }
  
  /* Footer */
  .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
  .sig { text-align: center; }
  .sig-line { width: 180px; border-top: 1px solid #333; padding-top: 4px; font-size: 10px; color: #555; margin-top: 50px; }
  .barcode { font-family: monospace; font-size: 11px; letter-spacing: 2px; color: #888; }
  .thank-you { text-align: center; margin-top: 16px; padding-top: 8px; border-top: 1px dashed #ccc; font-size: 10px; color: #888; }
  
  /* Badges for discharge */
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; margin-right: 6px; }
  .badge-green { background: #d1fae5; color: #166534; }
  .badge-amber { background: #fef3c7; color: #92400e; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-gray { background: #f3f4f6; color: #374151; }
  
  @media print {
    body { padding: 0; }
    @page { margin: 8mm; size: A4; }
    .no-print { display: none !important; }
  }
  
  .no-print { text-align: center; margin: 20px 0; }
  .no-print button { padding: 8px 24px; font-size: 13px; cursor: pointer; border: 1px solid #ccc; border-radius: 6px; background: #1a3a5c; color: #fff; margin: 0 4px; }
  .no-print button.outline { background: #fff; color: #333; }
</style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">🖨️ Print</button>
    <button onclick="savePDF()" id="pdfBtn" style="display:none;">📄 Save PDF</button>
    <button class="outline" onclick="window.close()">✕ Close</button>
  </div>
  <div class="page">
    ${bodyHTML}
  </div>
</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
}

export function hospitalHeaderHTML(): string {
  const h = HOSPITAL_HEADER;
  return `
    <div class="hdr">
      <h1>${h.name.toUpperCase()}</h1>
      <div class="tagline">${h.tagline}</div>
      <div class="contact">
        ${h.address}<br/>
        Phone: ${h.phone} | Email: ${h.email}<br/>
        GSTIN: ${h.gstin} | Reg. No: ${h.regNo}
      </div>
    </div>`;
}
