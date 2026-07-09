import React, { useRef, useEffect, useCallback } from 'react';
import './AdminTabs.css';

/* ─── Types ─────────────────────────────────────────── */
export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
  badge?: number;
}

interface AdminTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode; // Rendered content for active tab
}

export const AdminTabs: React.FC<AdminTabsProps> = ({ tabs, activeTab, onTabChange, children }) => {
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  // ponytail: reset refs when tabs change so removed tabs don’t leave stale refs.
  useEffect(() => {
    tabRefs.current = new Map<string, HTMLButtonElement>();
  }, [tabs]);

  const focusTab = useCallback((index: number) => {
    const tab = tabs[index];
    if (!tab) return;
    const el = tabRefs.current.get(tab.id);
    if (el) {
      el.focus();
      onTabChange(tab.id);
    }
  }, [tabs, onTabChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = tabs.length - 1;
    let nextIndex = index;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = index >= lastIndex ? 0 : index + 1;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = index <= 0 ? lastIndex : index - 1;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = lastIndex;
    } else {
      return;
    }

    focusTab(nextIndex);
  }, [tabs.length, focusTab]);

  return (
    <div className="admin-tabs">
      <nav className="admin-tabs__list" role="tablist" aria-label="Page tabs">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
                else tabRefs.current.delete(tab.id);
              }}
              className={`admin-tabs__item ${isActive ? 'admin-tabs__item--active' : ''}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`admin-tab-panel-${tab.id}`}
              id={`admin-tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {Icon && <Icon size={16} />}
              <span className="admin-tabs__label">{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="admin-tabs__badge" aria-label={`${tab.badge} new items`}>{tab.badge}</span>
              )}
            </button>
          );
        })}
      </nav>
      <section
        className="admin-tabs__content"
        id={`admin-tab-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`admin-tab-${activeTab}`}
      >
        {children}
      </section>
    </div>
  );
};

export default AdminTabs;
