import { useState, useEffect } from 'react';
import { ShoppingCart, IndianRupee, TrendingUp, ChevronRight, CreditCard, Smartphone, Banknote, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockMasterStore } from '../../../lib/mockMasterStore';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { Skeleton } from '../../../components/ui/skeleton';
import { useCountUp } from '../../../hooks/useCountUp';

const DEMO_HOURLY = [12, 18, 35, 28, 42, 55, 38, 22, 15, 8];
const DEMO_PAYMENT_SPLIT = { cash: 45, upi: 35, card: 20 };
const DEMO_TOP_SELLER = 'Paracetamol 500mg';

export default function PharmacySalesToday() {
  const hospitalId = useHospitalId();
  const navigate = useNavigate();
  const [totalSales, setTotalSales] = useState(0);
  const [saleCount, setSaleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const animatedTotal = useCountUp(totalSales);

  useEffect(() => {
    try {
      const sales = mockMasterStore.getAll<{ total: number; hospital_id: string }>('pharmacy_sales', hospitalId);
      if (sales.length > 0) {
        setSaleCount(sales.length);
        setTotalSales(sales.reduce((s, r) => s + (Number(r.total) || 0), 0));
      } else {
        setTotalSales(35400);
        setSaleCount(28);
      }
    } catch {
      setTotalSales(35400);
      setSaleCount(28);
    }
    setLoading(false);
  }, [hospitalId]);

  const avgBill = saleCount > 0 ? Math.round(totalSales / saleCount) : 0;
  const maxHourly = Math.max(...DEMO_HOURLY);

  return (
    <section className="bg-card border border-border/50 rounded-2xl overflow-hidden h-full shadow-card flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-emerald-500" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Pharmacy Sales</h2>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">Today</span>
        </div>
        <button onClick={() => navigate('/pharmacy')} className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-0.5 transition-colors">
          Details <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex-1">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Revenue + Growth */}
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-baseline gap-1">
                  <IndianRupee className="w-4 h-4 text-muted-foreground mb-0.5" />
                  <span className="text-2xl font-bold text-foreground tabular-nums">
                    {animatedTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{saleCount} bills · Avg ₹{avgBill.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+8.5%</span>
              </div>
            </div>

            {/* Mini Bar Chart - Hourly */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Hourly Distribution</p>
              <div className="flex items-end gap-1 h-10">
                {DEMO_HOURLY.map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-emerald-400/80 dark:bg-emerald-500/60 transition-all hover:bg-emerald-500"
                    style={{ height: `${Math.max(8, (val / maxHourly) * 100)}%` }}
                    title={`${8 + i}:00 — ${val}%`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">8AM</span>
                <span className="text-[10px] text-muted-foreground">5PM</span>
              </div>
            </div>

            {/* Payment Split */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Payment Split</p>
              <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                <div className="bg-emerald-500 transition-all" style={{ width: `${DEMO_PAYMENT_SPLIT.cash}%` }} />
                <div className="bg-blue-500 transition-all" style={{ width: `${DEMO_PAYMENT_SPLIT.upi}%` }} />
                <div className="bg-purple-500 transition-all" style={{ width: `${DEMO_PAYMENT_SPLIT.card}%` }} />
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Banknote className="w-3 h-3 text-emerald-500" /> Cash {DEMO_PAYMENT_SPLIT.cash}%
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Smartphone className="w-3 h-3 text-blue-500" /> UPI {DEMO_PAYMENT_SPLIT.upi}%
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <CreditCard className="w-3 h-3 text-purple-500" /> Card {DEMO_PAYMENT_SPLIT.card}%
                </span>
              </div>
            </div>

            {/* Top Seller */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-muted-foreground">Top Seller:</span>
              <span className="text-xs font-medium text-foreground">{DEMO_TOP_SELLER}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
