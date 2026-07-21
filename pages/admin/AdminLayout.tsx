import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Store, Users, AlertTriangle, ShieldCheck, Settings, CreditCard, Activity, UserPlus, BarChart3,
} from 'lucide-react';
import AdminShell from '../../components/AdminShell';
import type { SidebarSection } from '../../components/AdminSidebar';

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    label: 'Dashboard',
    items: [
      { id: 'overview', label: 'Tổng quan', icon: <Home size={16} /> },
      { id: 'tenants', label: 'Cửa hàng', icon: <Store size={16} /> },
      { id: 'members', label: 'Thành viên', icon: <Users size={16} /> },
      { id: 'audit', label: 'Audit log', icon: <AlertTriangle size={16} /> },
      { id: 'security', label: 'Bảo mật', icon: <ShieldCheck size={16} /> },
      { id: 'settings', label: 'Cài đặt', icon: <Settings size={16} /> },
      { id: 'billing', label: 'Thanh toán', icon: <CreditCard size={16} /> },
      { id: 'invoices', label: 'Hóa đơn', icon: <CreditCard size={16} /> },
      { id: 'payments', label: 'Thanh toán', icon: <CreditCard size={16} /> },
      { id: 'analytics', label: 'Phân tích', icon: <BarChart3 size={16} /> },
      { id: 'health', label: 'Health', icon: <Activity size={16} /> },
      { id: 'compliance', label: 'Tuân thủ', icon: <ShieldCheck size={16} /> },
      { id: 'onboarding', label: 'Onboarding', icon: <UserPlus size={16} /> },
    ],
  },
];

const ADMIN_ROUTE_MAP: Record<string, string> = {
  overview: '/admin/overview',
  tenants: '/admin/tenants',
  members: '/admin/members',
  invitations: '/admin/invitations/accept',
  audit: '/admin/audit',
  security: '/admin/security',
  settings: '/admin/settings',
  billing: '/admin/billing',
  invoices: '/admin/billing/invoices',
  payments: '/admin/billing/payments',
  analytics: '/admin/analytics',
  health: '/admin/health',
  compliance: '/admin/compliance',
  onboarding: '/admin/onboarding',
};

const PAGE_TITLES: Record<string, string> = {
  overview: 'Tổng quan',
  tenants: 'Cửa hàng',
  members: 'Thành viên',
  invitations: 'Lời mời',
  audit: 'Audit log',
  security: 'Bảo mật',
  settings: 'Cài đặt',
  billing: 'Thanh toán',
  invoices: 'Hóa đơn',
  payments: 'Thanh toán',
  analytics: 'Phân tích',
  health: 'Health',
  compliance: 'Tuân thủ',
  onboarding: 'Onboarding',
};

function getActiveId(pathname: string): string {
  if (!pathname.startsWith('/admin')) return 'overview';
  const rest = pathname.slice('/admin'.length).replace(/^\//, '');
  if (rest.startsWith('tenants/')) return 'tenants';
  if (rest === 'billing/invoices') return 'invoices';
  if (rest === 'billing/payments') return 'payments';
  return rest || 'overview';
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeId = getActiveId(location.pathname);

  return (
    <AdminShell
      sidebarSections={SIDEBAR_SECTIONS}
      activeSidebarItem={activeId}
      onSidebarNavigate={(id) => {
        const path = ADMIN_ROUTE_MAP[id];
        if (path) navigate(path);
      }}
      pageTitle={PAGE_TITLES[activeId] || 'Quản trị hệ thống'}
    >
      <Outlet />
    </AdminShell>
  );
}
