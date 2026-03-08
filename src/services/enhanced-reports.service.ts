import { mockStore } from '../lib/mockStore';
import { mockMasterStore } from '../lib/mockMasterStore';
import { format, eachDayOfInterval } from 'date-fns';
import type {
  DateRange, DailyOPDRow, RevenueRow, BedOccupancyRow, CollectionRow,
  DoctorOPDRow, IPDCensusRow, SavedReport,
} from '../modules/reports/types/report-types';

const enhancedReportsService = {
  async getDailyOPDSummary(hospitalId: string, date: Date, _doctorId?: string): Promise<DailyOPDRow[]> {
    const store = mockStore.get();
    const dateStr = format(date, 'yyyy-MM-dd');
    const appts = store.appointments.filter(a => a.hospital_id === hospitalId && a.appointment_date === dateStr);
    
    return appts.map((a, idx) => ({
      token_number: idx + 1,
      patient_name: mockStore.getPatientName(a.patient_id),
      uhid: mockStore.getPatientById(a.patient_id)?.uhid ?? '',
      doctor_name: mockStore.getDoctorName(a.doctor_id),
      department_name: 'General Medicine',
      visit_type: a.type === 'follow_up' ? 'Follow-up' : 'First Visit',
      amount: a.type === 'follow_up' ? 300 : 500,
      payment_mode: 'Cash',
      status: a.status,
      appointment_time: a.appointment_time,
    }));
  },

  async getRevenueReport(_hospitalId: string, dateRange: DateRange, _groupBy: string): Promise<RevenueRow[]> {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return days.map(day => {
      const opd = Math.floor(Math.random() * 25000) + 8000;
      const ipd = Math.floor(Math.random() * 20000) + 5000;
      const lab = Math.floor(Math.random() * 8000) + 2000;
      const pharma = Math.floor(Math.random() * 12000) + 3000;
      const total = opd + ipd + lab + pharma;
      const gst = Math.round(total * 0.05);
      return {
        group_key: format(day, 'dd MMM'),
        opd_revenue: opd,
        ipd_revenue: ipd,
        lab_revenue: lab,
        pharmacy_revenue: pharma,
        total_revenue: total,
        gst_collected: gst,
        total_paid: Math.round(total * 0.85),
        total_pending: Math.round(total * 0.15),
      };
    });
  },

  async getBedOccupancy(hospitalId: string): Promise<BedOccupancyRow[]> {
    const wards = mockMasterStore.getAll<{
      id: string; name: string; ward_type: string; total_beds: number; available_beds: number; hospital_id: string;
    }>('wards', hospitalId);
    return wards.map(w => {
      const total = w.total_beds || 10;
      const vacant = w.available_beds ?? 4;
      const occupied = total - vacant;
      return {
        ward_name: w.name,
        ward_type: w.ward_type || 'General',
        total_beds: total,
        occupied_beds: occupied,
        vacant_beds: vacant,
        occupancy_pct: Math.round((occupied / total) * 100),
      };
    });
  },

  async getCollectionReport(_hospitalId: string, _dateRange: DateRange, _paymentMode?: string): Promise<CollectionRow[]> {
    const modes = [
      { mode: 'Cash', count: 145, amount: 287500 },
      { mode: 'Card', count: 67, amount: 198000 },
      { mode: 'UPI', count: 89, amount: 156000 },
      { mode: 'Online', count: 23, amount: 67500 },
      { mode: 'Insurance', count: 12, amount: 345000 },
    ];
    const total = modes.reduce((s, m) => s + m.amount, 0);
    return modes.map(m => ({
      payment_mode: m.mode,
      transaction_count: m.count,
      total_amount: m.amount,
      percentage: Math.round((m.amount / total) * 100),
    }));
  },

  async getDoctorOPDReport(hospitalId: string, _dateRange: DateRange, _doctorId?: string): Promise<DoctorOPDRow[]> {
    const doctors = mockStore.getDoctors(hospitalId);
    return doctors.map(d => {
      const total = Math.floor(Math.random() * 50) + 15;
      const first = Math.floor(total * 0.4);
      const followup = total - first;
      const revenue = first * 500 + followup * 300;
      return {
        doctor_id: d.id,
        doctor_name: d.full_name,
        department_name: d.department || 'General',
        patient_count: total,
        first_visit_count: first,
        followup_count: followup,
        total_revenue: revenue,
        avg_revenue_per_patient: Math.round(revenue / total),
      };
    });
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

  async getSavedReports(_hospitalId: string): Promise<SavedReport[]> { return []; },
  async saveReport(_report: Partial<SavedReport>): Promise<SavedReport> { return { id: Date.now().toString(), ..._report } as SavedReport; },
  async deleteSavedReport(_id: string): Promise<void> {},
  async runCustomQuery(_hospitalId: string, _table: string, _columns: string[], _filters: Record<string, string>, _page = 0) { return { data: [] as Record<string, unknown>[], count: 0 }; },

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
