import { Button } from '../../../components/ui/button';
import { format, addDays } from 'date-fns';

interface Props {
  followupDate: string;
  onFollowupDateChange: (v: string) => void;
  referredTo: string;
  onReferredToChange: (v: string) => void;
}

const QUICK_DAYS = [3, 5, 7, 10, 14, 21, 30, 60, 90];

export default function FollowUpEditor({ followupDate, onFollowupDateChange, referredTo, onReferredToChange }: Props) {
  const setDaysFromNow = (days: number) => {
    onFollowupDateChange(format(addDays(new Date(), days), 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground block">Follow-up Date</label>
        <input
          type="date"
          value={followupDate}
          onChange={e => onFollowupDateChange(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <div className="flex gap-1.5 flex-wrap">
          {QUICK_DAYS.map(d => (
            <Button key={d} variant="outline" size="sm" className="h-7 text-xs" onClick={() => setDaysFromNow(d)}>
              {d}d
            </Button>
          ))}
        </div>
        {followupDate && (
          <p className="text-sm text-primary font-medium">
            Follow-up: {format(new Date(followupDate), 'dd MMM yyyy (EEEE)')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground block">Referred To (optional)</label>
        <textarea
          value={referredTo}
          onChange={e => onReferredToChange(e.target.value)}
          placeholder="Referred to specialist / department / hospital..."
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
      </div>
    </div>
  );
}
