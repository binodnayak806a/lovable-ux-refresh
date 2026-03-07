import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Stethoscope, User, Building2, Phone, Mail, Award, Calendar, Briefcase, MapPin, Check } from 'lucide-react';
import type { Doctor, DoctorFormData } from '../../../services/doctors.service';
import type { Department } from '../types';

interface DoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: Doctor | null;
  onSave: (data: DoctorFormData) => Promise<void>;
  departments: Department[];
  specialties: string[];
}

const REGISTRATION_COUNCILS = [
  'Medical Council of India',
  'Delhi Medical Council',
  'Maharashtra Medical Council',
  'Karnataka Medical Council',
  'Tamil Nadu Medical Council',
  'Gujarat Medical Council',
  'Uttar Pradesh Medical Council',
  'West Bengal Medical Council',
  'Rajasthan Medical Council',
  'Kerala Medical Council',
  'Other State Medical Council',
];

const QUALIFICATIONS = [
  'MBBS',
  'MD',
  'MS',
  'DM',
  'MCh',
  'DNB',
  'FRCS',
  'MRCP',
  'DCH',
  'DA',
  'DMRD',
  'DGO',
  'DTM&H',
];

const emptyForm: DoctorFormData = {
  first_name: '',
  last_name: '',
  gender: '',
  date_of_birth: '',
  specialty: '',
  sub_specialty: '',
  qualification: '',
  additional_qualifications: [],
  registration_number: '',
  registration_council: '',
  registration_valid_till: '',
  experience_years: 0,
  department_id: '',
  phone: '',
  email: '',
  address: '',
  bio: '',
  is_active: true,
  is_available_for_opd: true,
  is_available_for_ipd: true,
  is_available_for_emergency: false,
};

