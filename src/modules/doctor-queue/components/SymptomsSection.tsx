import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import doctorQueueService from '../../../services/doctor-queue.service';

interface SelectedSymptom {
  symptom_id: string;
  name: string;
  severity: string;
}

interface Props {
  chiefComplaint: string;
  onChiefComplaintChange: (v: string) => void;
  selectedSymptoms: SelectedSymptom[];
  onSymptomsChange: (v: SelectedSymptom[]) => void;
}

const SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Mild', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'moderate', label: 'Mod', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'severe', label: 'Severe', cls: 'bg-red-50 text-red-700 border-red-200' },
];

export default function SymptomsSection({
  chiefComplaint, onChiefComplaintChange, selectedSymptoms, onSymptomsChange,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const data = await doctorQueueService.searchSymptoms(searchTerm);
      setResults(data.filter(d => !selectedSymptoms.some(s => s.symptom_id === d.id)));
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedSymptoms]);

  const addSymptom = (s: { id: string; name: string }) => {
    if (selectedSymptoms.some(x => x.symptom_id === s.id)) return;
    onSymptomsChange([...selectedSymptoms, { symptom_id: s.id, name: s.name, severity: 'moderate' }]);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const removeSymptom = (id: string) => {
    onSymptomsChange(selectedSymptoms.filter(s => s.symptom_id !== id));
  };

  const updateSeverity = (id: string, severity: string) => {
    onSymptomsChange(selectedSymptoms.map(s => s.symptom_id === id ? { ...s, severity } : s));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Chief Complaint</label>
        <textarea
          value={chiefComplaint}
          onChange={e => onChiefComplaintChange(e.target.value)}
          placeholder="Describe the patient's chief complaint..."
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Symptom Shortcuts</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search symptoms..."
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          {showDropdown && results.length > 0 && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                {results.map(r => (
                  <button
                    key={r.id}
                    onClick={() => addSymptom(r)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center justify-between"
                  >
                    <span>{r.name}</span>
                    <span className="text-[10px] text-gray-400 uppercase">{r.category}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedSymptoms.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Selected Symptoms ({selectedSymptoms.length})
          </label>
          {selectedSymptoms.map(s => (
            <div key={s.symptom_id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-800 flex-1">{s.name}</span>
              <div className="flex items-center gap-1">
                {SEVERITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateSeverity(s.symptom_id, opt.value)}
                    className="focus:outline-none"
                  >
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-5 cursor-pointer transition-all ${
                        s.severity === opt.value ? opt.cls + ' shadow-sm' : 'border-gray-200 text-gray-400'
                      }`}
                    >
                      {opt.label}
                    </Badge>
                  </button>
                ))}
              </div>
              <button onClick={() => removeSymptom(s.symptom_id)} className="text-gray-400 hover:text-red-500 ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
