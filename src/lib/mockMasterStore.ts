/**
 * Mock master data store — localStorage-backed.
 * Powers all master pages + IPD when no database tables exist.
 */

const MASTER_KEY = 'hms_master_store';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const H = '11111111-1111-1111-1111-111111111111';
const now = () => new Date().toISOString();

interface MasterStore {
  doctors: Record<string, unknown>[];
  departments: Record<string, unknown>[];
  medications: Record<string, unknown>[];
  symptoms: Record<string, unknown>[];
  lab_tests: Record<string, unknown>[];
  services: Record<string, unknown>[];
  packages: Record<string, unknown>[];
  gst_slabs: Record<string, unknown>[];
  visit_types: Record<string, unknown>[];
  user_roles: Record<string, unknown>[];
  custom_fields: Record<string, unknown>[];
  print_templates: Record<string, unknown>[];
  wards: Record<string, unknown>[];
  beds: Record<string, unknown>[];
  admissions: Record<string, unknown>[];
  nursing_tasks: Record<string, unknown>[];
  ipd_vitals: Record<string, unknown>[];
  nursing_notes: Record<string, unknown>[];
  doctor_rounds: Record<string, unknown>[];
  ipd_bill_items: Record<string, unknown>[];
  ipd_payments: Record<string, unknown>[];
  discharge_summaries: Record<string, unknown>[];
  lab_orders: Record<string, unknown>[];
  lab_order_items: Record<string, unknown>[];
  pharmacy_inventory: Record<string, unknown>[];
  pharmacy_transactions: Record<string, unknown>[];
  pharmacy_purchases: Record<string, unknown>[];
  pharmacy_sales: Record<string, unknown>[];
  hospital_config: Record<string, unknown>;
  _seeded: boolean;
}

