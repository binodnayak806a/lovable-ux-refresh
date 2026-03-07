import { supabase } from '../lib/supabase';
import type {
  Ward,
  Bed,
  Admission,
  NursingTask,
  IpdVitals,
  NursingNote,
  DoctorRound,
  AdmissionFormData,
  TaskFormData,
  BedStatus,
  TaskStatus,
  IpdBillItem,
  DischargeSummary,
  DischargeFormData,
  BillItemType,
  BillSummary,
  ServiceMaster,
  PackageMaster,
  GstMaster,
  IpdPayment,
  IpdDailyNote,
} from '../modules/ipd/types';

interface BedRow {
  id: string;
  hospital_id: string;
  ward_id: string;
  bed_number: string;
  bed_type: string;
  status: string;
  daily_rate: number;
  ward: { id: string; name: string; ward_type: string; floor: number; daily_rate: number } | null;
}

interface AdmissionRow {
  id: string;
  admission_number: string;
  bed_id: string;
  admission_date: string;
  patient: { full_name: string } | null;
}

interface TaskRow {
  admission_id: string;
}

interface VitalsRow {
  admission_id: string;
  [key: string]: unknown;
}

interface NursingNoteRow {
  id: string;
  admission_id: string;
  nurse_id: string | null;
  note_type: string;
  note_text: string;
  created_at: string;
  nurse: { full_name: string } | null;
}

interface DoctorRoundRow {
  id: string;
  admission_id: string;
  doctor_id: string | null;
  round_date: string;
  round_time: string | null;
  clinical_notes: string | null;
  treatment_plan: string | null;
  orders: string | null;
  follow_up_instructions: string | null;
  created_at: string;
  doctor: { full_name: string } | null;
}

interface AdmissionQueryRow {
  id: string;
  [key: string]: unknown;
}

