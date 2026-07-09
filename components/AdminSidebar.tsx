import React, { useState, useEffect, useCallback } from 'react';
import './AdminSidebar.css';

/* ─── Types ─────────────────────────────────────────── */
export interface SidebarSection {
  label: string;
  items: SidebarItem[];
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  children?: { id: string; label: string }[];
}

interface AdminSidebarProps {
  sections: SidebarSection[];
  activeItem?: string;
  onNavigate: (itemId: string) => void;
  brandLabel?: string;
  userName?: string;
  userAvatar?: React.ReactNode;
  defaultCollapsed?: boolean;
  /** Force sidebar visible (handled by parent via hamburger) */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/* ─── Icons (inline SVG, minimal set) ───────────────── */
const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Hamburger menu icon for mobile toggle
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

/* ─── Component ─────────────────────────────────────── */
export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  sections,
  activeItem,
  onNavigate,
  brandLabel = 'VietSale Pro',
  userName,
  userAvatar,
  defaultCollapsed = false,
  mobileOpen = false,
  onMobileClose,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && onMobileClose) {
        onMobileClose();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onMobileClose]);

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  const toggleExpand = useCallback((label: string) => {
    setExpandedSections(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const handleItemClick = useCallback((itemId: string) => {
    onNavigate(itemId);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  }, [onNavigate, isMobile, onMobileClose]);

  const sidebarClass = [
    'admin-sidebar',
    collapsed && 'admin-sidebar--collapsed',
    mobileOpen && 'admin-sidebar--mobile-open',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div
          className={`admin-sidebar__backdrop${mobileOpen ? ' admin-sidebar__backdrop--visible' : ''}`}
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside className={sidebarClass} role="navigation" aria-label="Admin navigation">
        {/* Brand header */}
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__brand-icon">
            {brandLabel.charAt(0).toUpperCase()}
          </div>
          <span className="admin-sidebar__brand-label">{brandLabel}</span>
          {isMobile ? (
            <button
              className="admin-sidebar__toggle"
              onClick={onMobileClose}
              aria-label="Close sidebar"
            >
              <MenuIcon />
            </button>
          ) : (
            <button
              className="admin-sidebar__toggle"
              onClick={toggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronIcon />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar__nav">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="admin-sidebar__section-label">
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive = item.id === activeItem;
                const isExpanded = expandedSections[item.id] ?? false;
                const hasChildren = item.children && item.children.length > 0;

                return (
                  <div key={item.id}>
                    <button
                      className={[
                        'admin-sidebar__item',
                        isActive && 'admin-sidebar__item--active',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => {
                        if (hasChildren && collapsed) {
                          // In collapsed mode, expand on click
                          toggleExpand(item.id);
                        }
                        if (!hasChildren) {
                          handleItemClick(item.id);
                        }
                      }}
                      data-tooltip={collapsed ? item.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="admin-sidebar__item-icon">{item.icon}</span>
                      <span className="admin-sidebar__item-label">{item.label}</span>

                      {item.badge != null && (
                        <span className="admin-sidebar__badge">
                          {item.badge}
                        </span>
                      )}

                      {hasChildren && !collapsed && (
                        <span
                          className="admin-sidebar__item-chevron"
                          style={{
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform var(--motion-fast)',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(item.id);
                          }}
                        >
                          <ChevronIcon />
                        </span>
                      )}
                    </button>

                    {/* Child items */}
                    {hasChildren && !collapsed && isExpanded && (
                      <div className="admin-sidebar__children">
                        {item.children!.map((child) => (
                          <button
                            key={child.id}
                            className={[
                              'admin-sidebar__item',
                              'admin-sidebar__item--child',
                              child.id === activeItem && 'admin-sidebar__item--active',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => handleItemClick(child.id)}
                            aria-current={child.id === activeItem ? 'page' : undefined}
                          >
                            <span className="admin-sidebar__item-label">{child.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__footer-user">
            {userAvatar ?? (
              <div className="admin-sidebar__footer-avatar" />
            )}
            {userName && <span>{userName}</span>}
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;