function seedMasterData(): MasterStore {
  const deptGenMed = uuid(), deptSurgery = uuid(), deptPeds = uuid(), deptOrtho = uuid(), deptGynae = uuid();
  
  const departments = [
    { id: deptGenMed, hospital_id: H, name: 'General Medicine', code: 'MED', description: 'Internal Medicine & General Practice', is_active: true, created_at: now(), updated_at: now() },
    { id: deptSurgery, hospital_id: H, name: 'General Surgery', code: 'SUR', description: 'Surgical procedures & post-op care', is_active: true, created_at: now(), updated_at: now() },
    { id: deptPeds, hospital_id: H, name: 'Pediatrics', code: 'PED', description: 'Child healthcare', is_active: true, created_at: now(), updated_at: now() },
    { id: deptOrtho, hospital_id: H, name: 'Orthopedics', code: 'ORT', description: 'Bone & joint care', is_active: true, created_at: now(), updated_at: now() },
    { id: deptGynae, hospital_id: H, name: 'Obstetrics & Gynecology', code: 'OBG', description: 'Women health & maternity', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'ENT', code: 'ENT', description: 'Ear, Nose & Throat', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Dermatology', code: 'DER', description: 'Skin care', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Cardiology', code: 'CAR', description: 'Heart & cardiovascular', is_active: true, created_at: now(), updated_at: now() },
  ];

  const doctors = [
    { id: uuid(), hospital_id: H, employee_id: 'DR001', first_name: 'Rajesh', last_name: 'Kumar', specialty: 'General Medicine', department_id: deptGenMed, phone: '9876543201', email: 'rajesh@hospital.com', qualification: 'MBBS, MD (Medicine)', registration_number: 'MCI-12345', first_visit_fee: 500, followup_fee: 300, schedule: { monday: [{ start: '09:00', end: '17:00' }], tuesday: [{ start: '09:00', end: '17:00' }], wednesday: [{ start: '09:00', end: '17:00' }] }, is_active: true, created_at: now(), updated_at: now(), department: { name: 'General Medicine' } },
    { id: uuid(), hospital_id: H, employee_id: 'DR002', first_name: 'Priya', last_name: 'Sharma', specialty: 'General Surgery', department_id: deptSurgery, phone: '9876543202', email: 'priya@hospital.com', qualification: 'MBBS, MS (Surgery)', registration_number: 'MCI-12346', first_visit_fee: 700, followup_fee: 400, schedule: { monday: [{ start: '10:00', end: '16:00' }], thursday: [{ start: '10:00', end: '16:00' }] }, is_active: true, created_at: now(), updated_at: now(), department: { name: 'General Surgery' } },
    { id: uuid(), hospital_id: H, employee_id: 'DR003', first_name: 'Anand', last_name: 'Patel', specialty: 'Pediatrics', department_id: deptPeds, phone: '9876543203', email: 'anand@hospital.com', qualification: 'MBBS, MD (Pediatrics)', registration_number: 'MCI-12347', first_visit_fee: 600, followup_fee: 350, schedule: {}, is_active: true, created_at: now(), updated_at: now(), department: { name: 'Pediatrics' } },
    { id: uuid(), hospital_id: H, employee_id: 'DR004', first_name: 'Sneha', last_name: 'Reddy', specialty: 'Obstetrics & Gynecology', department_id: deptGynae, phone: '9876543204', email: 'sneha@hospital.com', qualification: 'MBBS, DGO', registration_number: 'MCI-12348', first_visit_fee: 600, followup_fee: 350, schedule: {}, is_active: true, created_at: now(), updated_at: now(), department: { name: 'Obstetrics & Gynecology' } },
    { id: uuid(), hospital_id: H, employee_id: 'DR005', first_name: 'Vikram', last_name: 'Singh', specialty: 'Orthopedics', department_id: deptOrtho, phone: '9876543205', email: 'vikram@hospital.com', qualification: 'MBBS, MS (Ortho)', registration_number: 'MCI-12349', first_visit_fee: 800, followup_fee: 500, schedule: {}, is_active: true, created_at: now(), updated_at: now(), department: { name: 'Orthopedics' } },
  ];

  const medications = [
    { id: uuid(), hospital_id: H, name: 'Paracetamol', generic_name: 'Paracetamol', brand_name: 'Crocin', category: 'Analgesic', dosage_form: 'Tablet', form: 'Tablet', strength: '500mg', unit: 'mg', manufacturer: 'GSK', shortcut: 'PCM', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Amoxicillin', generic_name: 'Amoxicillin', brand_name: 'Mox', category: 'Antibiotic', dosage_form: 'Capsule', form: 'Capsule', strength: '500mg', unit: 'mg', manufacturer: 'Cipla', shortcut: 'AMX', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Omeprazole', generic_name: 'Omeprazole', brand_name: 'Omez', category: 'Antacid', dosage_form: 'Capsule', form: 'Capsule', strength: '20mg', unit: 'mg', manufacturer: 'Dr. Reddy', shortcut: 'OMZ', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Metformin', generic_name: 'Metformin', brand_name: 'Glycomet', category: 'Antidiabetic', dosage_form: 'Tablet', form: 'Tablet', strength: '500mg', unit: 'mg', manufacturer: 'USV', shortcut: 'MET', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Amlodipine', generic_name: 'Amlodipine', brand_name: 'Amlong', category: 'Antihypertensive', dosage_form: 'Tablet', form: 'Tablet', strength: '5mg', unit: 'mg', manufacturer: 'Micro Labs', shortcut: 'AML', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Cetirizine', generic_name: 'Cetirizine', brand_name: 'Cetzine', category: 'Antihistamine', dosage_form: 'Tablet', form: 'Tablet', strength: '10mg', unit: 'mg', manufacturer: 'Alkem', shortcut: 'CTZ', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Azithromycin', generic_name: 'Azithromycin', brand_name: 'Azee', category: 'Antibiotic', dosage_form: 'Tablet', form: 'Tablet', strength: '500mg', unit: 'mg', manufacturer: 'Cipla', shortcut: 'AZT', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Pantoprazole', generic_name: 'Pantoprazole', brand_name: 'Pan', category: 'Antacid', dosage_form: 'Tablet', form: 'Tablet', strength: '40mg', unit: 'mg', manufacturer: 'Alkem', shortcut: 'PAN', is_active: true, created_at: now(), updated_at: now() },
  ];

  const symptoms = [
    { id: uuid(), hospital_id: H, name: 'Fever', category: 'General', description: 'Elevated body temperature above 98.6°F', shortcut: 'FVR', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Headache', category: 'Neurological', description: 'Pain in head region', shortcut: 'HDA', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Cough', category: 'Respiratory', description: 'Dry or wet cough', shortcut: 'CGH', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Body Ache', category: 'General', description: 'Generalized body pain', shortcut: 'BAC', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Nausea', category: 'Gastrointestinal', description: 'Feeling of wanting to vomit', shortcut: 'NSA', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Chest Pain', category: 'Cardiovascular', description: 'Pain or discomfort in chest', shortcut: 'CHP', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Breathlessness', category: 'Respiratory', description: 'Difficulty in breathing', shortcut: 'SOB', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Abdominal Pain', category: 'Gastrointestinal', description: 'Pain in abdomen', shortcut: 'ABP', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Dizziness', category: 'Neurological', description: 'Feeling of unsteadiness', shortcut: 'DZZ', is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, name: 'Joint Pain', category: 'Musculoskeletal', description: 'Pain in joints', shortcut: 'JNT', is_active: true, created_at: now(), updated_at: now() },
  ];

  const lab_tests = [
    { id: uuid(), hospital_id: H, test_name: 'Complete Blood Count', name: 'Complete Blood Count', test_code: 'CBC', code: 'CBC', test_category: 'Hematology', category: 'Hematology', sample_type: 'Blood', normal_range: '4.5-11.0', normal_range_male: '4.5-11.0', normal_range_female: '4.5-11.0', unit: 'x10^3/uL', test_price: 350, price: 350, is_active: true, created_at: now() },
    { id: uuid(), hospital_id: H, test_name: 'Blood Sugar Fasting', name: 'Blood Sugar Fasting', test_code: 'BSF', code: 'BSF', test_category: 'Biochemistry', category: 'Biochemistry', sample_type: 'Blood', normal_range: '70-100', unit: 'mg/dL', test_price: 150, price: 150, is_active: true, created_at: now() },
    { id: uuid(), hospital_id: H, test_name: 'Liver Function Test', name: 'Liver Function Test', test_code: 'LFT', code: 'LFT', test_category: 'Biochemistry', category: 'Biochemistry', sample_type: 'Blood', normal_range: '', unit: '', test_price: 800, price: 800, is_active: true, created_at: now() },
    { id: uuid(), hospital_id: H, test_name: 'Kidney Function Test', name: 'Kidney Function Test', test_code: 'KFT', code: 'KFT', test_category: 'Biochemistry', category: 'Biochemistry', sample_type: 'Blood', normal_range: '', unit: '', test_price: 700, price: 700, is_active: true, created_at: now() },
    { id: uuid(), hospital_id: H, test_name: 'Urine Routine', name: 'Urine Routine', test_code: 'UR', code: 'UR', test_category: 'Urinalysis', category: 'Urinalysis', sample_type: 'Urine', normal_range: '', unit: '', test_price: 200, price: 200, is_active: true, created_at: now() },
    { id: uuid(), hospital_id: H, test_name: 'Thyroid Profile', name: 'Thyroid Profile', test_code: 'TFT', code: 'TFT', test_category: 'Biochemistry', category: 'Biochemistry', sample_type: 'Blood', normal_range: 'TSH: 0.4-4.0', unit: 'mIU/L', test_price: 600, price: 600, is_active: true, created_at: now() },
    { id: uuid(), hospital_id: H, test_name: 'Chest X-Ray', name: 'Chest X-Ray', test_code: 'CXR', code: 'CXR', test_category: 'Radiology', category: 'Radiology', sample_type: 'Other', normal_range: '', unit: '', test_price: 500, price: 500, is_active: true, created_at: now() },
    { id: uuid(), hospital_id: H, test_name: 'ECG', name: 'ECG', test_code: 'ECG', code: 'ECG', test_category: 'ECG', category: 'ECG', sample_type: 'Other', normal_range: '', unit: '', test_price: 300, price: 300, is_active: true, created_at: now() },
  ];

  const services = [
    { id: uuid(), hospital_id: H, service_name: 'OPD Consultation', category: 'Consultation', service_type: 'OPD', price: 500, gst_rate: 0, hsn_code: '9993', ward_prices: null, is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, service_name: 'Dressing', category: 'Procedure', service_type: 'BOTH', price: 200, gst_rate: 0, hsn_code: '9993', ward_prices: null, is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, service_name: 'Injection Charges', category: 'Procedure', service_type: 'BOTH', price: 100, gst_rate: 0, hsn_code: '9993', ward_prices: null, is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, service_name: 'General Ward Bed', category: 'Bed Charges', service_type: 'IPD', price: 800, gst_rate: 5, hsn_code: '9963', ward_prices: { general: 800, private: 2500, icu: 5000 }, is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, service_name: 'Nebulization', category: 'Procedure', service_type: 'BOTH', price: 150, gst_rate: 0, hsn_code: '9993', ward_prices: null, is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, service_name: 'Physiotherapy Session', category: 'Therapy', service_type: 'BOTH', price: 500, gst_rate: 18, hsn_code: '9993', ward_prices: null, is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, service_name: 'Minor Surgery', category: 'Surgery', service_type: 'BOTH', price: 5000, gst_rate: 5, hsn_code: '9993', ward_prices: null, is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, service_name: 'ICU Bed Charges', category: 'Bed Charges', service_type: 'IPD', price: 5000, gst_rate: 5, hsn_code: '9963', ward_prices: null, is_active: true, created_at: now(), updated_at: now() },
  ];

  const packages = [
    { id: uuid(), hospital_id: H, package_name: 'Full Body Checkup', description: 'Comprehensive health screening', services: [{ name: 'CBC', price: 350 }, { name: 'BSF', price: 150 }, { name: 'LFT', price: 800 }, { name: 'KFT', price: 700 }, { name: 'Thyroid Profile', price: 600 }, { name: 'Urine Routine', price: 200 }, { name: 'Chest X-Ray', price: 500 }, { name: 'ECG', price: 300 }], total_price: 2999, is_active: true, created_at: now() },
    { id: uuid(), hospital_id: H, package_name: 'Diabetes Package', description: 'Diabetes monitoring tests', services: [{ name: 'BSF', price: 150 }, { name: 'HbA1c', price: 450 }, { name: 'KFT', price: 700 }], total_price: 999, is_active: true, created_at: now() },
    { id: uuid(), hospital_id: H, package_name: 'Cardiac Package', description: 'Heart health assessment', services: [{ name: 'ECG', price: 300 }, { name: 'Lipid Profile', price: 400 }, { name: 'CBC', price: 350 }], total_price: 899, is_active: true, created_at: now() },
  ];

  const gst_slabs = [
    { id: uuid(), hospital_id: H, category: 'Consultation', gst_rate: 0, hsn_code: '9993', cgst_rate: 0, sgst_rate: 0, igst_rate: 0, is_active: true, created_at: now() },
    { id: uuid(), hospital_id: H, category: 'Bed Charges', gst_rate: 5, hsn_code: '9963', cgst_rate: 2.5, sgst_rate: 2.5, igst_rate: 0, is_active: true, created_at: now() },
    { id: uuid(), hospital_id: H, category: 'Medication', gst_rate: 12, hsn_code: '3004', cgst_rate: 6, sgst_rate: 6, igst_rate: 0, is_active: true, created_at: now() },
    { id: uuid(), hospital_id: H, category: 'Therapy', gst_rate: 18, hsn_code: '9993', cgst_rate: 9, sgst_rate: 9, igst_rate: 0, is_active: true, created_at: now() },
  ];

  const visit_types = [
    { id: uuid(), hospital_id: H, visit_type_name: 'New Visit', days_threshold: 0, description: 'First-time visit or new complaint', fee_multiplier: 1.0, is_default: true, is_active: true, created_at: now() },
    { id: uuid(), hospital_id: H, visit_type_name: 'Follow-up', days_threshold: 7, description: 'Return visit within 7 days', fee_multiplier: 0.5, is_default: false, is_active: true, created_at: now() },
    { id: uuid(), hospital_id: H, visit_type_name: 'Review', days_threshold: 30, description: 'Return within 30 days', fee_multiplier: 0.75, is_default: false, is_active: true, created_at: now() },
    { id: uuid(), hospital_id: H, visit_type_name: 'Emergency', days_threshold: 0, description: 'Emergency consultation', fee_multiplier: 1.5, is_default: false, is_active: true, created_at: now() },
  ];

  const user_roles = [
    { id: uuid(), hospital_id: H, user_id: null, role_name: 'Super Admin', permissions: { Dashboard: true, OPD: true, IPD: true, Pharmacy: true, Lab: true, Masters: true, Reports: true, Billing: true, HRMS: true, Admin: true }, is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, user_id: null, role_name: 'Doctor', permissions: { Dashboard: true, OPD: true, IPD: true, Lab: true, Reports: true }, is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, user_id: null, role_name: 'Receptionist', permissions: { Dashboard: true, OPD: true, Billing: true }, is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, user_id: null, role_name: 'Nurse', permissions: { Dashboard: true, IPD: true, OPD: true }, is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, user_id: null, role_name: 'Lab Technician', permissions: { Dashboard: true, Lab: true }, is_active: true, created_at: now(), updated_at: now() },
    { id: uuid(), hospital_id: H, user_id: null, role_name: 'Pharmacist', permissions: { Dashboard: true, Pharmacy: true }, is_active: true, created_at: now(), updated_at: now() },
  ];

  // IPD: Wards & Beds
  const wardGeneral = uuid(), wardICU = uuid(), wardPrivate = uuid(), wardPeds = uuid();
  const wards = [
    { id: wardGeneral, hospital_id: H, name: 'General Ward', ward_type: 'general', total_beds: 20, available_beds: 14, floor: 1, block: 'A', daily_rate: 800, is_active: true },
    { id: wardICU, hospital_id: H, name: 'ICU', ward_type: 'icu', total_beds: 8, available_beds: 3, floor: 2, block: 'B', daily_rate: 5000, is_active: true },
    { id: wardPrivate, hospital_id: H, name: 'Private Ward', ward_type: 'private', total_beds: 10, available_beds: 6, floor: 3, block: 'A', daily_rate: 2500, is_active: true },
    { id: wardPeds, hospital_id: H, name: 'Pediatric Ward', ward_type: 'general', total_beds: 12, available_beds: 8, floor: 1, block: 'C', daily_rate: 1000, is_active: true },
  ];

  const beds: Record<string, unknown>[] = [];
  const bedConfigs = [
    { wardId: wardGeneral, prefix: 'GW', count: 20, type: 'general', rate: 800, avail: 14 },
    { wardId: wardICU, prefix: 'ICU', count: 8, type: 'icu', rate: 5000, avail: 3 },
    { wardId: wardPrivate, prefix: 'PVT', count: 10, type: 'general', rate: 2500, avail: 6 },
    { wardId: wardPeds, prefix: 'PED', count: 12, type: 'general', rate: 1000, avail: 8 },
  ];
  bedConfigs.forEach(cfg => {
    const ward = wards.find(w => w.id === cfg.wardId)!;
    for (let i = 1; i <= cfg.count; i++) {
      beds.push({
        id: uuid(),
        hospital_id: H,
        ward_id: cfg.wardId,
        bed_number: `${cfg.prefix}-${String(i).padStart(2, '0')}`,
        bed_type: cfg.type,
        status: i <= (cfg.count - cfg.avail) ? 'occupied' : 'available',
        daily_rate: cfg.rate,
        ward: { id: cfg.wardId, name: ward.name, ward_type: ward.ward_type, floor: ward.floor, daily_rate: ward.daily_rate },
      });
    }
  });

  // Sample admissions
  const occupiedBeds = beds.filter(b => b.status === 'occupied');
  const admissions: Record<string, unknown>[] = occupiedBeds.slice(0, 6).map((bed, i) => {
    const patientNames = ['Ramesh Gupta', 'Sunita Devi', 'Mohd Irfan', 'Lakshmi Nair', 'Arjun Mehta', 'Deepa Verma'];
    const uhids = ['UHID-0001', 'UHID-0002', 'UHID-0003', 'UHID-0004', 'UHID-0005', 'UHID-0006'];
    const admDate = new Date();
    admDate.setDate(admDate.getDate() - (i * 2 + 1));
    return {
      id: uuid(),
      admission_number: `ADM2603${String(i + 1).padStart(4, '0')}`,
      hospital_id: H,
      patient_id: uuid(),
      doctor_id: doctors[i % doctors.length].id,
      ward_id: (bed as { ward_id: string }).ward_id,
      bed_id: (bed as { id: string }).id,
      admission_date: admDate.toISOString(),
      discharge_date: null,
      admission_type: i === 0 ? 'emergency' : 'planned',
      status: 'active',
      primary_diagnosis: ['Pneumonia', 'Appendicitis', 'Diabetes Management', 'Fracture Femur', 'Dengue Fever', 'Post-op care'][i],
      secondary_diagnosis: null,
      billing_category: i % 3 === 0 ? 'Insurance' : 'Cash',
      insurance_company: i % 3 === 0 ? 'Star Health' : null,
      policy_number: i % 3 === 0 ? 'SH-2024-' + (1000 + i) : null,
      estimated_stay_days: 5 + i,
      mlc_case: i === 0,
      notes: null,
      discharge_summary: null,
      patient: {
        id: uuid(),
        uhid: uhids[i],
        full_name: patientNames[i],
        phone: `987654321${i}`,
        gender: i % 2 === 0 ? 'male' : 'female',
        date_of_birth: `${1965 + i * 5}-0${i + 1}-15`,
        blood_group: ['B+', 'O+', 'A+', 'AB+', 'O-', 'B-'][i],
      },
      bed: bed,
      doctor: {
        id: doctors[i % doctors.length].id,
        full_name: `${doctors[i % doctors.length].first_name} ${doctors[i % doctors.length].last_name}`,
        department: doctors[i % doctors.length].specialty,
        designation: doctors[i % doctors.length].qualification,
      },
      pending_tasks_count: Math.floor(Math.random() * 5),
      latest_vitals: null,
    };
  });

  return {
    doctors,
    departments,
    medications,
    symptoms,
    lab_tests,
    services,
    packages,
    gst_slabs,
    visit_types,
    user_roles,
    custom_fields: [],
    print_templates: [],
    wards,
    beds,
    admissions,
    nursing_tasks: [],
    ipd_vitals: [],
    nursing_notes: [],
    doctor_rounds: [],
    ipd_bill_items: [],
    ipd_payments: [],
    discharge_summaries: [],
    hospital_config: { gst_number: '27AABCU9603R1ZM', state_code: '27', gst_mode: 'cgst_sgst' },
    _seeded: true,
  };
}

function load(): MasterStore {
  try {
    const raw = localStorage.getItem(MASTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed._seeded) return parsed;
    }
  } catch { /* noop */ }
  const store = seedMasterData();
  save(store);
  return store;
}

