import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus, CalendarPlus, BedDouble, Receipt, X, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const ACTIONS = [
  { label: 'New Patient', shortcut: 'Ctrl+N', icon: UserPlus, path: '/add-patient', color: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200 dark:shadow-emerald-900/40' },
  { label: 'Appointment', shortcut: 'Ctrl+⇧+A', icon: CalendarPlus, path: '/appointments', color: 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200 dark:shadow-blue-900/40' },
  { label: 'Admit', shortcut: '', icon: BedDouble, path: '/ipd', color: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 dark:shadow-amber-900/40' },
  { label: 'Bill', shortcut: 'Ctrl+⇧+B', icon: Receipt, path: '/billing', color: 'bg-violet-500 hover:bg-violet-600 text-white shadow-violet-200 dark:shadow-violet-900/40' },
];

export default function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    const timer = setTimeout(() => window.addEventListener('click', handler), 0);
    return () => { clearTimeout(timer); window.removeEventListener('click', handler); };
  }, [open]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse items-end gap-2" onClick={(e) => e.stopPropagation()}>
        {/* Main FAB */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setOpen(!open)}
              aria-label="Quick actions"
              className={cn(
                'h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200',
                'bg-primary text-primary-foreground hover:scale-105 active:scale-95',
                open && 'rotate-45 bg-destructive'
              )}
            >
              {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            {open ? 'Close' : 'Quick actions'}
          </TooltipContent>
        </Tooltip>

        {/* Action buttons */}
        {open && (
          <div className="flex flex-col-reverse items-end gap-2 animate-fade-in">
            {ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <Tooltip key={action.label}>
                  <TooltipTrigger asChild>
                    <button
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
                  </TooltipTrigger>
                  {action.shortcut && (
                    <TooltipContent side="left" className="text-xs">
                      <kbd className="font-mono">{action.shortcut}</kbd>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}

            {/* Keyboard hint */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border shadow-sm text-xs text-muted-foreground">
              <Keyboard className="h-3 w-3" />
              <span>Press <kbd className="font-mono px-1 py-0.5 rounded bg-muted border border-border text-[10px]">?</kbd> for all shortcuts</span>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
