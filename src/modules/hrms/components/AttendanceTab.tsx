import { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, MinusCircle } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import type { Staff, Attendance } from '../types';

interface AttendanceTabProps {
  staff: Staff[];
  attendance: Attendance[];
  onRefresh: () => void;
}

const STATUS_CONFIG = {
  present: { label: 'Present', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  absent: { label: 'Absent', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
  half_day: { label: 'Half Day', icon: MinusCircle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  leave: { label: 'On Leave', icon: Clock, color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export default function AttendanceTab({ staff, attendance, onRefresh }: AttendanceTabProps) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState<string | null>(null);

  const dateAttendance = attendance.filter(a => a.date === selectedDate);
  const getAttendance = (staffId: string) => dateAttendance.find(a => a.staff_id === staffId);

  const markAttendance = async (staffId: string, status: Attendance['status']) => {
    setLoading(staffId);
    try {
      const now = format(new Date(), 'HH:mm:ss');
      const { error } = await supabase.from('attendance').upsert({
        staff_id: staffId,
        date: selectedDate,
        check_in: status === 'present' || status === 'half_day' ? now : null,
        status,
      } as never);
      if (error) throw error;
      toast.success('Attendance updated');
      onRefresh();
    } catch {
      toast.error('Failed to update attendance');
    } finally {
      setLoading(null);
    }
  };

  const presentCount = dateAttendance.filter(a => a.status === 'present').length;
  const absentCount = dateAttendance.filter(a => a.status === 'absent').length;
  const notMarked = staff.filter(s => !getAttendance(s.id) && s.status === 'active').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Date</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-44 mt-1"
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="text-center px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-2xl font-bold text-emerald-700">{presentCount}</div>
            <div className="text-xs text-emerald-600">Present</div>
          </div>
          <div className="text-center px-4 py-2 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-700">{absentCount}</div>
            <div className="text-xs text-red-600">Absent</div>
          </div>
          <div className="text-center px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-2xl font-bold text-slate-700">{notMarked}</div>
            <div className="text-xs text-slate-600">Unmarked</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Employee</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.filter(s => s.status === 'active').map(s => {
              const rec = getAttendance(s.id);
              const cfg = rec ? STATUS_CONFIG[rec.status] : null;
              return (
                <TableRow key={s.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="font-medium">{s.first_name} {s.last_name}</div>
                    <div className="text-xs text-muted-foreground">{s.employee_id}</div>
                  </TableCell>
                  <TableCell className="text-sm">{s.designation || '—'}</TableCell>
                  <TableCell className="text-sm">{s.department || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{rec?.check_in || '—'}</TableCell>
                  <TableCell>
                    {cfg ? (
                      <Badge variant="outline" className={`${cfg.color} text-xs`}>
                        <cfg.icon className="h-3 w-3 mr-1" />
                        {cfg.label}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">Not Marked</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!rec ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          disabled={loading === s.id}
                          onClick={() => markAttendance(s.id, 'present')}
                        >
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                          disabled={loading === s.id}
                          onClick={() => markAttendance(s.id, 'half_day')}
                        >
                          Half
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-red-700 border-red-300 hover:bg-red-50"
                          disabled={loading === s.id}
                          onClick={() => markAttendance(s.id, 'absent')}
                        >
                          Absent
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-muted-foreground"
                        onClick={() => markAttendance(s.id, rec.status)}
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
