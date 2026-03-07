import { supabase } from '../lib/supabase';
import type {
  Medication,
  MedicationFormData,
  Symptom,
  SymptomFormData,
  Diagnosis,
  DiagnosisFormData,
  Investigation,
  InvestigationFormData,
  ServiceItem,
  ServiceItemFormData,
  Department,
  DepartmentFormData,
  Ward,
  WardFormData,
  Consultant,
  ConsultantFormData,
} from '../modules/master-data/types';

interface StaffRecord {
  id: string;
  user_id: string | null;
  hospital_id: string;
  first_name: string;
  last_name: string | null;
  specialty: string | null;
  designation: string | null;
  department: string | null;
  qualification: string | null;
  license_number: string | null;
  phone: string | null;
  email: string | null;
  consultation_fee: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

class MasterDataService {
  async getMedications(hospitalId: string): Promise<Medication[]> {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('generic_name');
    if (error) throw error;
    return (data || []) as Medication[];
  }

  async createMedication(hospitalId: string, formData: MedicationFormData): Promise<Medication> {
    const { data: result, error } = await supabase
      .from('medications')
      .insert({ ...formData, hospital_id: hospitalId } as never)
      .select()
      .single();
    if (error) throw error;
    return result as Medication;
  }

  async updateMedication(id: string, formData: Partial<MedicationFormData>): Promise<Medication> {
    const { data: result, error } = await supabase
      .from('medications')
      .update({ ...formData, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result as Medication;
  }

  async getSymptoms(hospitalId: string): Promise<Symptom[]> {
    const { data, error } = await supabase
      .from('symptoms')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('name');
    if (error) throw error;
    return (data || []) as Symptom[];
  }

  async createSymptom(hospitalId: string, formData: SymptomFormData): Promise<Symptom> {
    const { data: result, error } = await supabase
      .from('symptoms')
      .insert({ ...formData, hospital_id: hospitalId } as never)
      .select()
      .single();
    if (error) throw error;
    return result as Symptom;
  }

  async updateSymptom(id: string, formData: Partial<SymptomFormData>): Promise<Symptom> {
    const { data: result, error } = await supabase
      .from('symptoms')
      .update({ ...formData, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result as Symptom;
  }

  async getDiagnoses(hospitalId: string): Promise<Diagnosis[]> {
    const { data, error } = await supabase
      .from('diagnoses')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('name');
    if (error) throw error;
    return (data || []) as Diagnosis[];
  }

  async createDiagnosis(hospitalId: string, formData: DiagnosisFormData): Promise<Diagnosis> {
    const { data: result, error } = await supabase
      .from('diagnoses')
      .insert({ ...formData, hospital_id: hospitalId } as never)
      .select()
      .single();
    if (error) throw error;
    return result as Diagnosis;
  }

  async updateDiagnosis(id: string, formData: Partial<DiagnosisFormData>): Promise<Diagnosis> {
    const { data: result, error } = await supabase
      .from('diagnoses')
      .update({ ...formData, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result as Diagnosis;
  }

  async getInvestigations(hospitalId: string): Promise<Investigation[]> {
    const { data, error } = await supabase
      .from('investigations')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('name');
    if (error) throw error;
    return (data || []) as Investigation[];
  }

  async createInvestigation(hospitalId: string, formData: InvestigationFormData): Promise<Investigation> {
    const { data: result, error } = await supabase
      .from('investigations')
      .insert({ ...formData, hospital_id: hospitalId } as never)
      .select()
      .single();
    if (error) throw error;
    return result as Investigation;
  }

  async updateInvestigation(id: string, formData: Partial<InvestigationFormData>): Promise<Investigation> {
    const { data: result, error } = await supabase
      .from('investigations')
      .update({ ...formData, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result as Investigation;
  }

  async getServiceItems(hospitalId: string): Promise<ServiceItem[]> {
    const { data, error } = await supabase
      .from('service_items')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('name');
    if (error) throw error;
    return (data || []) as ServiceItem[];
  }

  async createServiceItem(hospitalId: string, formData: ServiceItemFormData): Promise<ServiceItem> {
    const { data: result, error } = await supabase
      .from('service_items')
      .insert({ ...formData, hospital_id: hospitalId } as never)
      .select()
      .single();
    if (error) throw error;
    return result as ServiceItem;
  }

  async updateServiceItem(id: string, formData: Partial<ServiceItemFormData>): Promise<ServiceItem> {
    const { data: result, error } = await supabase
      .from('service_items')
      .update({ ...formData, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result as ServiceItem;
  }

  async getDepartments(hospitalId: string): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('name');
    if (error) throw error;
    return (data || []) as Department[];
  }

  async createDepartment(hospitalId: string, formData: DepartmentFormData): Promise<Department> {
    const { data: result, error } = await supabase
      .from('departments')
      .insert({ ...formData, hospital_id: hospitalId } as never)
      .select()
      .single();
    if (error) throw error;
    return result as Department;
  }

  async updateDepartment(id: string, formData: Partial<DepartmentFormData>): Promise<Department> {
    const { data: result, error } = await supabase
      .from('departments')
      .update({ ...formData, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result as Department;
  }

  async getWards(hospitalId: string): Promise<Ward[]> {
    const { data, error } = await supabase
      .from('wards')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('name');
    if (error) throw error;
    return (data || []) as Ward[];
  }

  async createWard(hospitalId: string, formData: WardFormData): Promise<Ward> {
    const { data: result, error } = await supabase
      .from('wards')
      .insert({ ...formData, hospital_id: hospitalId } as never)
      .select()
      .single();
    if (error) throw error;
    return result as Ward;
  }

  async updateWard(id: string, formData: Partial<WardFormData>): Promise<Ward> {
    const { data: result, error } = await supabase
      .from('wards')
      .update({ ...formData, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result as Ward;
  }

  async getConsultants(hospitalId: string): Promise<Consultant[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('hospital_id', hospitalId)
      .in('designation', ['Doctor', 'Consultant', 'Physician', 'Surgeon', 'Specialist'])
      .order('first_name');
    if (error) throw error;
    const records = (data || []) as StaffRecord[];
    return records.map(s => ({
      id: s.id,
      user_id: s.user_id,
      hospital_id: s.hospital_id,
      first_name: s.first_name,
      last_name: s.last_name || '',
      specialty: s.specialty || s.designation || '',
      department: s.department,
      qualification: s.qualification,
      registration_number: s.license_number,
      phone: s.phone,
      email: s.email,
      consultation_fee: s.consultation_fee || 0,
      is_active: s.status === 'active',
      created_at: s.created_at,
      updated_at: s.updated_at,
    }));
  }

  async createConsultant(hospitalId: string, formData: ConsultantFormData): Promise<Consultant> {
    const insertData = {
      hospital_id: hospitalId,
      first_name: formData.first_name,
      last_name: formData.last_name,
      specialty: formData.specialty,
      department: formData.department,
      qualification: formData.qualification,
      license_number: formData.registration_number,
      phone: formData.phone,
      email: formData.email,
      consultation_fee: formData.consultation_fee,
      designation: 'Doctor',
      employee_id: `DR-${Date.now().toString(36).toUpperCase()}`,
      status: formData.is_active ? 'active' : 'resigned',
    };
    const { data: result, error } = await supabase
      .from('staff')
      .insert(insertData as never)
      .select()
      .single();
    if (error) throw error;
    const r = result as StaffRecord;
    return {
      id: r.id,
      user_id: r.user_id,
      hospital_id: r.hospital_id,
      first_name: r.first_name,
      last_name: r.last_name || '',
      specialty: r.specialty || '',
      department: r.department,
      qualification: r.qualification,
      registration_number: r.license_number,
      phone: r.phone,
      email: r.email,
      consultation_fee: r.consultation_fee || 0,
      is_active: r.status === 'active',
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  async updateConsultant(id: string, formData: Partial<ConsultantFormData>): Promise<Consultant> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (formData.first_name !== undefined) updateData.first_name = formData.first_name;
    if (formData.last_name !== undefined) updateData.last_name = formData.last_name;
    if (formData.specialty !== undefined) updateData.specialty = formData.specialty;
    if (formData.department !== undefined) updateData.department = formData.department;
    if (formData.qualification !== undefined) updateData.qualification = formData.qualification;
    if (formData.registration_number !== undefined) updateData.license_number = formData.registration_number;
    if (formData.phone !== undefined) updateData.phone = formData.phone;
    if (formData.email !== undefined) updateData.email = formData.email;
    if (formData.consultation_fee !== undefined) updateData.consultation_fee = formData.consultation_fee;
    if (formData.is_active !== undefined) updateData.status = formData.is_active ? 'active' : 'resigned';

    const { data: result, error } = await supabase
      .from('staff')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const r = result as StaffRecord;
    return {
      id: r.id,
      user_id: r.user_id,
      hospital_id: r.hospital_id,
      first_name: r.first_name,
      last_name: r.last_name || '',
      specialty: r.specialty || '',
      department: r.department,
      qualification: r.qualification,
      registration_number: r.license_number,
      phone: r.phone,
      email: r.email,
      consultation_fee: r.consultation_fee || 0,
      is_active: r.status === 'active',
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }
}

export const masterDataService = new MasterDataService();
