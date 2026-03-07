import { supabase } from '../lib/supabase';
import type {
  Medication,
  PrescriptionItem,
  PrescriptionFormData,
  PrescriptionRecord,
} from '../modules/opd/prescription/types';

const prescriptionService = {
  async searchMedications(term: string): Promise<Medication[]> {
    if (!term || term.length < 2) return [];
    const { data, error } = await supabase
      .from('medications')
      .select('id, generic_name, brand_name, category, form, strength, usage_count, is_active')
      .eq('is_active', true)
      .or(`generic_name.ilike.%${term}%,brand_name.ilike.%${term}%`)
      .order('usage_count', { ascending: false })
      .limit(15);
    if (error) throw error;
    return (data ?? []) as Medication[];
  },

  async generatePrescriptionNumber(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_prescription_number');
    if (error) {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      return `RX${dateStr}-${rand}`;
    }
    return data as string;
  },

  async createPrescription(
    patientId: string,
    consultationId: string | null,
    doctorId: string,
    form: PrescriptionFormData,
    items: PrescriptionItem[]
  ): Promise<PrescriptionRecord> {
    const prescriptionNumber = await this.generatePrescriptionNumber();

    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .insert({
        patient_id: patientId,
        consultation_id: consultationId || null,
        doctor_id: doctorId,
        prescription_number: prescriptionNumber,
        diagnosis: form.diagnosis || null,
        general_advice: form.generalAdvice || null,
        dietary_instructions: form.dietaryInstructions || null,
        follow_up_date: form.followUpDate || null,
        is_dispensed: false,
      } as never)
      .select()
      .single();

    if (prescriptionError) throw prescriptionError;
    const prescriptionId = (prescription as PrescriptionRecord).id;

    if (items.length > 0) {
      const itemRecords = items.map((item, idx) => ({
        prescription_id: prescriptionId,
        medication_id: item.medicationId || null,
        drug_name: item.drugName,
        dosage_form: item.dosageForm,
        strength: item.strength || null,
        quantity: item.quantity,
        dosage: item.dosage || null,
        frequency: item.frequency || null,
        duration_days: item.durationDays || null,
        route: item.route || null,
        timing: item.timing || null,
        special_instructions: item.specialInstructions || null,
        sort_order: idx,
      }));
      const { error: itemsError } = await supabase
        .from('prescription_items')
        .insert(itemRecords as never);
      if (itemsError) throw itemsError;
    }

    return prescription as PrescriptionRecord;
  },

  async getPrescription(prescriptionId: string): Promise<{
    prescription: PrescriptionRecord;
    items: Array<{
      id: string;
      drug_name: string;
      dosage_form: string | null;
      strength: string | null;
      quantity: number;
      dosage: string | null;
      frequency: string | null;
      duration_days: number | null;
      route: string | null;
      timing: string | null;
      special_instructions: string | null;
    }>;
  } | null> {
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', prescriptionId)
      .maybeSingle();

    if (error || !prescription) return null;

    const { data: items } = await supabase
      .from('prescription_items')
      .select('*')
      .eq('prescription_id', prescriptionId)
      .order('sort_order');

    return {
      prescription: prescription as PrescriptionRecord,
      items: (items ?? []) as Array<{
        id: string;
        drug_name: string;
        dosage_form: string | null;
        strength: string | null;
        quantity: number;
        dosage: string | null;
        frequency: string | null;
        duration_days: number | null;
        route: string | null;
        timing: string | null;
        special_instructions: string | null;
      }>,
    };
  },

  async getPatientPrescriptions(patientId: string, limit = 10): Promise<PrescriptionRecord[]> {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', patientId)
      .order('prescription_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as PrescriptionRecord[];
  },

  async markDispensed(prescriptionId: string): Promise<void> {
    const { error } = await supabase
      .from('prescriptions')
      .update({ is_dispensed: true, updated_at: new Date().toISOString() } as never)
      .eq('id', prescriptionId);
    if (error) throw error;
  },
};

export default prescriptionService;
