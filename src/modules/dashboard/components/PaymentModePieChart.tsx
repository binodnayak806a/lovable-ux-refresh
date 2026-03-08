import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Skeleton } from '../../../components/ui/skeleton';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { format } from 'date-fns';

interface PaymentModeData {
  name: string;
  value: number;
  color: string;
}

const MODE_COLORS: Record<string, string> = {
  cash: 'hsl(142, 76%, 36%)',
  upi: 'hsl(262, 83%, 58%)',
  card: 'hsl(204, 80%, 42%)',
  insurance: 'hsl(38, 92%, 50%)',
  cheque: 'hsl(172, 66%, 40%)',
  online: 'hsl(340, 82%, 52%)',
};

const DEMO_DATA: PaymentModeData[] = [
  { name: 'Cash', value: 85000, color: MODE_COLORS.cash },
  { name: 'UPI', value: 62000, color: MODE_COLORS.upi },
  { name: 'Card', value: 35000, color: MODE_COLORS.card },
  { name: 'Insurance', value: 48000, color: MODE_COLORS.insurance },
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: PaymentModeData }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-foreground/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm shadow-xl border border-border/20">
      <p className="font-semibold text-primary-foreground">{d.name}</p>
      <p className="text-muted-foreground/70 text-xs">₹{d.value.toLocaleString('en-IN')}</p>
    </div>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number;
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.08) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function PaymentModePieChart() {
  const hospitalId = useHospitalId();
  const [data, setData] = useState<PaymentModeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Use mockStore bills to calculate payment mode breakdown instead of non-existent payments table
        const { mockStore } = await import('../../../lib/mockStore');
        const store = mockStore.get();
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayBills = store.bills.filter(b => b.bill_date === today);

        if (todayBills.length > 0) {
          const modeMap: Record<string, number> = {};
          for (const b of todayBills) {
            const mode = (b.payment_mode || 'cash').toLowerCase();
            modeMap[mode] = (modeMap[mode] ?? 0) + (b.amount_paid || 0);
          }
          const result = Object.entries(modeMap).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: MODE_COLORS[name] ?? 'hsl(220, 9%, 46%)',
          }));
          setData(result.sort((a, b) => b.value - a.value));
        } else {
          setData(DEMO_DATA);
        }
      } catch {
        setData(DEMO_DATA);
      }
      finally { setLoading(false); }
    })();
  }, [hospitalId]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <section className="bg-card border border-border/50 rounded-2xl p-5 h-full shadow-card">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Payment Modes</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium ml-auto">Today</span>
      </div>

      <div className="mb-3">
        <span className="text-2xl font-bold text-foreground">₹{total.toLocaleString('en-IN')}</span>
        <p className="text-xs text-muted-foreground mt-0.5">Total collections</p>
      </div>

      {loading ? (
        <Skeleton className="h-[200px] w-full rounded-lg" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              label={renderCustomLabel}
              labelLine={false}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
