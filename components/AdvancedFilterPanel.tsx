import React, { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown, X, Plus, Bookmark, Save, Trash2 } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import './AdvancedFilterPanel.css';

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

interface SavedFilter {
  id: string;
  name: string;
  rules: FilterState;
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

const SAVED_FILTERS_KEY = 'vietsale-advanced-filters';

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString('vi-VN');
}

function loadSavedFilters(): SavedFilter[] {
  try {
    const raw = localStorage.getItem(SAVED_FILTERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedFilter[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSavedFilters(filters: SavedFilter[]) {
  try {
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // ponytail: silently fail if storage is unavailable — not worth crashing the UI.
  }
}

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
  const [localKeyword, setLocalKeyword] = useState(keyword);
  const [openPill, setOpenPill] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveName, setSaveName] = useState('');

  const addRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useClickOutside(addRef, () => setAddOpen(false), addOpen);
  useClickOutside(savedRef, () => setSavedOpen(false), savedOpen);

  useEffect(() => {
    if (!openPill) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const pillEl = pillRefs.current[openPill];
      if (pillEl && !pillEl.contains(target)) {
        setOpenPill(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openPill]);

  useEffect(() => {
    setSavedFilters(loadSavedFilters());
  }, []);

  useEffect(() => {
    setLocalKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    if (!onKeywordChange) return;
    const timeout = setTimeout(() => {
      onKeywordChange(localKeyword);
    }, 300);
    return () => clearTimeout(timeout);
  }, [localKeyword, onKeywordChange]);

  const applyFilters = (next: FilterState) => {
    onFiltersChange(next);
    onApplyFilters();
  };

  const removeFilter = (key: keyof FilterState) => {
    const next = { ...filters, [key]: undefined };
    applyFilters(next);
  };

  const setFilter = (key: keyof FilterState, value?: string) => {
    const next = { ...filters, [key]: value };
    applyFilters(next);
  };

  const hasActiveFilters =
    filters.status || filters.dateFrom || filters.dateTo || filters.variance || filters.createdBy;

  const activePills: { key: keyof FilterState; label: string; value: string }[] = [];

  if (filters.status) {
    activePills.push({ key: 'status', label: 'Trạng thái', value: statusLabels[filters.status] || filters.status });
  }

  if (filters.variance) {
    activePills.push({ key: 'variance', label: 'Chênh lệch', value: varianceLabels[filters.variance] || filters.variance });
  }

  if (filters.createdBy) {
    const supplier = suppliers.find((s) => s.id === filters.createdBy);
    activePills.push({ key: 'createdBy', label: 'Nhà cung cấp', value: supplier?.name || filters.createdBy });
  }

  if (filters.dateFrom || filters.dateTo) {
    const from = formatDate(filters.dateFrom);
    const to = formatDate(filters.dateTo);
    const value = from && to ? `${from} - ${to}` : from || to;
    activePills.push({ key: 'dateFrom', label: 'Ngày', value });
  }

  const availableFields = [
    { key: 'status', label: 'Trạng thái', active: !!filters.status },
    { key: 'variance', label: 'Chênh lệch', active: !!filters.variance },
    { key: 'createdBy', label: 'Nhà cung cấp', active: !!filters.createdBy },
    { key: 'date', label: 'Ngày', active: !!(filters.dateFrom || filters.dateTo) },
  ].filter((f) => !f.active);

  const addField = (fieldKey: string) => {
    setAddOpen(false);
    const today = new Date().toISOString().split('T')[0];

    switch (fieldKey) {
      case 'status':
        setFilter('status', statusOptions[0]?.value);
        break;
      case 'variance':
        setFilter('variance', varianceOptions[0]?.value);
        break;
      case 'createdBy':
        setFilter('createdBy', suppliers[0]?.id);
        break;
      case 'date':
        applyFilters({ ...filters, dateFrom: today, dateTo: today });
        break;
    }
  };

  const applySavedFilter = (saved: SavedFilter) => {
    setSavedOpen(false);
    onFiltersChange(saved.rules);
    onApplyFilters();
  };

  const deleteSavedFilter = (id: string) => {
    const next = savedFilters.filter((s) => s.id !== id);
    setSavedFilters(next);
    saveSavedFilters(next);
  };

  const saveCurrentFilter = () => {
    const name = saveName.trim();
    if (!name) return;
    const next: SavedFilter[] = [
      ...savedFilters,
      { id: `${Date.now()}`, name, rules: { ...filters } },
    ];
    setSavedFilters(next);
    saveSavedFilters(next);
    setSaveName('');
  };

  const renderPillMenu = (pillKey: keyof FilterState) => {
    if (openPill !== pillKey) return null;

    if (pillKey === 'status') {
      return (
        <div className="adv-filter__pill-menu">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="adv-filter__pill-option"
              onClick={() => { setFilter('status', opt.value); setOpenPill(null); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    if (pillKey === 'variance') {
      return (
        <div className="adv-filter__pill-menu">
          {varianceOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="adv-filter__pill-option"
              onClick={() => { setFilter('variance', opt.value); setOpenPill(null); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    if (pillKey === 'createdBy') {
      return (
        <div className="adv-filter__pill-menu">
          {suppliers.map((s) => (
            <button
              key={s.id}
              type="button"
              className="adv-filter__pill-option"
              onClick={() => { setFilter('createdBy', s.id); setOpenPill(null); }}
            >
              {s.name}
            </button>
          ))}
        </div>
      );
    }

    if (pillKey === 'dateFrom') {
      return (
        <div className="adv-filter__pill-menu adv-filter__pill-menu--wide">
          <div className="adv-filter__date-field">
            <label className="adv-filter__date-label">Từ ngày</label>
            <input
              type="date"
              className="adv-filter__date-input"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilter('dateFrom', e.target.value || undefined)}
            />
          </div>
          <div className="adv-filter__date-field">
            <label className="adv-filter__date-label">Đến ngày</label>
            <input
              type="date"
              className="adv-filter__date-input"
              value={filters.dateTo || ''}
              onChange={(e) => setFilter('dateTo', e.target.value || undefined)}
            />
          </div>
          <button
            type="button"
            className="adv-filter__date-apply"
            onClick={() => setOpenPill(null)}
          >
            Áp dụng
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="adv-filter">
      <div className="adv-filter__bar">
        {/* Quick Search */}
        <div className="adv-filter__search">
          <Search className="adv-filter__search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm phiếu nhập..."
            className="adv-filter__search-input"
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
          />
        </div>

        {/* Active filter pills */}
        <div className="adv-filter__pills">
          {activePills.map((pill) => (
            <div
              key={pill.key}
              className="adv-filter__pill"
              ref={(el) => { pillRefs.current[pill.key] = el; }}
            >
              <button
                type="button"
                className="adv-filter__pill-value"
                onClick={() => setOpenPill(openPill === pill.key ? null : pill.key)}
              >
                {pill.label}: {pill.value}
                <ChevronDown size={14} />
              </button>
              <button
                type="button"
                className="adv-filter__pill-remove"
                onClick={() => removeFilter(pill.key)}
                aria-label={`Remove ${pill.label} filter`}
              >
                <X size={14} />
              </button>
              {renderPillMenu(pill.key)}
            </div>
          ))}

          {/* Add Filter */}
          <div className="adv-filter__dropdown" ref={addRef}>
            <button
              type="button"
              className="adv-filter__add"
              onClick={() => setAddOpen(!addOpen)}
            >
              <Plus size={14} />
              Thêm bộ lọc
            </button>
            {addOpen && (
              <div className="adv-filter__menu">
                <div className="adv-filter__menu-title">Chọn trường lọc</div>
                <div className="adv-filter__menu-scroll">
                  {availableFields.length === 0 ? (
                    <div className="adv-filter__option">Tất cả bộ lọc đã được chọn</div>
                  ) : (
                    availableFields.map((field) => (
                      <button
                        key={field.key}
                        type="button"
                        className="adv-filter__option"
                        onClick={() => addField(field.key)}
                      >
                        {field.label}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Saved Filters */}
          <div className="adv-filter__dropdown" ref={savedRef}>
            <button
              type="button"
              className="adv-filter__saved-trigger"
              onClick={() => setSavedOpen(!savedOpen)}
            >
              <Bookmark size={14} />
              Bộ lọc đã lưu
              <ChevronDown size={14} />
            </button>
            {savedOpen && (
              <div className="adv-filter__menu adv-filter__menu--wide">
                <div className="adv-filter__save-row">
                  <input
                    type="text"
                    placeholder="Tên bộ lọc"
                    className="adv-filter__save-input"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveCurrentFilter(); }}
                  />
                  <button
                    type="button"
                    className="adv-filter__save-btn"
                    onClick={saveCurrentFilter}
                    disabled={!saveName.trim() || !hasActiveFilters}
                  >
                    <Save size={14} />
                  </button>
                </div>
                <div className="adv-filter__menu-scroll">
                  {savedFilters.length === 0 ? (
                    <div className="adv-filter__option">Chưa có bộ lọc nào</div>
                  ) : (
                    savedFilters.map((saved) => (
                      <div key={saved.id} className="adv-filter__saved-item">
                        <button
                          type="button"
                          className="adv-filter__option adv-filter__option--stretch"
                          onClick={() => applySavedFilter(saved)}
                        >
                          {saved.name}
                        </button>
                        <button
                          type="button"
                          className="adv-filter__saved-delete"
                          onClick={() => deleteSavedFilter(saved.id)}
                          aria-label={`Delete ${saved.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button type="button" className="adv-filter__reset" onClick={onResetFilters}>
              <X size={14} /> Xoá bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Result info */}
      {resultCount !== undefined && totalCount !== undefined && (
        <div className="adv-filter__result">
          Hiển thị <span className="adv-filter__result-count">{resultCount}</span> trên tổng số{' '}
          <span className="adv-filter__result-count">{totalCount}</span> phiếu
          {hasActiveFilters && <span className="adv-filter__result-badge">Đang lọc</span>}
        </div>
      )}
    </div>
  );
};

export default AdvancedFilterPanel;
