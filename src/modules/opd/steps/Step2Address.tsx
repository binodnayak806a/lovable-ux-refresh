import { MapPin } from 'lucide-react';
import { FormField, InputField } from '../components/FormField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import type { RegistrationFormData } from '../types';
import { INDIAN_STATES } from '../types';

interface Props {
  form: RegistrationFormData;
  errors: Partial<Record<keyof RegistrationFormData, string>>;
  onChange: (field: keyof RegistrationFormData, value: string) => void;
}

export default function Step2Address({ form, errors, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
          <MapPin className="w-4 h-4 text-emerald-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Address Information</h3>
      </div>

      <FormField label="Address">
        <Textarea
          placeholder="House no, street, locality…"
          value={form.address}
          onChange={(e) => onChange('address', e.target.value)}
          rows={2}
          className="text-sm border-gray-200 resize-none"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="City"
          placeholder="City name"
          value={form.city}
          onChange={(v) => onChange('city', v)}
        />
        <FormField label="State" error={errors.state}>
          <Select value={form.state} onValueChange={(v) => onChange('state', v)}>
            <SelectTrigger className="h-9 text-sm border-gray-200">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {INDIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Pin Code"
          placeholder="6-digit pin code"
          value={form.pincode}
          onChange={(v) => onChange('pincode', v.replace(/\D/g, '').slice(0, 6))}
          error={errors.pincode}
          hint="6 digits"
        />
        <InputField
          label="Referred By"
          placeholder="Doctor or facility name"
          value={form.referredBy}
          onChange={(v) => onChange('referredBy', v)}
        />
      </div>
    </div>
  );
}