const ipdService = {
  async getWards(hospitalId: string): Promise<Ward[]> {
    const { data, error } = await supabase
      .from('wards')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return (data ?? []) as Ward[];
  },

  async getBeds(hospitalId: string, wardId?: string, status?: BedStatus): Promise<Bed[]> {
    let query = supabase
      .from('beds')
      .select(`
        *,
        ward:wards(id, name, ward_type, floor, daily_rate)
      `)
      .eq('hospital_id', hospitalId)
      .order('bed_number');

    if (wardId) {
      query = query.eq('ward_id', wardId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Bed[];
  },

  async getBedsWithOccupancy(hospitalId: string): Promise<Bed[]> {
    const { data: beds, error: bedsError } = await supabase
      .from('beds')
      .select(`
        *,
        ward:wards(id, name, ward_type, floor, daily_rate)
      `)
      .eq('hospital_id', hospitalId)
      .order('bed_number');

    if (bedsError) throw bedsError;

    const bedRows = (beds ?? []) as BedRow[];
    const occupiedBedIds = bedRows
      .filter((b) => b.status === 'occupied')
      .map((b) => b.id);

    if (occupiedBedIds.length > 0) {
      const { data: admissions } = await supabase
        .from('admissions')
        .select(`
          id,
          admission_number,
          bed_id,
          admission_date,
          patient:patients(full_name)
        `)
        .in('bed_id', occupiedBedIds)
        .eq('status', 'active');

      const admissionRows = (admissions ?? []) as AdmissionRow[];
      const admissionMap = new Map(
        admissionRows.map((a) => [a.bed_id, a])
      );

      return bedRows.map((bed) => {
        const admission = admissionMap.get(bed.id);
        return {
          ...bed,
          current_admission: admission
            ? {
                id: admission.id,
                admission_number: admission.admission_number,
                patient_name: admission.patient?.full_name ?? '',
                admission_date: admission.admission_date,
                days_admitted: Math.ceil(
                  (Date.now() - new Date(admission.admission_date).getTime()) /
                    (1000 * 60 * 60 * 24)
                ),
              }
            : null,
        };
      }) as Bed[];
    }

    return bedRows as Bed[];
  },

  async updateBedStatus(bedId: string, status: BedStatus): Promise<void> {
    const { error } = await supabase
      .from('beds')
      .update({ status, updated_at: new Date().toISOString() } as never)
      .eq('id', bedId);
    if (error) throw error;

    const { data: bedData } = await supabase
      .from('beds')
      .select('ward_id')
      .eq('id', bedId)
      .single();

    const wardId = (bedData as { ward_id: string } | null)?.ward_id;

    if (wardId) {
      const { count } = await supabase
        .from('beds')
        .select('*', { count: 'exact', head: true })
        .eq('ward_id', wardId)
        .eq('status', 'available');

      await supabase
        .from('wards')
        .update({ available_beds: count ?? 0 } as never)
        .eq('id', wardId);
    }
  },

  async generateAdmissionNumber(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_admission_number');
    if (error) {
      const now = new Date();
      const yy = now.getFullYear().toString().slice(-2);
      const mm = (now.getMonth() + 1).toString().padStart(2, '0');
      const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      return `ADM${yy}${mm}${rand}`;
    }
    return data as string;
  },

  async createAdmission(
    form: AdmissionFormData,
    hospitalId: string,
    userId: string
  ): Promise<Admission> {
    const admissionNumber = await this.generateAdmissionNumber();

    const { data, error } = await supabase
      .from('admissions')
      .insert({
        admission_number: admissionNumber,
        hospital_id: hospitalId,
        patient_id: form.patient_id,
        doctor_id: form.doctor_id,
        ward_id: form.ward_id,
        bed_id: form.bed_id,
        admission_type: form.admission_type,
        primary_diagnosis: form.primary_diagnosis || null,
        secondary_diagnosis: form.secondary_diagnosis || null,
        billing_category: form.billing_category,
        insurance_company: form.insurance_company || null,
        policy_number: form.policy_number || null,
        estimated_stay_days: form.estimated_stay_days,
        mlc_case: form.mlc_case,
        notes: form.notes || null,
        status: 'active',
        created_by: userId,
      } as never)
      .select()
      .single();

    if (error) throw error;

    await this.updateBedStatus(form.bed_id, 'occupied');

    await supabase.from('bed_history').insert({
      admission_id: (data as Admission).id,
      bed_id: form.bed_id,
      reason: 'Initial admission',
    } as never);

    return data as Admission;
  },

  async getActiveAdmissions(hospitalId?: string): Promise<Admission[]> {
    let query = supabase
      .from('admissions')
      .select(`
        *,
        patient:patients(id, uhid, full_name, phone, gender, date_of_birth, blood_group),
        bed:beds(id, bed_number, bed_type, daily_rate, ward:wards(id, name, ward_type)),
        doctor:profiles!admissions_doctor_id_fkey(id, full_name, department, designation)
      `)
      .eq('status', 'active')
      .order('admission_date', { ascending: false });

    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const admissionRows = (data ?? []) as AdmissionQueryRow[];
    const admissionIds = admissionRows.map((a) => a.id);

    if (admissionIds.length > 0) {
      const { data: taskCounts } = await supabase
        .from('nursing_tasks')
        .select('admission_id')
        .in('admission_id', admissionIds)
        .eq('status', 'pending');

      const taskRows = (taskCounts ?? []) as TaskRow[];
      const taskCountMap = taskRows.reduce(
        (acc, t) => {
          acc[t.admission_id] = (acc[t.admission_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const { data: vitals } = await supabase
        .from('ipd_vitals')
        .select('*')
        .in('admission_id', admissionIds)
        .order('recorded_at', { ascending: false });

      const vitalsRows = (vitals ?? []) as VitalsRow[];
      const vitalsMap = new Map<string, IpdVitals>();
      vitalsRows.forEach((v) => {
        if (!vitalsMap.has(v.admission_id)) {
          vitalsMap.set(v.admission_id, v as unknown as IpdVitals);
        }
      });

      return admissionRows.map((a) => ({
        ...a,
        pending_tasks_count: taskCountMap[a.id] || 0,
        latest_vitals: vitalsMap.get(a.id) || null,
      })) as Admission[];
    }

    return admissionRows as unknown as Admission[];
  },

  async getAdmission(admissionId: string): Promise<Admission | null> {
    const { data, error } = await supabase
      .from('admissions')
      .select(`
        *,
        patient:patients(id, uhid, full_name, phone, gender, date_of_birth, blood_group),
        bed:beds(id, bed_number, bed_type, daily_rate, ward:wards(id, name, ward_type)),
        doctor:profiles!admissions_doctor_id_fkey(id, full_name, department, designation)
      `)
      .eq('id', admissionId)
      .maybeSingle();

    if (error) throw error;
    return data as Admission | null;
  },

  async getNursingTasks(admissionId: string, date?: string): Promise<NursingTask[]> {
    let query = supabase
      .from('nursing_tasks')
      .select('*')
      .eq('admission_id', admissionId)
      .order('scheduled_time');

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query = query
        .gte('scheduled_time', startOfDay.toISOString())
        .lte('scheduled_time', endOfDay.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as NursingTask[];
  },

  async createNursingTask(
    admissionId: string,
    form: TaskFormData,
    userId: string
  ): Promise<NursingTask> {
    const { data, error } = await supabase
      .from('nursing_tasks')
      .insert({
        admission_id: admissionId,
        task_type: form.task_type,
        task_description: form.task_description,
        scheduled_time: form.scheduled_time,
        priority: form.priority,
        recurrence: form.recurrence,
        notes: form.notes || null,
        created_by: userId,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data as NursingTask;
  },

  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    userId?: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === 'completed') {
      updateData.completed_time = new Date().toISOString();
      updateData.completed_by = userId;
    }
    const { error } = await supabase
      .from('nursing_tasks')
      .update(updateData as never)
      .eq('id', taskId);
    if (error) throw error;
  },

  async getIpdVitals(admissionId: string, limit = 20): Promise<IpdVitals[]> {
    const { data, error } = await supabase
      .from('ipd_vitals')
      .select('*')
      .eq('admission_id', admissionId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as IpdVitals[];
  },

  async recordIpdVitals(
    admissionId: string,
    vitals: Partial<IpdVitals>,
    userId: string
  ): Promise<IpdVitals> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, admission_id, recorded_by, ...vitalsData } = vitals as IpdVitals;
    const { data, error } = await supabase
      .from('ipd_vitals')
      .insert({
        admission_id: admissionId,
        recorded_by: userId,
        ...vitalsData,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data as IpdVitals;
  },

  async getNursingNotes(admissionId: string): Promise<NursingNote[]> {
    const { data, error } = await supabase
      .from('nursing_notes')
      .select(`
        *,
        nurse:profiles!nursing_notes_nurse_id_fkey(full_name)
      `)
      .eq('admission_id', admissionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const rows = (data ?? []) as NursingNoteRow[];
    return rows.map((n) => ({
      ...n,
      nurse_name: n.nurse?.full_name ?? null,
    })) as NursingNote[];
  },

  async addNursingNote(
    admissionId: string,
    noteType: string,
    noteText: string,
    userId: string
  ): Promise<NursingNote> {
    const { data, error } = await supabase
      .from('nursing_notes')
      .insert({
        admission_id: admissionId,
        nurse_id: userId,
        note_type: noteType,
        note_text: noteText,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data as NursingNote;
  },

  async getDoctorRounds(admissionId: string): Promise<DoctorRound[]> {
    const { data, error } = await supabase
      .from('doctor_rounds')
      .select(`
        *,
        doctor:profiles!doctor_rounds_doctor_id_fkey(full_name)
      `)
      .eq('admission_id', admissionId)
      .order('round_date', { ascending: false });

    if (error) throw error;
    const rows = (data ?? []) as DoctorRoundRow[];
    return rows.map((r) => ({
      ...r,
      doctor_name: r.doctor?.full_name ?? null,
    })) as DoctorRound[];
  },

  async addDoctorRound(
    admissionId: string,
    round: Partial<DoctorRound>,
    userId: string
  ): Promise<DoctorRound> {
    const { data, error } = await supabase
      .from('doctor_rounds')
      .insert({
        admission_id: admissionId,
        doctor_id: userId,
        round_date: round.round_date || new Date().toISOString().split('T')[0],
        round_time: round.round_time || new Date().toTimeString().split(' ')[0],
        clinical_notes: round.clinical_notes || null,
        treatment_plan: round.treatment_plan || null,
        orders: round.orders || null,
        follow_up_instructions: round.follow_up_instructions || null,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data as DoctorRound;
  },

  async dischargePatient(
    admissionId: string,
    dischargeSummary: string
  ): Promise<void> {
    const { data: admission } = await supabase
      .from('admissions')
      .select('bed_id')
      .eq('id', admissionId)
      .single();

    const { error } = await supabase
      .from('admissions')
      .update({
        status: 'discharged',
        discharge_date: new Date().toISOString(),
        discharge_summary: dischargeSummary,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', admissionId);

    if (error) throw error;

    const bedId = (admission as { bed_id: string } | null)?.bed_id;
    if (bedId) {
      await this.updateBedStatus(bedId, 'cleaning');

      await supabase
        .from('bed_history')
        .update({
          released_at: new Date().toISOString(),
          reason: 'Patient discharged',
        } as never)
        .eq('admission_id', admissionId)
        .is('released_at', null);
    }
  },

  async getDoctors(): Promise<DoctorInfo[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, department, designation')
      .eq('role', 'doctor')
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;
    return (data ?? []) as DoctorInfo[];
  },

  async getIpdBillItems(admissionId: string): Promise<IpdBillItem[]> {
    const { data, error } = await supabase
      .from('ipd_bill_items')
      .select('*')
      .eq('admission_id', admissionId)
      .order('item_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as IpdBillItem[];
  },

  async addBillItem(
    admissionId: string,
    item: {
      item_type: BillItemType;
      item_name: string;
      item_description?: string;
      quantity: number;
      unit_price: number;
      item_date?: string;
    },
    userId: string
  ): Promise<IpdBillItem> {
    const totalPrice = item.quantity * item.unit_price;
    const { data, error } = await supabase
      .from('ipd_bill_items')
      .insert({
        admission_id: admissionId,
        item_type: item.item_type,
        item_name: item.item_name,
        item_description: item.item_description || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: totalPrice,
        item_date: item.item_date || new Date().toISOString().split('T')[0],
        created_by: userId,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data as IpdBillItem;
  },

  async updateBillItem(
    itemId: string,
    updates: Partial<Pick<IpdBillItem, 'quantity' | 'unit_price' | 'is_billable'>>
  ): Promise<void> {
    const updateData: Record<string, unknown> = { ...updates };
    if (updates.quantity !== undefined || updates.unit_price !== undefined) {
      const { data: existing } = await supabase
        .from('ipd_bill_items')
        .select('quantity, unit_price')
        .eq('id', itemId)
        .single();

      const qty = updates.quantity ?? (existing as { quantity: number } | null)?.quantity ?? 1;
      const price = updates.unit_price ?? (existing as { unit_price: number } | null)?.unit_price ?? 0;
      updateData.total_price = qty * price;
    }

    const { error } = await supabase
      .from('ipd_bill_items')
      .update(updateData as never)
      .eq('id', itemId);

    if (error) throw error;
  },

  async deleteBillItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('ipd_bill_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  },

  async generateDailyBedCharge(admissionId: string, userId: string): Promise<IpdBillItem | null> {
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('ipd_bill_items')
      .select('id')
      .eq('admission_id', admissionId)
      .eq('item_date', today)
      .eq('item_type', 'bed_charges')
      .maybeSingle();

    if (existing) return null;

    const { data: admission } = await supabase
      .from('admissions')
      .select(`
        bed:beds(bed_number, daily_rate, ward:wards(name))
      `)
      .eq('id', admissionId)
      .single();

    const admData = admission as { bed: { bed_number: string; daily_rate: number; ward: { name: string } } } | null;
    if (!admData?.bed) return null;

    const { data, error } = await supabase
      .from('ipd_bill_items')
      .insert({
        admission_id: admissionId,
        item_type: 'bed_charges',
        item_name: `Bed Charges - ${admData.bed.bed_number} (${admData.bed.ward.name})`,
        quantity: 1,
        unit_price: admData.bed.daily_rate,
        total_price: admData.bed.daily_rate,
        item_date: today,
        created_by: userId,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data as IpdBillItem;
  },

  calculateBillSummary(items: IpdBillItem[], discountPercent = 0, taxPercent = 18): BillSummary {
    const billableItems = items.filter((i) => i.is_billable);
    const subtotal = billableItems.reduce((sum, item) => sum + Number(item.total_price), 0);
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxPercent) / 100;
    const total = taxableAmount + taxAmount;

    return {
      subtotal,
      discountPercent,
      discountAmount,
      taxPercent,
      taxAmount,
      total,
    };
  },

  async getDischargeSummary(admissionId: string): Promise<DischargeSummary | null> {
    const { data, error } = await supabase
      .from('discharge_summaries')
      .select('*')
      .eq('admission_id', admissionId)
      .maybeSingle();

    if (error) throw error;
    return data as DischargeSummary | null;
  },

  async createDischargeSummary(
    admissionId: string,
    form: DischargeFormData,
    userId: string
  ): Promise<DischargeSummary> {
    const { data, error } = await supabase
      .from('discharge_summaries')
      .insert({
        admission_id: admissionId,
        discharge_date: form.discharge_date,
        discharge_type: form.discharge_type,
        final_diagnosis: form.final_diagnosis,
        treatment_summary: form.treatment_summary || null,
        procedures_performed: form.procedures_performed || null,
        medications_on_discharge: form.medications_on_discharge || null,
        follow_up_instructions: form.follow_up_instructions || null,
        follow_up_date: form.follow_up_date || null,
        diet_advice: form.diet_advice || null,
        activity_restrictions: form.activity_restrictions || null,
        condition_at_discharge: form.condition_at_discharge,
        created_by: userId,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data as DischargeSummary;
  },

  async processDischarge(
    admissionId: string,
    form: DischargeFormData,
    userId: string,
    generateFinalBill = true
  ): Promise<{ dischargeSummary: DischargeSummary; billId?: string }> {
    const dischargeSummary = await this.createDischargeSummary(admissionId, form, userId);

    const admissionStatus = form.discharge_type === 'Death' ? 'death' :
      form.discharge_type === 'Transfer' ? 'transferred' :
      form.discharge_type === 'Absconded' ? 'absconded' : 'discharged';

    const { data: admission } = await supabase
      .from('admissions')
      .select('bed_id, hospital_id, patient_id')
      .eq('id', admissionId)
      .single();

    const admData = admission as { bed_id: string; hospital_id: string; patient_id: string } | null;

    const { error: updateError } = await supabase
      .from('admissions')
      .update({
        status: admissionStatus,
        discharge_date: form.discharge_date,
        discharge_summary: form.final_diagnosis,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', admissionId);

    if (updateError) throw updateError;

    if (admData?.bed_id) {
      await this.updateBedStatus(admData.bed_id, 'cleaning');

      await supabase
        .from('bed_history')
        .update({
          released_at: new Date().toISOString(),
          reason: `Patient ${admissionStatus}`,
        } as never)
        .eq('admission_id', admissionId)
        .is('released_at', null);
    }

    let billId: string | undefined;
    if (generateFinalBill && admData) {
      const billResult = await this.generateFinalBill(admissionId, admData.hospital_id, admData.patient_id, userId);
      billId = billResult?.id;
    }

    return { dischargeSummary, billId };
  },

  async generateFinalBill(
    admissionId: string,
    hospitalId: string,
    patientId: string,
    userId: string
  ): Promise<{ id: string } | null> {
    const items = await this.getIpdBillItems(admissionId);
    if (items.length === 0) return null;

    const summary = this.calculateBillSummary(items);

    const { data: admission } = await supabase
      .from('admissions')
      .select('admission_number')
      .eq('id', admissionId)
      .single();

    const admData = admission as { admission_number: string } | null;
    const billNumber = `IPD-${admData?.admission_number || Date.now()}`;

    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert({
        hospital_id: hospitalId,
        bill_number: billNumber,
        patient_id: patientId,
        bill_type: 'IPD',
        subtotal: summary.subtotal,
        discount_percentage: summary.discountPercent,
        discount_amount: summary.discountAmount,
        tax_percentage: summary.taxPercent,
        tax_amount: summary.taxAmount,
        total_amount: summary.total,
        payment_status: 'pending',
        created_by: userId,
      } as never)
      .select('id')
      .single();

    if (billError) throw billError;

    const billItemsData = items
      .filter((i) => i.is_billable)
      .map((item, index) => ({
        bill_id: (bill as { id: string }).id,
        item_type: item.item_type === 'bed_charges' ? 'room' : item.item_type,
        item_name: item.item_name,
        description: item.item_description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        sort_order: index,
      }));

    if (billItemsData.length > 0) {
      const { error: itemsError } = await supabase.from('bill_items').insert(billItemsData as never);
      if (itemsError) throw itemsError;
    }

    return bill as { id: string };
  },

  async getServicesMaster(hospitalId: string): Promise<ServiceMaster[]> {
    const { data, error } = await supabase
      .from('services_master')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('category')
      .order('service_name');
    if (error) throw error;
    return (data ?? []) as ServiceMaster[];
  },

  async searchServices(hospitalId: string, term: string): Promise<ServiceMaster[]> {
    if (!term || term.length < 2) return [];
    const { data, error } = await supabase
      .from('services_master')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .ilike('service_name', `%${term}%`)
      .order('service_name')
      .limit(15);
    if (error) throw error;
    return (data ?? []) as ServiceMaster[];
  },

  async getPackagesMaster(hospitalId: string): Promise<PackageMaster[]> {
    const { data, error } = await supabase
      .from('packages_master')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('package_name');
    if (error) throw error;
    return (data ?? []) as PackageMaster[];
  },

  async getGstRates(hospitalId: string): Promise<GstMaster[]> {
    const { data, error } = await supabase
      .from('gst_master')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('category');
    if (error) throw error;
    return (data ?? []) as GstMaster[];
  },

  async addBillItemWithGst(
    admissionId: string,
    item: {
      service_id?: string;
      item_type: BillItemType;
      item_name: string;
      item_description?: string;
      category?: string;
      quantity: number;
      unit_price: number;
      gst_rate: number;
      hsn_code?: string;
      item_date?: string;
    },
    userId: string
  ): Promise<IpdBillItem> {
    const totalBeforeGst = item.quantity * item.unit_price;
    const gstAmount = (totalBeforeGst * item.gst_rate) / 100;
    const totalPrice = totalBeforeGst + gstAmount;

    const { data, error } = await supabase
      .from('ipd_bill_items')
      .insert({
        admission_id: admissionId,
        service_id: item.service_id || null,
        item_type: item.item_type,
        item_name: item.item_name,
        item_description: item.item_description || null,
        category: item.category || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: totalPrice,
        gst_rate: item.gst_rate,
        gst_amount: gstAmount,
        hsn_code: item.hsn_code || null,
        item_date: item.item_date || new Date().toISOString().split('T')[0],
        created_by: userId,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data as IpdBillItem;
  },

  async addPackageToAdmission(
    admissionId: string,
    pkg: PackageMaster,
    userId: string
  ): Promise<void> {
    const items = pkg.services.map(svc => ({
      admission_id: admissionId,
      item_type: 'misc' as const,
      item_name: `[${pkg.package_name}] ${svc.name}`,
      item_description: `Package: ${pkg.package_name}`,
      category: 'Package',
      quantity: 1,
      unit_price: svc.price,
      total_price: svc.price,
      gst_rate: 0,
      gst_amount: 0,
      item_date: new Date().toISOString().split('T')[0],
      created_by: userId,
    }));

    const { error } = await supabase
      .from('ipd_bill_items')
      .insert(items as never);
    if (error) throw error;
  },

  async getIpdPayments(admissionId: string): Promise<IpdPayment[]> {
    const { data, error } = await supabase
      .from('ipd_payments')
      .select('*')
      .eq('admission_id', admissionId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as IpdPayment[];
  },

  async addIpdPayment(
    admissionId: string,
    hospitalId: string,
    amount: number,
    paymentMode: string,
    notes: string,
    userId: string
  ): Promise<IpdPayment> {
    const receiptNumber = `RCT-${Date.now()}`;
    const { data, error } = await supabase
      .from('ipd_payments')
      .insert({
        admission_id: admissionId,
        hospital_id: hospitalId,
        amount,
        payment_mode: paymentMode,
        receipt_number: receiptNumber,
        notes: notes || null,
        created_by: userId,
      } as never)
      .select()
      .single();
    if (error) throw error;
    return data as IpdPayment;
  },

  calculateEnhancedBillSummary(
    items: IpdBillItem[],
    payments: IpdPayment[],
    _gstRates: GstMaster[],
    useIGST = false
  ) {
    const billableItems = items.filter(i => i.is_billable);
    const subtotal = billableItems.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price)), 0);

    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    billableItems.forEach(item => {
      const baseAmount = Number(item.quantity) * Number(item.unit_price);
      const gstRate = Number(item.gst_rate) || 0;
      if (useIGST) {
        totalIgst += (baseAmount * gstRate) / 100;
      } else {
        totalCgst += (baseAmount * gstRate) / 200;
        totalSgst += (baseAmount * gstRate) / 200;
      }
    });

    const totalGst = totalCgst + totalSgst + totalIgst;
    const total = subtotal + totalGst;
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
    const balanceDue = total - totalPaid;

    return {
      subtotal,
      discountPercent: 0,
      discountAmount: 0,
      taxPercent: subtotal > 0 ? (totalGst / subtotal) * 100 : 0,
      taxAmount: totalGst,
      total,
      gstBreakup: {
        cgst: totalCgst,
        sgst: totalSgst,
        igst: totalIgst,
      },
      totalPaid,
      balanceDue,
    };
  },

  async getDailyNotes(admissionId: string): Promise<IpdDailyNote[]> {
    const { data, error } = await supabase
      .from('ipd_daily_notes')
      .select(`
        *,
        doctor:profiles!ipd_daily_notes_doctor_id_fkey(full_name)
      `)
      .eq('admission_id', admissionId)
      .order('note_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((n: Record<string, unknown>) => ({
      ...n,
      doctor_name: (n.doctor as { full_name: string } | null)?.full_name ?? null,
    })) as IpdDailyNote[];
  },

  async addDailyNote(
    admissionId: string,
    doctorId: string,
    noteDate: string,
    observations: string,
    plan: string,
    vitals: Record<string, unknown>
  ): Promise<IpdDailyNote> {
    const { data, error } = await supabase
      .from('ipd_daily_notes')
      .insert({
        admission_id: admissionId,
        doctor_id: doctorId,
        note_date: noteDate,
        observations: observations || null,
        plan: plan || null,
        vitals: vitals || {},
      } as never)
      .select()
      .single();
    if (error) throw error;
    return data as IpdDailyNote;
  },

  async createWard(
    hospitalId: string,
    name: string,
    wardType: string,
    floor: number,
    dailyRate: number
  ): Promise<Ward> {
    const { data, error } = await supabase
      .from('wards')
      .insert({
        hospital_id: hospitalId,
        name,
        ward_type: wardType,
        total_beds: 0,
        available_beds: 0,
        floor,
        daily_rate: dailyRate,
        is_active: true,
      } as never)
      .select()
      .single();
    if (error) throw error;
    return data as Ward;
  },

  async createBed(
    hospitalId: string,
    wardId: string,
    bedNumber: string,
    bedType: string,
    dailyRate: number
  ): Promise<Bed> {
    const { data, error } = await supabase
      .from('beds')
      .insert({
        hospital_id: hospitalId,
        ward_id: wardId,
        bed_number: bedNumber,
        bed_type: bedType,
        daily_rate: dailyRate,
        status: 'available',
      } as never)
      .select()
      .single();
    if (error) throw error;

    const { count } = await supabase
      .from('beds')
      .select('*', { count: 'exact', head: true })
      .eq('ward_id', wardId);

    const { count: availCount } = await supabase
      .from('beds')
      .select('*', { count: 'exact', head: true })
      .eq('ward_id', wardId)
      .eq('status', 'available');

    await supabase
      .from('wards')
      .update({ total_beds: count ?? 0, available_beds: availCount ?? 0 } as never)
      .eq('id', wardId);

    return data as Bed;
  },

  async bulkCreateBeds(
    hospitalId: string,
    wardId: string,
    prefix: string,
    startNum: number,
    endNum: number,
    bedType: string,
    dailyRate: number
  ): Promise<number> {
    const records = [];
    for (let i = startNum; i <= endNum; i++) {
      records.push({
        hospital_id: hospitalId,
        ward_id: wardId,
        bed_number: `${prefix}${i}`,
        bed_type: bedType,
        daily_rate: dailyRate,
        status: 'available',
      });
    }

    const { error } = await supabase
      .from('beds')
      .insert(records as never);
    if (error) throw error;

    const { count } = await supabase
      .from('beds')
      .select('*', { count: 'exact', head: true })
      .eq('ward_id', wardId);

    const { count: availCount } = await supabase
      .from('beds')
      .select('*', { count: 'exact', head: true })
      .eq('ward_id', wardId)
      .eq('status', 'available');

    await supabase
      .from('wards')
      .update({ total_beds: count ?? 0, available_beds: availCount ?? 0 } as never)
      .eq('id', wardId);

    return records.length;
  },
};

interface DoctorInfo {
  id: string;
  full_name: string;
  department: string | null;
  designation: string | null;
}

export default ipdService;
