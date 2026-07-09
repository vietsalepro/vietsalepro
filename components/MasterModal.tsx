/**
 * VIETSALE PRO — MASTER MODAL DESIGN SYSTEM
 * ==========================================
 * Exports:
 *   MasterModal     – container tái sử dụng cho mọi modal chi tiết
 *   ModalSection    – khối thông tin có tiêu đề
 *   ModalInfoGrid   – grid label/value 2 cột
 *   ModalTable      – bảng dữ liệu dòng hàng
 *   StatusBadge     – badge trạng thái nhiều màu
 *   ModalButton     – nút hành động footer
 *   SummaryRow      – dòng tổng kết tài chính
 *
 * Version 2 (feature-flagged):
 *   Khi useMasterModalV2 = true:
 *     - CSS-driven styling via MasterModal.css
 *     - 5 sizes (sm=640px, md=960px, lg=1400px, fullscreen=95vw/95vh, mobile=100vw/100vh)
 *     - Z-index overlay=1000, modal=1010
 *     - mmFadeIn overlay, mmFadeUp dialog animation
 *     - Body scroll lock
 *     - Click outside closes
 *     - Loading state (isLoading)
 *     - Error state (error + onRetry)
 *     - Escape key close (respects disableEscape)
 *     - Focus trap (Tab/Shift+Tab cycling, focus restore)
 *     - Full ARIA attributes (role="dialog", aria-modal, aria-labelledby, aria-describedby)
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { useMasterModalV2 } from '../features';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import './MasterModal.css';

// ─── Re-exported sub-components (Sprint_12) ───────────────────
// These are imported from standalone files for modularity.
// Backward compatible — existing imports from './MasterModal' still work.
export { ModalSection }  from './ModalSection';
export type { ModalSectionProps } from './ModalSection';

export { ModalInfoGrid } from './ModalInfoGrid';
export type { ModalInfoGridItem, ModalInfoGridProps } from './ModalInfoGrid';

export { ModalTable }   from './ModalTable';
export type { ModalTableProps } from './ModalTable';

export { SummaryRow }   from './SummaryRow';
export type { SummaryRowProps } from './SummaryRow';

// ─── Types ───────────────────────────────────────────────────────────────────
export type ModalSize     = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'fullscreen' | 'mobile';
export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';

export interface MasterModalProps {
  isOpen:                boolean;
  onClose:               () => void;
  title:                 string;
  icon?:                 React.ReactNode;
  badge?:                React.ReactNode;
  subtitle?:             string;
  children:              React.ReactNode;
  footer?:               React.ReactNode;
  size?:                 ModalSize;
  /** CSS color value – tô màu icon header */
  accentColor?:          string;
  disableBackdropClose?: boolean;
  /** Hiển thị loading state thay cho children */
  isLoading?:            boolean;
  /** Chuỗi lỗi — hiển thị ErrorState thay cho children */
  error?:                string;
  /** Callback khi người dùng nhấn retry trong ErrorState */
  onRetry?:              () => void;
  /** Vô hiệu hoá Escape để đóng modal */
  disableEscape?:        boolean;
}

// ─── Legacy size map (v1) ─────────────────────────────────────────────────────
const SIZE_MAP_V1: Record<string, string> = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-5xl',
  full: 'max-w-[96vw]',
};

// ─── V2 size class mapping ──────────────────────────────────────────────────
const SIZE_CLASS_V2: Record<string, string> = {
  xs:   'size-xs',
  sm:   'size-sm',
  md:   'size-md',
  lg:   'size-lg',
  xl:   'size-xl',
  fullscreen: 'size-fullscreen',
  mobile:    'size-mobile',
  // backward compat fallback
  full: 'size-fullscreen',
};

// ─────────────────────────────────────────────────────────────────────────────
// Scroll Lock Helpers
// ─────────────────────────────────────────────────────────────────────────────
function lockBodyScroll(): void {
  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.width = '100%';
}

function unlockBodyScroll(): void {
  const scrollY = parseInt(document.body.style.top || '0', 10) * -1;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.overflow = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollY);
}

