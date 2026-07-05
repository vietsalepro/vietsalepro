import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Disposal, DisposalItem, Product, ProductLot } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Loader2, Trash2, Save, Check, Package } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import {
  VoucherFormLayout,
  VoucherProductDropdown,
  VoucherTable,
  VoucherTableRow,
  VoucherEmpty,
  VoucherTotals,
  VoucherSection,
  VoucherSectionHeader,
  VoucherSectionContent,
  VoucherField,
  VoucherSelect,
  VoucherTextarea,
  VoucherButton,
  VoucherInput,
} from '../components/voucher-form';
import { DisposalLotSelector } from '../components/disposal-form/DisposalLotSelector';
import { StatusBadge } from '../components/StatusBadge';
import { PageLayout } from '../components/shared/PageLayout';

export interface FormDisposalItem extends DisposalItem {
  availableQuantity?: number;
  selectedLot?: ProductLot | null;
  note?: string;
}

const DISPOSAL_REASONS = [
  'Hàng hỏng',
  'Hàng hết hạn',
  'Hàng vỡ',
  'Hàng mất',
  'Hàng lỗi',
  'Khác',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const formatQty = (n: number) => n.toLocaleString('vi-VN');
const parseQty = (raw: string) => {
  const digits = raw.replace(/\./g, '').replace(/\D/g, '');
  return digits === '' ? 0 : parseInt(digits, 10);
};

interface DisposalRowProps {
  item: FormDisposalItem;
  index: number;
  product?: Product;
  reason?: string;
  onUpdate: (index: number, patch: Partial<FormDisposalItem>) => void;
  onRemove: (index: number) => void;
}

const DisposalRow: React.FC<DisposalRowProps> = ({
  item,
  index,
  product,
  reason,
  onUpdate,
  onRemove,
}) => {
  const isLotQuantityLocked = reason === 'Hàng hết hạn' && !!item.selectedLot;

  useEffect(() => {
    if (
      reason === 'Hàng hết hạn' &&
      item.selectedLot &&
      item.quantity !== item.selectedLot.quantity
    ) {
      onUpdate(index, {
        quantity: item.selectedLot.quantity,
        totalValue: item.selectedLot.quantity * (item.costPrice || 0),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reason, item.selectedLot?.id, item.selectedLot?.quantity, item.costPrice, index, onUpdate]);

  const handleQtyChange = (value: string) => {
    const qty = parseQty(value);
    if (qty <= 0 || qty > (item.availableQuantity || 0)) return;
    onUpdate(index, { quantity: qty, totalValue: qty * (item.costPrice || 0) });
  };

  const handleSelectLot = (lot: ProductLot | null) => {
    const patch: Partial<FormDisposalItem> = {
      selectedLot: lot,
      lotId: lot?.id,
      lotCode: lot?.code,
      expiryDate: lot?.expiryDate,
    };
    if (reason === 'Hàng hết hạn' && lot) {
      patch.quantity = lot.quantity;
      patch.totalValue = lot.quantity * (item.costPrice || 0);
    }
    onUpdate(index, patch);
  };

  const hasLots = product?.hasBatches && product?.lots && product.lots.length > 0;

  return (
    <VoucherTableRow>
      <td className="text-center w-12">
        <VoucherButton
          variant="danger"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={() => onRemove(index)}
          aria-label="Xóa dòng này"
          title="Xóa dòng này"
        />
      </td>
      <td className="text-center w-12">{index + 1}</td>
      <td>{item.productCode || item.productId}</td>
      <td>
        <div className="font-medium text-slate-900">{item.productName}</div>
        <div className="text-xs text-slate-500">Tồn: {item.availableQuantity}</div>
        {item.categoryName && (
          <div className="text-xs text-slate-500">Danh mục: {item.categoryName}</div>
        )}
        {item.brandName && (
          <div className="text-xs text-slate-500">Thương hiệu: {item.brandName}</div>
        )}
        {hasLots && (
          <div className="mt-2">
            <DisposalLotSelector
              lots={product.lots || []}
              selectedLot={item.selectedLot}
              onSelectLot={handleSelectLot}
              productName={item.productName}
              productCode={item.productCode}
            />
          </div>
        )}
        {item.selectedLot ? (
          <div className="mt-1 text-xs text-green-600">
            <span className="font-medium">✓ Lô:</span> {item.selectedLot.code}
            {item.selectedLot.expiryDate && ` | HSD: ${item.selectedLot.expiryDate}`}
          </div>
        ) : item.lotCode ? (
          <div className="mt-1 text-xs text-green-600">
            <span className="font-medium">✓ Lô đã hủy:</span> {item.lotCode}
          </div>
        ) : null}
      </td>
      <td className="text-center w-24">{product?.unit || '-'}</td>
      <td className="text-center w-32">
        <VoucherInput
          id={`qty-${item.productId}`}
          type="text"
          inputMode="numeric"
          value={formatQty(item.quantity)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleQtyChange(e.target.value)
          }
          disabled={isLotQuantityLocked}
          size="sm"
          fullWidth
        />
      </td>
      <td className="text-right w-32">{formatCurrency(item.costPrice)}</td>
      <td className="text-right w-32 font-semibold">{formatCurrency(item.totalValue)}</td>
    </VoucherTableRow>
  );
};

export const DisposalForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.pathname.endsWith('/edit') ? 'edit' : id ? 'view' : 'create';

  const [loading, setLoading] = useState(!!id);
  const [disposal, setDisposal] = useState<Disposal | null>(null);
  const [items, setItems] = useState<FormDisposalItem[]>([]);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Search — server-side via searchProducts RPC
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchReqId = useRef(0);

  // Product cache for lot lookups (validate + table) — avoids full product load
  const productCacheRef = useRef<Map<string, Product>>(new Map());
  const [cacheVersion, setCacheVersion] = useState(0);
  const upsertCache = useCallback((products: Product[]) => {
    let changed = false;
    products.forEach((p) => {
      if (!productCacheRef.current.has(p.id)) {
        productCacheRef.current.set(p.id, p);
        changed = true;
      }
    });
    if (changed) setCacheVersion((v) => v + 1);
  }, []);

  // Server-side search effect
  useEffect(() => {
    const reqId = ++searchReqId.current;
    const term = debouncedSearchTerm.trim();
    if (!term) {
      setSearchResults([]);
      setIsSearching(false);
      setShowSearchResults(false);
      return;
    }
    setIsSearching(true);
    setShowSearchResults(true);
    supabaseService
      .searchProducts(term, 50)
      .then((results) => {
        if (reqId !== searchReqId.current) return;
        setSearchResults(results);
        upsertCache(results);
      })
      .catch((err) => {

        if (reqId === searchReqId.current) setSearchResults([]);
      })
      .finally(() => {
        if (reqId === searchReqId.current) setIsSearching(false);
      });
  }, [debouncedSearchTerm, upsertCache]);

  // Fetch data — only fetch disposal + its items' products (no full product load)
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (id) {
          const disposalId = id.split('/')[0];
          const fetchedDisposal = await supabaseService.getDisposalById(disposalId);
          if (fetchedDisposal) {
            setDisposal(fetchedDisposal);
            const productIds = fetchedDisposal.items.map((it) => it.productId).filter(Boolean);
            const products = productIds.length
              ? await supabaseService.getProductsByIds(productIds)
              : [];
            upsertCache(products);
            const productMap = new Map(products.map((p) => [p.id, p]));
            setItems(
              fetchedDisposal.items.map((item) => {
                const product = productMap.get(item.productId);
                const selectedLot = product?.lots?.find((l) => l.id === item.lotId) || null;
                return {
                  ...item,
                  availableQuantity: product?.quantity || 0,
                  selectedLot,
                };
              })
            );
            setReason(fetchedDisposal.reason || '');
            setNote(fetchedDisposal.note || '');
          }
        }
      } catch (error) {

        alert('Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, upsertCache]);

  // Search products — controlled input; debounced useEffect performs server search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setShowSearchResults(false);
    }
  }, []);

  // Add product
  const handleAddProduct = (product: Product) => {
    const existing = items.find((item) => item.productId === product.id);

    if (existing) {
      document.getElementById(`qty-${product.id}`)?.focus();
    } else {
      const newItem: FormDisposalItem = {
        productId: product.id,
        productCode: product.code,
        productName: product.name || '',
        categoryId: product.categoryId,
        categoryName: product.category,
        brandId: product.brandId,
        brandName: product.brand,
        quantity: 1,
        costPrice: product.cost || 0,
        totalValue: product.cost || 0,
        availableQuantity: product.quantity || 0,
        selectedLot: null,
        note: '',
      };
      setItems([...items, newItem]);
      upsertCache([product]);
    }

    setSearchTerm('');
    setShowSearchResults(false);
  };

  // Delete item
  const handleDeleteItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  // Update item
  const handleUpdateItem = (idx: number, patch: Partial<FormDisposalItem>) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], ...patch };
    setItems(newItems);
  };

  // Calculate stats
  const stats = useMemo(() => {
    return {
      productCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: items.reduce((sum, item) => sum + item.totalValue, 0),
    };
  }, [items]);

  // Validate
  const validateForm = (): string | null => {
    if (items.length === 0) return 'Phải thêm ít nhất 1 sản phẩm';

    const today = new Date().toISOString().slice(0, 10);

    for (const item of items) {
      if (item.quantity <= 0) return 'Số lượng hủy phải > 0';
      if (item.quantity > (item.availableQuantity || 0)) return `SL hủy vượt tồn kho`;

      if (!item.categoryId && !item.categoryName) {
        return `Sản phẩm "${item.productName}" chưa có danh mục`;
      }

      const product = productCacheRef.current.get(item.productId);
      const productLots = product?.lots || [];
      const hasLots = product?.hasBatches && productLots.length > 0;

      if (reason === 'Hàng hết hạn') {
        if (!hasLots) {
          return `Sản phẩm "${item.productName}" không quản lý lô, không thể xuất hủy vì lý do hết hạn`;
        }
        if (hasLots && !item.selectedLot) {
          return `Sản phẩm "${item.productName}" hết hạn phải chọn lô hết hạn`;
        }
        if (item.selectedLot) {
          const expiry = item.selectedLot.expiryDate?.slice(0, 10);
          if (expiry && expiry >= today) {
            return `Lô "${item.selectedLot.code}" của "${item.productName}" chưa hết hạn (HSD: ${expiry})`;
          }
          if (item.quantity !== item.selectedLot.quantity) {
            return `Lý do hết hạn phải xuất hủy toàn bộ lô (${item.selectedLot.quantity})`;
          }
        }
      }

      if (reason === 'Hàng mất') {
        if (productLots.length >= 2) {
          return `Sản phẩm "${item.productName}" có ${productLots.length} lô. Vui lòng thực hiện Kiểm kê để xác định lô bị mất, sau đó mới xuất hủy.`;
        }
        if (hasLots && !item.selectedLot) {
          return `Sản phẩm "${item.productName}" bắt buộc chọn lô khi xuất hủy vì lý do mất`;
        }
      }

      if (hasLots && !item.selectedLot) {
        return `Sản phẩm "${item.productName}" bắt buộc chọn lot`;
      }
    }

    if (reason === 'Khác' && !note.trim()) {
      return 'Vui lòng ghi chú lý do "Khác"';
    }

    return null;
  };

  // Save Draft
  const handleSaveDraft = async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    setSubmitLoading(true);
    try {
      const disposalData = {
        items,
        reason,
        note,
        status: 'DRAFT' as const,
      };

      if (mode === 'edit' && disposal) {
        await supabaseService.updateDisposalWithItems(disposal.id, disposalData);
      } else {
        await supabaseService.createDisposal(disposalData);
      }

      alert('Lưu tạm thành công');
      navigate('/inventory/disposals');
    } catch (error) {

      alert('Lỗi lưu tạm');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Complete disposal
  const handleComplete = async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    if (!confirm('Hoàn thành phiếu xuất hủy này? Tồn kho sẽ được cập nhật.')) return;

    setSubmitLoading(true);
    try {
      const disposalData = {
        items,
        reason,
        note,
        status: 'COMPLETED' as const,
      };

      if (mode === 'edit' && disposal) {
        await supabaseService.updateDisposalWithItems(disposal.id, disposalData);
        await supabaseService.completeDisposal(disposal.id);
      } else {
        const created = await supabaseService.createDisposal(disposalData);
        await supabaseService.completeDisposal(created.id);
      }

      alert('Xuất hủy thành công');
      navigate('/inventory/disposals');
    } catch (error) {

      alert('Lỗi hoàn thành xuất hủy');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    );
  }

  const isReadonly = mode === 'view' || (disposal ? disposal.status !== 'DRAFT' : false);

  const statusVariant = (status?: string) => {
    switch (status) {
      case 'DRAFT':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };

  const statusLabel = (status?: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Phiếu tạm';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  const currentDate = new Date().toLocaleDateString('vi-VN');
  const currentTime = new Date().toLocaleTimeString('vi-VN');

  const mainContent = (
    <div className="flex flex-col h-full min-h-0">
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <VoucherEmpty
            icon={<Package size={40} />}
            title="Chưa có sản phẩm nào trong phiếu xuất hủy"
            description="Tìm sản phẩm ở khung tìm kiếm phía trên và chọn để thêm vào danh sách. Bạn có thể điều chỉnh số lượng hủy cho từng dòng."
          />
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0">
            <VoucherTable>
              <thead>
                <tr>
                  <th className="text-center w-12">
                    <span className="sr-only">Xóa</span>
                  </th>
                  <th className="text-center w-12">#</th>
                  <th>Mã hàng</th>
                  <th>Tên hàng</th>
                  <th className="text-center w-24">ĐVT</th>
                  <th className="text-center w-32">Số lượng</th>
                  <th className="text-right w-32">Giá vốn</th>
                  <th className="text-right w-32">Giá trị hủy</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const product = productCacheRef.current.get(item.productId);
                  return (
                    <DisposalRow
                      key={`${item.productId}-${idx}`}
                      item={item}
                      index={idx}
                      product={product}
                      reason={reason}
                      onUpdate={handleUpdateItem}
                      onRemove={handleDeleteItem}
                    />
                  );
                })}
              </tbody>
            </VoucherTable>
          </div>
          <VoucherTotals
            items={[
              { label: 'Mặt hàng', value: stats.productCount },
              { label: 'Tổng SL', value: stats.totalQuantity.toLocaleString('vi-VN') },
              {
                label: 'Tổng giá trị hủy',
                value: `${stats.totalValue.toLocaleString('vi-VN')} ₫`,
                highlight: true,
              },
            ]}
          />
        </>
      )}
    </div>
  );

  const sidebarContent = (
    <>
      <VoucherSection>
        <VoucherSectionHeader title="Thông tin phiếu" />
        <VoucherSectionContent>
          <div className="flex flex-col gap-3">
            <VoucherField label="Ngày giờ tạo">
              <span className="text-sm text-slate-900">
                {currentDate} {currentTime}
              </span>
            </VoucherField>
            {disposal?.code && (
              <VoucherField label="Mã xuất hủy">
                <span className="text-sm font-medium text-slate-900">{disposal.code}</span>
              </VoucherField>
            )}
            <VoucherField label="Trạng thái">
              <StatusBadge
                label={statusLabel(disposal?.status)}
                type={statusVariant(disposal?.status)}
                size="sm"
              />
            </VoucherField>
          </div>
        </VoucherSectionContent>
      </VoucherSection>

      <VoucherSection>
        <VoucherSectionHeader title="Lý do hủy" />
        <VoucherSectionContent>
          <VoucherField label="Lý do hủy" labelFor="disposal-reason">
            <VoucherSelect
              id="disposal-reason"
              options={DISPOSAL_REASONS.map((r) => ({ value: r, label: r }))}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isReadonly}
              placeholder="-- Chọn lý do --"
              fullWidth
            />
          </VoucherField>
        </VoucherSectionContent>
      </VoucherSection>

      <VoucherSection>
        <VoucherSectionHeader title="Ghi chú" />
        <VoucherSectionContent>
          <VoucherField label="Ghi chú" labelFor="disposal-note">
            <VoucherTextarea
              id="disposal-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isReadonly}
              placeholder="Ghi chú nội bộ về phiếu xuất hủy (tuỳ chọn)..."
              rows={3}
              fullWidth
            />
          </VoucherField>
        </VoucherSectionContent>
      </VoucherSection>
    </>
  );

  return (
    <PageLayout>
      <VoucherFormLayout
        className="flex-1 min-h-0"
        title="Xuất hủy"
        onBack={() => navigate('/inventory/disposals')}
        searchValue={searchTerm}
      onSearchChange={handleSearch}
      searchSlot={
        <>
          <VoucherProductDropdown
            mode="server"
            open={showSearchResults}
            results={searchResults}
            onRequestClose={() => setShowSearchResults(false)}
            onSelectProduct={handleAddProduct}
            maxItems={50}
          />
          {isSearching && (
            <div className="absolute left-0 right-0 top-full mt-1 z-40 px-3 py-2 bg-white border border-slate-200 rounded shadow-sm text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Đang tìm sản phẩm…
            </div>
          )}
        </>
      }
      main={mainContent}
      sidebar={sidebarContent}
      actions={
        isReadonly ? (
          <div className="flex items-center gap-2 text-green-600">
            <Check size={20} />
            <span className="text-sm">Phiếu này đã khóa</span>
          </div>
        ) : (
          <>
            <VoucherButton
              variant="secondary"
              size="md"
              fullWidth
              loading={submitLoading}
              disabled={submitLoading}
              icon={<Save size={16} />}
              onClick={handleSaveDraft}
              title="Lưu tạm (chưa ghi nhận tồn kho)"
            >
              Lưu tạm
            </VoucherButton>
            <VoucherButton
              variant="primary"
              size="md"
              fullWidth
              loading={submitLoading}
              disabled={submitLoading}
              icon={<Check size={16} />}
              onClick={handleComplete}
              title="Hoàn thành — ghi nhận tồn kho"
            >
              Hoàn thành
            </VoucherButton>
          </>
        )
      }
      />
    </PageLayout>
  );
};
