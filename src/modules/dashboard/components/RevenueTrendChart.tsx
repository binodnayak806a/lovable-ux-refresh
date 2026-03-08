import { useState, useEffect } from 'react';
import { IndianRupee } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Skeleton } from '../../../components/ui/skeleton';
// Revenue data from mockStore or demo fallback
import { useHospitalId } from '../../../hooks/useHospitalId';
// date-fns used in DEMO_DATA dates

interface DayRevenue {
  date: string;
  label: string;
  opd: number;
  ipd: number;
  total: number;
}

function formatCurrency(v: number): string {
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
}

const DEMO_DATA: DayRevenue[] = [
  { date: '2026-03-02', label: 'Mon', opd: 32000, ipd: 85000, total: 117000 },
  { date: '2026-03-03', label: 'Tue', opd: 45000, ipd: 92000, total: 137000 },
  { date: '2026-03-04', label: 'Wed', opd: 38000, ipd: 78000, total: 116000 },
  { date: '2026-03-05', label: 'Thu', opd: 52000, ipd: 105000, total: 157000 },
  { date: '2026-03-06', label: 'Fri', opd: 48000, ipd: 98000, total: 146000 },
  { date: '2026-03-07', label: 'Sat', opd: 28000, ipd: 65000, total: 93000 },
  { date: '2026-03-08', label: 'Sun', opd: 15000, ipd: 45000, total: 60000 },
];

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-foreground/90 backdrop-blur-sm rounded-lg px-3 py-2.5 text-sm shadow-xl border border-border/20">
      <p className="font-semibold text-primary-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground/70 text-xs">{p.name}:</span>
          <span className="font-medium text-primary-foreground text-xs">₹{p.value.toLocaleString('en-IN')}</span>
        </p>
      ))}
    </div>
  );
};

export default function RevenueTrendChart() {
  const hospitalId = useHospitalId();
  const [data, setData] = useState<DayRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use demo data directly - no Supabase tables available
    setData(DEMO_DATA);
    setLoading(false);
  }, [hospitalId]);

  const totalWeek = data.reduce((s, d) => s + d.total, 0);

  return (
    <section className="bg-card border border-border/50 rounded-2xl p-5 h-full shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
            <IndianRupee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Revenue Trend</h2>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">Last 7 days</span>
      </div>

      <div className="mb-4">
        <span className="text-3xl font-bold text-foreground">₹{totalWeek.toLocaleString('en-IN')}</span>
        <p className="text-sm text-muted-foreground mt-0.5">Total this week</p>
      </div>

      {loading ? (
        <Skeleton className="h-[220px] w-full rounded-lg" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOPD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(204, 80%, 42%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(204, 80%, 42%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorIPD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <Area type="monotone" dataKey="opd" name="OPD" stroke="hsl(204, 80%, 42%)" strokeWidth={2.5} fill="url(#colorOPD)" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
            <Area type="monotone" dataKey="ipd" name="IPD" stroke="hsl(142, 76%, 36%)" strokeWidth={2.5} fill="url(#colorIPD)" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
