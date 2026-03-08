import { Button } from '../../../components/ui/button';

interface Props {
  advice: string;
  onAdviceChange: (v: string) => void;
}

const QUICK_ADVICE = [
  'Rest for 2-3 days',
  'Plenty of fluids',
  'Avoid oily/spicy food',
  'Light diet',
  'Take medications as prescribed',
  'Report immediately if condition worsens',
  'Follow-up after completing course',
  'Regular BP monitoring',
  'Blood sugar monitoring',
  'Avoid heavy lifting',
];

export default function AdviceEditor({ advice, onAdviceChange }: Props) {
  const addQuick = (text: string) => {
    onAdviceChange(advice ? `${advice}\n• ${text}` : `• ${text}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Advice / Instructions</label>
        <textarea
          value={advice}
          onChange={e => onAdviceChange(e.target.value)}
          placeholder="General advice, precautions, dietary instructions..."
          rows={8}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Quick Add</label>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ADVICE.map(a => (
            <Button key={a} variant="outline" size="sm" className="h-7 text-xs" onClick={() => addQuick(a)}>
              + {a}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
