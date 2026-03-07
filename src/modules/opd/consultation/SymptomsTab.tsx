import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, X, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import type { Symptom, SelectedSymptom } from './types';
import { SYMPTOM_CATEGORIES, SEVERITY_OPTIONS } from './types';

interface Props {
  symptoms: Symptom[];
  selectedSymptoms: SelectedSymptom[];
  onSymptomsChange: (symptoms: SelectedSymptom[]) => void;
  loading?: boolean;
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export default function SymptomsTab({ symptoms, selectedSymptoms, onSymptomsChange, loading }: Props) {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['General', 'Respiratory']));

  const filteredSymptoms = useMemo(() => {
    if (!search.trim()) return symptoms;
    const term = search.toLowerCase();
    return symptoms.filter((s) => s.name.toLowerCase().includes(term));
  }, [symptoms, search]);

  const groupedSymptoms = useMemo(() => groupBy(filteredSymptoms, 'category'), [filteredSymptoms]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const isSelected = (symptomId: string) => selectedSymptoms.some((s) => s.symptomId === symptomId);

  const handleToggle = (symptom: Symptom) => {
    if (isSelected(symptom.id)) {
      onSymptomsChange(selectedSymptoms.filter((s) => s.symptomId !== symptom.id));
    } else {
      onSymptomsChange([
        ...selectedSymptoms,
        { symptomId: symptom.id, name: symptom.name, severity: 'moderate', durationDays: '', notes: '' },
      ]);
    }
  };

  const updateSymptom = (symptomId: string, field: keyof SelectedSymptom, value: string) => {
    onSymptomsChange(
      selectedSymptoms.map((s) =>
        s.symptomId === symptomId ? { ...s, [field]: value } : s
      )
    );
  };

  const removeSymptom = (symptomId: string) => {
    onSymptomsChange(selectedSymptoms.filter((s) => s.symptomId !== symptomId));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symptoms…"
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Select Symptoms</h3>
          <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
            {SYMPTOM_CATEGORIES.map((cat) => {
              const catSymptoms = groupedSymptoms[cat] ?? [];
              if (catSymptoms.length === 0 && search.trim()) return null;
              const isExpanded = expandedCategories.has(cat);
              const selectedCount = catSymptoms.filter((s) => isSelected(s.id)).length;

              return (
                <div key={cat}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      <span className="text-sm font-semibold text-gray-700">{cat}</span>
                      <span className="text-xs text-gray-400">({catSymptoms.length})</span>
                    </div>
                    {selectedCount > 0 && (
                      <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">{selectedCount} selected</Badge>
                    )}
                  </button>
                  {isExpanded && catSymptoms.length > 0 && (
                    <div className="px-3 py-2 space-y-1 bg-white">
                      {catSymptoms.map((symptom) => {
                        const checked = isSelected(symptom.id);
                        return (
                          <label
                            key={symptom.id}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                              checked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggle(symptom)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className={`text-sm ${checked ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                              {symptom.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
            Selected Symptoms ({selectedSymptoms.length})
          </h3>
          {selectedSymptoms.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400">
              <Search className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No symptoms selected</p>
              <p className="text-xs mt-1">Select from the list on the left</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {selectedSymptoms.map((selected) => (
                <Card key={selected.symptomId} className="border border-gray-100 shadow-sm">
                  <CardHeader className="px-4 pt-3 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-gray-800">{selected.name}</CardTitle>
                      <button
                        type="button"
                        onClick={() => removeSymptom(selected.symptomId)}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Severity</label>
                      <div className="flex gap-2">
                        {SEVERITY_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateSymptom(selected.symptomId, 'severity', opt.value)}
                            className={`flex-1 text-xs font-semibold py-1.5 px-2 rounded-lg border transition-all ${
                              selected.severity === opt.value
                                ? opt.color
                                : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Duration</label>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          value={selected.durationDays}
                          onChange={(e) => updateSymptom(selected.symptomId, 'durationDays', e.target.value)}
                          placeholder="Days"
                          className="w-full h-8 pl-8 pr-12 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-sm outline-none transition-all"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">days</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Notes (optional)</label>
                      <textarea
                        value={selected.notes}
                        onChange={(e) => updateSymptom(selected.symptomId, 'notes', e.target.value)}
                        placeholder="Additional details…"
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-sm px-3 py-2 outline-none transition-all resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
