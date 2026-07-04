import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { classNames } from '../../utils/classNames';
import { useClickOutside } from '../../hooks/useClickOutside';
import './VoucherPopover.css';

export type VoucherPopoverPlacement = 'bottom' | 'top' | 'left' | 'right';

export interface VoucherPopoverProps {
  open: boolean;
  onClose: () => void;
  /** Element neo popover. Nếu không có, popover hiển thị ở giữa màn hình. */
  anchorRef?: React.RefObject<HTMLElement | null>;
  /** Vị trí ưu tiên so với anchor. */
  placement?: VoucherPopoverPlacement;
  /** Chiều rộng cố định. */
  width?: number;
  /** Tiêu đề hiển thị trên cùng. */
  title?: React.ReactNode;
  /** Icon bên trái tiêu đề. */
  titleIcon?: React.ReactNode;
  /** Nút đóng tiêu đề. */
  showClose?: boolean;
  /** Nội dung bên trong popover. */
  children: React.ReactNode;
  className?: string;
  /** Vai trò ARIA cho popover. */
  role?: React.AriaRole;
  /** Id của element điều khiển popover (cho a11y). */
  ariaLabelledBy?: string;
}

/**
 * VoucherPopover — Popover nổi dùng cho form voucher.
 *
 * UX:
 * - Định vị theo anchor element hoặc center màn hình.
 * - Click ngoài hoặc Esc → đóng.
 * - Có thể dùng làm vỏ cho các tác vụ nhanh (vd: nhập lô/HSD, chọn thông tin).
 * - Không thay thế dropdown hoặc modal phức tạp.
 */
export const VoucherPopover: React.FC<VoucherPopoverProps> = ({
  open,
  onClose,
  anchorRef,
  placement = 'bottom',
  width = 320,
  title,
  titleIcon,
  showClose = true,
  children,
  className = '',
  role = 'dialog',
  ariaLabelledBy,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<React.CSSProperties>({});

  useClickOutside(popoverRef, onClose, open);

  useEffect(() => {
    if (!open) return;

    const computePosition = () => {
      const anchor = anchorRef?.current;
      if (!anchor) {
        return {
          position: 'fixed' as const,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width,
          zIndex: 50,
        };
      }

      const rect = anchor.getBoundingClientRect();
      const gap = 8;
      const padding = 8;
      const maxWidth = window.innerWidth - padding * 2;
      const finalWidth = Math.min(width, maxWidth);

      let top = rect.bottom + gap;
      let left = rect.left;

      if (placement === 'top') {
        top = rect.top - gap;
      } else if (placement === 'left') {
        left = rect.left - finalWidth - gap;
      } else if (placement === 'right') {
        left = rect.right + gap;
      }

      // Flip if overflows bottom
      const popoverHeight = popoverRef.current?.offsetHeight ?? 240;
      if (placement === 'bottom' && top + popoverHeight > window.innerHeight - padding) {
        top = rect.top - popoverHeight - gap;
      }
      if (placement === 'top' && top - popoverHeight < padding) {
        top = rect.bottom + gap;
      }

      // Clamp to viewport
      top = Math.max(padding, Math.min(top, window.innerHeight - padding));
      left = Math.max(padding, Math.min(left, window.innerWidth - finalWidth - padding));

      return {
        position: 'fixed' as const,
        top,
        left,
        width: finalWidth,
        zIndex: 50,
      };
    };

    setPosition(computePosition());

    const handleResize = () => setPosition(computePosition());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open, anchorRef, placement, width]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={popoverRef}
      className={classNames('voucher-popover', className)}
      style={position}
      role={role}
      aria-labelledby={ariaLabelledBy}
    >
      {(title || showClose) && (
        <div className="voucher-popover__header">
          <div className="voucher-popover__title">
            {titleIcon && <span className="voucher-popover__title-icon">{titleIcon}</span>}
            {title && <span className="voucher-popover__title-text">{title}</span>}
          </div>
          {showClose && (
            <button
              type="button"
              className="voucher-popover__close"
              onClick={onClose}
              aria-label="Đóng popover"
              title="Đóng"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}
      <div className="voucher-popover__content">{children}</div>
    </div>
  );
};
