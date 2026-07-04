import React, { useState } from 'react';
import { Search, ChevronDown, Check, X, RotateCcw, Layers, Calendar, ArrowUpDown } from 'lucide-react';
import './shared/FilterBar.css';

export interface FilterState {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  variance?: string;
  createdBy?: string;
}

interface AdvancedFilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  suppliers?: { id: string; name: string }[];
  resultCount?: number;
  totalCount?: number;
  keyword?: string;
  onKeywordChange?: (value: string) => void;
}

const statusOptions = [
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'pending_check', label: 'Chờ kiểm kê' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const statusLabels: Record<string, string> = {
  completed: 'Hoàn thành',
  processing: 'Đang xử lý',
  pending_check: 'Chờ kiểm kê',
  cancelled: 'Đã hủy',
};

const varianceOptions = [
  { value: 'none', label: 'Không có chênh lệch' },
  { value: 'shortage', label: 'Thiếu hàng' },
  { value: 'excess', label: 'Thừa hàng' },
  { value: 'variance', label: 'Có chênh lệch' },
];

const varianceLabels: Record<string, string> = {
  none: 'Không lệch',
  shortage: 'Thiếu hàng',
  excess: 'Thừa hàng',
  variance: 'Có chênh lệch',
};

const quickDateOptions = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'last7', label: '7 ngày' },
  { value: 'last30', label: '30 ngày' },
  { value: 'thisMonth', label: 'Tháng này' },
];

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  suppliers = [],
  resultCount,
  totalCount,
  keyword = '',
  onKeywordChange,
}) => {
  // Dropdown open states
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isVarianceOpen, setIsVarianceOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const [localDateFrom, setLocalDateFrom] = useState(filters.dateFrom || '');
  const [localDateTo, setLocalDateTo] = useState(filters.dateTo || '');

  const handleQuickDate = (preset: string) => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = today.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        dateFrom = dateTo;
        break;
      case 'last7': {
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        dateFrom = last7.toISOString().split('T')[0];
        break;
      }
      case 'last30': {
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        dateFrom = last30.toISOString().split('T')[0];
        break;
      }
      case 'thisMonth':
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
    }

    setLocalDateFrom(dateFrom);
    setLocalDateTo(dateTo);
    onFiltersChange({ ...filters, dateFrom, dateTo });
    onApplyFilters();
  };

  const applyDateFilter = () => {
    onFiltersChange({
      ...filters,
      dateFrom: localDateFrom || undefined,
      dateTo: localDateTo || undefined,
    });
    onApplyFilters();
    setIsDateOpen(false);
  };

  const applyFilter = (key: keyof FilterState, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
    onApplyFilters();
  };

  const hasActiveFilters =
    filters.status ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.variance ||
    filters.createdBy;

  return (
    <>
      {/* Toolbar-style Filter Bar — matches Kiểm kê layout */}
      <div className="filter-bar">
        {/* Search Bar */}
        <div className="filter-bar__search">
          <Search className="filter-bar__search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm phiếu nhập..."
            className="filter-bar__search-input"
            value={keyword}
            onChange={(e) => onKeywordChange?.(e.target.value)}
          />
        </div>

        {/* Status Dropdown Filter */}
        <div className="filter-bar__dropdown">
          <button
            onClick={() => { setIsStatusOpen(!isStatusOpen); setIsDateOpen(false); setIsVarianceOpen(false); setIsCreatorOpen(false); }}
            className={`filter-bar__trigger${filters.status ? ' filter-bar__trigger--active' : ''}`}
          >
            <Layers />
            <span>Trạng thái{filters.status ? `: ${statusLabels[filters.status] || filters.status}` : ''}</span>
            <ChevronDown className={`filter-bar__chevron${isStatusOpen ? ' filter-bar__chevron--open' : ''}`} />
          </button>

          {isStatusOpen && (
            <div className="filter-bar__menu animate-fade-in">
              <div className="filter-bar__menu-scroll">
                <div
                  className="filter-bar__option"
                  onClick={() => { applyFilter('status', undefined); setIsStatusOpen(false); }}
                >
                  <div className={`filter-bar__check${!filters.status ? ' filter-bar__check--checked' : ''}`}>
                    {!filters.status && <Check />}
                  </div>
                  <span className="filter-bar__option-label">Tất cả</span>
                </div>
                {statusOptions.map(opt => (
                  <div
                    key={opt.value}
                    className="filter-bar__option"
                    onClick={() => { applyFilter('status', opt.value); setIsStatusOpen(false); }}
                  >
                    <div className={`filter-bar__check${filters.status === opt.value ? ' filter-bar__check--checked' : ''}`}>
                      {filters.status === opt.value && <Check />}
                    </div>
                    <span className="filter-bar__option-label">{opt.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="filter-bar__dropdown">
          <button
            onClick={() => { setIsDateOpen(!isDateOpen); setIsStatusOpen(false); setIsVarianceOpen(false); setIsCreatorOpen(false); }}
            className={`filter-bar__trigger${filters.dateFrom || filters.dateTo ? ' filter-bar__trigger--active' : ''}`}
          >
            <Calendar />
            <span>Ngày{filters.dateFrom || filters.dateTo ? ': Đã chọn' : ''}</span>
            <ChevronDown className={`filter-bar__chevron${isDateOpen ? ' filter-bar__chevron--open' : ''}`} />
          </button>

          {isDateOpen && (
            <div className="filter-bar__menu filter-bar__menu--wide animate-fade-in">
              <div className="filter-bar__date-quick">
                <label className="filter-bar__date-quick-label">Chọn nhanh</label>
                <div className="filter-bar__date-quick-grid">
                  {quickDateOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleQuickDate(opt.value)}
                      className="filter-bar__date-quick-btn"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-bar__date-body">
                <div className="filter-bar__date-field">
                  <label className="filter-bar__date-label">Từ ngày</label>
                  <input
                    type="date"
                    className="filter-bar__date-input"
                    value={localDateFrom}
                    onChange={(e) => setLocalDateFrom(e.target.value)}
                  />
                </div>
                <div className="filter-bar__date-field">
                  <label className="filter-bar__date-label">Đến ngày</label>
                  <input
                    type="date"
                    className="filter-bar__date-input"
                    value={localDateTo}
                    onChange={(e) => setLocalDateTo(e.target.value)}
                  />
                </div>
                <div className="filter-bar__date-actions">
                  <button onClick={applyDateFilter} className="filter-bar__date-apply">Áp dụng</button>
                  <button onClick={() => { setLocalDateFrom(''); setLocalDateTo(''); onFiltersChange({ ...filters, dateFrom: undefined, dateTo: undefined }); onApplyFilters(); setIsDateOpen(false); }} className="filter-bar__date-clear">Xoá</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Variance Dropdown Filter */}
        <div className="filter-bar__dropdown">
          <button
            onClick={() => { setIsVarianceOpen(!isVarianceOpen); setIsStatusOpen(false); setIsDateOpen(false); setIsCreatorOpen(false); }}
            className={`filter-bar__trigger${filters.variance ? ' filter-bar__trigger--active' : ''}`}
          >
            <ArrowUpDown />
            <span>Chênh lệch{filters.variance ? `: ${varianceLabels[filters.variance] || filters.variance}` : ''}</span>
            <ChevronDown className={`filter-bar__chevron${isVarianceOpen ? ' filter-bar__chevron--open' : ''}`} />
          </button>

          {isVarianceOpen && (
            <div className="filter-bar__menu animate-fade-in">
              <div className="filter-bar__menu-scroll">
                <div
                  className="filter-bar__option"
                  onClick={() => { applyFilter('variance', undefined); setIsVarianceOpen(false); }}
                >
                  <div className={`filter-bar__check${!filters.variance ? ' filter-bar__check--checked' : ''}`}>
                    {!filters.variance && <Check />}
                  </div>
                  <span className="filter-bar__option-label">Tất cả</span>
                </div>
                {varianceOptions.map(opt => (
                  <div
                    key={opt.value}
                    className="filter-bar__option"
                    onClick={() => { applyFilter('variance', opt.value); setIsVarianceOpen(false); }}
                  >
                    <div className={`filter-bar__check${filters.variance === opt.value ? ' filter-bar__check--checked' : ''}`}>
                      {filters.variance === opt.value && <Check />}
                    </div>
                    <span className="filter-bar__option-label">{opt.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Created By Dropdown Filter */}
        <div className="filter-bar__dropdown">
          <button
            onClick={() => { setIsCreatorOpen(!isCreatorOpen); setIsStatusOpen(false); setIsDateOpen(false); setIsVarianceOpen(false); }}
            className={`filter-bar__trigger${filters.createdBy ? ' filter-bar__trigger--active' : ''}`}
          >
            <Layers />
            <span>Nhà cung cấp{filters.createdBy ? ': Đã chọn' : ''}</span>
            <ChevronDown className={`filter-bar__chevron${isCreatorOpen ? ' filter-bar__chevron--open' : ''}`} />
          </button>

          {isCreatorOpen && (
            <div className="filter-bar__menu animate-fade-in">
              <div className="filter-bar__menu-scroll">
                <div
                  className="filter-bar__option"
                  onClick={() => { applyFilter('createdBy', undefined); setIsCreatorOpen(false); }}
                >
                  <div className={`filter-bar__check${!filters.createdBy ? ' filter-bar__check--checked' : ''}`}>
                    {!filters.createdBy && <Check />}
                  </div>
                  <span className="filter-bar__option-label">Tất cả</span>
                </div>
                {suppliers.map(supplier => (
                  <div
                    key={supplier.id}
                    className="filter-bar__option"
                    onClick={() => { applyFilter('createdBy', supplier.id); setIsCreatorOpen(false); }}
                  >
                    <div className={`filter-bar__check${filters.createdBy === supplier.id ? ' filter-bar__check--checked' : ''}`}>
                      {filters.createdBy === supplier.id && <Check />}
                    </div>
                    <span className="filter-bar__option-label">{supplier.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="filter-bar__reset"
          >
            <X /> Xoá bộ lọc
          </button>
        )}
      </div>

      {/* Result info */}
      {resultCount !== undefined && totalCount !== undefined && (
        <div className="filter-bar__result">
          Hiển thị <span className="filter-bar__result-count">{resultCount}</span> trên tổng số <span className="filter-bar__result-count">{totalCount}</span> phiếu
          {hasActiveFilters && (
            <span className="filter-bar__result-badge">
              Đang lọc
            </span>
          )}
        </div>
      )}
    </>
  );
};
