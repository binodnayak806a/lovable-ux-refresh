import { BedDouble } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';

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
  ot:           'bg-gray-500',
  hdu:          'bg-amber-500',
};

interface Props {
  wards: BedSummaryItem[];
  loading?: boolean;
}

export default function BedOccupancyPanel({ wards, loading }: Props) {
  const totalBeds = wards.reduce((s, w) => s + w.total_beds, 0);
  const totalAvailable = wards.reduce((s, w) => s + w.available_beds, 0);
  const totalOccupied = totalBeds - totalAvailable;
  const occupancyRate = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;

  return (
    <section
      aria-labelledby="bed-occupancy-heading"
      className="bg-white border border-gray-200 rounded-xl p-5 h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BedDouble aria-hidden="true" className="w-4 h-4 text-gray-400" />
          <h2 id="bed-occupancy-heading" className="text-sm font-semibold text-gray-900">
            Bed Occupancy
          </h2>
        </div>
        {!loading && totalBeds > 0 && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
            {totalOccupied}/{totalBeds} beds
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4" role="status" aria-label="Loading bed occupancy data">
          <Skeleton className="h-12 w-24" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ) : wards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <BedDouble aria-hidden="true" className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">No ward data available</p>
          <p className="text-xs text-gray-400 mt-1">Ward information will appear here</p>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <div
              className="text-4xl font-bold text-gray-900"
              aria-label={`${occupancyRate}% overall occupancy rate`}
            >
              {occupancyRate}%
            </div>
            <p className="text-sm text-gray-500 mt-1">Overall occupancy rate</p>
          </div>

          <div className="space-y-4" role="list" aria-label="Ward occupancy breakdown">
            {wards.slice(0, 4).map((ward) => {
              const occupied = ward.total_beds - ward.available_beds;
              const pct = ward.total_beds > 0 ? Math.round((occupied / ward.total_beds) * 100) : 0;
              const barColor = WARD_TYPE_COLORS[ward.ward_type] ?? 'bg-gray-500';

              return (
                <div
                  key={ward.id}
                  role="listitem"
                  className="flex items-center gap-3 group"
                  aria-label={`${ward.name}: ${pct}% occupied, ${occupied} of ${ward.total_beds} beds`}
                >
                  <div
                    aria-hidden="true"
                    className={`w-1.5 h-10 rounded-full ${barColor} group-hover:w-2 transition-all`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700 truncate">{ward.name}</span>
                      <span className="text-sm font-semibold text-gray-900 ml-2">{pct}%</span>
                    </div>
                    <div
                      className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${ward.name} occupancy`}
                    >
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">{occupied} occupied</span>
                      <span className="text-xs text-gray-400">{ward.available_beds} available</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
