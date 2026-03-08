import { useEffect, useCallback, useRef, useState } from 'react';
import {
  CalendarCheck, BedDouble, TrendingUp, Clock,
  ChevronRight, AlertTriangle, Stethoscope, UserPlus, RefreshCw,
  IndianRupee, FileText, Activity, Sparkles,
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
import DoctorStatsPanel from './components/DoctorStatsPanel';
import BedOccupancyPanel from './components/BedOccupancyPanel';
import RecentAppointmentsPanel from './components/RecentAppointmentsPanel';
import RevenueTrendChart from './components/RevenueTrendChart';
import OPDByDoctorChart from './components/OPDByDoctorChart';
import BedOccupancyDonut from './components/BedOccupancyDonut';
import LowStockAlert from './components/LowStockAlert';
import PendingLabOrders from './components/PendingLabOrders';
import UpcomingAppointments from './components/UpcomingAppointments';
import PharmacySalesToday from './components/PharmacySalesToday';
import { cn } from '../../lib/utils';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

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

  const { canAccessModule, isAdmin, isRole } = usePermissions();
  const hospitalId = user?.hospital_id ?? SAMPLE_HOSPITAL_ID;
  const prevDateRange = useRef(dateRange);
  const loading = status === 'loading';
  const [refreshing, setRefreshing] = useState(false);

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
    const interval = setInterval(() => {
      loadData();
    }, 60000);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const totalBeds = extendedMetrics?.totalBeds ?? 0;
  const occupiedBeds = extendedMetrics?.occupiedBeds ?? 0;
  const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const todayRevenue = revenueSummary?.today ?? 0;
  const userName = user?.full_name?.split(' ')[0] || 'User';

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardHeader
        userName={userName}
        refreshing={refreshing}
        loading={loading}
        onRefresh={handleRefresh}
        onNewPatient={() => navigate('/opd')}
        showNewPatient={canAccessModule('opd')}
      />

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

function DashboardHeader({
  userName, refreshing, loading, onRefresh, onNewPatient, showNewPatient,
}: {
  userName: string; refreshing: boolean; loading: boolean;
  onRefresh: () => void; onNewPatient: () => void; showNewPatient: boolean;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-2">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">
          Good {getTimeOfDay().toLowerCase()}, {userName}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatDate()}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing || loading}
          className="gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', (refreshing || loading) && 'animate-spin')} />
          Refresh
        </Button>
        {showNewPatient && (
          <Button size="sm" onClick={onNewPatient} className="gap-2">
            <UserPlus className="w-4 h-4" />
            New Patient
          </Button>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AdminDashboard({ loading, extendedMetrics, occupiedBeds, totalBeds, todayRevenue, todayAppointmentsByStatus, bedSummary, hourlyTrend, doctorStats, recentAppointments, navigate, isAdmin, isReceptionist }: any) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        <div className="cursor-pointer" onClick={() => navigate('/reports?tab=daily-opd')}>
          <MetricCard
            title="Today's OPD"
            value={extendedMetrics?.todayAppointments?.toString() ?? '0'}
            icon={CalendarCheck}
            trend={extendedMetrics?.appointmentsTrend ?? 0}
            gradient="blue"
            loading={loading}
          />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/reports?tab=revenue')}>
          <MetricCard
            title="Today's Revenue"
            value={loading ? '0' : `${formatCurrency(todayRevenue)}`}
            subtitle="Collections today"
            icon={IndianRupee}
            trend={extendedMetrics?.revenueTrend ?? 0}
            gradient="amber"
            loading={loading}
          />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/reports?tab=ipd-census')}>
          <MetricCard
            title="Current IPD"
            value={occupiedBeds.toString()}
            subtitle={`${totalBeds - occupiedBeds} beds free`}
            icon={BedDouble}
            gradient="teal"
            loading={loading}
          />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/reports?tab=bed-occupancy')}>
          <MetricCard
            title="Available Beds"
            value={(totalBeds - occupiedBeds).toString()}
            subtitle={`of ${totalBeds} total`}
            icon={Activity}
            gradient="rose"
            loading={loading}
          />
        </div>
      </div>

      {isAdmin && <AppointmentStatusStrip data={todayAppointmentsByStatus} loading={loading} />}

      {isReceptionist && !isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingAppointments showQuickAdd />
          <AppointmentStatusStrip data={todayAppointmentsByStatus} loading={loading} />
        </div>
      )}

      {isAdmin && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueTrendChart />
            </div>
            <BedOccupancyDonut wards={bedSummary} loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <OPDByDoctorChart doctors={doctorStats} loading={loading} />
            </div>
            <UpcomingAppointments />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <LowStockAlert />
            <PendingLabOrders />
            <PharmacySalesToday />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <HourlyTrendChart data={hourlyTrend} loading={loading} />
            </div>
            <BedOccupancyPanel wards={bedSummary} loading={loading} />
          </div>

          <DoctorStatsPanel doctors={doctorStats} loading={loading} />
          <RecentAppointmentsPanel appointments={recentAppointments} loading={loading} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
            <NavCard
              icon={AlertTriangle}
              color="red"
              title="Emergency"
              subtitle="Quick access to emergency care"
              onClick={() => navigate('/emergency')}
            />
            <NavCard
              icon={BedDouble}
              color="amber"
              title="IPD Admissions"
              subtitle="Manage inpatient care"
              onClick={() => navigate('/ipd')}
            />
            <NavCard
              icon={IndianRupee}
              color="emerald"
              title="Billing"
              subtitle="Payments and invoices"
              onClick={() => navigate('/billing')}
            />
          </div>
        </>
      )}
    </>
  );
}

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
        <MetricCard
          title="My Queue Today"
          value={myStats?.total?.toString() ?? '0'}
          icon={CalendarCheck}
          gradient="blue"
          loading={loading}
        />
        <MetricCard
          title="Waiting"
          value={myStats?.waiting?.toString() ?? '0'}
          icon={Clock}
          gradient="amber"
          loading={loading}
        />
        <MetricCard
          title="Completed"
          value={myStats?.completed?.toString() ?? '0'}
          icon={Stethoscope}
          gradient="teal"
          loading={loading}
        />
        <MetricCard
          title="In Progress"
          value={myStats?.in_progress?.toString() ?? '0'}
          icon={Activity}
          gradient="rose"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingAppointments />
        <Card>
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
                    'flex flex-col items-center gap-2 h-auto p-4 rounded-xl transition-all duration-200',
                    'border border-border/50 hover:shadow-sm hover:scale-[1.02]',
                    a.color,
                  )}
                >
                  <a.icon className="w-6 h-6" />
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
          <NavCard
            icon={FileText}
            color="orange"
            title="Enter Results"
            subtitle="Process pending lab orders"
            onClick={() => navigate('/lab')}
          />
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
          <MetricCard
            title="Today's Revenue"
            value={loading ? '0' : formatCurrency(todayRevenue)}
            icon={IndianRupee}
            gradient="amber"
            loading={loading}
          />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/billing')}>
          <MetricCard
            title="Pending Dues"
            value={loading ? '0' : formatCurrency(pendingDues)}
            icon={Activity}
            gradient="rose"
            loading={loading}
          />
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
        <MetricCard
          title="Occupied Beds"
          value={occupiedBeds.toString()}
          subtitle={`${bedOccupancyRate}% occupancy`}
          icon={BedDouble}
          gradient="blue"
          loading={loading}
        />
        <MetricCard
          title="Available Beds"
          value={(totalBeds - occupiedBeds).toString()}
          subtitle={`of ${totalBeds} total`}
          icon={Activity}
          gradient="teal"
          loading={loading}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BedOccupancyPanel wards={bedSummary} loading={loading} />
        <BedOccupancyDonut wards={bedSummary} loading={loading} />
      </div>
      <UpcomingAppointments />
    </>
  );
}

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
    <Card
      className="hover:shadow-hover transition-all duration-300 cursor-pointer group hover:scale-[1.01]"
      onClick={onClick}
    >
      <CardContent className="p-5">
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
          <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
}
