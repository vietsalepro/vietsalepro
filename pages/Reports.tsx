import '../components/shared/FilterBar.css';
import './Reports.css';
import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, DollarSign, Package, AlertTriangle, Download, Calendar,
  ArrowUpRight, ArrowDownRight, ShoppingBag, Users, Filter, X,
  ChevronDown, RefreshCw, Search, Loader2, FileBarChart, Banknote,
  Percent, Box, Clock, CheckCircle, Ban, Wallet, Check, Truck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Pagination } from './ReportPagination';
import { PageLayout } from '../components/shared/PageLayout';
import { supabaseService } from '../services/supabaseService';
import { useTenant } from '../hooks/useTenant';

// ---------- Shared filter dropdown (matches /inventory-count style) ----------
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
  return (
    <div className="filter-bar__dropdown w-full">
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

// ---------- Color palette ----------
const COLORS = {
  indigo: '#4f46e5',
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  sky: '#0ea5e9',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
  teal: '#14b8a6',
  gray: '#9ca3af',
};
const PIE_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6', '#ec4899'];

// ---------- Helper: format currency ----------
const fmt = (v: number) => `${v.toLocaleString('vi-VN')} ₫`;
const fmtShort = (v: number) => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString('vi-VN');
};

// ---------- Date helper ----------
const formatDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const formatShortDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

// ---------- Date range presets ----------
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
      break;
    case '30d':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'thisMonth':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'thisQuarter':
      from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case 'thisYear':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return { from, to };
}

// ---------- Report data types ----------
interface SalesReport {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    uniqueCustomers: number;
    completedRevenue: number;
    cancelledRevenue: number;
    completedOrders: number;
    cancelledOrders: number;
    prevRevenue: number;
    prevOrdersCount: number;
  };
  dailyRevenue: { date: string; revenue: number; orders: number; profit: number }[];
  paymentData: { name: string; value: number }[];
  groupedByProduct: { key: string; label: string; revenue: number; orders: number; count: number }[];
  groupedByCustomer: { key: string; label: string; revenue: number; orders: number; count: number }[];
  groupedByDay: { key: string; label: string; revenue: number; orders: number; count: number }[];
  groupedByOrder: { key: string; label: string; revenue: number; orders: number; count: number }[];
  detailRows: { date: string; orderId: string; productName: string; quantity: number; revenue: number; customerName: string; paymentMethod: string }[];
}

interface ProfitReport {
  summary: {
    totalRevenue: number;
    totalCost: number;
    profit: number;
    margin: number;
    prevRevenue: number;
    prevCost: number;
    prevProfit: number;
    profitChange: number;
  };
  dailyProfit: { date: string; currentRevenue: number; currentProfit: number; prevRevenue: number; prevProfit: number }[];
  profitDetails: { date: string; orderId: string; productName: string; revenue: number; cost: number; profit: number; margin: number }[];
  groupedByProduct: { key: string; label: string; revenue: number; cost: number; profit: number; count: number }[];
  groupedByCustomer: { key: string; label: string; revenue: number; cost: number; profit: number; count: number }[];
  groupedByDay: { key: string; label: string; revenue: number; cost: number; profit: number; count: number }[];
}

