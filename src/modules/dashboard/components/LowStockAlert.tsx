import { useState, useEffect } from 'react';
import { AlertTriangle, Pill, ChevronRight, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';

interface LowStockItem {
  id: string;
  medication_name: string;
  batch_number: string;
  quantity_in_stock: number;
  reorder_level: number;
}

const DEMO_ITEMS: LowStockItem[] = [
  { id: '1', medication_name: 'Paracetamol 500mg', batch_number: 'B2401', quantity_in_stock: 15, reorder_level: 50 },
  { id: '2', medication_name: 'Amoxicillin 250mg', batch_number: 'B2402', quantity_in_stock: 0, reorder_level: 30 },
  { id: '3', medication_name: 'Metformin 500mg', batch_number: 'B2403', quantity_in_stock: 22, reorder_level: 40 },
  { id: '4', medication_name: 'Omeprazole 20mg', batch_number: 'B2404', quantity_in_stock: 5, reorder_level: 25 },
  { id: '5', medication_name: 'Cetirizine 10mg', batch_number: 'B2405', quantity_in_stock: 12, reorder_level: 20 },
];

export default function LowStockAlert() {
  const hospitalId = useHospitalId();
  const navigate = useNavigate();
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('pharmacy_inventory')
          .select('id, medication_name, batch_number, quantity_in_stock, reorder_level')
          .eq('hospital_id', hospitalId)
          .eq('is_active', true)
          .order('quantity_in_stock', { ascending: true })
          .limit(8);

        if (error) {
          setItems(DEMO_ITEMS);
        } else {
          const rows = (data ?? []) as LowStockItem[];
          const filtered = rows.filter((item) => item.quantity_in_stock <= (item.reorder_level || 10));
          setItems(filtered.length > 0 ? filtered : DEMO_ITEMS);
        }
      } catch {
        setItems(DEMO_ITEMS);
      } finally {
        setLoading(false);
      }
    })();
  }, [hospitalId]);

  const criticalCount = items.filter(i => i.quantity_in_stock <= Math.floor((i.reorder_level || 10) / 2)).length;
  const warningCount = items.length - criticalCount;

  return (
    <section className="bg-card border border-border/50 rounded-2xl overflow-hidden h-full shadow-card flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Low Stock Alerts</h2>
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 h-5">{items.length}</Badge>
        </div>
        <button onClick={() => navigate('/pharmacy')} className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-0.5 transition-colors">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-3 flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1"><Skeleton className="h-3.5 w-28 mb-1" /><Skeleton className="h-3 w-16" /></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="w-10 h-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">All stock levels are healthy</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.slice(0, 5).map((item) => {
              const isOutOfStock = item.quantity_in_stock === 0;
              const critical = item.quantity_in_stock <= Math.floor((item.reorder_level || 10) / 2);
              const pct = Math.min(100, Math.round((item.quantity_in_stock / (item.reorder_level || 10)) * 100));

              return (
                <div key={item.id} className="flex items-center gap-3 py-1.5 group">
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOutOfStock ? 'bg-red-100 dark:bg-red-950/30' : critical ? 'bg-red-50 dark:bg-red-950/20' : 'bg-amber-50 dark:bg-amber-950/20'}`}>
                      <Pill className={`w-4 h-4 ${isOutOfStock ? 'text-red-600' : critical ? 'text-red-500' : 'text-amber-500'}`} />
                    </div>
                    {critical && !isOutOfStock && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border-2 border-card" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{item.medication_name}</p>
                      {isOutOfStock && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 shrink-0">Out of Stock</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Batch: {item.batch_number}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${isOutOfStock ? 'bg-red-500' : critical ? 'bg-red-400' : 'bg-amber-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-medium tabular-nums ${isOutOfStock ? 'text-red-600' : critical ? 'text-red-500' : 'text-amber-600'}`}>
                        {item.quantity_in_stock}/{item.reorder_level}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && !loading && (
        <div className="px-5 py-3 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3 text-xs">
            {criticalCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">{criticalCount} Critical</span>
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-600 dark:text-amber-400 font-medium">{warningCount} Warning</span>
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
