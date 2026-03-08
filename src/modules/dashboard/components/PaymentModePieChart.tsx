import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Skeleton } from '../../../components/ui/skeleton';
import { supabase } from '../../../lib/supabase';
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

export default function PaymentModePieChart() {
  const hospitalId = useHospitalId();
  const [data, setData] = useState<PaymentModeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: payments, error } = await supabase
          .from('payments')
          .select('amount, payment_method')
          .eq('hospital_id', hospitalId)
          .eq('payment_date', today);

        if (error) {
          console.warn('payments query failed:', error.message);
          setData([]);
        } else {
          const modeMap: Record<string, number> = {};
          for (const p of (payments ?? []) as { amount: number; payment_method: string }[]) {
            const mode = (p.payment_method || 'cash').toLowerCase();
            modeMap[mode] = (modeMap[mode] ?? 0) + (Number(p.amount) || 0);
          }
          const result = Object.entries(modeMap).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: MODE_COLORS[name] ?? 'hsl(220, 9%, 46%)',
          }));
          setData(result.sort((a, b) => b.value - a.value));
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [hospitalId]);

  return (
    <section className="bg-card border border-border/50 rounded-2xl p-5 h-full shadow-card">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-violet-600" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Payment Modes</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium ml-auto">Today</span>
      </div>

      {loading ? (
        <Skeleton className="h-[200px] w-full rounded-lg" />
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <CreditCard className="w-8 h-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No payments today</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
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
