import { useState, useEffect } from 'react';
import { ShoppingCart, IndianRupee } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { Skeleton } from '../../../components/ui/skeleton';
import { format } from 'date-fns';

export default function PharmacySalesToday() {
  const hospitalId = useHospitalId();
  const [totalSales, setTotalSales] = useState(0);
  const [saleCount, setSaleCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [hospitalId]);

  return (
    <section className="bg-card border border-border rounded-xl p-5 h-full">
      <div className="flex items-center gap-2.5 mb-4">
        <ShoppingCart className="w-4 h-4 text-emerald-500" />
        <h2 className="text-sm font-semibold text-foreground">Pharmacy Sales Today</h2>
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
                {totalSales.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">from {saleCount} sales</p>
          </div>
        </div>
      )}
    </section>
  );
}
