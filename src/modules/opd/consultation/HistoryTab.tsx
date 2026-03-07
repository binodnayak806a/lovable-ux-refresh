import { FileText, Users, User, Pill, AlertTriangle, Clock } from 'lucide-react';
import type { ConsultationFormData, HistorySubTab } from './types';

interface Props {
  form: ConsultationFormData;
  activeSubTab: HistorySubTab;
  onSubTabChange: (tab: HistorySubTab) => void;
  onChange: (field: keyof ConsultationFormData, value: string) => void;
}

const SUB_TABS: Array<{ id: HistorySubTab; label: string; icon: React.ElementType }> = [
  { id: 'hpi', label: 'Present Illness', icon: Clock },
  { id: 'past', label: 'Past History', icon: FileText },
  { id: 'family', label: 'Family History', icon: Users },
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'drug', label: 'Drug History', icon: Pill },
  { id: 'allergy', label: 'Allergies', icon: AlertTriangle },
];

const FIELD_MAP: Record<HistorySubTab, keyof ConsultationFormData> = {
  hpi: 'historyOfPresentIllness',
  past: 'pastHistory',
  family: 'familyHistory',
  personal: 'personalHistory',
  drug: 'drugHistory',
  allergy: 'allergyHistory',
};

const PLACEHOLDERS: Record<HistorySubTab, string> = {
  hpi: 'Describe the onset, duration, progression, and characteristics of the current illness. Include aggravating and relieving factors…',
  past: 'Previous illnesses, hospitalizations, surgeries, chronic conditions (e.g., Diabetes since 2015, Hypertension controlled on medication)…',
  family: 'Family history of relevant conditions (e.g., Father — Diabetes, Mother — Hypertension, Sibling — Asthma)…',
  personal: 'Occupation, lifestyle habits, smoking/alcohol use, diet, exercise, sleep patterns, stress levels…',
  drug: 'Current medications with dosages (e.g., Metformin 500mg BD, Amlodipine 5mg OD). Include OTC drugs and supplements…',
  allergy: 'Known allergies to medications, food, or environmental factors. Specify reaction type (rash, anaphylaxis, etc.)…',
};

export default function HistoryTab({ form, activeSubTab, onSubTabChange, onChange }: Props) {
  const currentField = FIELD_MAP[activeSubTab];
  const currentValue = form[currentField];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5 p-1 bg-gray-50 rounded-xl">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          const hasContent = form[FIELD_MAP[tab.id]]?.trim();
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSubTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-blue-700 shadow-sm'
                  : hasContent
                  ? 'text-emerald-700 hover:bg-white/60'
                  : 'text-gray-500 hover:bg-white/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {hasContent && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            {SUB_TABS.find((t) => t.id === activeSubTab)?.label}
          </label>
          {currentValue && (
            <span className="text-xs text-gray-400">
              {currentValue.length} characters
            </span>
          )}
        </div>
        <textarea
          value={currentValue}
          onChange={(e) => onChange(currentField, e.target.value)}
          placeholder={PLACEHOLDERS[activeSubTab]}
          rows={10}
          className="w-full rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm px-4 py-3 outline-none transition-all resize-none leading-relaxed"
        />
      </div>

      {activeSubTab === 'allergy' && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800">
            <span className="font-semibold">Important:</span> Always verify allergies with the patient before prescribing any medication. Document both the allergen and the reaction type.
          </div>
        </div>
      )}

      {activeSubTab === 'drug' && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <Pill className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-800">
            <span className="font-semibold">Tip:</span> Include drug name, dose, frequency, and duration. Note any recent changes in medication.
          </div>
        </div>
      )}
    </div>
  );
}
