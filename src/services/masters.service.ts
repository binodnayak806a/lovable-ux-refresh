import { mockMasterStore } from '../lib/mockMasterStore';
import type {
  DoctorMaster, DepartmentMaster, ServiceMasterRow, PackageMasterRow,
  MedicationMaster, SymptomMaster, LabTestMaster, CustomFieldConfig,
  UserRole, GstSlabRow, VisitTypeRule,
} from '../modules/masters/types';

class MastersService {
  // ── Doctors ──
  async getDoctors(hospitalId: string): Promise<DoctorMaster[]> {
    return mockMasterStore.getAll<DoctorMaster>('doctors', hospitalId);
  }
  async upsertDoctor(hospitalId: string, doctor: Partial<DoctorMaster>, id?: string): Promise<DoctorMaster> {
    if (id) return mockMasterStore.update<DoctorMaster>('doctors', id, doctor);
    return mockMasterStore.insert<DoctorMaster>('doctors', { ...doctor, hospital_id: hospitalId });
  }
  async deleteDoctor(id: string): Promise<void> { mockMasterStore.remove('doctors', id); }

  // ── Departments ──
  async getDepartments(hospitalId: string): Promise<DepartmentMaster[]> {
    return mockMasterStore.getAll<DepartmentMaster>('departments', hospitalId);
  }
  async upsertDepartment(hospitalId: string, dept: Partial<DepartmentMaster>, id?: string): Promise<DepartmentMaster> {
    if (id) return mockMasterStore.update<DepartmentMaster>('departments', id, dept);
    return mockMasterStore.insert<DepartmentMaster>('departments', { ...dept, hospital_id: hospitalId });
  }
  async deleteDepartment(id: string): Promise<void> { mockMasterStore.remove('departments', id); }

  // ── Services ──
  async getServices(hospitalId: string): Promise<ServiceMasterRow[]> {
    return mockMasterStore.getAll<ServiceMasterRow>('services', hospitalId);
  }
  async upsertService(hospitalId: string, svc: Partial<ServiceMasterRow>, id?: string): Promise<ServiceMasterRow> {
    if (id) return mockMasterStore.update<ServiceMasterRow>('services', id, svc);
    return mockMasterStore.insert<ServiceMasterRow>('services', { ...svc, hospital_id: hospitalId });
  }
  async deleteService(id: string): Promise<void> { mockMasterStore.remove('services', id); }

  // ── Packages ──
  async getPackages(hospitalId: string): Promise<PackageMasterRow[]> {
    return mockMasterStore.getAll<PackageMasterRow>('packages', hospitalId);
  }
  async upsertPackage(hospitalId: string, pkg: Partial<PackageMasterRow>, id?: string): Promise<PackageMasterRow> {
    if (id) return mockMasterStore.update<PackageMasterRow>('packages', id, pkg);
    return mockMasterStore.insert<PackageMasterRow>('packages', { ...pkg, hospital_id: hospitalId });
  }
  async deletePackage(id: string): Promise<void> { mockMasterStore.remove('packages', id); }

  // ── Medications ──
  async getMedications(hospitalId: string): Promise<MedicationMaster[]> {
    return mockMasterStore.getAll<MedicationMaster>('medications', hospitalId);
  }
  async upsertMedication(hospitalId: string, med: Partial<MedicationMaster>, id?: string): Promise<MedicationMaster> {
    if (id) return mockMasterStore.update<MedicationMaster>('medications', id, med);
    return mockMasterStore.insert<MedicationMaster>('medications', { ...med, hospital_id: hospitalId });
  }
  async deleteMedication(id: string): Promise<void> { mockMasterStore.remove('medications', id); }

  // ── Symptoms ──
  async getSymptoms(hospitalId: string): Promise<SymptomMaster[]> {
    return mockMasterStore.getAll<SymptomMaster>('symptoms', hospitalId);
  }
  async upsertSymptom(hospitalId: string, sym: Partial<SymptomMaster>, id?: string): Promise<SymptomMaster> {
    if (id) return mockMasterStore.update<SymptomMaster>('symptoms', id, sym);
    return mockMasterStore.insert<SymptomMaster>('symptoms', { ...sym, hospital_id: hospitalId });
  }
  async deleteSymptom(id: string): Promise<void> { mockMasterStore.remove('symptoms', id); }

  // ── Lab Tests ──
  async getLabTests(hospitalId: string): Promise<LabTestMaster[]> {
    return mockMasterStore.getAll<LabTestMaster>('lab_tests', hospitalId);
  }
  async upsertLabTest(hospitalId: string, test: Partial<LabTestMaster>, id?: string): Promise<LabTestMaster> {
    if (id) return mockMasterStore.update<LabTestMaster>('lab_tests', id, test);
    return mockMasterStore.insert<LabTestMaster>('lab_tests', { ...test, hospital_id: hospitalId });
  }
  async deleteLabTest(id: string): Promise<void> { mockMasterStore.remove('lab_tests', id); }

