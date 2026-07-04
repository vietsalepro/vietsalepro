import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, ProductLot, UnitConversion, Category, Brand } from '../types';
import { Package, Layers, Plus, Trash2, ScanBarcode, Box } from 'lucide-react';
import { capitalizeProductName } from '../utils/stringHelper';
import { useRefactoredProductEditModal } from '../features';
import './ProductEditModal.css';
import { MasterModal } from './MasterModal';
import { SectionBox, SectionHeader, SectionContent } from './SectionBox';
import { TextInput } from './TextInput';
import { SelectInput } from './SelectInput';
import { ActionButton } from './ActionButton';
import { StatusBadge } from './StatusBadge';
import { LoadingState } from './LoadingState';

type TabType = 'general' | 'units';

interface ProductEditModalProps {
  product: Product | null;
  categories: Category[];
  brands: Brand[];
  onSave: (formData: Partial<Product>) => void;
  onClose: () => void;
  onAddCategory: (name: string) => Promise<void>;
  onAddBrand: (name: string) => Promise<void>;
  onOpenScanner: () => void;
  /** Barcode pushed in from parent scanner; when it changes we update formData. */
  scannedBarcode?: string;
}

/** Format a number with thousands separators (vi-VN). Returns '' for 0/empty. */
const formatCurrency = (val: number | undefined): string => {
  if (val === undefined || val === null || val === 0) return '';
  return val.toLocaleString('vi-VN');
};

/** Parse a currency-formatted string back to a number. */
const parseCurrency = (str: string): number => {
  const digits = str.replace(/[^\d]/g, '');
  if (!digits) return 0;
  const n = parseInt(digits, 10);
  return isNaN(n) ? 0 : n;
};

