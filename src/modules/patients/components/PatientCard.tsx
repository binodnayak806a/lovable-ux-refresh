import {
  Hash, Phone, Calendar, User, Printer, History,
  Stethoscope, BedDouble, Receipt, Activity,
  Droplets, ChevronRight, CalendarCheck,
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip';
import { cn } from '../../../lib/utils';

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
  male: 'text-primary bg-primary/10',
  female: 'text-rose-600 bg-rose-50',
  other: 'text-muted-foreground bg-muted',
};

const TYPE_COLORS: Record<string, string> = {
  'walk-in': 'bg-muted text-muted-foreground',
  scheduled: 'bg-primary/10 text-primary',
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
      className={cn(
        'group relative bg-card border rounded-2xl p-4 cursor-pointer transition-all duration-300',
        'hover:shadow-hover',
        isSelected
          ? 'border-primary shadow-hover animate-pulse-glow'
          : 'border-border/50 hover:border-primary/30',
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-300',
          isSelected
            ? 'bg-gradient-to-br from-primary to-primary-dark text-primary-foreground shadow-sm'
            : 'bg-primary/10 text-primary group-hover:bg-primary/15',
        )}>
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className={cn(
              'text-sm font-semibold truncate transition-colors',
              isSelected ? 'text-primary' : 'text-foreground',
            )}>
              {p.full_name}
            </h3>
            {p.registration_type && (
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize', typeStyle)}>
                {p.registration_type}
              </span>
            )}
            {!p.is_active && (
              <Badge variant="secondary" className="text-[10px] bg-destructive/10 text-destructive">Inactive</Badge>
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
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                {p.age}y
              </span>
            )}
            {p.gender && (
              <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 border-0 capitalize rounded-full', genderStyle)}>
                <User className="w-2.5 h-2.5 mr-0.5" />
                {p.gender}
              </Badge>
            )}
            {p.blood_group && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 border-0 bg-red-50 text-red-600 rounded-full">
                <Droplets className="w-2.5 h-2.5 mr-0.5" />
                {p.blood_group}
              </Badge>
            )}
          </div>
        </div>

        <ChevronRight className={cn(
          'w-4 h-4 mt-1 shrink-0 transition-all duration-300',
          isSelected ? 'text-primary translate-x-0.5' : 'text-muted-foreground/20 group-hover:text-muted-foreground/50',
        )} />
      </div>

      {isSelected && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-primary/15 flex-wrap animate-slide-up">
          {onBookAppointment && (
            <ActionButton icon={CalendarCheck} label="Book Appt" tooltip="Book Appointment" color="text-primary hover:bg-primary/10" onClick={onBookAppointment} />
          )}
          <ActionButton icon={Stethoscope} label="Consult" tooltip="Start Consultation" color="text-teal-700 hover:bg-teal-50" onClick={onConsult} />
          <ActionButton icon={Receipt} label="Bill" tooltip="Generate Bill" color="text-emerald-700 hover:bg-emerald-50" onClick={onBill} />
          <ActionButton icon={BedDouble} label="Admit" tooltip="Admit to IPD" color="text-amber-700 hover:bg-amber-50" onClick={onAdmit} />
          <div className="flex-1" />
          <ActionButton icon={History} label="History" tooltip="View Patient History" color="text-primary hover:bg-primary/10" onClick={onViewHistory} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted" onClick={(e) => { e.stopPropagation(); onPrintSticker(); }}>
                <Printer className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Print Sticker</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted" onClick={(e) => { e.stopPropagation(); onViewHistory(); }}>
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

function ActionButton({ icon: Icon, label, tooltip, color, onClick }: {
  icon: React.ElementType; label: string; tooltip: string; color: string; onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className={cn('h-7 px-2 text-xs gap-1 transition-all', color)}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <Icon className="w-3 h-3" />{label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
