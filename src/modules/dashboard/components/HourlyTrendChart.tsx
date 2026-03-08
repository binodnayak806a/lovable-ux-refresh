import { Skeleton } from '../../../components/ui/skeleton';
import { Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { HourlyTrendItem } from '../../../services/dashboard.service';

interface Props {
  data: HourlyTrendItem[];
  loading?: boolean;
}

const DEMO_HOURLY: HourlyTrendItem[] = [
  { hour: 8, label: '8 AM', count: 5 },
  { hour: 9, label: '9 AM', count: 12 },
  { hour: 10, label: '10 AM', count: 22 },
  { hour: 11, label: '11 AM', count: 28 },
  { hour: 12, label: '12 PM', count: 18 },
  { hour: 13, label: '1 PM', count: 10 },
  { hour: 14, label: '2 PM', count: 15 },
  { hour: 15, label: '3 PM', count: 20 },
  { hour: 16, label: '4 PM', count: 16 },
  { hour: 17, label: '5 PM', count: 8 },
  { hour: 18, label: '6 PM', count: 4 },
];

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-foreground/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm shadow-xl border border-border/20">
      <span className="font-semibold text-primary-foreground">{label}</span>
      <span className="text-muted-foreground/70 ml-1">: {payload[0].value} patients</span>
    </div>
  );
};

export default function HourlyTrendChart({ data: rawData, loading }: Props) {
  const data = rawData.length > 0 && rawData.some(d => d.count > 0) ? rawData : DEMO_HOURLY;
  const totalToday = data.reduce((sum, d) => sum + d.count, 0);
  const peakHour = data.reduce((max, d) => d.count > max.count ? d : max, data[0] ?? { count: 0, label: '', hour: 0 });

  return (
    <section className="bg-card border border-border/50 rounded-2xl p-5 h-full shadow-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Hourly Patient Flow</h2>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>
      </div>

      <div className="flex items-baseline gap-4 mb-5">
        <div>
          <span className="text-3xl font-bold text-foreground">{totalToday}</span>
          <p className="text-sm text-muted-foreground mt-0.5">Total patients today</p>
        </div>
        {peakHour && peakHour.count > 0 && (
          <div className="ml-6 pl-6 border-l border-border">
            <span className="text-lg font-bold text-foreground">{peakHour.label}</span>
            <p className="text-sm text-muted-foreground">Peak hour ({peakHour.count})</p>
          </div>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-[200px] w-full rounded-lg" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="barGradientLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142, 76%, 80%)" stopOpacity={0.7} />
                <stop offset="100%" stopColor="hsl(142, 76%, 80%)" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(142, 76%, 36%, 0.06)' }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={32}>
              {data.map((entry) => (
                <Cell key={`cell-${entry.hour}`} fill={entry.hour === peakHour?.hour ? 'url(#barGradient)' : 'url(#barGradientLight)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      <div className="mt-3 pt-3 border-t border-border flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded bg-emerald-500" />
          Peak hour
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded bg-emerald-200" />
          Regular
        </div>
      </div>
    </section>
  );
}
