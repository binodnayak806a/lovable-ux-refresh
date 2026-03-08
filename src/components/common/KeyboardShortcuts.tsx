import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store';
import { setSearchOpen } from '../../store/slices/globalSlice';
import { Keyboard } from 'lucide-react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  label: string;
  action: () => void;
  display: string;
}

export default function KeyboardShortcuts() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showHints, setShowHints] = useState(false);

  const shortcuts: Shortcut[] = [
    { key: 'n', ctrl: true, label: 'New Patient', display: 'Ctrl+N', action: () => navigate('/add-patient') },
    { key: 'b', ctrl: true, shift: true, label: 'Billing', display: 'Ctrl+⇧+B', action: () => navigate('/billing') },
    { key: 'a', ctrl: true, shift: true, label: 'Appointments', display: 'Ctrl+⇧+A', action: () => navigate('/appointments') },
    { key: 'd', ctrl: true, shift: true, label: 'Dashboard', display: 'Ctrl+⇧+D', action: () => navigate('/dashboard') },
    { key: 'p', ctrl: true, shift: true, label: 'Patients', display: 'Ctrl+⇧+P', action: () => navigate('/patients') },
    { key: 'k', ctrl: true, label: 'Search', display: '⌘K', action: () => dispatch(setSearchOpen(true)) },
    { key: '/', ctrl: false, label: 'Show Shortcuts', display: '?', action: () => setShowHints((v) => !v) },
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      // ? key for hints toggle
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowHints((v) => !v);
        return;
      }

      for (const s of shortcuts) {
        if (s.key === '/') continue; // handled above
        const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
        if (e.key.toLowerCase() === s.key && ctrlMatch && shiftMatch) {
          // Skip Ctrl+K (already handled in GlobalSearch)
          if (s.key === 'k') return;
          e.preventDefault();
          s.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);

  if (!showHints) {
    return (
      <button
        onClick={() => setShowHints(true)}
        className="fixed bottom-4 right-4 z-40 h-9 w-9 rounded-xl bg-card border border-border shadow-elevated flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-card border border-border rounded-2xl shadow-elevated p-4 w-64 animate-scale-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Keyboard className="w-3.5 h-3.5" />
          Keyboard Shortcuts
        </h3>
        <button
          onClick={() => setShowHints(false)}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          ESC
        </button>
      </div>
      <div className="space-y-1.5">
        {shortcuts.filter(s => s.key !== '/').map((s) => (
          <div key={s.display} className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground">
              {s.display}
            </kbd>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Toggle hints</span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground">?</kbd>
        </div>
      </div>
    </div>
  );
}
