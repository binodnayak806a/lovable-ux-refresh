export type OTStatus = 'available' | 'in_use' | 'maintenance' | 'cleaning';
export type SurgeryStatus = 'scheduled' | 'pre_op' | 'in_progress' | 'post_op' | 'completed' | 'cancelled';
export type SurgeryPriority = 'elective' | 'urgent' | 'emergency';
export type TeamRole = 'lead_surgeon' | 'assistant_surgeon' | 'anesthesiologist' | 'scrub_nurse' | 'circulating_nurse';

export interface OperationTheatre {
  id: string;
  name: string;
  status: OTStatus;
  floor: number;
  equipment: string[];
  is_active: boolean;
}

export interface SurgeryBooking {
  id: string;
  hospital_id: string;
  patient_id: string;
  patient_name: string;
  ot_id: string;
  ot_name: string;
  surgery_name: string;
  surgery_date: string;
  start_time: string;
  end_time: string;
  status: SurgeryStatus;
  priority: SurgeryPriority;
  diagnosis: string;
  notes: string | null;
  pre_op_checklist: PreOpItem[];
  team: TeamMember[];
  created_at: string;
}

export interface PreOpItem {
  id: string;
  label: string;
  completed: boolean;
  completed_by?: string;
  completed_at?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
}

export const DEFAULT_PREOP_CHECKLIST: Omit<PreOpItem, 'id'>[] = [
  { label: 'Patient identity verified', completed: false },
  { label: 'Consent form signed', completed: false },
  { label: 'NPO status confirmed (nil per os)', completed: false },
  { label: 'Allergies reviewed', completed: false },
  { label: 'Blood type & crossmatch ready', completed: false },
  { label: 'Pre-op labs reviewed', completed: false },
  { label: 'Imaging reviewed', completed: false },
  { label: 'Surgical site marked', completed: false },
  { label: 'Anesthesia assessment done', completed: false },
  { label: 'IV access established', completed: false },
  { label: 'Prophylactic antibiotics given', completed: false },
  { label: 'Patient vitals stable', completed: false },
];

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  lead_surgeon: 'Lead Surgeon',
  assistant_surgeon: 'Asst. Surgeon',
  anesthesiologist: 'Anesthesiologist',
  scrub_nurse: 'Scrub Nurse',
  circulating_nurse: 'Circulating Nurse',
};

export const MOCK_OTS: OperationTheatre[] = [
  { id: 'ot-1', name: 'OT-1 (General)', status: 'available', floor: 2, equipment: ['Cautery', 'Laparoscopy'], is_active: true },
  { id: 'ot-2', name: 'OT-2 (Cardiac)', status: 'available', floor: 2, equipment: ['Heart-Lung Machine', 'IABP'], is_active: true },
  { id: 'ot-3', name: 'OT-3 (Ortho)', status: 'maintenance', floor: 3, equipment: ['C-Arm', 'Power Tools'], is_active: true },
  { id: 'ot-4', name: 'OT-4 (Minor)', status: 'available', floor: 1, equipment: ['Cautery'], is_active: true },
];
