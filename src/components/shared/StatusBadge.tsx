import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const VARIANT_STYLES: Record<StatusVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
};

interface StatusBadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
}

export default function StatusBadge({ variant, children, icon: Icon, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
      VARIANT_STYLES[variant],
      className,
    )}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}
