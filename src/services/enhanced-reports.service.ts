import { supabase } from '../lib/supabase';
import { format, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import type {
  DateRange, DailyOPDRow, RevenueRow, BedOccupancyRow, CollectionRow,
  DoctorOPDRow, IPDCensusRow, SavedReport,
} from '../modules/reports/types/report-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (name: string, params: Record<string, unknown>) => (supabase.rpc as any)(name, params);

const enhancedReportsService = {
  async getDailyOPDSummary(hospitalId: string, date: Date, doctorId?: string): Promise<DailyOPDRow[]> {
    const { data, error } = await rpc('get_daily_opd_summary', {
      p_hospital_id: hospitalId,
      p_date: format(date, 'yyyy-MM-dd'),
      p_doctor_id: doctorId || null,
    });
    if (error) throw error;
    return (data ?? []) as DailyOPDRow[];
  },

  async getRevenueReport(hospitalId: string, dateRange: DateRange, groupBy: string): Promise<RevenueRow[]> {
    const { data, error } = await rpc('get_revenue_report', {
      p_hospital_id: hospitalId,
      p_from: format(dateRange.from, 'yyyy-MM-dd'),
      p_to: format(dateRange.to, 'yyyy-MM-dd'),
      p_group_by: groupBy,
    });
    if (error) throw error;
    return (data ?? []) as RevenueRow[];
  },

  async getBedOccupancy(hospitalId: string): Promise<BedOccupancyRow[]> {
    const { data, error } = await rpc('get_bed_occupancy', { p_hospital_id: hospitalId });
    if (error) throw error;
    return (data ?? []) as BedOccupancyRow[];
  },

  async getCollectionReport(hospitalId: string, dateRange: DateRange, paymentMode?: string): Promise<CollectionRow[]> {
    const { data, error } = await rpc('get_collection_report', {
      p_hospital_id: hospitalId,
      p_from: format(dateRange.from, 'yyyy-MM-dd'),
      p_to: format(dateRange.to, 'yyyy-MM-dd'),
      p_payment_mode: paymentMode || null,
    });
    if (error) throw error;
    return (data ?? []) as CollectionRow[];
  },

  async getDoctorOPDReport(hospitalId: string, dateRange: DateRange, doctorId?: string): Promise<DoctorOPDRow[]> {
    const { data, error } = await rpc('get_doctor_opd_report', {
      p_hospital_id: hospitalId,
      p_from: format(dateRange.from, 'yyyy-MM-dd'),
      p_to: format(dateRange.to, 'yyyy-MM-dd'),
      p_doctor_id: doctorId || null,
    });
    if (error) throw error;
    return (data ?? []) as DoctorOPDRow[];
  },

  async getIPDCensus(hospitalId: string, dateRange: DateRange): Promise<IPDCensusRow> {
    const fromDate = startOfDay(dateRange.from).toISOString();
    const toDate = endOfDay(dateRange.to).toISOString();

    const [admRes, bedRes] = await Promise.all([
      supabase.from('admissions')
        .select('id, admission_date, discharge_date, status, ward_id, ward:wards(name)')
        .eq('hospital_id', hospitalId)
        .or(`admission_date.gte.${fromDate},discharge_date.gte.${fromDate}`)
        .lte('admission_date', toDate),
      supabase.from('beds')
        .select('id, status, ward:wards(name)')
        .eq('hospital_id', hospitalId),
    ]);

    type AdmRow = { id: string; admission_date: string; discharge_date: string | null; status: string; ward_id: string; ward: { name: string } | null };
    type BedRow = { id: string; status: string; ward: { name: string } | null };

    const admissions = (admRes.data ?? []) as AdmRow[];
    const beds = (bedRes.data ?? []) as BedRow[];

    const totalAdmissions = admissions.length;
    const totalDischarges = admissions.filter(a => a.status === 'discharged').length;
    const currentInpatients = admissions.filter(a => a.status === 'admitted').length;
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
    const bedOccupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const wardMap = new Map<string, { admitted: number; discharged: number; current: number; totalBeds: number; occupied: number }>();
    beds.forEach(b => {
      const ward = b.ward?.name || 'General';
      const e = wardMap.get(ward) || { admitted: 0, discharged: 0, current: 0, totalBeds: 0, occupied: 0 };
      e.totalBeds++;
      if (b.status === 'occupied') e.occupied++;
      wardMap.set(ward, e);
    });
    admissions.forEach(a => {
      const ward = a.ward?.name || 'General';
      const e = wardMap.get(ward) || { admitted: 0, discharged: 0, current: 0, totalBeds: 0, occupied: 0 };
      e.admitted++;
      if (a.status === 'discharged') e.discharged++;
      if (a.status === 'admitted') e.current++;
      wardMap.set(ward, e);
    });

    const wardBreakdown = Array.from(wardMap.entries()).map(([ward, d]) => ({
      ward,
      admitted: d.admitted,
      discharged: d.discharged,
      current: d.current,
      total_beds: d.totalBeds,
      occupancy_pct: d.totalBeds > 0 ? Math.round((d.occupied / d.totalBeds) * 100) : 0,
    }));

    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const daily = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return {
        date: format(day, 'dd MMM'),
        admissions: admissions.filter(a => a.admission_date.startsWith(dayStr)).length,
        discharges: admissions.filter(a => a.discharge_date?.startsWith(dayStr)).length,
      };
    });

    return { total_admissions: totalAdmissions, total_discharges: totalDischarges, current_inpatients: currentInpatients, bed_occupancy_pct: bedOccupancyPct, ward_breakdown: wardBreakdown, daily };
  },

  async getSavedReports(hospitalId: string): Promise<SavedReport[]> {
    const { data, error } = await supabase
      .from('saved_reports')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as SavedReport[];
  },

  async saveReport(report: Partial<SavedReport>): Promise<SavedReport> {
    const { data, error } = await supabase
      .from('saved_reports')
      .insert(report as never)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as unknown as SavedReport;
  },

  async deleteSavedReport(id: string): Promise<void> {
    const { error } = await supabase.from('saved_reports').delete().eq('id', id);
    if (error) throw error;
  },

  async runCustomQuery(hospitalId: string, table: string, columns: string[], filters: Record<string, string>, page = 0): Promise<{ data: Record<string, unknown>[]; count: number }> {
    const pageSize = 50;
    let query = supabase
      .from(table)
      .select(columns.join(','), { count: 'exact' })
      .eq('hospital_id', hospitalId);

    if (filters.date_from) query = query.gte(table === 'bills' ? 'bill_date' : 'created_at', filters.date_from);
    if (filters.date_to) query = query.lte(table === 'bills' ? 'bill_date' : 'created_at', filters.date_to);
    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters.payment_mode && filters.payment_mode !== 'all') query = query.eq('payment_mode', filters.payment_mode);

    query = query.range(page * pageSize, (page + 1) * pageSize - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data ?? []) as Record<string, unknown>[], count: count ?? 0 };
  },

  async getDashboardQuickStats(hospitalId: string): Promise<{
    todayOPD: number;
    todayRevenue: number;
    currentIPD: number;
    availableBeds: number;
  }> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [apptRes, billRes, admRes, bedRes] = await Promise.all([
      supabase.from('appointments').select('id', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId).eq('appointment_date', today),
      supabase.from('bills').select('total_amount')
        .eq('hospital_id', hospitalId).eq('bill_date', today),
      supabase.from('admissions').select('id', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId).eq('status', 'admitted'),
      supabase.from('beds').select('id, status')
        .eq('hospital_id', hospitalId),
    ]);

    type Bill = { total_amount: number };
    type Bed = { id: string; status: string };
    const todayRevenue = ((billRes.data ?? []) as Bill[]).reduce((s, b) => s + Number(b.total_amount || 0), 0);
    const beds = (bedRes.data ?? []) as Bed[];
    const availableBeds = beds.filter(b => b.status !== 'occupied').length;

    return {
      todayOPD: apptRes.count ?? 0,
      todayRevenue,
      currentIPD: admRes.count ?? 0,
      availableBeds,
    };
  },
};

export default enhancedReportsService;
