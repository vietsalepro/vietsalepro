import React, { useState, useEffect } from 'react';
import { Product, Category, Brand } from '../types';
import { Package, Search, Plus, X, Edit2, Trash2, Barcode, Loader2 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { useDebounce } from '../hooks/useDebounce';
import MobileLayout from './MobileLayout';
import './MobileInventory.css';

interface MobileInventoryProps {
  products?: Product[];
  categories: Category[];
  brands: Brand[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory?: (name: string) => void;
  onUpdateCategory?: (id: string, name: string) => void;
  onDeleteCategory?: (id: string) => void;
  onAddBrand?: (name: string) => void;
  onUpdateBrand?: (id: string, name: string) => void;
  onDeleteBrand?: (id: string) => void;
}

const PAGE_SIZE = 30;

function MobileInventory(props: MobileInventoryProps) {
  const { categories, brands, onAddProduct, onUpdateProduct, onDeleteProduct } = props;
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'low' | 'out'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Server-side filter & pagination
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { products: pageProducts, totalCount: count } = await supabaseService.filterProductsPaginated(
          currentPage,
          PAGE_SIZE,
          debouncedSearchTerm,
          { stockStatus: filterStatus === 'all' ? undefined : filterStatus }
        );
        if (cancelled) return;
        setDisplayedProducts(pageProducts);
        setTotalCount(count);
      } catch (err) {
        if (cancelled) return;

        setError('Không thể tải danh sách sản phẩm');
        setDisplayedProducts([]);
        setTotalCount(0);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [debouncedSearchTerm, filterStatus, currentPage]);

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      onUpdateProduct(product);
    } else {
      onAddProduct(product);
    }
    setShowAddModal(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('B?n có ch?c ch?n mu?n xoá s?n ph?m này?')) {
      onDeleteProduct(id);
    }
  };

  return (
    <MobileLayout>
      <div className="m-bg minv-page m-with-nav">
        {/* Header */}
        <div className="minv-header">
          <div>
            <h2 className="minv-title">Hàng hoá</h2>
            <p className="minv-subtitle">{totalCount} sản phẩm</p>
          </div>
          <button
            onClick={() => { setEditingProduct(null); setShowAddModal(true); }}
            className="btn-primary minv-add-btn"
          >
            <Plus className="minv-add-btn-icon" /> Thêm
          </button>
        </div>

        {/* Search */}
        <div className="m-search minv-search">
          <Search className="minv-search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="minv-search-input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter chips */}
        <div className="minv-filters">
          {[
            { key: 'all' as const, label: 'Tất cả', activeClass: 'minv-filter-chip--all' },
            { key: 'available' as const, label: 'Còn hàng', activeClass: 'minv-filter-chip--available' },
            { key: 'low' as const, label: 'Sắp hết', activeClass: 'minv-filter-chip--low' },
            { key: 'out' as const, label: 'Hết hàng', activeClass: 'minv-filter-chip--out' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={
                'minv-filter-chip ' +
                (filterStatus === f.key ? f.activeClass : 'minv-filter-chip--inactive')
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Product list */}
        {isLoading ? (
          <div className="m-card minv-empty">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 minv-empty-icon" />
            <p className="minv-empty-title">Đang tải...</p>
          </div>
        ) : error ? (
          <div className="m-card minv-empty">
            <div className="minv-empty-icon-wrap">
              <Package className="minv-empty-icon" />
            </div>
            <p className="minv-empty-title">Lỗi tải dữ liệu</p>
            <p className="minv-empty-hint">{error}</p>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="m-card minv-empty">
            <div className="minv-empty-icon-wrap">
              <Package className="minv-empty-icon" />
            </div>
            <p className="minv-empty-title">Không có sản phẩm</p>
            <p className="minv-empty-hint">Thêm sản phẩm mới để bắt đầu.</p>
          </div>
        ) : (
          <>
            <div className="minv-list">
              {displayedProducts.map(product => {
                const qty = product.quantity ?? 0;
                const isOut = qty <= 0;
                const isLow = !isOut && qty <= (product.minStock || 5);
                const isOk = !isOut && !isLow;
                return (
                  <div
                    key={product.id}
                    className="m-card minv-card"
                  >
                    {/* Icon with stock indicator */}
                    <div className="minv-card-icon-wrap">
                      <div
                        className={
                          'minv-card-icon ' +
                          (isOut ? 'minv-card-icon--out' :
                          isLow ? 'minv-card-icon--low' :
                          'minv-card-icon--ok')
                        }
                      >
                        <Package className="minv-card-icon-svg" strokeWidth={2.4} />
                      </div>
                      {(isOut || isLow) && (
                        <span className={'minv-card-badge ' + (isOut ? 'minv-card-badge--out' : 'minv-card-badge--low')} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="minv-card-info">
                      <p className="minv-card-name">{product.name}</p>
                      <div className="minv-card-meta">
                        <span>
                          Tồn: <strong className={
                            'minv-card-stock ' +
                            (isOut ? 'minv-card-stock--out' : isLow ? 'minv-card-stock--low' : 'minv-card-stock--ok')
                          }>{product.quantity}</strong>
                        </span>
                        <span className="minv-card-dot">•</span>
                        <span className="minv-card-price">
                          {product.price?.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                      {product.category && (
                        <span className="minv-card-category">
                          {product.category}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="minv-card-actions">
                      <button
                        onClick={() => { setEditingProduct(product); setShowAddModal(true); }}
                        className="minv-action-btn minv-action-btn--edit"
                        aria-label="Sửa"
                      >
                        <Edit2 className="minv-action-btn-icon" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="minv-action-btn minv-action-btn--delete"
                        aria-label="Xoá"
                      >
                        <Trash2 className="minv-action-btn-icon" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="m-card minv-pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="minv-page-btn"
                >
                  Trước
                </button>
                <span className="minv-page-info">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="minv-page-btn--next"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {(showAddModal || editingProduct) && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          brands={brands}
          onSave={handleSaveProduct}
          onClose={() => { setShowAddModal(false); setEditingProduct(null); }}
        />
      )}
    </MobileLayout>
  );
}

// ---- Product Form Modal ----
interface ProductFormModalProps {
  product: Product | null;
  categories: Category[];
  brands: Brand[];
  onSave: (product: Product) => void;
  onClose: () => void;
}

function ProductFormModal({ product, categories, brands, onSave, onClose }: ProductFormModalProps) {
  const isEdit = !!product;
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [cost, setCost] = useState(product?.cost?.toString() || '');
  const [quantity, setQuantity] = useState(product?.quantity?.toString() || '0');
  const [unit, setUnit] = useState(product?.unit || 'Cái');
  const [categoryId, setCategoryId] = useState(product?.categoryId || '');
  const [brandId, setBrandId] = useState(product?.brandId || '');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [minStock, setMinStock] = useState(product?.minStock?.toString() || '5');
  const [isPointAccumulationEnabled, setIsPointAccumulationEnabled] = useState(product?.isPointAccumulationEnabled ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { alert('Vui lòng nh?p tên s?n ph?m.'); return; }
    
    // Dual-write: lưu cả id lẫn name
    const selectedCategory = categories.find(c => c.id === categoryId);
    const selectedBrand = brands.find(b => b.id === brandId);
    
    const productData: Product = {
      ...(product || { id: crypto.randomUUID() }),
      id: product?.id || crypto.randomUUID(),
      name: name.trim(),
      code: product?.code || '',
      price: parseFloat(price) || 0,
      cost: parseFloat(cost) || 0,
      quantity: parseInt(quantity) || 0,
      unit,
      categoryId: categoryId || undefined,
      category: selectedCategory?.name || '',
      brandId: brandId || undefined,
      brand: selectedBrand?.name || '',
      barcode,
      minStock: parseInt(minStock) || 5,
      isPointAccumulationEnabled,
      conversionUnits: product?.conversionUnits || [],
    };
    onSave(productData);
  };

  return (
    <div className="minv-modal-overlay">
      <div className="minv-modal">
        <div className="minv-modal-header">
          <h3 className="minv-modal-title">
            {isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
          </h3>
          <button onClick={onClose} className="minv-modal-close">
            <X className="minv-modal-close-icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="minv-form">
          <div>
            <label className="minv-form-label">Tên sản phẩm *</label>
            <input
              type="text" required
              className="minv-form-input"
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Nhập tên sản phẩm"
            />
          </div>

          <div className="minv-form-grid">
            <div>
              <label className="minv-form-label">Giá bán</label>
              <input
                type="number"
                className="minv-form-input"
                value={price} onChange={e => setPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="minv-form-label">Giá vốn</label>
              <input
                type="number"
                className="minv-form-input"
                value={cost} onChange={e => setCost(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="minv-form-grid">
            <div>
              <label className="minv-form-label">Số lượng</label>
              <input
                type="number"
                className="minv-form-input"
                value={quantity} onChange={e => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <label className="minv-form-label">Đơn vị</label>
              <input
                type="text"
                className="minv-form-input"
                value={unit} onChange={e => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="minv-form-grid">
            <div>
              <label className="minv-form-label">Danh mục</label>
              <select
                className="minv-form-input"
                value={categoryId} onChange={e => setCategoryId(e.target.value)}
              >
                <option value="">Chọn danh mục</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="minv-form-label">Thương hiệu</label>
              <select
                className="minv-form-input"
                value={brandId} onChange={e => setBrandId(e.target.value)}
              >
                <option value="">Chọn thương hiệu</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="minv-form-label">Mã vạch</label>
            <div className="minv-barcode-wrap">
              <Barcode className="minv-barcode-icon" />
              <input
                type="text"
                className="minv-barcode-input"
                value={barcode} onChange={e => setBarcode(e.target.value)}
                placeholder="Nhập mã vạch"
              />
            </div>
          </div>

          <div className="minv-minstock-row">
            <label className="minv-minstock-label">Cảnh báo tồn tối thiểu</label>
            <input
              type="number"
              className="minv-minstock-input"
              value={minStock} onChange={e => setMinStock(e.target.value)}
            />
          </div>

          <label className="minv-checkbox-label">
            <input
              type="checkbox"
              checked={isPointAccumulationEnabled}
              onChange={e => setIsPointAccumulationEnabled(e.target.checked)}
              className="minv-checkbox"
            />
            <div>
              <p className="minv-checkbox-title">Tích luỹ điểm thưởng</p>
              <p className="minv-checkbox-desc">Cho phép sản phẩm này được tích điểm khi mua hàng</p>
            </div>
          </label>

          <div className="minv-form-actions">
            <button type="submit" className="minv-submit-btn">
              {isEdit ? 'Cập nhật' : 'Thêm sản phẩm'}
            </button>
            <button type="button" onClick={onClose} className="minv-cancel-btn">
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MobileInventory;