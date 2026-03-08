import { useState, useEffect } from 'react';
import { Search, X, Tag } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import doctorQueueService from '../../../services/doctor-queue.service';

export interface SelectedDiagnosis {
  diagnosis_id: string;
  name: string;
  icd10_code: string | null;
  type: string;
}

interface Props {
  diagnosis: string;
  onDiagnosisChange: (v: string) => void;
  selectedDiagnoses: SelectedDiagnosis[];
  onDiagnosesChange: (v: SelectedDiagnosis[]) => void;
}

export default function DiagnosisEditor({ diagnosis, onDiagnosisChange, selectedDiagnoses, onDiagnosesChange }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string; icd10_code: string | null; category: string }>>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const data = await doctorQueueService.searchDiagnoses(searchTerm);
      setResults(data.filter(d => !selectedDiagnoses.some(s => s.diagnosis_id === d.id)));
      setSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedDiagnoses]);

  const addDiagnosis = (d: { id: string; name: string; icd10_code: string | null }) => {
    if (selectedDiagnoses.some(s => s.diagnosis_id === d.id)) return;
    onDiagnosesChange([...selectedDiagnoses, {
      diagnosis_id: d.id, name: d.name, icd10_code: d.icd10_code,
      type: selectedDiagnoses.length === 0 ? 'primary' : 'secondary',
    }]);
    setSearchTerm('');
    setResults([]);
  };

  return (
    <div className="space-y-4">
      {/* ICD-10 Search from Master Data */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-primary" />
          Search Diagnosis (from Master Data)
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by diagnosis name or ICD-10 code from master..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        {searching && <p className="text-xs text-muted-foreground mt-1">Searching master data...</p>}
        {results.length > 0 && (
          <div className="mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {results.map(r => (
              <button key={r.id} onClick={() => addDiagnosis(r)} className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center justify-between">
                <div>
                  <span className="text-foreground">{r.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">{r.category}</span>
                </div>
                {r.icd10_code && <span className="text-xs text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">{r.icd10_code}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected diagnoses */}
      {selectedDiagnoses.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Selected Diagnoses ({selectedDiagnoses.length})
          </label>
          {selectedDiagnoses.map((d, idx) => (
            <div key={d.diagnosis_id} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <Badge variant={idx === 0 ? 'default' : 'outline'} className="text-[10px] h-5">
                {idx === 0 ? 'Primary' : 'Secondary'}
              </Badge>
              <span className="text-sm text-foreground flex-1">{d.name}</span>
              {d.icd10_code && <span className="text-xs text-muted-foreground font-mono">{d.icd10_code}</span>}
              <button onClick={() => onDiagnosesChange(selectedDiagnoses.filter(x => x.diagnosis_id !== d.diagnosis_id))} className="text-muted-foreground hover:text-destructive">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Free text diagnosis */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Additional Notes (free text)</label>
        <textarea
          value={diagnosis}
          onChange={e => onDiagnosisChange(e.target.value)}
          placeholder="Additional diagnosis notes..."
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
      </div>
    </div>
  );
}
