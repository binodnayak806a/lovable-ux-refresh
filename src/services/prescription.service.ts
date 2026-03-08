import { mockStore } from '../lib/mockStore';
import { mockMasterStore } from '../lib/mockMasterStore';
import type {
  Medication,
  PrescriptionItem,
  PrescriptionFormData,
  PrescriptionRecord,
} from '../modules/opd/prescription/types';

const HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

const prescriptionService = {
  async searchMedications(term: string): Promise<Medication[]> {
    if (!term || term.length < 2) return [];
    const q = term.toLowerCase();
    const meds = mockMasterStore.getAll<{
      id: string; name: string; generic_name?: string; brand_name?: string;
      category: string; form: string; strength?: string; usage_count?: number;
      is_active: boolean; hospital_id: string;
    }>('medications', HOSPITAL_ID);

    return meds
      .filter(m => {
        const gn = (m.generic_name || m.name || '').toLowerCase();
        const bn = (m.brand_name || '').toLowerCase();
        return gn.includes(q) || bn.includes(q);
      })
      .slice(0, 15)
      .map(m => ({
        id: m.id,
        generic_name: m.generic_name || m.name,
        brand_name: m.brand_name || null,
        category: m.category || 'General',
        form: m.form || 'tablet',
        strength: m.strength || null,
        usage_count: m.usage_count || 0,
        is_active: true,
      }));
  },

  async generatePrescriptionNumber(): Promise<string> {
    return mockStore.generatePrescriptionNumber();
  },

  async createPrescription(
    patientId: string,
    consultationId: string | null,
    doctorId: string,
    form: PrescriptionFormData,
    _items: PrescriptionItem[]
  ): Promise<PrescriptionRecord> {
    const prescriptionNumber = mockStore.generatePrescriptionNumber();

    const record: PrescriptionRecord = {
      id: mockStore.uuid(),
      consultation_id: consultationId,
      patient_id: patientId,
      doctor_id: doctorId,
      prescription_number: prescriptionNumber,
      prescription_date: new Date().toISOString().split('T')[0],
      diagnosis: form.diagnosis || null,
      general_advice: form.generalAdvice || null,
      dietary_instructions: form.dietaryInstructions || null,
      follow_up_date: form.followUpDate || null,
      is_dispensed: false,
    };

    mockStore.addPrescription({
      id: record.id,
      prescription_number: prescriptionNumber,
      patient_id: patientId,
      consultation_id: consultationId,
      doctor_id: doctorId,
      diagnosis: form.diagnosis || null,
      general_advice: form.generalAdvice || null,
      follow_up_date: form.followUpDate || null,
      is_dispensed: false,
      prescription_date: record.prescription_date,
      created_at: new Date().toISOString(),
    });

    return record;
  },

  async getPrescription(_prescriptionId: string) {
    return null;
  },

  async getPatientPrescriptions(patientId: string, limit = 10): Promise<PrescriptionRecord[]> {
    const store = mockStore.get();
    return store.prescriptions
      .filter(r => r.patient_id === patientId)
      .sort((a, b) => b.prescription_date.localeCompare(a.prescription_date))
      .slice(0, limit)
      .map(r => ({
        id: r.id,
        consultation_id: r.consultation_id,
        patient_id: r.patient_id,
        doctor_id: r.doctor_id,
        prescription_number: r.prescription_number,
        prescription_date: r.prescription_date,
        diagnosis: r.diagnosis,
        general_advice: r.general_advice,
        dietary_instructions: null,
        follow_up_date: r.follow_up_date,
        is_dispensed: r.is_dispensed,
      }));
  },

  async markDispensed(prescriptionId: string): Promise<void> {
    const store = mockStore.get();
    const rx = store.prescriptions.find(r => r.id === prescriptionId);
    if (rx) {
      rx.is_dispensed = true;
      localStorage.setItem('hms_mock_store', JSON.stringify(store));
    }
  },
};

export default prescriptionService;
