import { useEffect, useCallback, useRef } from 'react';
import {
  CalendarCheck, BedDouble, TrendingUp, Clock,
  ChevronRight, Stethoscope, UserPlus,
  IndianRupee, FileText, Activity, Users, LogIn, LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store';
import {
  fetchDashboardData,
  incrementNewPatients,
  incrementTodayAppointments,
} from '../../store/slices/dashboardSlice';
import { useRealtime } from '../../hooks/useRealtime';
import { usePermissions } from '../../hooks/usePermissions';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

import MetricCard from './components/MetricCard';
import HourlyTrendChart from './components/HourlyTrendChart';
import AppointmentStatusStrip from './components/AppointmentStatusStrip';

import BedOccupancyPanel from './components/BedOccupancyPanel';

import RevenueTrendChart from './components/RevenueTrendChart';
import OPDByDoctorChart from './components/OPDByDoctorChart';
import BedOccupancyDonut from './components/BedOccupancyDonut';
import LowStockAlert from './components/LowStockAlert';
import PendingLabOrders from './components/PendingLabOrders';
import UpcomingAppointments from './components/UpcomingAppointments';
import PharmacySalesToday from './components/PharmacySalesToday';
import RevenueKPIStrip from './components/RevenueKPIStrip';
import PaymentModePieChart from './components/PaymentModePieChart';
import TodayActivityFeed from './components/TodayActivityFeed';
import DoctorQueueMonitor from './components/DoctorQueueMonitor';
import DateFilterBar from './components/DateFilterBar';
import QuickActionButtons from './components/QuickActionButtons';
import { useRecentPages } from '../../hooks/useRecentPages';

import { cn } from '../../lib/utils';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

function formatCurrency(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

export default function DashboardPage() {
  usePageTitle('Dashboard');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const {
    extendedMetrics,
    bedSummary,
    recentAppointments,
    revenueSummary,
    hourlyTrend,
    doctorStats,
    pendingDues,
    todayAppointmentsByStatus,
    status,
    dateRange,
  } = useAppSelector((state) => state.dashboard);

  const { isAdmin, isRole } = usePermissions();
  const recentPages = useRecentPages();
  const hospitalId = user?.hospital_id ?? SAMPLE_HOSPITAL_ID;
  const prevDateRange = useRef(dateRange);
  const loading = status === 'loading';

  const loadData = useCallback(() => {
    dispatch(fetchDashboardData(hospitalId));
  }, [dispatch, hospitalId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (prevDateRange.current !== dateRange) {
      prevDateRange.current = dateRange;
      loadData();
    }
  }, [dateRange, loadData]);

  useEffect(() => {
    const interval = setInterval(() => { loadData(); }, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  useRealtime(
    { table: 'patients', event: 'INSERT', enabled: true },
    () => { dispatch(incrementNewPatients()); },
  );

  useRealtime(
    { table: 'appointments', event: 'INSERT', enabled: true },
    () => { dispatch(incrementTodayAppointments()); },
  );


  const totalBeds = extendedMetrics?.totalBeds ?? 0;
  const occupiedBeds = extendedMetrics?.occupiedBeds ?? 0;
  const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const todayRevenue = revenueSummary?.today ?? 0;
  

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();
  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-primary/5 to-transparent rounded-xl px-5 py-4 border border-primary/10">
        <div>
          <h1 className="text-xl font-bold text-foreground">{greeting}, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here's what's happening today. Press <kbd className="px-1.5 py-0.5 rounded border border-border text-[10px] font-mono bg-background mx-0.5">⌘K</kbd> to search or jump to any module.
          </p>
          {/* Recent shortcuts */}
          {recentPages.filter(p => p.path !== '/dashboard').length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Recent:</span>
              {recentPages.filter(p => p.path !== '/dashboard').slice(0, 3).map(p => (
                <button
                  key={p.path}
                  onClick={() => navigate(p.path)}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <QuickActionButtons />
      </div>

      {(isAdmin || isRole('receptionist')) && (
        <AdminDashboard
          loading={loading}
          extendedMetrics={extendedMetrics}
          occupiedBeds={occupiedBeds}
          totalBeds={totalBeds}
          todayRevenue={todayRevenue}
          todayAppointmentsByStatus={todayAppointmentsByStatus}
          bedSummary={bedSummary}
          hourlyTrend={hourlyTrend}
          doctorStats={doctorStats}
          recentAppointments={recentAppointments}
          revenueSummary={revenueSummary}
          navigate={navigate}
          isAdmin={isAdmin}
          isReceptionist={isRole('receptionist')}
        />
      )}

      {isRole('doctor') && (
        <DoctorDashboard
          loading={loading}
          doctorStats={doctorStats}
          doctorName={user?.full_name ?? ''}
          recentAppointments={recentAppointments}
          navigate={navigate}
        />
      )}

      {isRole('lab_technician') && <LabTechDashboard />}
      {isRole('pharmacist') && <PharmacistDashboard />}

      {isRole('billing') && (
        <BillingDashboard
          loading={loading}
          todayRevenue={todayRevenue}
          pendingDues={pendingDues}
          navigate={navigate}
        />
      )}

      {isRole('nurse') && (
        <NurseDashboard
          loading={loading}
          bedSummary={bedSummary}
          occupiedBeds={occupiedBeds}
          totalBeds={totalBeds}
          bedOccupancyRate={bedOccupancyRate}
        />
      )}
    </div>
  );
}


/* ─── Admin Dashboard — Industry Standard HMS Layout ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AdminDashboard({ loading, extendedMetrics, occupiedBeds, totalBeds, todayRevenue, todayAppointmentsByStatus, bedSummary, hourlyTrend, doctorStats, recentAppointments, revenueSummary, navigate, isAdmin, isReceptionist }: any) {
  return (
    <>
      {/* ── Date Filter Bar ── */}
      <DateFilterBar onDateChange={(range) => console.log('Date range:', range)} />

      {/* ── Section 1: KPI Cards (6 cards) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 stagger-children">
        <div className="cursor-pointer" onClick={() => navigate('/patients')}>
          <MetricCard title="Total Patients Today" value={extendedMetrics?.todayAppointments?.toString() ?? '0'} icon={Users} trend={extendedMetrics?.appointmentsTrend ?? 0} gradient="blue" loading={loading} />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/patients')}>
          <MetricCard title="New Patients" value={extendedMetrics?.newPatients?.toString() ?? '0'} icon={UserPlus} trend={extendedMetrics?.patientsTrend ?? 0} gradient="green" loading={loading} />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/appointments')}>
          <MetricCard title="Appointments" value={extendedMetrics?.todayAppointments?.toString() ?? '0'} icon={CalendarCheck} trend={5} gradient="amber" loading={loading} />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/ipd')}>
          <MetricCard title="IPD Admissions" value={occupiedBeds.toString()} icon={LogIn} trend={8} gradient="teal" loading={loading} />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/ipd')}>
          <MetricCard title="IPD Discharges" value="0" icon={LogOut} trend={-2} gradient="rose" loading={loading} />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/ipd/beds')}>
          <MetricCard title="Beds Occupied" value={`${occupiedBeds} / ${totalBeds}`} icon={BedDouble} trend={totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 10) : 0} gradient="blue" loading={loading} />
        </div>
      </div>

      {/* ── Section 2: Revenue Overview (4 cards) ── */}
      {isAdmin && (
        <RevenueKPIStrip
          opdRevenue={revenueSummary?.today ?? 0}
          ipdRevenue={0}
          pharmacyRevenue={0}
          totalRevenue={todayRevenue}
          loading={loading}
        />
      )}

      {/* ── Section 3: Status Strip ── */}
      <AppointmentStatusStrip data={todayAppointmentsByStatus} loading={loading} />

      {isReceptionist && !isAdmin && (
        <UpcomingAppointments showQuickAdd />
      )}

      {isAdmin && (
        <>
          {/* ── Section 4: Charts Row — Revenue Trend + Payment Mode ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueTrendChart />
            </div>
            <PaymentModePieChart />
          </div>

          {/* ── Section 5: Hourly Activity + Today's Activity Feed ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <HourlyTrendChart data={hourlyTrend} loading={loading} />
            </div>
            <TodayActivityFeed />
          </div>

          {/* ── Section 6: Bed Occupancy Table + Donut ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BedOccupancyPanel wards={bedSummary} loading={loading} />
            <BedOccupancyDonut wards={bedSummary} loading={loading} />
          </div>

          {/* ── Section 7: OPD by Doctor + Doctor Queue Monitor ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <OPDByDoctorChart doctors={doctorStats} loading={loading} />
            </div>
            <DoctorQueueMonitor doctors={doctorStats} loading={loading} />
          </div>


          {/* ── Section 9: Alerts Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <LowStockAlert />
            <PendingLabOrders />
            <PharmacySalesToday />
          </div>

          {/* ── Section 10: Recent Appointments ── */}
          <RecentAppointmentsPanel appointments={recentAppointments} loading={loading} />
        </>
      )}
    </>
  );
}

/* ─── Doctor Dashboard ─── */
function DoctorDashboard({ loading, doctorStats, doctorName, recentAppointments, navigate }: {
  loading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doctorStats: any[];
  doctorName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentAppointments: any[];
  navigate: (path: string) => void;
}) {
  const firstName = doctorName?.split(' ')[0]?.toLowerCase() ?? '';
  const myStats = firstName
    ? doctorStats.find((d) => d.doctor_name?.toLowerCase().includes(firstName))
    : undefined;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        <MetricCard title="My Queue Today" value={myStats?.total?.toString() ?? '0'} icon={CalendarCheck} gradient="blue" loading={loading} />
        <MetricCard title="Waiting" value={myStats?.waiting?.toString() ?? '0'} icon={Clock} gradient="amber" loading={loading} />
        <MetricCard title="Completed" value={myStats?.completed?.toString() ?? '0'} icon={Stethoscope} gradient="teal" loading={loading} />
        <MetricCard title="In Progress" value={myStats?.in_progress?.toString() ?? '0'} icon={Activity} gradient="rose" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingAppointments />
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Start Consultation', icon: Stethoscope, color: 'text-teal-600 bg-teal-50 hover:bg-teal-100', path: '/doctor/queue' },
                { label: 'My Queue', icon: Clock, color: 'text-primary bg-primary/10 hover:bg-primary/15', path: '/doctor/queue' },
                { label: 'Lab Reports', icon: FileText, color: 'text-amber-600 bg-amber-50 hover:bg-amber-100', path: '/lab' },
                { label: 'IPD Rounds', icon: BedDouble, color: 'text-rose-600 bg-rose-50 hover:bg-rose-100', path: '/ipd' },
              ].map((a) => (
                <Button
                  key={a.label}
                  variant="ghost"
                  onClick={() => navigate(a.path)}
                  className={cn(
                    'flex flex-col items-center gap-2.5 h-auto p-5 rounded-xl transition-all duration-200',
                    'border border-border/50 hover:shadow-sm hover:scale-[1.02]',
                    a.color,
                  )}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-current/10">
                    <a.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-center">{a.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <RecentAppointmentsPanel appointments={recentAppointments} loading={loading} />
    </>
  );
}

/* ─── Role-specific dashboards ─── */
function LabTechDashboard() {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PendingLabOrders />
      <Card className="p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
        </div>
        <div className="space-y-3">
          <NavCard icon={FileText} color="orange" title="Enter Results" subtitle="Process pending lab orders" onClick={() => navigate('/lab')} />
        </div>
      </Card>
    </div>
  );
}

function PharmacistDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <LowStockAlert />
      <PharmacySalesToday />
    </div>
  );
}

function BillingDashboard({ loading, todayRevenue, pendingDues, navigate }: {
  loading: boolean; todayRevenue: number; pendingDues: number; navigate: (path: string) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        <div className="cursor-pointer" onClick={() => navigate('/reports?tab=revenue')}>
          <MetricCard title="Today's Revenue" value={loading ? '0' : formatCurrency(todayRevenue)} icon={IndianRupee} gradient="amber" loading={loading} />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/billing')}>
          <MetricCard title="Pending Dues" value={loading ? '0' : formatCurrency(pendingDues)} icon={Activity} gradient="rose" loading={loading} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueTrendChart />
        <UpcomingAppointments />
      </div>
    </>
  );
}

function NurseDashboard({ loading, bedSummary, occupiedBeds, totalBeds, bedOccupancyRate }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loading: boolean; bedSummary: any[]; occupiedBeds: number; totalBeds: number; bedOccupancyRate: number;
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
        <MetricCard title="Occupied Beds" value={occupiedBeds.toString()} subtitle={`${bedOccupancyRate}% occupancy`} icon={BedDouble} gradient="blue" loading={loading} />
        <MetricCard title="Available Beds" value={(totalBeds - occupiedBeds).toString()} subtitle={`of ${totalBeds} total`} icon={Activity} gradient="teal" loading={loading} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BedOccupancyPanel wards={bedSummary} loading={loading} />
        <BedOccupancyDonut wards={bedSummary} loading={loading} />
      </div>
      <UpcomingAppointments />
    </>
  );
}

/* ─── NavCard ─── */
const NAV_COLOR_MAP: Record<string, { bg: string; bgHover: string; text: string; border: string }> = {
  red: { bg: 'bg-red-50', bgHover: 'group-hover:bg-red-100', text: 'text-red-600', border: 'border-red-100' },
  amber: { bg: 'bg-amber-50', bgHover: 'group-hover:bg-amber-100', text: 'text-amber-600', border: 'border-amber-100' },
  emerald: { bg: 'bg-emerald-50', bgHover: 'group-hover:bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-100' },
  orange: { bg: 'bg-amber-50', bgHover: 'group-hover:bg-amber-100', text: 'text-amber-600', border: 'border-amber-100' },
  blue: { bg: 'bg-primary/10', bgHover: 'group-hover:bg-primary/15', text: 'text-primary', border: 'border-primary/10' },
  teal: { bg: 'bg-teal-50', bgHover: 'group-hover:bg-teal-100', text: 'text-teal-600', border: 'border-teal-100' },
};

function NavCard({ icon: Icon, color, title, subtitle, onClick }: {
  icon: React.ElementType; color: string; title: string; subtitle: string; onClick: () => void;
}) {
  const c = NAV_COLOR_MAP[color] || NAV_COLOR_MAP.blue;
  return (
    <div
      className="glass-card hover:shadow-hover transition-all duration-300 cursor-pointer group hover:scale-[1.01] p-5"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
          'group-hover:scale-110 border',
          c.bg, c.bgHover, c.border,
        )}>
          <Icon className={cn('w-6 h-6', c.text)} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-muted-foreground group-hover:translate-x-1 transition-all duration-300" />
      </div>
    </div>
  );
}
