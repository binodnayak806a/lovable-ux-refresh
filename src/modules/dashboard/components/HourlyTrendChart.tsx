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

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 rounded-lg px-3 py-2 text-sm text-white shadow-xl border border-gray-800">
      <span className="font-semibold">{label}</span>
      <span className="text-gray-300 ml-1">: {payload[0].value} patients</span>
    </div>
  );
};

export default function HourlyTrendChart({ data, loading }: Props) {
  const totalToday = data.reduce((sum, d) => sum + d.count, 0);
  const peakHour = data.reduce((max, d) => d.count > max.count ? d : max, data[0] ?? { count: 0, label: '', hour: 0 });

  return (
    <section className="bg-card border border-border rounded-xl p-5 h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Today's Appointment Activity
          </h2>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>
      </div>

      <div className="flex items-baseline gap-4 mb-5">
        <div>
          <span className="text-4xl font-bold text-foreground">{totalToday}</span>
          <p className="text-sm text-muted-foreground mt-0.5">Total appointments today</p>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {data.map((entry) => (
                <Cell
                  key={`cell-${entry.hour}`}
                  fill={entry.hour === peakHour?.hour ? '#10b981' : '#d1fae5'}
                />
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
          <span className="w-3 h-3 rounded bg-emerald-100" />
          Regular
        </div>
      </div>
    </section>
  );
}
