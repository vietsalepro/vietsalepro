import React, { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { Announcement } from '../types/announcement';
import { getCurrentAnnouncementsForTenant } from '../services/announcementService';

const STORAGE_KEY = 'dismissed_announcements';

const getDismissed = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const setDismissed = (map: Record<string, string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // best-effort
  }
};

export default function AnnouncementBanner() {
  const { tenant } = useTenant();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissedMap, setDismissedMap] = useState<Record<string, string>>(getDismissed());

  useEffect(() => {
    if (!tenant?.id) {
      setAnnouncements([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCurrentAnnouncementsForTenant(tenant.id);
        if (!cancelled) setAnnouncements(data);
      } catch {
        // best-effort: không hiển thị banner nếu lỗi
        if (!cancelled) setAnnouncements([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [tenant?.id]);

  const visible = announcements.filter(a => {
    const key = `${tenant?.id || 'unknown'}:${a.id}`;
    return dismissedMap[key] !== a.updatedAt;
  });

  if (loading || visible.length === 0) return null;

  const handleDismiss = (a: Announcement) => {
    const key = `${tenant?.id || 'unknown'}:${a.id}`;
    const next = { ...dismissedMap, [key]: a.updatedAt || a.createdAt || '1' };
    setDismissedMap(next);
    setDismissed(next);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col gap-2 p-3 pointer-events-none">
      {visible.map(a => (
        <div
          key={a.id}
          className="pointer-events-auto mx-auto w-full max-w-4xl bg-blue-600 text-white rounded-lg shadow-lg p-4"
        >
          <div className="flex items-start gap-3">
            <Megaphone className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{a.title}</h4>
              <p className="text-sm text-blue-100 whitespace-pre-wrap">{a.content}</p>
            </div>
            <button
              onClick={() => handleDismiss(a)}
              className="p-1 text-blue-100 hover:text-white hover:bg-blue-700 rounded-lg flex-shrink-0"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
