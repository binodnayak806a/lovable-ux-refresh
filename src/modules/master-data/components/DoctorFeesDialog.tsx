import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
  IndianRupee, Plus, Trash2, Edit2, Save, X, Clock, Calendar,
  Stethoscope, Video, Home, Activity, Scissors,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  doctorsService,
  Doctor,
  DoctorFee,
  DoctorFeeFormData,
  DoctorSchedule,
  DoctorScheduleFormData,
  FEE_TYPE_LABELS,
  DAY_LABELS,
} from '../../../services/doctors.service';

interface DoctorFeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: Doctor;
  onUpdate: () => void;
}

const FEE_TYPE_ICONS: Record<DoctorFee['fee_type'], React.ElementType> = {
  consultation: Stethoscope,
  follow_up: Calendar,
  emergency: Activity,
  video_consultation: Video,
  home_visit: Home,
  procedure: Scissors,
};

const FEE_TYPE_COLORS: Record<DoctorFee['fee_type'], string> = {
  consultation: 'bg-teal-50 text-teal-700 border-teal-200',
  follow_up: 'bg-blue-50 text-blue-700 border-blue-200',
  emergency: 'bg-red-50 text-red-700 border-red-200',
  video_consultation: 'bg-purple-50 text-purple-700 border-purple-200',
  home_visit: 'bg-amber-50 text-amber-700 border-amber-200',
  procedure: 'bg-orange-50 text-orange-700 border-orange-200',
};

const emptyFeeForm: DoctorFeeFormData = {
  fee_type: 'consultation',
  amount: 0,
  validity_days: 0,
  description: '',
  is_active: true,
};

const emptyScheduleForm: DoctorScheduleFormData = {
  day_of_week: 1,
  start_time: '09:00',
  end_time: '17:00',
  slot_duration_minutes: 15,
  max_patients: 20,
  is_active: true,
};

