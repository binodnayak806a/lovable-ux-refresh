import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { differenceInDays, parseISO } from 'date-fns';
import type { Staff } from '../types';

interface LeaveRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    staff_id: string;
    leave_type: string;
    from_date: string;
    to_date: string;
    total_days: number;
    reason: string;
  }) => Promise<void>;
  staffList: Staff[];
}

export default function LeaveRequestDialog({ open, onClose, onSave, staffList }: LeaveRequestDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    staff_id: '',
    leave_type: 'Casual Leave',
    from_date: '',
    to_date: '',
    reason: '',
  });

  const totalDays =
    form.from_date && form.to_date
      ? Math.max(1, differenceInDays(parseISO(form.to_date), parseISO(form.from_date)) + 1)
      : 0;

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staff_id || !form.from_date || !form.to_date) return;
    setSaving(true);
    try {
      await onSave({ ...form, total_days: totalDays });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Leave Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Staff Member *</Label>
            <Select value={form.staff_id} onValueChange={v => set('staff_id', v)}>
              <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
              <SelectContent>
                {staffList.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} — {s.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Leave Type</Label>
            <Select value={form.leave_type} onValueChange={v => set('leave_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                <SelectItem value="Earned Leave">Earned Leave</SelectItem>
                <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>From Date *</Label>
              <Input type="date" value={form.from_date} onChange={e => set('from_date', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>To Date *</Label>
              <Input type="date" value={form.to_date} min={form.from_date} onChange={e => set('to_date', e.target.value)} required />
            </div>
          </div>
          {totalDays > 0 && (
            <p className="text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">{totalDays} day{totalDays > 1 ? 's' : ''}</span></p>
          )}
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={3} placeholder="Optional reason..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}><X className="h-4 w-4 mr-1" />Cancel</Button>
            <Button type="submit" disabled={saving || !form.staff_id}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
