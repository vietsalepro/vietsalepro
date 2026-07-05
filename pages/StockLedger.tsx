import '../components/shared/FilterBar.css';
import './Reports.css';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BookOpen, Download, Filter, Calendar, Search, Loader2,
  ChevronDown, Check, X, RotateCcw, AlertTriangle, CheckCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PageLayout } from '../components/shared/PageLayout';
import { Pagination } from './ReportPagination';
import { supabaseService } from '../services/supabaseService';
import { StockMovement } from '../types';

// ---------- Date helpers ----------
const toISODate = (d: Date) => {
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
};

const formatDateTime = (d: string) => {
  const date = new Date(d);
  return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fmt = (v: number) => `${v.toLocaleString('vi-VN')} ₫`;
const fmtQty = (v: number) => (v || 0).toLocaleString('vi-VN');

// ---------- Presets ----------
type Preset = 'today' | '7d' | '30d' | 'thisMonth' | 'thisQuarter' | 'thisYear' | 'custom';
const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
  { key: 'thisMonth', label: 'Tháng này' },
  { key: 'thisQuarter', label: 'Quý này' },
  { key: 'thisYear', label: 'Năm nay' },
];

function getDateRange(preset: Preset): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let from: Date;
  switch (preset) {
    case 'today':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '7d':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      from.setHours(0, 0, 0, 0);
      break;
    case '30d':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      from.setHours(0, 0, 0, 0);
      break;
    case 'thisMonth':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'thisQuarter':
      const q = Math.floor(now.getMonth() / 3);
      from = new Date(now.getFullYear(), q * 3, 1);
      break;
    case 'thisYear':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      from.setHours(0, 0, 0, 0);
  }
  return { from, to };
}

const VOUCHER_TYPES = [
  { value: '', label: 'Tất cả loại' },
  { value: 'Purchase Receipt', label: 'Nhập hàng' },
  { value: 'Delivery Note', label: 'Trả hàng' },
  { value: 'Stock Entry', label: 'Hủy / Đổi hàng' },
  { value: 'Sales Invoice', label: 'Bán hàng' },
  { value: 'Stock Reconciliation', label: 'Kiểm kê' },
];

