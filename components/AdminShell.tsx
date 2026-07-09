import React, { useState, useCallback } from 'react';
import { AdminSidebar, SidebarSection } from './AdminSidebar';
import { ToastProvider } from './ToastContainer';
import './AdminShell.css';

/* ─── Types ─────────────────────────────────────────── */
interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface AdminShellProps {
  /** Sidebar sections */
  sidebarSections: SidebarSection[];
  /** Currently active sidebar item id */
  activeSidebarItem?: string;
  /** Called when sidebar item is clicked */
  onSidebarNavigate: (itemId: string) => void;
  /** Page title displayed in topbar */
  pageTitle: string;
  /** Optional page description below title */
  pageDescription?: string;
  /** Breadcrumb items (leftmost = root) */
  breadcrumbs?: BreadcrumbItem[];
  /** Main content */
  children: React.ReactNode;
  /** Sidebar brand label */
  brandLabel?: string;
  /** Username shown in sidebar footer */
  userName?: string;
  /** User avatar element */
  userAvatar?: React.ReactNode;
  /** Footer content (defaults to copyright) */
  footerContent?: React.ReactNode;
  /** Default sidebar collapsed state */
  defaultCollapsed?: boolean;
}

/* ─── Hamburger Icon (for mobile floating button) ──── */
const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

/* ─── Component ─────────────────────────────────────── */
export const AdminShell: React.FC<AdminShellProps> = ({
  sidebarSections,
  activeSidebarItem,
  onSidebarNavigate,
  pageTitle,
  pageDescription,
  breadcrumbs,
  children,
  brandLabel,
  userName,
  userAvatar,
  footerContent,
  defaultCollapsed,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <div className="admin-shell">
      {/* Skip to main content link for keyboard users */}
      <a href="#admin-main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Floating hamburger button for mobile sidebar toggle */}
      <button
        className="admin-shell__hamburger-float"
        onClick={toggleMobile}
        aria-label="Toggle sidebar"
      >
        <HamburgerIcon />
      </button>

      {/* Sidebar */}
      <AdminSidebar
        sections={sidebarSections}
        activeItem={activeSidebarItem}
        onNavigate={onSidebarNavigate}
        brandLabel={brandLabel}
        userName={userName}
        userAvatar={userAvatar}
        defaultCollapsed={defaultCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
      />

      {/* Main content area */}
      <div className="admin-shell__main">
        {/* Scrollable content */}
        <main id="admin-main-content" className="admin-shell__content">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="admin-shell__breadcrumb" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <span className="admin-shell__breadcrumb-separator" aria-hidden="true">
                        /
                      </span>
                    )}
                    {isLast ? (
                      <span className="admin-shell__breadcrumb-item admin-shell__breadcrumb-item--current">
                        {crumb.label}
                      </span>
                    ) : crumb.href ? (
                      <a
                        className="admin-shell__breadcrumb-item"
                        href={crumb.href}
                        onClick={(e) => {
                          if (crumb.onClick) {
                            e.preventDefault();
                            crumb.onClick();
                          }
                        }}
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <button
                        className="admin-shell__breadcrumb-item"
                        onClick={crumb.onClick}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {crumb.label}
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          )}

          {/* Page header */}
          {(pageTitle || pageDescription) && (
            <div className="admin-shell__page-header">
              {pageTitle && (
                <h1 className="admin-shell__page-title">{pageTitle}</h1>
              )}
              {pageDescription && (
                <p className="admin-shell__page-description">{pageDescription}</p>
              )}
            </div>
          )}

          {/* Slot children */}
          <ToastProvider>
            {children}
          </ToastProvider>
        </main>

        {/* Footer */}
        <footer className="admin-shell__footer">
          {footerContent ?? (
            <span>
              &copy; {new Date().getFullYear()} VietSale Pro. All rights reserved.
            </span>
          )}
        </footer>
      </div>
    </div>
  );
};

export default AdminShell;