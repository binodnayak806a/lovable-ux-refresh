import { Skeleton } from '../../../components/ui/skeleton';
import { CalendarCheck, ChevronDown, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { DailyAppointmentStat } from '../../../services/dashboard.service';

interface Props {
  stats: DailyAppointmentStat[];
  loading?: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      role="tooltip"
      className="bg-gray-900 rounded-lg px-3 py-2 text-sm text-white shadow-xl border border-gray-800"
    >
      <span className="font-semibold">{label}</span>
      <span className="text-gray-300 ml-1">: {payload[0].value} appointments</span>
    </div>
  );
};

export default function AppointmentTrendChart({ stats, loading }: Props) {
  const weeklyData = DAYS.map((day, i) => {
    const dayStats = stats.filter((s) => new Date(s.date).getDay() === i);
    const total = dayStats.reduce((sum, s) => sum + s.count, 0);
    return { day, count: total };
  });

  const maxIdx = weeklyData.reduce((max, d, i, arr) => d.count > arr[max].count ? i : max, 0);
  const totalWeek = weeklyData.reduce((sum, d) => sum + d.count, 0);

  return (
    <section
      aria-labelledby="weekly-appointments-heading"
      className="bg-white border border-gray-200 rounded-xl p-5 h-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <CalendarCheck aria-hidden="true" className="w-4 h-4 text-gray-400" />
          <h2 id="weekly-appointments-heading" className="text-sm font-semibold text-gray-900">
            Weekly Appointments
          </h2>
        </div>
        <button
          aria-label="Select time period"
          aria-haspopup="listbox"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 active:bg-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          This week
          <ChevronDown aria-hidden="true" className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mb-5">
        <div className="flex items-baseline gap-3">
          <span
            className="text-4xl font-bold text-gray-900"
            aria-label={`${totalWeek.toLocaleString()} total appointments this week`}
          >
            {totalWeek.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
            <TrendingUp aria-hidden="true" className="w-4 h-4" />
            +8%
          </span>
          <span className="text-sm text-gray-500">vs last week</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Total appointments this week</p>
      </div>

      {loading ? (
        <div role="status" aria-label="Loading chart data">
          <Skeleton className="h-[180px] w-full rounded-lg" />
        </div>
      ) : (
        <div aria-label="Bar chart showing daily appointment distribution">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={weeklyData}
              margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              role="img"
              aria-label="Weekly appointments bar chart"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {weeklyData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === maxIdx ? '#0ea5e9' : '#e0f2fe'}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span aria-hidden="true" className="w-3 h-3 rounded bg-sky-500" />
            <span>Peak day</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span aria-hidden="true" className="w-3 h-3 rounded bg-sky-100" />
            <span>Regular</span>
          </div>
        </div>
      </div>

      <div className="sr-only">
        <h3>Data table for weekly appointments</h3>
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Appointments</th>
            </tr>
          </thead>
          <tbody>
            {weeklyData.map((d) => (
              <tr key={d.day}>
                <td>{d.day}</td>
                <td>{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
