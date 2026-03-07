import { User, Clock, Wrench, Sparkles, Calendar } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import type { Bed } from '../types';
import { BED_STATUS_CONFIG } from '../types';

interface Props {
  bed: Bed;
  onClick: () => void;
}

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
      className={`
        relative w-full p-3 rounded-xl border-2 transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5 text-left
        ${statusConfig.bgColor}
      `}
      style={{ borderColor: statusConfig.color }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-bold text-gray-800">{bed.bed_number}</span>
        <Badge
          className="text-[10px] px-1.5 py-0.5 font-semibold"
          style={{
            backgroundColor: statusConfig.color,
            color: 'white',
          }}
        >
          {statusConfig.label}
        </Badge>
      </div>

      <div className="text-xs text-gray-500 mb-2 capitalize">{bed.bed_type}</div>

      {bed.status === 'occupied' && bed.current_admission && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
            <User className="w-3 h-3" />
            <span className="truncate">{bed.current_admission.patient_name}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
            <Clock className="w-3 h-3" />
            <span>{bed.current_admission.days_admitted} days</span>
          </div>
        </div>
      )}

      {bed.status === 'available' && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <Calendar className="w-3 h-3" />
            <span>Ready for admission</span>
          </div>
        </div>
      )}

      {(bed.status === 'maintenance' || bed.status === 'cleaning') && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {getStatusIcon()}
            <span>
              {bed.status === 'maintenance' ? 'Under repair' : 'Being cleaned'}
            </span>
          </div>
        </div>
      )}

      <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 font-mono">
        Rs.{bed.daily_rate}/day
      </div>
    </button>
  );
}