// ---------- Shared dropdown ----------
const FilterSelect: React.FC<{
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  label: string;
  icon?: React.ReactNode;
  wide?: boolean;
}> = ({ value, options, onChange, label, icon, wide }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  const defaultValue = options[0]?.value;
  const isActive = value && value !== defaultValue;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="filter-bar__dropdown w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`filter-bar__trigger w-full justify-between ${isActive ? 'filter-bar__trigger--active' : ''}`}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="truncate">{isActive ? `${label}: ${selected?.label}` : label}</span>
        <ChevronDown className={`filter-bar__chevron ${isOpen ? 'filter-bar__chevron--open' : ''}`} />
      </button>
      {isOpen && (
        <div className={`filter-bar__menu ${wide ? 'filter-bar__menu--wide' : ''}`}>
          <div className="filter-bar__menu-scroll">
            {options.map(opt => (
              <div
                key={opt.value}
                className="filter-bar__option"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                <div className={`filter-bar__check ${value === opt.value ? 'filter-bar__check--checked' : ''}`}>
                  {value === opt.value && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="filter-bar__option-label">{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const StockLedger: React.FC = () => {
  const [preset, setPreset] = useState<Preset>('7d');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [productOptions, setProductOptions] = useState<{ id: string; name: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [voucherType, setVoucherType] = useState<string>('');
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [lotSearch, setLotSearch] = useState('');
  const [selectedLotId, setSelectedLotId] = useState<string>('');

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [totalCount, setTotalCount] = useState(0);

  const [driftLoading, setDriftLoading] = useState(false);
  const [driftResult, setDriftResult] = useState<{ count: number; items: any[] } | null>(null);
  const [driftError, setDriftError] = useState<string | null>(null);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const dateRange = useMemo(() => {
    const { from, to } = preset === 'custom'
      ? {
          from: customFrom ? new Date(customFrom + 'T00:00:00') : new Date(),
          to: customTo ? new Date(customTo + 'T23:59:59') : new Date()
        }
      : getDateRange(preset);
    return {
      from: from.toISOString(),
      to: to.toISOString()
    };
  }, [preset, customFrom, customTo]);

  // Search products
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (productSearch.trim().length === 0) {
      setProductOptions([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        const result = await supabaseService.searchProducts(productSearch, 50);
        setProductOptions((result || []).map((p: any) => ({ id: p.id, name: p.name })));
        setShowProductDropdown(true);
      } catch (e) {

      }
    }, 300);
  }, [productSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMovements = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.getStockLedger({
        productId: selectedProductId || undefined,
        lotId: selectedLotId || undefined,
        voucherType: voucherType || undefined,
        startDate: dateRange.from,
        endDate: dateRange.to,
        includeCancelled,
        limit: 10000,
        offset: 0
      });

      const mapped: StockMovement[] = (result || []).map((m: any) => ({
        id: m.id,
        postingDate: m.posting_date,
        voucherType: m.voucher_type,
        voucherNo: m.voucher_no,
        voucherDetailNo: m.voucher_detail_no,
        productId: m.product_id,
        productName: m.product_name,
        lotId: m.lot_id,
        lotCode: m.lot_code,
        warehouse: m.warehouse,
        actualQty: Number(m.actual_qty || 0),
        qtyAfterTransaction: Number(m.qty_after_transaction || 0),
        valuationRate: Number(m.valuation_rate || 0),
        incomingRate: Number(m.incoming_rate || 0),
        outgoingRate: Number(m.outgoing_rate || 0),
        stockValue: Number(m.stock_value || 0),
        balanceValue: Number(m.balance_value || 0),
        reason: m.reason,
        isCancelled: !!m.is_cancelled,
        createdAt: m.created_at
      }));

      setMovements(mapped);
      setTotalCount(mapped.length);
      setPage(1);
    } catch (err: any) {
      setError(err?.message || 'Lỗi tải sổ cái kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [selectedProductId, selectedLotId, voucherType, includeCancelled, dateRange.from, dateRange.to]);

  const handlePresetChange = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') {
      setCustomFrom('');
      setCustomTo('');
    }
  };

  const handleReset = () => {
    setPreset('7d');
    setCustomFrom('');
    setCustomTo('');
    setProductSearch('');
    setSelectedProductId('');
    setSelectedLotId('');
    setLotSearch('');
    setVoucherType('');
    setIncludeCancelled(false);
    setProductOptions([]);
  };

  const checkDrift = async () => {
    setDriftLoading(true);
    setDriftError(null);
    setDriftResult(null);
    try {
      const items = await supabaseService.checkStockLedgerDrift();
      setDriftResult({ count: items.length, items: items || [] });
    } catch (err: any) {
      setDriftError(err?.message || 'Lỗi kiểm tra lệch tồn kho');
    } finally {
      setDriftLoading(false);
    }
  };

  const exportToExcel = () => {
    const data = movements.map(m => ({
      'Ngày ghi nhận': formatDateTime(m.postingDate),
      'Loại chứng từ': m.voucherType,
      'Mã chứng từ': m.voucherNo,
      'Mã dòng': m.voucherDetailNo,
      'Mã SP': m.productId,
      'Tên sản phẩm': m.productName || '',
      'Mã lô': m.lotCode || '',
      'SL biến động': m.actualQty,
      'Tồn sau': m.qtyAfterTransaction,
      'Đơn giá vốn': m.valuationRate,
      'Giá trị biến động': m.stockValue,
      'Giá trị tồn': m.balanceValue,
      'Lý do': m.reason || '',
      'Đã hủy': m.isCancelled ? 'Có' : 'Không',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'So_cai_kho');
    XLSX.writeFile(wb, `So_cai_kho_${toISODate(new Date())}.xlsx`);
  };

  const paginatedMovements = useMemo(() => {
    const start = (page - 1) * pageSize;
    return movements.slice(start, start + pageSize);
  }, [movements, page, pageSize]);

  const selectedProductName = productOptions.find(p => p.id === selectedProductId)?.name || productSearch || 'Tất cả sản phẩm';

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Sổ cái kho
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi mọi biến động tồn kho theo từng chứng từ và lô hàng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RotateCcw className="w-4 h-4" />
            Đặt lại
          </button>
          <button
            onClick={checkDrift}
            disabled={driftLoading}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border ${
              driftResult && driftResult.count > 0
                ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'
            } disabled:opacity-50`}
          >
            {driftLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Kiểm tra lệch
          </button>
          <button
            onClick={exportToExcel}
            disabled={movements.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="reports-filter-bar">
        <div className="reports-filter-row">
          <div className="reports-preset-group">
            {PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => handlePresetChange(p.key)}
                className={`reports-filter-btn ${preset === p.key ? 'reports-filter-btn-active' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="filter-bar__date-input"
              />
              <span className="reports-text-muted">→</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="filter-bar__date-input"
              />
            </div>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`reports-filter-toggle ${showFilters ? 'reports-filter-toggle-active' : ''}`}
          >
            <Filter className="w-3.5 h-3.5" /> Bộ lọc
          </button>
        </div>

        {showFilters && (
          <div className="reports-filter-grid mt-3">
            <div className="relative" ref={productDropdownRef}>
              <label className="reports-label">Sản phẩm</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm..."
                  value={selectedProductId ? selectedProductName : productSearch}
                  onChange={e => {
                    setProductSearch(e.target.value);
                    if (selectedProductId) {
                      setSelectedProductId('');
                    }
                  }}
                  className="filter-bar__input pl-9"
                />
                {selectedProductId && (
                  <button
                    onClick={() => {
                      setSelectedProductId('');
                      setProductSearch('');
                    }}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {showProductDropdown && productOptions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {productOptions.map(p => (
                    <div
                      key={p.id}
                      className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setProductSearch(p.name);
                        setShowProductDropdown(false);
                        setSelectedLotId('');
                      }}
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="reports-label">Lô hàng</label>
              <input
                type="text"
                placeholder="Nhập mã lô (tùy chọn)"
                value={lotSearch}
                onChange={e => {
                  setLotSearch(e.target.value);
                  setSelectedLotId(e.target.value);
                }}
                className="filter-bar__input"
              />
            </div>

            <FilterSelect
              label="Loại chứng từ"
              value={voucherType}
              options={VOUCHER_TYPES}
              onChange={setVoucherType}
              icon={<Calendar className="w-4 h-4" />}
            />

            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeCancelled}
                  onChange={e => setIncludeCancelled(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">Hiển thị bút toán đảo</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500">Tổng dòng</p>
          <p className="text-xl font-bold text-slate-800">{fmtQty(movements.length)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500">Tổng nhập</p>
          <p className="text-xl font-bold text-emerald-600">
            {fmtQty(movements.filter(m => m.actualQty > 0 && !m.isCancelled).reduce((s, m) => s + m.actualQty, 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500">Tổng xuất</p>
          <p className="text-xl font-bold text-rose-600">
            {fmtQty(Math.abs(movements.filter(m => m.actualQty < 0 && !m.isCancelled).reduce((s, m) => s + m.actualQty, 0)))}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500">Bút toán đảo</p>
          <p className="text-xl font-bold text-amber-600">
            {fmtQty(movements.filter(m => m.isCancelled).length)}
          </p>
        </div>
      </div>

      {/* Drift result */}
      {(driftResult || driftError) && (
        <div className={`rounded-xl p-4 border ${driftError ? 'bg-red-50 border-red-200' : driftResult && driftResult.count > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-start gap-3">
            {driftError ? (
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            ) : driftResult && driftResult.count > 0 ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">
                {driftError
                  ? 'Lỗi kiểm tra lệch'
                  : driftResult && driftResult.count > 0
                  ? `Phát hiện ${driftResult.count} sản phẩm bị lệch`
                  : 'Sổ cái kho khớp chuẩn — không phát hiện lệch'}
              </h4>
              {driftError && <p className="text-sm text-red-700 mt-1">{driftError}</p>}
              {driftResult && driftResult.count > 0 && (
                <div className="mt-2 overflow-auto max-h-48">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-rose-200">
                        <th className="py-1 pr-3">Mã SP</th>
                        <th className="py-1 pr-3">Tồn products</th>
                        <th className="py-1 pr-3">Tổng lô</th>
                        <th className="py-1 pr-3">Tổng movement</th>
                        <th className="py-1 pr-3">Lệch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driftResult.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-rose-100 last:border-0">
                          <td className="py-1 pr-3 font-medium">{item.product_id}</td>
                          <td className="py-1 pr-3">{fmtQty(item.products_quantity)}</td>
                          <td className="py-1 pr-3">{fmtQty(item.lot_sum)}</td>
                          <td className="py-1 pr-3">{fmtQty(item.movement_sum)}</td>
                          <td className="py-1 pr-3 font-semibold text-rose-700">{fmtQty(item.diff)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="reports-card reports-card-overflow flex-1 min-h-0">
        <div className="reports-card-header-simple">
          <h3 className="reports-card-header-title">Biến động tồn kho</h3>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <div className="overflow-x-auto">
          <table className="reports-table">
            <thead>
              <tr className="reports-table-head">
                <th className="reports-table-cell">Ngày</th>
                <th className="reports-table-cell">Loại CT</th>
                <th className="reports-table-cell">Mã CT</th>
                <th className="reports-table-cell">Sản phẩm</th>
                <th className="reports-table-cell">Lô</th>
                <th className="reports-table-cell-right">SL biến động</th>
                <th className="reports-table-cell-right">Tồn sau</th>
                <th className="reports-table-cell-right">Đơn giá vốn</th>
                <th className="reports-table-cell-right">Giá trị biến động</th>
                <th className="reports-table-cell-right">Giá trị tồn</th>
                <th className="reports-table-cell">Lý do</th>
                <th className="reports-table-cell">Đã hủy</th>
              </tr>
            </thead>
            <tbody className="reports-table-body">
              {loading && movements.length === 0 ? (
                <tr>
                  <td colSpan={12} className="reports-table-cell text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                  </td>
                </tr>
              ) : paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan={12} className="reports-table-cell text-center py-8 text-slate-500">
                    Không có dữ liệu phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedMovements.map(m => (
                  <tr
                    key={m.id}
                    className={`reports-table-row ${m.isCancelled ? 'bg-amber-50/50' : ''}`}
                  >
                    <td className="reports-table-cell whitespace-nowrap">{formatDateTime(m.postingDate)}</td>
                    <td className="reports-table-cell">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        m.voucherType === 'Purchase Receipt' ? 'bg-emerald-100 text-emerald-700' :
                        m.voucherType === 'Delivery Note' ? 'bg-sky-100 text-sky-700' :
                        m.voucherType === 'Sales Invoice' ? 'bg-rose-100 text-rose-700' :
                        m.voucherType === 'Stock Reconciliation' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {m.voucherType}
                      </span>
                    </td>
                    <td className="reports-table-cell reports-table-cell-mono text-xs">{m.voucherNo}</td>
                    <td className="reports-table-cell">
                      <div className="font-medium text-slate-800">{m.productName}</div>
                      <div className="text-xs text-slate-500">{m.productId}</div>
                    </td>
                    <td className="reports-table-cell text-xs">{m.lotCode || '-'}</td>
                    <td className={`reports-table-cell-right font-medium ${m.actualQty > 0 ? 'text-emerald-600' : m.actualQty < 0 ? 'text-rose-600' : ''}`}>
                      {m.actualQty > 0 ? '+' : ''}{fmtQty(m.actualQty)}
                    </td>
                    <td className="reports-table-cell-right">{fmtQty(m.qtyAfterTransaction)}</td>
                    <td className="reports-table-cell-right">{fmt(m.valuationRate)}</td>
                    <td className="reports-table-cell-right">{fmt(m.stockValue)}</td>
                    <td className="reports-table-cell-right">{fmt(m.balanceValue)}</td>
                    <td className="reports-table-cell text-xs max-w-[150px] truncate">{m.reason || '-'}</td>
                    <td className="reports-table-cell text-center">
                      {m.isCancelled ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">Có</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(movements.length / pageSize))}
          pageSize={pageSize}
          totalItems={movements.length}
          onPageChange={setPage}
        />
      </div>
    </PageLayout>
  );
};

export default StockLedger;
