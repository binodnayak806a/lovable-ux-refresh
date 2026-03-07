import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import type { UserRole } from '../../../types/database';

interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  designation: string | null;
  phone: string | null;
  is_active: boolean;
  hospital_id: string | null;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
}

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    full_name: string;
    role: UserRole;
    department: string | null;
    designation: string | null;
    phone: string | null;
    is_active: boolean;
  }) => Promise<void>;
  user?: ProfileRow | null;
}

const ROLES: UserRole[] = ['superadmin', 'admin', 'doctor', 'nurse', 'billing', 'pharmacist', 'lab_technician', 'receptionist'];
const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  billing: 'Billing Staff',
  pharmacist: 'Pharmacist',
  lab_technician: 'Lab Technician',
  receptionist: 'Receptionist',
};

export default function UserDialog({ open, onClose, onSave, user }: UserDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    role: 'receptionist' as UserRole,
    department: '',
    designation: '',
    phone: '',
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        role: user.role,
        department: user.department || '',
        designation: user.designation || '',
        phone: user.phone || '',
        is_active: user.is_active,
      });
    }
  }, [user]);

  const set = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        full_name: form.full_name,
        role: form.role,
        department: form.department || null,
        designation: form.designation || null,
        phone: form.phone || null,
        is_active: form.is_active,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={v => set('role', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input value={form.department} onChange={e => set('department', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Designation</Label>
              <Input value={form.designation} onChange={e => set('designation', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="flex items-center justify-between py-2 border-t">
            <div>
              <Label>Active</Label>
              <p className="text-xs text-muted-foreground">User can login and access the system</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}><X className="h-4 w-4 mr-1" />Cancel</Button>
            <Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
