/**
 * ═══════════════════════════════════════════════════════════════
 *  EMPTY STATE COMPONENT — Sprint_05
 *  Source: MASTER_STATE_STANDARD_V1.md (Section XVI-XVIII)
 *  ═══════════════════════════════════════════════════════════════
 *
 *  Purpose:
 *    Display empty state with icon, title, description, and optional action.
 *
 *  Design Tokens:
 *    All values use var(--color-*), var(--space-*), var(--radius-*),
 *    var(--text-*), var(--font-*) — no hardcoded values.
 *
 *  Accessibility:
 *    - role="status" for live region announcements
 *    - aria-label on icon for screen readers
 */

import React from 'react';
import './EmptyState.css';

/* ─── Types ──────────────────────────────────────────── */

export interface EmptyStateProps {
  /** Icon element or emoji displayed at the top */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text providing more context */
  description?: string;
  /** Optional action button/component rendered in the CTA area */
  action?: React.ReactNode;
  /** Additional class names for custom styling */
  className?: string;
  /** Compact variant for smaller spaces */
  compact?: boolean;
}

/* ─── Component ──────────────────────────────────────── */

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}) => {
  const containerClass = [
    'empty-state',
    compact ? 'empty-state--compact' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClass}
      role="status"
    >
      {icon && (
        <div className="empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="empty-state__title">{title}</h3>
      {description && (
        <p className="empty-state__description">{description}</p>
      )}
      {action && (
        <div className="empty-state__action">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;