import { UserPlus, CalendarPlus, BedDouble, Receipt, TestTube, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils';

const ACTIONS = [
  { label: 'New Patient', icon: UserPlus, path: '/opd', bg: 'bg-blue-50 hover:bg-blue-100', text: 'text-blue-700', border: 'border-blue-200/60' },
  { label: 'New Appointment', icon: CalendarPlus, path: '/appointments', bg: 'bg-emerald-50 hover:bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200/60' },
  { label: 'Admit Patient', icon: BedDouble, path: '/ipd', bg: 'bg-amber-50 hover:bg-amber-100', text: 'text-amber-700', border: 'border-amber-200/60' },
  { label: 'Create Bill', icon: Receipt, path: '/billing', bg: 'bg-violet-50 hover:bg-violet-100', text: 'text-violet-700', border: 'border-violet-200/60' },
  { label: 'Add Lab Test', icon: TestTube, path: '/lab', bg: 'bg-rose-50 hover:bg-rose-100', text: 'text-rose-700', border: 'border-rose-200/60' },
];

export default function QuickActionButtons() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200',
              'hover:scale-[1.02] hover:shadow-sm group',
              action.bg, action.border
            )}
          >
            <Icon className={cn('w-4 h-4', action.text)} />
            <span className={cn('text-sm font-medium', action.text)}>{action.label}</span>
            <ArrowRight className={cn('w-3.5 h-3.5 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all', action.text)} />
          </button>
        );
      })}
    </div>
  );
}
