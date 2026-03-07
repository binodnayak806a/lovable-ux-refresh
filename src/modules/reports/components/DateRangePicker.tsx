import type { DateRange } from '../types/report-types';
import { format } from 'date-fns';

const QUICK_RANGES = [
  { label: 'Today', get: (): DateRange => ({ from: new Date(), to: new Date() }) },
  { label: 'Last 7d', get: (): DateRange => { const t = new Date(); const f = new Date(); f.setDate(f.getDate() - 6); return { from: f, to: t }; } },
  { label: 'This Month', get: (): DateRange => { const n = new Date(); return { from: new Date(n.getFullYear(), n.getMonth(), 1), to: n }; } },
  { label: 'Last Month', get: (): DateRange => { const n = new Date(); return { from: new Date(n.getFullYear(), n.getMonth() - 1, 1), to: new Date(n.getFullYear(), n.getMonth(), 0) }; } },
];

interface Props {
  dateRange: DateRange;
  onChange: (r: DateRange) => void;
  compact?: boolean;
}

export default function DateRangePicker({ dateRange, onChange, compact }: Props) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${compact ? '' : 'p-3 border border-gray-200 rounded-xl bg-white'}`}>
      <input
        type="date"
        value={format(dateRange.from, 'yyyy-MM-dd')}
        onChange={e => onChange({ ...dateRange, from: new Date(e.target.value) })}
        className="h-8 px-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
      />
      <span className="text-xs text-gray-400">to</span>
      <input
        type="date"
        value={format(dateRange.to, 'yyyy-MM-dd')}
        onChange={e => onChange({ ...dateRange, to: new Date(e.target.value) })}
        className="h-8 px-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
      />
      <div className="flex gap-1">
        {QUICK_RANGES.map(r => (
          <button
            key={r.label}
            onClick={() => onChange(r.get())}
            className="px-2 py-1 text-[11px] rounded-md bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
