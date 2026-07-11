import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AdminEvent } from '../types/notification';

export interface UseAdminRealtimeOptions {
  onEvent?: (event: AdminEvent) => void;
  filterTypes?: string[];
  maxNotifications?: number;
}

export interface UseAdminRealtimeReturn {
  events: AdminEvent[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

export function useAdminRealtime(options: UseAdminRealtimeOptions = {}): UseAdminRealtimeReturn {
  const { onEvent, filterTypes, maxNotifications = 50 } = options;
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_events' },
        (payload) => {
          const row = payload.new as Record<string, any>;
          const event: AdminEvent = {
            id: row.id,
            type: row.type,
            severity: row.severity,
            message: row.message,
            metadata: row.metadata ?? {},
            createdAt: row.created_at,
            read: false,
          };

          if (filterTypes && filterTypes.length > 0 && !filterTypes.includes(event.type)) {
            return;
          }

          setEvents((prev) => {
            const next = [event, ...prev];
            // ponytail: giới hạn số lượng để tránh DOM/memory bloat.
            if (next.length > maxNotifications) next.length = maxNotifications;
            return next;
          });

          onEventRef.current?.(event);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterTypes, maxNotifications]);

  const markAsRead = useCallback((id: string) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)));
  }, []);

  const clearAll = useCallback(() => setEvents([]), []);

  const unreadCount = events.filter((e) => !e.read).length;

  return { events, unreadCount, markAsRead, clearAll };
}