// ─────────────────────────────────────────────────────────────────────────────
// Focus Trap Utility
// ─────────────────────────────────────────────────────────────────────────────
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return Array.from(elements).filter((el) => {
    // Ensure element is visible
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MasterModal
// ─────────────────────────────────────────────────────────────────────────────
export const MasterModal: React.FC<MasterModalProps> = ({
  isOpen, onClose, title, icon, badge, subtitle,
  children, footer, size = 'lg',
  accentColor = '#7c3aed',
  disableBackdropClose = false,
  isLoading = false,
  error,
  onRetry,
  disableEscape = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const previousActiveElement = useRef<Element | null>(null);
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 150);
  }, [closing, onClose]);

  // ── Store trigger element when modal opens ────────────────
  useEffect(() => {
    if (isOpen && !closing) {
      triggerRef.current = document.activeElement;
    }
  }, [isOpen, closing]);

  // ── Scroll lock ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || closing) return;
    if (useMasterModalV2) {
      lockBodyScroll();
    }
    return () => {
      if (useMasterModalV2) {
        unlockBodyScroll();
      }
    };
  }, [isOpen, closing]);

  // ── Focus trap: focus first element on open ──────────────
  useEffect(() => {
    if (!isOpen || !useMasterModalV2 || closing) return;

    // Small delay to ensure DOM is rendered
    const raf = requestAnimationFrame(() => {
      if (!dialogRef.current) return;

      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length > 0) {
        previousActiveElement.current = document.activeElement;
        focusable[0].focus();
      } else {
        // If no focusable elements, focus the dialog itself for focus trapping
        dialogRef.current.focus();
      }
    });

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [isOpen, closing]);

  // ── Focus trap: Tab/Shift+Tab cycling ────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || !useMasterModalV2) return;

      // Escape key
      if (e.key === 'Escape' && !disableEscape) {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      // Tab / Shift+Tab — focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = getFocusableElements(dialogRef.current);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: if focus is on first element, loop to last
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: if focus is on last element, loop to first
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [isOpen, handleClose, disableEscape]
  );

  // ── Keyboard event listener ──────────────────────────────
  useEffect(() => {
    if (!isOpen || !useMasterModalV2) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // ── Focus restore on close ───────────────────────────────
  useEffect(() => {
    if (isOpen || !useMasterModalV2) return;

    // Restore focus to the element that had focus before the modal opened
    const target = previousActiveElement.current ?? triggerRef.current;
    if (target && target instanceof HTMLElement && target.isConnected) {
      target.focus();
    }
    previousActiveElement.current = null;
    triggerRef.current = null;
  }, [isOpen]);

  // ── Determine state to render ────────────────────────────
  const showLoading = isLoading && useMasterModalV2;
  const showError = error && useMasterModalV2;
  const showContent = !showLoading && !showError;

  if (!isOpen && !closing) return null;

  // ── V2: CSS-driven path ──────────────────────────────────
  if (useMasterModalV2) {
    const sizeClass = SIZE_CLASS_V2[size] || 'size-lg';
    const stateDescriptionId = showError ? 'mm-error-desc' : undefined;

    return (
      <div className="master-modal-root">
        {/* Overlay */}
        <div
          className={`master-modal-overlay${closing ? ' master-modal-overlay--closing' : ''}`}
          onClick={disableBackdropClose ? undefined : handleClose}
          aria-hidden="true"
        />

        {/* Container */}
        <div className={`master-modal-container${size === 'mobile' ? ' size-mobile-container' : ''}`}>
          {/* Dialog */}
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mm-title"
            aria-describedby={stateDescriptionId}
            tabIndex={-1}
            className={`master-modal-dialog ${sizeClass}${closing ? ' master-modal-dialog--closing' : ''}`}
          >
            {/* Header */}
            <div className="master-modal-header">
              <div className="master-modal-header-left">
                {icon && (
                  <div
                    className="master-modal-icon-wrapper"
                    style={{ '--modal-accent-color': accentColor } as React.CSSProperties}
                  >
                    {icon}
                  </div>
                )}
                <div className="master-modal-title-group">
                  <div className="master-modal-title-row">
                    <h2 id="mm-title" className="master-modal-title">
                      {title}
                    </h2>
                    {badge}
                  </div>
                  {subtitle && <p className="master-modal-subtitle">{subtitle}</p>}
                </div>
              </div>

              <button
                onClick={handleClose}
                className="master-modal-close-btn"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body — renders loading, error, or normal children */}
            <div className="master-modal-body">
              {showLoading && (
                <div className="master-modal-state-wrapper">
                  <LoadingState message="Đang tải dữ liệu..." />
                </div>
              )}
              {showError && (
                <div className="master-modal-state-wrapper" id="mm-error-desc">
                  <ErrorState message={error} onRetry={onRetry} />
                </div>
              )}
              {showContent && children}
            </div>

            {/* Footer — hidden during loading/error states */}
            {footer && showContent && (
              <div className="master-modal-footer">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── V1: Legacy path (unchanged) ──────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-[2px] master-modal-v1-backdrop"
        onClick={disableBackdropClose ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mm-title"
        className={`relative w-full flex flex-col max-h-[92vh] master-modal-v1-dialog ${SIZE_MAP_V1[size] || 'max-w-2xl'}`}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 px-6 py-4 shrink-0 rounded-t-[inherit] master-modal-v1-header"
        >
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${accentColor}, color-mix(in srgb, ${accentColor} 55%, #1e1b4b))` }}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="mm-title" className="text-base font-bold text-slate-800 truncate leading-snug">
                  {title}
                </h2>
                {badge}
              </div>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="flex items-center gap-3 px-6 py-4 shrink-0 rounded-b-[inherit] master-modal-v1-footer"
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ModalSection — re-exported from ./ModalSection (Sprint_12)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ModalInfoGrid — re-exported from ./ModalInfoGrid (Sprint_12)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ModalTable — re-exported from ./ModalTable (Sprint_12)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────────────────
const BADGE_CLS: Record<StatusVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50   text-amber-700   border-amber-200',
  danger:  'bg-red-50     text-red-700     border-red-200',
  info:    'bg-sky-50     text-sky-700     border-sky-200',
  neutral: 'bg-slate-100  text-slate-600   border-slate-200',
  purple:  'bg-violet-50  text-violet-700  border-violet-200',
};

export const StatusBadge: React.FC<{
  label:   string;
  variant: StatusVariant;
  icon?:   React.ReactNode;
}> = ({ label, variant, icon }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${BADGE_CLS[variant]}`}>
    {icon}{label}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// ModalButton
// ─────────────────────────────────────────────────────────────────────────────
const BTN_CLS: Record<ButtonVariant, string> = {
  primary:   'bg-violet-600 text-white hover:bg-violet-700 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
  danger:    'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
  success:   'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  ghost:     'text-slate-500 hover:bg-slate-100',
};

export const ModalButton: React.FC<{
  onClick?:  () => void;
  variant?:  ButtonVariant;
  children:  React.ReactNode;
  type?:     'button' | 'submit';
  disabled?: boolean;
  icon?:     React.ReactNode;
}> = ({ onClick, variant = 'secondary', children, type = 'button', disabled, icon }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${BTN_CLS[variant]}`}
  >
    {icon}{children}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// SummaryRow — re-exported from ./SummaryRow (Sprint_12)
// ─────────────────────────────────────────────────────────────────────────────