import { CreditCard, CheckCircle } from 'lucide-react';
import { FormField, InputField } from '../components/FormField';
import type { RegistrationFormData } from '../types';

interface Props {
  form: RegistrationFormData;
  errors: Partial<Record<keyof RegistrationFormData, string>>;
  onChange: (field: keyof RegistrationFormData, value: string) => void;
}

const BILLING_OPTIONS = [
  { value: 'cash', label: 'Cash / Self Pay', desc: 'Patient pays directly', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'insurance', label: 'Insurance', desc: 'Covered by health insurance', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { value: 'tpa', label: 'TPA (Third Party)', desc: 'Third party administrator', color: 'text-amber-700 bg-amber-50 border-amber-200' },
];

export default function Step6Billing({ form, errors, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-green-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Billing Information</h3>
      </div>

      <FormField label="Billing Category" required>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
          {BILLING_OPTIONS.map((opt) => {
            const active = form.billingCategory === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange('billingCategory', opt.value)}
                className={`relative p-3.5 rounded-xl border-2 text-left transition-all ${
                  active ? `${opt.color} border-current` : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {active && (
                  <CheckCircle className="absolute top-2 right-2 w-4 h-4" />
                )}
                <p className={`font-semibold text-sm ${active ? '' : 'text-gray-800'}`}>{opt.label}</p>
                <p className={`text-xs mt-0.5 ${active ? 'opacity-80' : 'text-gray-400'}`}>{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </FormField>

      {(form.billingCategory === 'insurance' || form.billingCategory === 'tpa') && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            {form.billingCategory === 'insurance' ? 'Insurance Details' : 'TPA Details'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label={form.billingCategory === 'insurance' ? 'Insurance Company' : 'TPA Company'}
              required
              placeholder="Company name"
              value={form.insuranceCompany}
              onChange={(v) => onChange('insuranceCompany', v)}
              error={errors.insuranceCompany}
            />
            <InputField
              label={form.billingCategory === 'insurance' ? 'Policy Number' : 'TPA ID'}
              required
              placeholder="Policy / ID number"
              value={form.policyNumber}
              onChange={(v) => onChange('policyNumber', v)}
              error={errors.policyNumber}
            />
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Registration Summary</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <span className="text-gray-500">Patient</span>
          <span className="font-medium text-gray-900 truncate">
            {[form.firstName, form.lastName].filter(Boolean).join(' ') || '—'}
          </span>
          <span className="text-gray-500">Phone</span>
          <span className="font-medium text-gray-900">{form.phone || '—'}</span>
          <span className="text-gray-500">Appointment</span>
          <span className="font-medium text-gray-900">
            {form.appointmentDate ? `${form.appointmentDate}${form.appointmentTime ? ' at ' + form.appointmentTime : ''}` : '—'}
          </span>
          <span className="text-gray-500">Type</span>
          <span className="font-medium text-gray-900">{form.appointmentType || '—'}</span>
          <span className="text-gray-500">Billing</span>
          <span className="font-medium text-gray-900 capitalize">{form.billingCategory}</span>
        </div>
      </div>
    </div>
  );
}
