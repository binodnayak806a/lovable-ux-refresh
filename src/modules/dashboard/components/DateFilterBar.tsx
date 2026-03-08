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
    <div className="flex items-center justify-between gap-4 p-4 bg-card rounded-xl border border-border/50 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Filter:</span>
        
        {/* Preset Dropdown */}
        <Select value={preset} onValueChange={(v) => handlePresetChange(v as DatePreset)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => navigateDay('back')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[200px] h-9 justify-start text-left font-normal",
                !customDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {preset === 'custom' 
                ? format(customDate, "dd MMM yyyy")
                : `${format(dateRange.from, "dd MMM")} - ${format(dateRange.to, "dd MMM yyyy")}`
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={customDate}
              onSelect={handleDateSelect}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => navigateDay('forward')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
