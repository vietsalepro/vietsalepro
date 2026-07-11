import React from 'react';
import { NavLink } from 'react-router-dom';
import { CreditCard, Bell, Shield, Palette, Users, Database } from 'lucide-react';

const SETTINGS_LINKS = [
  { to: '/admin/settings/general', label: 'Chung', icon: <Palette size={16} /> },
  { to: '/admin/settings/billing', label: 'Thanh toán', icon: <CreditCard size={16} /> },
  { to: '/admin/settings/notifications', label: 'Thông báo', icon: <Bell size={16} /> },
  { to: '/admin/settings/security', label: 'Bảo mật', icon: <Shield size={16} /> },
  { to: '/admin/settings/members', label: 'Thành viên', icon: <Users size={16} /> },
  { to: '/admin/settings/storage', label: 'Lưu trữ', icon: <Database size={16} /> },
];

export function AdminSettingsNav() {
  return (
    <nav className="flex flex-wrap gap-2 mb-6" aria-label="Cài đặt hệ thống">
      {SETTINGS_LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`
          }
        >
          {link.icon}
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
