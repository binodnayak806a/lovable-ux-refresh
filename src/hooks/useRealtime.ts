import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimeOptions {
  table: string;
  schema?: string;
  filter?: string;
  event?: RealtimeEvent;
  enabled?: boolean;
}

export function useRealtime<T extends Record<string, unknown>>(
  options: RealtimeOptions,
  callback: (payload: { new: T; old: T; eventType: RealtimeEvent }) => void
) {
  const { table, schema = 'public', filter, event = '*', enabled = true } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime_${table}_${Date.now()}`;
    let channel = supabase.channel(channelName);

    const config: Parameters<typeof channel.on>[1] = {
      event,
      schema,
      table,
      ...(filter ? { filter } : {}),
    };

    channel = channel.on(
      'postgres_changes' as Parameters<typeof channel.on>[0],
      config,
      (payload: unknown) => {
        const p = payload as { new: T; old: T; eventType: RealtimeEvent };
        callbackRef.current(p);
      }
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, schema, filter, event, enabled]);
}
