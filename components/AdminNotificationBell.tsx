import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, Trash2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useAdminRealtime } from '../hooks/useAdminRealtime';
import { AdminEvent, AdminEventSeverity } from '../types/notification';

const severityIcon = (severity: AdminEventSeverity) => {
  switch (severity) {
    case 'error': return <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
    default: return <Info className="w-4 h-4 text-blue-600 shrink-0" />;
  }
};

const severityClass = (severity: AdminEventSeverity) => {
  switch (severity) {
    case 'error': return 'border-l-4 border-red-500 bg-red-50';
    case 'warning': return 'border-l-4 border-amber-500 bg-amber-50';
    default: return 'border-l-4 border-blue-500 bg-blue-50';
  }
};

const formatDate = (d?: string) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('vi-VN');
};

export default function AdminNotificationBell() {
  const { events, unreadCount, markAsRead, clearAll } = useAdminRealtime();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Auto-scroll to newest notification when dropdown is open.
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [open, events.length]);

  const handleMarkAsRead = (e: React.MouseEvent, event: AdminEvent) => {
    e.stopPropagation();
    markAsRead(event.id);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Thông báo"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full border border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Thông báo hệ thống</h3>
            <div className="flex items-center gap-1">
              {events.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearAll()}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                  title="Xóa tất cả"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div ref={listRef} className="max-h-80 overflow-y-auto">
            {events.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Không có thông báo mới.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!event.read ? 'bg-gray-50/50' : ''}`}
                  >
                    <div className={`flex gap-3 p-2 rounded-lg ${severityClass(event.severity)}`}>
                      {severityIcon(event.severity)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 break-words">{event.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(event.createdAt)}</p>
                        {!event.read && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(e, event)}
                            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Check className="w-3 h-3" /> Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
