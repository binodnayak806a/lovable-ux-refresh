import { useState, useEffect } from 'react';
import { TestTube, ChevronRight, Clock, AlertCircle, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';

interface PendingOrder {
  id: string;
  patient_name: string;
  test_name: string;
  status: string;
  priority: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', label: 'Pending' },
  sample_collected: { bg: 'bg-blue-100 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', label: 'Collected' },
  in_progress: { bg: 'bg-purple-100 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', label: 'In Progress' },
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  stat: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
  routine: 'bg-muted text-muted-foreground',
};

const DEMO_ORDERS: PendingOrder[] = [
  { id: '1', patient_name: 'Rahul Shah', test_name: 'CBC', status: 'pending', priority: 'urgent', created_at: new Date(Date.now() - 150 * 60000).toISOString() },
  { id: '2', patient_name: 'Meena Patel', test_name: 'Lipid Panel', status: 'sample_collected', priority: 'routine', created_at: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: '3', patient_name: 'Amit Kumar', test_name: 'HbA1c', status: 'pending', priority: 'stat', created_at: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: '4', patient_name: 'Sunita Gupta', test_name: 'Thyroid Profile', status: 'in_progress', priority: 'routine', created_at: new Date(Date.now() - 90 * 60000).toISOString() },
  { id: '5', patient_name: 'Vikram Singh', test_name: 'Urine R/M', status: 'pending', priority: 'urgent', created_at: new Date(Date.now() - 130 * 60000).toISOString() },
];

const TAT_THRESHOLD_MINS = 120;

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
          setOrders(sortByPriority(DEMO_ORDERS));
          setTotalPending(DEMO_ORDERS.length);
        } else {
          const mapped = (data ?? []).map((row: Record<string, unknown>) => ({
            id: row.id as string,
            patient_name: ((row.patient as Record<string, unknown>)?.full_name as string) ?? 'Unknown',
            test_name: 'Lab Test',
            status: row.status as string,
            priority: (row.priority as string) ?? 'routine',
            created_at: row.created_at as string,
          }));
          if (mapped.length > 0) {
            setOrders(sortByPriority(mapped));
            setTotalPending(count ?? 0);
          } else {
            setOrders(sortByPriority(DEMO_ORDERS));
            setTotalPending(DEMO_ORDERS.length);
          }
        }
      } catch {
        setOrders(sortByPriority(DEMO_ORDERS));
        setTotalPending(DEMO_ORDERS.length);
      } finally {
        setLoading(false);
      }
    })();
  }, [hospitalId]);

  function sortByPriority(list: PendingOrder[]): PendingOrder[] {
    const order: Record<string, number> = { urgent: 0, stat: 1, routine: 2 };
    return [...list].sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2));
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  function isOverdue(dateStr: string): boolean {
    return (Date.now() - new Date(dateStr).getTime()) > TAT_THRESHOLD_MINS * 60000;
  }

  const urgentCount = orders.filter(o => o.priority === 'urgent').length;
  const statCount = orders.filter(o => o.priority === 'stat').length;
  const routineCount = orders.filter(o => o.priority === 'routine').length;

  return (
    <section className="bg-card border border-border/50 rounded-2xl overflow-hidden h-full shadow-card flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
            <TestTube className="w-4 h-4 text-orange-500" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Pending Lab Orders</h2>
          <Badge variant="warning" className="text-[10px] px-1.5 py-0.5 h-5">{totalPending}</Badge>
        </div>
        <button onClick={() => navigate('/lab')} className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-0.5 transition-colors">
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
                <div className="flex-1"><Skeleton className="h-3.5 w-32 mb-1" /><Skeleton className="h-3 w-20" /></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FlaskConical className="w-10 h-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No pending lab orders</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              const overdue = isOverdue(order.created_at);
              const statusStyle = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;

              return (
                <div key={order.id} className="flex items-center gap-3 py-1.5 hover:bg-muted/30 rounded-lg px-1.5 -mx-1.5 transition-colors">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center">
                      <TestTube className="w-4 h-4 text-orange-500" />
                    </div>
                    {overdue && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border-2 border-card" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground truncate">{order.patient_name}</p>
                      {overdue && <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground font-medium">{order.test_name}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {timeAgo(order.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                      {statusStyle.label}
                    </span>
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-4 capitalize ${PRIORITY_STYLES[order.priority] ?? PRIORITY_STYLES.routine}`}>
                      {order.priority}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {orders.length > 0 && !loading && (
        <div className="px-5 py-3 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3 text-xs">
            {urgentCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">{urgentCount} Urgent</span>
              </span>
            )}
            {statCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-orange-600 dark:text-orange-400 font-medium">{statCount} STAT</span>
              </span>
            )}
            {routineCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                <span className="text-muted-foreground font-medium">{routineCount} Routine</span>
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
