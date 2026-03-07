import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  iconClassName?: string;
  className?: string;
}

export default function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('border shadow-card hover:shadow-hover transition-all', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {Icon && (
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconClassName || 'bg-primary/10 text-primary')}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
