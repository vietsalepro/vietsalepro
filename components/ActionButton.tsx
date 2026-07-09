/**
 * ═══════════════════════════════════════════════════════════════
 *  ACTION BUTTON COMPONENT — Sprint_03
 *  Source: MASTER_ACTION_BUTTON_STANDARD_V1.md
 *  ═══════════════════════════════════════════════════════════════
 *
 *  Variants:
 *    - PrimaryButton   → Hành động chính (Lưu, Tạo mới, Xác nhận, Thanh toán)
 *    - SecondaryButton → Hành động phụ   (In, Xuất Excel, Lưu nháp)
 *    - DangerButton    → Hành động nguy hiểm (Xóa, Hủy phiếu, Reset)
 *    - GhostButton     → Hành động trung tính (Hủy, Đóng, Quay lại)
 *
 *  Design Tokens:
 *    All values use var(--color-*), var(--space-*), var(--radius-*),
 *    var(--text-*), var(--font-*) — no hardcoded colors.
 */

import React, { forwardRef } from 'react';
import './ActionButton.css';

/* ─── Types ──────────────────────────────────────────── */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: ButtonVariant;
  /** Size preset: sm (36px), md (44px), lg (52px) */
  size?: ButtonSize;
  /** Show loading spinner (disables button automatically) */
  loading?: boolean;
  /** Icon element rendered on the left (16×16) */
  icon?: React.ReactNode;
  /** Full-width on mobile */
  fullWidth?: boolean;
}

/* ─── Spinner Component ────────────────────────────── */

const Spinner: React.FC = () => (
  <span className="action-button__spinner" aria-hidden="true" />
);

/* ─── Main Component ────────────────────────────────── */

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      fullWidth = false,
      children,
      disabled,
      className,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const classes = [
      'action-button',
      `action-button--${variant}`,
      `action-button--${size}`,
      fullWidth ? 'action-button--full' : '',
      className || '',
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...rest}
      >
        {loading ? <Spinner /> : icon ? <IconWrapper>{icon}</IconWrapper> : null}
        {children && <span>{children}</span>}
      </button>
    );
  }
);

ActionButton.displayName = 'ActionButton';

/* ─── Icon Wrapper (16×16) ────────────────────────── */

const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="action-button__icon" aria-hidden="true">
    {children}
  </span>
);

/* ─── Named Export Variants ──────────────────────────── */

export const PrimaryButton: React.FC<ActionButtonProps> = (props) => (
  <ActionButton variant="primary" {...props} />
);

export const SecondaryButton: React.FC<ActionButtonProps> = (props) => (
  <ActionButton variant="secondary" {...props} />
);

export const DangerButton: React.FC<ActionButtonProps> = (props) => (
  <ActionButton variant="danger" {...props} />
);

export const GhostButton: React.FC<ActionButtonProps> = (props) => (
  <ActionButton variant="ghost" {...props} />
);

export default ActionButton;