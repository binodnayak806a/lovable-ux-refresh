import { supabase } from '../lib/supabase';

export interface DashboardMetrics {
  totalAppointments: number;
  todayAppointments: number;
  newPatients: number;
  totalPatients: number;
  occupiedBeds: number;
  totalBeds: number;
  todayRevenue: number;
  monthRevenue: number;
  appointmentsTrend: number;
  patientsTrend: number;
  bedOccupancyRate: number;
  revenueTrend: number;
}

export interface AppointmentsByStatus {
  status: string;
  count: number;
}

export interface PatientsByType {
  registration_type: string;
  count: number;
}

export interface DailyAppointmentStat {
  date: string;
  count: number;
}

export interface RecentAppointment {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  type: string;
  status: string;
  chief_complaint: string | null;
}

export interface PatientFilters {
  dateFrom?: string;
  dateTo?: string;
  registrationType?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AppointmentFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  type?: string;
  doctorId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SymptomFilters {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DiagnosisFilters {
  category?: string;
  search?: string;
  icd10?: string;
  page?: number;
  limit?: number;
}

export interface MedicationFilters {
  category?: string;
  search?: string;
  form?: string;
  page?: number;
  limit?: number;
}

export interface HourlyTrendItem {
  hour: number;
  label: string;
  count: number;
}

export interface DoctorStat {
  doctor_id: string;
  doctor_name: string;
  total: number;
  waiting: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

const dashboardService = {
  async getMetrics(hospitalId: string): Promise<DashboardMetrics> {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];
    const prevMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
      .toISOString().split('T')[0];
    const prevMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0)
      .toISOString().split('T')[0];

    const [
      totalAppointmentsRes,
      todayAppointmentsRes,
      prevMonthAppointmentsRes,
      totalPatientsRes,
      newPatientsRes,
      prevMonthPatientsRes,
      bedsRes,
      occupiedBedsRes,
      todayRevenueRes,
      monthRevenueRes,
      prevMonthRevenueRes,
    ] = await Promise.all([
      supabase.from('appointments').select('id', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId),
      supabase.from('appointments').select('id', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId).eq('appointment_date', today),
      supabase.from('appointments').select('id', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId)
        .gte('appointment_date', prevMonthStart).lte('appointment_date', prevMonthEnd),
      supabase.from('patients').select('id', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId).eq('is_active', true),
      supabase.from('patients').select('id', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId).gte('created_at', monthStart),
      supabase.from('patients').select('id', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId)
        .gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
      supabase.from('beds').select('id', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId),
      supabase.from('beds').select('id', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId).eq('status', 'occupied'),
      supabase.from('payments').select('amount')
        .eq('hospital_id', hospitalId).eq('payment_date', today),
      supabase.from('payments').select('amount')
        .eq('hospital_id', hospitalId).gte('payment_date', monthStart),
      supabase.from('payments').select('amount')
        .eq('hospital_id', hospitalId)
        .gte('payment_date', prevMonthStart).lte('payment_date', prevMonthEnd),
    ]);

    const totalBeds = bedsRes.count ?? 0;
    const occupiedBeds = occupiedBedsRes.count ?? 0;

    const todayRevenue = ((todayRevenueRes.data ?? []) as { amount: number }[])
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const monthRevenue = ((monthRevenueRes.data ?? []) as { amount: number }[])
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const prevMonthRevenue = ((prevMonthRevenueRes.data ?? []) as { amount: number }[])
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const totalAppts = totalAppointmentsRes.count ?? 0;
    const prevMonthAppts = prevMonthAppointmentsRes.count ?? 0;
    const thisMonthNewPatients = newPatientsRes.count ?? 0;
    const prevMonthNewPatients = prevMonthPatientsRes.count ?? 0;

    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    };

    return {
      totalAppointments: totalAppts,
      todayAppointments: todayAppointmentsRes.count ?? 0,
      newPatients: thisMonthNewPatients,
      totalPatients: totalPatientsRes.count ?? 0,
      occupiedBeds,
      totalBeds,
      todayRevenue,
      monthRevenue,
      appointmentsTrend: calcTrend(totalAppts, prevMonthAppts),
      patientsTrend: calcTrend(thisMonthNewPatients, prevMonthNewPatients),
      bedOccupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      revenueTrend: calcTrend(monthRevenue, prevMonthRevenue),
    };
  },

