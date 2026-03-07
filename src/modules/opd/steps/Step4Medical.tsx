import { useState } from 'react';
import { ClipboardList, Plus, X } from 'lucide-react';
import { FormField } from '../components/FormField';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import type { RegistrationFormData } from '../types';
import { PRE_EXISTING_CONDITIONS } from '../types';

interface Props {
  form: RegistrationFormData;
  errors: Partial<Record<keyof RegistrationFormData, string>>;
  onChange: (field: keyof RegistrationFormData, value: string | string[]) => void;
}

export default function Step4Medical({ form, onChange }: Props) {
  const [allergyInput, setAllergyInput] = useState('');

  const addAllergy = () => {
    const trimmed = allergyInput.trim();
    if (trimmed && !form.allergies.includes(trimmed)) {
      onChange('allergies', [...form.allergies, trimmed]);
    }
    setAllergyInput('');
  };

  const removeAllergy = (a: string) => {
    onChange('allergies', form.allergies.filter((x) => x !== a));
  };

  const toggleCondition = (c: string) => {
    if (form.preExistingConditions.includes(c)) {
      onChange('preExistingConditions', form.preExistingConditions.filter((x) => x !== c));
    } else {
      onChange('preExistingConditions', [...form.preExistingConditions, c]);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <div className="w-7 h-7 bg-rose-100 rounded-lg flex items-center justify-center">
          <ClipboardList className="w-4 h-4 text-rose-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Medical History</h3>
      </div>

      <div className="space-y-3">
        <FormField label="Known Allergies" hint="Type and press Add or Enter">
          <div className="flex gap-2">
            <Input
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }}
              placeholder="e.g. Penicillin, Sulfa drugs, Peanuts…"
              className="h-9 text-sm border-gray-200 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAllergy}
              className="h-9 px-3 border-gray-200 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
          {form.allergies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.allergies.map((a) => (
                <Badge key={a} className="bg-red-100 text-red-700 border-0 gap-1 px-2 py-0.5">
                  {a}
                  <button type="button" onClick={() => removeAllergy(a)} className="hover:text-red-900">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </FormField>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Pre-existing Conditions</p>
        <div className="flex flex-wrap gap-2">
          {PRE_EXISTING_CONDITIONS.map((c) => {
            const selected = form.preExistingConditions.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCondition(c)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                  selected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
        {form.preExistingConditions.length > 0 && (
          <p className="text-xs text-blue-600 font-medium">
            {form.preExistingConditions.length} condition{form.preExistingConditions.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      <FormField label="Current Medications" hint="List any medications the patient is currently taking">
        <Textarea
          placeholder="e.g. Metformin 500mg twice daily, Atorvastatin 10mg at night…"
          value={form.currentMedications}
          onChange={(e) => onChange('currentMedications', e.target.value)}
          rows={3}
          className="text-sm border-gray-200 resize-none"
        />
      </FormField>
    </div>
  );
}
