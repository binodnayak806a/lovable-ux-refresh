import { Stethoscope } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Skeleton } from '../../../components/ui/skeleton';
import type { DoctorStat } from '../../../services/dashboard.service';

interface Props {
  doctors: DoctorStat[];
  loading?: boolean;
}

const COLORS = ['#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308'];

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-900 rounded-lg px-3 py-2 text-sm text-white shadow-xl border border-gray-800">
      <p className="font-semibold">{d.name}</p>
      <p className="text-gray-300">{d.total} patients today</p>
    </div>
  );
};

export default function OPDByDoctorChart({ doctors, loading }: Props) {
  const chartData = doctors.slice(0, 8).map((d) => ({
    name: d.doctor_name.split(' ').slice(0, 2).join(' '),
    total: d.total,
    fullName: d.doctor_name,
  }));

  return (
    <section className="bg-card border border-border rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Stethoscope className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">OPD by Doctor</h2>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Today</span>
      </div>

      {loading ? (
        <Skeleton className="h-[220px] w-full rounded-lg" />
      ) : chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[220px] text-center">
          <Stethoscope className="w-8 h-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No doctor activity today</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
