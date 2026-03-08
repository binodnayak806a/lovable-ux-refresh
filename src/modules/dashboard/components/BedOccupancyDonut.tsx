import { BedDouble } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '../../../components/ui/skeleton';

interface Ward {
  id: string;
  name: string;
  ward_type: string;
  total_beds: number;
  available_beds: number;
}

interface Props {
  wards: Ward[];
  loading?: boolean;
}

const WARD_COLORS: Record<string, string> = {
  general: '#3b82f6',
  icu: '#ef4444',
  nicu: '#f43f5e',
  picu: '#ec4899',
  private: '#14b8a6',
  semi_private: '#06b6d4',
  emergency: '#f97316',
  ot: '#6b7280',
  hdu: '#f59e0b',
};

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-900 rounded-lg px-3 py-2 text-sm text-white shadow-xl border border-gray-800">
      <p className="font-semibold">{d.name}</p>
      <p className="text-gray-300">{d.occupied} occupied / {d.total} total</p>
    </div>
  );
};

export default function BedOccupancyDonut({ wards, loading }: Props) {
  const chartData = wards.map((w) => ({
    name: w.name,
    occupied: w.total_beds - w.available_beds,
    vacant: w.available_beds,
    total: w.total_beds,
    color: WARD_COLORS[w.ward_type] ?? '#6b7280',
  }));

  const totalBeds = wards.reduce((s, w) => s + w.total_beds, 0);
  const totalVacant = wards.reduce((s, w) => s + w.available_beds, 0);
  const totalOccupied = totalBeds - totalVacant;

  const donutData = [
    { name: 'Occupied', value: totalOccupied, color: '#3b82f6' },
    { name: 'Vacant', value: totalVacant, color: '#d1d5db' },
  ];

  return (
    <section className="bg-card border border-border rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <BedDouble className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Bed Occupancy</h2>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-[220px] w-full rounded-lg" />
      ) : totalBeds === 0 ? (
        <div className="flex flex-col items-center justify-center h-[220px] text-center">
          <BedDouble className="w-8 h-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No bed data available</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-2xl font-bold text-foreground">{totalOccupied}</span>
                <p className="text-xs text-muted-foreground">/ {totalBeds}</p>
              </div>
            </div>
          </div>

          <div className="mt-2 space-y-2">
            {chartData.slice(0, 4).map((w) => (
              <div key={w.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color }} />
                  <span className="text-muted-foreground truncate max-w-[120px]">{w.name}</span>
                </div>
                <span className="text-foreground font-medium">{w.occupied}/{w.total}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
