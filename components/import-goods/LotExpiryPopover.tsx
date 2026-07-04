import React, { useEffect, useRef, useState } from 'react';
import { X, Package, Calendar } from 'lucide-react';
import { Product, ProductLot } from '../../types';
import './LotExpiryPopover.css';

interface LotExpiryPopoverProps {
  open: boolean;
  onClose: () => void;
  /** Sản phẩm tương ứng (để lấy danh sách lô hiện có) */
  product?: Product;
  /** Giá trị hiện tại */
  lotCode: string;
  expiryDate: string;
  /** Khi user lưu */
  onSave: (lotCode: string, expiryDate: string) => void;
  /** Anchor position để render popover gần row */
  anchorRect?: DOMRect | null;
}

/**
 * LotExpiryPopover — Popover nhập số lô / hạn dùng cho 1 dòng phiếu nhập.
 *
 * UX:
 * - Render qua portal-like fixed positioning ở góc trên phải của dòng.
 * - Datalist các lô đang tồn để gợi ý — chọn lô có sẵn → auto-fill expiryDate.
 * - Input thủ công lô mới hoặc sửa expiry.
 * - Click ngoài hoặc Esc → đóng (KHÔNG lưu).
 * - Nút Lưu hoặc Enter → gọi onSave rồi đóng.
 */
export const LotExpiryPopover: React.FC<LotExpiryPopoverProps> = ({
  open,
  onClose,
  product,
  lotCode,
  expiryDate,
  onSave,
  anchorRect,
}) => {
  const [localLot, setLocalLot] = useState(lotCode);
  const [localExpiry, setLocalExpiry] = useState(expiryDate);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setLocalLot(lotCode);
      setLocalExpiry(expiryDate);
      // Focus input sau 1 tick để khi mount xong DOM mới focus được
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open, lotCode, expiryDate]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') {
        e.preventDefault();
        onSave(localLot.trim(), localExpiry);
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, localLot, localExpiry, onSave, onClose]);

  if (!open) return null;

  const existingLots: ProductLot[] = product?.lots || [];
  const datalistId = `ig-lots-${product?.id || 'x'}`;

  // Vị trí popover: nếu có anchorRect, đặt ngay dưới và canh phải;
  // fallback: center màn hình.
  const style: React.CSSProperties = anchorRect
    ? {
        position: 'fixed',
        top: Math.min(anchorRect.bottom + 6, window.innerHeight - 280),
        left: Math.max(8, Math.min(anchorRect.right - 320, window.innerWidth - 332)),
        width: 320,
        zIndex: 50,
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 320,
        zIndex: 50,
      };

  return (
    <div ref={popoverRef} className="ig-popover" style={style} role="dialog">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-400" />
          <h4 className="text-[13px] font-semibold text-slate-900">Lô / Hạn dùng</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ig-btn-icon"
          title="Đóng"
          aria-label="Đóng popover"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {product && (
        <p className="ig-muted mb-3 truncate">
          Sản phẩm: <span className="text-slate-700 font-medium">{product.name}</span>
        </p>
      )}

      <div className="space-y-3">
        <div>
          <label className="ig-label block mb-1">Số lô</label>
          <input
            ref={inputRef}
            list={datalistId}
            type="text"
            value={localLot}
            onChange={(e) => {
              const v = e.target.value;
              setLocalLot(v);
              const matched = existingLots.find((l) => l.code === v);
              if (matched && matched.expiryDate) {
                setLocalExpiry(matched.expiryDate);
              }
            }}
            placeholder="VD: LOT-2026-001"
            className="ig-input"
          />
          {existingLots.length > 0 && (
            <datalist id={datalistId}>
              {existingLots.map((l) => (
                <option key={l.id} value={l.code}>
                  {l.expiryDate} (Tồn: {l.quantity})
                </option>
              ))}
            </datalist>
          )}
        </div>

        <div>
          <label className="ig-label block mb-1">Hạn sử dụng</label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={localExpiry}
              onChange={(e) => setLocalExpiry(e.target.value)}
              className="ig-input pl-9"
            />
          </div>
        </div>

        {existingLots.length > 0 && (
          <div className="text-[11px] text-slate-500 -mt-1">
            Có {existingLots.length} lô đang tồn — gõ để xem gợi ý.
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
        <button type="button" onClick={onClose} className="ig-btn-secondary vsp-text-xs vsp-font-regular lot-popover-btn">
          Hủy
        </button>
        <button
          type="button"
          onClick={() => {
            onSave(localLot.trim(), localExpiry);
            onClose();
          }}
          className="ig-btn-primary vsp-text-xs vsp-font-regular lot-popover-btn"
        >
          Lưu
        </button>
      </div>
    </div>
  );
};