export default function DoctorDialog({ open, onOpenChange, doctor, onSave, departments, specialties }: DoctorDialogProps) {
  const [form, setForm] = useState<DoctorFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [qualificationInput, setQualificationInput] = useState('');

  useEffect(() => {
    if (open) {
      if (doctor) {
        setForm({
          first_name: doctor.first_name,
          last_name: doctor.last_name || '',
          gender: doctor.gender || '',
          date_of_birth: doctor.date_of_birth || '',
          specialty: doctor.specialty,
          sub_specialty: doctor.sub_specialty || '',
          qualification: doctor.qualification || '',
          additional_qualifications: doctor.additional_qualifications || [],
          registration_number: doctor.registration_number || '',
          registration_council: doctor.registration_council || '',
          registration_valid_till: doctor.registration_valid_till || '',
          experience_years: doctor.experience_years || 0,
          department_id: doctor.department_id || '',
          phone: doctor.phone || '',
          email: doctor.email || '',
          address: doctor.address || '',
          bio: doctor.bio || '',
          is_active: doctor.is_active,
          is_available_for_opd: doctor.is_available_for_opd,
          is_available_for_ipd: doctor.is_available_for_ipd,
          is_available_for_emergency: doctor.is_available_for_emergency,
        });
      } else {
        setForm(emptyForm);
      }
      setActiveTab('basic');
    }
  }, [open, doctor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.specialty) {
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const addQualification = () => {
    if (qualificationInput && !form.additional_qualifications.includes(qualificationInput)) {
      setForm(prev => ({
        ...prev,
        additional_qualifications: [...prev.additional_qualifications, qualificationInput],
      }));
      setQualificationInput('');
    }
  };

  const removeQualification = (qual: string) => {
    setForm(prev => ({
      ...prev,
      additional_qualifications: prev.additional_qualifications.filter(q => q !== qual),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5 text-teal-600" />
            {doctor ? 'Edit Doctor' : 'Add New Doctor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="basic" className="text-xs">Basic Info</TabsTrigger>
              <TabsTrigger value="professional" className="text-xs">Professional</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={form.first_name}
                      onChange={(e) => setForm(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Enter first name"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Last Name</Label>
                  <Input
                    value={form.last_name}
                    onChange={(e) => setForm(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm(prev => ({ ...prev, gender: v as DoctorFormData['gender'] }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={form.date_of_birth}
                      onChange={(e) => setForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    <Phone className="inline-block h-3.5 w-3.5 mr-1" />
                    Phone Number
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    type="tel"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    <Mail className="inline-block h-3.5 w-3.5 mr-1" />
                    Email Address
                  </Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    type="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">
                  <MapPin className="inline-block h-3.5 w-3.5 mr-1" />
                  Address
                </Label>
                <Textarea
                  value={form.address}
                  onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter address"
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="professional" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    Specialty <span className="text-red-500">*</span>
                  </Label>
                  <Select value={form.specialty} onValueChange={(v) => setForm(prev => ({ ...prev, specialty: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map(spec => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Sub-Specialty</Label>
                  <Input
                    value={form.sub_specialty}
                    onChange={(e) => setForm(prev => ({ ...prev, sub_specialty: e.target.value }))}
                    placeholder="e.g., Interventional Cardiology"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    <Building2 className="inline-block h-3.5 w-3.5 mr-1" />
                    Department
                  </Label>
                  <Select value={form.department_id} onValueChange={(v) => setForm(prev => ({ ...prev, department_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.filter(d => d.is_active).map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    <Briefcase className="inline-block h-3.5 w-3.5 mr-1" />
                    Experience (Years)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.experience_years}
                    onChange={(e) => setForm(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                    placeholder="Years of experience"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Primary Qualification</Label>
                <Select value={form.qualification} onValueChange={(v) => setForm(prev => ({ ...prev, qualification: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select qualification" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALIFICATIONS.map(qual => (
                      <SelectItem key={qual} value={qual}>{qual}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Additional Qualifications</Label>
                <div className="flex gap-2">
                  <Input
                    value={qualificationInput}
                    onChange={(e) => setQualificationInput(e.target.value)}
                    placeholder="Add qualification (e.g., MD, DM)"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addQualification}>
                    Add
                  </Button>
                </div>
                {form.additional_qualifications.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.additional_qualifications.map(qual => (
                      <span
                        key={qual}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-md cursor-pointer hover:bg-teal-100"
                        onClick={() => removeQualification(qual)}
                      >
                        {qual}
                        <span className="text-teal-500">x</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    <Award className="inline-block h-3.5 w-3.5 mr-1" />
                    Registration Number
                  </Label>
                  <Input
                    value={form.registration_number}
                    onChange={(e) => setForm(prev => ({ ...prev, registration_number: e.target.value }))}
                    placeholder="Medical Council Reg. No."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Registration Council</Label>
                  <Select value={form.registration_council} onValueChange={(v) => setForm(prev => ({ ...prev, registration_council: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select council" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGISTRATION_COUNCILS.map(council => (
                        <SelectItem key={council} value={council}>{council}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Registration Valid Till</Label>
                <Input
                  type="date"
                  value={form.registration_valid_till}
                  onChange={(e) => setForm(prev => ({ ...prev, registration_valid_till: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Bio / About</Label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Brief professional bio..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700">Status</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Active Status</p>
                    <p className="text-xs text-gray-500">Doctor can receive appointments and consultations</p>
                  </div>
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700">Service Availability</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">OPD Services</p>
                    <p className="text-xs text-gray-500">Available for outpatient consultations</p>
                  </div>
                  <Switch
                    checked={form.is_available_for_opd}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_available_for_opd: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">IPD Services</p>
                    <p className="text-xs text-gray-500">Available for inpatient care and rounds</p>
                  </div>
                  <Switch
                    checked={form.is_available_for_ipd}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_available_for_ipd: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Emergency Services</p>
                    <p className="text-xs text-gray-500">Available for emergency/on-call duties</p>
                  </div>
                  <Switch
                    checked={form.is_available_for_emergency}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_available_for_emergency: checked }))}
                  />
                </div>
              </div>

              {form.is_available_for_opd && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">OPD Schedule</p>
                      <p className="text-xs text-blue-600">
                        After saving the doctor, you can configure their OPD schedule and consultation fees from the doctor list.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.first_name || !form.specialty}>
              {saving ? 'Saving...' : doctor ? 'Update Doctor' : 'Add Doctor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
