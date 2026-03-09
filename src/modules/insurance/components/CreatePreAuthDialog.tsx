import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import insuranceService from '../../../services/insurance.service';
import type { InsuranceProvider } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hospitalId: string;
  userId: string;
  providers: InsuranceProvider[];
}

export default function CreatePreAuthDialog({ open, onClose, onSuccess, hospitalId, userId, providers }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patient_name: '',
    patient_id: '',
    provider_id: '',
    policy_number: '',
    member_id: '',
    requested_amount: '',
    planned_procedure: '',
    diagnosis: '',
    expected_los_days: '',
    admission_date: '',
    remarks: '',
  });

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.patient_name.trim()) { toast.error('Patient name is required'); return; }
    if (!form.requested_amount || Number(form.requested_amount) <= 0) { toast.error('Valid amount is required'); return; }
    if (!form.provider_id) { toast.error('Select an insurance provider'); return; }

    setSaving(true);
    try {
      const provider = providers.find(p => p.id === form.provider_id);
      await insuranceService.createPreAuth({
        hospital_id: hospitalId,
        patient_id: form.patient_id || '00000000-0000-0000-0000-000000000000',
        patient_name: form.patient_name.trim(),
        provider_id: form.provider_id,
        provider_name: provider?.name ?? '',
        policy_number: form.policy_number,
        member_id: form.member_id,
        requested_amount: Number(form.requested_amount),
        planned_procedure: form.planned_procedure,
        diagnosis: form.diagnosis,
        expected_los_days: form.expected_los_days ? Number(form.expected_los_days) : null,
        admission_date: form.admission_date || null,
        remarks: form.remarks,
        created_by: userId,
      });
      toast.success('Pre-authorization request created');
      onSuccess();
      onClose();
      setForm({
        patient_name: '', patient_id: '', provider_id: '', policy_number: '',
        member_id: '', requested_amount: '', planned_procedure: '', diagnosis: '',
        expected_los_days: '', admission_date: '', remarks: '',
      });
    } catch {
      toast.error('Failed to create pre-authorization');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Pre-Authorization Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Patient Name *</Label>
            <Input value={form.patient_name} onChange={e => set('patient_name', e.target.value)} placeholder="Full name" className="h-9 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Insurance Provider *</Label>
            <Select value={form.provider_id} onValueChange={v => set('provider_id', v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select provider" /></SelectTrigger>
              <SelectContent>
                {providers.filter(p => p.is_active).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Policy Number</Label>
              <Input value={form.policy_number} onChange={e => set('policy_number', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Member ID</Label>
              <Input value={form.member_id} onChange={e => set('member_id', e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Requested Amount (₹) *</Label>
              <Input type="number" value={form.requested_amount} onChange={e => set('requested_amount', e.target.value)} className="h-9 text-sm" min={0} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Expected Stay (days)</Label>
              <Input type="number" value={form.expected_los_days} onChange={e => set('expected_los_days', e.target.value)} className="h-9 text-sm" min={1} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Planned Procedure</Label>
            <Input value={form.planned_procedure} onChange={e => set('planned_procedure', e.target.value)} className="h-9 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Diagnosis</Label>
            <Input value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} className="h-9 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Admission Date</Label>
            <Input type="date" value={form.admission_date} onChange={e => set('admission_date', e.target.value)} className="h-9 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Remarks</Label>
            <Textarea value={form.remarks} onChange={e => set('remarks', e.target.value)} rows={2} className="text-sm" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
