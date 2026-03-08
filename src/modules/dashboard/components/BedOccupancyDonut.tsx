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
  general: 'hsl(204, 80%, 42%)',
  icu: 'hsl(0, 84%, 60%)',
  nicu: 'hsl(340, 82%, 52%)',
  picu: 'hsl(330, 80%, 55%)',
  private: 'hsl(172, 66%, 40%)',
  semi_private: 'hsl(190, 80%, 42%)',
  emergency: 'hsl(38, 92%, 50%)',
  ot: 'hsl(220, 9%, 46%)',
  hdu: 'hsl(38, 80%, 55%)',
};

const DEMO_WARDS: Ward[] = [
  { id: '1', name: 'General Ward', ward_type: 'general', total_beds: 30, available_beds: 10 },
  { id: '2', name: 'ICU', ward_type: 'icu', total_beds: 10, available_beds: 1 },
  { id: '3', name: 'Private', ward_type: 'private', total_beds: 15, available_beds: 5 },
  { id: '4', name: 'Semi Private', ward_type: 'semi_private', total_beds: 20, available_beds: 8 },
];

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-foreground/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm shadow-xl border border-border/20">
      <p className="font-semibold text-primary-foreground">{d.name}</p>
      <p className="text-muted-foreground/70 text-xs">{d.value} beds</p>
    </div>
  );
};

export default function BedOccupancyDonut({ wards: rawWards, loading }: Props) {
  const wards = rawWards.length > 0 ? rawWards : DEMO_WARDS;
  const totalBeds = wards.reduce((s, w) => s + w.total_beds, 0);
  const totalVacant = wards.reduce((s, w) => s + w.available_beds, 0);
  const totalOccupied = totalBeds - totalVacant;
  const occupancyPct = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;

  const donutData = [
    { name: 'Occupied', value: totalOccupied, color: 'hsl(204, 80%, 42%)' },
    { name: 'Vacant', value: totalVacant, color: 'hsl(142, 76%, 80%)' },
  ];

  const wardData = wards.map((w) => ({
    name: w.name,
    occupied: w.total_beds - w.available_beds,
    total: w.total_beds,
    color: WARD_COLORS[w.ward_type] ?? 'hsl(220, 9%, 46%)',
    pct: w.total_beds > 0 ? Math.round(((w.total_beds - w.available_beds) / w.total_beds) * 100) : 0,
  }));

  return (
    <section className="bg-card border border-border/50 rounded-2xl p-5 h-full shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BedDouble className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Bed Occupancy</h2>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
          {totalOccupied}/{totalBeds} beds
        </span>
      </div>

      {loading ? (
        <Skeleton className="h-[220px] w-full rounded-lg" />
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-2xl font-bold text-foreground">{occupancyPct}%</span>
                <p className="text-[10px] text-muted-foreground font-medium">Occupied</p>
              </div>
            </div>
          </div>

          <div className="mt-2 space-y-2.5">
            {wardData.slice(0, 4).map((w) => (
              <div key={w.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color }} />
                    <span className="text-foreground font-medium truncate max-w-[120px]">{w.name}</span>
                  </div>
                  <span className="text-muted-foreground">{w.occupied}/{w.total}</span>
                </div>
                <div className="w-full h-1 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${w.pct}%`, backgroundColor: w.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
