export interface PrintTemplate {
  id: string;
  hospital_id: string;
  document_type: string;
  template_name: string;
  canvas_json: Record<string, unknown>;
  page_size: string;
  page_width_mm: number;
  page_height_mm: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface DocumentTypeConfig {
  key: string;
  label: string;
  fields: TemplateField[];
}

export interface TemplateField {
  variable: string;
  label: string;
  sampleValue: string;
}

export const PAGE_SIZES: Record<string, { label: string; width: number; height: number }> = {
  A4: { label: 'A4 (210 x 297 mm)', width: 210, height: 297 },
  A5: { label: 'A5 (148 x 210 mm)', width: 148, height: 210 },
  thermal_80mm: { label: 'Thermal 80mm', width: 80, height: 200 },
  thermal_58mm: { label: 'Thermal 58mm', width: 58, height: 200 },
  custom: { label: 'Custom', width: 210, height: 297 },
};

export const MM_TO_PX = 3.7795275591;

export const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  {
    key: 'opd_bill',
    label: 'OPD Bill Receipt',
    fields: [
      { variable: '{{hospital_name}}', label: 'Hospital Name', sampleValue: 'City General Hospital' },
      { variable: '{{hospital_address}}', label: 'Hospital Address', sampleValue: '123 Main Street, Mumbai' },
      { variable: '{{hospital_phone}}', label: 'Hospital Phone', sampleValue: '+91 22 1234 5678' },
      { variable: '{{hospital_logo}}', label: 'Hospital Logo', sampleValue: '' },
      { variable: '{{bill_number}}', label: 'Bill Number', sampleValue: 'OPD-2024-001' },
      { variable: '{{bill_date}}', label: 'Bill Date', sampleValue: '24-Feb-2026' },
      { variable: '{{patient_name}}', label: 'Patient Name', sampleValue: 'Rajesh Kumar' },
      { variable: '{{uhid}}', label: 'UHID', sampleValue: 'UH-0001' },
      { variable: '{{age_gender}}', label: 'Age / Gender', sampleValue: '45 / Male' },
      { variable: '{{phone}}', label: 'Phone', sampleValue: '+91 98765 43210' },
      { variable: '{{doctor_name}}', label: 'Doctor Name', sampleValue: 'Dr. Sharma' },
      { variable: '{{department}}', label: 'Department', sampleValue: 'General Medicine' },
      { variable: '{{items_table}}', label: 'Bill Items Table', sampleValue: '[Service items with amounts]' },
      { variable: '{{subtotal}}', label: 'Subtotal', sampleValue: 'Rs. 1,500' },
      { variable: '{{discount}}', label: 'Discount', sampleValue: 'Rs. 0' },
      { variable: '{{gst_amount}}', label: 'GST Amount', sampleValue: 'Rs. 270' },
      { variable: '{{total_amount}}', label: 'Total Amount', sampleValue: 'Rs. 1,770' },
      { variable: '{{paid_amount}}', label: 'Paid Amount', sampleValue: 'Rs. 1,770' },
      { variable: '{{balance_due}}', label: 'Balance Due', sampleValue: 'Rs. 0' },
      { variable: '{{payment_mode}}', label: 'Payment Mode', sampleValue: 'Cash' },
      { variable: '{{amount_in_words}}', label: 'Amount in Words', sampleValue: 'One Thousand Seven Hundred Seventy Rupees' },
    ],
  },
  {
    key: 'ipd_bill',
    label: 'IPD Bill Receipt',
    fields: [
      { variable: '{{hospital_name}}', label: 'Hospital Name', sampleValue: 'City General Hospital' },
      { variable: '{{hospital_address}}', label: 'Hospital Address', sampleValue: '123 Main Street, Mumbai' },
      { variable: '{{hospital_phone}}', label: 'Hospital Phone', sampleValue: '+91 22 1234 5678' },
      { variable: '{{hospital_logo}}', label: 'Hospital Logo', sampleValue: '' },
      { variable: '{{bill_number}}', label: 'Bill Number', sampleValue: 'IPD-2024-015' },
      { variable: '{{bill_date}}', label: 'Bill Date', sampleValue: '24-Feb-2026' },
      { variable: '{{patient_name}}', label: 'Patient Name', sampleValue: 'Rajesh Kumar' },
      { variable: '{{uhid}}', label: 'UHID', sampleValue: 'UH-0001' },
      { variable: '{{ipd_number}}', label: 'IPD Number', sampleValue: 'IPD-2024-008' },
      { variable: '{{admission_date}}', label: 'Admission Date', sampleValue: '18-Feb-2026' },
      { variable: '{{discharge_date}}', label: 'Discharge Date', sampleValue: '24-Feb-2026' },
      { variable: '{{ward_bed}}', label: 'Ward / Bed', sampleValue: 'General Ward / B-12' },
      { variable: '{{doctor_name}}', label: 'Doctor Name', sampleValue: 'Dr. Sharma' },
      { variable: '{{items_table}}', label: 'Bill Items Table', sampleValue: '[Charges breakdown]' },
      { variable: '{{subtotal}}', label: 'Subtotal', sampleValue: 'Rs. 25,000' },
      { variable: '{{discount}}', label: 'Discount', sampleValue: 'Rs. 2,000' },
      { variable: '{{gst_amount}}', label: 'GST Amount', sampleValue: 'Rs. 4,140' },
      { variable: '{{total_amount}}', label: 'Total Amount', sampleValue: 'Rs. 27,140' },
      { variable: '{{paid_amount}}', label: 'Paid Amount', sampleValue: 'Rs. 20,000' },
      { variable: '{{balance_due}}', label: 'Balance Due', sampleValue: 'Rs. 7,140' },
      { variable: '{{payment_mode}}', label: 'Payment Mode', sampleValue: 'Card' },
    ],
  },
  {
    key: 'prescription',
    label: 'Prescription',
    fields: [
      { variable: '{{hospital_name}}', label: 'Hospital Name', sampleValue: 'City General Hospital' },
      { variable: '{{hospital_address}}', label: 'Hospital Address', sampleValue: '123 Main Street, Mumbai' },
      { variable: '{{hospital_phone}}', label: 'Hospital Phone', sampleValue: '+91 22 1234 5678' },
      { variable: '{{hospital_logo}}', label: 'Hospital Logo', sampleValue: '' },
      { variable: '{{doctor_name}}', label: 'Doctor Name', sampleValue: 'Dr. A. Sharma' },
      { variable: '{{doctor_qualification}}', label: 'Doctor Qualification', sampleValue: 'MBBS, MD' },
      { variable: '{{doctor_registration}}', label: 'Registration No.', sampleValue: 'MCI-12345' },
      { variable: '{{date}}', label: 'Date', sampleValue: '24-Feb-2026' },
      { variable: '{{patient_name}}', label: 'Patient Name', sampleValue: 'Rajesh Kumar' },
      { variable: '{{uhid}}', label: 'UHID', sampleValue: 'UH-0001' },
      { variable: '{{age_gender}}', label: 'Age / Gender', sampleValue: '45 / Male' },
      { variable: '{{phone}}', label: 'Phone', sampleValue: '+91 98765 43210' },
      { variable: '{{diagnosis}}', label: 'Diagnosis', sampleValue: 'Acute Bronchitis' },
      { variable: '{{chief_complaint}}', label: 'Chief Complaint', sampleValue: 'Persistent cough for 5 days' },
      { variable: '{{medicines_list}}', label: 'Medicines List', sampleValue: '1. Tab Amoxicillin 500mg\n   1-0-1 x 5 days\n2. Syr. Benadryl 5ml\n   TDS x 3 days' },
      { variable: '{{advice}}', label: 'Advice', sampleValue: 'Drink warm fluids. Rest for 3 days.' },
      { variable: '{{follow_up}}', label: 'Follow Up', sampleValue: '01-Mar-2026' },
      { variable: '{{rx_symbol}}', label: 'Rx Symbol', sampleValue: 'Rx' },
    ],
  },
  {
    key: 'discharge_summary',
    label: 'Discharge Summary',
    fields: [
      { variable: '{{hospital_name}}', label: 'Hospital Name', sampleValue: 'City General Hospital' },
      { variable: '{{hospital_address}}', label: 'Hospital Address', sampleValue: '123 Main Street, Mumbai' },
      { variable: '{{hospital_logo}}', label: 'Hospital Logo', sampleValue: '' },
      { variable: '{{patient_name}}', label: 'Patient Name', sampleValue: 'Rajesh Kumar' },
      { variable: '{{uhid}}', label: 'UHID', sampleValue: 'UH-0001' },
      { variable: '{{age_gender}}', label: 'Age / Gender', sampleValue: '45 / Male' },
      { variable: '{{ipd_number}}', label: 'IPD Number', sampleValue: 'IPD-2024-008' },
      { variable: '{{admission_date}}', label: 'Admission Date', sampleValue: '18-Feb-2026' },
      { variable: '{{discharge_date}}', label: 'Discharge Date', sampleValue: '24-Feb-2026' },
      { variable: '{{doctor_name}}', label: 'Doctor Name', sampleValue: 'Dr. Sharma' },
      { variable: '{{department}}', label: 'Department', sampleValue: 'General Medicine' },
      { variable: '{{ward_bed}}', label: 'Ward / Bed', sampleValue: 'General Ward / B-12' },
      { variable: '{{diagnosis}}', label: 'Diagnosis', sampleValue: 'Community Acquired Pneumonia' },
      { variable: '{{treatment_given}}', label: 'Treatment Given', sampleValue: 'IV Antibiotics, Nebulization, Supportive care' },
      { variable: '{{procedures}}', label: 'Procedures', sampleValue: 'Chest X-Ray, Blood culture' },
      { variable: '{{discharge_condition}}', label: 'Discharge Condition', sampleValue: 'Improved' },
      { variable: '{{medications_on_discharge}}', label: 'Medications on Discharge', sampleValue: '1. Tab Augmentin 625mg BD x 5 days' },
      { variable: '{{follow_up}}', label: 'Follow Up', sampleValue: '01-Mar-2026' },
      { variable: '{{special_instructions}}', label: 'Special Instructions', sampleValue: 'Complete rest for 1 week' },
    ],
  },
  {
    key: 'opd_case_paper',
    label: 'OPD Case Paper',
    fields: [
      { variable: '{{hospital_name}}', label: 'Hospital Name', sampleValue: 'City General Hospital' },
      { variable: '{{hospital_logo}}', label: 'Hospital Logo', sampleValue: '' },
      { variable: '{{patient_name}}', label: 'Patient Name', sampleValue: 'Rajesh Kumar' },
      { variable: '{{uhid}}', label: 'UHID', sampleValue: 'UH-0001' },
      { variable: '{{age_gender}}', label: 'Age / Gender', sampleValue: '45 / Male' },
      { variable: '{{phone}}', label: 'Phone', sampleValue: '+91 98765 43210' },
      { variable: '{{address}}', label: 'Address', sampleValue: 'Mumbai, Maharashtra' },
      { variable: '{{doctor_name}}', label: 'Doctor Name', sampleValue: 'Dr. Sharma' },
      { variable: '{{department}}', label: 'Department', sampleValue: 'General Medicine' },
      { variable: '{{date}}', label: 'Date', sampleValue: '24-Feb-2026' },
      { variable: '{{token_number}}', label: 'Token Number', sampleValue: '15' },
      { variable: '{{visit_type}}', label: 'Visit Type', sampleValue: 'First Visit' },
      { variable: '{{chief_complaint}}', label: 'Chief Complaint', sampleValue: 'Fever and cough' },
      { variable: '{{examination}}', label: 'Examination', sampleValue: '' },
      { variable: '{{diagnosis}}', label: 'Diagnosis', sampleValue: '' },
      { variable: '{{vitals_block}}', label: 'Vitals Block', sampleValue: 'BP: 120/80 | Pulse: 78 | Temp: 99.2F' },
    ],
  },
  {
    key: 'patient_sticker',
    label: 'Patient Sticker',
    fields: [
      { variable: '{{patient_name}}', label: 'Patient Name', sampleValue: 'Rajesh Kumar' },
      { variable: '{{uhid}}', label: 'UHID', sampleValue: 'UH-0001' },
      { variable: '{{age_gender}}', label: 'Age / Gender', sampleValue: '45 / Male' },
      { variable: '{{phone}}', label: 'Phone', sampleValue: '+91 98765 43210' },
      { variable: '{{blood_group}}', label: 'Blood Group', sampleValue: 'B+' },
      { variable: '{{qr_code}}', label: 'QR Code', sampleValue: '[QR]' },
    ],
  },
  {
    key: 'ipd_label',
    label: 'IPD Label',
    fields: [
      { variable: '{{patient_name}}', label: 'Patient Name', sampleValue: 'Rajesh Kumar' },
      { variable: '{{uhid}}', label: 'UHID', sampleValue: 'UH-0001' },
      { variable: '{{age_gender}}', label: 'Age / Gender', sampleValue: '45 / Male' },
      { variable: '{{blood_group}}', label: 'Blood Group', sampleValue: 'B+' },
      { variable: '{{ipd_number}}', label: 'IPD Number', sampleValue: 'IPD-2024-008' },
      { variable: '{{ward_bed}}', label: 'Ward / Bed', sampleValue: 'General Ward / B-12' },
      { variable: '{{doctor_name}}', label: 'Doctor Name', sampleValue: 'Dr. Sharma' },
      { variable: '{{admission_date}}', label: 'Admission Date', sampleValue: '18-Feb-2026' },
      { variable: '{{qr_code}}', label: 'QR Code', sampleValue: '[QR]' },
    ],
  },
  {
    key: 'payment_receipt',
    label: 'Payment Receipt',
    fields: [
      { variable: '{{hospital_name}}', label: 'Hospital Name', sampleValue: 'City General Hospital' },
      { variable: '{{hospital_address}}', label: 'Hospital Address', sampleValue: '123 Main Street, Mumbai' },
      { variable: '{{hospital_phone}}', label: 'Hospital Phone', sampleValue: '+91 22 1234 5678' },
      { variable: '{{hospital_logo}}', label: 'Hospital Logo', sampleValue: '' },
      { variable: '{{receipt_number}}', label: 'Receipt Number', sampleValue: 'RCP-2024-042' },
      { variable: '{{receipt_date}}', label: 'Receipt Date', sampleValue: '24-Feb-2026' },
      { variable: '{{patient_name}}', label: 'Patient Name', sampleValue: 'Rajesh Kumar' },
      { variable: '{{uhid}}', label: 'UHID', sampleValue: 'UH-0001' },
      { variable: '{{bill_number}}', label: 'Against Bill', sampleValue: 'OPD-2024-001' },
      { variable: '{{amount_paid}}', label: 'Amount Paid', sampleValue: 'Rs. 1,770' },
      { variable: '{{payment_mode}}', label: 'Payment Mode', sampleValue: 'Cash' },
      { variable: '{{amount_in_words}}', label: 'Amount in Words', sampleValue: 'One Thousand Seven Hundred Seventy Rupees' },
      { variable: '{{received_by}}', label: 'Received By', sampleValue: 'Front Desk' },
    ],
  },
];
