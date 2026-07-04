import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { VoucherSearch } from './VoucherSearch';
import './VoucherHeader.css';

export interface VoucherHeaderProps {
  /** Tiêu đề phiếu hiển thị giữa header */
  title: string;
  /** Bấm nút back */
  onBack?: () => void;
  /** Placeholder ô tìm kiếm */
  searchPlaceholder?: string;
  /** Giá trị ô tìm kiếm */
  searchValue?: string;
  /** Khi gõ vào ô tìm kiếm */
  onSearchChange?: (value: string) => void;
  /** Nội dung bên phải ô tìm (ví dụ: dropdown kết quả) */
  searchSlot?: React.ReactNode;
}

export const VoucherHeader: React.FC<VoucherHeaderProps> = ({
  title,
  onBack,
  searchPlaceholder = 'Tìm sản phẩm...',
  searchValue = '',
  onSearchChange,
  searchSlot,
}) => {
  return (
    <div className="voucher-header">
      {onBack ? (
        <button
          type="button"
          className="voucher-back-btn"
          onClick={onBack}
          aria-label="Quay lại"
        >
          <ArrowLeft size={18} />
        </button>
      ) : (
        <div className="voucher-back-placeholder" />
      )}

      <h1 className="voucher-title-text">{title}</h1>

      <div className="voucher-search-wrap">
        <VoucherSearch
          value={searchValue}
          onChange={(value) => onSearchChange?.(value)}
          placeholder={searchPlaceholder}
        />
        {searchSlot}
      </div>
    </div>
  );
};
