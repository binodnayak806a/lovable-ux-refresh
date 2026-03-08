import { mockStore } from '../lib/mockStore';
import { mockMasterStore } from '../lib/mockMasterStore';
import { format, eachDayOfInterval } from 'date-fns';
import type {
  DateRange, DailyOPDRow, RevenueRow, BedOccupancyRow, CollectionRow,
  DoctorOPDRow, IPDCensusRow, SavedReport,
} from '../modules/reports/types/report-types';

const HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

const enhancedReportsService = {
  async getDailyOPDSummary(hospitalId: string, date: Date, _doctorId?: string): Promise<DailyOPDRow[]> {
    const store = mockStore.get();
    const dateStr = format(date, 'yyyy-MM-dd');
    const appts = store.appointments.filter(a => a.hospital_id === hospitalId && a.appointment_date === dateStr);
    
    const doctorMap: Record<string, { total: number; completed: number; cancelled: number; revenue: number }> = {};
    appts.forEach(a => {
      const name = mockStore.getDoctorName(a.doctor_id);
      if (!doctorMap[name]) doctorMap[name] = { total: 0, completed: 0, cancelled: 0, revenue: 0 };
      doctorMap[name].total++;
      if (a.status === 'completed') doctorMap[name].completed++;
      if (a.status === 'cancelled') doctorMap[name].cancelled++;
    });
    
    return Object.entries(doctorMap).map(([doctor_name, d]) => ({
      doctor_name,
      total_patients: d.total,
      completed: d.completed,
      cancelled: d.cancelled,
      revenue: d.total * 500,
    })) as DailyOPDRow[];
  },

  async getRevenueReport(_hospitalId: string, dateRange: DateRange, _groupBy: string): Promise<RevenueRow[]> {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return days.map(day => ({
      date: format(day, 'dd MMM'),
      revenue: Math.floor(Math.random() * 50000) + 10000,
      collection: Math.floor(Math.random() * 45000) + 8000,
      pending: Math.floor(Math.random() * 5000),
    })) as RevenueRow[];
  },

  async getBedOccupancy(hospitalId: string): Promise<BedOccupancyRow[]> {
    const wards = mockMasterStore.getAll<{
      id: string; name: string; total_beds: number; available_beds: number; hospital_id: string;
    }>('wards', hospitalId);
    return wards.map(w => ({
      ward: w.name,
      total_beds: w.total_beds || 10,
      occupied: (w.total_beds || 10) - (w.available_beds ?? 4),
      available: w.available_beds ?? 4,
      occupancy_pct: Math.round((((w.total_beds || 10) - (w.available_beds ?? 4)) / (w.total_beds || 10)) * 100),
    })) as BedOccupancyRow[];
  },

  async getCollectionReport(_hospitalId: string, dateRange: DateRange, _paymentMode?: string): Promise<CollectionRow[]> {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return days.slice(0, 14).map(day => ({
      date: format(day, 'dd MMM'),
      cash: Math.floor(Math.random() * 20000) + 5000,
      card: Math.floor(Math.random() * 15000) + 3000,
      upi: Math.floor(Math.random() * 10000) + 2000,
      online: Math.floor(Math.random() * 5000),
      total: 0,
    })).map(r => ({ ...r, total: r.cash + r.card + r.upi + r.online })) as CollectionRow[];
  },

  async getDoctorOPDReport(hospitalId: string, _dateRange: DateRange, _doctorId?: string): Promise<DoctorOPDRow[]> {
    const doctors = mockStore.getDoctors(hospitalId);
    return doctors.map(d => ({
      doctor_name: d.full_name,
      department: d.department || 'General',
      total_patients: Math.floor(Math.random() * 50) + 10,
      new_patients: Math.floor(Math.random() * 20) + 5,
      follow_ups: Math.floor(Math.random() * 30) + 5,
      revenue: Math.floor(Math.random() * 100000) + 20000,
    })) as DoctorOPDRow[];
  },

  async getIPDCensus(hospitalId: string, dateRange: DateRange): Promise<IPDCensusRow> {
    const wards = mockMasterStore.getAll<{
      id: string; name: string; total_beds: number; available_beds: number; hospital_id: string;
    }>('wards', hospitalId);

    const wardBreakdown = wards.map(w => ({
      ward: w.name,
      admitted: Math.floor(Math.random() * 5) + 1,
      discharged: Math.floor(Math.random() * 3),
      current: (w.total_beds || 10) - (w.available_beds ?? 4),
      total_beds: w.total_beds || 10,
      occupancy_pct: Math.round((((w.total_beds || 10) - (w.available_beds ?? 4)) / (w.total_beds || 10)) * 100),
    }));

    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const daily = days.map(day => ({
      date: format(day, 'dd MMM'),
      admissions: Math.floor(Math.random() * 4) + 1,
      discharges: Math.floor(Math.random() * 3),
    }));

    return {
      total_admissions: wardBreakdown.reduce((s, w) => s + w.admitted, 0),
      total_discharges: wardBreakdown.reduce((s, w) => s + w.discharged, 0),
      current_inpatients: wardBreakdown.reduce((s, w) => s + w.current, 0),
      bed_occupancy_pct: 62,
      ward_breakdown: wardBreakdown,
      daily,
    };
  },

  async getSavedReports(_hospitalId: string): Promise<SavedReport[]> {
    return [];
  },

  async saveReport(_report: Partial<SavedReport>): Promise<SavedReport> {
    return { id: Date.now().toString(), ..._report } as SavedReport;
  },

  async deleteSavedReport(_id: string): Promise<void> {},

  async runCustomQuery(_hospitalId: string, _table: string, _columns: string[], _filters: Record<string, string>, _page = 0) {
    return { data: [], count: 0 };
  },

  async getDashboardQuickStats(hospitalId: string) {
    const store = mockStore.get();
    const today = new Date().toISOString().split('T')[0];
    const todayAppts = store.appointments.filter(a => a.hospital_id === hospitalId && a.appointment_date === today);
    const todayBills = store.bills.filter(b => b.bill_date === today);
    const todayRevenue = todayBills.reduce((s, b) => s + (b.amount_paid || 0), 0);

    const wards = mockMasterStore.getAll<{ total_beds: number; available_beds: number; hospital_id: string }>('wards', hospitalId);
    const availableBeds = wards.reduce((s, w) => s + (w.available_beds ?? 4), 0) || 18;

    const admissions = mockMasterStore.getAll<{ status: string; hospital_id: string }>('admissions', hospitalId);
    const currentIPD = admissions.filter(a => a.status === 'admitted').length;

    return {
      todayOPD: todayAppts.length || 24,
      todayRevenue: todayRevenue || 34500,
      currentIPD: currentIPD || 12,
      availableBeds,
    };
  },
};

export default enhancedReportsService;
