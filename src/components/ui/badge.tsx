import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[#5B7FFF] text-white shadow-sm',
        secondary:
          'border-transparent bg-slate-100 text-slate-700',
        destructive:
          'border-transparent bg-red-500 text-white shadow-sm',
        outline: 'text-slate-700 border-slate-200',
        success:
          'border-transparent bg-emerald-100 text-emerald-700',
        warning:
          'border-transparent bg-amber-100 text-amber-700',
        info:
          'border-transparent bg-blue-100 text-blue-700',
        error:
          'border-transparent bg-red-100 text-red-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
