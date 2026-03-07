import { Users } from 'lucide-react';
import { FormField, InputField } from '../components/FormField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import type { RegistrationFormData } from '../types';
import { RELATIONSHIP_OPTIONS } from '../types';

interface Props {
  form: RegistrationFormData;
  errors: Partial<Record<keyof RegistrationFormData, string>>;
  onChange: (field: keyof RegistrationFormData, value: string) => void;
}

export default function Step3Guardian({ form, errors, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
          <Users className="w-4 h-4 text-amber-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Guardian / Emergency Contact</h3>
      </div>

      <div className="p-4 bg-gray-50 rounded-xl space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Guardian Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Guardian Name"
            placeholder="Full name"
            value={form.guardianName}
            onChange={(v) => onChange('guardianName', v)}
          />
          <InputField
            label="Guardian Contact"
            type="tel"
            placeholder="10-digit number"
            value={form.guardianPhone}
            onChange={(v) => onChange('guardianPhone', v.replace(/\D/g, '').slice(0, 10))}
            error={errors.guardianPhone}
          />
        </div>
        <FormField label="Relationship">
          <Select value={form.guardianRelation} onValueChange={(v) => onChange('guardianRelation', v)}>
            <SelectTrigger className="h-9 text-sm border-gray-200">
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIP_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="p-4 bg-red-50 rounded-xl space-y-4">
        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Emergency Contact</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Emergency Contact Name"
            placeholder="Full name"
            value={form.emergencyContactName}
            onChange={(v) => onChange('emergencyContactName', v)}
          />
          <InputField
            label="Emergency Contact Number"
            type="tel"
            placeholder="10-digit number"
            value={form.emergencyContactPhone}
            onChange={(v) => onChange('emergencyContactPhone', v.replace(/\D/g, '').slice(0, 10))}
          />
        </div>
      </div>
    </div>
  );
}
