import { supabase } from '../lib/supabase';
import type {
  EmergencyCase,
  EmergencyTreatment,
  CreateEmergencyCaseInput,
  CreateTreatmentInput,
  EmergencyStatus,
  TriageCategory,
  Disposition,
} from '../modules/emergency/types';

class EmergencyService {
  async getCases(hospitalId: string, activeOnly = false): Promise<EmergencyCase[]> {
    let query = supabase
      .from('emergency_cases')
      .select(`
        *,
        patient:patients(id, full_name, phone, gender, date_of_birth, blood_group),
        treating_doctor:profiles!emergency_cases_treating_doctor_id_fkey(id, full_name)
      `)
      .eq('hospital_id', hospitalId)
      .order('arrival_time', { ascending: false });

    if (activeOnly) {
      query = query.in('status', ['waiting', 'triaged', 'in_treatment', 'observation']);
    }

    const { data, error } = await query as { data: unknown[] | null; error: unknown };

    if (error) throw error;
    return (data || []) as EmergencyCase[];
  }

  async getCasesByTriage(hospitalId: string, triage: TriageCategory): Promise<EmergencyCase[]> {
    const { data, error } = await supabase
      .from('emergency_cases')
      .select(`
        *,
        patient:patients(id, full_name, phone, gender, date_of_birth, blood_group),
        treating_doctor:profiles!emergency_cases_treating_doctor_id_fkey(id, full_name)
      `)
      .eq('hospital_id', hospitalId)
      .eq('triage_category', triage)
      .in('status', ['waiting', 'triaged', 'in_treatment', 'observation'])
      .order('arrival_time', { ascending: true }) as { data: unknown[] | null; error: unknown };

    if (error) throw error;
    return (data || []) as EmergencyCase[];
  }

  async getCaseById(id: string): Promise<EmergencyCase | null> {
    const { data, error } = await supabase
      .from('emergency_cases')
      .select(`
        *,
        patient:patients(id, full_name, phone, gender, date_of_birth, blood_group),
        treating_doctor:profiles!emergency_cases_treating_doctor_id_fkey(id, full_name)
      `)
      .eq('id', id)
      .maybeSingle() as { data: unknown | null; error: unknown };

    if (error) throw error;
    return data as EmergencyCase | null;
  }

  async createCase(input: CreateEmergencyCaseInput): Promise<EmergencyCase> {
    const caseNumber = await this.generateCaseNumber(input.hospital_id);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('emergency_cases')
      .insert({
        ...input,
        case_number: caseNumber,
        arrival_time: now,
        status: input.triage_category ? 'triaged' : 'waiting',
        triage_time: input.triage_category ? now : null,
      } as never)
      .select(`
        *,
        patient:patients(id, full_name, phone, gender, date_of_birth, blood_group),
        treating_doctor:profiles!emergency_cases_treating_doctor_id_fkey(id, full_name)
      `)
      .single() as { data: unknown | null; error: unknown };

    if (error) throw error;
    return data as EmergencyCase;
  }

  async updateCase(id: string, updates: Partial<EmergencyCase>): Promise<EmergencyCase> {
    const { data, error } = await supabase
      .from('emergency_cases')
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select(`
        *,
        patient:patients(id, full_name, phone, gender, date_of_birth, blood_group),
        treating_doctor:profiles!emergency_cases_treating_doctor_id_fkey(id, full_name)
      `)
      .single() as { data: unknown | null; error: unknown };

    if (error) throw error;
    return data as EmergencyCase;
  }

  async updateTriage(id: string, triage: TriageCategory, triagedBy: string): Promise<EmergencyCase> {
    return this.updateCase(id, {
      triage_category: triage,
      triage_time: new Date().toISOString(),
      triaged_by: triagedBy,
      status: 'triaged',
    });
  }

  async updateStatus(id: string, status: EmergencyStatus): Promise<EmergencyCase> {
    return this.updateCase(id, { status });
  }

  async assignDoctor(id: string, doctorId: string): Promise<EmergencyCase> {
    return this.updateCase(id, {
      treating_doctor_id: doctorId,
      status: 'in_treatment',
    });
  }

