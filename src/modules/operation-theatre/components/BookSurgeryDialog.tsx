import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { SurgeryBooking, SurgeryPriority, TeamMember, PreOpItem } from '../types';
import { DEFAULT_PREOP_CHECKLIST, MOCK_OTS } from '../types';
import SurgicalTeamPanel from './SurgicalTeamPanel';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (booking: SurgeryBooking) => void;
}

export default function BookSurgeryDialog({ open, onOpenChange, onSubmit }: Props) {
  const [patientName, setPatientName] = useState('');
  const [surgeryName, setSurgeryName] = useState('');
  const [otId, setOtId] = useState(MOCK_OTS[0].id);
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [priority, setPriority] = useState<SurgeryPriority>('elective');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [team, setTeam] = useState<TeamMember[]>([]);

  const handleSubmit = () => {
    const ot = MOCK_OTS.find((o) => o.id === otId)!;
    const checklist: PreOpItem[] = DEFAULT_PREOP_CHECKLIST.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
    }));

    const booking: SurgeryBooking = {
      id: crypto.randomUUID(),
      hospital_id: '',
      patient_id: crypto.randomUUID(),
      patient_name: patientName,
      ot_id: otId,
      ot_name: ot.name,
      surgery_name: surgeryName,
      surgery_date: format(date, 'yyyy-MM-dd'),
      start_time: startTime,
      end_time: endTime,
      status: 'scheduled',
      priority,
      diagnosis,
      notes: notes || null,
      pre_op_checklist: checklist,
      team,
      created_at: new Date().toISOString(),
    };

    onSubmit(booking);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setPatientName('');
    setSurgeryName('');
    setDiagnosis('');
    setNotes('');
    setTeam([]);
    setStartTime('09:00');
    setEndTime('11:00');
    setPriority('elective');
  };

  const availableOTs = MOCK_OTS.filter((ot) => ot.is_active && ot.status !== 'maintenance');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Surgery</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Patient Name *</Label>
            <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Enter patient name" />
          </div>
          <div className="space-y-2">
            <Label>Surgery / Procedure *</Label>
            <Input value={surgeryName} onChange={(e) => setSurgeryName(e.target.value)} placeholder="e.g. Appendectomy" />
          </div>

          <div className="space-y-2">
            <Label>Operation Theatre</Label>
            <Select value={otId} onValueChange={setOtId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableOTs.map((ot) => (
                  <SelectItem key={ot.id} value={ot.id}>{ot.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as SurgeryPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="elective">Elective</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Surgery Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Diagnosis</Label>
            <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Primary diagnosis" />
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special instructions, allergies, etc." rows={2} />
          </div>

          <div className="col-span-2 border-t border-border pt-4">
            <SurgicalTeamPanel team={team} onChange={setTeam} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!patientName.trim() || !surgeryName.trim()}>
            Schedule Surgery
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
