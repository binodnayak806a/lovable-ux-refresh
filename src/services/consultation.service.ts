import { supabase } from '../lib/supabase';
import type {
  Symptom,
  Diagnosis,
  SelectedSymptom,
  SelectedDiagnosis,
  ConsultationFormData,
  ConsultationRecord,
} from '../modules/opd/consultation/types';

const consultationService = {
  async getSymptoms(): Promise<Symptom[]> {
    const { data, error } = await supabase
      .from('symptoms')
      .select('id, name, category, usage_count, is_active')
      .eq('is_active', true)
      .order('usage_count', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Symptom[];
  },

  async searchDiagnoses(term: string): Promise<Diagnosis[]> {
    if (!term || term.length < 2) return [];
    const { data, error } = await supabase
      .from('diagnoses')
      .select('id, name, icd10_code, category, is_active')
      .eq('is_active', true)
      .or(`name.ilike.%${term}%,icd10_code.ilike.%${term}%`)
      .order('name')
      .limit(15);
    if (error) throw error;
    return (data ?? []) as Diagnosis[];
  },

  async createConsultation(
    patientId: string,
    appointmentId: string | null,
    doctorId: string,
    form: ConsultationFormData,
    symptoms: SelectedSymptom[],
    diagnoses: SelectedDiagnosis[]
  ): Promise<ConsultationRecord> {
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .insert({
        patient_id: patientId,
        appointment_id: appointmentId || null,
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
      } as never)
      .select()
      .single();

    if (consultationError) throw consultationError;
    const consultationId = (consultation as ConsultationRecord).id;

    if (symptoms.length > 0) {
      const symptomRecords = symptoms.map((s) => ({
        consultation_id: consultationId,
        symptom_id: s.symptomId,
        severity: s.severity,
        duration_days: s.durationDays ? parseInt(s.durationDays) : null,
        notes: s.notes || null,
      }));
      const { error: symptomsError } = await supabase
        .from('consultation_symptoms')
        .insert(symptomRecords as never);
      if (symptomsError) throw symptomsError;
    }

    if (diagnoses.length > 0) {
      const diagnosisRecords = diagnoses.map((d, idx) => ({
        consultation_id: consultationId,
        diagnosis_id: d.diagnosisId,
        diagnosis_type: idx === 0 ? 'primary' : d.diagnosisType,
        severity: d.severity,
        notes: d.notes || null,
      }));
      const { error: diagnosesError } = await supabase
        .from('consultation_diagnoses')
        .insert(diagnosisRecords as never);
      if (diagnosesError) throw diagnosesError;
    }

    return consultation as ConsultationRecord;
  },

  async updateConsultation(
    consultationId: string,
    form: ConsultationFormData,
    symptoms: SelectedSymptom[],
    diagnoses: SelectedDiagnosis[]
  ): Promise<void> {
    const { error: updateError } = await supabase
      .from('consultations')
      .update({
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
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', consultationId);

    if (updateError) throw updateError;

    await supabase.from('consultation_symptoms').delete().eq('consultation_id', consultationId);
    if (symptoms.length > 0) {
      const symptomRecords = symptoms.map((s) => ({
        consultation_id: consultationId,
        symptom_id: s.symptomId,
        severity: s.severity,
        duration_days: s.durationDays ? parseInt(s.durationDays) : null,
        notes: s.notes || null,
      }));
      await supabase.from('consultation_symptoms').insert(symptomRecords as never);
    }

    await supabase.from('consultation_diagnoses').delete().eq('consultation_id', consultationId);
    if (diagnoses.length > 0) {
      const diagnosisRecords = diagnoses.map((d, idx) => ({
        consultation_id: consultationId,
        diagnosis_id: d.diagnosisId,
        diagnosis_type: idx === 0 ? 'primary' : d.diagnosisType,
        severity: d.severity,
        notes: d.notes || null,
      }));
      await supabase.from('consultation_diagnoses').insert(diagnosisRecords as never);
    }
  },

  async getConsultation(consultationId: string): Promise<{
    consultation: ConsultationRecord;
    symptoms: Array<{ symptom: Symptom; severity: string; duration_days: number | null; notes: string | null }>;
    diagnoses: Array<{ diagnosis: Diagnosis; diagnosis_type: string; severity: string; notes: string | null }>;
  } | null> {
    const { data: consultation, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', consultationId)
      .maybeSingle();

    if (error || !consultation) return null;

    const { data: symptomData } = await supabase
      .from('consultation_symptoms')
      .select('symptom_id, severity, duration_days, notes, symptoms(id, name, category, usage_count, is_active)')
      .eq('consultation_id', consultationId);

    const { data: diagnosisData } = await supabase
      .from('consultation_diagnoses')
      .select('diagnosis_id, diagnosis_type, severity, notes, diagnoses(id, name, icd10_code, category, is_active)')
      .eq('consultation_id', consultationId);

    return {
      consultation: consultation as ConsultationRecord,
      symptoms: (symptomData ?? []).map((s: Record<string, unknown>) => ({
        symptom: s.symptoms as Symptom,
        severity: s.severity as string,
        duration_days: s.duration_days as number | null,
        notes: s.notes as string | null,
      })),
      diagnoses: (diagnosisData ?? []).map((d: Record<string, unknown>) => ({
        diagnosis: d.diagnoses as Diagnosis,
        diagnosis_type: d.diagnosis_type as string,
        severity: d.severity as string,
        notes: d.notes as string | null,
      })),
    };
  },

  async getPatientConsultations(patientId: string, limit = 10): Promise<ConsultationRecord[]> {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patientId)
      .order('consultation_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as ConsultationRecord[];
  },

  async completeConsultation(consultationId: string): Promise<void> {
    const { error } = await supabase
      .from('consultations')
      .update({ is_completed: true, updated_at: new Date().toISOString() } as never)
      .eq('id', consultationId);
    if (error) throw error;
  },
};

export default consultationService;
