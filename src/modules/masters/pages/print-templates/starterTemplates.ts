/**
 * Pre-built starter templates that users can load as starting points.
 * These are fabric.js JSON canvases with placeholder variables.
 */

import { PAGE_SIZES, MM_TO_PX } from './types';

function px(mm: number) { return Math.round(mm * MM_TO_PX); }

function makeTextbox(text: string, left: number, top: number, opts: Record<string, unknown> = {}) {
  return {
    type: 'Textbox',
    text,
    left: px(left),
    top: px(top),
    fontSize: opts.fontSize ?? 12,
    fontWeight: opts.fontWeight ?? 'normal',
    fontStyle: opts.fontStyle ?? 'normal',
    fontFamily: opts.fontFamily ?? 'Arial',
    fill: opts.fill ?? '#000000',
    textAlign: opts.textAlign ?? 'left',
    width: px(opts.width as number ?? 80),
    editable: true,
    splitByGrapheme: false,
    ...opts,
    // Remove non-fabric props
  };
}

function makeLine(x1mm: number, y1mm: number, x2mm: number, y2mm: number, opts: Record<string, unknown> = {}) {
  return {
    type: 'Line',
    x1: 0, y1: 0,
    x2: px(x2mm - x1mm), y2: px(y2mm - y1mm),
    left: px(x1mm),
    top: px(y1mm),
    stroke: opts.stroke ?? '#333333',
    strokeWidth: opts.strokeWidth ?? 1,
  };
}

function makeRect(leftMm: number, topMm: number, wMm: number, hMm: number, opts: Record<string, unknown> = {}) {
  return {
    type: 'Rect',
    left: px(leftMm),
    top: px(topMm),
    width: px(wMm),
    height: px(hMm),
    fill: opts.fill ?? 'transparent',
    stroke: opts.stroke ?? '#cccccc',
    strokeWidth: opts.strokeWidth ?? 1,
    rx: opts.rx ?? 0,
    ry: opts.ry ?? 0,
  };
}

// ─── OPD Bill Receipt ───
export function getOPDBillStarter() {
  const w = PAGE_SIZES.A4.width;
  return {
    version: '6.0.0',
    objects: [
      // Header
      makeTextbox('{{hospital_name}}', 15, 12, { fontSize: 22, fontWeight: 'bold', textAlign: 'center', width: w - 30 }),
      makeTextbox('{{hospital_address}}', 15, 22, { fontSize: 10, textAlign: 'center', width: w - 30, fill: '#555555' }),
      makeTextbox('{{hospital_phone}}', 15, 27, { fontSize: 10, textAlign: 'center', width: w - 30, fill: '#555555' }),
      makeLine(15, 33, w - 15, 33, { strokeWidth: 2, stroke: '#000000' }),
      
      // Title
      makeTextbox('OPD BILL RECEIPT', 15, 36, { fontSize: 16, fontWeight: 'bold', textAlign: 'center', width: w - 30 }),
      
      // Bill info row
      makeTextbox('Bill No: {{bill_number}}', 15, 46, { fontSize: 11, fontWeight: 'bold', width: 90 }),
      makeTextbox('Date: {{bill_date}}', w - 105, 46, { fontSize: 11, textAlign: 'right', width: 90 }),
      
      // Patient details box
      makeRect(15, 54, w - 30, 30, { stroke: '#dddddd', rx: 2, ry: 2 }),
      makeTextbox('Patient: {{patient_name}}', 18, 57, { fontSize: 11, fontWeight: 'bold', width: 85 }),
      makeTextbox('UHID: {{uhid}}', 110, 57, { fontSize: 11, width: 85 }),
      makeTextbox('Age/Gender: {{age_gender}}', 18, 64, { fontSize: 11, width: 85 }),
      makeTextbox('Phone: {{phone}}', 110, 64, { fontSize: 11, width: 85 }),
      makeTextbox('Doctor: {{doctor_name}}', 18, 71, { fontSize: 11, width: 85 }),
      makeTextbox('Dept: {{department}}', 110, 71, { fontSize: 11, width: 85 }),
      
      // Separator
      makeLine(15, 88, w - 15, 88),
      
      // Items header
      makeTextbox('{{items_table}}', 15, 92, { fontSize: 11, width: w - 30 }),
      
      // Totals
      makeLine(15, 220, w - 15, 220),
      makeTextbox('Subtotal:', 110, 224, { fontSize: 11, width: 45, textAlign: 'right' }),
      makeTextbox('{{subtotal}}', 158, 224, { fontSize: 11, fontWeight: 'bold', width: 37, textAlign: 'right' }),
      makeTextbox('Discount:', 110, 231, { fontSize: 11, width: 45, textAlign: 'right' }),
      makeTextbox('{{discount}}', 158, 231, { fontSize: 11, width: 37, textAlign: 'right' }),
      makeTextbox('GST:', 110, 238, { fontSize: 11, width: 45, textAlign: 'right' }),
      makeTextbox('{{gst_amount}}', 158, 238, { fontSize: 11, width: 37, textAlign: 'right' }),
      makeLine(110, 245, w - 15, 245, { strokeWidth: 2 }),
      makeTextbox('TOTAL:', 110, 248, { fontSize: 13, fontWeight: 'bold', width: 45, textAlign: 'right' }),
      makeTextbox('{{total_amount}}', 158, 248, { fontSize: 13, fontWeight: 'bold', width: 37, textAlign: 'right' }),
      
      // Payment info
      makeTextbox('Payment: {{payment_mode}}', 15, 258, { fontSize: 10, fill: '#555555', width: 90 }),
      makeTextbox('{{amount_in_words}}', 15, 265, { fontSize: 9, fontStyle: 'italic', fill: '#777777', width: w - 30 }),
      
      // Footer
      makeLine(15, 275, w - 15, 275),
      makeTextbox('Thank you for choosing our hospital. Get well soon!', 15, 278, { fontSize: 9, textAlign: 'center', fill: '#888888', width: w - 30 }),
    ],
    background: '#ffffff',
  };
}

