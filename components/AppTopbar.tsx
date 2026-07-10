import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Package, Users, Truck, ShoppingCart, ArrowDownToLine, FileText, Menu, X, LogOut, User as UserIcon, Settings as SettingsIcon, Receipt, ChevronDown, TrendingUp, Sparkles, RotateCcw, ClipboardList, Trash2, ArrowLeftRight, BookOpen, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../hooks/useTenant';
import { usePermissions } from '../hooks/usePermissions';
import './AppTopbar.css';

interface AppTopbarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isLocked?: boolean;
}

type MenuItem = { path: string; label: string; icon: React.ElementType; requires?: keyof ReturnType<typeof usePermissions> };

type MenuGroup = { label: string; icon: React.ElementType; children: MenuItem[] };

// Desktop dropdown menu groups
const desktopMenuGroups: MenuGroup[] = [
  {
    label: 'Hàng Hóa',
    icon: Package,
    children: [
      { path: '/products', label: 'Danh mục sản phẩm', icon: Package },
      { path: '/import', label: 'Nhập hàng', icon: ArrowDownToLine, requires: 'canManageInventory' },
      { path: '/inventory-count', label: 'Kiểm kê', icon: ClipboardList, requires: 'canManageInventory' },
      { path: '/inventory/disposals', label: 'Xuất hủy', icon: Trash2, requires: 'canManageInventory' },
      { path: '/inventory/supplier-exchanges', label: 'Đổi trả hàng NCC', icon: ArrowLeftRight, requires: 'canManageInventory' },
      { path: '/stock-ledger', label: 'Sổ cái kho', icon: BookOpen, requires: 'canManageInventory' },
    ],
  },
  {
    label: 'Đơn Hàng',
    icon: FileText,
    children: [
      { path: '/orders', label: 'Đơn hàng', icon: FileText },
      { path: '/return-orders', label: 'Trả hàng', icon: RotateCcw },
    ],
  },
  {
    label: 'Đối Tác',
    icon: Users,
    children: [
      { path: '/customers', label: 'Khách hàng', icon: Users },
      { path: '/suppliers', label: 'Nhà cung cấp', icon: Truck, requires: 'canManageInventory' },
    ],
  },
  {
    label: 'Báo Cáo',
    icon: TrendingUp,
    children: [
      { path: '/reports', label: 'Báo cáo', icon: TrendingUp, requires: 'canViewReports' },
      { path: '/tax', label: 'Tính thuế', icon: Receipt, requires: 'canViewReports' },
      { path: '/audit-log', label: 'Nhật ký hoạt động', icon: Shield, requires: 'canViewAuditLogs' },
    ],
  },
  {
    label: 'Thành Viên',
    icon: Users,
    children: [
      { path: '/members', label: 'Quản lý thành viên', icon: Users, requires: 'canManageUsers' },
    ],
  },
];

