import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  ArrowDownToLine,
  FileText,
  ClipboardList,
  Trash2,
  RotateCcw,
  TrendingUp,
  Receipt,
  ShoppingCart,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  Sparkles,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import './Sidebar.css';

export interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isLocked?: boolean;
}

interface SidebarItem {
  path: string;
  label: string;
  icon: React.ElementType;
  requires?: keyof ReturnType<typeof usePermissions>;
}

const mainMenuItems: SidebarItem[] = [
  { path: '/tong-quan', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/products', label: 'Sản phẩm', icon: Package },
  { path: '/import', label: 'Nhập hàng', icon: ArrowDownToLine, requires: 'canManageInventory' },
  { path: '/inventory-count', label: 'Kiểm kê', icon: ClipboardList, requires: 'canManageInventory' },
  { path: '/inventory/disposals', label: 'Xuất hủy', icon: Trash2, requires: 'canManageInventory' },
  { path: '/orders', label: 'Đơn hàng', icon: FileText },
  { path: '/return-orders', label: 'Trả hàng', icon: RotateCcw },
  { path: '/customers', label: 'Khách hàng', icon: Users },
  { path: '/suppliers', label: 'Nhà cung cấp', icon: Truck, requires: 'canManageInventory' },
  { path: '/reports', label: 'Báo cáo', icon: TrendingUp, requires: 'canViewReports' },
  { path: '/tax', label: 'Tính thuế', icon: Receipt, requires: 'canViewReports' },
  { path: '/pos', label: 'Bán hàng', icon: ShoppingCart, requires: 'canCreateOrder' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isLocked }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const permissions = usePermissions();
  const visibleMenuItems = mainMenuItems.filter(item => !item.requires || permissions[item.requires]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setIsUserMenuOpen(false);
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActiveLink = (path: string) => {
    if (path === '/tong-quan' && location.pathname !== '/tong-quan') return false;
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      e.stopPropagation();
      alert('Phiếu trả hàng đang mở. Vui lòng hoàn tất hoặc huỷ bỏ để thực hiện hoạt động khác.');
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`app-sidebar-overlay ${isOpen ? 'app-sidebar-overlay--visible' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside className={`app-sidebar ${isOpen ? 'app-sidebar--open' : ''}`} aria-label="Main navigation">
        {/* Logo */}
        <div className="app-sidebar__header">
          <Link to="/tong-quan" className="app-sidebar__logo" onClick={handleNavClick}>
            <div className="app-sidebar__logo-icon">
              <ShoppingCart className="app-sidebar__logo-icon-svg" />
            </div>
            <span className="app-sidebar__logo-text">VietSales Pro</span>
          </Link>
          <button
            className="app-sidebar__mobile-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {isOpen ? <X className="app-sidebar__mobile-toggle-icon" /> : <Menu className="app-sidebar__mobile-toggle-icon" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="app-sidebar__nav">
          <ul className="app-sidebar__list">
            {visibleMenuItems.map(item => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={handleNavClick}
                    className={`app-sidebar__item ${isActive ? 'app-sidebar__item--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="app-sidebar__item-icon" />
                    <span className="app-sidebar__item-label">{item.label}</span>
                    {isActive && <span className="app-sidebar__item-active-dot" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User menu */}
        <div className="app-sidebar__footer" ref={userMenuRef}>
          <button
            className="app-sidebar__user"
            onClick={() => setIsUserMenuOpen(prev => !prev)}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
          >
            <div className="app-sidebar__user-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="app-sidebar__user-info">
              <p className="app-sidebar__user-name">{user?.email?.split('@')[0] || 'Admin'}</p>
              <p className="app-sidebar__user-role">Quản lý cửa hàng</p>
            </div>
            <ChevronDown className={`app-sidebar__user-chevron ${isUserMenuOpen ? 'app-sidebar__user-chevron--open' : ''}`} />
          </button>

          {isUserMenuOpen && (
            <div className="app-sidebar__user-menu">
              <div className="app-sidebar__user-menu-header">
                <p className="app-sidebar__user-menu-email">{user?.email || 'Admin User'}</p>
                <p className="app-sidebar__user-menu-role">Quản lý cửa hàng</p>
              </div>
              <Link
                to="/profile"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setIsOpen(false);
                }}
                className="app-sidebar__user-menu-item"
              >
                <div className="app-sidebar__user-menu-item-icon">
                  <UserIcon className="app-sidebar__user-menu-item-svg" />
                </div>
                Hồ sơ cá nhân
              </Link>
              {permissions.canManageUsers && (
              <Link
                to="/settings"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setIsOpen(false);
                }}
                className="app-sidebar__user-menu-item"
              >
                <div className="app-sidebar__user-menu-item-icon">
                  <SettingsIcon className="app-sidebar__user-menu-item-svg" />
                </div>
                Cài đặt hệ thống
              </Link>
              )}
              <Link
                to="/gioi-thieu"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setIsOpen(false);
                }}
                className="app-sidebar__user-menu-item"
              >
                <div className="app-sidebar__user-menu-item-icon">
                  <Sparkles className="app-sidebar__user-menu-item-svg" />
                </div>
                Giới thiệu phần mềm
              </Link>
              <div className="app-sidebar__user-menu-divider" />
              <button
                onClick={handleLogout}
                className="app-sidebar__user-menu-item app-sidebar__user-menu-item--danger"
              >
                <div className="app-sidebar__user-menu-item-icon app-sidebar__user-menu-item-icon--danger">
                  <LogOut className="app-sidebar__user-menu-item-svg" />
                </div>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
