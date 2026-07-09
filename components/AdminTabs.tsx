import React from 'react';
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
  return (
    <div className="admin-tabs">
      <nav className="admin-tabs__list" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`admin-tabs__item ${isActive ? 'admin-tabs__item--active' : ''}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`admin-tab-panel-${tab.id}`}
              id={`admin-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
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