  async getAppointmentsByStatus(hospitalId: string): Promise<AppointmentsByStatus[]> {
    const { data, error } = await supabase
      .from('appointments').select('status').eq('hospital_id', hospitalId);
    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as { status: string }[]) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  },

  async getPatientsByRegistrationType(hospitalId: string): Promise<PatientsByType[]> {
    const { data, error } = await supabase
      .from('patients').select('registration_type')
      .eq('hospital_id', hospitalId).eq('is_active', true);
    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as { registration_type: string | null }[]) {
      const type = row.registration_type ?? 'walk-in';
      counts[type] = (counts[type] ?? 0) + 1;
    }
    return Object.entries(counts).map(([registration_type, count]) => ({ registration_type, count }));
  },

  async getDailyAppointmentStats(hospitalId: string, days = 30): Promise<DailyAppointmentStat[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const { data, error } = await supabase
      .from('appointments').select('appointment_date')
      .eq('hospital_id', hospitalId)
      .gte('appointment_date', dateFrom.toISOString().split('T')[0])
      .order('appointment_date', { ascending: true });
    if (error) throw error;

    const countMap: Record<string, number> = {};
    for (const row of (data ?? []) as { appointment_date: string }[]) {
      countMap[row.appointment_date] = (countMap[row.appointment_date] ?? 0) + 1;
    }

    const result: DailyAppointmentStat[] = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result.push({ date: key, count: countMap[key] ?? 0 });
    }
    return result;
  },

  async getRecentAppointments(hospitalId: string, limit = 10): Promise<RecentAppointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        appointment_date,
        appointment_time,
        type,
        status,
        chief_complaint,
        patient:patients!patient_id(full_name),
        doctor:profiles!doctor_id(full_name)
      `)
      .eq('hospital_id', hospitalId)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      patient_id: row.patient_id as string,
      patient_name: ((row.patient as Record<string, unknown>)?.full_name as string) ?? '',
      doctor_name: ((row.doctor as Record<string, unknown>)?.full_name as string) ?? '',
      appointment_date: row.appointment_date as string,
      appointment_time: row.appointment_time as string,
      type: row.type as string,
      status: row.status as string,
      chief_complaint: row.chief_complaint as string | null,
    }));
  },

  async getPatients(hospitalId: string, filters: PatientFilters = {}) {
    const {
      dateFrom, dateTo, registrationType, search,
      page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc',
    } = filters;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('patients')
      .select('*', { count: 'exact' })
      .eq('hospital_id', hospitalId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    if (dateFrom) query = query.gte('created_at', dateFrom) as typeof query;
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59') as typeof query;
    if (registrationType) query = query.eq('registration_type', registrationType) as typeof query;
    if (search?.trim()) {
      query = query.or(
        `full_name.ilike.%${search}%,phone.ilike.%${search}%,uhid.ilike.%${search}%,email.ilike.%${search}%`
      ) as typeof query;
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) };
  },

  async getAppointments(hospitalId: string, filters: AppointmentFilters = {}) {
    const {
      dateFrom, dateTo, status, type, doctorId, search,
      page = 1, limit = 20,
    } = filters;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('appointments')
      .select(`*, patients(id, full_name, uhid, phone), profiles(id, full_name, designation)`,
        { count: 'exact' })
      .eq('hospital_id', hospitalId)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .range(from, to);

    if (dateFrom) query = query.gte('appointment_date', dateFrom) as typeof query;
    if (dateTo) query = query.lte('appointment_date', dateTo) as typeof query;
    if (status) query = query.eq('status', status) as typeof query;
    if (type) query = query.eq('type', type) as typeof query;
    if (doctorId) query = query.eq('doctor_id', doctorId) as typeof query;
    if (search?.trim()) {
      query = query.or(`chief_complaint.ilike.%${search}%,diagnosis.ilike.%${search}%`) as typeof query;
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) };
  },

  async getSymptoms(filters: SymptomFilters = {}) {
    const { category, search, page = 1, limit = 50 } = filters;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('symptoms').select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
      .range(from, to);

    if (category) query = query.eq('category', category) as typeof query;
    if (search?.trim()) query = query.ilike('name', `%${search}%`) as typeof query;

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  },

  async getDiagnoses(filters: DiagnosisFilters = {}) {
    const { category, search, icd10, page = 1, limit = 50 } = filters;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('diagnoses').select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
      .range(from, to);

    if (category) query = query.eq('category', category) as typeof query;
    if (icd10) query = query.ilike('icd_code', `%${icd10}%`) as typeof query;
    if (search?.trim()) {
      query = query.or(`name.ilike.%${search}%,icd_code.ilike.%${search}%`) as typeof query;
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  },

  async getMedications(filters: MedicationFilters = {}) {
    const { category, search, form, page = 1, limit = 50 } = filters;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('medications').select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
      .range(from, to);

    if (category) query = query.eq('category', category) as typeof query;
    if (form) query = query.eq('form', form) as typeof query;
    if (search?.trim()) {
      query = query.or(`generic_name.ilike.%${search}%,brand_name.ilike.%${search}%`) as typeof query;
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  },

  async getBedSummary(hospitalId: string) {
    const { data, error } = await supabase
      .from('wards')
      .select('id, name, ward_type, total_beds, available_beds, daily_rate')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data ?? [];
  },

  async getRevenueSummary(hospitalId: string) {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];

    const [todayRes, weekRes, monthRes] = await Promise.all([
      supabase.from('payments').select('amount')
        .eq('hospital_id', hospitalId).eq('payment_date', today),
      supabase.from('payments').select('amount')
        .eq('hospital_id', hospitalId).gte('payment_date', weekStart.toISOString().split('T')[0]),
      supabase.from('payments').select('amount')
        .eq('hospital_id', hospitalId).gte('payment_date', monthStart),
    ]);

    const sum = (rows: { amount: number }[]) =>
      rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

    return {
      today: sum((todayRes.data ?? []) as { amount: number }[]),
      week: sum((weekRes.data ?? []) as { amount: number }[]),
      month: sum((monthRes.data ?? []) as { amount: number }[]),
    };
  },

  async incrementSymptomUsage(symptomId: string) {
    const { data } = await supabase.from('symptoms')
      .select('usage_count').eq('id', symptomId).maybeSingle();
    const row = data as { usage_count: number } | null;
    if (row) {
      await supabase.from('symptoms')
        .update({ usage_count: (row.usage_count ?? 0) + 1 } as never)
        .eq('id', symptomId);
    }
  },

  async incrementDiagnosisUsage(diagnosisId: string) {
    const { data } = await supabase.from('diagnoses')
      .select('usage_count').eq('id', diagnosisId).maybeSingle();
    const row = data as { usage_count: number } | null;
    if (row) {
      await supabase.from('diagnoses')
        .update({ usage_count: (row.usage_count ?? 0) + 1 } as never)
        .eq('id', diagnosisId);
    }
  },

  async incrementMedicationUsage(medicationId: string) {
    const { data } = await supabase.from('medications')
      .select('usage_count').eq('id', medicationId).maybeSingle();
    const row = data as { usage_count: number } | null;
    if (row) {
      await supabase.from('medications')
        .update({ usage_count: (row.usage_count ?? 0) + 1 } as never)
        .eq('id', medicationId);
    }
  },

  async getHourlyAppointmentTrend(hospitalId: string, date?: string): Promise<HourlyTrendItem[]> {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('hospital_id', hospitalId)
      .eq('appointment_date', targetDate);

    if (error) throw error;

    const hourCounts: Record<number, number> = {};
    for (const row of (data ?? []) as { appointment_time: string }[]) {
      if (row.appointment_time) {
        const hour = parseInt(row.appointment_time.split(':')[0], 10);
        hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
      }
    }

    const formatHour = (h: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}${ampm}`;
    };

    const result: HourlyTrendItem[] = [];
    for (let h = 7; h <= 21; h++) {
      result.push({ hour: h, label: formatHour(h), count: hourCounts[h] ?? 0 });
    }
    return result;
  },

  async getDoctorWiseStats(hospitalId: string, date?: string): Promise<DoctorStat[]> {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('appointments')
      .select('doctor_id, status, doctor:profiles!doctor_id(full_name)')
      .eq('hospital_id', hospitalId)
      .eq('appointment_date', targetDate);

    if (error) throw error;

    const doctorMap: Record<string, DoctorStat> = {};
    for (const row of (data ?? []) as {
      doctor_id: string;
      status: string;
      doctor: { full_name: string } | null;
    }[]) {
      if (!row.doctor_id) continue;
      if (!doctorMap[row.doctor_id]) {
        doctorMap[row.doctor_id] = {
          doctor_id: row.doctor_id,
          doctor_name: row.doctor?.full_name ?? 'Unknown',
          total: 0,
          waiting: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
        };
      }
      const ds = doctorMap[row.doctor_id];
      ds.total++;
      if (row.status === 'scheduled' || row.status === 'confirmed') ds.waiting++;
      else if (row.status === 'in_progress') ds.in_progress++;
      else if (row.status === 'completed') ds.completed++;
      else if (row.status === 'cancelled') ds.cancelled++;
    }

    return Object.values(doctorMap).sort((a, b) => b.total - a.total);
  },

  async getPendingDues(hospitalId: string): Promise<number> {
    const { data, error } = await supabase
      .from('bills')
      .select('total_amount, paid_amount')
      .eq('hospital_id', hospitalId)
      .in('payment_status', ['pending', 'partial']);

    if (error) throw error;

    return (data ?? []).reduce((sum, row) => {
      const r = row as { total_amount: number; paid_amount: number | null };
      return sum + ((Number(r.total_amount) || 0) - (Number(r.paid_amount) || 0));
    }, 0);
  },

  async getTodayAppointmentsByStatus(hospitalId: string): Promise<AppointmentsByStatus[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('appointments')
      .select('status')
      .eq('hospital_id', hospitalId)
      .eq('appointment_date', today);

    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as { status: string }[]) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  },
};

export default dashboardService;
