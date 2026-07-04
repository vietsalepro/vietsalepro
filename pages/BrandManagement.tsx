import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Search, Edit, Trash2, Download, Upload, X, ChevronLeft, ChevronRight, Bookmark, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Product, Brand, BrandManagementItem } from '../types';
import { PageLayout } from '../components/shared/PageLayout';
import { DataGridBox } from '../components/shared/DataGridBox';
import { supabaseService } from '../services/supabaseService';

import '../components/shared/FilterBar.css';
import './BrandManagement.css';

interface BrandManagementProps {
  products?: Product[];
  brands: Brand[];
  onAddBrand: (name: string) => Promise<void>;
  onUpdateBrand: (id: string, name: string) => Promise<void>;
  onDeleteBrand: (id: string) => Promise<void>;
}

const PAGE_SIZE = 10;

const makeCode = (index: number) => `TH${String(index + 1).padStart(3, '0')}`;

/**
 * Chuyển đổi Brand (Supabase) → BrandManagementItem
 * Đếm số sản phẩm từ server (brandProductCounts)
 */
const buildBrandsWithCount = (
  dbBrands: Brand[],
  brandProductCounts: Map<string, number>,
  unsyncedBrands: Map<string, number>
): any[] => {
  const items: any[] = dbBrands.map((b, idx) => ({
    id: b.id,
    code: makeCode(idx),
    name: b.name,
    description: '',
    logoUrl: '',
    status: 'active' as const,
    productCount: brandProductCounts.get(b.id) || 0,
  }));

  // Thêm các thương hiệu từ sản phẩm chưa có trong bảng brands
  for (const [brandName, count] of unsyncedBrands) {
    items.push({
      id: `UNSYNC_${brandName}`,
      code: '—',
      name: brandName,
      description: 'Chưa có trong danh sách thương hiệu',
      logoUrl: '',
      status: 'inactive' as const,
      productCount: count,
    });
  }

  return items;
};

