import { useState, useEffect } from 'react';
import { IndianRupee } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Skeleton } from '../../../components/ui/skeleton';
import { supabase } from '../../../lib/supabase';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { format, subDays } from 'date-fns';

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

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card rounded-xl px-3 py-2 text-sm shadow-elevated border border-border">
      <p className="font-semibold mb-1 text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="font-medium">Rs. {p.value.toLocaleString('en-IN')}</span>
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
    (async () => {
      try {
        const days: DayRevenue[] = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
          const d = subDays(today, i);
          const dateStr = format(d, 'yyyy-MM-dd');
          days.push({
            date: dateStr,
            label: format(d, 'EEE'),
            opd: 0,
            ipd: 0,
            total: 0,
          });
        }

        const fromDate = format(subDays(today, 6), 'yyyy-MM-dd');
        const toDate = format(today, 'yyyy-MM-dd');

        const { data: bills } = await supabase
          .from('bills')
          .select('total_amount, bill_type, created_at')
          .eq('hospital_id', hospitalId)
          .gte('created_at', `${fromDate}T00:00:00`)
          .lte('created_at', `${toDate}T23:59:59`)
          .in('status', ['paid', 'partial']);

        (bills as { total_amount: number; bill_type: string; created_at: string }[] ?? []).forEach((bill) => {
          const billDate = format(new Date(bill.created_at), 'yyyy-MM-dd');
          const day = days.find((d) => d.date === billDate);
          if (day) {
            const amount = Number(bill.total_amount) || 0;
            if (bill.bill_type === 'ipd') {
              day.ipd += amount;
            } else {
              day.opd += amount;
            }
            day.total += amount;
          }
        });

        setData(days);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [hospitalId]);

  const totalWeek = data.reduce((s, d) => s + d.total, 0);

  return (
    <section className="bg-card border border-border rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <IndianRupee className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Revenue Trend</h2>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Last 7 days</span>
      </div>

      <div className="mb-4">
        <span className="text-3xl font-bold text-foreground">Rs. {totalWeek.toLocaleString('en-IN')}</span>
        <p className="text-sm text-muted-foreground mt-0.5">Total this week</p>
      </div>

      {loading ? (
        <Skeleton className="h-[220px] w-full rounded-lg" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            />
            <Line
              type="monotone"
              dataKey="opd"
              name="OPD"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="ipd"
              name="IPD"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
