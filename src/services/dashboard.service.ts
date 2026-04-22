import { mockStore } from '../lib/mockStore';
import { mockMasterStore } from '../lib/mockMasterStore';
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

export interface AppointmentsByStatus { status: string; count: number; }
export interface PatientsByType { registration_type: string; count: number; }
export interface DailyAppointmentStat { date: string; count: number; }

export interface RecentAppointment {
  id: string; patient_id: string; patient_name: string; doctor_name: string;
  appointment_date: string; appointment_time: string; type: string;
  status: string; chief_complaint: string | null;
}

export interface PatientFilters {
  dateFrom?: string; dateTo?: string; registrationType?: string; search?: string;
  page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc';
}
export interface AppointmentFilters {
  dateFrom?: string; dateTo?: string; status?: string; type?: string;
  doctorId?: string; search?: string; page?: number; limit?: number;
}
export interface SymptomFilters { category?: string; search?: string; page?: number; limit?: number; }
export interface DiagnosisFilters { category?: string; search?: string; icd10?: string; page?: number; limit?: number; }
export interface MedicationFilters { category?: string; search?: string; form?: string; page?: number; limit?: number; }

export interface HourlyTrendItem { hour: number; label: string; count: number; }

export interface DoctorStat {
  doctor_id: string; doctor_name: string; total: number;
  waiting: number; in_progress: number; completed: number; cancelled: number;
}

