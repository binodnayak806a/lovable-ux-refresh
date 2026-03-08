import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  iconClassName?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconClassName,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 animate-fade-in', className)}>
      <div className="flex items-center gap-3.5">
        {Icon && (
          <div className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
            'bg-primary/10 text-primary backdrop-blur-sm',
            'shadow-sm border border-primary/10',
            iconClassName,
          )}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
