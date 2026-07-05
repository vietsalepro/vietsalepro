import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, QrCode, Edit2, Check,
  ShoppingCart, Package, Truck, Users,
  FileText, BarChart3, ChevronRight,
  TrendingUp, TrendingDown, Plus,
  Bell, Settings as SettingsIcon, Receipt,
  Sparkles, LayoutDashboard, ArrowDownToLine, RotateCcw,
  Eye, EyeOff
} from 'lucide-react';
import { FeaturePicker, ALL_FEATURES, LOCKED_FEATURES, FeatureItem } from './FeaturePicker';
import { UserMenuMobile } from './UserMenuMobile';
import { supabaseService } from '../services/supabaseService';
import './MobileHome.css';

interface MobileHomeProps {
  storeName: string;
  onOpenSettings?: () => void;
}

// Default feature paths shown on home grid (in order)
const DEFAULT_HOME_FEATURES: string[] = [
  '/tong-quan',
  '/pos',
  '/products',
  '/customers',
  '/orders',
  '/import',
  '/inventory-count',
  '/reports',
  '/settings',
  '/tax',
];

// Ensure all locked (core) features are always present in the list
function ensureLocked(paths: string[]): string[] {
  const missing = LOCKED_FEATURES.filter(p => !paths.includes(p));
  return missing.length ? [...missing, ...paths] : paths;
}


const STORAGE_KEY = 'home_feature_list';

// Build a map for quick lookup
const FEATURE_MAP: Record<string, FeatureItem> = ALL_FEATURES.reduce((acc, f) => {
  acc[f.path] = f;
  return acc;
}, {} as Record<string, FeatureItem>);