// ─── Prescription ───
export function getPrescriptionStarter() {
  const w = PAGE_SIZES.A4.width;
  return {
    version: '6.0.0',
    objects: [
      // Header
      makeTextbox('{{hospital_name}}', 15, 10, { fontSize: 20, fontWeight: 'bold', textAlign: 'center', width: w - 30 }),
      makeTextbox('{{hospital_address}} | {{hospital_phone}}', 15, 19, { fontSize: 9, textAlign: 'center', width: w - 30, fill: '#666666' }),
      makeLine(15, 25, w - 15, 25, { strokeWidth: 2 }),
      
      // Doctor info
      makeTextbox('{{doctor_name}}', 15, 28, { fontSize: 14, fontWeight: 'bold', width: 100 }),
      makeTextbox('{{doctor_qualification}}', 15, 34, { fontSize: 10, fill: '#555555', width: 100 }),
      makeTextbox('Reg. No: {{doctor_registration}}', 15, 39, { fontSize: 9, fill: '#777777', width: 100 }),
      makeTextbox('Date: {{date}}', w - 75, 28, { fontSize: 11, textAlign: 'right', width: 60 }),
      
      makeLine(15, 45, w - 15, 45),
      
      // Patient info
      makeTextbox('Patient: {{patient_name}}', 15, 48, { fontSize: 11, fontWeight: 'bold', width: 90 }),
      makeTextbox('UHID: {{uhid}}', 110, 48, { fontSize: 11, width: 85 }),
      makeTextbox('Age/Gender: {{age_gender}}', 15, 55, { fontSize: 11, width: 90 }),
      makeTextbox('Phone: {{phone}}', 110, 55, { fontSize: 11, width: 85 }),
      
      makeLine(15, 62, w - 15, 62),
      
      // Diagnosis
      makeTextbox('Diagnosis: {{diagnosis}}', 15, 65, { fontSize: 11, fontWeight: 'bold', width: w - 30 }),
      makeTextbox('C/C: {{chief_complaint}}', 15, 72, { fontSize: 11, width: w - 30, fill: '#333333' }),
      
      makeLine(15, 80, w - 15, 80),
      
      // Rx
      makeTextbox('{{rx_symbol}}', 15, 84, { fontSize: 28, fontWeight: 'bold', fontStyle: 'italic', fill: '#1a56db', width: 20 }),
      makeTextbox('{{medicines_list}}', 35, 88, { fontSize: 11, width: w - 50 }),
      
      // Advice
      makeLine(15, 220, w - 15, 220),
      makeTextbox('Advice:', 15, 224, { fontSize: 11, fontWeight: 'bold', width: 30 }),
      makeTextbox('{{advice}}', 48, 224, { fontSize: 11, width: w - 63 }),
      
      // Follow up
      makeTextbox('Follow Up: {{follow_up}}', 15, 240, { fontSize: 11, fontWeight: 'bold', width: w - 30 }),
      
      // Signature
      makeLine(w - 75, 270, w - 15, 270),
      makeTextbox('{{doctor_name}}', w - 75, 272, { fontSize: 10, textAlign: 'center', width: 60 }),
      makeTextbox('Signature', w - 75, 278, { fontSize: 8, textAlign: 'center', fill: '#999999', width: 60 }),
    ],
    background: '#ffffff',
  };
}

