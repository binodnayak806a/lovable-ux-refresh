import { useState, useCallback, useEffect } from 'react';

interface RecentPatient {
  id: string;
  name: string;
  uhid: string;
  timestamp: number;
}

const STORAGE_KEY = 'hms_recent_patients';
const MAX_RECENT = 8;

export function useRecentPatients() {
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  });

  const addRecentPatient = useCallback((patient: { id: string; name: string; uhid: string }) => {
    setRecentPatients(prev => {
      const filtered = prev.filter(p => p.id !== patient.id);
      const updated = [{ ...patient, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecentPatients([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { recentPatients, addRecentPatient, clearRecents };
}
