import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store';
import { setSearchOpen } from '../../store/slices/globalSlice';

export default function KeyboardShortcuts() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      // ? key — open command palette instead of separate panel
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        dispatch(setSearchOpen(true));
        return;
      }

      // Ctrl+N — New patient
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault();
        navigate('/add-patient');
        return;
      }

      // Ctrl+Shift+A — Appointments
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        navigate('/appointments');
        return;
      }

      // Ctrl+Shift+B — Billing
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        navigate('/billing');
        return;
      }

      // Ctrl+Shift+D — Dashboard
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        navigate('/dashboard');
        return;
      }

      // Ctrl+Shift+P — Patients
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        navigate('/patients');
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, dispatch]);

  // No visible UI — shortcuts are now shown in the command palette
  return null;
}
