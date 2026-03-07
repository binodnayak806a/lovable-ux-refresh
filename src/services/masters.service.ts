import { supabase } from '../lib/supabase';
import type {
  DoctorMaster, DepartmentMaster, ServiceMasterRow, PackageMasterRow,
  MedicationMaster, SymptomMaster, LabTestMaster, CustomFieldConfig,
  UserRole, GstSlabRow, VisitTypeRule,
} from '../modules/masters/types';

const DEMO_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

class MastersService {
  async getDoctors(hospitalId: string): Promise<DoctorMaster[]> {
    const { data, error } = await supabase
      .from('doctors')
      .select('*, department:departments(name)')
      .eq('hospital_id', hospitalId || DEMO_HOSPITAL_ID)
      .order('first_name');
    if (error) throw error;
    return (data ?? []) as DoctorMaster[];
  }

  async upsertDoctor(hospitalId: string, doctor: Partial<DoctorMaster>, id?: string): Promise<DoctorMaster> {
    if (id) {
      const { data, error } = await supabase.from('doctors')
        .update({ ...doctor, updated_at: new Date().toISOString() } as never)
        .eq('id', id).select('*, department:departments(name)').single();
      if (error) throw error;
      return data as DoctorMaster;
    }
    const { data, error } = await supabase.from('doctors')
      .insert({ ...doctor, hospital_id: hospitalId || DEMO_HOSPITAL_ID } as never)
      .select('*, department:departments(name)').single();
    if (error) throw error;
    return data as DoctorMaster;
  }