  async setDisposition(
    id: string,
    disposition: Disposition,
    notes?: string,
    admittedToWard?: string
  ): Promise<EmergencyCase> {
    let status: EmergencyStatus;
    switch (disposition) {
      case 'Admitted':
        status = 'admitted';
        break;
      case 'Discharged':
        status = 'discharged';
        break;
      case 'Referred':
        status = 'referred';
        break;
      case 'LAMA':
        status = 'lama';
        break;
      case 'Expired':
        status = 'expired';
        break;
      case 'Observation':
        status = 'observation';
        break;
      default:
        status = 'discharged';
    }

    return this.updateCase(id, {
      disposition,
      disposition_notes: notes,
      disposition_time: new Date().toISOString(),
      admitted_to_ward: admittedToWard,
      status,
    });
  }

  async getTreatments(caseId: string): Promise<EmergencyTreatment[]> {
    const { data, error } = await supabase
      .from('emergency_treatments')
      .select(`
        *,
        performer:profiles!emergency_treatments_performed_by_fkey(id, full_name)
      `)
      .eq('emergency_case_id', caseId)
      .order('treatment_time', { ascending: false }) as { data: unknown[] | null; error: unknown };

    if (error) throw error;
    return (data || []) as EmergencyTreatment[];
  }

  async addTreatment(input: CreateTreatmentInput): Promise<EmergencyTreatment> {
    const { data, error } = await supabase
      .from('emergency_treatments')
      .insert({
        ...input,
        treatment_time: new Date().toISOString(),
      } as never)
      .select(`
        *,
        performer:profiles!emergency_treatments_performed_by_fkey(id, full_name)
      `)
      .single() as { data: unknown | null; error: unknown };

    if (error) throw error;
    return data as EmergencyTreatment;
  }

  async getStats(hospitalId: string): Promise<{
    waiting: number;
    inTreatment: number;
    observation: number;
    redCases: number;
    yellowCases: number;
    greenCases: number;
    todayTotal: number;
    todayAdmitted: number;
    todayDischarged: number;
  }> {
    const today = new Date().toISOString().slice(0, 10);

    const { data: activeCases, error: activeError } = await supabase
      .from('emergency_cases')
      .select('status, triage_category')
      .eq('hospital_id', hospitalId)
      .in('status', ['waiting', 'triaged', 'in_treatment', 'observation']) as { data: Array<{ status: string; triage_category: string }> | null; error: unknown };

    if (activeError) throw activeError;

    const { data: todayCases, error: todayError } = await supabase
      .from('emergency_cases')
      .select('status')
      .eq('hospital_id', hospitalId)
      .gte('arrival_time', today) as { data: Array<{ status: string }> | null; error: unknown };

    if (todayError) throw todayError;

    const cases = activeCases || [];
    const todayData = todayCases || [];

    return {
      waiting: cases.filter(c => c.status === 'waiting').length,
      inTreatment: cases.filter(c => c.status === 'in_treatment' || c.status === 'triaged').length,
      observation: cases.filter(c => c.status === 'observation').length,
      redCases: cases.filter(c => c.triage_category === 'Red').length,
      yellowCases: cases.filter(c => c.triage_category === 'Yellow').length,
      greenCases: cases.filter(c => c.triage_category === 'Green').length,
      todayTotal: todayData.length,
      todayAdmitted: todayData.filter(c => c.status === 'admitted').length,
      todayDischarged: todayData.filter(c => c.status === 'discharged').length,
    };
  }

  async getDoctors(hospitalId: string): Promise<Array<{ id: string; full_name: string }>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('hospital_id', hospitalId)
      .eq('role', 'doctor')
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;
    return (data || []) as Array<{ id: string; full_name: string }>;
  }

  private async generateCaseNumber(hospitalId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const { count } = await supabase
      .from('emergency_cases')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .gte('arrival_time', today.toISOString().slice(0, 10));

    const sequence = ((count || 0) + 1).toString().padStart(4, '0');
    return `ER-${dateStr}-${sequence}`;
  }
}

export default new EmergencyService();
