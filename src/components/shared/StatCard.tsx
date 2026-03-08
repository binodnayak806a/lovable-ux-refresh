import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  iconClassName?: string;
  accentColor?: 'blue' | 'green' | 'amber' | 'rose' | 'teal' | 'violet';
  className?: string;
}

const ACCENT_CLASSES: Record<string, string> = {
  blue: 'accent-border-blue',
  green: 'accent-border-green',
  amber: 'accent-border-amber',
  rose: 'accent-border-rose',
  teal: 'accent-border-teal',
  violet: 'accent-border-violet',
};

export default function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  accentColor,
  className,
}: StatCardProps) {
  return (
    <Card className={cn(
      'border border-border/50 shadow-card hover:shadow-hover transition-all duration-300 overflow-hidden',
      accentColor && ACCENT_CLASSES[accentColor],
      className,
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
          {Icon && (
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
              iconClassName || 'bg-primary/10 text-primary',
            )}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        <p className="metric-value text-2xl">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
