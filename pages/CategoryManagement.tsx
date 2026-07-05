import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Plus, Search, Edit, Trash2, Download, Upload, X,
  Tags, CheckCircle2, RefreshCw, AlertTriangle,
  Package, XCircle, TrendingUp,
  ChevronsUpDown, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Check,
} from 'lucide-react';
import { Product, Category } from '../types';
import StatsRow, { StatItem } from '../components/shared/StatsRow';
import { PageLayout } from '../components/shared/PageLayout';
import { DataGridBox } from '../components/shared/DataGridBox';
import { supabaseService } from '../services/supabaseService';

import '../components/shared/FilterBar.css';
import './CategoryManagement.css';

interface CategoryManagementProps {
  products?: Product[];
  categories: Category[];
  onAddCategory: (name: string) => Promise<void>;
  onUpdateCategory: (id: string, name: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

type SortField = 'code' | 'name' | 'productCount' | 'status';
type SortDir = 'asc' | 'desc';
type FilterStatus = 'all' | 'active' | 'inactive' | 'unsync';

/**
 * Chuyển đổi Category (Supabase) → display item
 * Đếm số sản phẩm từ server (categoryProductCounts)
 */
const buildCategoriesWithCount = (
  dbCategories: Category[],
  categoryProductCounts: Map<string, number>,
  unsyncedCategories: Map<string, number>
): any[] => {
  const items: any[] = dbCategories.map((c, idx) => ({
    id: c.id,
    code: `DM${String(idx + 1).padStart(3, '0')}`,
    name: c.name,
    description: '',
    logoUrl: '',
    status: 'active' as const,
    productCount: categoryProductCounts.get(c.id) || 0,
  }));

  // Thêm các danh mục từ sản phẩm chưa có trong bảng categories
  for (const [categoryName, count] of unsyncedCategories) {
    items.push({
      id: `UNSYNC_${categoryName}`,
      code: '—',
      name: categoryName,
      description: 'Chưa có trong danh sách danh mục',
      logoUrl: '',
      status: 'inactive' as const,
      productCount: count,
    });
  }

  return items;
};

const getPageNumbers = (current: number, total: number): (number | '...')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
};

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  products: productsProp, categories, onAddCategory, onUpdateCategory, onDeleteCategory,
}) => {
  // Phase 1: server-side counts and stats instead of full products prop
  const [categoryProductCounts, setCategoryProductCounts] = useState<Map<string, number>>(new Map());
  const [unsyncedCategories, setUnsyncedCategories] = useState<Map<string, number>>(new Map());
  const [productStats, setProductStats] = useState({
    total: 0,
    active: 0,
    lowStock: 0,
    outOfStock: 0,
    inventoryValue: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingStats(true);
    Promise.all([
      supabaseService.getCategoryProductCounts(),
      supabaseService.getUnsyncedCategories(),
      supabaseService.getProductStats(),
    ])
      .then(([counts, unsynced, stats]) => {
        if (cancelled) return;
        const countsMap = new Map<string, number>();
        (counts || []).forEach((c: any) => {
          countsMap.set(c.id, c.product_count || 0);
        });
        const unsyncedMap = new Map<string, number>();
        (unsynced || []).forEach((u: any) => {
          if (u.name) unsyncedMap.set(u.name, (u.count || 0));
        });
        setCategoryProductCounts(countsMap);
        setUnsyncedCategories(unsyncedMap);
        setProductStats({
          total: stats.total || 0,
          active: stats.active || 0,
          lowStock: stats.lowStock || 0,
          outOfStock: stats.outOfStock || 0,
          inventoryValue: stats.inventoryValue || 0,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoadingStats(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Re-fetch counts after add/update/delete category
  const refreshCounts = useCallback(() => {
    Promise.all([
      supabaseService.getCategoryProductCounts(),
      supabaseService.getUnsyncedCategories(),
    ])
      .then(([counts, unsynced]) => {
        const countsMap = new Map<string, number>();
        (counts || []).forEach((c: any) => {
          countsMap.set(c.id, c.product_count || 0);
        });
        const unsyncedMap = new Map<string, number>();
        (unsynced || []).forEach((u: any) => {
          if (u.name) unsyncedMap.set(u.name, (u.count || 0));
        });
        setCategoryProductCounts(countsMap);
        setUnsyncedCategories(unsyncedMap);
      })
      .catch(() => {});
  }, []);

  const dataGridBoxRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({
    code: '', name: '', description: '', logoUrl: '', status: 'active',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isSortFilterOpen, setIsSortFilterOpen] = useState(false);
  const statusOptions = [
    { value: 'all', label: 'Trạng thái' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Ngưng hoạt động' },
    { value: 'unsync', label: 'Chưa đồng bộ' },
  ];
  const sortOptions = [
    { value: '', label: 'Sắp xếp' },
    { value: 'name_asc', label: 'Tên A-Z' },
    { value: 'name_desc', label: 'Tên Z-A' },
    { value: 'productCount_desc', label: 'Nhiều SP nhất' },
    { value: 'productCount_asc', label: 'Ít SP nhất' },
  ];

  // ── Categories with server-side product counts ───────────────────────────────────
  const categoriesWithCount = useMemo(() =>
    buildCategoriesWithCount(categories, categoryProductCounts, unsyncedCategories),
    [categories, categoryProductCounts, unsyncedCategories]
  );

  const statItems: StatItem[] = useMemo(() => [
    {
      label: 'Tổng sản phẩm',
      value: productStats.total,
      subtext: `+${categories.length} danh mục`,
      icon: <Package />,
      colorScheme: 'purple',
    },
    {
      label: 'Sản phẩm hoạt động',
      value: productStats.active,
      subtext: productStats.total > 0
        ? `${((productStats.active / productStats.total) * 100).toFixed(1)}% tổng số sản phẩm`
        : '0% tổng số sản phẩm',
      icon: <CheckCircle2 />,
      colorScheme: 'blue',
    },
    {
      label: 'Sắp hết hàng',
      value: productStats.lowStock,
      subtext: 'Cần nhập hàng sớm',
      icon: <AlertTriangle />,
      colorScheme: 'orange',
    },
    {
      label: 'Hết hàng',
      value: productStats.outOfStock,
      subtext: 'Ngừng kinh doanh',
      icon: <XCircle />,
      colorScheme: 'red',
    },
    {
      label: 'Giá trị tồn kho',
      value: productStats.inventoryValue.toLocaleString('vi-VN') + 'đ',
      subtext: 'Tổng giá trị hàng hóa',
      icon: <TrendingUp />,
      colorScheme: 'green',
    },
  ], [productStats, categories.length]);

  // ── Filter + Sort ────────────────────────────────────────────
  const filteredCategories = useMemo(() => {
    let result = categoriesWithCount;

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter(cat =>
        cat.code.toLowerCase().includes(q) ||
        cat.name.toLowerCase().includes(q)
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter(cat => {
        const isUnsync = cat.id.startsWith('UNSYNC_');
        if (filterStatus === 'unsync') return isUnsync;
        return !isUnsync && cat.status === filterStatus;
      });
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortField] ?? '';
        const bVal = b[sortField] ?? '';
        let cmp = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          cmp = aVal - bVal;
        } else {
          cmp = String(aVal).localeCompare(String(bVal), 'vi');
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [categoriesWithCount, searchTerm, filterStatus, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCategories = filteredCategories.slice(
    startIndex,
    currentPage * pageSize
  );

  const unsyncCount = unsyncedCategories.size;

  // ── Checkbox ─────────────────────────────────────────────────
  const isAllSelected =
    paginatedCategories.length > 0 &&
    paginatedCategories.every(c => selectedIds.has(c.id));
  const isIndeterminate =
    !isAllSelected && paginatedCategories.some(c => selectedIds.has(c.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginatedCategories.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginatedCategories.forEach(c => next.add(c.id));
        return next;
      });
    }
  };

  // ── Sort ─────────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown className="cm-sort-icon" />;
    return sortDir === 'asc'
      ? <ChevronUp className="cm-sort-icon cm-sort-icon--active" />
      : <ChevronDown className="cm-sort-icon cm-sort-icon--active" />;
  };

  // ── Sort dropdown ─────────────────────────────────────────────
  const sortSelectValue = sortField ? `${sortField}_${sortDir}` : '';
  const handleSortSelect = (value: string) => {
    if (!value) { setSortField(null); return; }
    const [field, dir] = value.split('_') as [SortField, SortDir];
    setSortField(field);
    setSortDir(dir);
  };

  // ── Modal ─────────────────────────────────────────────────────
  const resetForm = () => {
    setEditingCategory(null);
    setFormData({ code: '', name: '', description: '', logoUrl: '', status: 'active' });
  };

  const openAddModal = () => { resetForm(); setIsModalOpen(true); };

  const openEditModal = (category: any) => {
    if (category.id.startsWith('UNSYNC_')) {
      if (window.confirm(`Danh mục "${category.name}" chưa có trong danh sách. Bạn có muốn thêm vào hệ thống không?`)) {
        onAddCategory(category.name);
      }
      return;
    }
    setEditingCategory(category);
    setFormData({ ...category });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); resetForm(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = (formData.name || '').trim();
    if (!name) { alert('Vui lòng nhập tên danh mục.'); return; }
    try {
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, name);
      } else {
        await onAddCategory(name);
      }
      refreshCounts();
      closeModal();
    } catch (err) {

      alert('Có lỗi xảy ra khi lưu danh mục.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (id.startsWith('UNSYNC_')) return;
    if (!window.confirm('Xoá danh mục này? Sản phẩm thuộc danh mục sẽ chuyển về "Chưa phân loại".')) return;
    try {
      await onDeleteCategory(id);
      refreshCounts();
    } catch (err) {

      alert('Có lỗi xảy ra khi xóa danh mục.');
    }
  };

  const handleSyncCategory = async (categoryName: string) => {
    try {
      await onAddCategory(categoryName);
      refreshCounts();
    }
    catch (err) {  alert('Có lỗi xảy ra khi đồng bộ danh mục.'); }
  };

  const handleSyncAll = async () => {
    for (const [categoryName] of unsyncedCategories) {
      try { await onAddCategory(categoryName); }
      catch (err) {  }
    }
    refreshCounts();
  };

  const handleDownloadSample = () => {
    const data = [{ code: 'DM001', name: 'Tã', description: 'Mẫu danh mục', logoUrl: '', status: 'active' }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categories');
    XLSX.writeFile(wb, 'mau_danh_muc.xlsx');
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredCategories.map(cat => ({
      'Mã danh mục': cat.code,
      'Tên danh mục': cat.name,
      'Mô tả': cat.description,
      'Trạng thái': cat.status === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động',
      'Số sản phẩm': cat.productCount,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh_Muc');
    XLSX.writeFile(wb, 'danh_sach_danh_muc.xlsx');
  };

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  // ── Render ────────────────────────────────────────────────────
  return (
    <PageLayout>
      {/* VÙNG 1 — Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <span className="inv-title-icon"><Tags className="w-4 h-4" /></span>
          <div>
            <h2 className="page-title">Danh mục sản phẩm</h2>
            <p className="page-subtitle">Quản lý danh mục và tồn kho sản phẩm</p>
          </div>
        </div>
      </div>

      {/* VÙNG 2 — Stats Row */}
      <StatsRow stats={statItems} />

      {/* VÙNG 3 — Banner cảnh báo chưa đồng bộ */}
      {unsyncCount > 0 && (
        <div className="cm-unsync-banner">
          <div className="flex items-center gap-3">
            <AlertTriangle className="cm-unsync-banner__icon" />
            <div>
              <p className="cm-unsync-banner__title">
                Có {unsyncCount} danh mục từ sản phẩm chưa có trong danh sách
              </p>
              <p className="cm-unsync-banner__help">
                Các danh mục này xuất hiện trong sản phẩm nhưng chưa được thêm vào hệ thống.
                Nhấn "Đồng bộ tất cả" hoặc bấm vào từng danh mục để thêm.
              </p>
            </div>
          </div>
          <button onClick={handleSyncAll} className="cm-btn cm-btn--warning">
            <RefreshCw className="cm-btn__icon" /> Đồng bộ tất cả
          </button>
        </div>
      )}

      {/* VÙNG 4 — Main Card */}
      <DataGridBox innerRef={dataGridBoxRef}>

        {/* 4A — Toolbar */}
        <div className="filter-bar">
          {/* Search */}
          <div className="filter-bar__search">
            <Search className="filter-bar__search-icon" />
            <input
              type="text"
              placeholder="Tìm sản phẩm, mã, barcode, danh mục..."
              className="filter-bar__search-input"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
            <span className="cm-search-shortcut">⌘K</span>
          </div>

          {/* Filter pills */}
          <div className="filter-bar__dropdown">
            <button
              onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
              className={`filter-bar__trigger ${filterStatus !== 'all' ? 'filter-bar__trigger--active' : ''}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{statusOptions.find(o => o.value === filterStatus)?.label}</span>
              <ChevronDown className={`filter-bar__chevron ${isStatusFilterOpen ? 'filter-bar__chevron--open' : ''}`} />
            </button>

            {isStatusFilterOpen && (
              <div className="filter-bar__menu">
                <div className="filter-bar__menu-scroll">
                  {statusOptions.map(opt => (
                    <div
                      key={opt.value}
                      className="filter-bar__option"
                      onClick={() => { setFilterStatus(opt.value as FilterStatus); setCurrentPage(1); setIsStatusFilterOpen(false); }}
                    >
                      <div className={`filter-bar__check ${filterStatus === opt.value ? 'filter-bar__check--checked' : ''}`}>
                        {filterStatus === opt.value && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="filter-bar__option-label">{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="filter-bar__dropdown">
            <button
              onClick={() => setIsSortFilterOpen(!isSortFilterOpen)}
              className={`filter-bar__trigger ${sortSelectValue ? 'filter-bar__trigger--active' : ''}`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{sortOptions.find(o => o.value === sortSelectValue)?.label}</span>
              <ChevronDown className={`filter-bar__chevron ${isSortFilterOpen ? 'filter-bar__chevron--open' : ''}`} />
            </button>

            {isSortFilterOpen && (
              <div className="filter-bar__menu">
                <div className="filter-bar__menu-scroll">
                  {sortOptions.map(opt => (
                    <div
                      key={opt.value}
                      className="filter-bar__option"
                      onClick={() => { handleSortSelect(opt.value); setIsSortFilterOpen(false); }}
                    >
                      <div className={`filter-bar__check ${sortSelectValue === opt.value ? 'filter-bar__check--checked' : ''}`}>
                        {sortSelectValue === opt.value && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="filter-bar__option-label">{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="cm-toolbar-actions">
            <button onClick={handleDownloadSample} className="cm-btn cm-btn--secondary">
              <Upload className="cm-btn__icon" /> Mẫu
            </button>
            <button onClick={handleDownloadSample} className="cm-btn cm-btn--secondary">
              <Upload className="cm-btn__icon" /> Nhập
            </button>
            <button onClick={handleExportExcel} className="cm-btn cm-btn--secondary">
              <Download className="cm-btn__icon" /> Xuất
            </button>
            <button onClick={openAddModal} className="cm-btn cm-btn--primary">
              <Plus className="cm-btn__icon" /> Thêm danh mục mới
            </button>
          </div>
        </div>

        {/* 4B — Table */}
        <div className="flex-1 min-h-0 overflow-x-auto">
          <table className="cm-table">
            <thead>
              <tr>
                <th className="cm-th-check">
                  <input
                    type="checkbox"
                    className="cm-checkbox"
                    checked={isAllSelected}
                    ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="cm-th-stt">STT</th>
                <th className="cm-th-sortable w-28" onClick={() => handleSort('code')}>
                  <div className="cm-sort-header">Mã <SortIcon field="code" /></div>
                </th>
                <th className="cm-th-sortable" onClick={() => handleSort('name')}>
                  <div className="cm-sort-header">Tên danh mục <SortIcon field="name" /></div>
                </th>
                <th>Mô tả</th>
                <th className="cm-th-sortable w-28" onClick={() => handleSort('productCount')}>
                  <div className="cm-sort-header justify-center">Số SP <SortIcon field="productCount" /></div>
                </th>
                <th className="cm-th-sortable w-32" onClick={() => handleSort('status')}>
                  <div className="cm-sort-header justify-center">Trạng thái <SortIcon field="status" /></div>
                </th>
                <th className="w-28 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.length > 0 ? paginatedCategories.map((cat, index) => {
                const isUnsync = cat.id.startsWith('UNSYNC_');
                const isSelected = selectedIds.has(cat.id);
                return (
                  <tr
                    key={cat.id}
                    className={[
                      isUnsync ? 'unsync-row' : '',
                      isSelected ? 'cm-row-selected' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <td className="cm-td-check">
                      <input
                        type="checkbox"
                        className="cm-checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(cat.id)}
                      />
                    </td>
                    <td className="cm-td-stt"><span className="cm-stt">{startIndex + index + 1}</span></td>
                    <td><span className="cm-code">{cat.code}</span></td>
                    <td>
                      <div className="cm-table__category-name">{cat.name}</div>
                      {isUnsync && <div className="cm-table__category-meta">Chưa trong hệ thống</div>}
                    </td>
                    <td className="cm-table__description">
                      {cat.description || <span className="cm-table__description-empty">—</span>}
                    </td>
                    <td className="cm-table__cell--center cm-table__count">{cat.productCount}</td>
                    <td className="cm-table__cell--center">
                      <span className={`cm-badge ${isUnsync ? 'unsync' : cat.status}`}>
                        {isUnsync
                          ? <AlertTriangle className="cm-badge__icon" />
                          : cat.status === 'active' ? <CheckCircle2 className="cm-badge__icon" /> : null}
                        {isUnsync ? 'Chưa đồng bộ' : cat.status === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        {isUnsync ? (
                          <button
                            onClick={() => handleSyncCategory(cat.name)}
                            className="cm-action-btn sync"
                            title="Thêm vào hệ thống"
                          >
                            <RefreshCw className="cm-action-btn__icon" />
                          </button>
                        ) : (
                          <>
                            <button onClick={() => openEditModal(cat)} className="cm-action-btn edit" title="Sửa">
                              <Edit className="cm-action-btn__icon" />
                            </button>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="cm-action-btn delete" title="Xóa">
                              <Trash2 className="cm-action-btn__icon" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="cm-empty-state">
                    Không tìm thấy danh mục phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4C — Pagination */}
        <div className="cm-pagination">
          <p className="cm-pagination__info">
            Hiển thị{' '}
            <strong>{filteredCategories.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong>
            {' – '}
            <strong>{Math.min(currentPage * pageSize, filteredCategories.length)}</strong>
            {' '}trên tổng số{' '}
            <strong>{filteredCategories.length}</strong> danh mục
          </p>

          <div className="cm-pagination__controls">
            <button
              className="cm-pagination__nav"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft className="cm-pagination__nav-icon" />
            </button>

            {pageNumbers.map((n, i) =>
              n === '...'
                ? <span key={`e${i}`} className="cm-pagination__ellipsis">...</span>
                : (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n as number)}
                    className={`cm-pagination__page${currentPage === n ? ' active' : ''}`}
                  >
                    {n}
                  </button>
                )
            )}

            <button
              className="cm-pagination__nav"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight className="cm-pagination__nav-icon" />
            </button>
          </div>
        </div>
      </DataGridBox>

      {/* VÙNG 5 — Modal thêm/sửa */}
      {isModalOpen && (
        <div className="cm-modal-overlay">
          <div className="cm-modal">
            <div className="cm-modal__header">
              <div>
                <h3 className="cm-modal__title">
                  {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
                </h3>
                <p className="cm-modal__subtitle">Cập nhật thông tin danh mục và trạng thái hoạt động</p>
              </div>
              <button onClick={closeModal} className="cm-modal__close">
                <X className="cm-modal__close-icon" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="cm-modal__body">
              <div className="cm-modal__form-grid">
                <div className="cm-modal__field">
                  <label className="cm-modal__label">
                    Tên danh mục <span className="cm-modal__label-required">*</span>
                  </label>
                  <input
                    className="cm-modal__input"
                    value={formData.name || ''}
                    onChange={e => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nhập tên danh mục (VD: Tã, Bỉm, Sữa...)"
                    autoFocus
                  />
                </div>
                <div className="cm-modal__field">
                  <label className="cm-modal__label">Mô tả</label>
                  <input
                    className="cm-modal__input"
                    value={formData.description || ''}
                    onChange={e => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả ngắn về danh mục"
                  />
                </div>
              </div>

              <div className="cm-modal__footer">
                <button type="button" onClick={closeModal} className="cm-btn cm-btn--ghost">Huỷ</button>
                <button type="submit" className="cm-btn cm-btn--primary">
                  {editingCategory ? 'Cập nhật' : 'Lưu danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default CategoryManagement;
