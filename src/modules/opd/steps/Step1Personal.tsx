import { User } from 'lucide-react';
import { FormField, InputField } from '../components/FormField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import type { RegistrationFormData } from '../types';
import { BLOOD_GROUPS } from '../types';
import { cn } from '../../../lib/utils';

interface Props {
  form: RegistrationFormData;
  errors: Partial<Record<keyof RegistrationFormData, string>>;
  onChange: (field: keyof RegistrationFormData, value: string) => void;
}

export default function Step1Personal({ form, errors, onChange }: Props) {
  const phoneValid = form.phone.length === 10 && /^[6-9]/.test(form.phone);
  const emailValid = form.email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
          <p className="text-xs text-gray-500">Basic details about the patient</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InputField
          label="First Name"
          required
          placeholder="Enter first name"
          value={form.firstName}
          onChange={(v) => onChange('firstName', v)}
          error={errors.firstName}
          autoFocus
        />
        <InputField
          label="Middle Name"
          placeholder="Enter middle name"
          value={form.middleName}
          onChange={(v) => onChange('middleName', v)}
        />
        <InputField
          label="Last Name"
          placeholder="Enter last name"
          value={form.lastName}
          onChange={(v) => onChange('lastName', v)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Date of Birth"
          type="date"
          value={form.dateOfBirth}
          onChange={(v) => {
            onChange('dateOfBirth', v);
            if (v) {
              const age = Math.floor((Date.now() - new Date(v).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
              onChange('ageYears', String(Math.max(0, age)));
            }
          }}
          error={errors.dateOfBirth}
          hint="Or enter age below if DOB unknown"
        />
        <InputField
          label="Age (years)"
          type="number"
          placeholder="e.g. 30"
          value={form.ageYears}
          onChange={(v) => onChange('ageYears', v)}
          hint="Used if DOB is not available"
          suffix="years"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Gender" required error={errors.gender}>
          <Select value={form.gender} onValueChange={(v) => onChange('gender', v)}>
            <SelectTrigger className={cn(
              'h-10 text-sm border-gray-200 bg-gray-50/50',
              errors.gender && 'border-red-300'
            )}>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Blood Group" hint="Optional but recommended">
          <div className="flex flex-wrap gap-2">
            {BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                type="button"
                onClick={() => onChange('bloodGroup', bg)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-lg border transition-all',
                  form.bloodGroup === bg
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                )}
              >
                {bg}
              </button>
            ))}
          </div>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Mobile Number"
          required
          type="tel"
          placeholder="Enter 10-digit number"
          value={form.phone}
          onChange={(v) => onChange('phone', v.replace(/\D/g, '').slice(0, 10))}
          error={errors.phone}
          success={phoneValid}
          prefix="+91"
          hint={`${form.phone.length}/10 digits`}
        />
        <InputField
          label="Email Address"
          type="email"
          placeholder="patient@example.com"
          value={form.email}
          onChange={(v) => onChange('email', v)}
          error={errors.email}
          success={emailValid}
          hint="Optional, for sending reports"
        />
      </div>

      <InputField
        label="Aadhar Number"
        placeholder="Enter 12-digit Aadhar number"
        value={form.aadharNumber}
        onChange={(v) => onChange('aadharNumber', v.replace(/\D/g, '').slice(0, 12))}
        error={errors.aadharNumber}
        success={form.aadharNumber.length === 12}
        hint={`${form.aadharNumber.length}/12 digits - Optional for identification`}
      />
    </div>
  );
}
