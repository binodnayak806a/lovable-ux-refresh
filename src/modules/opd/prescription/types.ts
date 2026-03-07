export interface Medication {
  id: string;
  generic_name: string;
  brand_name: string | null;
  category: string;
  form: string;
  strength: string | null;
  usage_count: number;
  is_active: boolean;
}

export interface PrescriptionItem {
  id: string;
  medicationId: string | null;
  drugName: string;
  dosageForm: string;
  strength: string;
  quantity: number;
  dosage: string;
  frequency: string;
  durationDays: number;
  route: string;
  timing: string;
  specialInstructions: string;
}

export interface PrescriptionFormData {
  diagnosis: string;
  generalAdvice: string;
  dietaryInstructions: string;
  followUpDate: string;
}

export const EMPTY_PRESCRIPTION_FORM: PrescriptionFormData = {
  diagnosis: '',
  generalAdvice: '',
  dietaryInstructions: '',
  followUpDate: '',
};

export const createEmptyItem = (): PrescriptionItem => ({
  id: crypto.randomUUID(),
  medicationId: null,
  drugName: '',
  dosageForm: 'tablet',
  strength: '',
  quantity: 1,
  dosage: '1-0-1',
  frequency: 'Twice daily',
  durationDays: 5,
  route: 'Oral',
  timing: 'After meals',
  specialInstructions: '',
});

export interface PrescriptionRecord {
  id: string;
  consultation_id: string | null;
  patient_id: string;
  doctor_id: string | null;
  prescription_number: string;
  prescription_date: string;
  diagnosis: string | null;
  general_advice: string | null;
  dietary_instructions: string | null;
  follow_up_date: string | null;
  is_dispensed: boolean;
}

export const DOSAGE_FORMS = [
  { value: 'tablet', label: 'Tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'syrup', label: 'Syrup' },
  { value: 'injection', label: 'Injection' },
  { value: 'drops', label: 'Drops' },
  { value: 'cream', label: 'Cream/Ointment' },
  { value: 'gel', label: 'Gel' },
  { value: 'inhaler', label: 'Inhaler' },
  { value: 'powder', label: 'Powder' },
  { value: 'lotion', label: 'Lotion' },
  { value: 'spray', label: 'Spray' },
  { value: 'patch', label: 'Patch' },
  { value: 'suppository', label: 'Suppository' },
  { value: 'other', label: 'Other' },
] as const;

export const FREQUENCY_OPTIONS = [
  { value: 'Once daily', label: 'Once daily (OD)', dosage: '1-0-0' },
  { value: 'Twice daily', label: 'Twice daily (BD)', dosage: '1-0-1' },
  { value: 'Thrice daily', label: 'Thrice daily (TDS)', dosage: '1-1-1' },
  { value: 'Four times daily', label: 'Four times daily (QID)', dosage: '1-1-1-1' },
  { value: 'Every 6 hours', label: 'Every 6 hours (Q6H)', dosage: 'Q6H' },
  { value: 'Every 8 hours', label: 'Every 8 hours (Q8H)', dosage: 'Q8H' },
  { value: 'Every 12 hours', label: 'Every 12 hours (Q12H)', dosage: 'Q12H' },
  { value: 'At bedtime', label: 'At bedtime (HS)', dosage: '0-0-1' },
  { value: 'In morning', label: 'In morning', dosage: '1-0-0' },
  { value: 'As needed', label: 'As needed (PRN)', dosage: 'PRN' },
  { value: 'Once weekly', label: 'Once weekly', dosage: 'Weekly' },
  { value: 'Stat', label: 'Stat (immediately)', dosage: 'STAT' },
] as const;

export const ROUTE_OPTIONS = [
  { value: 'Oral', label: 'Oral' },
  { value: 'IV', label: 'Intravenous (IV)' },
  { value: 'IM', label: 'Intramuscular (IM)' },
  { value: 'SC', label: 'Subcutaneous (SC)' },
  { value: 'Topical', label: 'Topical' },
  { value: 'Sublingual', label: 'Sublingual' },
  { value: 'Inhalation', label: 'Inhalation' },
  { value: 'Rectal', label: 'Rectal' },
  { value: 'Ophthalmic', label: 'Ophthalmic (Eye)' },
  { value: 'Otic', label: 'Otic (Ear)' },
  { value: 'Nasal', label: 'Nasal' },
] as const;

export const TIMING_OPTIONS = [
  { value: 'After meals', label: 'After meals' },
  { value: 'Before meals', label: 'Before meals' },
  { value: 'With meals', label: 'With meals' },
  { value: 'Empty stomach', label: 'Empty stomach' },
  { value: 'At bedtime', label: 'At bedtime' },
  { value: 'In morning', label: 'In morning' },
  { value: 'With water', label: 'With plenty of water' },
  { value: 'As directed', label: 'As directed' },
] as const;

export const DURATION_PRESETS = [3, 5, 7, 10, 14, 21, 30, 60, 90];

export const COMMON_ADVICE = [
  'Rest adequately and avoid strenuous activities',
  'Drink plenty of fluids (8-10 glasses of water daily)',
  'Avoid cold drinks and cold items',
  'Avoid smoking and alcohol',
  'Complete the full course of medication',
  'Follow up if symptoms persist or worsen',
  'Take medications as prescribed',
  'Monitor temperature and report if fever persists',
];

export const COMMON_DIETARY_INSTRUCTIONS = [
  'Light, easily digestible diet',
  'Avoid spicy and oily food',
  'Avoid dairy products',
  'High protein diet',
  'Low salt diet',
  'Low sugar diet',
  'Plenty of fruits and vegetables',
  'Small frequent meals',
];