  // ── Custom Fields ──
  async getCustomFields(hospitalId: string): Promise<CustomFieldConfig[]> {
    return mockMasterStore.getAll<CustomFieldConfig>('custom_fields', hospitalId);
  }
  async upsertCustomField(hospitalId: string, field: Partial<CustomFieldConfig>, id?: string): Promise<CustomFieldConfig> {
    if (id) return mockMasterStore.update<CustomFieldConfig>('custom_fields', id, field);
    return mockMasterStore.insert<CustomFieldConfig>('custom_fields', { ...field, hospital_id: hospitalId });
  }
  async deleteCustomField(id: string): Promise<void> { mockMasterStore.remove('custom_fields', id); }

  // ── User Roles ──
  async getUserRoles(hospitalId: string): Promise<UserRole[]> {
    return mockMasterStore.getAll<UserRole>('user_roles', hospitalId);
  }
  async getProfiles(_hospitalId: string): Promise<{ id: string; full_name: string; email: string; role: string }[]> {
    // Return mock profiles
    return [
      { id: 'usr-1', full_name: 'Admin User', email: 'admin@hospital.com', role: 'admin' },
      { id: 'usr-2', full_name: 'Dr. Rajesh Kumar', email: 'rajesh@hospital.com', role: 'doctor' },
      { id: 'usr-3', full_name: 'Nurse Priya', email: 'priya.nurse@hospital.com', role: 'nurse' },
      { id: 'usr-4', full_name: 'Receptionist Anita', email: 'anita@hospital.com', role: 'receptionist' },
    ];
  }
  async upsertUserRole(hospitalId: string, role: Partial<UserRole>, id?: string): Promise<UserRole> {
    if (id) return mockMasterStore.update<UserRole>('user_roles', id, role);
    return mockMasterStore.insert<UserRole>('user_roles', { ...role, hospital_id: hospitalId });
  }
  async deleteUserRole(id: string): Promise<void> { mockMasterStore.remove('user_roles', id); }

  // ── GST ──
  async getGstSlabs(hospitalId: string): Promise<GstSlabRow[]> {
    return mockMasterStore.getAll<GstSlabRow>('gst_slabs', hospitalId);
  }
  async upsertGstSlab(hospitalId: string, slab: Partial<GstSlabRow>, id?: string): Promise<GstSlabRow> {
    if (id) return mockMasterStore.update<GstSlabRow>('gst_slabs', id, slab);
    return mockMasterStore.insert<GstSlabRow>('gst_slabs', { ...slab, hospital_id: hospitalId });
  }
  async deleteGstSlab(id: string): Promise<void> { mockMasterStore.remove('gst_slabs', id); }
  async getHospitalGstConfig(_hospitalId: string): Promise<{ gst_number: string | null; state_code: string | null; gst_mode: string | null }> {
    const cfg = mockMasterStore.getConfig();
    return {
      gst_number: (cfg.gst_number as string) || null,
      state_code: (cfg.state_code as string) || null,
      gst_mode: (cfg.gst_mode as string) || 'cgst_sgst',
    };
  }
  async updateHospitalGstConfig(_hospitalId: string, config: Record<string, unknown>): Promise<void> {
    mockMasterStore.updateConfig(config);
  }

  // ── Visit Types ──
  async getVisitTypes(hospitalId: string): Promise<VisitTypeRule[]> {
    return mockMasterStore.getAll<VisitTypeRule>('visit_types', hospitalId);
  }
  async upsertVisitType(hospitalId: string, vt: Partial<VisitTypeRule>, id?: string): Promise<VisitTypeRule> {
    if (id) return mockMasterStore.update<VisitTypeRule>('visit_types', id, vt);
    return mockMasterStore.insert<VisitTypeRule>('visit_types', { ...vt, hospital_id: hospitalId });
  }
  async deleteVisitType(id: string): Promise<void> { mockMasterStore.remove('visit_types', id); }

  // ── Bulk Insert ──
  async bulkInsert<T>(table: string, rows: Partial<T>[], hospitalId: string): Promise<number> {
    const tableMap: Record<string, string> = {
      doctors: 'doctors', departments: 'departments', medications: 'medications',
      symptoms: 'symptoms', lab_tests: 'lab_tests', services_master: 'services',
      packages_master: 'packages', gst_master: 'gst_slabs', visit_type_rules: 'visit_types',
    };
    const key = tableMap[table] || table;
    return mockMasterStore.bulkInsert(key as 'doctors', rows, hospitalId);
  }
}

export const mastersService = new MastersService();
