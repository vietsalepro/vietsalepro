/**
 * ═══════════════════════════════════════════════════════════════
 *  TABS COMPONENT — Sprint_08
 *  Source: MASTER_TABS_STANDARD_V1.md
 * ═══════════════════════════════════════════════════════════════
 *
 *  Exports:
 *    Tabs       — root container (manages active state)
 *    TabList    — horizontal or vertical list of Tab buttons
 *    Tab        — single tab button with optional icon + badge
 *    TabPanel   — content panel shown when its value is active
 *
 *  Feature Flag: useNewTabs (in features.ts)
 *    When flag=false → component renders nothing (consumers
 *    must keep their own legacy tab implementation).
 *    When flag=true  → renders the standardized tabs.
 *
 *  Accessibility:
 *    - role="tablist" / role="tab" / role="tabpanel"
 *    - aria-selected, aria-disabled, aria-controls, aria-labelledby
 *    - Keyboard: ArrowLeft/Right (horizontal), ArrowUp/Down (vertical),
 *      Home, End, Enter, Space
 *
 *  Design Tokens:
 *    All styling via Tabs.css — no inline styles.
 * ═══════════════════════════════════════════════════════════════
 */

import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useId,
} from 'react';
import './Tabs.css';

/* ─── Context ────────────────────────────────────────────────── */

interface TabsContextValue {
  value: string;
  onChange: (v: string) => void;
  orientation: 'horizontal' | 'vertical';
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = (): TabsContextValue => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tab/TabList/TabPanel must be used inside <Tabs>');
  return ctx;
};

/* ─── Types ──────────────────────────────────────────────────── */

export interface TabsProps {
  /** Currently active tab value */
  value: string;
  /** Callback fired when active tab changes */
  onChange: (value: string) => void;
  /** Orientation of the tab list */
  orientation?: 'horizontal' | 'vertical';
  /** Additional class names */
  className?: string;
  children: React.ReactNode;
}

export interface TabListProps {
  /** Additional class names */
  className?: string;
  children: React.ReactNode;
}

export interface TabProps {
  /** Unique value identifying this tab */
  value: string;
  /** Icon rendered to the left of the label */
  icon?: React.ReactNode;
  /** Numeric or string badge shown after the label */
  badge?: string | number;
  /** Whether this tab is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  children: React.ReactNode;
}

export interface TabPanelProps {
  /** Must match the Tab value this panel belongs to */
  value: string;
  /** Additional class names */
  className?: string;
  children: React.ReactNode;
}

/* ─── Tabs Root ──────────────────────────────────────────────── */

export const Tabs: React.FC<TabsProps> = ({
  value,
  onChange,
  orientation = 'horizontal',
  className,
  children,
}) => {
  const baseId = useId();

  const containerClass = [
    'vs-tabs',
    orientation === 'vertical' ? 'vs-tabs--vertical' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <TabsContext.Provider value={{ value, onChange, orientation, baseId }}>
      <div className={containerClass}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

Tabs.displayName = 'Tabs';

/* ─── TabList ────────────────────────────────────────────────── */

export const TabList: React.FC<TabListProps> = ({ className, children }) => {
  const { orientation } = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const tabs = Array.from(
        listRef.current?.querySelectorAll<HTMLButtonElement>(
          '[role="tab"]:not([disabled])'
        ) ?? []
      );
      if (!tabs.length) return;

      const focused = document.activeElement as HTMLButtonElement;
      const idx = tabs.indexOf(focused);
      if (idx === -1) return;

      const isHorizontal = orientation === 'horizontal';
      const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
      const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

      let next = -1;
      if (e.key === prevKey) {
        next = idx > 0 ? idx - 1 : tabs.length - 1;
      } else if (e.key === nextKey) {
        next = idx < tabs.length - 1 ? idx + 1 : 0;
      } else if (e.key === 'Home') {
        next = 0;
      } else if (e.key === 'End') {
        next = tabs.length - 1;
      }

      if (next !== -1) {
        e.preventDefault();
        tabs[next].focus();
      }
    },
    [orientation]
  );

  const listClass = ['vs-tab-list', className || ''].filter(Boolean).join(' ');

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-orientation={orientation}
      className={listClass}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
};

TabList.displayName = 'TabList';

/* ─── Tab ─────────────────────────────────────────────────────── */

export const Tab: React.FC<TabProps> = ({
  value,
  icon,
  badge,
  disabled = false,
  className,
  children,
}) => {
  const { value: activeValue, onChange, baseId } = useTabsContext();
  const isActive = activeValue === value;

  const tabClass = [
    'vs-tab',
    isActive ? 'vs-tab--active' : '',
    disabled ? 'vs-tab--disabled' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  const handleClick = () => {
    if (!disabled) onChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onChange(value);
    }
  };

  return (
    <button
      id={tabId}
      role="tab"
      type="button"
      aria-selected={isActive}
      aria-disabled={disabled || undefined}
      aria-controls={panelId}
      disabled={disabled}
      className={tabClass}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isActive ? 0 : -1}
    >
      {icon && <span className="vs-tab-icon" aria-hidden="true">{icon}</span>}
      {children}
      {badge !== undefined && (
        <span className="vs-tab-badge" aria-label={`${badge} items`}>
          {badge}
        </span>
      )}
    </button>
  );
};

Tab.displayName = 'Tab';

/* ─── TabPanel ───────────────────────────────────────────────── */

export const TabPanel: React.FC<TabPanelProps> = ({
  value,
  className,
  children,
}) => {
  const { value: activeValue, baseId } = useTabsContext();
  const isActive = activeValue === value;

  const panelId = `${baseId}-panel-${value}`;
  const tabId = `${baseId}-tab-${value}`;

  const panelClass = ['vs-tab-panel', className || ''].filter(Boolean).join(' ');

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      className={panelClass}
      hidden={!isActive}
      tabIndex={0}
    >
      {isActive ? children : null}
    </div>
  );
};

TabPanel.displayName = 'TabPanel';
