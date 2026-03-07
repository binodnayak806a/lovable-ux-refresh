import { supabase } from '../lib/supabase';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import type { KPIData, DepartmentPerformance, HourlyTraffic, AnalyticsSummary } from '../modules/analytics/types';

const analyticsService = {
  async getKPIs(hospitalId: string): Promise<KPIData> {
    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();

    const { data: todayBills } = await supabase
      .from('bills')
      .select('total_amount, paid_amount, payment_status')
      .eq('hospital_id', hospitalId)
      .gte('bill_date', todayStart)
      .lte('bill_date', todayEnd);

    const billList = (todayBills ?? []) as Array<{
      total_amount: number;
      paid_amount: number;
      payment_status: string;
    }>;

    const totalRevenueToday = billList.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

    const { data: pendingBills } = await supabase
      .from('bills')
      .select('total_amount, paid_amount')
      .eq('hospital_id', hospitalId)
      .neq('payment_status', 'paid');

    const pendingList = (pendingBills ?? []) as Array<{ total_amount: number; paid_amount: number }>;
    const pendingBillsAmount = pendingList.reduce(
      (sum, b) => sum + (Number(b.total_amount || 0) - Number(b.paid_amount || 0)), 0
    );

    const { count: opdVisitsToday } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .gte('appointment_date', todayStart)
      .lte('appointment_date', todayEnd);

    const { count: ipdAdmissionsToday } = await supabase
      .from('admissions')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .gte('admission_date', todayStart)
      .lte('admission_date', todayEnd);

    const { data: beds } = await supabase
      .from('beds')
      .select('status')
      .eq('hospital_id', hospitalId);

    const bedList = (beds ?? []) as Array<{ status: string }>;
    const totalBeds = bedList.length;
    const occupiedBeds = bedList.filter(b => b.status === 'occupied').length;
    const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const { data: labOrders } = await supabase
      .from('lab_orders')
      .select('status')
      .eq('hospital_id', hospitalId)
      .gte('order_date', subDays(today, 7).toISOString());

    const labList = (labOrders ?? []) as Array<{ status: string }>;
    const completedLab = labList.filter(l => l.status === 'completed').length;
    const labTATCompliance = labList.length > 0 ? Math.round((completedLab / labList.length) * 100) : 0;

    const { data: appointments } = await supabase
      .from('appointments')
      .select('status')
      .eq('hospital_id', hospitalId)
      .gte('appointment_date', subDays(today, 7).toISOString());

    const apptList = (appointments ?? []) as Array<{ status: string }>;
    const completedAppts = apptList.filter(a => a.status === 'completed').length;
    const doctorUtilization = completedAppts > 0 ? Math.min(100, Math.round((completedAppts / 100) * 100)) : 75;

    const patientsWithRevenue = billList.length;
    const revenuePerPatient = patientsWithRevenue > 0 ? Math.round(totalRevenueToday / patientsWithRevenue) : 0;

    const { data: completedApptTimes } = await supabase
      .from('appointments')
      .select('created_at, appointment_time')
      .eq('hospital_id', hospitalId)
      .eq('status', 'completed')
      .gte('appointment_date', todayStart)
      .lte('appointment_date', todayEnd)
      .limit(50);

    const waitTimes = ((completedApptTimes ?? []) as Array<{ created_at: string; appointment_time: string }>)
      .map(a => {
        if (!a.appointment_time) return 0;
        const scheduled = new Date(`${todayStart.split('T')[0]}T${a.appointment_time}`);
        const created = new Date(a.created_at);
        return Math.max(0, Math.round((scheduled.getTime() - created.getTime()) / 60000));
      })
      .filter(w => w > 0 && w < 120);

    const avgPatientWaitTime = waitTimes.length > 0
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0;

    return {
      avgPatientWaitTime,
      bedOccupancyRate,
      revenuePerPatient,
      patientSatisfaction: 0,
      doctorUtilization,
      labTATCompliance,
      opdVisitsToday: opdVisitsToday ?? 0,
      ipdAdmissionsToday: ipdAdmissionsToday ?? 0,
      totalRevenueToday,
      pendingBillsAmount,
    };
  },

  async getDepartmentPerformance(hospitalId: string): Promise<DepartmentPerformance[]> {
    const { data: departments } = await supabase
      .from('departments')
      .select('id, name')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true);

    const deptList = (departments ?? []) as Array<{ id: string; name: string }>;

    const today = new Date();
    const weekAgo = subDays(today, 7);

    const performance: DepartmentPerformance[] = [];

    for (const dept of deptList.slice(0, 6)) {
      const { count: patients } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId)
        .eq('department_id', dept.id)
        .gte('appointment_date', weekAgo.toISOString());

      const patientCount = patients ?? 0;

      const { data: deptBills } = await supabase
        .from('bills')
        .select('total_amount')
        .eq('hospital_id', hospitalId)
        .eq('department_id', dept.id)
        .gte('bill_date', weekAgo.toISOString());

      const deptRevenue = ((deptBills ?? []) as Array<{ total_amount: number }>)
        .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

      performance.push({
        department: dept.name,
        patients: patientCount,
        revenue: deptRevenue,
        satisfaction: 0,
      });
    }

    return performance;
  },

  async getHourlyTraffic(hospitalId: string): Promise<HourlyTraffic[]> {
    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();

    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('hospital_id', hospitalId)
      .gte('appointment_date', todayStart)
      .lte('appointment_date', todayEnd);

    const apptList = (appointments ?? []) as Array<{ appointment_time: string }>;

    const { data: emergencies } = await supabase
      .from('emergency_visits')
      .select('arrival_time')
      .eq('hospital_id', hospitalId)
      .gte('arrival_time', todayStart)
      .lte('arrival_time', todayEnd);

    const emList = (emergencies ?? []) as Array<{ arrival_time: string }>;

    const hourlyData: HourlyTraffic[] = [];

    for (let h = 8; h <= 20; h++) {
      const hourStr = h.toString().padStart(2, '0');
      const opdCount = apptList.filter(a =>
        a.appointment_time && a.appointment_time.startsWith(hourStr)
      ).length;
      const emCount = emList.filter(e => {
        const hour = new Date(e.arrival_time).getHours();
        return hour === h;
      }).length;

      hourlyData.push({
        hour: `${hourStr}:00`,
        opd: opdCount,
        emergency: emCount,
        total: opdCount + emCount,
      });
    }

    return hourlyData;
  },

  async getSummary(hospitalId: string): Promise<AnalyticsSummary> {
    const [kpis, departmentPerformance, hourlyTraffic] = await Promise.all([
      this.getKPIs(hospitalId),
      this.getDepartmentPerformance(hospitalId),
      this.getHourlyTraffic(hospitalId),
    ]);

    const yesterday = subDays(new Date(), 1);
    const yesterdayStart = startOfDay(yesterday).toISOString();
    const yesterdayEnd = endOfDay(yesterday).toISOString();

    const [ydAppts, ydBills, ydAdmissions, ydDischarges] = await Promise.all([
      supabase.from('appointments').select('*', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId).gte('appointment_date', yesterdayStart).lte('appointment_date', yesterdayEnd),
      supabase.from('bills').select('total_amount')
        .eq('hospital_id', hospitalId).gte('bill_date', yesterdayStart).lte('bill_date', yesterdayEnd),
      supabase.from('admissions').select('*', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId).gte('admission_date', yesterdayStart).lte('admission_date', yesterdayEnd),
      supabase.from('admissions').select('*', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId).eq('status', 'discharged').gte('discharge_date', yesterdayStart).lte('discharge_date', yesterdayEnd),
    ]);

    const ydRevenue = ((ydBills.data ?? []) as Array<{ total_amount: number }>)
      .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

    const pct = (curr: number, prev: number) =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;

    const ydApptCount = ydAppts.count ?? 0;
    const ydAdmCount = ydAdmissions.count ?? 0;
    const ydDiscCount = ydDischarges.count ?? 0;

    const { count: todayDischarges } = await supabase
      .from('admissions')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .eq('status', 'discharged')
      .gte('discharge_date', startOfDay(new Date()).toISOString())
      .lte('discharge_date', endOfDay(new Date()).toISOString());

    const todayDiscCount = todayDischarges ?? 0;

    return {
      kpis,
      departmentPerformance,
      hourlyTraffic,
      recentTrends: {
        patients: {
          label: 'Patients',
          value: kpis.opdVisitsToday,
          previousValue: ydApptCount,
          change: kpis.opdVisitsToday - ydApptCount,
          changePercent: pct(kpis.opdVisitsToday, ydApptCount),
          isPositive: kpis.opdVisitsToday >= ydApptCount,
        },
        revenue: {
          label: 'Revenue',
          value: kpis.totalRevenueToday,
          previousValue: ydRevenue,
          change: kpis.totalRevenueToday - ydRevenue,
          changePercent: pct(kpis.totalRevenueToday, ydRevenue),
          isPositive: kpis.totalRevenueToday >= ydRevenue,
        },
        admissions: {
          label: 'Admissions',
          value: kpis.ipdAdmissionsToday,
          previousValue: ydAdmCount,
          change: kpis.ipdAdmissionsToday - ydAdmCount,
          changePercent: pct(kpis.ipdAdmissionsToday, ydAdmCount),
          isPositive: kpis.ipdAdmissionsToday >= ydAdmCount,
        },
        discharges: {
          label: 'Discharges',
          value: todayDiscCount,
          previousValue: ydDiscCount,
          change: todayDiscCount - ydDiscCount,
          changePercent: pct(todayDiscCount, ydDiscCount),
          isPositive: todayDiscCount >= ydDiscCount,
        },
      },
    };
  },
};

export default analyticsService;