export default function DoctorFeesDialog({ open, onOpenChange, doctor, onUpdate }: DoctorFeesDialogProps) {
  const [fees, setFees] = useState<DoctorFee[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [activeTab, setActiveTab] = useState('fees');

  const [showFeeForm, setShowFeeForm] = useState(false);
  const [editingFee, setEditingFee] = useState<DoctorFee | null>(null);
  const [feeForm, setFeeForm] = useState<DoctorFeeFormData>(emptyFeeForm);

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DoctorSchedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState<DoctorScheduleFormData>(emptyScheduleForm);

  const loadData = async () => {
    try {
      const [feesData, schedulesData] = await Promise.all([
        doctorsService.getDoctorFees(doctor.id),
        doctorsService.getDoctorSchedules(doctor.id),
      ]);
      setFees(feesData);
      setSchedules(schedulesData);
    } catch {
      toast.error('Failed to load data');
    }
  };

  useEffect(() => {
    if (open && doctor) {
      loadData();
    }
  }, [open, doctor]);

  const handleSaveFee = async () => {
    try {
      if (editingFee) {
        await doctorsService.updateDoctorFee(editingFee.id, feeForm);
        toast.success('Fee updated');
      } else {
        await doctorsService.addDoctorFee(doctor.id, feeForm);
        toast.success('Fee added');
      }
      setShowFeeForm(false);
      setEditingFee(null);
      setFeeForm(emptyFeeForm);
      loadData();
      onUpdate();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save fee';
      toast.error(msg);
    }
  };

  const handleDeleteFee = async (fee: DoctorFee) => {
    try {
      await doctorsService.deleteDoctorFee(fee.id);
      toast.success('Fee deleted');
      loadData();
      onUpdate();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete fee';
      toast.error(msg);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      if (editingSchedule) {
        await doctorsService.updateDoctorSchedule(editingSchedule.id, scheduleForm);
        toast.success('Schedule updated');
      } else {
        await doctorsService.addDoctorSchedule(doctor.id, scheduleForm);
        toast.success('Schedule added');
      }
      setShowScheduleForm(false);
      setEditingSchedule(null);
      setScheduleForm(emptyScheduleForm);
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save schedule';
      toast.error(msg);
    }
  };

  const handleDeleteSchedule = async (schedule: DoctorSchedule) => {
    try {
      await doctorsService.deleteDoctorSchedule(schedule.id);
      toast.success('Schedule deleted');
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete schedule';
      toast.error(msg);
    }
  };

  const openEditFee = (fee: DoctorFee) => {
    setEditingFee(fee);
    setFeeForm({
      fee_type: fee.fee_type,
      amount: fee.amount,
      validity_days: fee.validity_days,
      description: fee.description || '',
      is_active: fee.is_active,
    });
    setShowFeeForm(true);
  };

  const openEditSchedule = (schedule: DoctorSchedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      slot_duration_minutes: schedule.slot_duration_minutes,
      max_patients: schedule.max_patients,
      is_active: schedule.is_active,
    });
    setShowScheduleForm(true);
  };

  const existingFeeTypes = fees.map(f => f.fee_type);
  const availableFeeTypes = (Object.keys(FEE_TYPE_LABELS) as DoctorFee['fee_type'][])
    .filter(type => !existingFeeTypes.includes(type) || (editingFee && editingFee.fee_type === type));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
              {doctor.first_name[0]}{doctor.last_name?.[0] || ''}
            </div>
            <div>
              <p className="text-base font-semibold">Dr. {doctor.first_name} {doctor.last_name}</p>
              <p className="text-xs text-gray-500 font-normal">{doctor.specialty}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fees" className="gap-1.5">
              <IndianRupee className="h-3.5 w-3.5" />
              Fees ({fees.length})
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Schedule ({schedules.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fees" className="space-y-4 mt-4">
            {showFeeForm ? (
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">
                    {editingFee ? 'Edit Fee' : 'Add New Fee'}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => { setShowFeeForm(false); setEditingFee(null); setFeeForm(emptyFeeForm); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fee Type</Label>
                    <Select
                      value={feeForm.fee_type}
                      onValueChange={(v) => setFeeForm(prev => ({ ...prev, fee_type: v as DoctorFee['fee_type'] }))}
                      disabled={!!editingFee}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFeeTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {FEE_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Amount (INR)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        min="0"
                        value={feeForm.amount}
                        onChange={(e) => setFeeForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                {feeForm.fee_type === 'follow_up' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Validity Period (Days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={feeForm.validity_days}
                      onChange={(e) => setFeeForm(prev => ({ ...prev, validity_days: parseInt(e.target.value) || 0 }))}
                      placeholder="e.g., 7 for 7 days validity"
                    />
                    <p className="text-xs text-gray-500">Follow-up is valid within this many days of consultation</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">Description (Optional)</Label>
                  <Input
                    value={feeForm.description}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={feeForm.is_active}
                      onCheckedChange={(checked) => setFeeForm(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label className="text-xs">Active</Label>
                  </div>
                  <Button size="sm" onClick={handleSaveFee} disabled={feeForm.amount <= 0}>
                    <Save className="h-4 w-4 mr-1.5" />
                    {editingFee ? 'Update' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFeeForm(true)}
                disabled={availableFeeTypes.length === 0}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Fee Type
              </Button>
            )}

            <div className="space-y-2">
              {fees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <IndianRupee className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No fees configured yet</p>
                  <p className="text-xs">Add consultation and other fees for this doctor</p>
                </div>
              ) : (
                fees.map(fee => {
                  const Icon = FEE_TYPE_ICONS[fee.fee_type];
                  return (
                    <div
                      key={fee.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        fee.is_active ? 'bg-white' : 'bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${FEE_TYPE_COLORS[fee.fee_type]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{FEE_TYPE_LABELS[fee.fee_type]}</p>
                            {!fee.is_active && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inactive</Badge>
                            )}
                          </div>
                          {fee.description && (
                            <p className="text-xs text-gray-500">{fee.description}</p>
                          )}
                          {fee.fee_type === 'follow_up' && fee.validity_days > 0 && (
                            <p className="text-xs text-blue-600">Valid within {fee.validity_days} days</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 flex items-center">
                            <IndianRupee className="h-4 w-4" />
                            {fee.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditFee(fee)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteFee(fee)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            {showScheduleForm ? (
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">
                    {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => { setShowScheduleForm(false); setEditingSchedule(null); setScheduleForm(emptyScheduleForm); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Day of Week</Label>
                    <Select
                      value={scheduleForm.day_of_week.toString()}
                      onValueChange={(v) => setScheduleForm(prev => ({ ...prev, day_of_week: parseInt(v) }))}
                      disabled={!!editingSchedule}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_LABELS.map((day, i) => (
                          <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Slot Duration (Minutes)</Label>
                    <Select
                      value={scheduleForm.slot_duration_minutes.toString()}
                      onValueChange={(v) => setScheduleForm(prev => ({ ...prev, slot_duration_minutes: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 min</SelectItem>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="20">20 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Start Time</Label>
                    <Input
                      type="time"
                      value={scheduleForm.start_time}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">End Time</Label>
                    <Input
                      type="time"
                      value={scheduleForm.end_time}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Max Patients</Label>
                  <Input
                    type="number"
                    min="1"
                    value={scheduleForm.max_patients}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, max_patients: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={scheduleForm.is_active}
                      onCheckedChange={(checked) => setScheduleForm(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label className="text-xs">Active</Label>
                  </div>
                  <Button size="sm" onClick={handleSaveSchedule}>
                    <Save className="h-4 w-4 mr-1.5" />
                    {editingSchedule ? 'Update' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScheduleForm(true)}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Schedule
              </Button>
            )}

            <div className="space-y-2">
              {schedules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No schedules configured yet</p>
                  <p className="text-xs">Add OPD timings for this doctor</p>
                </div>
              ) : (
                schedules.map(schedule => (
                  <div
                    key={schedule.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      schedule.is_active ? 'bg-white' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{DAY_LABELS[schedule.day_of_week]}</p>
                          {!schedule.is_active && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {schedule.start_time} - {schedule.end_time} | {schedule.slot_duration_minutes} min slots
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{schedule.max_patients}</p>
                        <p className="text-xs text-gray-500">max patients</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEditSchedule(schedule)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteSchedule(schedule)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
