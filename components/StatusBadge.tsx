/**
 * ═══════════════════════════════════════════════════════════════
 *  STATUS BADGE COMPONENT — Sprint_06
 *  Source: MASTER_STATUS_BADGE_STANDARD.md
 *  ═══════════════════════════════════════════════════════════════
 *
 *  Purpose:
 *    Standardized badge component for displaying status labels
 *    (Active, Inactive, Completed, Pending, etc.) with appropriate
 *    color coding. Used across tables, cards, and detail views.
 *
 *  Design Tokens:
 *    All values use var(--color-*), var(--space-*), var(--radius-*),
 *    var(--text-*), var(--font-*) — no hardcoded values.
 *
 *  Accessibility:
 *    - Semantic <span> with appropriate aria attributes
 *    - aria-label support via label prop
 *    - Readable text contrast using design token colors
 *    - Purely presentational — no interactive behavior
 *
 *  Variants:
 *    Type:  default | success | warning | danger | info
 *    Size:  sm (24px) | md (28px) | lg (32px)
 */

import React from 'react';
import './StatusBadge.css';

/* ─── Types ──────────────────────────────────────────── */

export type StatusBadgeType =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type StatusBadgeSize =
  | 'sm'
  | 'md'
  | 'lg';

export interface StatusBadgeProps {
  /** The text label displayed inside the badge */
  label: string;
  /** Visual variant determining the badge color scheme */
  type?: StatusBadgeType;
  /** Size variant controlling height and font size */
  size?: StatusBadgeSize;
  /** Additional class names for custom styling */
  className?: string;
}

/* ─── Component ──────────────────────────────────────── */

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  type = 'default',
  size = 'md',
  className,
}) => {
  const containerClass = [
    'status-badge',
    type !== 'default' ? `status-badge--${type}` : '',
    `status-badge--${size}`,
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={containerClass}
      role="status"
      aria-label={label}
    >
      {label}
    </span>
  );
};

export default StatusBadge;