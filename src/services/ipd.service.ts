import { mockMasterStore } from '../lib/mockMasterStore';
import type {
  Ward, Bed, Admission, NursingTask, IpdVitals, NursingNote,
  DoctorRound, AdmissionFormData, TaskFormData, BedStatus, TaskStatus,
  IpdBillItem, DischargeSummary, DischargeFormData,
  BillSummary, ServiceMaster, PackageMaster, GstMaster, IpdPayment, IpdDailyNote,
  EnhancedBillSummary,
} from '../modules/ipd/types';

const ipdService = {
  // ── Wards ──
  async getWards(hospitalId: string): Promise<Ward[]> {
    return mockMasterStore.getAll<Ward>('wards', hospitalId).filter(w => w.is_active);
  },

  async createWard(hospitalId: string, name: string, wardType: string, floor: number, dailyRate: number): Promise<Ward> {
    return mockMasterStore.insert<Ward>('wards', {
      hospital_id: hospitalId, name, ward_type: wardType as Ward['ward_type'],
      total_beds: 0, available_beds: 0, floor, block: null, daily_rate: dailyRate, is_active: true,
    } as Partial<Ward>);
  },

  // ── Beds ──
  async getBeds(hospitalId: string, wardId?: string, status?: BedStatus): Promise<Bed[]> {
    let beds = mockMasterStore.getAll<Bed>('beds', hospitalId);
    if (wardId) beds = beds.filter(b => b.ward_id === wardId);
    if (status) beds = beds.filter(b => b.status === status);
    return beds;
  },

  async createBed(hospitalId: string, wardId: string, bedNumber: string, bedType: string, dailyRate: number): Promise<Bed> {
    const ward = mockMasterStore.getById<Ward>('wards', wardId);
    return mockMasterStore.insert<Bed>('beds', {
      hospital_id: hospitalId, ward_id: wardId, bed_number: bedNumber,
      bed_type: bedType as Bed['bed_type'], status: 'available' as BedStatus, daily_rate: dailyRate,
      ward: ward ? { id: ward.id, name: ward.name, ward_type: ward.ward_type, floor: ward.floor, daily_rate: ward.daily_rate } : undefined,
    } as Partial<Bed>);
  },

  async bulkCreateBeds(hospitalId: string, wardId: string, prefix: string, startNum: number, endNum: number, bedType: string, dailyRate: number): Promise<number> {
    const ward = mockMasterStore.getById<Ward>('wards', wardId);
    let count = 0;
    for (let i = startNum; i <= endNum; i++) {
      mockMasterStore.insert<Bed>('beds', {
        hospital_id: hospitalId, ward_id: wardId, bed_number: `${prefix}${i}`,
        bed_type: bedType as Bed['bed_type'], status: 'available' as BedStatus, daily_rate: dailyRate,
        ward: ward ? { id: ward.id, name: ward.name, ward_type: ward.ward_type, floor: ward.floor, daily_rate: ward.daily_rate } : undefined,
      } as Partial<Bed>);
      count++;
    }
    return count;
  },

  async getBedsWithOccupancy(hospitalId: string): Promise<Bed[]> {
    const beds = mockMasterStore.getAll<Bed>('beds', hospitalId);
    const admissions = mockMasterStore.getAll<Admission>('admissions', hospitalId).filter(a => a.status === 'active');
    const admMap = new Map(admissions.map(a => [a.bed_id, a]));
    return beds.map(bed => {
      const adm = admMap.get(bed.id);
      return {
        ...bed,
        current_admission: adm ? {
          id: adm.id, admission_number: adm.admission_number,
          patient_name: (adm.patient as { full_name?: string })?.full_name ?? '',
          admission_date: adm.admission_date,
          days_admitted: Math.ceil((Date.now() - new Date(adm.admission_date).getTime()) / 86400000),
        } : null,
      };
    });
  },

  async updateBedStatus(bedId: string, status: BedStatus): Promise<void> {
    mockMasterStore.update('beds', bedId, { status });
  },

  async generateAdmissionNumber(): Promise<string> {
    const d = new Date();
    const yy = d.getFullYear().toString().slice(-2);
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `ADM${yy}${mm}${rand}`;
  },

  async createAdmission(form: AdmissionFormData, hospitalId: string, _userId: string): Promise<Admission> {
    const admissionNumber = await this.generateAdmissionNumber();
    const admission = mockMasterStore.insert<Admission>('admissions', {
      admission_number: admissionNumber, hospital_id: hospitalId,
      patient_id: form.patient_id, doctor_id: form.doctor_id,
      ward_id: form.ward_id, bed_id: form.bed_id,
      admission_type: form.admission_type, primary_diagnosis: form.primary_diagnosis || null,
      secondary_diagnosis: form.secondary_diagnosis || null, billing_category: form.billing_category,
      insurance_company: form.insurance_company || null, policy_number: form.policy_number || null,
      estimated_stay_days: form.estimated_stay_days, mlc_case: form.mlc_case,
      notes: form.notes || null, status: 'active',
      admission_date: new Date().toISOString(), discharge_date: null,
    } as Partial<Admission>);
    await this.updateBedStatus(form.bed_id, 'occupied');
    return admission;
  },

  async getActiveAdmissions(hospitalId?: string): Promise<Admission[]> {
    const all = hospitalId ? mockMasterStore.getAll<Admission>('admissions', hospitalId) : mockMasterStore.getAll<Admission>('admissions');
    return all.filter(a => a.status === 'active');
  },

  async getAllAdmissions(
    hospitalId: string,
    filters: { status?: string | null; wardId?: string; doctorId?: string; billingStatus?: string; dateFrom?: string; dateTo?: string },
    page: number, perPage: number
  ): Promise<{ data: Admission[]; total: number }> {
    let data = mockMasterStore.getAll<Admission>('admissions', hospitalId);
    if (filters.status) data = data.filter(a => a.status === filters.status);
    if (filters.wardId) data = data.filter(a => a.ward_id === filters.wardId);
    if (filters.doctorId) data = data.filter(a => a.doctor_id === filters.doctorId);
    const total = data.length;
    const start = (page - 1) * perPage;
    return { data: data.slice(start, start + perPage), total };
  },

  async getAdmission(admissionId: string): Promise<Admission | null> {
    return mockMasterStore.getById<Admission>('admissions', admissionId);
  },

  async getAdmissionCounts(hospitalId: string): Promise<Record<string, number>> {
    const all = mockMasterStore.getAll<Admission>('admissions', hospitalId);
    return {
      all: all.length, active: all.filter(a => a.status === 'active').length,
      discharged: all.filter(a => a.status === 'discharged').length,
      transferred: all.filter(a => a.status === 'transferred').length,
      absconded: all.filter(a => a.status === 'absconded').length,
    };
  },

  async getDoctors(): Promise<{ id: string; full_name: string; department: string | null }[]> {
    return mockMasterStore.getAll<Record<string, unknown>>('doctors').map(d => ({
      id: d.id as string, full_name: `${d.first_name} ${d.last_name || ''}`.trim(),
      department: (d.specialty as string) || null,
    }));
  },

  // ── Nursing Tasks ──
  async getNursingTasks(admissionId: string, _date?: string): Promise<NursingTask[]> {
    return mockMasterStore.getAll<NursingTask>('nursing_tasks').filter(t => t.admission_id === admissionId);
  },
  async createNursingTask(admissionId: string, form: TaskFormData, _userId: string): Promise<NursingTask> {
    return mockMasterStore.insert<NursingTask>('nursing_tasks', { admission_id: admissionId, ...form, status: 'pending', completed_time: null, completed_by: null } as Partial<NursingTask>);
  },
  async updateTaskStatus(taskId: string, status: TaskStatus, userId?: string): Promise<void> {
    const updates: Record<string, unknown> = { status };
    if (status === 'completed') { updates.completed_time = new Date().toISOString(); updates.completed_by = userId; }
    mockMasterStore.update('nursing_tasks', taskId, updates);
  },

  // ── Vitals ──
  async getIpdVitals(admissionId: string, limit = 20): Promise<IpdVitals[]> {
    return mockMasterStore.getAll<IpdVitals>('ipd_vitals').filter(v => v.admission_id === admissionId)
      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)).slice(0, limit);
  },
  async recordIpdVitals(admissionId: string, vitals: Partial<IpdVitals>, _userId: string): Promise<IpdVitals> {
    return mockMasterStore.insert<IpdVitals>('ipd_vitals', { admission_id: admissionId, recorded_at: new Date().toISOString(), ...vitals } as Partial<IpdVitals>);
  },

  // ── Nursing Notes ──
  async getNursingNotes(admissionId: string): Promise<NursingNote[]> {
    return mockMasterStore.getAll<NursingNote>('nursing_notes').filter(n => n.admission_id === admissionId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async addNursingNote(admissionId: string, noteType: string, noteText: string, _userId: string): Promise<NursingNote> {
    return mockMasterStore.insert<NursingNote>('nursing_notes', { admission_id: admissionId, note_type: noteType as NursingNote['note_type'], note_text: noteText, nurse_name: 'Current User' } as Partial<NursingNote>);
  },

  // ── Doctor Rounds ──
  async getDoctorRounds(admissionId: string): Promise<DoctorRound[]> {
    return mockMasterStore.getAll<DoctorRound>('doctor_rounds').filter(r => r.admission_id === admissionId).sort((a, b) => b.round_date.localeCompare(a.round_date));
  },
  async addDoctorRound(admissionId: string, round: Partial<DoctorRound>, _userId: string): Promise<DoctorRound> {
    return mockMasterStore.insert<DoctorRound>('doctor_rounds', { admission_id: admissionId, round_date: new Date().toISOString().split('T')[0], doctor_name: 'Dr. Current User', ...round } as Partial<DoctorRound>);
  },

  // ── Daily Notes ──
  async addDailyNote(admissionId: string, _doctorId: string, noteDate: string, observations: string, plan: string, vitals: Record<string, unknown>): Promise<IpdDailyNote> {
    return mockMasterStore.insert<IpdDailyNote>('doctor_rounds', {
      admission_id: admissionId, round_date: noteDate, clinical_notes: observations,
      treatment_plan: plan, doctor_name: 'Dr. Current User',
    } as unknown as Partial<IpdDailyNote>);
  },

  async getDailyNotes(admissionId: string): Promise<IpdDailyNote[]> {
    const rounds = await this.getDoctorRounds(admissionId);
    return rounds.map(r => ({ id: r.id, admission_id: r.admission_id, doctor_id: r.doctor_id, note_date: r.round_date, observations: r.clinical_notes, plan: r.treatment_plan, vitals: {}, created_at: r.created_at, doctor_name: r.doctor_name }));
  },

  // ── IPD Billing ──
  async getIpdBillItems(admissionId: string): Promise<IpdBillItem[]> {
    return this.getBillItems(admissionId);
  },
  async getBillItems(admissionId: string): Promise<IpdBillItem[]> {
    return mockMasterStore.getAll<IpdBillItem>('ipd_bill_items').filter(b => b.admission_id === admissionId);
  },
  async addBillItem(admissionId: string, item: Partial<IpdBillItem>, _userId: string): Promise<IpdBillItem> {
    const totalPrice = (item.quantity || 1) * (item.unit_price || 0);
    const gstAmount = totalPrice * ((item.gst_rate || 0) / 100);
    return mockMasterStore.insert<IpdBillItem>('ipd_bill_items', {
      admission_id: admissionId, item_date: new Date().toISOString().split('T')[0],
      quantity: 1, is_billable: true, gst_rate: 0, gst_amount: gstAmount, total_price: totalPrice, ...item,
    } as Partial<IpdBillItem>);
  },
  async addBillItemWithGst(admissionId: string, item: Partial<IpdBillItem & { hsn_code?: string }>, userId: string): Promise<IpdBillItem> {
    const totalPrice = (item.quantity || 1) * (item.unit_price || 0);
    const gstAmount = totalPrice * ((item.gst_rate || 0) / 100);
    return mockMasterStore.insert<IpdBillItem>('ipd_bill_items', {
      admission_id: admissionId, item_date: new Date().toISOString().split('T')[0],
      quantity: 1, is_billable: true, gst_rate: item.gst_rate || 0, gst_amount: gstAmount,
      total_price: totalPrice + gstAmount, hsn_code: item.hsn_code || null, ...item,
      created_by: userId,
    } as Partial<IpdBillItem>);
  },
  async updateBillItem(itemId: string, updates: Partial<IpdBillItem>): Promise<IpdBillItem> {
    return mockMasterStore.update<IpdBillItem>('ipd_bill_items', itemId, updates);
  },
  async deleteBillItem(itemId: string): Promise<void> { mockMasterStore.remove('ipd_bill_items', itemId); },

  async generateDailyBedCharge(admissionId: string, userId: string): Promise<IpdBillItem | null> {
    const today = new Date().toISOString().split('T')[0];
    const existing = mockMasterStore.getAll<IpdBillItem>('ipd_bill_items')
      .find(i => i.admission_id === admissionId && i.item_type === 'bed_charges' && i.item_date === today);
    if (existing) return null;
    const admission = mockMasterStore.getById<Admission>('admissions', admissionId);
    if (!admission) return null;
    const bed = mockMasterStore.getById<Bed>('beds', admission.bed_id);
    const rate = bed?.daily_rate || 800;
    return this.addBillItem(admissionId, {
      item_type: 'bed_charges', item_name: `Bed Charges - ${bed?.bed_number || 'Bed'}`,
      item_date: today, quantity: 1, unit_price: rate, total_price: rate, gst_rate: 5, gst_amount: rate * 0.05,
    }, userId);
  },

  async searchServices(hospitalId: string, query: string): Promise<ServiceMaster[]> {
    const all = mockMasterStore.getAll<Record<string, unknown>>('services', hospitalId);
    const q = query.toLowerCase();
    return all.filter(s => (s.service_name as string)?.toLowerCase().includes(q) && s.is_active) as unknown as ServiceMaster[];
  },

  async addPackageToAdmission(admissionId: string, pkg: PackageMaster, userId: string): Promise<void> {
    for (const svc of pkg.services) {
      await this.addBillItem(admissionId, {
        item_type: 'procedure', item_name: svc.name, quantity: 1, unit_price: svc.price, total_price: svc.price,
        category: 'Package: ' + pkg.package_name,
      }, userId);
    }
  },

  async getBillSummary(admissionId: string): Promise<BillSummary & { totalPaid: number; balanceDue: number }> {
    const items = await this.getBillItems(admissionId);
    const subtotal = items.filter(i => i.is_billable).reduce((s, i) => s + i.total_price, 0);
    const taxAmount = items.reduce((s, i) => s + (i.gst_amount || 0), 0);
    const payments = await this.getPayments(admissionId);
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    return { subtotal, discountPercent: 0, discountAmount: 0, taxPercent: subtotal > 0 ? (taxAmount / subtotal) * 100 : 0, taxAmount, total: subtotal + taxAmount, totalPaid, balanceDue: subtotal + taxAmount - totalPaid };
  },

  calculateEnhancedBillSummary(items: IpdBillItem[], payments: IpdPayment[], _gstRates: GstMaster[], useIGST: boolean): EnhancedBillSummary {
    const subtotal = items.filter(i => i.is_billable).reduce((s, i) => s + (i.quantity * i.unit_price), 0);
    const totalGst = items.reduce((s, i) => s + (i.gst_amount || 0), 0);
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const total = subtotal + totalGst;
    return {
      subtotal, discountPercent: 0, discountAmount: 0, taxPercent: subtotal > 0 ? (totalGst / subtotal) * 100 : 0,
      taxAmount: totalGst, total, totalPaid, balanceDue: total - totalPaid,
      gstBreakup: useIGST ? { cgst: 0, sgst: 0, igst: totalGst } : { cgst: totalGst / 2, sgst: totalGst / 2, igst: 0 },
    };
  },

  // ── Payments ──
  async getIpdPayments(admissionId: string): Promise<IpdPayment[]> { return this.getPayments(admissionId); },
  async getPayments(admissionId: string): Promise<IpdPayment[]> {
    return mockMasterStore.getAll<IpdPayment>('ipd_payments').filter(p => p.admission_id === admissionId);
  },
  async addIpdPayment(admissionId: string, hospitalId: string, amount: number, paymentMode: string, notes: string, userId: string): Promise<IpdPayment> {
    return this.addPayment(admissionId, { amount, payment_mode: paymentMode, notes, created_by: userId }, hospitalId);
  },
  async addPayment(admissionId: string, payment: Partial<IpdPayment>, hospitalId: string): Promise<IpdPayment> {
    return mockMasterStore.insert<IpdPayment>('ipd_payments', {
      admission_id: admissionId, hospital_id: hospitalId,
      receipt_number: `RCP-${Date.now().toString(36).toUpperCase()}`, ...payment,
    } as Partial<IpdPayment>);
  },

  // ── Discharge ──
  async getDischargeSummary(admissionId: string): Promise<DischargeSummary | null> {
    return mockMasterStore.getAll<DischargeSummary>('discharge_summaries').find(d => d.admission_id === admissionId) || null;
  },
  async processDischarge(admissionId: string, form: DischargeFormData, userId: string, _generateBill: boolean): Promise<DischargeSummary> {
    return this.createDischargeSummary(admissionId, form, userId);
  },
  async createDischargeSummary(admissionId: string, form: DischargeFormData, _userId: string): Promise<DischargeSummary> {
    const ds = mockMasterStore.insert<DischargeSummary>('discharge_summaries', { admission_id: admissionId, ...form } as Partial<DischargeSummary>);
    mockMasterStore.update('admissions', admissionId, { status: 'discharged', discharge_date: form.discharge_date });
    const admission = mockMasterStore.getById<Admission>('admissions', admissionId);
    if (admission?.bed_id) mockMasterStore.update('beds', admission.bed_id, { status: 'available' });
    return ds;
  },

  // ── Service Masters (for billing) ──
  async getServiceMasters(hospitalId: string): Promise<ServiceMaster[]> {
    return mockMasterStore.getAll<Record<string, unknown>>('services', hospitalId).filter(s => s.is_active) as unknown as ServiceMaster[];
  },
  async getPackageMasters(hospitalId: string): Promise<PackageMaster[]> {
    return mockMasterStore.getAll<Record<string, unknown>>('packages', hospitalId).filter(p => p.is_active) as unknown as PackageMaster[];
  },
  async getPackagesMaster(hospitalId: string): Promise<PackageMaster[]> { return this.getPackageMasters(hospitalId); },
  async getGstMasters(hospitalId: string): Promise<GstMaster[]> {
    return mockMasterStore.getAll<Record<string, unknown>>('gst_slabs', hospitalId) as unknown as GstMaster[];
  },
  async getGstRates(hospitalId: string): Promise<GstMaster[]> { return this.getGstMasters(hospitalId); },

  // ── Bed History ──
  async getBedHistory(_admissionId: string): Promise<{ bed_number: string; ward_name: string; assigned_at: string; released_at: string | null; reason: string | null }[]> {
    return [];
  },
};

export default ipdService;
