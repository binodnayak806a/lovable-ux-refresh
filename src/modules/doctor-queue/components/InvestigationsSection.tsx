import { useState, useEffect } from 'react';
import { X, Search, FlaskConical } from 'lucide-react';
import doctorQueueService, { type InvestigationItem } from '../../../services/doctor-queue.service';

interface Props {
  investigations: InvestigationItem[];
  onInvestigationsChange: (v: InvestigationItem[]) => void;
}

export default function InvestigationsSection({ investigations, onInvestigationsChange }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<InvestigationItem[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const data = await doctorQueueService.searchInvestigations(searchTerm);
      setResults(data.filter(d => !investigations.some(i => i.test_id === d.test_id)));
      setSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, investigations]);

  const addInvestigation = (item: InvestigationItem) => {
    onInvestigationsChange([...investigations, item]);
    setSearchTerm('');
    setResults([]);
  };

  const removeInvestigation = (testId: string) => {
    onInvestigationsChange(investigations.filter(i => i.test_id !== testId));
  };

  const totalCost = investigations.reduce((s, i) => s + i.test_price, 0);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Search Investigations</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search lab tests by name or code..."
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        {searching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
        {results.length > 0 && (
          <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {results.map(r => (
              <button
                key={r.test_id}
                onClick={() => addInvestigation(r)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center justify-between"
              >
                <div>
                  <span className="text-gray-800">{r.test_name}</span>
                  <span className="text-xs text-gray-400 ml-2 font-mono">{r.test_code}</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">Rs {r.test_price}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {investigations.length > 0 ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Ordered Investigations ({investigations.length})
            </label>
            <span className="text-xs font-medium text-gray-600">Total: Rs {totalCost.toFixed(0)}</span>
          </div>
          {investigations.map(inv => (
            <div key={inv.test_id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <FlaskConical className="w-4 h-4 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-800">{inv.test_name}</span>
                <span className="text-xs text-gray-400 ml-2 font-mono">{inv.test_code}</span>
              </div>
              <span className="text-xs text-gray-500 shrink-0">Rs {inv.test_price}</span>
              <button onClick={() => removeInvestigation(inv.test_id)} className="text-gray-400 hover:text-red-500 ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FlaskConical className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No investigations ordered yet</p>
          <p className="text-xs text-gray-300">Search and add lab tests above</p>
        </div>
      )}
    </div>
  );
}
