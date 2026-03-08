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

const COLORS = ['hsl(204, 80%, 42%)', 'hsl(190, 80%, 42%)', 'hsl(172, 66%, 40%)', 'hsl(142, 76%, 36%)', 'hsl(160, 60%, 45%)', 'hsl(204, 60%, 55%)', 'hsl(217, 91%, 60%)', 'hsl(38, 92%, 50%)'];

const DEMO_DOCTORS = [
  { name: 'Dr. Mehta', total: 18, fullName: 'Dr. Rajesh Mehta' },
  { name: 'Dr. Patel', total: 14, fullName: 'Dr. Priya Patel' },
  { name: 'Dr. Shah', total: 22, fullName: 'Dr. Amit Shah' },
  { name: 'Dr. Desai', total: 10, fullName: 'Dr. Neha Desai' },
  { name: 'Dr. Sharma', total: 16, fullName: 'Dr. Vikram Sharma' },
  { name: 'Dr. Gupta', total: 8, fullName: 'Dr. Anjali Gupta' },
];

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-foreground/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm shadow-xl border border-border/20">
      <p className="font-semibold text-primary-foreground">{d.fullName}</p>
      <p className="text-muted-foreground/70 text-xs">{d.total} patients today</p>
    </div>
  );
};

export default function OPDByDoctorChart({ doctors, loading }: Props) {
  const realData = doctors.slice(0, 8).map((d) => ({
    name: d.doctor_name.split(' ').slice(0, 2).join(' '),
    total: d.total,
    fullName: d.doctor_name,
  }));

  const chartData = realData.length > 0 ? realData : DEMO_DOCTORS;

  return (
    <section className="bg-card border border-border/50 rounded-2xl p-5 h-full shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">OPD by Doctor</h2>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">Today</span>
      </div>

      {loading ? (
        <Skeleton className="h-[220px] w-full rounded-lg" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              {COLORS.map((color, i) => (
                <linearGradient key={i} id={`barColor${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.5} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(204, 80%, 42%, 0.06)' }} />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={`url(#barColor${i % COLORS.length})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
