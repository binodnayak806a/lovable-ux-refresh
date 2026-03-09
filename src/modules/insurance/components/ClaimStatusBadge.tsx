import {
  Clock, Send, Eye, HelpCircle, CheckCircle, AlertTriangle,
  XCircle, Banknote, Archive,
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';
import type { ClaimStatus, PreAuthStatus } from '../types';

const CLAIM_STATUS_CONFIG: Record<ClaimStatus, { label: string; icon: React.ElementType; className: string }> = {
  draft: { label: 'Draft', icon: Clock, className: 'bg-muted text-muted-foreground' },
  submitted: { label: 'Submitted', icon: Send, className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  under_review: { label: 'Under Review', icon: Eye, className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  query_raised: { label: 'Query Raised', icon: HelpCircle, className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
  approved: { label: 'Approved', icon: CheckCircle, className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  partially_approved: { label: 'Partial', icon: AlertTriangle, className: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  settled: { label: 'Settled', icon: Banknote, className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  closed: { label: 'Closed', icon: Archive, className: 'bg-muted text-muted-foreground' },
};

const PREAUTH_STATUS_CONFIG: Record<PreAuthStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  approved: { label: 'Approved', icon: CheckCircle, className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  partially_approved: { label: 'Partial', icon: AlertTriangle, className: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  expired: { label: 'Expired', icon: Clock, className: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-muted text-muted-foreground' },
};

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const config = CLAIM_STATUS_CONFIG[status] ?? CLAIM_STATUS_CONFIG.draft;
  const Icon = config.icon;
  return (
    <Badge variant="secondary" className={cn('gap-1 text-[10px] font-semibold', config.className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

export function PreAuthStatusBadge({ status }: { status: PreAuthStatus }) {
  const config = PREAUTH_STATUS_CONFIG[status] ?? PREAUTH_STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <Badge variant="secondary" className={cn('gap-1 text-[10px] font-semibold', config.className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
