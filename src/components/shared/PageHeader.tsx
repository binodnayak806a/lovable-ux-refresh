import React, { useState } from 'react';
import { HelpCircle, X, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  iconClassName?: string;
  actions?: React.ReactNode;
  className?: string;
  helpItems?: string[];
}

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconClassName,
  actions,
  className,
  helpItems,
}: PageHeaderProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className={cn('animate-fade-in', className)}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">{title}</h1>
              {helpItems && helpItems.length > 0 && (
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="What can I do here?"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              )}
            </div>
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

      {/* Contextual help panel */}
      {showHelp && helpItems && (
        <div className="mt-3 bg-primary/5 border border-primary/10 rounded-xl px-4 py-3 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Lightbulb className="w-4 h-4 text-primary" />
              What can you do here?
            </div>
            <button onClick={() => setShowHelp(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {helpItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
