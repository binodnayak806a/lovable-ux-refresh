import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, User, BedDouble, Receipt, X, ArrowRight, Loader2,
  UserPlus, CalendarPlus, Pill, FlaskConical, FileText, Settings,
  BarChart3, Stethoscope, Clock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppSelector, useAppDispatch } from '../../store';
import { setSearchOpen } from '../../store/slices/globalSlice';
import { loadPatientContext } from '../../store/slices/globalSlice';
import { useDebounce } from '../../hooks/useDebounce';
import { useRecentPatients } from '../../hooks/useRecentPatients';

interface SearchResult {
  type: 'patient' | 'admission' | 'bill' | 'action';
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  path?: string;
  icon?: React.ElementType;
  shortcut?: string;
}

const HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

const QUICK_ACTIONS: SearchResult[] = [
  { type: 'action', id: 'new-patient', title: 'Register New Patient', subtitle: 'Open patient registration form', path: '/add-patient', icon: UserPlus, shortcut: 'Ctrl+N' },
  { type: 'action', id: 'new-appointment', title: 'Book Appointment', subtitle: 'Schedule a new appointment', path: '/appointments', icon: CalendarPlus, shortcut: 'Ctrl+⇧+A' },
  { type: 'action', id: 'doctor-queue', title: 'Doctor Queue', subtitle: 'View & manage patient queue', path: '/doctor/queue', icon: Stethoscope },
  { type: 'action', id: 'billing', title: 'Create Bill', subtitle: 'Generate a new bill', path: '/billing', icon: Receipt, shortcut: 'Ctrl+⇧+B' },
  { type: 'action', id: 'pharmacy', title: 'Pharmacy', subtitle: 'Dispense medicines', path: '/pharmacy', icon: Pill },
  { type: 'action', id: 'lab', title: 'Laboratory', subtitle: 'Lab orders & reports', path: '/lab', icon: FlaskConical },
  { type: 'action', id: 'ipd', title: 'IPD / Admissions', subtitle: 'Admit or view patients', path: '/ipd', icon: BedDouble },
  { type: 'action', id: 'reports', title: 'Reports', subtitle: 'View & export reports', path: '/reports', icon: FileText },
  { type: 'action', id: 'analytics', title: 'Analytics', subtitle: 'Charts & insights', path: '/analytics', icon: BarChart3 },
  { type: 'action', id: 'settings', title: 'Settings', subtitle: 'App configuration', path: '/settings', icon: Settings },
];

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
  const debouncedQuery = useDebounce(query, 150);

  // Filtered quick actions when no query or partial match
  const filteredActions = query.length > 0
    ? QUICK_ACTIONS.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()) || a.subtitle.toLowerCase().includes(query.toLowerCase()))
    : QUICK_ACTIONS;

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

  // Combined list: DB results first, then matching actions
  const displayList = query.length >= 2
    ? [...results, ...filteredActions.slice(0, 3)]
    : filteredActions;

  const handleSelect = async (result: SearchResult) => {
    dispatch(setSearchOpen(false));
    setQuery('');
    if (result.type === 'action' && result.path) {
      navigate(result.path);
      return;
    }
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
      setSelected((s) => Math.min(s + 1, displayList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && displayList[selected]) {
      handleSelect(displayList[selected]);
    }
  };

  const TypeIcon = ({ item }: { item: SearchResult }) => {
    if (item.icon) {
      const Icon = item.icon;
      return <Icon className="w-4 h-4 text-primary" />;
    }
    if (item.type === 'patient') return <User className="w-4 h-4 text-blue-500" />;
    if (item.type === 'admission') return <BedDouble className="w-4 h-4 text-amber-500" />;
    return <Receipt className="w-4 h-4 text-emerald-500" />;
  };

  const TypeLabel = ({ type }: { type: SearchResult['type'] }) => {
    const labels: Record<string, string> = { patient: 'Patient', admission: 'Admission', bill: 'Bill', action: 'Go to' };
    const colors: Record<string, string> = {
      patient: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      admission: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      bill: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      action: 'bg-primary/10 text-primary',
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
      <div className="relative w-full max-w-xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          {loading ? (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <input
            ref={inputRef}
            data-search-input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search patients, or type a command…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
          />
          <div className="flex items-center gap-1.5">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="w-5 h-5 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border border-border text-muted-foreground">
              ESC
            </kbd>
          </div>
        </div>

        {/* Quick actions heading when no query */}
        {query.length < 2 && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</p>
          </div>
        )}

        {displayList.length > 0 && (
          <ul className="py-1.5 max-h-80 overflow-y-auto">
            {/* Section divider between DB results and actions */}
            {query.length >= 2 && results.length > 0 && filteredActions.length > 0 && (
              <>
                {results.map((result, i) => (
                  <SearchItem key={result.id} item={result} index={i} selected={selected} onSelect={handleSelect} onHover={setSelected} TypeIcon={TypeIcon} TypeLabel={TypeLabel} />
                ))}
                <li className="px-4 py-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Go to</p>
                </li>
                {filteredActions.slice(0, 3).map((item, i) => (
                  <SearchItem key={item.id} item={item} index={results.length + i} selected={selected} onSelect={handleSelect} onHover={setSelected} TypeIcon={TypeIcon} TypeLabel={TypeLabel} />
                ))}
              </>
            )}
            {/* Only actions or only results */}
            {!(query.length >= 2 && results.length > 0 && filteredActions.length > 0) && displayList.map((item, i) => (
              <SearchItem key={item.id} item={item} index={i} selected={selected} onSelect={handleSelect} onHover={setSelected} TypeIcon={TypeIcon} TypeLabel={TypeLabel} />
            ))}
          </ul>
        )}

        {query.length >= 2 && !loading && results.length === 0 && filteredActions.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No results for <span className="font-semibold">"{query}"</span></p>
            <p className="text-xs text-muted-foreground mt-1">Try searching by name, UHID, or phone number</p>
          </div>
        )}

        <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-border font-mono text-[10px]">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-border font-mono text-[10px]">↵</kbd>
              select
            </span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px] text-muted-foreground">⌘K</kbd>
        </div>
      </div>
    </div>
  );
}

function SearchItem({ item, index, selected, onSelect, onHover, TypeIcon, TypeLabel }: {
  item: SearchResult;
  index: number;
  selected: number;
  onSelect: (r: SearchResult) => void;
  onHover: (i: number) => void;
  TypeIcon: React.FC<{ item: SearchResult }>;
  TypeLabel: React.FC<{ type: SearchResult['type'] }>;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(item)}
        onMouseEnter={() => onHover(index)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          index === selected ? 'bg-primary/5' : 'hover:bg-muted/50'
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <TypeIcon item={item} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{item.title}</span>
            <TypeLabel type={item.type} />
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
        </div>
        {item.shortcut && (
          <kbd className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground shrink-0">
            {item.shortcut}
          </kbd>
        )}
        {item.meta && !item.shortcut && (
          <span className="text-xs text-muted-foreground shrink-0">{item.meta}</span>
        )}
        <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-opacity ${index === selected ? 'opacity-100 text-primary' : 'opacity-0'}`} />
      </button>
    </li>
  );
}
