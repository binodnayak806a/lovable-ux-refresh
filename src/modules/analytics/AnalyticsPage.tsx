import { useState, useEffect } from 'react';
import {
  Clock, BedDouble, DollarSign, ThumbsUp, UserCog, FlaskConical,
  TrendingUp, Loader2, Activity, Stethoscope,
  RefreshCw, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend,
} from 'recharts';
import { useAppSelector } from '../../store';
import { useToast } from '../../hooks/useToast';
import analyticsService from '../../services/analytics.service';
import type { AnalyticsSummary } from './types';

const KPI_ICONS: Record<string, React.ElementType> = {
  avgPatientWaitTime: Clock,
  bedOccupancyRate: BedDouble,
  revenuePerPatient: DollarSign,
  patientSatisfaction: ThumbsUp,
  doctorUtilization: UserCog,
  labTATCompliance: FlaskConical,
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const { hospitalId } = useAppSelector((s) => s.auth);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';
  const effectiveHospitalId = hospitalId ?? SAMPLE_HOSPITAL_ID;

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const summary = await analyticsService.getSummary(effectiveHospitalId);
      setData(summary);
    } catch {
      toast('Error', { description: 'Failed to load analytics', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hospitalId]);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `Rs. ${(amount / 100000).toFixed(2)}L`;
    }
    return `Rs. ${amount.toLocaleString('en-IN')}`;
  };

  const getKPIStatus = (key: string, value: number) => {
    const targets: Record<string, { target: number; isLowerBetter: boolean }> = {
      avgPatientWaitTime: { target: 20, isLowerBetter: true },
      bedOccupancyRate: { target: 80, isLowerBetter: false },
      doctorUtilization: { target: 85, isLowerBetter: false },
      labTATCompliance: { target: 95, isLowerBetter: false },
      patientSatisfaction: { target: 4.5, isLowerBetter: false },
    };

    const config = targets[key];
    if (!config) return 'neutral';

    if (config.isLowerBetter) {
      return value <= config.target ? 'good' : value <= config.target * 1.5 ? 'warning' : 'bad';
    } else {
      return value >= config.target ? 'good' : value >= config.target * 0.8 ? 'warning' : 'bad';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const kpiCards = [
    { key: 'avgPatientWaitTime', value: data.kpis.avgPatientWaitTime, unit: 'min', target: '< 20 min' },
    { key: 'bedOccupancyRate', value: data.kpis.bedOccupancyRate, unit: '%', target: '75-85%' },
    { key: 'doctorUtilization', value: data.kpis.doctorUtilization, unit: '%', target: '> 85%' },
    { key: 'labTATCompliance', value: data.kpis.labTATCompliance, unit: '%', target: '> 95%' },
    { key: 'patientSatisfaction', value: data.kpis.patientSatisfaction, unit: '/5', target: '> 4.5' },
    { key: 'revenuePerPatient', value: data.kpis.revenuePerPatient, unit: '', format: 'currency', target: '' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time hospital performance metrics</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadData(true)}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">OPD Today</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{data.kpis.opdVisitsToday}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600">+{data.recentTrends.patients.changePercent}%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">IPD Admissions</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{data.kpis.ipdAdmissionsToday}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600">+{data.recentTrends.admissions.changePercent}%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <BedDouble className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(data.kpis.totalRevenueToday)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600">+{data.recentTrends.revenue.changePercent}%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Bills</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(data.kpis.pendingBillsAmount)}</p>
                <p className="text-xs text-red-500 mt-1">Requires attention</p>
              </div>
              <div className="p-3 rounded-xl bg-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = KPI_ICONS[kpi.key] || Activity;
          const status = getKPIStatus(kpi.key, kpi.value);
          const statusColors = {
            good: 'border-l-emerald-500 bg-emerald-50/50',
            warning: 'border-l-amber-500 bg-amber-50/50',
            bad: 'border-l-red-500 bg-red-50/50',
            neutral: 'border-l-gray-300 bg-gray-50/50',
          };

          return (
            <Card key={kpi.key} className={`border-0 shadow-sm border-l-4 ${statusColors[status]}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-4 h-4 text-gray-500" />
                  {status === 'good' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  {status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                  {status === 'bad' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                </div>
                <p className="text-xl font-bold text-gray-800">
                  {kpi.format === 'currency' ? formatCurrency(kpi.value) : `${kpi.value}${kpi.unit}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {kpi.key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                </p>
                {kpi.target && (
                  <p className="text-xs text-gray-400 mt-0.5">Target: {kpi.target}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hourly Patient Traffic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.hourlyTraffic}>
                  <defs>
                    <linearGradient id="colorOPD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEmergency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="opd"
                    name="OPD"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorOPD)"
                  />
                  <Area
                    type="monotone"
                    dataKey="emergency"
                    name="Emergency"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#colorEmergency)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.departmentPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="department" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="patients" name="Patients" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {data.departmentPerformance.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Department Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.departmentPerformance.map((dept, index) => (
              <div key={index} className="p-4 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">{dept.department}</h4>
                  <Badge className="bg-blue-100 text-blue-700">{dept.patients} patients</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Revenue</span>
                    <span className="font-medium">{formatCurrency(dept.revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Satisfaction</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{dept.satisfaction.toFixed(1)}/5</span>
                      <ThumbsUp className="w-3 h-3 text-emerald-500" />
                    </div>
                  </div>
                  <Progress value={dept.satisfaction * 20} className="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
