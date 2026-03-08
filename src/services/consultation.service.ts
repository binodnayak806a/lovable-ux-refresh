import { mockStore } from '../lib/mockStore';
import { mockMasterStore } from '../lib/mockMasterStore';
import type {
  Symptom,
  Diagnosis,
  SelectedSymptom,
  SelectedDiagnosis,
  ConsultationFormData,
  ConsultationRecord,
} from '../modules/opd/consultation/types';

const HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

const consultationService = {
  async getSymptoms(): Promise<Symptom[]> {
    const symptoms = mockMasterStore.getAll<{
      id: string; name: string; category: string; usage_count: number; is_active: boolean; hospital_id: string;
    }>('symptoms', HOSPITAL_ID);
    return symptoms.filter(s => s.is_active !== false).map(s => ({
      id: s.id,
      name: s.name,
      category: s.category || 'General',
      usage_count: s.usage_count || 0,
      is_active: true,
    }));
  },

  async searchDiagnoses(term: string): Promise<Diagnosis[]> {
    if (!term || term.length < 2) return [];
    const q = term.toLowerCase();
    const DIAGNOSES: Diagnosis[] = [
      { id: 'd1', name: 'Acute Upper Respiratory Infection', icd10_code: 'J06.9', category: 'Respiratory', is_active: true },
      { id: 'd2', name: 'Essential Hypertension', icd10_code: 'I10', category: 'Cardiovascular', is_active: true },
      { id: 'd3', name: 'Type 2 Diabetes Mellitus', icd10_code: 'E11', category: 'Endocrine', is_active: true },
      { id: 'd4', name: 'Acute Gastroenteritis', icd10_code: 'K52.9', category: 'GI', is_active: true },
      { id: 'd5', name: 'Viral Fever', icd10_code: 'A94', category: 'Infectious', is_active: true },
      { id: 'd6', name: 'Urinary Tract Infection', icd10_code: 'N39.0', category: 'Urinary', is_active: true },
      { id: 'd7', name: 'Migraine', icd10_code: 'G43.9', category: 'Neurological', is_active: true },
      { id: 'd8', name: 'Lumbar Spondylosis', icd10_code: 'M47.816', category: 'Musculoskeletal', is_active: true },
      { id: 'd9', name: 'Iron Deficiency Anaemia', icd10_code: 'D50.9', category: 'Haematology', is_active: true },
      { id: 'd10', name: 'Allergic Rhinitis', icd10_code: 'J30.9', category: 'ENT', is_active: true },
      { id: 'd11', name: 'Osteoarthritis of Knee', icd10_code: 'M17.9', category: 'Musculoskeletal', is_active: true },
      { id: 'd12', name: 'Bronchial Asthma', icd10_code: 'J45.9', category: 'Respiratory', is_active: true },
    ];
    return DIAGNOSES.filter(d =>
      d.name.toLowerCase().includes(q) || (d.icd10_code ?? '').toLowerCase().includes(q)
    );
  },

  async createConsultation(
    patientId: string,
    appointmentId: string | null,
    doctorId: string,
    form: ConsultationFormData,
    _symptoms: SelectedSymptom[],
    _diagnoses: SelectedDiagnosis[]
  ): Promise<ConsultationRecord> {
    const consultation: ConsultationRecord = {
      id: mockStore.uuid(),
      patient_id: patientId,
      appointment_id: appointmentId,
      doctor_id: doctorId,
      chief_complaint: form.chiefComplaint || null,
      history_of_present_illness: form.historyOfPresentIllness || null,
      past_history: form.pastHistory || null,
      family_history: form.familyHistory || null,
      personal_history: form.personalHistory || null,
      drug_history: form.drugHistory || null,
      allergy_history: form.allergyHistory || null,
      physical_examination: form.physicalExamination || null,
      clinical_notes: form.clinicalNotes || null,
      assessment: form.assessment || null,
      plan: form.plan || null,
      follow_up_date: form.followUpDate || null,
      is_completed: false,
      consultation_date: new Date().toISOString().split('T')[0],
    };

    mockStore.addConsultation({
      id: consultation.id,
      patient_id: patientId,
      appointment_id: appointmentId,
      doctor_id: doctorId,
      chief_complaint: form.chiefComplaint || null,
      assessment: form.assessment || null,
      plan: form.plan || null,
      is_completed: false,
      consultation_date: consultation.consultation_date,
      created_at: new Date().toISOString(),
    });

    if (appointmentId) {
      mockStore.updateAppointmentStatus(appointmentId, 'in_progress');
    }

    return consultation;
  },

  async updateConsultation(
    _consultationId: string,
    _form: ConsultationFormData,
    _symptoms: SelectedSymptom[],
    _diagnoses: SelectedDiagnosis[]
  ): Promise<void> {
    // Mock: no-op for now
  },

  async getConsultation(_consultationId: string) {
    return null;
  },

  async getPatientConsultations(patientId: string, limit = 10): Promise<ConsultationRecord[]> {
    const store = mockStore.get();
    return store.consultations
      .filter(c => c.patient_id === patientId)
      .sort((a, b) => b.consultation_date.localeCompare(a.consultation_date))
      .slice(0, limit)
      .map(c => ({
        id: c.id,
        patient_id: c.patient_id,
        appointment_id: c.appointment_id,
        doctor_id: c.doctor_id,
        chief_complaint: c.chief_complaint,
        history_of_present_illness: null,
        past_history: null,
        family_history: null,
        personal_history: null,
        drug_history: null,
        allergy_history: null,
        physical_examination: null,
        clinical_notes: null,
        assessment: c.assessment,
        plan: c.plan,
        follow_up_date: null,
        is_completed: c.is_completed,
        consultation_date: c.consultation_date,
        created_at: c.created_at,
        updated_at: c.created_at,
      }));
  },

  async completeConsultation(consultationId: string): Promise<void> {
    const store = mockStore.get();
    const c = store.consultations.find(x => x.id === consultationId);
    if (c) {
      c.is_completed = true;
      localStorage.setItem('hms_mock_store', JSON.stringify(store));
    }
  },
};

export default consultationService;
