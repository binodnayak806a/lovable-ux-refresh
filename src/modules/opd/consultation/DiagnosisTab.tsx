import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, GripVertical, Loader2, FileCode, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { toast } from 'sonner';
import consultationService from '../../../services/consultation.service';
import type { Diagnosis, SelectedDiagnosis } from './types';
import { DIAGNOSIS_SEVERITY_OPTIONS } from './types';

interface Props {
  selectedDiagnoses: SelectedDiagnosis[];
  onDiagnosesChange: (diagnoses: SelectedDiagnosis[]) => void;
}

export default function DiagnosisTab({ selectedDiagnoses, onDiagnosesChange }: Props) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchDiagnoses = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await consultationService.searchDiagnoses(term);
      setResults(data.filter((d) => !selectedDiagnoses.some((s) => s.diagnosisId === d.id)));
    } catch {
      setResults([]);
      toast.error('Failed to search diagnoses');
    } finally {
      setLoading(false);
    }
  }, [selectedDiagnoses]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchDiagnoses(val), 300);
  };

  const handleSelect = (diagnosis: Diagnosis) => {
    const isFirst = selectedDiagnoses.length === 0;
    onDiagnosesChange([
      ...selectedDiagnoses,
      {
        diagnosisId: diagnosis.id,
        name: diagnosis.name,
        icd10Code: diagnosis.icd10_code,
        diagnosisType: isFirst ? 'primary' : 'secondary',
        severity: 'moderate',
        notes: '',
      },
    ]);
    setSearch('');
    setResults([]);
    setShowDropdown(false);
  };

  const updateDiagnosis = (diagnosisId: string, field: keyof SelectedDiagnosis, value: string) => {
    onDiagnosesChange(
      selectedDiagnoses.map((d) =>
        d.diagnosisId === diagnosisId ? { ...d, [field]: value } : d
      )
    );
  };

  const removeDiagnosis = (diagnosisId: string) => {
    const updated = selectedDiagnoses.filter((d) => d.diagnosisId !== diagnosisId);
    if (updated.length > 0 && updated[0].diagnosisType !== 'primary') {
      updated[0] = { ...updated[0], diagnosisType: 'primary' };
    }
    onDiagnosesChange(updated);
  };

  const moveDiagnosis = (from: number, to: number) => {
    if (to < 0 || to >= selectedDiagnoses.length) return;
    const updated = [...selectedDiagnoses];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    updated[0] = { ...updated[0], diagnosisType: 'primary' };
    for (let i = 1; i < updated.length; i++) {
      if (updated[i].diagnosisType === 'primary') {
        updated[i] = { ...updated[i], diagnosisType: 'secondary' };
      }
    }
    onDiagnosesChange(updated);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-5">
      <div className="relative" ref={inputRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search diagnosis by name or ICD-10 code…"
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition-all"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
          )}
        </div>

        {showDropdown && search.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                <p className="text-sm">Searching diagnoses…</p>
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400">
                <AlertCircle className="w-5 h-5 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No diagnoses found for "{search}"</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {results.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleSelect(d)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                  >
                    <FileCode className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{d.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {d.icd10_code && (
                          <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {d.icd10_code}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{d.category}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Selected Diagnoses ({selectedDiagnoses.length})
          </h3>
          {selectedDiagnoses.length > 1 && (
            <span className="text-xs text-gray-400">Drag to reorder (first = primary)</span>
          )}
        </div>

        {selectedDiagnoses.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400">
            <FileCode className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No diagnoses selected</p>
            <p className="text-xs mt-1">Search and select from above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDiagnoses.map((selected, idx) => {
              const isPrimary = idx === 0;
              return (
                <Card
                  key={selected.diagnosisId}
                  className={`border shadow-sm ${isPrimary ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'}`}
                >
                  <CardHeader className="px-4 pt-3 pb-2">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-0.5 mt-1">
                        <button
                          type="button"
                          onClick={() => moveDiagnosis(idx, idx - 1)}
                          disabled={idx === 0}
                          className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <GripVertical className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-sm font-semibold text-gray-800">{selected.name}</CardTitle>
                          {selected.icd10Code && (
                            <span className="text-xs font-mono text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                              {selected.icd10Code}
                            </span>
                          )}
                          <Badge className={`text-xs ${isPrimary ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {isPrimary ? 'Primary' : `Secondary #${idx}`}
                          </Badge>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDiagnosis(selected.diagnosisId)}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Severity</label>
                      <div className="flex gap-2 flex-wrap">
                        {DIAGNOSIS_SEVERITY_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateDiagnosis(selected.diagnosisId, 'severity', opt.value)}
                            className={`text-xs font-semibold py-1.5 px-3 rounded-lg border transition-all ${
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

                    {!isPrimary && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Type</label>
                        <div className="flex gap-2">
                          {(['secondary', 'provisional'] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => updateDiagnosis(selected.diagnosisId, 'diagnosisType', type)}
                              className={`text-xs font-semibold py-1.5 px-3 rounded-lg border transition-all capitalize ${
                                selected.diagnosisType === type
                                  ? 'bg-gray-700 text-white border-gray-700'
                                  : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Clinical Notes</label>
                      <textarea
                        value={selected.notes}
                        onChange={(e) => updateDiagnosis(selected.diagnosisId, 'notes', e.target.value)}
                        placeholder="Additional notes about this diagnosis…"
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-sm px-3 py-2 outline-none transition-all resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
