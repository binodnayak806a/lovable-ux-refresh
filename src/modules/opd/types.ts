export interface RegistrationFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  ageYears: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  aadharNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies: string[];
  preExistingConditions: string[];
  currentMedications: string;
  departmentId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  chiefComplaint: string;
  referredBy: string;
  billingCategory: string;
  insuranceCompany: string;
  policyNumber: string;
}

export const EMPTY_FORM: RegistrationFormData = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  ageYears: '',
  gender: '',
  bloodGroup: '',
  phone: '',
  email: '',
  aadharNumber: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  guardianName: '',
  guardianPhone: '',
  guardianRelation: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  allergies: [],
  preExistingConditions: [],
  currentMedications: '',
  departmentId: '',
  doctorId: '',
  appointmentDate: '',
  appointmentTime: '',
  appointmentType: 'New',
  chiefComplaint: '',
  referredBy: '',
  billingCategory: 'cash',
  insuranceCompany: '',
  policyNumber: '',
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const APPOINTMENT_TYPES = ['New', 'Follow-up', 'Emergency'];
export const BILLING_CATEGORIES = ['cash', 'insurance', 'tpa'];
export const RELATIONSHIP_OPTIONS = [
  'Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister',
  'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Friend', 'Other',
];

export const PRE_EXISTING_CONDITIONS = [
  'Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Kidney Disease',
  'Thyroid Disorder', 'Epilepsy', 'Cancer', 'HIV/AIDS', 'Hepatitis B',
  'Hepatitis C', 'Tuberculosis', 'COPD', 'Arthritis', 'Osteoporosis',
  'Anemia', 'Depression', 'Anxiety', 'Obesity', 'Sleep Apnea',
];

export type StepId = 'personal' | 'address' | 'guardian' | 'medical' | 'appointment' | 'billing';

export interface Step {
  id: StepId;
  title: string;
  subtitle: string;
}

export const STEPS: Step[] = [
  { id: 'personal', title: 'Personal Info', subtitle: 'Basic details' },
  { id: 'address', title: 'Address', subtitle: 'Location details' },
  { id: 'guardian', title: 'Guardian', subtitle: 'Emergency contact' },
  { id: 'medical', title: 'Medical History', subtitle: 'Health background' },
  { id: 'appointment', title: 'Appointment', subtitle: 'Schedule & doctor' },
  { id: 'billing', title: 'Billing', subtitle: 'Payment info' },
];
