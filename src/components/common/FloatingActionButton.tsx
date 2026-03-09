import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus, CalendarPlus, BedDouble, Receipt, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTIONS = [
  { label: 'New Patient', icon: UserPlus, path: '/add-patient', color: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200 dark:shadow-emerald-900/40' },
  { label: 'Appointment', icon: CalendarPlus, path: '/appointments', color: 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200 dark:shadow-blue-900/40' },
  { label: 'Admit', icon: BedDouble, path: '/ipd', color: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 dark:shadow-amber-900/40' },
  { label: 'Bill', icon: Receipt, path: '/billing', color: 'bg-violet-500 hover:bg-violet-600 text-white shadow-violet-200 dark:shadow-violet-900/40' },
];

export default function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse items-end gap-2">
      {/* Main FAB */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Quick actions"
        className={cn(
          'h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200',
          'bg-primary text-primary-foreground hover:scale-105 active:scale-95',
          open && 'rotate-45'
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>

      {/* Action buttons */}
      {open && (
        <div className="flex flex-col-reverse items-end gap-2 animate-fade-in">
          {ACTIONS.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => { navigate(action.path); setOpen(false); }}
                className={cn(
                  'flex items-center gap-2 pl-4 pr-3 h-11 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95',
                  action.color
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
