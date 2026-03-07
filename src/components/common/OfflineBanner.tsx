import { WifiOff, RefreshCw, CloudOff, Loader2 } from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';
import { useToast } from '../../hooks/useToast';
import { useEffect, useRef } from 'react';

export default function OfflineBanner() {
  const { isOnline, pendingCount, syncing, syncPendingRecords } = useOffline();
  const { toast } = useToast();
  const prevOnlineRef = useRef(isOnline);

  useEffect(() => {
    if (prevOnlineRef.current === false && isOnline && pendingCount > 0) {
      syncPendingRecords().then((count) => {
        if (count > 0) {
          toast('Synced Successfully', {
            description: `${count} record(s) synced to server`,
            type: 'success',
          });
        }
      });
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, pendingCount, syncPendingRecords, toast]);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`px-4 py-2 text-sm font-medium flex items-center justify-between ${
        !isOnline
          ? 'bg-amber-500 text-white'
          : 'bg-blue-500 text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You are offline -- limited mode. Only patient registration and sticker printing available.</span>
          </>
        ) : (
          <>
            <CloudOff className="w-4 h-4" />
            <span>{pendingCount} pending record(s) waiting to sync</span>
          </>
        )}
      </div>
      {isOnline && pendingCount > 0 && (
        <button
          onClick={() => syncPendingRecords()}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors text-xs font-medium"
        >
          {syncing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Sync Now
        </button>
      )}
    </div>
  );
}