// Count-up hook for revenue number
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export function MobileHome(props: MobileHomeProps) {
  const { storeName } = props;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStoreName, setEditingStoreName] = useState(false);
  const [localStoreName, setLocalStoreName] = useState(storeName);
  const [summary, setSummary] = useState({
    todayRevenue: 0,
    yesterdayRevenue: 0,
    todayOrders: 0,
    todaySoldProducts: 0,
    todayCustomers: 0,
    activeProducts: 0,
    totalCustomers: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    supabaseService.getOrdersPaginated(1, 5)
      .then(data => setRecentOrders(data.orders || []))
      .catch(() => {});
    supabaseService.getDashboardSummary().then(data => {
      setSummary({
        todayRevenue: data.todayRevenue,
        yesterdayRevenue: data.yesterdayRevenue,
        todayOrders: data.todayOrders,
        todaySoldProducts: data.todaySoldProducts,
        todayCustomers: data.todayCustomers,
        activeProducts: data.activeProducts,
        totalCustomers: data.totalCustomers
      });
    }).catch(() => {});
  }, []);

  // Feature list from AsyncStorage / localStorage
  const [featurePaths, setFeaturePaths] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {

    }
    return DEFAULT_HOME_FEATURES;
  });

  // Persist whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(featurePaths));
    } catch (e) {

    }
  }, [featurePaths]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Resolve paths -> feature items, dropping unknown paths
  const homeFeatures = useMemo(
    () => featurePaths.map(p => FEATURE_MAP[p]).filter(Boolean) as FeatureItem[],
    [featurePaths]
  );

  const handleToggleFeature = (path: string) => {
    // Core features cannot be removed
    if (LOCKED_FEATURES.includes(path)) return;
    setFeaturePaths(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const todayRevenue = summary.todayRevenue;
  const yesterdayRevenue = summary.yesterdayRevenue;
  const revenueChange = yesterdayRevenue > 0
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
    : todayRevenue > 0 ? '100' : '0';

  const totalOrdersToday = summary.todayOrders;
  const activeProducts = summary.activeProducts;
  const totalCustomers = summary.totalCustomers;

  // Computed stats for hero banner
  const soldProductsToday = summary.todaySoldProducts;
  const customersToday = summary.todayCustomers;

  const animatedRevenue = useCountUp(todayRevenue, 900);

  // Eye toggle — show/hide revenue
  const [revenueVisible, setRevenueVisible] = useState(true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/products?search=' + encodeURIComponent(searchQuery.trim()));
    }
  };

  // Format today's date — short Vietnamese style
  const todayLabel = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  // Avatar initials from store name
  const initials = (localStoreName || 'VS')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '').join('') || 'VS';

  return (
    <div className="m-bg min-h-screen m-with-nav md:pb-0">
      {/* ===== Top Bar: Avatar + Search + QR ===== */}
      <header className="m-glass sticky top-0 z-30 px-4 safe-header-pt pb-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="m-avatar w-10 h-10 text-sm shrink-0 transition-transform active:scale-90"
            onClick={() => setUserMenuOpen(true)}
            aria-label="Mở menu tài khoản"
          >
            {initials}
          </button>

          <form onSubmit={handleSearch} className="flex-1 m-search flex items-center px-3 py-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2.2} />
            <input
              type="text"
              placeholder="Tìm sản phẩm, đơn hàng, khách hàng..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 ml-2 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-700"
            />
          </form>

          <button
            type="button"
            className="m-qr-btn p-2.5 shrink-0"
            aria-label="Quét mã QR"
          >
            <QrCode className="w-5 h-5" strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {/* ===== Greeting ===== */}
      <section className="px-4 pt-4 pb-1 animate-fade-in-up">
        <p className="text-sm text-slate-500">Chào,</p>
        <div className="flex items-center gap-2 mt-0.5">
          {editingStoreName ? (
            <div className="flex items-center gap-1.5 flex-1">
              <input
                type="text"
                value={localStoreName}
                onChange={e => setLocalStoreName(e.target.value)}
                onBlur={() => setEditingStoreName(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingStoreName(false)}
                className="flex-1 text-lg font-bold uppercase tracking-tight bg-white border border-purple-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                autoFocus
              />
              <button
                onClick={() => setEditingStoreName(false)}
                className="p-1.5 rounded-lg bg-purple-100 text-purple-600 active:scale-90 transition-transform"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold uppercase tracking-tight text-slate-800 leading-tight">
                {localStoreName}
              </h1>
              <button
                onClick={() => setEditingStoreName(true)}
                className="p-1 text-slate-400 hover:text-purple-500 active:scale-90 transition-all"
                aria-label="Đổi tên cửa hàng"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </section>

      {/* ===== Hero Card: Doanh thu hôm nay ===== */}
      <section className="px-4 pt-4 animate-fade-in-up m-anim-delay-05">
        <div className="m-hero p-5 pb-4">
          {/* Star sparkles decoration */}
          <span className="absolute top-3 left-[38%] text-white/20 text-[10px] pointer-events-none select-none animate-pulse-soft">✦</span>
          <span className="absolute top-10 left-[52%] text-white/15 text-[8px] pointer-events-none select-none animate-pulse-soft m-anim-delay-6">✦</span>
          <span className="absolute top-5 left-[62%] text-white/10 text-[6px] pointer-events-none select-none animate-pulse-soft m-anim-delay-12">✦</span>

          {/* 2-column layout */}
          <div className="relative flex items-stretch gap-2">

            {/* ── LEFT 2/3 ── */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              {/* Title row + eye toggle */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-white/90 uppercase tracking-wider leading-none">
                  Doanh thu hôm nay
                </span>
                <button
                  type="button"
                  aria-label={revenueVisible ? 'Ẩn doanh thu' : 'Hiện doanh thu'}
                  onClick={() => setRevenueVisible(v => !v)}
                  className="p-0.5 text-white/60 hover:text-white active:scale-90 transition-all"
                >
                  {revenueVisible
                    ? <Eye className="w-3.5 h-3.5" strokeWidth={2} />
                    : <EyeOff className="w-3.5 h-3.5" strokeWidth={2} />}
                </button>
              </div>

              {/* Revenue amount */}
              <div className="flex items-baseline gap-1 leading-none">
                {revenueVisible ? (
                  <>
                    <span className="m-counter text-[28px] font-black leading-none tracking-tight text-white">
                      {animatedRevenue.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-lg font-bold text-white/80">₫</span>
                  </>
                ) : (
                  <span className="text-[28px] font-black leading-none tracking-tight text-white/60 select-none">
                    ••••••
                  </span>
                )}
              </div>

              {/* Growth badge */}
              <div className="flex items-center gap-1.5">
                <span className={
                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold ' +
                  (parseFloat(revenueChange) >= 0
                    ? 'bg-emerald-400/25 text-emerald-200 border border-emerald-400/40'
                    : 'bg-red-400/25 text-red-200 border border-red-400/40')
                }>
                  {parseFloat(revenueChange) >= 0
                    ? <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                    : <TrendingDown className="w-3 h-3" strokeWidth={2.5} />}
                  {parseFloat(revenueChange) >= 0 ? '+' : ''}{revenueChange}%
                </span>
                <span className="text-[11px] text-white/60">so với hôm qua</span>
              </div>

              {/* 3 sub-stats */}
              <div className="flex items-center gap-0 mt-1">
                {/* Đơn hàng */}
                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3 text-white/50" strokeWidth={2.2} />
                    <span className="text-[10px] text-white/60">Đơn hàng</span>
                  </div>
                  <span className="text-sm font-bold text-white m-counter">{totalOrdersToday}</span>
                </div>
                <div className="w-px h-7 bg-white/15" />
                {/* Sản phẩm bán */}
                <div className="flex-1 flex flex-col gap-0.5 pl-2">
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3 text-white/50" strokeWidth={2.2} />
                    <span className="text-[10px] text-white/60">Sản phẩm bán</span>
                  </div>
                  <span className="text-sm font-bold text-white m-counter">{soldProductsToday}</span>
                </div>
                <div className="w-px h-7 bg-white/15" />
                {/* Khách hàng */}
                <div className="flex-1 flex flex-col gap-0.5 pl-2">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-white/50" strokeWidth={2.2} />
                    <span className="text-[10px] text-white/60">Khách hàng</span>
                  </div>
                  <span className="text-sm font-bold text-white m-counter">{customersToday}</span>
                </div>
              </div>
            </div>

            {/* ── RIGHT 1/3 ── */}
            <div className="flex flex-col items-end justify-between gap-2 shrink-0 w-[90px]">
              {/* "Xem lãi lỗ" button */}
              <button
                type="button"
                onClick={() => navigate('/reports')}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/95 text-[10px] font-bold text-indigo-700 shadow-sm active:scale-95 transition-transform whitespace-nowrap"
              >
                <BarChart3 className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                Xem lãi lỗ →
              </button>

              {/* 3D-ish SVG illustration: coin + chart + bag */}
              <svg
                className="w-[78px] h-[78px] opacity-95 animate-float pointer-events-none"
                viewBox="0 0 100 100"
                fill="none"
                aria-hidden="true"
              >
                {/* Shopping bag */}
                <rect x="48" y="42" width="34" height="38" rx="5" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2"/>
                <path d="M56 42 V36 a9 9 0 0 1 18 0 V42" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                {/* Chart bars */}
                <rect x="14" y="60" width="6" height="18" rx="2" fill="rgba(255,255,255,0.30)"/>
                <rect x="23" y="52" width="6" height="26" rx="2" fill="rgba(255,255,255,0.50)"/>
                <rect x="32" y="44" width="6" height="34" rx="2" fill="rgba(255,255,255,0.70)"/>
                {/* Gold coin */}
                <circle cx="22" cy="26" r="14" fill="#FCD34D" stroke="rgba(255,255,255,0.65)" strokeWidth="1.2"/>
                <circle cx="22" cy="26" r="10" fill="#F59E0B" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
                <text x="22" y="30.5" textAnchor="middle" fontSize="10" fontWeight="800" fill="#92400E">₫</text>
              </svg>
            </div>

          </div>
        </div>
      </section>

      {/* ===== Quick Stats Row ===== */}
      <section className="px-4 pt-4 animate-fade-in-up m-anim-delay-1">
        <div className="grid grid-cols-3 gap-3">
          <div className="m-stat">
            <div className="m-stat-icon bg-orange-100 text-orange-600 mb-1.5">
              <FileText className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">Đơn hôm nay</p>
            <p className="text-xl font-bold text-slate-800 m-counter">{totalOrdersToday}</p>
          </div>
          <div className="m-stat">
            <div className="m-stat-icon bg-blue-100 text-blue-600 mb-1.5">
              <Package className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">Tồn kho</p>
            <p className="text-xl font-bold text-slate-800 m-counter">{activeProducts}</p>
          </div>
          <div className="m-stat">
            <div className="m-stat-icon bg-emerald-100 text-emerald-600 mb-1.5">
              <Users className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">Khách hàng</p>
            <p className="text-xl font-bold text-slate-800 m-counter">{totalCustomers}</p>
          </div>
        </div>
      </section>

      {/* ===== Quick Action Grid (dynamic) ===== */}
      <section className="px-4 pt-5">
        <h2 className="m-section-title flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          Tính năng cho bạn
        </h2>
        <div className="grid grid-cols-3 gap-3 stagger-scale">
          {homeFeatures.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                type="button"
                onClick={() => navigate(action.path)}
                className="m-action"
              >
                <div className="m-action-icon" style={{ background: action.gradient }}>
                  <Icon className="w-7 h-7" strokeWidth={2.3} />
                </div>
                <span className="text-[13px] font-semibold text-slate-700 leading-tight text-center">
                  {action.label}
                </span>
              </button>
            );
          })}

          {/* "+ Thêm tính năng" — opens FeaturePicker bottom sheet */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="m-action m-action-dashed"
            aria-label="Thêm tính năng"
          >
            <div className="w-14 h-14 rounded-[18px] flex items-center justify-center bg-purple-50 text-purple-500">
              <Plus className="w-7 h-7" strokeWidth={2.4} />
            </div>
            <span className="text-[13px] font-semibold text-purple-500 leading-tight text-center">
              Thêm tính năng
            </span>
          </button>
        </div>
      </section>

      {/* ===== Recent Orders ===== */}
      {recentOrders.length > 0 && (
        <section className="px-4 pt-6 pb-4 animate-fade-in-up m-anim-delay-15">
          <div className="flex items-center justify-between mb-3">
            <h2 className="m-section-title mb-0">Đơn hàng gần đây</h2>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs text-purple-600 font-semibold inline-flex items-center gap-0.5 active:scale-95 transition-transform"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2 stagger">
            {recentOrders.map((order: any) => (
              <div
                key={order.id}
                onClick={() => navigate('/orders')}
                className="m-card m-card-interactive flex items-center justify-between p-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className={'relative w-10 h-10 rounded-xl flex items-center justify-center ' + (
                    order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                    order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                    'bg-amber-50 text-amber-600'
                  )}>
                    <FileText className="w-4 h-4" strokeWidth={2.4} />
                    <span className={'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse-soft ' + (
                      order.status === 'completed' ? 'bg-emerald-500' :
                      order.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                    )} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      #{(order.id || '').toString()}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(order.createdAt || order.date).toLocaleTimeString('vi-VN', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-800 m-counter">
                  {(order.totalAmount || 0).toLocaleString('vi-VN')}₫
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== User Menu Bottom Sheet ===== */}
      <UserMenuMobile
        visible={userMenuOpen}
        onClose={() => setUserMenuOpen(false)}
        storeName={localStoreName}
        onOpenSettings={props.onOpenSettings}
      />

      {/* ===== Feature Picker Bottom Sheet ===== */}
      <FeaturePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        currentFeatures={featurePaths}
        onToggleFeature={handleToggleFeature}
      />
    </div>
  );
}

export default MobileHome;