export const BrandManagement: React.FC<BrandManagementProps> = ({ products: productsProp, brands, onAddBrand, onUpdateBrand, onDeleteBrand }) => {
  // Phase 1: server-side counts instead of full products prop
  const [brandProductCounts, setBrandProductCounts] = useState<Map<string, number>>(new Map());
  const [unsyncedBrands, setUnsyncedBrands] = useState<Map<string, number>>(new Map());

  const refreshCounts = useCallback(() => {
    Promise.all([
      supabaseService.getBrandProductCounts(),
      supabaseService.getUnsyncedBrands(),
    ])
      .then(([counts, unsynced]) => {
        const countsMap = new Map<string, number>();
        (counts || []).forEach((b: any) => {
          countsMap.set(b.id, b.product_count || 0);
        });
        const unsyncedMap = new Map<string, number>();
        (unsynced || []).forEach((u: any) => {
          if (u.name) unsyncedMap.set(u.name, u.count || 0);
        });
        setBrandProductCounts(countsMap);
        setUnsyncedBrands(unsyncedMap);
      })
      .catch(err => console.error('BrandManagement: refresh counts error', err));
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  const dataGridBoxRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(PAGE_SIZE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({
    code: '',
    name: '',
    description: '',
    logoUrl: '',
    status: 'active',
  });

  // Brands with server-side product counts
  const brandsWithCount = useMemo(() => {
    return buildBrandsWithCount(brands, brandProductCounts, unsyncedBrands);
  }, [brands, brandProductCounts, unsyncedBrands]);

  const filteredBrands = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return brandsWithCount;
    return brandsWithCount.filter(brand =>
      brand.code.toLowerCase().includes(q) ||
      brand.name.toLowerCase().includes(q)
    );
  }, [brandsWithCount, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredBrands.length / pageSize));
  const paginatedBrands = filteredBrands.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetForm = () => {
    setEditingBrand(null);
    setFormData({ code: '', name: '', description: '', logoUrl: '', status: 'active' });
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (brand: any) => {
    // Không cho sửa các thương hiệu chưa sync (chỉ cho thêm vào hệ thống)
    if (brand.id.startsWith('UNSYNC_')) {
      // Hỏi người dùng có muốn thêm thương hiệu này vào hệ thống không
      if (window.confirm(`Thương hiệu "${brand.name}" chưa có trong danh sách. Bạn có muốn thêm vào hệ thống không?`)) {
        onAddBrand(brand.name);
      }
      return;
    }
    setEditingBrand(brand);
    setFormData({ ...brand });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = (formData.name || '').trim();
    if (!name) {
      alert('Vui lòng nhập tên thương hiệu.');
      return;
    }

    try {
      if (editingBrand) {
        await onUpdateBrand(editingBrand.id, name);
      } else {
        await onAddBrand(name);
      }
      refreshCounts();
      closeModal();
    } catch (err) {
      console.error('Error saving brand:', err);
      alert('Có lỗi xảy ra khi lưu thương hiệu.');
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (id.startsWith('UNSYNC_')) return;
    try {
      await onDeleteBrand(id);
      refreshCounts();
    } catch (err) {
      console.error('Error deleting brand:', err);
      alert('Có lỗi xảy ra khi xóa thương hiệu.');
    }
  };

  const handleSyncBrand = async (brandName: string) => {
    try {
      await onAddBrand(brandName);
      refreshCounts();
    } catch (err) {
      console.error('Error syncing brand:', err);
      alert('Có lỗi xảy ra khi đồng bộ thương hiệu.');
    }
  };

  const handleSyncAll = async () => {
    for (const [brandName] of unsyncedBrands) {
      try {
        await onAddBrand(brandName);
      } catch (err) {
        console.warn(`Không thể thêm thương hiệu "${brandName}":`, err);
      }
    }
    refreshCounts();
  };

  const handleDownloadSample = () => {
    const data = [{ code: 'TH006', name: 'Puma', description: 'Mẫu thương hiệu', logoUrl: '', status: 'active' }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Brands');
    XLSX.writeFile(wb, 'mau_thuong_hieu.xlsx');
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredBrands.map(brand => ({
      'Mã thương hiệu': brand.code,
      'Tên thương hiệu': brand.name,
      'Mô tả': brand.description,
      'Logo': brand.logoUrl,
      'Trạng thái': brand.status === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động',
      'Số sản phẩm': brand.productCount,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Thuong_Hieu');
    XLSX.writeFile(wb, 'danh_sach_thuong_hieu.xlsx');
  };

  const unsyncCount = unsyncedBrands.size;

  return (
    <PageLayout>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <span className="inv-title-icon"><Bookmark className="w-4 h-4" /></span>
          <div>
            <h2 className="page-title">Quản lý thương hiệu</h2>
            <p className="page-subtitle">Quản lý danh sách thương hiệu, trạng thái và số lượng sản phẩm</p>
          </div>
        </div>
      </div>

      {/* Cảnh báo thương hiệu chưa đồng bộ */}
      {unsyncCount > 0 && (
        <div className="bm-unsync-banner">
          <div className="flex items-center gap-3">
            <AlertTriangle className="bm-unsync-banner__icon" />
            <div>
              <p className="bm-unsync-banner__title">
                Có {unsyncCount} thương hiệu từ sản phẩm chưa có trong danh sách
              </p>
              <p className="bm-unsync-banner__help">
                Các thương hiệu này xuất hiện trong sản phẩm nhưng chưa được thêm vào hệ thống. Nhấn "Đồng bộ tất cả" hoặc bấm vào từng thương hiệu để thêm.
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncAll}
            className="bm-btn bm-btn--warning"
          >
            <RefreshCw className="bm-btn__icon" /> Đồng bộ tất cả
          </button>
        </div>
      )}

      <DataGridBox innerRef={dataGridBoxRef}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-5">
          <div className="filter-bar__search">
            <Search className="filter-bar__search-icon" />
            <input
              type="text"
              placeholder="Tìm theo mã hoặc tên thương hiệu..."
              className="filter-bar__search-input"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleDownloadSample} className="bm-btn bm-btn--secondary">
              <Upload className="bm-btn__icon" /> Nhập Excel mẫu
            </button>
            <button onClick={handleExportExcel} className="bm-btn bm-btn--secondary">
              <Download className="bm-btn__icon" /> Xuất Excel
            </button>
            <button onClick={openAddModal} className="bm-btn bm-btn--primary">
              <Plus className="bm-btn__icon" /> Thêm thương hiệu mới
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-x-auto">
          <table className="bm-table">
            <thead>
              <tr>
                <th className="w-28">Mã</th>
                <th className="w-44">Tên thương hiệu</th>
                <th>Mô tả</th>
                <th className="w-28 text-center">Số sản phẩm</th>
                <th className="w-32 text-center">Trạng thái</th>
                <th className="w-28 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBrands.length > 0 ? paginatedBrands.map(brand => {
                const isUnsync = brand.id.startsWith('UNSYNC_');
                return (
                  <tr key={brand.id} className={isUnsync ? 'unsync-row' : ''}>
                    <td><span className="bm-code">{brand.code}</span></td>
                    <td>
                      <div className="bm-table__brand-name">{brand.name}</div>
                      {isUnsync && <div className="bm-table__brand-meta">Chưa trong hệ thống</div>}
                    </td>
                    <td className="bm-table__description">{brand.description || <span className="bm-table__description-empty">—</span>}</td>
                    <td className="bm-table__cell--center bm-table__count">{brand.productCount}</td>
                    <td className="bm-table__cell--center">
                      <span className={`bm-badge ${isUnsync ? 'unsync' : brand.status}`}>
                        {isUnsync ? (
                          <AlertTriangle className="bm-badge__icon" />
                        ) : brand.status === 'active' ? (
                          <CheckCircle2 className="bm-badge__icon" />
                        ) : null}
                        {isUnsync ? 'Chưa đồng bộ' : brand.status === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        {isUnsync ? (
                          <button
                            onClick={() => handleSyncBrand(brand.name)}
                            className="bm-action-btn sync"
                            title="Thêm vào hệ thống"
                          >
                            <RefreshCw className="bm-action-btn__icon" />
                          </button>
                        ) : (
                          <>
                            <button onClick={() => openEditModal(brand)} className="bm-action-btn edit" title="Sửa">
                              <Edit className="bm-action-btn__icon" />
                            </button>
                            <button onClick={() => handleDeleteBrand(brand.id)} className="bm-action-btn delete" title="Xóa">
                              <Trash2 className="bm-action-btn__icon" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="bm-empty-state">
                    Không tìm thấy thương hiệu phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bm-pagination">
          <p>Hiển thị {filteredBrands.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredBrands.length)} / {filteredBrands.length} thương hiệu</p>
          <div className="bm-pagination__actions">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="bm-pagination__btn">
              <ChevronLeft className="bm-pagination__btn-icon" /> Trước
            </button>
            <span className="bm-pagination__indicator">{currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="bm-pagination__btn">
              Sau <ChevronRight className="bm-pagination__btn-icon" />
            </button>
          </div>
        </div>
      </DataGridBox>

      {isModalOpen && (
        <div className="bm-modal-overlay">
          <div className="bm-modal">
            <div className="bm-modal__header">
              <div>
                <h3 className="bm-modal__title">{editingBrand ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}</h3>
                <p className="bm-modal__subtitle">Cập nhật thông tin thương hiệu và trạng thái hoạt động</p>
              </div>
              <button onClick={closeModal} className="bm-modal__close">
                <X className="bm-modal__close-icon" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="bm-modal__body">
              <div className="bm-modal__form-grid">
                <div className="bm-modal__field">
                  <label className="bm-modal__label">Tên thương hiệu <span className="bm-modal__label-required">*</span></label>
                  <input
                    className="bm-modal__input"
                    value={formData.name || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nhập tên thương hiệu"
                    autoFocus
                  />
                </div>
                <div className="bm-modal__field">
                  <label className="bm-modal__label">Mô tả</label>
                  <input
                    className="bm-modal__input"
                    value={formData.description || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả ngắn về thương hiệu"
                  />
                </div>
              </div>

              <div className="bm-modal__footer">
                <button type="button" onClick={closeModal} className="bm-btn bm-btn--ghost">
                  Huỷ
                </button>
                <button type="submit" className="bm-btn bm-btn--primary">
                  {editingBrand ? 'Cập nhật' : 'Lưu thương hiệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default BrandManagement;
