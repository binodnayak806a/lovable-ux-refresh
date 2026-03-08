import { useState, useEffect } from 'react';
import { AlertTriangle, Pill, ChevronRight } from 'lucide-react';
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
          console.warn('pharmacy_inventory table not available:', error.message);
          setItems([]);
        } else {
          const rows = (data ?? []) as LowStockItem[];
          setItems(rows.filter((item) => item.quantity_in_stock <= (item.reorder_level || 10)));
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [hospitalId]);

  return (
    <section className="bg-card border border-border/50 rounded-2xl overflow-hidden h-full shadow-card">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Low Stock</h2>
          {!loading && items.length > 0 && (
            <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">{items.length}</Badge>
          )}
        </div>
        <button onClick={() => navigate('/pharmacy')} className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-0.5">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-5 py-3">
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
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Pill className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">All stock levels are healthy</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 5).map((item) => {
              const critical = item.quantity_in_stock <= Math.floor((item.reorder_level || 10) / 2);
              const pct = Math.min(100, Math.round((item.quantity_in_stock / (item.reorder_level || 10)) * 100));
              return (
                <div key={item.id} className="flex items-center gap-3 group py-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${critical ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <Pill className={`w-4 h-4 ${critical ? 'text-red-500' : 'text-amber-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.medication_name}</p>
                    <div className="w-full h-1 rounded-full bg-muted mt-1">
                      <div className={`h-full rounded-full ${critical ? 'bg-red-400' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <Badge variant="secondary" className={`text-xs ${critical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.quantity_in_stock}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
