import React, { useEffect, useState } from 'react';
import type { Product } from '../../types';
import { StatusBadge } from '../StatusBadge';
import {
  VoucherFormLayout,
  VoucherSection,
  VoucherSectionHeader,
  VoucherSectionContent,
  VoucherField,
  VoucherInput,
  VoucherTextarea,
  VoucherTotals,
  VoucherProductDropdown,
} from '../voucher-form';

// InventoryCountItem type (duplicated from Inventory.tsx for module independence)
interface InventoryCountItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  systemQuantity: number;
  actualQuantity: number;
  cost: number;
  reason: string;
  lotId?: string;
  lotCode?: string;
  expiryDate?: string;
}

interface CountFormData {
  code: string;
  date: string;
  status: 'draft' | 'completed' | 'cancelled';
  items: InventoryCountItem[];
  notes?: string;
}

interface CountFormLayoutProps {
  formData: Partial<CountFormData>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<CountFormData>>>;
  isEditing: boolean;
  /** Children (e.g. table) rendered in the main area */
  children?: React.ReactNode;
  /** Nút quay lại danh sách (giống ImportGoods) */
  onBack?: () => void;
  /** Nút hành động đáy sidebar (Lưu nháp / Hoàn thành / Hủy) */
  actions?: React.ReactNode;
  /** Product search term (forwarded to VoucherSearch in header) */
  searchTerm?: string;
  /** Callback when the product search term changes */
  onSearchChange?: (value: string) => void;
  /** Search results for the product dropdown */
  searchResults?: Product[];
  /** Callback when a product is selected from the dropdown */
  onSelectProduct?: (product: Product) => void;
  /** Placeholder for the product search input */
  searchPlaceholder?: string;
}

/**
 * CountFormLayout — Khung tạo/chỉnh sửa phiếu kiểm kê.
 * Được thiết kế theo phong cách VoucherFormLayout (2 cột flex: main + sidebar).
 */
export const CountFormLayout: React.FC<CountFormLayoutProps> = ({
  formData,
  setFormData,
  isEditing,
  children,
  onBack,
  actions,
  searchTerm = '',
  onSearchChange,
  searchResults = [],
  onSelectProduct,
  searchPlaceholder = 'Tìm tên hoặc mã sản phẩm...',
}) => {
  const items = formData.items || [];
  const totalDiff = items.reduce((sum, it) => sum + (it.actualQuantity - it.systemQuantity), 0);
  const totalDiffValue = items.reduce((sum, it) => sum + ((it.actualQuantity - it.systemQuantity) * it.cost), 0);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  useEffect(() => {
    setIsSearchOpen(searchTerm.trim().length > 0);
  }, [searchTerm]);

  const handleDateChange = (value: string) => {
    setFormData(prev => ({ ...prev, date: value }));
  };

  const title = isEditing ? formData.code : (formData.code || 'Phiếu kiểm kê mới');
  const isCompleted = formData.status === 'completed';

  const statusVariant = formData.status === 'completed'
    ? 'success'
    : formData.status === 'cancelled'
    ? 'default'
    : 'warning';

  const statusLabel = formData.status === 'completed'
    ? 'Hoàn thành'
    : formData.status === 'cancelled'
    ? 'Đã huỷ'
    : 'Bản nháp';

  const diffLabel = `${totalDiff > 0 ? '+' : ''}${totalDiff.toLocaleString('vi-VN')}`;
  const diffValueLabel = `${totalDiffValue.toLocaleString('vi-VN')} ₫`;
  const diffValueClass = totalDiffValue > 0
    ? 'text-emerald-600'
    : totalDiffValue < 0
    ? 'text-rose-600'
    : 'text-slate-900';

  const totalItems = items.length;

  return (
    <VoucherFormLayout
      title={title || 'Phiếu kiểm kê mới'}
      onBack={onBack}
      searchValue={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      searchSlot={
        <VoucherProductDropdown
          mode="server"
          results={searchResults}
          open={isSearchOpen}
          onRequestClose={() => setIsSearchOpen(false)}
          onSelectProduct={(product) => {
            onSelectProduct?.(product);
            setIsSearchOpen(false);
          }}
          maxItems={8}
          disabled={isCompleted}
        />
      }
      main={children}
      sidebar={
        <>
          {/* Thông tin phiếu kiểm */}
          <VoucherSection>
            <VoucherSectionHeader title="Thông tin phiếu kiểm" />
            <VoucherSectionContent>
              <VoucherField label="Mã phiếu kiểm" fullWidth>
                <span className="font-mono text-sm text-slate-900">{formData.code || '---'}</span>
              </VoucherField>
              <VoucherField label="Ngày kiểm" labelFor="count-date" fullWidth>
                <VoucherInput
                  id="count-date"
                  type="date"
                  value={formData.date ? formData.date.slice(0, 10) : ''}
                  onChange={(e) => handleDateChange(e.target.value)}
                  disabled={isCompleted}
                  fullWidth
                />
              </VoucherField>
              <VoucherField label="Trạng thái" fullWidth>
                <StatusBadge label={statusLabel} type={statusVariant} />
              </VoucherField>
              <VoucherField label="Số sản phẩm" fullWidth>
                <span className="text-sm font-semibold text-slate-900">{totalItems.toLocaleString('vi-VN')}</span>
              </VoucherField>
              <VoucherField label="Chênh lệch SL" fullWidth>
                <span className={`text-sm font-semibold ${totalDiff > 0 ? 'text-emerald-600' : totalDiff < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {diffLabel}
                </span>
              </VoucherField>
              <VoucherField label="Giá trị chênh lệch" fullWidth>
                <span className={`text-sm font-semibold ${diffValueClass}`}>
                  {diffValueLabel}
                </span>
              </VoucherField>
            </VoucherSectionContent>
          </VoucherSection>

          {/* Tổng kết kiểm kê */}
          <VoucherSection>
            <VoucherSectionHeader title="Tổng kết kiểm kê" />
            <VoucherSectionContent>
              <VoucherTotals
                items={[
                  { label: 'Tổng sản phẩm', value: totalItems.toLocaleString('vi-VN') },
                  { label: 'Chênh lệch số lượng', value: diffLabel },
                  { label: 'Giá trị chênh lệch', value: <span className={diffValueClass}>{diffValueLabel}</span>, highlight: true },
                ]}
              />
            </VoucherSectionContent>
          </VoucherSection>

          {/* Ghi chú */}
          <VoucherSection>
            <VoucherSectionHeader title="Ghi chú" />
            <VoucherSectionContent>
              <VoucherField label="Ghi chú" labelFor="count-notes" fullWidth>
                <VoucherTextarea
                  id="count-notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Nhập ghi chú cho phiếu kiểm kê..."
                  rows={3}
                  disabled={isCompleted}
                  fullWidth
                />
              </VoucherField>
            </VoucherSectionContent>
          </VoucherSection>
        </>
      }
      actions={actions}
    />
  );
};
