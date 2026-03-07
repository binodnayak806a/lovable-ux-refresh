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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import type { Staff, StaffFormData } from '../types';

interface StaffDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: StaffFormData) => Promise<void>;
  staff?: Staff | null;
  hospitalId: string;
}

const DESIGNATIONS = [
  'Doctor', 'Nurse', 'Senior Nurse', 'Receptionist', 'Pharmacist',
  'Lab Technician', 'Radiologist', 'Accountant', 'Administrator',
  'Security Guard', 'Housekeeping', 'Driver', 'Other',
];

const DEPARTMENTS = [
  'General Medicine', 'Surgery', 'Pediatrics', 'Gynecology',
  'Orthopedics', 'Cardiology', 'Neurology', 'Radiology',
  'Pathology', 'Pharmacy', 'Administration', 'Finance',
  'Nursing', 'Emergency', 'ICU', 'Other',
];

export default function StaffDialog({ open, onClose, onSave, staff, hospitalId }: StaffDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StaffFormData>({
    hospital_id: hospitalId,
    employee_id: '',
    first_name: '',
    last_name: '',
    email: null,
    phone: null,
    date_of_birth: null,
    gender: null,
    address: null,
    city: null,
    designation: null,
    department: null,
    date_of_joining: new Date().toISOString().split('T')[0],
    employment_type: 'Full-time',
    salary: 0,
    status: 'active',
  });

  useEffect(() => {
    if (staff) {
      setForm({
        hospital_id: staff.hospital_id,
        employee_id: staff.employee_id,
        first_name: staff.first_name,
        last_name: staff.last_name,
        email: staff.email,
        phone: staff.phone,
        date_of_birth: staff.date_of_birth,
        gender: staff.gender,
        address: staff.address,
        city: staff.city,
        designation: staff.designation,
        department: staff.department,
        date_of_joining: staff.date_of_joining,
        employment_type: staff.employment_type,
        salary: staff.salary,
        status: staff.status,
      });
    } else {
      setForm(prev => ({ ...prev, hospital_id: hospitalId }));
    }
  }, [staff, hospitalId]);

  const set = (field: keyof StaffFormData, value: string | number | null) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{staff ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Employee ID *</Label>
              <Input value={form.employee_id} onChange={e => set('employee_id', e.target.value)} required placeholder="EMP001" />
            </div>
            <div className="space-y-1.5">
              <Label>Employment Type</Label>
              <Select value={form.employment_type} onValueChange={v => set('employment_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>First Name *</Label>
              <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input value={form.last_name ?? ''} onChange={e => set('last_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone ?? ''} onChange={e => set('phone', e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth ?? ''} onChange={e => set('date_of_birth', e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender ?? ''} onValueChange={v => set('gender', v)}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Designation</Label>
              <Select value={form.designation ?? ''} onValueChange={v => set('designation', v)}>
                <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                <SelectContent>
                  {DESIGNATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={form.department ?? ''} onValueChange={v => set('department', v)}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date of Joining *</Label>
              <Input type="date" value={form.date_of_joining} onChange={e => set('date_of_joining', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Salary (₹)</Label>
              <Input type="number" value={form.salary} onChange={e => set('salary', parseFloat(e.target.value) || 0)} min={0} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address ?? ''} onChange={e => set('address', e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={form.city ?? ''} onChange={e => set('city', e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="resigned">Resigned</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save Staff'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
