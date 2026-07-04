/**
 * ═══════════════════════════════════════════════════════════════
 *  LOADING STATE COMPONENT — Sprint_05
 *  Source: MASTER_STATE_STANDARD_V1.md
 *  ═══════════════════════════════════════════════════════════════
 *
 *  Purpose:
 *    Display loading state with animated spinner and optional message.
 *
 *  Design Tokens:
 *    All values use var(--color-*), var(--space-*), var(--radius-*),
 *    var(--text-*), var(--font-*), var(--motion-*) — no hardcoded values.
 *
 *  Accessibility:
 *    - role="status" for live region announcements
 *    - aria-busy on container
 *    - aria-label on spinner
 */

import React from 'react';
import './LoadingState.css';

/* ─── Types ──────────────────────────────────────────── */

export interface LoadingStateProps {
  /** Loading message displayed below the spinner */
  message?: string;
  /** Additional class names for custom styling */
  className?: string;
  /** Compact variant for smaller spaces */
  compact?: boolean;
  /** Inline variant for horizontal layout */
  inline?: boolean;
}

/* ─── Component ──────────────────────────────────────── */

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  className,
  compact = false,
  inline = false,
}) => {
  const containerClass = [
    'loading-state',
    compact ? 'loading-state--compact' : '',
    inline ? 'loading-state--inline' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClass}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span
        className="loading-state__spinner"
        aria-label="Loading"
        aria-hidden="true"
      />
      {message && (
        <p className="loading-state__message">{message}</p>
      )}
    </div>
  );
};

export default LoadingState;