import { useEffect, useState } from 'react';
import { CalendarCheck, Clock, Loader2 } from 'lucide-react';
import { FormField, InputField } from '../components/FormField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import type { RegistrationFormData } from '../types';
import { APPOINTMENT_TYPES } from '../types';
import opdService, { type DepartmentOption, type DoctorOption } from '../../../services/opd.service';

interface Props {
  form: RegistrationFormData;
  errors: Partial<Record<keyof RegistrationFormData, string>>;
  onChange: (field: keyof RegistrationFormData, value: string) => void;
  hospitalId: string;
}

export default function Step5Appointment({ form, errors, onChange, hospitalId }: Props) {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    setLoadingDepts(true);
    opdService.getDepartments(hospitalId)
      .then(setDepartments)
      .catch(() => setDepartments([]))
      .finally(() => setLoadingDepts(false));
  }, [hospitalId]);

  useEffect(() => {
    if (!form.departmentId) { setDoctors([]); return; }
    setLoadingDoctors(true);
    opdService.getDoctors(hospitalId, form.departmentId)
      .then(setDoctors)
      .catch(() => setDoctors([]))
      .finally(() => setLoadingDoctors(false));
  }, [hospitalId, form.departmentId]);

  useEffect(() => {
    if (!form.doctorId || !form.appointmentDate) { setSlots([]); return; }
    setLoadingSlots(true);
    opdService.getAvailableSlots(form.doctorId, form.appointmentDate)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [form.doctorId, form.appointmentDate]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
          <CalendarCheck className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Appointment Details</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Department" required error={errors.departmentId}>
          <Select
            value={form.departmentId}
            onValueChange={(v) => { onChange('departmentId', v); onChange('doctorId', ''); onChange('appointmentTime', ''); }}
          >
            <SelectTrigger className={`h-9 text-sm border-gray-200 ${errors.departmentId ? 'border-red-300' : ''}`}>
              {loadingDepts ? (
                <span className="flex items-center gap-2 text-gray-400"><Loader2 className="w-3 h-3 animate-spin" />Loading…</span>
              ) : (
                <SelectValue placeholder="Select department" />
              )}
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  <span className="font-medium">{d.name}</span>
                  <span className="text-gray-400 ml-1.5 text-xs">({d.code})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Doctor" required error={errors.doctorId}>
          <Select
            value={form.doctorId}
            onValueChange={(v) => { onChange('doctorId', v); onChange('appointmentTime', ''); }}
            disabled={!form.departmentId}
          >
            <SelectTrigger className={`h-9 text-sm border-gray-200 ${errors.doctorId ? 'border-red-300' : ''}`}>
              {loadingDoctors ? (
                <span className="flex items-center gap-2 text-gray-400"><Loader2 className="w-3 h-3 animate-spin" />Loading…</span>
              ) : (
                <SelectValue placeholder={form.departmentId ? 'Select doctor' : 'Select department first'} />
              )}
            </SelectTrigger>
            <SelectContent>
              {doctors.length === 0 && form.departmentId ? (
                <div className="px-3 py-4 text-sm text-gray-400 text-center">No doctors found for this department</div>
              ) : (
                doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    <div>
                      <p className="font-medium">{d.full_name}</p>
                      {d.designation && <p className="text-xs text-gray-400">{d.designation}</p>}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Appointment Date"
          required
          type="date"
          value={form.appointmentDate}
          onChange={(v) => { onChange('appointmentDate', v); onChange('appointmentTime', ''); }}
          error={errors.appointmentDate}
        />

        <FormField label="Appointment Type" required>
          <Select value={form.appointmentType} onValueChange={(v) => onChange('appointmentType', v)}>
            <SelectTrigger className="h-9 text-sm border-gray-200">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {APPOINTMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {form.doctorId && form.appointmentDate && (
        <FormField label="Time Slot" required error={errors.appointmentTime}>
          <div className="mt-1">
            {loadingSlots ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading available slots…
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                No available slots for the selected date. Please choose another date.
              </p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChange('appointmentTime', s)}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                      form.appointmentTime === s
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </FormField>
      )}

      <FormField label="Chief Complaint" required error={errors.chiefComplaint}>
        <Textarea
          placeholder="Describe the main reason for the visit…"
          value={form.chiefComplaint}
          onChange={(e) => onChange('chiefComplaint', e.target.value)}
          rows={3}
          className={`text-sm border-gray-200 resize-none ${errors.chiefComplaint ? 'border-red-300' : ''}`}
        />
      </FormField>
    </div>
  );
}
