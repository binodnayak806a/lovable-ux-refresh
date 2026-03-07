import { Stethoscope } from 'lucide-react';
import type { ConsultationFormData } from './types';

interface Props {
  form: ConsultationFormData;
  onChange: (field: keyof ConsultationFormData, value: string) => void;
}

const EXAMINATION_SECTIONS = [
  { label: 'General Appearance', placeholder: 'Conscious, oriented, well-nourished, no acute distress…' },
  { label: 'Vitals Summary', placeholder: 'BP: 120/80 mmHg, HR: 72 bpm, Temp: 37°C, SpO2: 98%…' },
  { label: 'Systemic Examination', placeholder: 'CVS: S1S2 heard, no murmurs\nRS: B/L air entry equal, no added sounds\nPA: Soft, non-tender, no organomegaly\nCNS: No focal neurological deficits…' },
  { label: 'Local Examination', placeholder: 'Site-specific findings…' },
];

export default function ExaminationTab({ form, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-sky-50 border border-sky-200 rounded-xl">
        <Stethoscope className="w-4 h-4 text-sky-600 shrink-0" />
        <p className="text-xs text-sky-800">
          <span className="font-semibold">Physical Examination:</span> Document all relevant findings from head-to-toe or focused examination.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Physical Examination Findings
          </label>
          {form.physicalExamination && (
            <span className="text-xs text-gray-400">
              {form.physicalExamination.length} characters
            </span>
          )}
        </div>
        <textarea
          value={form.physicalExamination}
          onChange={(e) => onChange('physicalExamination', e.target.value)}
          placeholder={EXAMINATION_SECTIONS.map((s) => `${s.label}:\n${s.placeholder}`).join('\n\n')}
          rows={14}
          className="w-full rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm px-4 py-3 outline-none transition-all resize-none leading-relaxed font-mono"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {EXAMINATION_SECTIONS.map((section) => (
          <button
            key={section.label}
            type="button"
            onClick={() => {
              const current = form.physicalExamination;
              const newSection = `\n\n${section.label}:\n`;
              onChange('physicalExamination', current + newSection);
            }}
            className="text-xs font-medium py-2 px-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            + {section.label}
          </button>
        ))}
      </div>
    </div>
  );
}
