import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { PreOpItem } from '../types';

interface Props {
  items: PreOpItem[];
  onToggle: (itemId: string) => void;
  readOnly?: boolean;
}

export default function PreOpChecklist({ items, onToggle, readOnly }: Props) {
  const completed = items.filter((i) => i.completed).length;
  const percent = items.length ? Math.round((completed / items.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Pre-Op Checklist</h4>
        <span className="text-xs text-muted-foreground">
          {completed}/{items.length} completed
        </span>
      </div>
      <Progress value={percent} className="h-2" />

      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              disabled={readOnly}
              onClick={() => onToggle(item.id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-left',
                item.completed
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                  : 'hover:bg-muted text-foreground',
                readOnly && 'cursor-default'
              )}
            >
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={cn(item.completed && 'line-through opacity-70')}>{item.label}</span>
              {item.completed_at && (
                <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