  async deleteDoctor(id: string): Promise<void> {
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) throw error;
  }

  async getDepartments(hospitalId: string): Promise<DepartmentMaster[]> {
    const { data, error } = await supabase.from('departments')
      .select('*').eq('hospital_id', hospitalId || DEMO_HOSPITAL_ID).order('name');
    if (error) throw error;
    return (data ?? []) as DepartmentMaster[];
  }

  async upsertDepartment(hospitalId: string, dept: Partial<DepartmentMaster>, id?: string): Promise<DepartmentMaster> {
    if (id) {
      const { data, error } = await supabase.from('departments')
        .update({ ...dept, updated_at: new Date().toISOString() } as never)
        .eq('id', id).select().single();
      if (error) throw error;
      return data as DepartmentMaster;
    }
    const { data, error } = await supabase.from('departments')
      .insert({ ...dept, hospital_id: hospitalId || DEMO_HOSPITAL_ID } as never)
      .select().single();
    if (error) throw error;
    return data as DepartmentMaster;
  }

  async deleteDepartment(id: string): Promise<void> {
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) throw error;
  }

  async getServices(hospitalId: string): Promise<ServiceMasterRow[]> {
    const { data, error } = await supabase.from('services_master')
      .select('*').eq('hospital_id', hospitalId || DEMO_HOSPITAL_ID).order('service_name');
    if (error) throw error;
    return (data ?? []) as ServiceMasterRow[];
  }

  async upsertService(hospitalId: string, svc: Partial<ServiceMasterRow>, id?: string): Promise<ServiceMasterRow> {
    if (id) {
      const { data, error } = await supabase.from('services_master')
        .update({ ...svc, updated_at: new Date().toISOString() } as never)
        .eq('id', id).select().single();
      if (error) throw error;
      return data as ServiceMasterRow;
    }
    const { data, error } = await supabase.from('services_master')
      .insert({ ...svc, hospital_id: hospitalId || DEMO_HOSPITAL_ID } as never)
      .select().single();
    if (error) throw error;
    return data as ServiceMasterRow;
  }

  async deleteService(id: string): Promise<void> {
    const { error } = await supabase.from('services_master').delete().eq('id', id);
    if (error) throw error;
  }

  async getPackages(hospitalId: string): Promise<PackageMasterRow[]> {
    const { data, error } = await supabase.from('packages_master')
      .select('*').eq('hospital_id', hospitalId || DEMO_HOSPITAL_ID).order('package_name');
    if (error) throw error;
    return (data ?? []) as PackageMasterRow[];
  }

  async upsertPackage(hospitalId: string, pkg: Partial<PackageMasterRow>, id?: string): Promise<PackageMasterRow> {
    if (id) {
      const { data, error } = await supabase.from('packages_master')
        .update(pkg as never).eq('id', id).select().single();
      if (error) throw error;
      return data as PackageMasterRow;
    }
    const { data, error } = await supabase.from('packages_master')
      .insert({ ...pkg, hospital_id: hospitalId || DEMO_HOSPITAL_ID } as never)
      .select().single();
    if (error) throw error;
    return data as PackageMasterRow;
  }

  async deletePackage(id: string): Promise<void> {
    const { error } = await supabase.from('packages_master').delete().eq('id', id);
    if (error) throw error;
  }

  async getMedications(hospitalId: string): Promise<MedicationMaster[]> {
    const { data, error } = await supabase.from('medications')
      .select('*').eq('hospital_id', hospitalId || DEMO_HOSPITAL_ID).order('generic_name');
    if (error) throw error;
    return (data ?? []) as MedicationMaster[];
  }

  async upsertMedication(hospitalId: string, med: Partial<MedicationMaster>, id?: string): Promise<MedicationMaster> {
    if (id) {
      const { data, error } = await supabase.from('medications')
        .update({ ...med, updated_at: new Date().toISOString() } as never)
        .eq('id', id).select().single();
      if (error) throw error;
      return data as MedicationMaster;
    }
    const { data, error } = await supabase.from('medications')
      .insert({ ...med, hospital_id: hospitalId || DEMO_HOSPITAL_ID } as never)
      .select().single();
    if (error) throw error;
    return data as MedicationMaster;
  }

  async deleteMedication(id: string): Promise<void> {
    const { error } = await supabase.from('medications').delete().eq('id', id);
    if (error) throw error;
  }

  async getSymptoms(hospitalId: string): Promise<SymptomMaster[]> {
    const { data, error } = await supabase.from('symptoms')
      .select('*').eq('hospital_id', hospitalId || DEMO_HOSPITAL_ID).order('name');
    if (error) throw error;
    return (data ?? []) as SymptomMaster[];
  }

  async upsertSymptom(hospitalId: string, sym: Partial<SymptomMaster>, id?: string): Promise<SymptomMaster> {
    if (id) {
      const { data, error } = await supabase.from('symptoms')
        .update({ ...sym, updated_at: new Date().toISOString() } as never)
        .eq('id', id).select().single();
      if (error) throw error;
      return data as SymptomMaster;
    }
    const { data, error } = await supabase.from('symptoms')
      .insert({ ...sym, hospital_id: hospitalId || DEMO_HOSPITAL_ID } as never)
      .select().single();
    if (error) throw error;
    return data as SymptomMaster;
  }

  async deleteSymptom(id: string): Promise<void> {
    const { error } = await supabase.from('symptoms').delete().eq('id', id);
    if (error) throw error;
  }

  async getLabTests(hospitalId: string): Promise<LabTestMaster[]> {
    const { data, error } = await supabase.from('lab_tests')
      .select('*').eq('hospital_id', hospitalId || DEMO_HOSPITAL_ID).order('test_name');
    if (error) throw error;
    return (data ?? []) as LabTestMaster[];
  }

  async upsertLabTest(hospitalId: string, test: Partial<LabTestMaster>, id?: string): Promise<LabTestMaster> {
    if (id) {
      const { data, error } = await supabase.from('lab_tests')
        .update(test as never).eq('id', id).select().single();
      if (error) throw error;
      return data as LabTestMaster;
    }
    const { data, error } = await supabase.from('lab_tests')
      .insert({ ...test, hospital_id: hospitalId || DEMO_HOSPITAL_ID } as never)
      .select().single();
    if (error) throw error;
    return data as LabTestMaster;
  }

  async deleteLabTest(id: string): Promise<void> {
    const { error } = await supabase.from('lab_tests').delete().eq('id', id);
    if (error) throw error;
  }

  async getCustomFields(hospitalId: string): Promise<CustomFieldConfig[]> {
    const { data, error } = await supabase.from('custom_fields_config')
      .select('*').eq('hospital_id', hospitalId || DEMO_HOSPITAL_ID)
      .order('form_name').order('sort_order');
    if (error) throw error;
    return (data ?? []) as CustomFieldConfig[];
  }

  async upsertCustomField(hospitalId: string, field: Partial<CustomFieldConfig>, id?: string): Promise<CustomFieldConfig> {
    if (id) {
      const { data, error } = await supabase.from('custom_fields_config')
        .update({ ...field, updated_at: new Date().toISOString() } as never)
        .eq('id', id).select().single();
      if (error) throw error;
      return data as CustomFieldConfig;
    }
    const { data, error } = await supabase.from('custom_fields_config')
      .insert({ ...field, hospital_id: hospitalId || DEMO_HOSPITAL_ID } as never)
      .select().single();
    if (error) throw error;
    return data as CustomFieldConfig;
  }

  async deleteCustomField(id: string): Promise<void> {
    const { error } = await supabase.from('custom_fields_config').delete().eq('id', id);
    if (error) throw error;
  }

  async getUserRoles(hospitalId: string): Promise<UserRole[]> {
    const { data, error } = await supabase.from('user_roles')
      .select('*').eq('hospital_id', hospitalId || DEMO_HOSPITAL_ID).order('role_name');
    if (error) throw error;
    const roles = (data ?? []) as UserRole[];
    if (roles.length > 0) {
      const userIds = roles.filter(r => r.user_id).map(r => r.user_id!);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles')
          .select('id, full_name, email').in('id', userIds);
        const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string; email: string }) => [p.id, p]));
        roles.forEach(r => {
          if (r.user_id && profileMap.has(r.user_id)) {
            const p = profileMap.get(r.user_id)!;
            r.profile = { full_name: p.full_name, email: p.email };
          }
        });
      }
    }
    return roles;
  }

  async getProfiles(hospitalId: string): Promise<{ id: string; full_name: string; email: string; role: string }[]> {
    const { data, error } = await supabase.from('profiles')
      .select('id, full_name, email, role')
      .eq('hospital_id', hospitalId || DEMO_HOSPITAL_ID)
      .eq('is_active', true)
      .order('full_name');
    if (error) throw error;
    return (data ?? []) as { id: string; full_name: string; email: string; role: string }[];
  }

  async upsertUserRole(hospitalId: string, role: Partial<UserRole>, id?: string): Promise<UserRole> {
    if (id) {
      const { data, error } = await supabase.from('user_roles')
        .update({ ...role, updated_at: new Date().toISOString() } as never)
        .eq('id', id).select().single();
      if (error) throw error;
      return data as UserRole;
    }
    const { data, error } = await supabase.from('user_roles')
      .insert({ ...role, hospital_id: hospitalId || DEMO_HOSPITAL_ID } as never)
      .select().single();
    if (error) throw error;
    return data as UserRole;
  }

  async deleteUserRole(id: string): Promise<void> {
    const { error } = await supabase.from('user_roles').delete().eq('id', id);
    if (error) throw error;
  }

  async getGstSlabs(hospitalId: string): Promise<GstSlabRow[]> {
    const { data, error } = await supabase.from('gst_master')
      .select('*').eq('hospital_id', hospitalId || DEMO_HOSPITAL_ID).order('gst_rate');
    if (error) throw error;
    return (data ?? []) as GstSlabRow[];
  }

  async upsertGstSlab(hospitalId: string, slab: Partial<GstSlabRow>, id?: string): Promise<GstSlabRow> {
    if (id) {
      const { data, error } = await supabase.from('gst_master')
        .update(slab as never).eq('id', id).select().single();
      if (error) throw error;
      return data as GstSlabRow;
    }
    const { data, error } = await supabase.from('gst_master')
      .insert({ ...slab, hospital_id: hospitalId || DEMO_HOSPITAL_ID } as never)
      .select().single();
    if (error) throw error;
    return data as GstSlabRow;
  }

  async deleteGstSlab(id: string): Promise<void> {
    const { error } = await supabase.from('gst_master').delete().eq('id', id);
    if (error) throw error;
  }

  async getHospitalGstConfig(hospitalId: string): Promise<{ gst_number: string | null; state_code: string | null; gst_mode: string | null }> {
    const { data, error } = await supabase.from('hospitals')
      .select('gst_number, state_code, gst_mode')
      .eq('id', hospitalId || DEMO_HOSPITAL_ID)
      .maybeSingle();
    if (error) throw error;
    return (data ?? { gst_number: null, state_code: null, gst_mode: 'cgst_sgst' }) as { gst_number: string | null; state_code: string | null; gst_mode: string | null };
  }

  async updateHospitalGstConfig(hospitalId: string, config: { gst_number?: string; state_code?: string; gst_mode?: string }): Promise<void> {
    const { error } = await supabase.from('hospitals')
      .update(config as never)
      .eq('id', hospitalId || DEMO_HOSPITAL_ID);
    if (error) throw error;
  }

  async getVisitTypes(hospitalId: string): Promise<VisitTypeRule[]> {
    const { data, error } = await supabase.from('visit_type_rules')
      .select('*').eq('hospital_id', hospitalId || DEMO_HOSPITAL_ID).order('days_threshold');
    if (error) throw error;
    return (data ?? []) as VisitTypeRule[];
  }

  async upsertVisitType(hospitalId: string, vt: Partial<VisitTypeRule>, id?: string): Promise<VisitTypeRule> {
    if (id) {
      const { data, error } = await supabase.from('visit_type_rules')
        .update(vt as never).eq('id', id).select().single();
      if (error) throw error;
      return data as VisitTypeRule;
    }
    const { data, error } = await supabase.from('visit_type_rules')
      .insert({ ...vt, hospital_id: hospitalId || DEMO_HOSPITAL_ID } as never)
      .select().single();
    if (error) throw error;
    return data as VisitTypeRule;
  }

  async deleteVisitType(id: string): Promise<void> {
    const { error } = await supabase.from('visit_type_rules').delete().eq('id', id);
    if (error) throw error;
  }

  async bulkInsert<T>(table: string, rows: Partial<T>[], hospitalId: string): Promise<number> {
    let inserted = 0;
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).map(r => ({
        ...r,
        hospital_id: hospitalId || DEMO_HOSPITAL_ID,
      }));
      const { error } = await supabase.from(table).insert(batch as never);
      if (error) throw error;
      inserted += batch.length;
    }
    return inserted;
  }
}

export const mastersService = new MastersService();
