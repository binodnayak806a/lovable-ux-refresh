import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import dashboardService, {
  type DashboardMetrics as ServiceMetrics,
  type DailyAppointmentStat,
  type RecentAppointment,
  type AppointmentsByStatus,
  type PatientsByType,
  type HourlyTrendItem,
  type DoctorStat,
} from '../../services/dashboard.service';
import type { DashboardMetrics, LoadingState } from '../../types';

interface BedSummaryItem {
  id: string;
  name: string;
  ward_type: string;
  total_beds: number;
  available_beds: number;
  daily_rate: number;
}

interface DashboardState {
  metrics: DashboardMetrics;
  extendedMetrics: ServiceMetrics | null;
  dailyStats: DailyAppointmentStat[];
  recentAppointments: RecentAppointment[];
  appointmentsByStatus: AppointmentsByStatus[];
  todayAppointmentsByStatus: AppointmentsByStatus[];
  patientsByType: PatientsByType[];
  bedSummary: BedSummaryItem[];
  revenueSummary: { today: number; week: number; month: number } | null;
  hourlyTrend: HourlyTrendItem[];
  doctorStats: DoctorStat[];
  pendingDues: number;
  status: LoadingState;
  error: string | null;
  dateRange: { from: string; to: string };
  selectedDoctorId: string | null;
  selectedDepartmentId: string | null;
  lastUpdated: string | null;
  realtimeNewPatients: number;
}

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 30);

const initialState: DashboardState = {
  metrics: {
    totalAppointments: 0,
    newPatients: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    todayRevenue: 0,
    pendingBills: 0,
    activeAdmissions: 0,
    todayDischarges: 0,
  },
  extendedMetrics: null,
  dailyStats: [],
  recentAppointments: [],
  appointmentsByStatus: [],
  todayAppointmentsByStatus: [],
  patientsByType: [],
  bedSummary: [],
  revenueSummary: null,
  hourlyTrend: [],
  doctorStats: [],
  pendingDues: 0,
  status: 'idle',
  error: null,
  dateRange: {
    from: thirtyDaysAgo.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  },
  selectedDoctorId: null,
  selectedDepartmentId: null,
  lastUpdated: null,
  realtimeNewPatients: 0,
};

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (hospitalId: string, { rejectWithValue }) => {
    try {
      const [
        metrics, dailyStats, recentAppts, apptByStatus, patientsByType,
        bedSummary, revenueSummary, hourlyTrend, doctorStats, pendingDues,
        todayApptByStatus,
      ] = await Promise.allSettled([
        dashboardService.getMetrics(hospitalId),
        dashboardService.getDailyAppointmentStats(hospitalId, 30),
        dashboardService.getRecentAppointments(hospitalId, 8),
        dashboardService.getAppointmentsByStatus(hospitalId),
        dashboardService.getPatientsByRegistrationType(hospitalId),
        dashboardService.getBedSummary(hospitalId),
        dashboardService.getRevenueSummary(hospitalId),
        dashboardService.getHourlyAppointmentTrend(hospitalId),
        dashboardService.getDoctorWiseStats(hospitalId),
        dashboardService.getPendingDues(hospitalId),
        dashboardService.getTodayAppointmentsByStatus(hospitalId),
      ]);

      return {
        metrics: metrics.status === 'fulfilled' ? metrics.value : null,
        dailyStats: dailyStats.status === 'fulfilled' ? dailyStats.value : [],
        recentAppointments: recentAppts.status === 'fulfilled' ? recentAppts.value : [],
        appointmentsByStatus: apptByStatus.status === 'fulfilled' ? apptByStatus.value : [],
        todayAppointmentsByStatus: todayApptByStatus.status === 'fulfilled' ? todayApptByStatus.value : [],
        patientsByType: patientsByType.status === 'fulfilled' ? patientsByType.value : [],
        bedSummary: bedSummary.status === 'fulfilled' ? bedSummary.value : [],
        revenueSummary: revenueSummary.status === 'fulfilled' ? revenueSummary.value : null,
        hourlyTrend: hourlyTrend.status === 'fulfilled' ? hourlyTrend.value : [],
        doctorStats: doctorStats.status === 'fulfilled' ? doctorStats.value : [],
        pendingDues: pendingDues.status === 'fulfilled' ? pendingDues.value : 0,
      };
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    }
  }
);

export const fetchDashboardMetrics = createAsyncThunk(
  'dashboard/fetchMetrics',
  async (hospitalId: string, { dispatch }) => {
    return dispatch(fetchDashboardData(hospitalId));
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDateRange(state, action: PayloadAction<{ from: string; to: string }>) {
      state.dateRange = action.payload;
    },
    setSelectedDoctor(state, action: PayloadAction<string | null>) {
      state.selectedDoctorId = action.payload;
    },
    setSelectedDepartment(state, action: PayloadAction<string | null>) {
      state.selectedDepartmentId = action.payload;
    },
    incrementNewPatients(state) {
      state.realtimeNewPatients += 1;
      if (state.extendedMetrics) {
        state.extendedMetrics.newPatients += 1;
        state.extendedMetrics.totalPatients += 1;
      }
      state.metrics.newPatients += 1;
    },
    incrementTodayAppointments(state) {
      if (state.extendedMetrics) {
        state.extendedMetrics.todayAppointments += 1;
        state.extendedMetrics.totalAppointments += 1;
      }
      state.metrics.totalAppointments += 1;
    },
    resetDashboard: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.lastUpdated = new Date().toISOString();
        state.realtimeNewPatients = 0;
        const p = action.payload;
        if (p.metrics) {
          state.extendedMetrics = p.metrics;
          state.metrics = {
            totalAppointments: p.metrics.totalAppointments,
            newPatients: p.metrics.newPatients,
            occupiedBeds: p.metrics.occupiedBeds,
            availableBeds: p.metrics.totalBeds - p.metrics.occupiedBeds,
            todayRevenue: p.metrics.todayRevenue,
            pendingBills: 0,
            activeAdmissions: p.metrics.occupiedBeds,
            todayDischarges: 0,
          };
        }
        state.dailyStats = p.dailyStats;
        state.recentAppointments = p.recentAppointments;
        state.appointmentsByStatus = p.appointmentsByStatus;
        state.todayAppointmentsByStatus = p.todayAppointmentsByStatus;
        state.patientsByType = p.patientsByType;
        state.bedSummary = p.bedSummary as BedSummaryItem[];
        state.revenueSummary = p.revenueSummary;
        state.hourlyTrend = p.hourlyTrend;
        state.doctorStats = p.doctorStats;
        state.pendingDues = p.pendingDues;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const {
  setDateRange,
  setSelectedDoctor,
  setSelectedDepartment,
  incrementNewPatients,
  incrementTodayAppointments,
  resetDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
