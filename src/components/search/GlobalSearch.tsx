import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, BedDouble, Receipt, X, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppSelector, useAppDispatch } from '../../store';
import { setSearchOpen } from '../../store/slices/globalSlice';
import { loadPatientContext } from '../../store/slices/globalSlice';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchResult {
  type: 'patient' | 'admission' | 'bill';
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
}

const HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { searchOpen } = useAppSelector((s) => s.global);
  const { user } = useAppSelector((s) => s.auth);
  const hospitalId = user?.hospital_id ?? HOSPITAL_ID;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch(setSearchOpen(true));
      }
      if (e.key === 'Escape') {
        dispatch(setSearchOpen(false));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const [patientsRes, admissionsRes, billsRes] = await Promise.all([
        supabase
          .from('patients')
          .select('id, full_name, uhid, phone, age, gender')
          .eq('hospital_id', hospitalId)
          .or(`full_name.ilike.%${q}%,uhid.ilike.%${q}%,phone.ilike.%${q}%`)
          .limit(5),
        supabase
          .from('admissions')
          .select('id, admission_number, status, patients(full_name)')
          .eq('hospital_id', hospitalId)
          .ilike('admission_number', `%${q}%`)
          .limit(3),
        supabase
          .from('bills')
          .select('id, bill_number, total_amount, patients(full_name)')
          .eq('hospital_id', hospitalId)
          .ilike('bill_number', `%${q}%`)
          .limit(3),
      ]);

      const allResults: SearchResult[] = [];

      for (const p of patientsRes.data ?? []) {
        const pt = p as Record<string, unknown>;
        allResults.push({
          type: 'patient',
          id: pt.id as string,
          title: pt.full_name as string,
          subtitle: `UHID: ${pt.uhid} · ${pt.phone}`,
          meta: pt.gender ? `${pt.age ?? '?'}y · ${(pt.gender as string).charAt(0).toUpperCase()}` : undefined,
        });
      }

      for (const a of admissionsRes.data ?? []) {
        const adm = a as Record<string, unknown>;
        const patName = ((adm.patients as Record<string, unknown>)?.full_name as string) ?? '';
        allResults.push({
          type: 'admission',
          id: adm.id as string,
          title: `Admission ${adm.admission_number}`,
          subtitle: patName,
          meta: adm.status as string,
        });
      }

      for (const b of billsRes.data ?? []) {
        const bill = b as Record<string, unknown>;
        const patName = ((bill.patients as Record<string, unknown>)?.full_name as string) ?? '';
        allResults.push({
          type: 'bill',
          id: bill.id as string,
          title: `Bill ${bill.bill_number}`,
          subtitle: patName,
          meta: `₹${Number(bill.total_amount).toLocaleString('en-IN')}`,
        });
      }

      setResults(allResults);
      setSelected(0);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const handleSelect = async (result: SearchResult) => {
    dispatch(setSearchOpen(false));
    setQuery('');
    switch (result.type) {
      case 'patient':
        await dispatch(loadPatientContext(result.id));
        navigate(`/patients?id=${result.id}`);
        break;
      case 'admission':
        navigate(`/ipd?admission=${result.id}`);
        break;
      case 'bill':
        navigate(`/billing?bill=${result.id}`);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && results[selected]) {
      handleSelect(results[selected]);
    }
  };

  const TypeIcon = ({ type }: { type: SearchResult['type'] }) => {
    if (type === 'patient') return <User className="w-4 h-4 text-blue-500" />;
    if (type === 'admission') return <BedDouble className="w-4 h-4 text-amber-500" />;
    return <Receipt className="w-4 h-4 text-emerald-500" />;
  };

  const TypeLabel = ({ type }: { type: SearchResult['type'] }) => {
    const labels = { patient: 'Patient', admission: 'Admission', bill: 'Bill' };
    const colors = {
      patient: 'bg-blue-50 text-blue-600',
      admission: 'bg-amber-50 text-amber-600',
      bill: 'bg-emerald-50 text-emerald-600',
    };
    return (
      <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${colors[type]}`}>
        {labels[type]}
      </span>
    );
  };

  if (!searchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => dispatch(setSearchOpen(false))}
      />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            data-search-input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search patients, admissions, bills… (or scan barcode)"
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
          />
          <div className="flex items-center gap-1.5">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border border-gray-200 text-gray-400">
              ESC
            </kbd>
          </div>
        </div>

        {results.length > 0 && (
          <ul className="py-1.5 max-h-80 overflow-y-auto">
            {results.map((result, i) => (
              <li key={result.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selected ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <TypeIcon type={result.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">{result.title}</span>
                      <TypeLabel type={result.type} />
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{result.subtitle}</p>
                  </div>
                  {result.meta && (
                    <span className="text-xs text-gray-400 shrink-0">{result.meta}</span>
                  )}
                  <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-opacity ${i === selected ? 'opacity-100 text-blue-500' : 'opacity-0'}`} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-500">No results for <span className="font-semibold">"{query}"</span></p>
            <p className="text-xs text-gray-400 mt-1">Try searching by name, UHID, or phone number</p>
          </div>
        )}

        {query.length < 2 && (
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded border border-gray-200 font-mono text-[10px]">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded border border-gray-200 font-mono text-[10px]">↵</kbd>
                select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded border border-gray-200 font-mono text-[10px]">ESC</kbd>
                close
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <kbd className="px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[10px]">⌘K</kbd>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
