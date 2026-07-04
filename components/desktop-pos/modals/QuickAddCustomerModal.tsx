import React from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone } from 'lucide-react';

interface QuickAddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: { name: string; phone: string };
  onFormChange: (form: { name: string; phone: string }) => void;
  onSubmit: () => void;
}

/**
 * QuickAddCustomerModal — Form thêm khách hàng nhanh
 * - Tên + SĐT
 * - Nút Hủy + Thêm
 */
export const QuickAddCustomerModal: React.FC<QuickAddCustomerModalProps> = ({
  isOpen, onClose, form, onFormChange, onSubmit
}) => {
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSubmit();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-[var(--modal-overlay)] backdrop-blur-[2px] z-[1000]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="qacm-title"
          className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-[var(--modal-radius)] shadow-[var(--modal-shadow)] w-full max-w-sm overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0 bg-[var(--modal-header-bg)] border-b border-[var(--modal-border)]">
            <h3 id="qacm-title" className="vsp-font-bold vsp-text-lg text-[var(--modal-title-color)]">
              Thêm khách hàng nhanh
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-neutral-200)] hover:text-[var(--color-text-secondary)] transition-colors"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Name Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <User className="w-4 h-4 text-[var(--color-text-muted)]" />
              </div>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="Tên khách hàng *"
                className="w-full pl-9 pr-4 h-10 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-[10px] vsp-text-sm vsp-font-regular text-[var(--color-text-primary)] outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary-500)_10%,transparent)] transition-all"
                autoFocus
              />
            </div>

            {/* Phone Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Phone className="w-4 h-4 text-[var(--color-text-muted)]" />
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => onFormChange({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                onKeyDown={handleKeyDown}
                placeholder="Số điện thoại"
                className="w-full pl-9 pr-4 h-10 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-[10px] vsp-text-sm vsp-font-regular text-[var(--color-text-primary)] outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary-500)_10%,transparent)] transition-all"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 shrink-0 bg-[var(--modal-footer-bg)] border-t border-[var(--modal-border)]">
            <button
              onClick={onClose}
              className="flex-1 h-10 border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] rounded-lg vsp-text-sm vsp-font-semibold hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={onSubmit}
              disabled={!form.name.trim()}
              className="flex-1 h-10 bg-[var(--color-primary-500)] text-[var(--color-text-on-primary)] rounded-lg vsp-text-sm vsp-font-semibold hover:bg-[var(--color-primary-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Thêm
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
};