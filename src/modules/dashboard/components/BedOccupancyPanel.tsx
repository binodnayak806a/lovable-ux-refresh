import { BedDouble } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import { cn } from '../../../lib/utils';

interface BedSummaryItem {
  id: string;
  name: string;
  ward_type: string;
  total_beds: number;
  available_beds: number;
  daily_rate: number;
}

const WARD_TYPE_COLORS: Record<string, string> = {
  general:      'bg-blue-500',
  icu:          'bg-red-500',
  nicu:         'bg-rose-500',
  picu:         'bg-pink-500',
  private:      'bg-teal-500',
  semi_private: 'bg-cyan-500',
  emergency:    'bg-orange-500',
  ot:           'bg-muted-foreground',
  hdu:          'bg-amber-500',
};

interface Props {
  wards: BedSummaryItem[];
  loading?: boolean;
}

const DEMO_WARDS: BedSummaryItem[] = [
  { id: '1', name: 'General Ward', ward_type: 'general', total_beds: 30, available_beds: 10, daily_rate: 800 },
  { id: '2', name: 'ICU', ward_type: 'icu', total_beds: 10, available_beds: 1, daily_rate: 5000 },
  { id: '3', name: 'Private Room', ward_type: 'private', total_beds: 15, available_beds: 5, daily_rate: 3000 },
  { id: '4', name: 'Semi Private', ward_type: 'semi_private', total_beds: 20, available_beds: 8, daily_rate: 1500 },
  { id: '5', name: 'Emergency', ward_type: 'emergency', total_beds: 8, available_beds: 3, daily_rate: 2000 },
];

export default function BedOccupancyPanel({ wards: rawWards, loading }: Props) {
  const wards = rawWards.length > 0 ? rawWards : DEMO_WARDS;
  const totalBeds = wards.reduce((s, w) => s + w.total_beds, 0);
  const totalAvailable = wards.reduce((s, w) => s + w.available_beds, 0);
  const totalOccupied = totalBeds - totalAvailable;
  const occupancyRate = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;

  return (
    <section className="bg-card border border-border/50 rounded-2xl overflow-hidden h-full shadow-card">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BedDouble className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Ward-wise Occupancy</h2>
        </div>
        {!loading && (
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
            {occupancyRate}% occupied
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-5 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground text-xs">Ward</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground text-xs">Total</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground text-xs">Occupied</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground text-xs">Available</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground text-xs hidden sm:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {wards.map((ward) => {
                const occupied = ward.total_beds - ward.available_beds;
                const pct = ward.total_beds > 0 ? Math.round((occupied / ward.total_beds) * 100) : 0;
                const barColor = WARD_TYPE_COLORS[ward.ward_type] ?? 'bg-muted-foreground';
                const status = pct >= 90 ? 'critical' : pct >= 70 ? 'warning' : 'healthy';

                return (
                  <tr key={ward.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn('w-2 h-8 rounded-full', barColor)} />
                        <span className="font-medium text-foreground text-sm">{ward.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-foreground">{ward.total_beds}</td>
                    <td className="px-4 py-3 text-center font-semibold text-foreground">{occupied}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-bold',
                        status === 'critical' && 'bg-red-100 text-red-700',
                        status === 'warning' && 'bg-amber-100 text-amber-700',
                        status === 'healthy' && 'bg-emerald-100 text-emerald-700',
                      )}>
                        {ward.available_beds}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted">
                          <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
