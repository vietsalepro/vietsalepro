import React from 'react';
import { VoucherHeader } from './VoucherHeader';
import { VoucherSidebar } from './VoucherSidebar';
import { VoucherActions } from './VoucherActions';
import { VoucherBanner } from './VoucherBanner';
import { VoucherScrollArea } from './VoucherScrollArea';
import { classNames } from '../../utils/classNames';
import './VoucherFormLayout.css';

export interface VoucherFormLayoutProps {
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
  /** Vùng chính: bảng sản phẩm / danh sách items */
  main: React.ReactNode;
  /** Sidebar: các mục nhập liệu */
  sidebar: React.ReactNode;
  /** Nút hành động cuối sidebar (Lưu tạm / Hoàn thành) */
  actions?: React.ReactNode;
  /** Banner cảnh báo giữa header và body (tuỳ chọn) */
  banner?: React.ReactNode;
  /** Class thêm vào container */
  className?: string;
}

/**
 * VoucherFormLayout — Khung nhập phiếu dùng chung 4 loại:
 *   - Phiếu nhập hàng
 *   - Phiếu kiểm kê
 *   - Phiếu xuất hủy
 *   - Phiếu đổi hàng NCC
 *
 * Layout: 2 cột 70% — 30% (sidebar 380px)
 * Tablet (<1024px): xếp chồng, sidebar xuống dưới
 */
export const VoucherFormLayout: React.FC<VoucherFormLayoutProps> = ({
  title,
  onBack,
  searchPlaceholder,
  searchValue = '',
  onSearchChange,
  searchSlot,
  main,
  sidebar,
  actions,
  banner,
  className = '',
}) => {
  return (
    <div className={classNames('voucher-layout', className)}>
      {/* === Cột trái: Header + Main === */}
      <div className="voucher-layout__main">
        <VoucherHeader
          title={title}
          onBack={onBack}
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchSlot={searchSlot}
        />

        {banner && <VoucherBanner>{banner}</VoucherBanner>}

        <VoucherScrollArea className="voucher-body">{main}</VoucherScrollArea>
      </div>

      {/* === Cột phải: Sidebar === */}
      <VoucherSidebar
        actions={actions && <VoucherActions>{actions}</VoucherActions>}
      >
        {sidebar}
      </VoucherSidebar>
    </div>
  );
};
