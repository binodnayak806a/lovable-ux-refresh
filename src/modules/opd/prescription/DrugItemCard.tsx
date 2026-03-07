import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2, Pill, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import prescriptionService from '../../../services/prescription.service';
import type { Medication, PrescriptionItem } from './types';
import {
  DOSAGE_FORMS,
  FREQUENCY_OPTIONS,
  ROUTE_OPTIONS,
  TIMING_OPTIONS,
  DURATION_PRESETS,
} from './types';

interface Props {
  item: PrescriptionItem;
  index: number;
  onChange: (id: string, field: keyof PrescriptionItem, value: string | number | null) => void;
  onRemove: (id: string) => void;
}

export default function DrugItemCard({ item, index, onChange, onRemove }: Props) {
  const [search, setSearch] = useState(item.drugName);
  const [results, setResults] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  const searchMedications = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await prescriptionService.searchMedications(term);
      setResults(data);
    } catch {
      setResults([]);
      toast.error('Failed to search medications');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    onChange(item.id, 'drugName', val);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchMedications(val), 300);
  };

  const handleSelect = (med: Medication) => {
    const displayName = med.brand_name
      ? `${med.generic_name} (${med.brand_name})`
      : med.generic_name;
    setSearch(displayName);
    onChange(item.id, 'drugName', displayName);
    onChange(item.id, 'medicationId', med.id);
    onChange(item.id, 'dosageForm', med.form);
    onChange(item.id, 'strength', med.strength || '');
    setShowDropdown(false);
    setResults([]);
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

  const frequencyOption = FREQUENCY_OPTIONS.find((f) => f.value === item.frequency);

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs font-bold px-2">
              #{index + 1}
            </Badge>
            {item.drugName && (
              <span className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
                {item.drugName}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        <div className="relative" ref={inputRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search drug by name or brand…"
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition-all"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
            )}
          </div>

          {showDropdown && search.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-4 text-center text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                  <p className="text-xs">Searching…</p>
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-4 text-center text-gray-400 text-xs">
                  No medications found
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {results.map((med) => (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => handleSelect(med)}
                      className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                    >
                      <Pill className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {med.generic_name}
                          {med.brand_name && (
                            <span className="text-gray-500 font-normal"> ({med.brand_name})</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 capitalize">{med.form}</span>
                          {med.strength && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              {med.strength}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Form</label>
            <div className="relative">
              <select
                value={item.dosageForm}
                onChange={(e) => onChange(item.id, 'dosageForm', e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none appearance-none bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 capitalize"
              >
                {DOSAGE_FORMS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Strength</label>
            <input
              type="text"
              value={item.strength}
              onChange={(e) => onChange(item.id, 'strength', e.target.value)}
              placeholder="500mg"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Quantity</label>
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => onChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Route</label>
            <div className="relative">
              <select
                value={item.route}
                onChange={(e) => onChange(item.id, 'route', e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none appearance-none bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              >
                {ROUTE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Frequency</label>
            <div className="relative">
              <select
                value={item.frequency}
                onChange={(e) => {
                  const freq = FREQUENCY_OPTIONS.find((f) => f.value === e.target.value);
                  onChange(item.id, 'frequency', e.target.value);
                  if (freq) onChange(item.id, 'dosage', freq.dosage);
                }}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none appearance-none bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              >
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {frequencyOption && (
              <span className="text-xs text-blue-600 mt-1 block">Dosage: {frequencyOption.dosage}</span>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Duration</label>
            <div className="flex gap-1.5">
              <input
                type="number"
                min="1"
                value={item.durationDays}
                onChange={(e) => onChange(item.id, 'durationDays', parseInt(e.target.value) || 1)}
                className="w-20 h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
              <span className="text-xs text-gray-500 self-center">days</span>
            </div>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {DURATION_PRESETS.slice(0, 5).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onChange(item.id, 'durationDays', d)}
                  className={`text-xs px-2 py-0.5 rounded border transition-all ${
                    item.durationDays === d
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Timing</label>
            <div className="relative">
              <select
                value={item.timing}
                onChange={(e) => onChange(item.id, 'timing', e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none appearance-none bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              >
                {TIMING_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Special Instructions</label>
          <textarea
            value={item.specialInstructions}
            onChange={(e) => onChange(item.id, 'specialInstructions', e.target.value)}
            placeholder="E.g., Avoid alcohol, Take with plenty of water…"
            rows={2}
            className="w-full rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-sm px-3 py-2 outline-none transition-all resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
