import { User, Clock, Wrench, Sparkles, Calendar } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';
import type { Bed } from '../types';
import { BED_STATUS_CONFIG } from '../types';

interface Props {
  bed: Bed;
  onClick: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  available: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50',
  occupied: 'border-primary/30 bg-primary/5 hover:bg-primary/10',
  maintenance: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50',
  cleaning: 'border-violet-200 bg-violet-50/50 hover:bg-violet-50',
  reserved: 'border-muted bg-muted/50 hover:bg-muted',
};

export default function BedCard({ bed, onClick }: Props) {
  const statusConfig = BED_STATUS_CONFIG[bed.status];

  const getStatusIcon = () => {
    switch (bed.status) {
      case 'occupied':
        return <User className="w-4 h-4" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      case 'cleaning':
        return <Sparkles className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-full p-3 rounded-xl border-2 transition-all duration-300',
        'hover:shadow-hover hover:-translate-y-0.5 text-left group',
        STATUS_STYLES[bed.status] || 'border-border bg-card',
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-bold text-foreground">{bed.bed_number}</span>
        <Badge
          className="text-[10px] px-1.5 py-0.5 font-semibold border-0"
          style={{
            backgroundColor: statusConfig.color,
            color: 'white',
          }}
        >
          {statusConfig.label}
        </Badge>
      </div>

      <div className="text-xs text-muted-foreground mb-2 capitalize">{bed.bed_type}</div>

      {bed.status === 'occupied' && bed.current_admission && (
        <div className="mt-2 pt-2 border-t border-border/30">
          <div className="flex items-center gap-1 text-xs font-medium text-foreground">
            <User className="w-3 h-3" />
            <span className="truncate">{bed.current_admission.patient_name}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
            <Clock className="w-3 h-3" />
            <span>{bed.current_admission.days_admitted} days</span>
          </div>
        </div>
      )}

      {bed.status === 'available' && (
        <div className="mt-2 pt-2 border-t border-border/30">
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <Calendar className="w-3 h-3" />
            <span>Ready for admission</span>
          </div>
        </div>
      )}

      {(bed.status === 'maintenance' || bed.status === 'cleaning') && (
        <div className="mt-2 pt-2 border-t border-border/30">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {getStatusIcon()}
            <span>
              {bed.status === 'maintenance' ? 'Under repair' : 'Being cleaned'}
            </span>
          </div>
        </div>
      )}

      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/50 font-mono">
        ₹{bed.daily_rate}/day
      </div>
    </button>
  );
}
