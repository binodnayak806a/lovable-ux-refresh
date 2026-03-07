import { ClipboardList, Calendar } from 'lucide-react';
import type { ConsultationFormData, SelectedDiagnosis } from './types';

interface Props {
  form: ConsultationFormData;
  selectedDiagnoses: SelectedDiagnosis[];
  onChange: (field: keyof ConsultationFormData, value: string) => void;
}

export default function AssessmentTab({ form, selectedDiagnoses, onChange }: Props) {
  const primaryDiagnosis = selectedDiagnoses.find((d) => d.diagnosisType === 'primary');

  return (
    <div className="space-y-5">
      {selectedDiagnoses.length > 0 && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-2">Selected Diagnoses</h4>
          <div className="flex flex-wrap gap-2">
            {selectedDiagnoses.map((d, idx) => (
              <span
                key={d.diagnosisId}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                  idx === 0
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                {idx === 0 && '1. '}
                {d.name}
                {d.icd10Code && <span className="ml-1 text-emerald-600">({d.icd10Code})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5" />
          Clinical Assessment / Impression
        </label>
        <textarea
          value={form.assessment}
          onChange={(e) => onChange('assessment', e.target.value)}
          placeholder={primaryDiagnosis
            ? `Based on the clinical findings, the patient is diagnosed with ${primaryDiagnosis.name}. Elaborate on the clinical reasoning…`
            : 'Summarize your clinical assessment based on history, examination, and investigations…'
          }
          rows={5}
          className="w-full rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm px-4 py-3 outline-none transition-all resize-none leading-relaxed"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5" />
          Treatment Plan
        </label>
        <textarea
          value={form.plan}
          onChange={(e) => onChange('plan', e.target.value)}
          placeholder="1. Medications (see Prescription tab)
2. Investigations advised (if any)
3. Dietary advice
4. Lifestyle modifications
5. Referrals (if required)
6. Red flag signs to watch for…"
          rows={6}
          className="w-full rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm px-4 py-3 outline-none transition-all resize-none leading-relaxed"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5" />
          Clinical Notes (Internal)
        </label>
        <textarea
          value={form.clinicalNotes}
          onChange={(e) => onChange('clinicalNotes', e.target.value)}
          placeholder="Internal notes not visible on patient-facing documents…"
          rows={3}
          className="w-full rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm px-4 py-3 outline-none transition-all resize-none leading-relaxed"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          Follow-up Date
        </label>
        <input
          type="date"
          value={form.followUpDate}
          onChange={(e) => onChange('followUpDate', e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full sm:w-64 h-10 px-4 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition-all"
        />
        {form.followUpDate && (
          <p className="text-xs text-gray-500">
            Follow-up scheduled for{' '}
            {new Date(form.followUpDate).toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