// ─── Patient Sticker ───
export function getPatientStickerStarter() {
  return {
    version: '6.0.0',
    objects: [
      makeRect(2, 2, 76, 46, { stroke: '#000000', rx: 3, ry: 3 }),
      makeTextbox('{{patient_name}}', 5, 5, { fontSize: 14, fontWeight: 'bold', width: 70 }),
      makeTextbox('UHID: {{uhid}}', 5, 13, { fontSize: 11, width: 70 }),
      makeTextbox('{{age_gender}} | Blood: {{blood_group}}', 5, 19, { fontSize: 10, width: 70 }),
      makeTextbox('Ph: {{phone}}', 5, 25, { fontSize: 10, fill: '#555555', width: 70 }),
      makeTextbox('{{qr_code}}', 55, 30, { fontSize: 9, width: 20, textAlign: 'center', fill: '#999999' }),
    ],
    background: '#ffffff',
  };
}

// ─── Discharge Summary ───
export function getDischargeSummaryStarter() {
  const w = PAGE_SIZES.A4.width;
  return {
    version: '6.0.0',
    objects: [
      makeTextbox('{{hospital_name}}', 15, 10, { fontSize: 20, fontWeight: 'bold', textAlign: 'center', width: w - 30 }),
      makeTextbox('{{hospital_address}}', 15, 19, { fontSize: 9, textAlign: 'center', width: w - 30, fill: '#666666' }),
      makeLine(15, 25, w - 15, 25, { strokeWidth: 2 }),
      
      makeTextbox('DISCHARGE SUMMARY', 15, 28, { fontSize: 16, fontWeight: 'bold', textAlign: 'center', width: w - 30 }),
      makeLine(15, 36, w - 15, 36),
      
      // Patient box
      makeRect(15, 39, w - 30, 30, { stroke: '#cccccc' }),
      makeTextbox('Patient: {{patient_name}}', 18, 42, { fontSize: 11, fontWeight: 'bold', width: 85 }),
      makeTextbox('UHID: {{uhid}}', 110, 42, { fontSize: 11, width: 85 }),
      makeTextbox('Age/Gender: {{age_gender}}', 18, 49, { fontSize: 11, width: 85 }),
      makeTextbox('IPD No: {{ipd_number}}', 110, 49, { fontSize: 11, width: 85 }),
      makeTextbox('Ward/Bed: {{ward_bed}}', 18, 56, { fontSize: 11, width: 85 }),
      makeTextbox('Doctor: {{doctor_name}}', 110, 56, { fontSize: 11, width: 85 }),
      
      // Dates
      makeTextbox('Admission: {{admission_date}}', 15, 74, { fontSize: 11, width: 90 }),
      makeTextbox('Discharge: {{discharge_date}}', 110, 74, { fontSize: 11, width: 85 }),
      
      makeLine(15, 82, w - 15, 82),
      
      makeTextbox('Diagnosis:', 15, 85, { fontSize: 12, fontWeight: 'bold', width: w - 30 }),
      makeTextbox('{{diagnosis}}', 15, 92, { fontSize: 11, width: w - 30 }),
      
      makeTextbox('Treatment Given:', 15, 105, { fontSize: 12, fontWeight: 'bold', width: w - 30 }),
      makeTextbox('{{treatment_given}}', 15, 112, { fontSize: 11, width: w - 30 }),
      
      makeTextbox('Procedures:', 15, 130, { fontSize: 12, fontWeight: 'bold', width: w - 30 }),
      makeTextbox('{{procedures}}', 15, 137, { fontSize: 11, width: w - 30 }),
      
      makeTextbox('Condition at Discharge:', 15, 155, { fontSize: 12, fontWeight: 'bold', width: w - 30 }),
      makeTextbox('{{discharge_condition}}', 15, 162, { fontSize: 11, width: w - 30 }),
      
      makeTextbox('Medications on Discharge:', 15, 175, { fontSize: 12, fontWeight: 'bold', width: w - 30 }),
      makeTextbox('{{medications_on_discharge}}', 15, 182, { fontSize: 11, width: w - 30 }),
      
      makeTextbox('Follow Up:', 15, 210, { fontSize: 12, fontWeight: 'bold', width: 90 }),
      makeTextbox('{{follow_up}}', 55, 210, { fontSize: 11, width: w - 70 }),
      
      makeTextbox('Special Instructions:', 15, 220, { fontSize: 12, fontWeight: 'bold', width: w - 30 }),
      makeTextbox('{{special_instructions}}', 15, 227, { fontSize: 11, width: w - 30 }),
      
      // Signature
      makeLine(w - 75, 270, w - 15, 270),
      makeTextbox('{{doctor_name}}', w - 75, 272, { fontSize: 10, textAlign: 'center', width: 60 }),
    ],
    background: '#ffffff',
  };
}

