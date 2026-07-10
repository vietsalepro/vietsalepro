import React from 'react';
import { LayoutDashboard, ShoppingCart, FileText, Users, UserCog, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../hooks/useTenant';

interface BottomNavProps {
  onMenuClick: () => void;
  isLocked?: boolean;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  highlight?: true;
}

export function BottomNav(props: BottomNavProps) {
  const handleCaptureClick = (e: React.MouseEvent) => {
    if (props.isLocked) {
      e.preventDefault();
      e.stopPropagation();
      alert('Phiếu trả hàng đang mở. Vui lòng hoàn tất hoặc huỷ bỏ để thực hiện hoạt động khác.');
    }
  };
  const location = useLocation();
  const permissions = usePermissions();
  const { tenant } = useTenant();
  const canAccessMembers = permissions.canManageUsers && tenant?.plan === 'vip';

  const navItems: NavItem[] = [
    { path: '/tong-quan', label: 'Tổng quan', icon: LayoutDashboard },
    { path: '/orders', label: 'Đơn hàng', icon: FileText },
    ...(permissions.canCreateOrder ? [{ path: '/pos', label: 'Bán hàng', icon: ShoppingCart, highlight: true as const }] : []),
    { path: '/customers', label: 'Khách hàng', icon: Users },
    ...(canAccessMembers ? [{ path: '/members', label: 'Thành viên', icon: UserCog }] : []),
  ];

  const isActiveLink = (path: string) => {
    if (path === '/tong-quan' && location.pathname !== '/tong-quan') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="m-bottom-nav md:hidden" aria-label="Bottom navigation" onClickCapture={handleCaptureClick}>
      <div className="flex items-stretch justify-around gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveLink(item.path);

          if (item.highlight) {
            // FAB - Bán hàng (giữ vị trí thứ 3)
            return (
              <Link
                key={item.path}
                to={item.path}
                className="m-fab"
                aria-label={item.label}
              >
                <div className="m-fab-btn">
                  <Icon className="w-7 h-7" strokeWidth={2.4} />
                </div>
                <span className="m-fab-label">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={'m-nav-item' + (isActive ? ' m-nav-item-active' : '')}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={'transition-transform duration-200 ' + (isActive ? 'w-6 h-6 scale-110' : 'w-5 h-5')}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span
                className={'text-[10px] tracking-tight ' + (isActive ? 'font-bold' : 'font-medium')}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Nút thứ 5: Cài đặt — chỉ admin quản lý user / hệ thống */}
        {permissions.canManageUsers && (
        <button
          type="button"
          onClick={props.onMenuClick}
          className="m-nav-item"
          aria-label="Cài đặt"
        >
          <Settings className="w-5 h-5" strokeWidth={2} />
          <span className="text-[10px] font-medium tracking-tight">Cài đặt</span>
        </button>
        )}
      </div>
    </nav>
  );
}

export default BottomNav;
