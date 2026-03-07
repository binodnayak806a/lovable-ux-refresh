import { useState, useEffect, useRef } from 'react';
import { Plus, X, Search, Sparkles, Pill } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import doctorQueueService, { type PrescriptionDrug } from '../../../services/doctor-queue.service';

interface Props {
  items: PrescriptionDrug[];
  onItemsChange: (v: PrescriptionDrug[]) => void;
}

const FREQUENCY_SHORTCUTS = [
  { label: 'OD', value: 'Once daily' },
  { label: 'BD', value: 'Twice daily' },
  { label: 'TDS', value: 'Thrice daily' },
  { label: 'QID', value: 'Four times daily' },
  { label: 'HS', value: 'At bedtime' },
  { label: 'PRN', value: 'As needed' },
  { label: 'STAT', value: 'Stat' },
];

const DURATION_PRESETS = ['3', '5', '7', '10', '14', '21', '30'];

const AI_SUGGESTIONS: PrescriptionDrug[] = [
  { id: 'ai-1', medicine_name: 'Paracetamol 500mg', dose: '1 tab', frequency: 'Thrice daily', duration: '5', instructions: 'After meals', medication_id: null },
  { id: 'ai-2', medicine_name: 'Amoxicillin 500mg', dose: '1 cap', frequency: 'Thrice daily', duration: '7', instructions: 'After meals', medication_id: null },
  { id: 'ai-3', medicine_name: 'Omeprazole 20mg', dose: '1 cap', frequency: 'Once daily', duration: '14', instructions: 'Before breakfast', medication_id: null },
];

export default function PrescriptionBuilder({ items, onItemsChange }: Props) {
  const [showAI, setShowAI] = useState(false);

  const addEmpty = () => {
    const newItem: PrescriptionDrug = {
      id: crypto.randomUUID(),
      medicine_name: '',
      dose: '',
      frequency: 'Twice daily',
      duration: '5',
      instructions: '',
      medication_id: null,
    };
    onItemsChange([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof PrescriptionDrug, value: string) => {
    onItemsChange(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter(i => i.id !== id));
  };

  const addAISuggestion = (sug: PrescriptionDrug) => {
    onItemsChange([...items, { ...sug, id: crypto.randomUUID() }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Medicines</label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAI(!showAI)}
            className="h-8 gap-1.5 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Suggest
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addEmpty}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Medicine
          </Button>
        </div>
      </div>

      {showAI && (
        <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-800">AI Suggested - Doctor must verify</span>
          </div>
          {AI_SUGGESTIONS.map(sug => (
            <div key={sug.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-100">
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-800">{sug.medicine_name}</span>
                <span className="text-xs text-gray-500 ml-2">{sug.dose} | {sug.frequency} | {sug.duration} days</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addAISuggestion(sug)}
                className="h-7 text-xs text-amber-700 hover:bg-amber-100"
              >
                Add
              </Button>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <DrugRow
              key={item.id}
              item={item}
              index={idx}
              onUpdate={(field, value) => updateItem(item.id, field, value)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Pill className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No medicines prescribed yet</p>
          <p className="text-xs text-gray-300 mt-1">Click "Add Medicine" or use AI suggestions</p>
        </div>
      )}
    </div>
  );
}

function DrugRow({
  item, index, onUpdate, onRemove,
}: {
  item: PrescriptionDrug;
  index: number;
  onUpdate: (field: keyof PrescriptionDrug, value: string) => void;
  onRemove: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState(item.medicine_name);
  const [results, setResults] = useState<Array<{ id: string; generic_name: string; brand_name: string | null; form: string; strength: string | null }>>([]);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showResults || searchTerm.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      const data = await doctorQueueService.searchMedications(searchTerm);
      setResults(data);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, showResults]);

  const selectMed = (med: { id: string; generic_name: string; brand_name: string | null; form: string; strength: string | null }) => {
    const name = med.brand_name ? `${med.brand_name} (${med.generic_name})` : med.generic_name;
    const withStrength = med.strength ? `${name} ${med.strength}` : name;
    setSearchTerm(withStrength);
    onUpdate('medicine_name', withStrength);
    onUpdate('medication_id', med.id);
    setShowResults(false);
  };

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px] h-5 font-mono">#{index + 1}</Badge>
        <button onClick={onRemove} className="text-gray-400 hover:text-red-500">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          ref={inputRef}
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); onUpdate('medicine_name', e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          placeholder="Search medicine..."
          className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        {showResults && results.length > 0 && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowResults(false)} />
            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-40 overflow-y-auto">
              {results.map(r => (
                <button
                  key={r.id}
                  onClick={() => selectMed(r)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                >
                  <span className="font-medium">{r.brand_name || r.generic_name}</span>
                  {r.brand_name && <span className="text-gray-400 ml-1">({r.generic_name})</span>}
                  {r.strength && <span className="text-xs text-gray-400 ml-1">{r.strength}</span>}
                  <span className="text-xs text-gray-300 ml-2">{r.form}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          value={item.dose}
          onChange={e => onUpdate('dose', e.target.value)}
          placeholder="Dose (e.g., 1 tab)"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        <div className="flex items-center gap-1 flex-wrap">
          {FREQUENCY_SHORTCUTS.map(f => (
            <button
              key={f.value}
              onClick={() => onUpdate('frequency', f.value)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                item.frequency === f.value
                  ? 'bg-teal-100 text-teal-700 border border-teal-200'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="flex items-center gap-1 flex-wrap">
            {DURATION_PRESETS.map(d => (
              <button
                key={d}
                onClick={() => onUpdate('duration', d)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                  item.duration === d
                    ? 'bg-teal-100 text-teal-700 border border-teal-200'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <input
          value={item.instructions}
          onChange={e => onUpdate('instructions', e.target.value)}
          placeholder="Instructions (e.g., After meals)"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
