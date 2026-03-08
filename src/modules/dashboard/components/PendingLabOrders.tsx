import { useState, useEffect } from 'react';
import { TestTube, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';

interface PendingOrder {
  id: string;
  patient_name: string;
  status: string;
  priority: string;
  created_at: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  stat: 'bg-orange-100 text-orange-700',
  routine: 'bg-muted text-muted-foreground',
};

export default function PendingLabOrders() {
  const hospitalId = useHospitalId();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, count, error } = await supabase
          .from('lab_orders')
          .select('id, status, priority, created_at, patient:patients(full_name)', { count: 'exact' })
          .eq('hospital_id', hospitalId)
          .in('status', ['pending', 'sample_collected', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.warn('lab_orders query failed:', error.message);
          setOrders([]);
          setTotalPending(0);
        } else {
          const mapped = (data ?? []).map((row: Record<string, unknown>) => ({
            id: row.id as string,
            patient_name: ((row.patient as Record<string, unknown>)?.full_name as string) ?? 'Unknown',
            status: row.status as string,
            priority: (row.priority as string) ?? 'routine',
            created_at: row.created_at as string,
          }));
          setOrders(mapped);
          setTotalPending(count ?? 0);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [hospitalId]);

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <section className="bg-card border border-border/50 rounded-2xl overflow-hidden h-full shadow-card">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <TestTube className="w-4 h-4 text-orange-500" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Pending Lab</h2>
          {!loading && totalPending > 0 && (
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">{totalPending}</Badge>
          )}
        </div>
        <button onClick={() => navigate('/lab')} className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-0.5">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-5 py-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1"><Skeleton className="h-3.5 w-32 mb-1" /><Skeleton className="h-3 w-20" /></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <TestTube className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No pending lab orders</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 py-1 hover:bg-muted/30 rounded-lg px-1 -mx-1 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <TestTube className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{order.patient_name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {timeAgo(order.created_at)}
                  </div>
                </div>
                <Badge variant="secondary" className={`text-xs capitalize ${PRIORITY_STYLES[order.priority] ?? PRIORITY_STYLES.routine}`}>
                  {order.priority}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