function save(store: MasterStore) {
  try { localStorage.setItem(MASTER_KEY, JSON.stringify(store)); } catch { /* noop */ }
}

// ── Generic CRUD helpers ──

type TableName = keyof Omit<MasterStore, '_seeded' | 'hospital_config'>;

export const mockMasterStore = {
  uuid,

  getAll<T = Record<string, unknown>>(table: TableName, hospitalId?: string): T[] {
    const store = load();
    const data = (store[table] || []) as Record<string, unknown>[];
    if (hospitalId) return data.filter(r => r.hospital_id === hospitalId) as T[];
    return data as T[];
  },

  getById<T = Record<string, unknown>>(table: TableName, id: string): T | null {
    const store = load();
    return ((store[table] || []) as Record<string, unknown>[]).find(r => r.id === id) as T | null;
  },

  insert<T = Record<string, unknown>>(table: TableName, record: Partial<T>): T {
    const store = load();
    const full = { id: uuid(), created_at: now(), updated_at: now(), ...record } as Record<string, unknown>;
    (store[table] as Record<string, unknown>[]).push(full);
    save(store);
    return full as T;
  },

  update<T = Record<string, unknown>>(table: TableName, id: string, updates: Partial<T>): T {
    const store = load();
    const arr = store[table] as Record<string, unknown>[];
    const idx = arr.findIndex(r => r.id === id);
    if (idx >= 0) {
      arr[idx] = { ...arr[idx], ...updates, updated_at: now() };
      save(store);
      return arr[idx] as T;
    }
    throw new Error('Not found');
  },

  remove(table: TableName, id: string): void {
    const store = load();
    const arr = store[table] as Record<string, unknown>[];
    const idx = arr.findIndex(r => r.id === id);
    if (idx >= 0) { arr.splice(idx, 1); save(store); }
  },

  bulkInsert<T = Record<string, unknown>>(table: TableName, records: Partial<T>[], hospitalId: string): number {
    const store = load();
    records.forEach(r => {
      (store[table] as Record<string, unknown>[]).push({
        id: uuid(), hospital_id: hospitalId, created_at: now(), updated_at: now(), ...r,
      });
    });
    save(store);
    return records.length;
  },

  getConfig(): Record<string, unknown> {
    return load().hospital_config;
  },

  updateConfig(updates: Record<string, unknown>): void {
    const store = load();
    store.hospital_config = { ...store.hospital_config, ...updates };
    save(store);
  },

  reset(): void {
    const store = seedMasterData();
    save(store);
  },
};