// Mobile flat menu
const mobileMenuItems: MenuItem[] = [
  { path: '/tong-quan', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/products', label: 'Hàng hoá', icon: Package },
  { path: '/customers', label: 'Khách hàng', icon: Users },
  { path: '/suppliers', label: 'Nhà cung cấp', icon: Truck, requires: 'canManageInventory' },
  { path: '/import', label: 'Nhập hàng', icon: ArrowDownToLine, requires: 'canManageInventory' },
  { path: '/orders', label: 'Đơn hàng', icon: FileText },
  { path: '/tax', label: 'Tính thuế', icon: Receipt, requires: 'canViewReports' },
  { path: '/return-orders', label: 'Trả hàng', icon: RotateCcw },
  { path: '/inventory/disposals', label: 'Xuất hủy', icon: Trash2, requires: 'canManageInventory' },
  { path: '/inventory/supplier-exchanges', label: 'Đổi trả hàng NCC', icon: ArrowLeftRight, requires: 'canManageInventory' },
  { path: '/stock-ledger', label: 'Sổ kho', icon: BookOpen, requires: 'canManageInventory' },
  { path: '/reports', label: 'Báo cáo', icon: TrendingUp, requires: 'canViewReports' },
  { path: '/audit-log', label: 'Nhật ký hoạt động', icon: Shield, requires: 'canViewAuditLogs' },
  { path: '/members', label: 'Quản lý thành viên', icon: Users, requires: 'canManageUsers' },
];

interface DropdownGroupProps {
  label: string;
  icon: React.ElementType;
  items: { path: string; label: string; icon: React.ElementType }[];
  currentPath: string;
}

const DropdownGroup: React.FC<DropdownGroupProps> = ({ label, icon: Icon, items, currentPath }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isGroupActive = items.some(c => currentPath.startsWith(c.path));


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="app-topbar__dropdown">
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`app-topbar__dropdown-trigger ${isGroupActive ? 'app-topbar__dropdown-trigger--active' : ''}`}
      >
        <Icon size={16} className="app-topbar__dropdown-icon" />
        {label}
        <ChevronDown size={14} className={`app-topbar__dropdown-chev ${open ? 'app-topbar__dropdown-chev--open' : ''}`} />
        {/* Active indicator dot */}
        {isGroupActive && (
          <span className="app-topbar__dropdown-dot" />
        )}
      </button>

      {open && (
        <div className="app-topbar__dropdown-menu">
          {items.map(item => {
            const ItemIcon = item.icon;
            const isActive = currentPath.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`app-topbar__dropdown-item ${isActive ? 'app-topbar__dropdown-item--active' : ''}`}
              >
                <ItemIcon size={16} className="app-topbar__dropdown-item-icon" />
                {item.label}
                {isActive && <span className="app-topbar__dropdown-item-dot" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const AppTopbar: React.FC<AppTopbarProps> = ({ isOpen, setIsOpen, isLocked }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const permissions = usePermissions();
  const { tenant } = useTenant();

  const canAccessMembers = permissions.canManageUsers && tenant?.plan === 'vip';
  const filterMenuItems = (items: MenuItem[]) => items.filter(item => {
    if (item.requires && !permissions[item.requires]) return false;
    if (item.path === '/members') return canAccessMembers;
    return true;
  });
  const visibleDesktopGroups = desktopMenuGroups
    .map(group => ({ ...group, children: filterMenuItems(group.children) }))
    .filter(group => group.children.length > 0);
  const visibleMobileItems = filterMenuItems(mobileMenuItems);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleCaptureClick = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      e.stopPropagation();
      alert('Phiếu trả hàng đang mở. Vui lòng hoàn tất hoặc huỷ bỏ để thực hiện hoạt động khác.');
    }
  };

  // Close user dropdown when clicking outside
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

    }
  };

  const isActiveLink = (path: string) => {
    if (path === '/tong-quan' && location.pathname !== '/tong-quan') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="app-topbar" onClickCapture={handleCaptureClick}>
      {/* Subtle bottom gradient line */}
      <div className="app-topbar__gradient-line" />

      <div className="app-topbar__inner">
        {/* ============================================
            LOGO - Animated gradient
            ============================================ */}
        <Link to="/tong-quan" className="app-topbar__logo">
          <div className="app-topbar__logo-icon-wrap">
            <div className="app-topbar__logo-icon">
              <ShoppingCart size={20} />
            </div>
            {/* Active pulse ring */}
            <div className="app-topbar__logo-pulse" />
          </div>
          <span className="app-topbar__logo-text">
            VietSales Pro
          </span>
        </Link>

        {/* ============================================
            DESKTOP NAVIGATION - Dropdown groups
            ============================================ */}
        <nav className="app-topbar__nav">
          {/* Tổng quan — direct link, no dropdown */}
          <Link
            to="/tong-quan"
            className={`app-topbar__nav-link ${isActiveLink('/tong-quan') ? 'app-topbar__nav-link--active' : ''}`}
          >
            <LayoutDashboard size={16} className="app-topbar__nav-link-icon" />
            Tổng quan
            {isActiveLink('/tong-quan') && (
              <span className="app-topbar__nav-link-dot" />
            )}
          </Link>

          {/* Dropdown groups */}
          {visibleDesktopGroups.map(group => (
            <DropdownGroup
              key={group.label}
              label={group.label}
              icon={group.icon}
              items={group.children}
              currentPath={location.pathname}
            />
          ))}
        </nav>

        {/* ============================================
            RIGHT SECTION - POS + User
            ============================================ */}
        <div className="app-topbar__right">
          {/* Desktop POS Button - Featured */}
          {permissions.canCreateOrder && (
          <Link
            to="/pos"
            className={`app-topbar__pos ${location.pathname.startsWith('/pos') ? 'app-topbar__pos--active' : ''}`}
          >
            {/* Animated shimmer overlay */}
            <div className="app-topbar__pos-shimmer" />
            <div className="app-topbar__pos-icon-wrap">
              <ShoppingCart size={20} />
              {!location.pathname.startsWith('/pos') && (
                <span className="app-topbar__pos-ping" />
              )}
            </div>
            <span className="app-topbar__pos-label">Bán hàng</span>
            <TrendingUp size={16} className="app-topbar__pos-trend" />
          </Link>
          )}

          {/* User Dropdown */}
          <div ref={userMenuRef} className="app-topbar__user">
            <button
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className="app-topbar__user-trigger"
            >
              <div className="app-topbar__user-info">
                <p className="app-topbar__user-name">
                  {user?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="app-topbar__user-role">Quản lý cửa hàng</p>
              </div>
              <div className="app-topbar__user-avatar-wrap">
                <div className="app-topbar__user-avatar">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                {/* Online status dot */}
                <div className="app-topbar__user-status" />
              </div>
              <ChevronDown size={16} className={`app-topbar__user-chev ${isUserMenuOpen ? 'app-topbar__user-chev--open' : ''}`} />
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="app-topbar__user-menu">
                {/* User info header */}
                <div className="app-topbar__user-menu-header">
                  <p className="app-topbar__user-menu-email">{user?.email || 'Admin User'}</p>
                  <p className="app-topbar__user-menu-role">Quản lý cửa hàng</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="app-topbar__user-menu-item"
                >
                  <div className="app-topbar__user-menu-icon">
                    <UserIcon size={16} />
                  </div>
                  Hồ sơ cá nhân
                </Link>
                {permissions.canManageUsers && (
                <Link
                  to="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="app-topbar__user-menu-item"
                >
                  <div className="app-topbar__user-menu-icon">
                    <SettingsIcon size={16} />
                  </div>
                  Cài đặt hệ thống
                </Link>
                )}
                <Link
                  to="/gioi-thieu"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="app-topbar__user-menu-item"
                >
                  <div className="app-topbar__user-menu-icon">
                    <Sparkles size={16} />
                  </div>
                  Giới thiệu phần mềm
                </Link>
                <div className="app-topbar__user-menu-divider"></div>
                <button
                  onClick={handleLogout}
                  className="app-topbar__user-menu-item app-topbar__user-menu-item--danger"
                >
                  <div className="app-topbar__user-menu-icon app-topbar__user-menu-icon--danger">
                    <LogOut size={16} />
                  </div>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>

          {/* Mobile POS Button */}
          {permissions.canCreateOrder && (
          <Link
            to="/pos"
            onClick={() => setIsOpen(false)}
            className="app-topbar__pos-mobile"
          >
            <ShoppingCart size={16} />
            <span>Bán hàng</span>
          </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="app-topbar__menu-toggle"
            aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ============================================
          MOBILE NAVIGATION - Slide down + Glass
          ============================================ */}
      {isOpen && (
        <div className="app-topbar__mobile">
          <nav className="app-topbar__mobile-nav">
            {visibleMobileItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`app-topbar__mobile-link ${isActive ? 'app-topbar__mobile-link--active' : ''}`}
                >
                   <div className="app-topbar__mobile-link-icon-wrap">
                    <Icon size={20} />
                  </div>
                  <span className="app-topbar__mobile-link-label">{item.label}</span>
                  {isActive && (
                    <div className="app-topbar__mobile-link-dot" />
                  )}
                </Link>
              );
            })}

            {/* Mobile user section */}
            <div className="app-topbar__mobile-user">
              <div className="app-topbar__mobile-user-header">
                <div className="app-topbar__mobile-user-avatar-wrap">
                  <div className="app-topbar__mobile-user-avatar">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="app-topbar__mobile-user-status" />
                </div>
                <div>
                  <p className="app-topbar__mobile-user-name">{user?.email || 'Admin User'}</p>
                  <p className="app-topbar__mobile-user-role">Quản lý cửa hàng</p>
                </div>
              </div>
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="app-topbar__mobile-user-link"
              >
                <div className="app-topbar__mobile-user-link-icon">
                  <UserIcon size={20} />
                </div>
                Hồ sơ cá nhân
              </Link>
              <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="app-topbar__mobile-user-link"
              >
                <div className="app-topbar__mobile-user-link-icon">
                  <SettingsIcon size={20} />
                </div>
                Cài đặt hệ thống
              </Link>
              <button
                onClick={handleLogout}
                className="app-topbar__mobile-user-logout"
              >
                <div className="app-topbar__mobile-user-logout-icon">
                  <LogOut size={20} />
                </div>
                Đăng xuất
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