interface InventoryReport {
  summary: {
    totalValue: number;
    totalQty: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  inventoryByCategory: { name: string; value: number }[];
  exportInPeriod: { productId: string; name: string; qty: number; value: number }[];
  lowStockProducts: { id: string; code: string; name: string; category: string; unit: string; quantity: number; minStock: number; cost: number; value: number }[];
  products: { id: string; code: string; name: string; category: string; unit: string; quantity: number; minStock: number; cost: number; value: number }[];
  categories: string[];
}

interface CustomerReport {
  summary: {
    totalCustomers: number;
    newCustomers: number;
    totalDebt: number;
    totalPoints: number;
    totalSpent: number;
  };
  topCustomers: { id: string; name: string; totalSpent: number; debt: number; loyaltyPoints: number; orderCount: number }[];
  customerGrowth: { date: string; newCustomers: number }[];
}

interface SupplierReport {
  summary: {
    totalSuppliers: number;
    totalDebt: number;
    totalPaid: number;
    totalImportValue: number;
  };
  topSuppliers: { id: string; code: string; name: string; totalImportValue: number; totalPaid: number; debt: number; importCount: number }[];
  supplierGrowth: { date: string; newSuppliers: number }[];
  importBySupplier: { id: string; name: string; value: number }[];
}

// ---------- Props ----------
// Phase 3: tất cả report data đã được fetch server-side qua RPC
// (getSalesReport / getProfitReport / getInventoryReport / getCustomerReport).
// Không còn props products/orders/customers/suppliers.
interface ReportsProps {}

// ====================================================================
// ======================= MAIN COMPONENT =============================
// ====================================================================
export const Reports: React.FC<ReportsProps> = () => {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const [activeTab, setActiveTab] = useState<'sales' | 'profit' | 'inventory' | 'customer' | 'supplier'>('sales');
  const [preset, setPreset] = useState<Preset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Server-side report data
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [profitReport, setProfitReport] = useState<ProfitReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [customerReport, setCustomerReport] = useState<CustomerReport | null>(null);
  const [supplierReport, setSupplierReport] = useState<SupplierReport | null>(null);

  const [isFetchingSales, setIsFetchingSales] = useState(false);
  const [isFetchingProfit, setIsFetchingProfit] = useState(false);
  const [isFetchingInventory, setIsFetchingInventory] = useState(false);
  const [isFetchingCustomer, setIsFetchingCustomer] = useState(false);
  const [isFetchingSupplier, setIsFetchingSupplier] = useState(false);

  // Extra filters
  const [filterProduct, setFilterProduct] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState('');

  // Group-by for tables
  const [groupBy, setGroupBy] = useState<string>('product');
  const [profitGroupBy, setProfitGroupBy] = useState<string>('product');
  const [compareMode, setCompareMode] = useState<string>('prev');

  // Expanded rows in group tables
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [expandedProfitGroup, setExpandedProfitGroup] = useState<string | null>(null);

  // Pagination state for detail tables
  const [salesDetailPage, setSalesDetailPage] = useState(1);
  const [profitDetailPage, setProfitDetailPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);
  const REPORT_PAGE_SIZE = 7;

  // ---------- Date computation ----------
  const dateRange = useMemo(() => {
    if (preset === 'custom' && customFrom && customTo) {
      return { from: new Date(customFrom), to: new Date(customTo + 'T23:59:59') };
    }
    return getDateRange(preset);
  }, [preset, customFrom, customTo]);

  const startDateStr = useMemo(() => dateRange.from.toISOString().split('T')[0], [dateRange]);
  const endDateStr = useMemo(() => dateRange.to.toISOString().split('T')[0], [dateRange]);

  // ---------- Fetch sales report ----------
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    const fetchSales = async () => {
      setIsFetchingSales(true);
      try {
        const result = await supabaseService.getSalesReport(startDateStr, endDateStr, {
          status: filterStatus,
          paymentMethod: filterPayment,
          productKeyword: filterProduct,
          customerKeyword: filterCustomer
        });
        if (!cancelled) setSalesReport(result);
      } catch (e) {
        console.error('Reports: fetch sales error', e);
      } finally {
        if (!cancelled) setIsFetchingSales(false);
      }
    };
    fetchSales();
    return () => { cancelled = true; };
  }, [startDateStr, endDateStr, filterStatus, filterPayment, filterProduct, filterCustomer, tenantId]);

  // ---------- Fetch profit report ----------
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    const fetchProfit = async () => {
      setIsFetchingProfit(true);
      try {
        const result = await supabaseService.getProfitReport(startDateStr, endDateStr, {
          status: filterStatus,
          paymentMethod: filterPayment,
          productKeyword: filterProduct,
          customerKeyword: filterCustomer,
          compareMode
        });
        if (!cancelled) setProfitReport(result);
      } catch (e) {
        console.error('Reports: fetch profit error', e);
      } finally {
        if (!cancelled) setIsFetchingProfit(false);
      }
    };
    fetchProfit();
    return () => { cancelled = true; };
  }, [startDateStr, endDateStr, filterStatus, filterPayment, filterProduct, filterCustomer, compareMode, tenantId]);

  // ---------- Fetch customer report ----------
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    const fetchCustomer = async () => {
      setIsFetchingCustomer(true);
      try {
        const result = await supabaseService.getCustomerReport(startDateStr, endDateStr);
        if (!cancelled) setCustomerReport(result);
      } catch (e) {
        console.error('Reports: fetch customer error', e);
      } finally {
        if (!cancelled) setIsFetchingCustomer(false);
      }
    };
    fetchCustomer();
    return () => { cancelled = true; };
  }, [startDateStr, endDateStr, tenantId]);

  // ---------- Fetch supplier report (only when supplier tab is active) ----------
  useEffect(() => {
    if (!tenantId || activeTab !== 'supplier') return;
    let cancelled = false;
    const fetchSupplier = async () => {
      setIsFetchingSupplier(true);
      try {
        const result = await supabaseService.getSupplierReport(startDateStr, endDateStr);
        if (!cancelled) setSupplierReport(result);
      } catch (e) {
        console.error('Reports: fetch supplier error', e);
      } finally {
        if (!cancelled) setIsFetchingSupplier(false);
      }
    };
    fetchSupplier();
    return () => { cancelled = true; };
  }, [activeTab, startDateStr, endDateStr, tenantId]);

  // ---------- Fetch inventory report (only when inventory tab is active) ----------
  useEffect(() => {
    if (!tenantId || activeTab !== 'inventory') return;
    let cancelled = false;
    const fetchInventory = async () => {
      setIsFetchingInventory(true);
      try {
        const result = await supabaseService.getInventoryReport(startDateStr, endDateStr, {
          category: filterCategory,
          stockStatus: filterStockStatus
        });
        if (!cancelled) setInventoryReport(result);
      } catch (e) {
        console.error('Reports: fetch inventory error', e);
      } finally {
        if (!cancelled) setIsFetchingInventory(false);
      }
    };
    fetchInventory();
    return () => { cancelled = true; };
  }, [activeTab, startDateStr, endDateStr, filterCategory, filterStockStatus, tenantId]);

  // ---------- Initial loading ----------
  useEffect(() => {
    if (isLoading && !isFetchingSales && salesReport) {
      setIsLoading(false);
    }
  }, [isLoading, isFetchingSales, salesReport]);

  // ---------- Reset detail pages when filters or tab change ----------
  useEffect(() => {
    setSalesDetailPage(1);
    setProfitDetailPage(1);
    setInventoryPage(1);
    setCustomerPage(1);
  }, [filterProduct, filterCustomer, filterPayment, filterStatus, filterCategory, filterStockStatus, filterSupplier, activeTab, compareMode]);

  // ---------- Derived: Sales Report ----------
  const salesSummary = useMemo(() => {
    if (!salesReport) {
      return {
        totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, uniqueCustomers: 0,
        completedRevenue: 0, cancelledRevenue: 0, completedOrders: 0, cancelledOrders: 0,
        revenueChange: 0, ordersChange: 0
      };
    }
    const { summary } = salesReport;
    const revenueChange = summary.prevRevenue > 0
      ? ((summary.totalRevenue - summary.prevRevenue) / summary.prevRevenue) * 100
      : 0;
    const ordersChange = summary.prevOrdersCount > 0
      ? ((summary.totalOrders - summary.prevOrdersCount) / summary.prevOrdersCount) * 100
      : 0;
    return { ...summary, revenueChange, ordersChange };
  }, [salesReport]);

  const dailyRevenueData = useMemo(() => salesReport?.dailyRevenue || [], [salesReport]);
  const paymentData = useMemo(() => salesReport?.paymentData || [], [salesReport]);
  const salesDetailRows = useMemo(() => salesReport?.detailRows || [], [salesReport]);

  const groupedData = useMemo(() => {
    if (!salesReport) return [];
    if (groupBy === 'product') return salesReport.groupedByProduct;
    if (groupBy === 'customer') return salesReport.groupedByCustomer;
    if (groupBy === 'day') return salesReport.groupedByDay;
    return salesReport.groupedByOrder;
  }, [salesReport, groupBy]);

  // ---------- Derived: Profit/Loss Report ----------
  const profitSummary = useMemo(() => {
    if (!profitReport) {
      return { totalRevenue: 0, totalCost: 0, profit: 0, margin: 0, profitChange: 0 };
    }
    return profitReport.summary;
  }, [profitReport]);

  const dailyProfitData = useMemo(() => profitReport?.dailyProfit || [], [profitReport]);
  const profitDetails = useMemo(() => profitReport?.profitDetails || [], [profitReport]);

  const profitGroupedData = useMemo(() => {
    if (!profitReport) return [];
    if (profitGroupBy === 'product') return profitReport.groupedByProduct;
    if (profitGroupBy === 'customer') return profitReport.groupedByCustomer;
    return profitReport.groupedByDay;
  }, [profitReport, profitGroupBy]);

  // ---------- Derived: Inventory Report ----------
  const inventorySummary = useMemo(() => {
    return inventoryReport?.summary || { totalValue: 0, totalQty: 0, lowStockCount: 0, outOfStockCount: 0 };
  }, [inventoryReport]);

  const filteredProducts = useMemo(() => inventoryReport?.products || [], [inventoryReport]);
  const inventoryByCategory = useMemo(() => inventoryReport?.inventoryByCategory || [], [inventoryReport]);
  const exportInPeriod = useMemo(() => inventoryReport?.exportInPeriod || [], [inventoryReport]);
  const lowStockProducts = useMemo(() => inventoryReport?.lowStockProducts || [], [inventoryReport]);
  const categories = useMemo(() => inventoryReport?.categories || [], [inventoryReport]);

  // ---------- Derived: Customer Report ----------
  const customerSummary = useMemo(() => {
    return customerReport?.summary || { totalCustomers: 0, newCustomers: 0, totalDebt: 0, totalPoints: 0, totalSpent: 0 };
  }, [customerReport]);

  const topCustomers = useMemo(() => customerReport?.topCustomers || [], [customerReport]);
  const customerGrowth = useMemo(() => customerReport?.customerGrowth || [], [customerReport]);

  // ---------- Derived: Supplier Report ----------
  const supplierSummary = useMemo(() => {
    return supplierReport?.summary || { totalSuppliers: 0, totalDebt: 0, totalPaid: 0, totalImportValue: 0 };
  }, [supplierReport]);

  const topSuppliers = useMemo(() => supplierReport?.topSuppliers || [], [supplierReport]);
  const supplierGrowth = useMemo(() => supplierReport?.supplierGrowth || [], [supplierReport]);
  const importBySupplier = useMemo(() => supplierReport?.importBySupplier || [], [supplierReport]);

  // ---------- Export functions ----------
  const exportToExcel = (type: string) => {
    let data: any[] = [];
    let fileName = '';
    if (type === 'sales') {
      data = dailyRevenueData.map(d => ({ 'Ngày': d.date, 'Doanh thu': d.revenue, 'Lợi nhuận': d.profit, 'Số đơn': d.orders }));
      fileName = `Bao_cao_ban_hang.xlsx`;
    } else if (type === 'profit') {
      data = profitDetails.map(d => ({ 'Ngày': d.date, 'Mã đơn': d.orderId, 'Sản phẩm': d.productName, 'Doanh thu': d.revenue, 'Giá vốn': d.cost, 'Lợi nhuận': d.profit, 'Biên LN%': `${d.margin.toFixed(1)}%` }));
      fileName = `Bao_cao_lai_lo.xlsx`;
    } else if (type === 'inventory') {
      data = filteredProducts.map(p => ({ 'Mã': p.code, 'Tên': p.name, 'Danh mục': p.category, 'Tồn kho': p.quantity, 'Đơn vị': p.unit, 'Giá vốn': p.cost, 'Giá trị tồn': p.value }));
      fileName = `Bao_cao_kho_hang.xlsx`;
    } else if (type === 'customer') {
      data = topCustomers.map(c => ({ 'Mã': c.id, 'Tên': c.name, 'Chi tiêu': c.totalSpent, 'Nợ': c.debt, 'Điểm': c.loyaltyPoints, 'Số đơn': c.orderCount }));
      fileName = `Bao_cao_khach_hang.xlsx`;
    } else if (type === 'supplier') {
      data = topSuppliers.map(s => ({ 'Mã': s.code, 'Tên': s.name, 'Nhập hàng': s.totalImportValue, 'Đã trả': s.totalPaid, 'Nợ': s.debt, 'Số phiếu': s.importCount }));
      fileName = `Bao_cao_nha_cung_cap.xlsx`;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo');
    XLSX.writeFile(wb, fileName);
  };

  // ---------- Filter component ----------
  const FilterBar = () => (
    <div className="reports-filter-bar mb-4">
      <div className="reports-filter-row">
        <div className="reports-preset-group">
          {PRESETS.map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              className={`reports-filter-btn ${preset === p.key ? 'reports-filter-btn-active' : ''}`}>
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="filter-bar__date-input" />
            <span className="reports-text-muted">→</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="filter-bar__date-input" />
          </div>
        )}
        <button onClick={() => setShowFilters(!showFilters)}
          className={`reports-filter-toggle ${showFilters ? 'reports-filter-toggle-active' : ''}`}>
          <Filter className="w-3.5 h-3.5" /> Bộ lọc
        </button>
        <button onClick={() => { setPreset('30d'); setFilterProduct(''); setFilterCustomer(''); setFilterPayment(''); setFilterStatus('all'); setFilterCategory(''); setFilterStockStatus('all'); setFilterSupplier(''); }}
          className="reports-filter-toggle">
          <RefreshCw className="w-3.5 h-3.5" /> Đặt lại
        </button>
      </div>
      {showFilters && (
        <div className="reports-filter-grid">
          {activeTab !== 'inventory' && activeTab !== 'customer' && (
            <>
              {activeTab === 'sales' && (
                <>
                  <div>
                    <label className="reports-label">Sản phẩm</label>
                    <input type="text" placeholder="Tìm sản phẩm..." value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className="filter-bar__input" />
                  </div>
                  <div>
                    <label className="reports-label">Khách hàng</label>
                    <input type="text" placeholder="Tên khách hàng..." value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} className="filter-bar__input" />
                  </div>
                  <div>
                    <label className="reports-label">Thanh toán</label>
                    <FilterSelect
                      value={filterPayment}
                      options={[
                        { value: '', label: 'Tất cả' },
                        { value: 'Tiền mặt', label: 'Tiền mặt' },
                        { value: 'Chuyển khoản', label: 'Chuyển khoản' },
                        { value: 'Thẻ', label: 'Thẻ' },
                        { value: 'Khác', label: 'Khác' },
                      ]}
                      onChange={setFilterPayment}
                      label="Thanh toán"
                      icon={<Banknote className="w-4 h-4" />}
                    />
                  </div>
                  <div>
                    <label className="reports-label">Trạng thái</label>
                    <FilterSelect
                      value={filterStatus}
                      options={[
                        { value: 'all', label: 'Tất cả' },
                        { value: 'completed', label: 'Thành công' },
                        { value: 'cancelled', label: 'Đã hủy' },
                        { value: 'pending', label: 'Chờ' },
                      ]}
                      onChange={setFilterStatus}
                      label="Trạng thái"
                      icon={<CheckCircle className="w-4 h-4" />}
                    />
                  </div>
                </>
              )}
              {activeTab === 'profit' && (
                <>
                  <div>
                    <label className="reports-label">Sản phẩm</label>
                    <input type="text" placeholder="Tìm sản phẩm..." value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className="filter-bar__input" />
                  </div>
                  <div>
                    <label className="reports-label">Khách hàng</label>
                    <input type="text" placeholder="Tên khách hàng..." value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} className="filter-bar__input" />
                  </div>
                  <div>
                    <label className="reports-label">Trạng thái</label>
                    <FilterSelect
                      value={filterStatus}
                      options={[
                        { value: 'all', label: 'Tất cả' },
                        { value: 'completed', label: 'Thành công' },
                        { value: 'cancelled', label: 'Đã hủy' },
                      ]}
                      onChange={setFilterStatus}
                      label="Trạng thái"
                      icon={<CheckCircle className="w-4 h-4" />}
                    />
                  </div>
                  <div>
                    <label className="reports-label">So sánh</label>
                    <FilterSelect
                      value={compareMode}
                      options={[
                        { value: 'prev', label: 'Kỳ trước' },
                        { value: 'samePeriod', label: 'Cùng kỳ năm trước' },
                      ]}
                      onChange={setCompareMode}
                      label="So sánh"
                      icon={<TrendingUp className="w-4 h-4" />}
                    />
                  </div>
                </>
              )}
            </>
          )}
          {activeTab === 'inventory' && (
            <>
              <div>
                <label className="reports-label">Danh mục</label>
                <FilterSelect
                  value={filterCategory}
                  options={[
                    { value: '', label: 'Tất cả' },
                    ...categories.map(c => ({ value: c, label: c })),
                  ]}
                  onChange={setFilterCategory}
                  label="Danh mục"
                  icon={<Package className="w-4 h-4" />}
                />
              </div>
              <div>
                <label className="reports-label">Tình trạng tồn</label>
                <FilterSelect
                  value={filterStockStatus}
                  options={[
                    { value: 'all', label: 'Tất cả' },
                    { value: 'in', label: 'Còn hàng' },
                    { value: 'low', label: 'Sắp hết' },
                    { value: 'out', label: 'Hết hàng' },
                  ]}
                  onChange={setFilterStockStatus}
                  label="Tình trạng tồn"
                  icon={<Box className="w-4 h-4" />}
                />
              </div>
              <div>
                <label className="reports-label">Tồn kho tại</label>
                <input type="date" className="filter-bar__date-input w-full" />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  const isFetchingAny = isFetchingSales || isFetchingProfit || isFetchingInventory || isFetchingCustomer || isFetchingSupplier;

  if (isLoading) {
    return (
      <div className="reports-loading">
        <Loader2 className="reports-spinner" />
        <p className="reports-loading-text">Đang tổng hợp dữ liệu báo cáo...</p>
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="reports-page-header">
        <div>
          <h2 className="reports-page-title">Báo cáo</h2>
          <p className="reports-page-subtitle">Phân tích hiệu quả kinh doanh chi tiết</p>
        </div>
        <div className="flex items-center gap-2">
          {isFetchingAny && (
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
            </span>
          )}
          <button onClick={() => exportToExcel(activeTab)} className="reports-export-btn">
            <Download className="reports-icon-sm" /> <span className="hidden sm:inline">Xuất Excel</span>
          </button>
        </div>
      </div>

      <div className="reports-tabs">
        {[
          { key: 'sales' as const, label: 'Bán hàng', icon: DollarSign },
          { key: 'profit' as const, label: 'Lãi/Lỗ', icon: TrendingUp },
          { key: 'inventory' as const, label: 'Kho hàng', icon: Package },
          { key: 'customer' as const, label: 'Khách hàng', icon: Users },
          { key: 'supplier' as const, label: 'NCC', icon: Truck },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`reports-tab ${activeTab === tab.key ? 'reports-tab-active' : ''}`}>
            <tab.icon className={`reports-icon-sm ${activeTab === tab.key ? 'reports-text-primary' : 'reports-text-muted'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <FilterBar />

      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="reports-stat-card">
              <p className="reports-stat-label">Tổng doanh thu</p>
              <div className="flex items-baseline gap-2">
                <h3 className="reports-stat-value">{fmtShort(salesSummary.totalRevenue)}</h3>
                <span className={`reports-stat-trend ${salesSummary.revenueChange >= 0 ? 'reports-trend-up' : 'reports-trend-down'}`}>
                  {salesSummary.revenueChange >= 0 ? <ArrowUpRight className="reports-icon-xs" /> : <ArrowDownRight className="reports-icon-xs" />}
                  {Math.abs(salesSummary.revenueChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="reports-stat-card">
              <p className="reports-stat-label">Số đơn hàng</p>
              <div className="flex items-baseline gap-2">
                <h3 className="reports-stat-value">{salesSummary.totalOrders}</h3>
                <span className="reports-stat-unit">đơn</span>
              </div>
            </div>
            <div className="reports-stat-card">
              <p className="reports-stat-label">KH mới</p>
              <h3 className="reports-stat-value reports-stat-value-primary">{salesSummary.uniqueCustomers}</h3>
            </div>
            <div className="reports-stat-card">
              <p className="reports-stat-label">TB/đơn</p>
              <h3 className="reports-stat-value">{fmtShort(salesSummary.avgOrderValue)}</h3>
            </div>
          </div>

          <div className="reports-card">
            <h3 className="reports-card-title">Xu hướng doanh thu & đơn hàng</h3>
            <div className="reports-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => fmtShort(v)} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any, name: any) => name === 'orders' ? [value, 'Số đơn'] : [fmt(value ?? 0), name === 'revenue' ? 'Doanh thu' : 'Lợi nhuận']} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }} />
                  <Bar yAxisId="left" name="Doanh thu" dataKey="revenue" fill={COLORS.indigo} radius={[4, 4, 0, 0]} barSize={24} />
                  <Line yAxisId="right" name="orders" dataKey="orders" stroke={COLORS.green} strokeWidth={2} dot={{ r: 3, fill: COLORS.green }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="reports-card">
              <h3 className="reports-card-title">Dòng tiền theo phương thức</h3>
              {paymentData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
                        label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {paymentData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: any) => fmt(value ?? 0)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="reports-empty">Chưa có dữ liệu</p>}
            </div>

            <div className="reports-card">
              <h3 className="reports-card-title">Doanh thu phân loại</h3>
              <div className="space-y-4">
                <div className="reports-summary reports-summary-success">
                  <div className="flex items-center gap-3">
                    <div className="reports-summary-icon"><CheckCircle className="reports-icon" /></div>
                    <div><p className="reports-summary-title">Đơn thành công</p><p className="reports-summary-sub">{salesSummary.completedOrders} đơn</p></div>
                  </div>
                  <p className="reports-summary-value">{fmtShort(salesSummary.completedRevenue)}</p>
                </div>
                <div className="reports-summary reports-summary-danger">
                  <div className="flex items-center gap-3">
                    <div className="reports-summary-icon"><Ban className="reports-icon" /></div>
                    <div><p className="reports-summary-title">Đơn đã hủy</p><p className="reports-summary-sub">{salesSummary.cancelledOrders} đơn</p></div>
                  </div>
                  <p className="reports-summary-value">{fmtShort(salesSummary.cancelledRevenue)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="reports-card reports-card-overflow">
            <div className="reports-card-header">
              <div className="flex items-center gap-2">
                <h3 className="reports-card-header-title">Doanh thu theo nhóm</h3>
                <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="filter-bar__select w-full">
                  <option value="product">Sản phẩm</option><option value="customer">Khách hàng</option><option value="day">Ngày</option><option value="order">Đơn hàng</option>
                </select>
              </div>
              <span className="reports-count">{groupedData.length} mục</span>
            </div>
            <div className="overflow-x-auto">
              <table className="reports-table">
                <thead>
                  <tr className="reports-table-head">
                    <th>#</th>
                    <th>{groupBy === 'product' ? 'Sản phẩm' : groupBy === 'customer' ? 'Khách hàng' : groupBy === 'day' ? 'Ngày' : 'Mã đơn'}</th>
                    {groupBy === 'product' && <th className="reports-table-cell-right">SL</th>}
                    <th className="reports-table-cell-right">Doanh thu</th>
                    <th className="reports-table-cell-right"></th>
                  </tr>
                </thead>
                <tbody className="reports-table-body">
                  {groupedData.slice(0, 50).map((row, idx) => (
                    <React.Fragment key={row.key}>
                      <tr className={`reports-table-row cursor-pointer ${expandedGroup === row.key ? 'reports-table-row-active' : ''}`} onClick={() => setExpandedGroup(expandedGroup === row.key ? null : row.key)}>
                        <td className="reports-table-cell reports-table-cell-muted">{idx + 1}</td>
                        <td className="reports-table-cell reports-table-cell-dark reports-truncate">{row.label}</td>
                        {groupBy === 'product' && <td className="reports-table-cell reports-table-cell-right">{row.count}</td>}
                        <td className="reports-table-cell reports-table-cell-right reports-table-cell-primary reports-nowrap">{fmt(row.revenue)}</td>
                        <td className="reports-table-cell reports-table-cell-right">
                          <ChevronDown className={`reports-icon-sm ${expandedGroup === row.key ? 'rotate-180' : ''}`} />
                        </td>
                      </tr>
                      {expandedGroup === row.key && (
                        <tr><td colSpan={5} className="reports-detail-cell">
                          <div className="reports-detail-content">
                            <p><span className="reports-detail-label">Nhóm:</span> {row.label}</p>
                            <p><span className="reports-detail-label">Doanh thu:</span> {fmt(row.revenue)}</p>
                            <p><span className="reports-detail-label">Số đơn:</span> {row.orders || 1}</p>
                            {groupBy === 'product' && <p><span className="reports-detail-label">Số lượng:</span> {row.count}</p>}
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {groupedData.length === 0 && <p className="reports-empty">Không có dữ liệu</p>}
          </div>

          <div className="reports-card reports-card-overflow">
            <div className="reports-card-header-simple">
              <h3 className="reports-card-header-title">Giao dịch chi tiết</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="reports-table">
                <thead>
                  <tr className="reports-table-head">
                    <th>Ngày</th>
                    <th>Mã đơn</th>
                    <th>Sản phẩm</th>
                    <th className="reports-table-cell-right">SL</th>
                    <th className="reports-table-cell-right">Doanh thu</th>
                    <th>Khách hàng</th>
                    <th>Thanh toán</th>
                  </tr>
                </thead>
                <tbody className="reports-table-body">
                  {salesDetailRows.length === 0 ? (
                    <tr><td colSpan={7} className="reports-empty">Không có giao dịch nào</td></tr>
                  ) : (
                    salesDetailRows.slice((salesDetailPage - 1) * REPORT_PAGE_SIZE, salesDetailPage * REPORT_PAGE_SIZE).map((row, idx) => (
                      <tr key={`${row.orderId}-${idx}`} className="reports-table-row">
                        <td className="reports-table-cell">{row.date}</td>
                        <td className="reports-table-cell reports-table-cell-mono">{row.orderId}</td>
                        <td className="reports-table-cell reports-table-cell-dark">{row.productName}</td>
                        <td className="reports-table-cell reports-table-cell-right">{row.quantity}</td>
                        <td className="reports-table-cell reports-table-cell-right reports-table-cell-primary reports-nowrap">{fmt(row.revenue)}</td>
                        <td className="reports-table-cell">{row.customerName}</td>
                        <td className="reports-table-cell">
                          <span className="reports-badge">{row.paymentMethod}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={salesDetailPage} totalPages={Math.max(1, Math.ceil(salesDetailRows.length / REPORT_PAGE_SIZE))} pageSize={REPORT_PAGE_SIZE} totalItems={salesDetailRows.length} onPageChange={setSalesDetailPage} />
          </div>
        </div>
      )}

      {activeTab === 'profit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="reports-stat-card">
              <p className="reports-stat-label">Tổng lợi nhuận</p>
              <div className="flex items-baseline gap-2">
                <h3 className={`reports-stat-value ${profitSummary.profit >= 0 ? 'reports-stat-value-success' : 'reports-stat-value-danger'}`}>{fmtShort(profitSummary.profit)}</h3>
                <span className={`reports-stat-trend ${profitSummary.profitChange >= 0 ? 'reports-trend-up' : 'reports-trend-down'}`}>
                  {profitSummary.profitChange >= 0 ? <ArrowUpRight className="reports-icon-xs" /> : <ArrowDownRight className="reports-icon-xs" />}
                  {Math.abs(profitSummary.profitChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="reports-stat-card">
              <p className="reports-stat-label">Biên lợi nhuận</p>
              <h3 className="reports-stat-value">{profitSummary.margin.toFixed(1)}%</h3>
            </div>
            <div className="reports-stat-card">
              <p className="reports-stat-label">Tổng chi phí</p>
              <h3 className="reports-stat-value">{fmtShort(profitSummary.totalCost)}</h3>
            </div>
          </div>

          <div className="reports-card">
            <h3 className="reports-card-title">So sánh lợi nhuận theo ngày</h3>
            <div className="reports-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyProfitData}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.gray} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.gray} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => fmtShort(v)} />
                  <Tooltip formatter={(value: any) => fmt(value ?? 0)} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }} />
                  <Area type="monotone" name="Lợi nhuận hiện tại" dataKey="currentProfit" stroke={COLORS.green} fill="url(#colorProfit)" strokeWidth={2} />
                  <Area type="monotone" name="Lợi nhuận so sánh" dataKey="prevProfit" stroke={COLORS.gray} fill="url(#colorPrev)" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="reports-card reports-card-overflow">
            <div className="reports-card-header">
              <div className="flex items-center gap-2">
                <h3 className="reports-card-header-title">Lợi nhuận theo nhóm</h3>
                <select value={profitGroupBy} onChange={e => setProfitGroupBy(e.target.value)} className="filter-bar__select w-full">
                  <option value="product">Sản phẩm</option><option value="customer">Khách hàng</option><option value="day">Ngày</option>
                </select>
              </div>
              <span className="reports-count">{profitGroupedData.length} mục</span>
            </div>
            <div className="overflow-x-auto">
              <table className="reports-table">
                <thead>
                  <tr className="reports-table-head">
                    <th>#</th>
                    <th>{profitGroupBy === 'product' ? 'Sản phẩm' : profitGroupBy === 'customer' ? 'Khách hàng' : 'Ngày'}</th>
                    <th className="reports-table-cell-right">Doanh thu</th>
                    <th className="reports-table-cell-right">Giá vốn</th>
                    <th className="reports-table-cell-right">Lợi nhuận</th>
                    <th className="reports-table-cell-right"></th>
                  </tr>
                </thead>
                <tbody className="reports-table-body">
                  {profitGroupedData.slice(0, 50).map((row, idx) => (
                    <React.Fragment key={row.key}>
                      <tr className={`reports-table-row cursor-pointer ${expandedProfitGroup === row.key ? 'reports-table-row-active' : ''}`} onClick={() => setExpandedProfitGroup(expandedProfitGroup === row.key ? null : row.key)}>
                        <td className="reports-table-cell reports-table-cell-muted">{idx + 1}</td>
                        <td className="reports-table-cell reports-table-cell-dark reports-truncate">{row.label}</td>
                        <td className="reports-table-cell reports-table-cell-right reports-nowrap">{fmt(row.revenue)}</td>
                        <td className="reports-table-cell reports-table-cell-right reports-nowrap">{fmt(row.cost)}</td>
                        <td className={`reports-table-cell reports-table-cell-right reports-nowrap ${row.profit >= 0 ? 'reports-table-cell-success' : 'reports-table-cell-danger'}`}>{fmt(row.profit)}</td>
                        <td className="reports-table-cell reports-table-cell-right">
                          <ChevronDown className={`reports-icon-sm ${expandedProfitGroup === row.key ? 'rotate-180' : ''}`} />
                        </td>
                      </tr>
                      {expandedProfitGroup === row.key && (
                        <tr><td colSpan={6} className="reports-detail-cell">
                          <div className="reports-detail-content">
                            <p><span className="reports-detail-label">Nhóm:</span> {row.label}</p>
                            <p><span className="reports-detail-label">Doanh thu:</span> {fmt(row.revenue)}</p>
                            <p><span className="reports-detail-label">Giá vốn:</span> {fmt(row.cost)}</p>
                            <p><span className="reports-detail-label">Lợi nhuận:</span> {fmt(row.profit)}</p>
                            <p><span className="reports-detail-label">Biên LN:</span> {row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(1) : 0}%</p>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {profitGroupedData.length === 0 && <p className="reports-empty">Không có dữ liệu</p>}
          </div>

          <div className="reports-card reports-card-overflow">
            <div className="reports-card-header-simple">
              <h3 className="reports-card-header-title">Chi tiết lợi nhuận</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="reports-table">
                <thead>
                  <tr className="reports-table-head">
                    <th>Ngày</th>
                    <th>Mã đơn</th>
                    <th>Sản phẩm</th>
                    <th className="reports-table-cell-right">Doanh thu</th>
                    <th className="reports-table-cell-right">Giá vốn</th>
                    <th className="reports-table-cell-right">Lợi nhuận</th>
                    <th className="reports-table-cell-right">Biên LN</th>
                  </tr>
                </thead>
                <tbody className="reports-table-body">
                  {profitDetails.length === 0 ? (
                    <tr><td colSpan={7} className="reports-empty">Không có dữ liệu</td></tr>
                  ) : (
                    profitDetails.slice((profitDetailPage - 1) * REPORT_PAGE_SIZE, profitDetailPage * REPORT_PAGE_SIZE).map((row, idx) => (
                      <tr key={`${row.orderId}-${idx}`} className="reports-table-row">
                        <td className="reports-table-cell">{row.date}</td>
                        <td className="reports-table-cell reports-table-cell-mono">{row.orderId}</td>
                        <td className="reports-table-cell reports-table-cell-dark">{row.productName}</td>
                        <td className="reports-table-cell reports-table-cell-right reports-nowrap">{fmt(row.revenue)}</td>
                        <td className="reports-table-cell reports-table-cell-right reports-nowrap">{fmt(row.cost)}</td>
                        <td className={`reports-table-cell reports-table-cell-right reports-nowrap ${row.profit >= 0 ? 'reports-table-cell-success' : 'reports-table-cell-danger'}`}>{fmt(row.profit)}</td>
                        <td className="reports-table-cell reports-table-cell-right">{row.margin.toFixed(1)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={profitDetailPage} totalPages={Math.max(1, Math.ceil(profitDetails.length / REPORT_PAGE_SIZE))} pageSize={REPORT_PAGE_SIZE} totalItems={profitDetails.length} onPageChange={setProfitDetailPage} />
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="reports-stat-card">
              <p className="reports-stat-label">Tổng giá trị tồn</p>
              <h3 className="reports-stat-value">{fmtShort(inventorySummary.totalValue)}</h3>
            </div>
            <div className="reports-stat-card">
              <p className="reports-stat-label">Tổng số lượng</p>
              <h3 className="reports-stat-value">{inventorySummary.totalQty.toLocaleString('vi-VN')}</h3>
            </div>
            <div className="reports-stat-card">
              <p className="reports-stat-label">Sắp hết hàng</p>
              <h3 className="reports-stat-value reports-stat-value-warning">{inventorySummary.lowStockCount}</h3>
            </div>
            <div className="reports-stat-card">
              <p className="reports-stat-label">Hết hàng</p>
              <h3 className="reports-stat-value reports-stat-value-danger">{inventorySummary.outOfStockCount}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="reports-card">
              <h3 className="reports-card-title">Giá trị tồn kho theo danh mục</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={inventoryByCategory} cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {inventoryByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: any) => fmt(value ?? 0)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="reports-card">
              <h3 className="reports-card-title">Xuất bán trong kỳ</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={exportInPeriod.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => fmtShort(v)} />
                    <YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip formatter={(value: any, name: any) => [name === 'qty' ? value : fmt(value ?? 0), name === 'qty' ? 'Số lượng' : 'Giá trị']} />
                    <Bar dataKey="qty" fill={COLORS.indigo} radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="reports-card reports-card-overflow">
            <div className="reports-card-header-simple">
              <h3 className="reports-card-header-title">Danh sách tồn kho</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="reports-table">
                <thead>
                  <tr className="reports-table-head">
                    <th>Mã SP</th>
                    <th>Tên sản phẩm</th>
                    <th>Danh mục</th>
                    <th className="reports-table-cell-right">Tồn</th>
                    <th className="reports-table-cell-right">Giá vốn</th>
                    <th className="reports-table-cell-right">Giá trị tồn</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="reports-table-body">
                  {filteredProducts.length === 0 ? (
                    <tr><td colSpan={7} className="reports-empty">Không có sản phẩm nào</td></tr>
                  ) : (
                    filteredProducts.slice((inventoryPage - 1) * REPORT_PAGE_SIZE, inventoryPage * REPORT_PAGE_SIZE).map((p) => (
                      <tr key={p.id} className="reports-table-row">
                        <td className="reports-table-cell reports-table-cell-mono">{p.code}</td>
                        <td className="reports-table-cell reports-table-cell-dark">{p.name}</td>
                        <td className="reports-table-cell">{p.category}</td>
                        <td className="reports-table-cell reports-table-cell-right">{p.quantity} {p.unit}</td>
                        <td className="reports-table-cell reports-table-cell-right reports-nowrap">{fmt(p.cost)}</td>
                        <td className="reports-table-cell reports-table-cell-right reports-nowrap">{fmt(p.value)}</td>
                        <td className="reports-table-cell">
                          {p.quantity <= 0 ? (
                            <span className="reports-badge reports-badge-danger">Hết hàng</span>
                          ) : p.quantity <= p.minStock ? (
                            <span className="reports-badge reports-badge-warning">Sắp hết</span>
                          ) : (
                            <span className="reports-badge reports-badge-success">Còn hàng</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={inventoryPage} totalPages={Math.max(1, Math.ceil(filteredProducts.length / REPORT_PAGE_SIZE))} pageSize={REPORT_PAGE_SIZE} totalItems={filteredProducts.length} onPageChange={setInventoryPage} />
          </div>

          <div className="reports-card reports-card-overflow">
            <div className="reports-card-header-simple">
              <h3 className="reports-card-header-title">Sản phẩm cần nhập thêm</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="reports-table">
                <thead>
                  <tr className="reports-table-head">
                    <th>Mã SP</th>
                    <th>Tên sản phẩm</th>
                    <th>Danh mục</th>
                    <th className="reports-table-cell-right">Tồn</th>
                    <th className="reports-table-cell-right">Mức tối thiểu</th>
                    <th className="reports-table-cell-right">Giá vốn</th>
                  </tr>
                </thead>
                <tbody className="reports-table-body">
                  {lowStockProducts.length === 0 ? (
                    <tr><td colSpan={6} className="reports-empty">Không có sản phẩm cần nhập</td></tr>
                  ) : (
                    lowStockProducts.slice(0, 20).map((p) => (
                      <tr key={p.id} className="reports-table-row">
                        <td className="reports-table-cell reports-table-cell-mono">{p.code}</td>
                        <td className="reports-table-cell reports-table-cell-dark">{p.name}</td>
                        <td className="reports-table-cell">{p.category}</td>
                        <td className="reports-table-cell reports-table-cell-right">{p.quantity} {p.unit}</td>
                        <td className="reports-table-cell reports-table-cell-right">{p.minStock}</td>
                        <td className="reports-table-cell reports-table-cell-right reports-nowrap">{fmt(p.cost)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'customer' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="reports-stat-card">
              <p className="reports-stat-label">Tổng khách hàng</p>
              <h3 className="reports-stat-value">{customerSummary.totalCustomers.toLocaleString('vi-VN')}</h3>
            </div>
            <div className="reports-stat-card">
              <p className="reports-stat-label">Khách mới trong kỳ</p>
              <h3 className="reports-stat-value reports-stat-value-primary">{customerSummary.newCustomers}</h3>
            </div>
            <div className="reports-stat-card">
              <p className="reports-stat-label">Tổng nợ</p>
              <h3 className="reports-stat-value reports-stat-value-danger">{fmtShort(customerSummary.totalDebt)}</h3>
            </div>
            <div className="reports-stat-card">
              <p className="reports-stat-label">Tổng điểm</p>
              <h3 className="reports-stat-value">{customerSummary.totalPoints.toLocaleString('vi-VN')}</h3>
            </div>
            <div className="reports-stat-card">
              <p className="reports-stat-label">Tổng chi tiêu</p>
              <h3 className="reports-stat-value">{fmtShort(customerSummary.totalSpent)}</h3>
            </div>
          </div>

          <div className="reports-card">
            <h3 className="reports-card-title">Khách hàng mới theo ngày</h3>
            <div className="reports-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip />
                  <Bar dataKey="newCustomers" name="Khách mới" fill={COLORS.purple} radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="reports-card reports-card-overflow">
            <div className="reports-card-header-simple">
              <h3 className="reports-card-header-title">Top khách hàng chi tiêu cao nhất</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="reports-table">
                <thead>
                  <tr className="reports-table-head">
                    <th>#</th>
                    <th>Tên khách hàng</th>
                    <th className="reports-table-cell-right">Số đơn</th>
                    <th className="reports-table-cell-right">Tổng chi tiêu</th>
                    <th className="reports-table-cell-right">Nợ</th>
                    <th className="reports-table-cell-right">Điểm</th>
                  </tr>
                </thead>
                <tbody className="reports-table-body">
                  {topCustomers.length === 0 ? (
                    <tr><td colSpan={6} className="reports-empty">Không có dữ liệu</td></tr>
                  ) : (
                    topCustomers.slice((customerPage - 1) * REPORT_PAGE_SIZE, customerPage * REPORT_PAGE_SIZE).map((c, idx) => (
                      <tr key={c.id} className="reports-table-row">
                        <td className="reports-table-cell reports-table-cell-muted">{idx + 1}</td>
                        <td className="reports-table-cell reports-table-cell-dark">{c.name}</td>
                        <td className="reports-table-cell reports-table-cell-right">{c.orderCount}</td>
                        <td className="reports-table-cell reports-table-cell-right reports-table-cell-primary reports-nowrap">{fmt(c.totalSpent)}</td>
                        <td className="reports-table-cell reports-table-cell-right reports-nowrap">{fmt(c.debt)}</td>
                        <td className="reports-table-cell reports-table-cell-right">{c.loyaltyPoints}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={customerPage} totalPages={Math.max(1, Math.ceil(topCustomers.length / REPORT_PAGE_SIZE))} pageSize={REPORT_PAGE_SIZE} totalItems={topCustomers.length} onPageChange={setCustomerPage} />
          </div>
        </div>
      )}

      {activeTab === 'supplier' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="reports-stat-card">
              <p className="reports-stat-label">Tổng NCC</p>
              <h3 className="reports-stat-value">{supplierSummary.totalSuppliers.toLocaleString('vi-VN')}</h3>
            </div>
            <div className="reports-stat-card">
              <p className="reports-stat-label">Tổng nợ NCC</p>
              <h3 className="reports-stat-value reports-stat-value-danger">{fmtShort(supplierSummary.totalDebt)}</h3>
            </div>
            <div className="reports-stat-card">
              <p className="reports-stat-label">Tổng đã trả</p>
              <h3 className="reports-stat-value reports-stat-value-success">{fmtShort(supplierSummary.totalPaid)}</h3>
            </div>
            <div className="reports-stat-card">
              <p className="reports-stat-label">Nhập trong kỳ</p>
              <h3 className="reports-stat-value">{fmtShort(supplierSummary.totalImportValue)}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="reports-card">
              <h3 className="reports-card-title">Nhập hàng theo NCC</h3>
              <div className="h-64">
                {importBySupplier.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={importBySupplier.filter(s => s.value > 0)} cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {importBySupplier.filter(s => s.value > 0).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: any) => fmt(value ?? 0)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="reports-empty">Chưa có dữ liệu</p>}
              </div>
            </div>

            <div className="reports-card">
              <h3 className="reports-card-title">NCC mới theo ngày</h3>
              <div className="reports-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={supplierGrowth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <Tooltip />
                    <Bar dataKey="newSuppliers" name="NCC mới" fill={COLORS.amber} radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="reports-card reports-card-overflow">
            <div className="reports-card-header-simple">
              <h3 className="reports-card-header-title">Top nhà cung cấp nhập hàng nhiều nhất</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="reports-table">
                <thead>
                  <tr className="reports-table-head">
                    <th>#</th>
                    <th>Mã NCC</th>
                    <th>Tên nhà cung cấp</th>
                    <th className="reports-table-cell-right">Số phiếu</th>
                    <th className="reports-table-cell-right">Tổng nhập</th>
                    <th className="reports-table-cell-right">Đã trả</th>
                    <th className="reports-table-cell-right">Nợ</th>
                  </tr>
                </thead>
                <tbody className="reports-table-body">
                  {topSuppliers.length === 0 ? (
                    <tr><td colSpan={7} className="reports-empty">Không có dữ liệu</td></tr>
                  ) : (
                    topSuppliers.slice(0, 50).map((s, idx) => (
                      <tr key={s.id} className="reports-table-row">
                        <td className="reports-table-cell reports-table-cell-muted">{idx + 1}</td>
                        <td className="reports-table-cell reports-table-cell-mono">{s.code}</td>
                        <td className="reports-table-cell reports-table-cell-dark">{s.name}</td>
                        <td className="reports-table-cell reports-table-cell-right">{s.importCount}</td>
                        <td className="reports-table-cell reports-table-cell-right reports-table-cell-primary reports-nowrap">{fmt(s.totalImportValue)}</td>
                        <td className="reports-table-cell reports-table-cell-right reports-nowrap">{fmt(s.totalPaid)}</td>
                        <td className="reports-table-cell reports-table-cell-right reports-nowrap">{fmt(s.debt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
