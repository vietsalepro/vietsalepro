import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Settings as SettingsIcon, LogOut, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './UserMenuMobile.css';

interface UserMenuMobileProps {
  visible: boolean;
  onClose: () => void;
  storeName: string;
  onOpenSettings?: () => void;
}

export function UserMenuMobile({ visible, onClose, storeName, onOpenSettings }: UserMenuMobileProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Avatar initials from store name (fallback to email / 'VS')
  const initials = (storeName || user?.email || 'VS')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() || '').join('') || 'VS';

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      setConfirmLogout(false);
      onClose();
      await signOut();
    } catch (error) {

    }
  };

  const handleClose = () => {
    setConfirmLogout(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="user-menu-mobile__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Bottom Sheet — no max-h, no overflow, auto height so all content shows */}
          <motion.div
            className="user-menu-mobile__sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Handle bar */}
            <div className="user-menu-mobile__handle">
              <div className="user-menu-mobile__handle-bar" />
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              className="user-menu-mobile__close"
              aria-label="Đóng"
            >
              <X className="user-menu-mobile__close-icon" />
            </button>

            {/* User info header */}
            <div className="user-menu-mobile__header">
              <div className="user-menu-mobile__user">
                <div className="user-menu-mobile__avatar-wrap">
                  <div className="user-menu-mobile__avatar">
                    {initials}
                  </div>
                  <div className="user-menu-mobile__avatar-status" />
                </div>
                <div className="user-menu-mobile__user-info">
                  <p className="user-menu-mobile__store-name">
                    {storeName || 'Cửa hàng'}
                  </p>
                  <p className="user-menu-mobile__email">
                    {user?.email || 'Chưa đăng nhập'}
                  </p>
                  <p className="user-menu-mobile__role">Quản lý cửa hàng</p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="user-menu-mobile__menu">
              <button
                type="button"
                onClick={() => handleNavigate('/profile')}
                className="user-menu-mobile__item"
              >
                <div className="user-menu-mobile__item-icon-wrap">
                  <UserIcon className="user-menu-mobile__item-icon" />
                </div>
                Hồ sơ cá nhân
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenSettings) {
                    onOpenSettings();
                  } else {
                    navigate('/settings');
                  }
                }}
                className="user-menu-mobile__item"
              >
                <div className="user-menu-mobile__item-icon-wrap">
                  <SettingsIcon className="user-menu-mobile__item-icon" />
                </div>
                Cài đặt hệ thống
              </button>

              {/* Divider before logout */}
              <div className="user-menu-mobile__divider">
                <button
                  type="button"
                  onClick={() => setConfirmLogout(true)}
                  className="user-menu-mobile__item user-menu-mobile__item--danger"
                >
                  <div className="user-menu-mobile__item-icon-wrap user-menu-mobile__item-icon-wrap--danger">
                    <LogOut className="user-menu-mobile__item-icon user-menu-mobile__item-icon--danger" />
                  </div>
                  Đăng xuất
                </button>
              </div>
            </div>

            {/* Safe-area bottom padding — accounts for bottom nav bar (~64px) + device inset */}
            <div className="user-menu-mobile__safe-area" />
          </motion.div>

          {/* Logout confirm dialog */}
          <AnimatePresence>
            {confirmLogout && (
              <>
                <motion.div
                  className="user-menu-mobile__confirm-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setConfirmLogout(false)}
                />
                <motion.div
                  className="user-menu-mobile__confirm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                >
                  <div className="user-menu-mobile__confirm-icon-row">
                    <div className="user-menu-mobile__confirm-icon-wrap">
                      <LogOut className="user-menu-mobile__confirm-icon" />
                    </div>
                  </div>
                  <h3 className="user-menu-mobile__confirm-title">Đăng xuất?</h3>
                  <p className="user-menu-mobile__confirm-text">
                    Bạn có chắc muốn đăng xuất khỏi tài khoản này không?
                  </p>
                  <div className="user-menu-mobile__confirm-actions">
                    <button
                      type="button"
                      onClick={() => setConfirmLogout(false)}
                      className="user-menu-mobile__confirm-cancel"
                    >
                      Huỷ
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="user-menu-mobile__confirm-submit"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

export default UserMenuMobile;