const ProductEditModal: React.FC<ProductEditModalProps> = ({
  product,
  categories,
  brands,
  onSave,
  onClose,
  onAddCategory,
  onAddBrand,
  onOpenScanner,
  scannedBarcode,
}) => {
  const isEdit = !!product;
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isDirty, setIsDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- Form State (mirrors original Inventory.tsx formData shape) ---
  const buildInitial = useCallback((): Partial<Product> => {
    if (product) {
      return {
        ...product,
        conversionUnits: product.conversionUnits || [],
        lots: product.lots || [],
      };
    }
    return {
      name: '',
      code: '',
      displayName: '',
      barcode: '',
      price: 0,
      cost: 0,
      quantity: 0,
      unit: 'Cái',
      category: '',
      brand: '',
      location: '',
      minStock: 0,
      maxStock: 100,
      safetyStock: 10,
      hasBatches: false,
      conversionUnits: [],
      lots: [],
    };
  }, [product]);

  const [formData, setFormData] = useState<Partial<Product>>(buildInitial);

  // Helper state for adding sub-items (units / lots)
  const [newUnit, setNewUnit] = useState<Partial<UnitConversion>>({ name: '', ratio: 1, price: 0 });
  const [newLot, setNewLot] = useState<Partial<ProductLot>>({ code: '', expiryDate: '', quantity: 0 });

  // Reset when the target product changes
  useEffect(() => {
    setFormData(buildInitial());
    setActiveTab('general');
    setIsDirty(false);
  }, [buildInitial]);

  // Apply scanned barcode pushed from parent
  useEffect(() => {
    if (scannedBarcode) {
      setFormData(prev => ({ ...prev, barcode: scannedBarcode }));
      setIsDirty(true);
    }
  }, [scannedBarcode]);

  // Auto-update quantity from lots when lot management is on
  useEffect(() => {
    if (formData.hasBatches && formData.lots) {
      const totalFromLots = formData.lots.reduce((sum, lot) => sum + lot.quantity, 0);
      if (formData.quantity !== totalFromLots) {
        setFormData(prev => ({ ...prev, quantity: totalFromLots }));
      }
    }
  }, [formData.lots, formData.hasBatches]);

  // Generic field setter that flags dirty
  const patch = useCallback((updates: Partial<Product>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  // --- Validation (realtime) ---
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!formData.name || !formData.name.trim()) e.name = 'Tên sản phẩm là bắt buộc';
    if (!formData.code || !formData.code.trim()) e.code = 'SKU là bắt buộc';
    if ((formData.price ?? 0) < 0) e.price = 'Giá bán không hợp lệ';
    if ((formData.cost ?? 0) < 0) e.cost = 'Giá vốn không hợp lệ';
    return e;
  }, [formData.name, formData.code, formData.price, formData.cost]);

  const isValid = Object.keys(errors).length === 0;

  // --- Unit conversion handlers ---
  const handleAddUnit = () => {
    if (!newUnit.name || !newUnit.ratio) return;
    const unit: UnitConversion = {
      id: crypto.randomUUID(),
      name: newUnit.name,
      ratio: Number(newUnit.ratio),
      price: Number(newUnit.price) || 0,
    };
    patch({ conversionUnits: [...(formData.conversionUnits || []), unit] });
    setNewUnit({ name: '', ratio: 1, price: 0 });
  };
  const handleRemoveUnit = (id: string) => {
    patch({ conversionUnits: (formData.conversionUnits || []).filter(u => u.id !== id) });
  };

  // --- Lot handlers ---
  const handleAddLot = () => {
    if (!newLot.code || !newLot.expiryDate || !newLot.quantity) return;
    // ✅ Phase 2C.1: Chặn duplicate lot code (case-insensitive, trimmed)
    const isDuplicate = (formData.lots || []).some(
      l => (l.code || '').trim().toUpperCase() === newLot.code!.trim().toUpperCase()
    );
    if (isDuplicate) {
      alert('Mã lô đã tồn tại trong sản phẩm.');
      return;
    }
    const lot: ProductLot = {
      id: crypto.randomUUID(),
      code: newLot.code,
      expiryDate: newLot.expiryDate,
      quantity: Number(newLot.quantity),
      originalQuantity: Number(newLot.quantity),
    };
    patch({ lots: [...(formData.lots || []), lot] });
    setNewLot({ code: '', expiryDate: '', quantity: 0 });
  };
  const handleRemoveLot = (id: string) => {
    patch({ lots: (formData.lots || []).filter(l => l.id !== id) });
  };

  // --- Close with dirty warning ---
  const handleClose = () => {
    if (isDirty) {
      const ok = window.confirm('Bạn có thay đổi chưa lưu. Đóng và bỏ thay đổi?');
      if (!ok) return;
    }
    onClose();
  };

  // --- Submit ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);

    let finalQuantity = formData.quantity || 0;
    if (formData.hasBatches && formData.lots && formData.lots.length > 0) {
      finalQuantity = formData.lots.reduce((sum, lot) => sum + lot.quantity, 0);
    }
    // Chuẩn hóa tên sản phẩm lần cuối trước khi lưu DB
    const normalizedName = capitalizeProductName(formData.name || '');
    const normalizedDisplayName = capitalizeProductName(formData.displayName || formData.name || '');
    onSave({ ...formData, name: normalizedName, displayName: normalizedDisplayName, quantity: finalQuantity });
  };

  // Keyboard: ESC to close
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);

  const conversionTotal = (formData.lots || []).reduce((s, l) => s + l.quantity, 0);

  const menuItems: { id: TabType; icon: React.ReactNode; title: string; desc: string }[] = [
    { id: 'general', icon: <Package className="w-5 h-5" />, title: 'Thông tin chung', desc: 'Thông tin cơ bản của sản phẩm' },
    { id: 'units', icon: <Layers className="w-5 h-5" />, title: 'Đơn vị, Giá & Tồn kho', desc: 'Thiết lập đơn vị, giá bán và tồn kho' },
  ];

  /* ═══════════════════════════════════════════════════════════════
   *  V2 — Refactored Path (Flag ON)
   *  MasterModal + SectionBox + TextInput + SelectInput +
   *  StatusBadge + ActionButton + LoadingState
   *  Business logic is IDENTICAL to V1 — only JSX/CSS changed.
   *  ═══════════════════════════════════════════════════════════════ */
  if (useRefactoredProductEditModal) {
    const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));
    const brandOptions = brands.map(b => ({ value: b.id, label: b.name }));

    const renderFooter = () => (
      <>
        <ActionButton variant="secondary" onClick={handleClose} type="button">
          Hủy
        </ActionButton>
        <ActionButton
          variant="primary"
          type="submit"
          form="pemFormV2"
          disabled={!isValid || submitting}
          loading={submitting}
        >
          {isEdit ? 'Cập nhật' : 'Lưu sản phẩm'}
        </ActionButton>
      </>
    );

    const renderBadge = () => {
      if (isEdit && product) {
        const isActive = (product as any).isActive !== false;
        return (
          <StatusBadge
            label={isActive ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
            type={isActive ? 'success' : 'warning'}
            size="sm"
          />
        );
      }
      return undefined;
    };

    return (
      <MasterModal
        isOpen
        onClose={handleClose}
        title={isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        icon={<Package className="w-5 h-5" />}
        badge={renderBadge()}
        size="lg"
        footer={renderFooter()}
        isLoading={false}
      >
        {submitting ? (
          <LoadingState message="Đang lưu sản phẩm..." />
        ) : (
          <form id="pemFormV2" onSubmit={handleSubmit} className="pem-v2-body">
            {/* Vertical nav sidebar */}
            <aside className="pem-v2-sidebar">
              {menuItems.map(m => (
                <button
                  key={m.id}
                  type="button"
                  className={`pem-v2-nav-btn${activeTab === m.id ? ' pem-v2-nav-btn--active' : ''}`}
                  onClick={() => setActiveTab(m.id)}
                >
                  <span className="pem-v2-nav-icon">{m.icon}</span>
                  <span>
                    <span className="pem-v2-nav-title">{m.title}</span>
                    <span className="pem-v2-nav-desc">{m.desc}</span>
                  </span>
                </button>
              ))}
            </aside>

            {/* Main content */}
            <div className="pem-v2-content">
              {/* ── Tab: Thông tin chung ── */}
              {activeTab === 'general' && (
                <>
                  <div className="pem-v2-section-header">
                    <p className="pem-v2-section-title">Thông tin chung</p>
                    <p className="pem-v2-section-sub">Cập nhật các thông tin cơ bản của sản phẩm</p>
                  </div>

                  <SectionBox>
                    <SectionHeader title="Tên & mã sản phẩm" />
                    <SectionContent>
                      <div className="pem-v2-grid-2">
                        <TextInput
                          label="Tên sản phẩm"
                          required
                          value={formData.name || ''}
                          onChange={e => patch({ name: e.target.value })}
                          onBlur={() => {
                            const cleaned = capitalizeProductName(formData.name || '');
                            if (cleaned !== (formData.name || '')) {
                              patch({ name: cleaned, displayName: cleaned });
                            }
                          }}
                          placeholder="VD: Sữa Chua Uống Có Đường Yakult 80ml"
                          error={errors.name}
                          fullWidth
                        />
                        <TextInput
                          label="Tên hiển thị"
                          value={formData.displayName || ''}
                          onChange={e => patch({ displayName: e.target.value })}
                          placeholder={formData.name || ''}
                          fullWidth
                        />
                      </div>

                      <div className="pem-v2-grid-3">
                        <TextInput
                          label="SKU"
                          required
                          value={formData.code || ''}
                          onChange={e => patch({ code: e.target.value })}
                          placeholder="VD: 8938501434012"
                          error={errors.code}
                          fullWidth
                        />
                        <div className="pem-v2-barcode-wrap">
                          <TextInput
                            label="Barcode"
                            value={formData.barcode || ''}
                            onChange={e => patch({ barcode: e.target.value })}
                            placeholder="Nhập mã barcode"
                            fullWidth
                          />
                          <button
                            type="button"
                            onClick={onOpenScanner}
                            className="pem-v2-scanner-btn"
                            aria-label="Quét barcode"
                          >
                            <ScanBarcode className="w-4 h-4" />
                          </button>
                        </div>
                        <TextInput
                          label="Vị trí"
                          value={formData.location || ''}
                          onChange={e => patch({ location: e.target.value })}
                          placeholder="Nhập vị trí lưu trữ"
                          fullWidth
                        />
                      </div>
                    </SectionContent>
                  </SectionBox>

                  <SectionBox>
                    <SectionHeader title="Phân loại" />
                    <SectionContent>
                      <div className="pem-v2-grid-2">
                        <div className="pem-v2-field-row">
                          <SelectInput
                            label="Danh mục"
                            options={categoryOptions}
                            placeholder="Chọn danh mục"
                            value={formData.categoryId || formData.category || ''}
                            onChange={e => patch({ categoryId: e.target.value, category: categories.find(c => c.id === e.target.value)?.name || '' })}
                            fullWidth
                          />
                          <button
                            type="button"
                            className="pem-v2-add-btn"
                            onClick={async () => {
                              const name = prompt('Thêm danh mục mới:');
                              if (name) { await onAddCategory(name); patch({ category: name }); }
                            }}
                            aria-label="Thêm danh mục"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="pem-v2-field-row">
                          <SelectInput
                            label="Thương hiệu"
                            options={brandOptions}
                            placeholder="Chọn thương hiệu"
                            value={formData.brandId || formData.brand || ''}
                            onChange={e => patch({ brandId: e.target.value, brand: brands.find(b => b.id === e.target.value)?.name || '' })}
                            fullWidth
                          />
                          <button
                            type="button"
                            className="pem-v2-add-btn"
                            onClick={async () => {
                              const name = prompt('Thêm thương hiệu mới:');
                              if (name) { await onAddBrand(name); patch({ brand: name }); }
                            }}
                            aria-label="Thêm thương hiệu"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="pem-v2-checkbox-row">
                        <input
                          type="checkbox"
                          id="pem-v2-points"
                          checked={formData.isPointAccumulationEnabled || false}
                          onChange={e => patch({ isPointAccumulationEnabled: e.target.checked })}
                        />
                        <label htmlFor="pem-v2-points" className="pem-v2-checkbox-label">
                          Cho phép tích điểm thưởng cho sản phẩm này
                        </label>
                      </div>
                    </SectionContent>
                  </SectionBox>
                </>
              )}

              {/* ── Tab: Đơn vị, Giá & Tồn kho ── */}
              {activeTab === 'units' && (
                <>
                  <div className="pem-v2-section-header">
                    <p className="pem-v2-section-title">Đơn vị, Giá & Tồn kho</p>
                    <p className="pem-v2-section-sub">Thiết lập đơn vị tính, giá bán và quản lý tồn kho</p>
                  </div>

                  <SectionBox>
                    <SectionHeader title="Thông tin đơn vị & giá" />
                    <SectionContent>
                      <div className="pem-v2-grid-4">
                        <TextInput
                          label="Đơn vị cơ bản"
                          value={formData.unit || ''}
                          onChange={e => patch({ unit: e.target.value })}
                          placeholder="VD: Lốc"
                          fullWidth
                        />
                        <TextInput
                          label="Giá vốn"
                          inputMode="numeric"
                          value={formatCurrency(formData.cost)}
                          onChange={e => patch({ cost: parseCurrency(e.target.value) })}
                          placeholder="0"
                          fullWidth
                        />
                        <TextInput
                          label="Giá bán lẻ"
                          inputMode="numeric"
                          value={formatCurrency(formData.price)}
                          onChange={e => patch({ price: parseCurrency(e.target.value) })}
                          placeholder="0"
                          error={errors.price}
                          fullWidth
                        />
                        <TextInput
                          label={formData.hasBatches ? 'Tồn kho (từ lô)' : 'Tồn kho tổng'}
                          type="number"
                          value={String(formData.quantity ?? 0)}
                          onChange={e => !formData.hasBatches && patch({ quantity: Number(e.target.value) })}
                          disabled={formData.hasBatches}
                          fullWidth
                        />
                      </div>
                    </SectionContent>
                  </SectionBox>

                  <SectionBox>
                    <SectionHeader title="Quản lý theo lô" />
                    <SectionContent>
                      <div className="pem-v2-toggle-row">
                        <div className="pem-v2-toggle-label">
                          <Box className="w-4 h-4 pem-v2-toggle-icon" />
                          Quản lý theo lô
                        </div>
                        <label className="pem-v2-switch">
                          <input
                            type="checkbox"
                            checked={formData.hasBatches || false}
                            onChange={e => {
                              const checked = e.target.checked;
                              const currentQty = (product?.quantity || 0) > 0 || (formData.quantity || 0) > 0;
                              if (currentQty) {
                                if (checked) {
                                  alert('Sản phẩm đang có tồn kho. Không thể bật chế độ quản lý theo lô để tránh sai lệch tồn kho!');
                                } else {
                                  alert('Sản phẩm đang có tồn kho. Không thể tắt chế độ quản lý theo lô để tránh sai lệch tồn kho!');
                                }
                                e.preventDefault();
                                return;
                              }
                              patch({ hasBatches: checked, lots: checked ? (formData.lots || []) : [] });
                            }}
                          />
                          <span className="pem-v2-switch-track" />
                          <span className="pem-v2-switch-thumb" />
                        </label>
                      </div>
                      {formData.hasBatches && (
                        <p className="pem-v2-toggle-hint">
                          Khi bật quản lý lô, tổng tồn kho sẽ tự động được tính từ số lượng các lô.
                        </p>
                      )}
                    </SectionContent>
                  </SectionBox>

                  <SectionBox>
                    <SectionHeader title="Đơn vị quy đổi" />
                    <SectionContent>
                      <div className="pem-v2-table">
                        <div className="pem-v2-table-head pem-v2-conv-grid">
                          <div>Đơn vị</div>
                          <div>Tỷ lệ quy đổi</div>
                          <div>Giá bán</div>
                          <div />
                        </div>
                        {(formData.conversionUnits || []).map(u => (
                          <div className="pem-v2-table-row pem-v2-conv-grid" key={u.id}>
                            <div>{u.name}</div>
                            <div className="pem-v2-ratio-wrap">
                              {u.ratio}
                              <span className="pem-v2-ratio-unit">= {u.ratio} {formData.unit}</span>
                            </div>
                            <div>{(u.price ?? 0).toLocaleString('vi-VN')}</div>
                            <div>
                              <button
                                type="button"
                                className="pem-v2-remove-btn"
                                onClick={() => handleRemoveUnit(u.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="pem-v2-table-row pem-v2-table-row--add pem-v2-conv-grid">
                          <TextInput
                            placeholder="Tên đơn vị"
                            value={newUnit.name || ''}
                            onChange={e => setNewUnit({ ...newUnit, name: e.target.value })}
                            fullWidth
                          />
                          <div className="pem-v2-ratio-wrap">
                            <TextInput
                              type="number"
                              value={String(newUnit.ratio ?? 1)}
                              onChange={e => setNewUnit({ ...newUnit, ratio: Number(e.target.value) })}
                            />
                            <span className="pem-v2-ratio-unit">= {newUnit.ratio || 1} {formData.unit || ''}</span>
                          </div>
                          <TextInput
                            type="number"
                            placeholder="0"
                            value={String(newUnit.price ?? 0)}
                            onChange={e => setNewUnit({ ...newUnit, price: Number(e.target.value) })}
                            fullWidth
                          />
                          <div />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="pem-v2-add-link"
                        onClick={handleAddUnit}
                      >
                        + Thêm đơn vị
                      </button>
                    </SectionContent>
                  </SectionBox>

                  {formData.hasBatches && (
                    <SectionBox>
                      <SectionHeader
                        title="Lô & Hạn sử dụng"
                        action={
                          <span className="pem-v2-lot-total">
                            Tổng tồn từ lô: <strong>{conversionTotal}</strong>
                          </span>
                        }
                      />
                      <SectionContent>
                        {(formData.lots || []).length > 0 ? (
                          <div className="pem-v2-table pem-v2-table--mb">
                            <div className="pem-v2-table-head pem-v2-lot-grid">
                              <div>Mã lô</div>
                              <div>Hạn sử dụng</div>
                              <div>Số lượng</div>
                              <div />
                            </div>
                            {(formData.lots || []).map(l => (
                              <div className="pem-v2-table-row pem-v2-lot-grid" key={l.id}>
                                <div>{l.code}</div>
                                <div>{l.expiryDate}</div>
                                <div>{l.quantity}</div>
                                <div>
                                  {!product?.lots?.some(orig => orig.id === l.id) ? (
                                    <button
                                      type="button"
                                      className="pem-v2-remove-btn"
                                      onClick={() => handleRemoveLot(l.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <span className="pem-v2-lock-indicator" title="Lô đã lưu từ trước, không thể xóa trực tiếp">
                                      —
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="pem-v2-lot-empty">
                            Chưa có lô nào. Thêm lô mới bên dưới.
                          </div>
                        )}

                        <div className="pem-v2-grid-4">
                          <TextInput
                            label="Mã lô"
                            placeholder="Nhập mã lô"
                            value={newLot.code || ''}
                            onChange={e => setNewLot({ ...newLot, code: e.target.value })}
                            fullWidth
                          />
                          <TextInput
                            label="Hạn sử dụng"
                            type="date"
                            value={newLot.expiryDate || ''}
                            onChange={e => setNewLot({ ...newLot, expiryDate: e.target.value })}
                            fullWidth
                          />
                          <TextInput
                            label="Số lượng"
                            type="number"
                            placeholder="0"
                            value={String(newLot.quantity || '')}
                            onChange={e => setNewLot({ ...newLot, quantity: Number(e.target.value) })}
                            fullWidth
                          />
                          <ActionButton
                            variant="primary"
                            type="button"
                            onClick={handleAddLot}
                            icon={<Plus className="w-4 h-4" />}
                          >
                            Thêm lô
                          </ActionButton>
                        </div>
                      </SectionContent>
                    </SectionBox>
                  )}
                </>
              )}
            </div>
          </form>
        )}
      </MasterModal>
    );
  }

  return null;
};

export default ProductEditModal;
