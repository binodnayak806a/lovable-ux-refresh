import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineStore } from '../lib/offlineStore';
import { supabase } from '../lib/supabase';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await offlineStore.getPendingCount();
      setPendingCount(count);
    } catch {
      // IndexedDB unavailable
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  const syncPendingRecords = useCallback(async (): Promise<number> => {
    if (syncingRef.current) return 0;
    syncingRef.current = true;
    setSyncing(true);
    let syncedCount = 0;
    try {
      const records = await offlineStore.getPendingRecords();
      if (records.length === 0) return 0;

      const syncedIds: number[] = [];

      for (const record of records) {
        try {
          const { error } = await supabase
            .from(record.table)
            .insert(record.data as never);

          if (!error && record.id !== undefined) {
            syncedIds.push(record.id);
            syncedCount++;
          }
        } catch {
          // skip failed records, will retry next time
        }
      }

      if (syncedIds.length > 0) {
        await offlineStore.clearSynced(syncedIds);
      }
      await refreshPendingCount();
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
    return syncedCount;
  }, [refreshPendingCount]);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncingRef.current) {
      syncPendingRecords();
    }
    // only trigger on isOnline change, not pendingCount to avoid loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  return {
    isOnline,
    pendingCount,
    syncing,
    syncPendingRecords,
    refreshPendingCount,
  };
}
