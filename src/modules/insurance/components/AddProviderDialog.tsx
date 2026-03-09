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

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hospitalId: string;
}

export default function AddProviderDialog({ open, onClose, onSuccess, hospitalId }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    provider_type: 'insurance' as 'insurance' | 'tpa' | 'corporate',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    pan_number: '',
    gst_number: '',
    settlement_period_days: '30',
    discount_percentage: '0',
    notes: '',
  });

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Provider name is required'); return; }

    setSaving(true);
    try {
      await insuranceService.createProvider({
        hospital_id: hospitalId,
        name: form.name.trim(),
        provider_type: form.provider_type,
        contact_person: form.contact_person || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        pan_number: form.pan_number || null,
        gst_number: form.gst_number || null,
        settlement_period_days: Number(form.settlement_period_days) || 30,
        discount_percentage: Number(form.discount_percentage) || 0,
        is_active: true,
        notes: form.notes || null,
      });
      toast.success('Provider added');
      onSuccess();
      onClose();
      setForm({
        name: '', provider_type: 'insurance', contact_person: '', phone: '',
        email: '', address: '', pan_number: '', gst_number: '',
        settlement_period_days: '30', discount_percentage: '0', notes: '',
      });
    } catch {
      toast.error('Failed to add provider');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Insurance Provider</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Provider Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} className="h-9 text-sm" placeholder="HDFC Ergo, Star Health..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={form.provider_type} onValueChange={v => set('provider_type', v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="tpa">TPA</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Contact Person</Label>
              <Input value={form.contact_person} onChange={e => set('contact_person', e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Settlement Period (days)</Label>
              <Input type="number" value={form.settlement_period_days} onChange={e => set('settlement_period_days', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Discount %</Label>
              <Input type="number" value={form.discount_percentage} onChange={e => set('discount_percentage', e.target.value)} className="h-9 text-sm" min={0} max={100} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="text-sm" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Add Provider'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
