import {
  Hash, Phone, Calendar, User, Printer, History,
  Stethoscope, BedDouble, Receipt, Activity,
  Droplets, ChevronRight, CalendarCheck,
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip';

interface PatientCardProps {
  patient: {
    id: string;
    full_name: string;
    uhid: string;
    phone: string;
    age?: number;
    gender?: string;
    blood_group?: string | null;
    registration_type?: string;
    created_at: string;
    is_active: boolean;
  };
  isSelected: boolean;
  onSelect: () => void;
  onViewHistory: () => void;
  onPrintSticker: () => void;
  onConsult: () => void;
  onAdmit: () => void;
  onBill: () => void;
  onBookAppointment?: () => void;
}

const GENDER_COLORS: Record<string, string> = {
  male: 'text-blue-600 bg-blue-50',
  female: 'text-rose-600 bg-rose-50',
  other: 'text-muted-foreground bg-muted',
};

const TYPE_COLORS: Record<string, string> = {
  'walk-in': 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-50 text-blue-600',
  emergency: 'bg-red-50 text-red-600',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function PatientCard({
  patient: p,
  isSelected,
  onSelect,
  onViewHistory,
  onPrintSticker,
  onConsult,
  onAdmit,
  onBill,
  onBookAppointment,
}: PatientCardProps) {
  const initials = p.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  const genderStyle = GENDER_COLORS[p.gender ?? ''] ?? GENDER_COLORS.other;
  const typeStyle = TYPE_COLORS[p.registration_type ?? ''] ?? TYPE_COLORS['walk-in'];

  return (
    <div
      className={`group relative bg-card border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20 shadow-md'
          : 'border-border hover:border-border/80'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
          isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
        }`}>
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
              {p.full_name}
            </h3>
            {p.registration_type && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${typeStyle}`}>
                {p.registration_type}
              </span>
            )}
            {!p.is_active && (
              <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-600">Inactive</Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1 font-mono">
              <Hash className="w-3 h-3" />{p.uhid}
            </span>
            {p.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />{p.phone}
              </span>
            )}
            {p.created_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />{formatDate(p.created_at)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {p.age != null && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-medium">
                {p.age}y
              </span>
            )}
            {p.gender && (
              <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border-0 capitalize ${genderStyle}`}>
                <User className="w-2.5 h-2.5 mr-0.5" />
                {p.gender}
              </Badge>
            )}
            {p.blood_group && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 border-0 bg-red-50 text-red-600">
                <Droplets className="w-2.5 h-2.5 mr-0.5" />
                {p.blood_group}
              </Badge>
            )}
          </div>
        </div>

        <ChevronRight className={`w-4 h-4 mt-1 shrink-0 transition-colors ${
          isSelected ? 'text-primary' : 'text-muted-foreground/30 group-hover:text-muted-foreground'
        }`} />
      </div>

      {isSelected && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-primary/20 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs gap-1 text-teal-700 hover:bg-teal-50"
                onClick={(e) => { e.stopPropagation(); onConsult(); }}
              >
                <Stethoscope className="w-3 h-3" />Consult
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start Consultation</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs gap-1 text-emerald-700 hover:bg-emerald-50"
                onClick={(e) => { e.stopPropagation(); onBill(); }}
              >
                <Receipt className="w-3 h-3" />Bill
              </Button>
            </TooltipTrigger>
            <TooltipContent>Generate Bill</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs gap-1 text-amber-700 hover:bg-amber-50"
                onClick={(e) => { e.stopPropagation(); onAdmit(); }}
              >
                <BedDouble className="w-3 h-3" />Admit
              </Button>
            </TooltipTrigger>
            <TooltipContent>Admit to IPD</TooltipContent>
          </Tooltip>
          <div className="flex-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs gap-1 text-sky-700 hover:bg-sky-50"
                onClick={(e) => { e.stopPropagation(); onViewHistory(); }}
              >
                <History className="w-3 h-3" />History
              </Button>
            </TooltipTrigger>
            <TooltipContent>View Patient History</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted"
                onClick={(e) => { e.stopPropagation(); onPrintSticker(); }}
              >
                <Printer className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Print Sticker</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted"
                onClick={(e) => { e.stopPropagation(); onViewHistory(); }}
              >
                <Activity className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Record Vitals</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