// ─── Payment Receipt ───
export function getPaymentReceiptStarter() {
  const w = PAGE_SIZES.A4.width;
  return {
    version: '6.0.0',
    objects: [
      makeTextbox('{{hospital_name}}', 15, 12, { fontSize: 20, fontWeight: 'bold', textAlign: 'center', width: w - 30 }),
      makeTextbox('{{hospital_address}} | {{hospital_phone}}', 15, 21, { fontSize: 9, textAlign: 'center', fill: '#666666', width: w - 30 }),
      makeLine(15, 28, w - 15, 28, { strokeWidth: 2 }),
      
      makeTextbox('PAYMENT RECEIPT', 15, 32, { fontSize: 16, fontWeight: 'bold', textAlign: 'center', width: w - 30 }),
      
      makeTextbox('Receipt No: {{receipt_number}}', 15, 44, { fontSize: 11, fontWeight: 'bold', width: 90 }),
      makeTextbox('Date: {{receipt_date}}', w - 105, 44, { fontSize: 11, textAlign: 'right', width: 90 }),
      
      makeLine(15, 52, w - 15, 52),
      
      makeTextbox('Received from: {{patient_name}}', 15, 56, { fontSize: 12, width: w - 30 }),
      makeTextbox('UHID: {{uhid}}', 15, 64, { fontSize: 11, width: 90 }),
      makeTextbox('Against Bill: {{bill_number}}', 110, 64, { fontSize: 11, width: 85 }),
      
      makeLine(15, 74, w - 15, 74),
      
      makeRect(15, 78, w - 30, 20, { fill: '#f0f0f0', stroke: '#cccccc' }),
      makeTextbox('Amount Paid: {{amount_paid}}', 18, 83, { fontSize: 16, fontWeight: 'bold', width: w - 36 }),
      
      makeTextbox('Payment Mode: {{payment_mode}}', 15, 104, { fontSize: 11, width: w - 30 }),
      makeTextbox('Amount in words: {{amount_in_words}}', 15, 112, { fontSize: 10, fontStyle: 'italic', fill: '#555555', width: w - 30 }),
      
      makeLine(15, 125, w - 15, 125),
      makeTextbox('Received By: {{received_by}}', 15, 130, { fontSize: 11, width: 90 }),
      
      makeLine(w - 75, 150, w - 15, 150),
      makeTextbox('Authorized Signatory', w - 75, 152, { fontSize: 9, textAlign: 'center', fill: '#999999', width: 60 }),
    ],
    background: '#ffffff',
  };
}

export const STARTER_TEMPLATES: Record<string, () => Record<string, unknown>> = {
  opd_bill: getOPDBillStarter,
  prescription: getPrescriptionStarter,
  patient_sticker: getPatientStickerStarter,
  discharge_summary: getDischargeSummaryStarter,
  payment_receipt: getPaymentReceiptStarter,
};
