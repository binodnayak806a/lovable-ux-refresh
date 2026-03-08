import { useState } from 'react';
import { format, subDays, subMonths, subWeeks, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Calendar } from '../../../components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { cn } from '../../../lib/utils';

type DatePreset = 'today' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_quarter' | 'half_year' | 'this_year' | 'custom';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateFilterBarProps {
  onDateChange?: (range: DateRange) => void;
}

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'half_year', label: 'Half Year' },
  { value: 'this_year', label: 'This Year' },
];

function getPresetRange(preset: DatePreset): DateRange {
  const today = new Date();
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'this_week':
      return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
    case 'last_week':
      const lastWeek = subWeeks(today, 1);
      return { from: startOfWeek(lastWeek, { weekStartsOn: 1 }), to: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
    case 'this_month':
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case 'last_month':
      const lastMonth = subMonths(today, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    case 'this_quarter':
      return { from: startOfQuarter(today), to: endOfQuarter(today) };
    case 'half_year':
      return { from: subMonths(today, 6), to: today };
    case 'this_year':
      return { from: startOfYear(today), to: endOfYear(today) };
    default:
      return { from: today, to: today };
  }
}

export default function DateFilterBar({ onDateChange }: DateFilterBarProps) {
  const [preset, setPreset] = useState<DatePreset>('this_month');
  const [dateRange, setDateRange] = useState<DateRange>(getPresetRange('this_month'));
  const [customDate, setCustomDate] = useState<Date>(new Date());

  const handlePresetChange = (value: DatePreset) => {
    setPreset(value);
    if (value !== 'custom') {
      const range = getPresetRange(value);
      setDateRange(range);
      onDateChange?.(range);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCustomDate(date);
      setPreset('custom');
      const range = { from: date, to: date };
      setDateRange(range);
      onDateChange?.(range);
    }
  };

  const navigateDay = (direction: 'back' | 'forward') => {
    const newDate = direction === 'back' 
      ? subDays(customDate, 1) 
      : new Date(customDate.getTime() + 86400000);
    setCustomDate(newDate);
    setPreset('custom');
    const range = { from: newDate, to: newDate };
    setDateRange(range);
    onDateChange?.(range);
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-card rounded-lg border border-border/40">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Filter:</span>
        
        <Select value={preset} onValueChange={(v) => handlePresetChange(v as DatePreset)}>
          <SelectTrigger className="w-[120px] h-8 text-xs border-border/50 bg-background/50">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value} className="text-xs">
                {p.label}
              </SelectItem>
            ))}
            <SelectItem value="custom" className="text-xs">Custom Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => navigateDay('back')}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-7 px-2.5 text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground",
                !customDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {preset === 'custom' 
                ? format(customDate, "dd MMM yyyy")
                : `${format(dateRange.from, "dd MMM")} - ${format(dateRange.to, "dd MMM yyyy")}`
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={customDate}
              onSelect={handleDateSelect}
              initialFocus
              className="p-3"
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => navigateDay('forward')}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
