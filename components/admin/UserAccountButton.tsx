import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export interface UserAccountButtonProps {
  /** Name of the current account to display under the user email */
  currentAccountName?: string;
}

export function UserAccountButton({ currentAccountName }: UserAccountButtonProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const initial = (user.email?.[0] || user.user_metadata?.full_name?.[0] || 'U').toUpperCase();
  const displayName = user.user_metadata?.full_name || user.email || 'Người dùng';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold shrink-0">
          {initial}
        </div>
        <div className="hidden sm:block text-left min-w-0">
          <div className="text-sm font-medium text-gray-800 max-w-[140px] truncate">{displayName}</div>
          {currentAccountName && (
            <div className="text-xs text-gray-500 max-w-[140px] truncate">{currentAccountName}</div>
          )}
        </div>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          <button
            type="button"
            onClick={() => { setOpen(false); navigate('/profile'); }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
          >
            <User size={14} /> Hồ sơ
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); signOut(); }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600 flex items-center gap-2"
          >
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