const dashboardService = {
  async getMetrics(hospitalId: string): Promise<DashboardMetrics> {
    const store = mockStore.get();
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const allAppts = store.appointments.filter(a => a.hospital_id === hospitalId);
    const todayAppts = allAppts.filter(a => a.appointment_date === today);
    const allPatients = store.patients.filter(p => p.hospital_id === hospitalId);
    const newPatients = allPatients.filter(p => p.created_at >= monthStart);

    const beds = mockMasterStore.getAll<{ id: string; status: string; hospital_id: string }>('beds', hospitalId);
    const wards = mockMasterStore.getAll<{ id: string; total_beds: number; available_beds: number; hospital_id: string }>('wards', hospitalId);
    const totalBeds = beds.length || wards.reduce((s, w) => s + (w.total_beds || 0), 0) || 50;
    const occupiedBeds = beds.filter(b => b.status === 'occupied').length || Math.round(totalBeds * 0.6);

    const allBills = store.bills.filter(b => b.bill_date === today);
    const todayRevenue = allBills.reduce((s, b) => s + (b.amount_paid || 0), 0);
    const monthBills = store.bills.filter(b => b.bill_date >= monthStart);
    const monthRevenue = monthBills.reduce((s, b) => s + (b.amount_paid || 0), 0);

    return {
      totalAppointments: allAppts.length,
      todayAppointments: todayAppts.length,
      newPatients: newPatients.length,
      totalPatients: allPatients.length,
      occupiedBeds,
      totalBeds,
      todayRevenue,
      monthRevenue,
      appointmentsTrend: 12.5,
      patientsTrend: 8.3,
      bedOccupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      revenueTrend: 15.2,
    };
  },

  async getAppointmentsByStatus(hospitalId: string): Promise<AppointmentsByStatus[]> {
    const store = mockStore.get();
    const counts: Record<string, number> = {};
    store.appointments.filter(a => a.hospital_id === hospitalId).forEach(a => {
      counts[a.status] = (counts[a.status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  },

  async getTodayAppointmentsByStatus(hospitalId: string): Promise<AppointmentsByStatus[]> {
    const store = mockStore.get();
    const today = new Date().toISOString().split('T')[0];
    const counts: Record<string, number> = {};
    store.appointments.filter(a => a.hospital_id === hospitalId && a.appointment_date === today).forEach(a => {
      counts[a.status] = (counts[a.status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  },

  async getPatientsByRegistrationType(hospitalId: string): Promise<PatientsByType[]> {
    const store = mockStore.get();
    const counts: Record<string, number> = {};
    store.patients.filter(p => p.hospital_id === hospitalId).forEach(p => {
      const type = p.registration_type ?? 'walk-in';
      counts[type] = (counts[type] ?? 0) + 1;
    });
    return Object.entries(counts).map(([registration_type, count]) => ({ registration_type, count }));
  },

  async getDailyAppointmentStats(hospitalId: string, days = 30): Promise<DailyAppointmentStat[]> {
    const store = mockStore.get();
    const appts = store.appointments.filter(a => a.hospital_id === hospitalId);
    const countMap: Record<string, number> = {};
    appts.forEach(a => { countMap[a.appointment_date] = (countMap[a.appointment_date] ?? 0) + 1; });

    const result: DailyAppointmentStat[] = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result.push({ date: key, count: countMap[key] ?? Math.floor(Math.random() * 15) + 3 });
    }
    return result;
  },

  async getRecentAppointments(hospitalId: string, limit = 10): Promise<RecentAppointment[]> {
    const store = mockStore.get();
    return store.appointments
      .filter(a => a.hospital_id === hospitalId)
      .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
      .slice(0, limit)
      .map(a => ({
        id: a.id,
        patient_id: a.patient_id,
        patient_name: mockStore.getPatientName(a.patient_id),
        doctor_name: mockStore.getDoctorName(a.doctor_id),
        appointment_date: a.appointment_date,
        appointment_time: a.appointment_time,
        type: a.type,
        status: a.status,
        chief_complaint: a.chief_complaint,
      }));
  },

  async getBedSummary(hospitalId: string) {
    const wards = mockMasterStore.getAll<{
      id: string; name: string; ward_type: string; total_beds: number;
      available_beds: number; daily_rate: number; is_active: boolean; hospital_id: string;
    }>('wards', hospitalId).filter(w => w.is_active !== false);
    return wards.map(w => ({
      id: w.id, name: w.name, ward_type: w.ward_type || 'General',
      total_beds: w.total_beds || 10, available_beds: w.available_beds ?? 6,
      daily_rate: w.daily_rate || 500,
    }));
  },

  async getRevenueSummary(_hospitalId: string) {
    const store = mockStore.get();
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const sum = (bills: typeof store.bills) => bills.reduce((s, b) => s + (b.amount_paid || 0), 0);
    return {
      today: sum(store.bills.filter(b => b.bill_date === today)) || 12500,
      week: sum(store.bills.filter(b => b.bill_date >= weekStartStr)) || 87500,
      month: sum(store.bills.filter(b => b.bill_date >= monthStart)) || 345000,
    };
  },

  async getHourlyAppointmentTrend(hospitalId: string, date?: string): Promise<HourlyTrendItem[]> {
    const store = mockStore.get();
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    const appts = store.appointments.filter(a => a.hospital_id === hospitalId && a.appointment_date === targetDate);

    const hourCounts: Record<number, number> = {};
    appts.forEach(a => {
      if (a.appointment_time) {
        const hour = parseInt(a.appointment_time.split(':')[0], 10);
        hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
      }
    });

    const formatHour = (h: number) => `${h % 12 || 12}${h >= 12 ? 'PM' : 'AM'}`;
    // Add realistic demo data if no actual data
    const demoPattern = [0, 2, 5, 8, 12, 10, 7, 4, 6, 9, 11, 8, 5, 3, 1];
    const result: HourlyTrendItem[] = [];
    for (let h = 7; h <= 21; h++) {
      result.push({ hour: h, label: formatHour(h), count: hourCounts[h] ?? demoPattern[h - 7] ?? 0 });
    }
    return result;
  },

  async getDoctorWiseStats(hospitalId: string, date?: string): Promise<DoctorStat[]> {
    const store = mockStore.get();
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    const appts = store.appointments.filter(a => a.hospital_id === hospitalId && a.appointment_date === targetDate);

    const doctorMap: Record<string, DoctorStat> = {};
    appts.forEach(a => {
      if (!a.doctor_id) return;
      if (!doctorMap[a.doctor_id]) {
        doctorMap[a.doctor_id] = {
          doctor_id: a.doctor_id, doctor_name: mockStore.getDoctorName(a.doctor_id),
          total: 0, waiting: 0, in_progress: 0, completed: 0, cancelled: 0,
        };
      }
      const ds = doctorMap[a.doctor_id];
      ds.total++;
      if (a.status === 'scheduled' || a.status === 'confirmed') ds.waiting++;
      else if (a.status === 'in_progress') ds.in_progress++;
      else if (a.status === 'completed') ds.completed++;
      else if (a.status === 'cancelled') ds.cancelled++;
    });

    // If no appointments, return demo doctor stats
    if (Object.keys(doctorMap).length === 0) {
      const doctors = mockStore.getDoctors(hospitalId);
      return doctors.slice(0, 5).map(d => ({
        doctor_id: d.id, doctor_name: d.full_name,
        total: Math.floor(Math.random() * 15) + 5,
        waiting: Math.floor(Math.random() * 4),
        in_progress: Math.floor(Math.random() * 3) + 1,
        completed: Math.floor(Math.random() * 8) + 2,
        cancelled: Math.floor(Math.random() * 2),
      }));
    }

    return Object.values(doctorMap).sort((a, b) => b.total - a.total);
  },

  async getPendingDues(_hospitalId: string): Promise<number> {
    const store = mockStore.get();
    return store.bills
      .filter(b => b.payment_status !== 'paid')
      .reduce((sum, b) => sum + (b.total_amount - b.amount_paid), 0) || 24500;
  },

  // Real DB-backed list with search, filter, pagination
  async getPatients(hospitalId: string, filters: PatientFilters = {}) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const sortBy = filters.sortBy ?? 'created_at';
    const sortOrder = filters.sortOrder ?? 'desc';

    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .eq('hospital_id', hospitalId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    if (filters.registrationType) {
      query = query.eq('registration_type', filters.registrationType);
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      query = query.or(`full_name.ilike.%${q}%,uhid.ilike.%${q}%,phone.ilike.%${q}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    const total = count ?? 0;
    return {
      data: data ?? [],
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async getAppointments(hospitalId: string, filters: AppointmentFilters = {}) {
    const store = mockStore.get();
    let appts = store.appointments.filter(a => a.hospital_id === hospitalId);
    if (filters.status) appts = appts.filter(a => a.status === filters.status);
    if (filters.dateFrom) appts = appts.filter(a => a.appointment_date >= filters.dateFrom!);
    if (filters.dateTo) appts = appts.filter(a => a.appointment_date <= filters.dateTo!);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const from = (page - 1) * limit;
    return { data: appts.slice(from, from + limit), total: appts.length, page, limit, totalPages: Math.ceil(appts.length / limit) };
  },

  async getSymptoms(_filters: SymptomFilters = {}) { return { data: [], total: 0 }; },
  async getDiagnoses(_filters: DiagnosisFilters = {}) { return { data: [], total: 0 }; },
  async getMedications(_filters: MedicationFilters = {}) { return { data: [], total: 0 }; },
  async incrementSymptomUsage(_id: string) {},
  async incrementDiagnosisUsage(_id: string) {},
  async incrementMedicationUsage(_id: string) {},
};

export default dashboardService;
