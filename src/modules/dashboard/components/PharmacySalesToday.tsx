import { useState, useEffect } from 'react';
import { ShoppingCart, IndianRupee } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { Skeleton } from '../../../components/ui/skeleton';
import { format } from 'date-fns';
import { useCountUp } from '../../../hooks/useCountUp';

export default function PharmacySalesToday() {
  const hospitalId = useHospitalId();
  const [totalSales, setTotalSales] = useState(0);
  const [saleCount, setSaleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const animatedTotal = useCountUp(totalSales);

  useEffect(() => {
    (async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data, error } = await supabase
          .from('pharmacy_sales')
          .select('total')
          .eq('hospital_id', hospitalId)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`);

        if (error) {
          console.warn('pharmacy_sales query failed:', error.message);
        } else {
          const sales = (data ?? []) as { total: number }[];
          setSaleCount(sales.length);
          setTotalSales(sales.reduce((s, r) => s + (Number(r.total) || 0), 0));
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [hospitalId]);

  return (
    <section className="bg-card border border-border/50 rounded-2xl p-5 h-full shadow-card">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <ShoppingCart className="w-4 h-4 text-emerald-500" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Pharmacy Sales</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline gap-1">
              <IndianRupee className="w-5 h-5 text-muted-foreground" />
              <span className="text-3xl font-bold text-foreground">
                {animatedTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">from {saleCount} sales today</p>
          </div>
        </div>
      )}
    </section>
  );
}
