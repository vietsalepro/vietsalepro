import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Order, Customer, ReturnOrder, AppSettings, Product } from '../types';
import { Card, Button, Badge, EmptyState, Input } from '../components/ui';
import { useReturnOrder } from '../hooks/useReturnOrder';
import { printReturnOrder } from '../utils/printReturnOrder';
import { supabaseService } from '../services/supabaseService';
import { StatusBadge } from '../components/StatusBadge';
import { ActionButton } from '../components/ActionButton';
import { DataGrid, DataGridColumn, SortDirection } from '../components/DataGrid';
import { useNewDataGridReturnOrders } from '../features';
import { PageLayout } from '../components/shared/PageLayout';
import { DataGridBox } from '../components/shared/DataGridBox';
import { useDebounce } from '../hooks/useDebounce';
import { usePermissions } from '../hooks/usePermissions';
import '../components/shared/FilterBar.css';
import './ReturnOrders.css';
import {
  Loader2, X, AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, Plus, Filter, Check,
  FileText, Search, User, Calendar, Wallet, CheckCircle, XCircle,
  Printer, Trash2, Box, RotateCcw, Minus, AlertCircle, RefreshCw, ArrowRight,
  Store, Phone, Award, Truck, Banknote, CreditCard, Clock
} from 'lucide-react';

interface ReturnOrdersProps {
  products?: Product[];
  customers?: Customer[];
  orders: Order[];
  appSettings: AppSettings;
  isAppLocked?: boolean;
  setIsAppLocked?: (isLocked: boolean) => void;
}

// Local type cho hàng đổi mới (Phase 1: UI-only, chưa kết nối backend)
interface ExchangeItem {
  productId: string;
  productName: string;
  code: string;
  unitName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  availableStock: number;
  lotId?: string;
  lotCode?: string;
}

type ViewState = 'list' | 'create' | 'detail';

const REASON_CHIPS = ['Hàng lỗi', 'Hết hạn sử dụng', 'Khách đổi ý', 'Sai sản phẩm', 'Khác'];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const formatTime = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit'
  });
};

const formatDateShort = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending': 
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">● Chờ xác nhận</span>;
    case 'completed': 
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">● Đã hoàn tất</span>;
    case 'cancelled': 
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">● Đã hủy</span>;
    default: 
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-100">{status}</span>;
  }
};

const getV2StatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <StatusBadge label="Chờ xác nhận" type="warning" size="sm" />;
    case 'completed':
      return <StatusBadge label="Đã hoàn tất" type="success" size="sm" />;
    case 'cancelled':
      return <StatusBadge label="Đã hủy" type="danger" size="sm" />;
    default:
      return <StatusBadge label={status} type="default" size="sm" />;
  }
};

export const ReturnOrders: React.FC<ReturnOrdersProps> = ({ products = [], customers = [], orders, appSettings, isAppLocked, setIsAppLocked }) => {
  const {
    returnOrders,
    loading,
    error,
    formState,
    formItems,
    setFormState,
    setDebtReduction,
    setCashRefund,
    setReason,
    setNote,
    updateItem,
    submitReturn,
    initializeFromOrder,
    fetchReturnOrdersPaginated,
    selectedReturnOrder,
    detailLoading,
    detailError,
    fetchReturnOrderDetail,
    clearSelectedReturnOrder,
    cancelReturnOrder,
    submitExchange,
    feeResult,
    paymentClass,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    filters,
    setCurrentPage,
    setFilters,
    resetFilters,
  } = useReturnOrder(appSettings);
  const permissions = usePermissions();

  // STATE QUẢN LÝ TÍNH NĂNG CHECKBOX CHỌN NHIỀU
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'completed', label: 'Đã hoàn tất' },
    { value: 'cancelled', label: 'Đã hủy' },
    { value: 'pending', label: 'Chờ xác nhận' },
  ];

  const [view, setView] = useState<ViewState>('list');

  // Quản lý cơ chế khóa app khi mở phiếu tạo trả hàng
  useEffect(() => {
    if (setIsAppLocked) {
      setIsAppLocked(view === 'create');
    }
  }, [view, setIsAppLocked]);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, completed: 0, cancelled: 0, totalRefund: 0 });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get('orderId');
  const initRef = useRef(false);
  const dataGridBoxRef = useRef<HTMLDivElement>(null);
  const [returnSearchInput, setReturnSearchInput] = useState('');
  const debouncedReturnSearch = useDebounce(returnSearchInput, 300);

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 1 — CACHE MỘT RECORD KHÁCH HÀNG / SẢN PHẨM (thay thế .find trên prop rỗng)
  // ═════════════════════════════════════════════════════════════════════
  const [customerCache, setCustomerCache] = useState<Map<string, Customer>>(new Map());
  const [productCache, setProductCache] = useState<Map<string, Product>>(new Map());

  const getCustomerFromCache = useCallback((id?: string) => id ? customerCache.get(id) : undefined, [customerCache]);
  const getProductFromCache = useCallback((id?: string) => id ? productCache.get(id) : undefined, [productCache]);

  const ensureCustomer = useCallback(async (id: string): Promise<Customer | null> => {
    if (!id) return null;
    const cached = customerCache.get(id);
    if (cached) return cached;
    try {
      const customer = await supabaseService.getCustomerById(id);
      if (customer) {
        setCustomerCache(prev => new Map(prev).set(id, customer));
      }
      return customer;
    } catch (err) {

      return null;
    }
  }, [customerCache]);

  const ensureProduct = useCallback(async (id: string): Promise<Product | null> => {
    if (!id) return null;
    const cached = productCache.get(id);
    if (cached) return cached;
    try {
      const product = await supabaseService.getProductById(id);
      if (product) {
        setProductCache(prev => new Map(prev).set(id, product));
      }
      return product;
    } catch (err) {

      return null;
    }
  }, [productCache]);

  useEffect(() => {
    setFilters({ returnId: debouncedReturnSearch, customerName: debouncedReturnSearch });
  }, [debouncedReturnSearch, setFilters]);

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 1 — STATE MỚI CHO GIAO DIỆN POS ĐỔI-TRẢ
  // ═════════════════════════════════════════════════════════════════════
  const [exchangeItems, setExchangeItems] = useState<ExchangeItem[]>([]);
  const [exchangeSearch, setExchangeSearch] = useState('');
  const debouncedExchangeSearch = useDebounce(exchangeSearch, 400);
  const [exchangeSearchResults, setExchangeSearchResults] = useState<Product[]>([]);
  const [isSearchingExchange, setIsSearchingExchange] = useState(false);
  const exchangeSearchRequestId = useRef(0);
  const [returnItemsSearch, setReturnItemsSearch] = useState('');
  const [actualAmount, setActualAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [isDelivery, setIsDelivery] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  // PHASE 2 — Modal chi tiết
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);
  const [originalOrderDetailOpen, setOriginalOrderDetailOpen] = useState(false);

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 2a — TÌM HÀNG ĐỔI SERVER-SIDE (thay thế .filter trên prop products rỗng)
  // ═════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const term = debouncedExchangeSearch.trim();
    if (!term) {
      setExchangeSearchResults([]);
      return;
    }

    const requestId = ++exchangeSearchRequestId.current;
    setIsSearchingExchange(true);

    supabaseService.searchProducts(term, 30)
      .then((results) => {
        if (requestId === exchangeSearchRequestId.current) {
          setExchangeSearchResults(results);
          setIsSearchingExchange(false);
        }
      })
      .catch((err) => {

        if (requestId === exchangeSearchRequestId.current) {
          setExchangeSearchResults([]);
          setIsSearchingExchange(false);
        }
      });
  }, [debouncedExchangeSearch]);

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 1 — PREFETCH KHÁCH HÀNG / SẢN PHẨM CẦN THIẾT
  // ═════════════════════════════════════════════════════════════════════
  // Prefetch customers for the current return-order page (used by detail / print)
  useEffect(() => {
    const ids = Array.from(new Set(returnOrders.map(r => r.customerId).filter((id): id is string => !!id)));
    const missingIds = ids.filter(id => !customerCache.has(id));
    if (missingIds.length === 0) return;
    Promise.all(missingIds.map(id => supabaseService.getCustomerById(id)))
      .then(customers => {
        setCustomerCache(prev => {
          const next = new Map(prev);
          customers.forEach(c => { if (c) next.set(c.id, c); });
          return next;
        });
      })
      .catch(() => {});
  }, [returnOrders, customerCache]);

  // Prefetch products appearing in detail / create / exchange views
  const productIdsToPrefetch = useMemo(() => {
    const ids = new Set<string>();
    selectedReturnOrder?.items?.forEach(it => { if (it.productId) ids.add(it.productId); });
    formState?.originalOrder?.items?.forEach((it: any) => { if (it.productId) ids.add(it.productId); });
    exchangeItems.forEach(it => ids.add(it.productId));
    return Array.from(ids);
  }, [selectedReturnOrder, formState?.originalOrder?.items, exchangeItems]);

  useEffect(() => {
    const missingIds = productIdsToPrefetch.filter(id => !productCache.has(id));
    if (missingIds.length === 0) return;
    Promise.all(missingIds.map(id => supabaseService.getProductById(id)))
      .then(products => {
        setProductCache(prev => {
          const next = new Map(prev);
          products.forEach(p => { if (p) next.set(p.id, p); });
          return next;
        });
      })
      .catch(() => {});
  }, [productIdsToPrefetch, productCache]);

  const getReturnItemLotDetails = (item: any, originalOrderId?: string) => {
    const prod = getProductFromCache(item.productId);
    // 1. Try to find lot in active product lots
    if (item.lotId) {
      const lot = prod?.lots?.find(l => l.id === item.lotId);
      if (lot) {
        return {
          code: lot.code || lot.lotNumber || '',
          expiryDate: lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString('vi-VN') : ''
        };
      }
    }
    // 2. Fallback to original order item
    if (originalOrderId) {
      const order = orders.find(o => o.id === originalOrderId);
      const orderItem = order?.items?.find(oi => oi.productId === item.productId);
      if (orderItem?.lotCode) {
        const lotByCode = prod?.lots?.find(l => l.code === orderItem.lotCode);
        return {
          code: orderItem.lotCode,
          expiryDate: lotByCode?.expiryDate ? new Date(lotByCode.expiryDate).toLocaleDateString('vi-VN') : ''
        };
      }
    }
    return null;
  };

  // Live clock cho header phụ (cập nhật mỗi phút)
  useEffect(() => {
    if (view !== 'create') return;
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, [view]);

  // ═════════════════════════════════════════════════════════════════════
  // EXCHANGE ITEMS HELPERS (Phase 2a: tìm server-side, load lô đầy đủ)
  // ═════════════════════════════════════════════════════════════════════
  const addExchangeItem = async (p: Product) => {
    // PHASE 2a: searchProducts không trả về lô, nên fetch product đầy đủ để chọn lô đúng
    const product = (await ensureProduct(p.id)) || p;

    setExchangeItems(prev => {
      const existing = prev.find(it => it.productId === product.id);
      if (existing) {
        const nextQty = Math.min(existing.availableStock, existing.quantity + 1);
        return prev.map(it => it.productId === product.id
          ? { ...it, quantity: nextQty, subtotal: nextQty * it.unitPrice }
          : it
        );
      }
      
      let lotId = undefined;
      let lotCode = undefined;
      let availableStock = Number(product.quantity || 0);

      if (product.hasBatches && product.lots && product.lots.length > 0) {
        const firstLot = product.lots.find(l => Number(l.quantity || 0) > 0);
        if (firstLot) {
          lotId = firstLot.id;
          lotCode = firstLot.code;
          availableStock = Number(firstLot.quantity || 0);
        } else {
          lotId = product.lots[0].id;
          lotCode = product.lots[0].code;
          availableStock = 0;
        }
      }

      const item: ExchangeItem = {
        productId: product.id,
        productName: product.name,
        code: product.code || '',
        unitName: product.unit || '',
        unitPrice: product.price || 0,
        quantity: availableStock > 0 ? 1 : 0,
        subtotal: availableStock > 0 ? (product.price || 0) : 0,
        availableStock,
        lotId,
        lotCode,
      };
      return [...prev, item];
    });
    setExchangeSearch('');
  };

  const updateExchangeItemLot = (productId: string, lotId: string) => {
    setExchangeItems(prev => prev.map(it => {
      if (it.productId !== productId) return it;
      const prod = getProductFromCache(productId);
      const lot = prod?.lots?.find(l => l.id === lotId);
      if (!lot) return it;
      const nextQty = Math.max(0, Math.min(Number(lot.quantity || 0), it.quantity));
      return {
        ...it,
        lotId: lot.id,
        lotCode: lot.code,
        availableStock: Number(lot.quantity || 0),
        quantity: nextQty,
        subtotal: nextQty * it.unitPrice
      };
    }));
  };

  const updateExchangeQty = (productId: string, qty: number) => {
    setExchangeItems(prev => prev.map(it => {
      if (it.productId !== productId) return it;
      const safe = Math.max(0, Math.min(it.availableStock, qty));
      return { ...it, quantity: safe, subtotal: safe * it.unitPrice };
    }).filter(it => it.quantity > 0));
  };

  const removeExchangeItem = (productId: string) => {
    setExchangeItems(prev => prev.filter(it => it.productId !== productId));
  };

  // ═════════════════════════════════════════════════════════════════════
  // SEARCH FILTERS
  // ═════════════════════════════════════════════════════════════════════
  const filteredReturnItems = useMemo(() => {
    const term = returnItemsSearch.trim().toLowerCase();
    if (!term) return formItems;
    return formItems.filter(it =>
      it.productName.toLowerCase().includes(term) ||
      it.productId.toLowerCase().includes(term)
    );
  }, [formItems, returnItemsSearch]);

  const filteredExchangeProducts = useMemo(() => {
    const term = exchangeSearch.trim().toLowerCase();
    if (!term) return [] as Product[];
    // PHASE 2a: dùng kết quả server-side thay vì lọc trên prop products rỗng
    return exchangeSearchResults.slice(0, 8);
  }, [exchangeSearchResults, exchangeSearch]);

  // Reset toàn bộ state mới khi rời view 'create'
  const resetCreateViewState = () => {
    setExchangeItems([]);
    setExchangeSearch('');
    setReturnItemsSearch('');
    setActualAmount(0);
    setPaymentMethod('cash');
    setIsDelivery(false);
  };

  useEffect(() => {
    fetchReturnOrdersPaginated();
  }, [fetchReturnOrdersPaginated]);

  // Tải stats tổng hợp
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await supabaseService.getReturnOrders();
        if (!mounted) return;
        const completed = all.filter((r: ReturnOrder) => r.status === 'completed').length;
        const cancelled = all.filter((r: ReturnOrder) => r.status === 'cancelled').length;
        const totalRefund = all
          .filter((r: ReturnOrder) => r.status !== 'cancelled')
          .reduce((sum, r) => sum + (r.totalRefundAmount || 0), 0);
        setStats({ total: all.length, completed, cancelled, totalRefund });
      } catch (e) {
        // silent
      }
    })();
    return () => { mounted = false; };
  }, [returnOrders.length]);

  // Auto-init khi vào từ Orders với ?orderId=
  useEffect(() => {
    if (!orderIdParam || initRef.current || orders.length === 0) return;
    const order = orders.find(o => o.id === orderIdParam);
    if (!order) return;
    let mounted = true;
    ensureCustomer(order.customerId || '').then(customer => {
      if (!mounted) return;
      initializeFromOrder(order, customer);
      setView('create');
      initRef.current = true;
      navigate('/return-orders', { replace: true });
    });
    return () => { mounted = false; };
  }, [orderIdParam, orders, navigate, initializeFromOrder, ensureCustomer]);

  const filteredOrders = useMemo(() => {
    if (!orderSearch.trim()) return orders.slice(0, 30);
    const term = orderSearch.toLowerCase().trim();
    return orders.filter(o => {
      const cust = getCustomerFromCache(o.customerId);
      return (
        o.id.toLowerCase().includes(term) ||
        (o.customerName || '').toLowerCase().includes(term) ||
        (cust?.phone || '').includes(term)
      );
    }).slice(0, 30);
  }, [orderSearch, orders, getCustomerFromCache]);

  // Prefetch customers for the order-search dropdown so phone search works
  useEffect(() => {
    const ids = Array.from(new Set(filteredOrders.map(o => o.customerId).filter((id): id is string => !!id)));
    const missingIds = ids.filter(id => !customerCache.has(id));
    if (missingIds.length === 0) return;
    Promise.all(missingIds.map(id => supabaseService.getCustomerById(id)))
      .then(customers => {
        setCustomerCache(prev => {
          const next = new Map(prev);
          customers.forEach(c => { if (c) next.set(c.id, c); });
          return next;
        });
      })
      .catch(() => {});
  }, [filteredOrders, customerCache]);

  const handleCreateNew = () => {
    setFormState({
      originalOrder: null, customer: null, items: [],
      totalRefundAmount: 0, debtReduction: 0, cashRefund: 0,
      reason: '', note: '',
    });
    setOrderSearch('');
    setView('create');
  };

  const handleViewDetail = (r: ReturnOrder) => {
    if (r.id) {
      fetchReturnOrderDetail(r.id);
      setView('detail');
    }
  };

  const handleSelectOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const customer = await ensureCustomer(order.customerId || '');
    initializeFromOrder(order, customer);
    setOrderSearch('');
  };

  const handleGoBack = () => {
    if (view === 'detail') clearSelectedReturnOrder();
    if (view === 'create') resetCreateViewState();
    setView('list');
  };

  const handleSubmitReturn = async () => {
    // PHASE 4 + 5: rẽ nhánh + validate số tiền thực tế khi có bù trừ
    if (exchangeItems.length > 0) {
      const exchangeTotal = exchangeItems.reduce((s, it) => s + it.subtotal, 0);
      const netRefund = feeResult ? feeResult.netRefundAmount : (formState?.totalRefundAmount || 0);
      const cashDiff = netRefund - exchangeTotal;
      const absDiff = Math.abs(cashDiff);

      if (absDiff > 0 && actualAmount < absDiff) {
        alert(`Tiền thực tế chưa hợp lệ. Cần nhập ít nhất ${formatCurrency(absDiff)}.`);
        return;
      }

      const result = await submitExchange({
        exchangeItems,
        exchangeTotal,
        paymentMethod,
        isDelivery,
        actualAmount,
      });
      if (result) {
        alert(
          result.exchangeOrderId
            ? `Đã tạo phiếu trả hàng ${result.returnOrder?.id || ''} và đơn đổi ${result.exchangeOrderId}.`
            : `Đã tạo phiếu trả hàng ${result.returnOrder?.id || ''}.`
        );
        setView('list');
        resetCreateViewState();
        fetchReturnOrdersPaginated();
      }
    } else {
      const result = await submitReturn();
      if (result) {
        alert(`Đã tạo phiếu trả hàng ${result.id}.`);
        setView('list');
        fetchReturnOrdersPaginated();
      }
    }
  };

  const handleConfirmCancelReturn = async () => {
    if (!confirmCancelId) return;
    const success = await cancelReturnOrder(confirmCancelId);
    setConfirmCancelId(null);
    if (success) setView('list');
  };

  const handlePrintReturn = async (r: ReturnOrder) => {
    const customer = await ensureCustomer(r.customerId || '');
    printReturnOrder(r, appSettings, customer ?? undefined);
  };

  // LOGIC XỬ LÝ CHECKBOX HÀNG LOẠT
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = returnOrders.map(r => r.id).filter((id): id is string => !!id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkCancel = async () => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy hàng loạt ${selectedIds.length} phiếu trả hàng đã chọn?`)) {
      for (const id of selectedIds) {
        await cancelReturnOrder(id);
      }
      setSelectedIds([]);
      fetchReturnOrdersPaginated();
    }
  };

  // V2 DataGrid helpers
  const [v2SortConfig, setV2SortConfig] = useState<{ key: string; direction: SortDirection } | null>(null);

  const handleDataGridSort = (key: string, direction: SortDirection) => {
    setV2SortConfig(direction === 'none' ? null : { key, direction });
  };

  const handleV2Search = (value: string) => {
    setFilters({ returnId: value, customerName: value });
  };

  const returnOrderColumns: DataGridColumn<ReturnOrder>[] = [
    {
      key: 'stt',
      label: 'STT',
      align: 'center',
      width: '48px',
      render: (r) => {
        const index = returnOrders.findIndex((item) => item.id === r.id);
        const stt = index >= 0 ? index + 1 + (currentPage - 1) * pageSize : '-';
        return <span className="return-orders-v2-stt">{stt}</span>;
      },
    },
    {
      key: 'id',
      label: 'Mã phiếu',
      sortable: true,
      render: (r) => (
        <button
          className="return-orders-v2-code"
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetail(r);
          }}
        >
          <span className="return-orders-v2-code-icon">
            <RotateCcw className="w-4 h-4" />
          </span>
          {r.id || ''}
        </button>
      ),
    },
    {
      key: 'customerName',
      label: 'Khách hàng',
      sortable: true,
      render: (r) => (
        <div className="return-orders-v2-customer">
          <span className="return-orders-v2-customer-name">{r.customerName || 'Khách lẻ'}</span>
          {(r as any).customerPhone && (
            <span className="return-orders-v2-customer-phone">{(r as any).customerPhone}</span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      sortable: true,
      render: (r) => (
        <div className="return-orders-v2-date">
          <span>{formatDate(r.createdAt || r.date)}</span>
          <span className="return-orders-v2-time">{formatTime(r.createdAt || r.date)}</span>
        </div>
      ),
    },
    {
      key: 'totalRefundAmount',
      label: 'Tiền hoàn',
      sortable: true,
      align: 'right',
      render: (r) => (
        <span className={`return-orders-v2-refund ${(r.totalRefundAmount || 0) > 0 ? '' : 'zero'}`}>
          {formatCurrency(r.totalRefundAmount || 0)}
        </span>
      ),
    },
    {
      key: 'cashRefund',
      label: 'Tiền mặt / Giảm nợ',
      align: 'right',
      render: (r) => (
        <div className="flex flex-col items-end gap-0.5">
          <span className="return-orders-v2-cash">TM: {formatCurrency(r.cashRefund || 0)}</span>
          {(r.debtReduction || 0) > 0 && (
            <span className="return-orders-v2-debt-reduction">Nợ: {formatCurrency(r.debtReduction || 0)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      align: 'center',
      render: (r) => getV2StatusBadge(r.status || ''),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'right',
      render: (r) => (
        <div className="return-orders-v2-actions">
          <ActionButton
            variant="ghost"
            size="sm"
            icon={<FileText className="w-4 h-4" />}
            onClick={(e) => {
              e?.stopPropagation();
              handleViewDetail(r);
            }}
            aria-label="Xem chi tiết"
          />
          <ActionButton
            variant="ghost"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={(e) => {
              e?.stopPropagation();
              handlePrintReturn(r);
            }}
            aria-label="In phiếu trả"
          />
          {permissions.canDeleteOrder && r.status !== 'cancelled' && (
            <ActionButton
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={(e) => {
                e?.stopPropagation();
                setConfirmCancelId(r.id || null);
              }}
              aria-label="Hủy phiếu"
            />
          )}
        </div>
      ),
    },
  ];

  // ========================
  // CONFIRM CANCEL DIALOG
  // ========================
  const renderConfirmDialog = () => {
    if (!confirmCancelId) return null;
    return createPortal(
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Xác nhận hủy phiếu trả</h3>
                <p className="text-xs text-gray-500">Hành động không thể hoàn tác</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-2">Bạn có chắc chắn muốn hủy phiếu trả hàng này?</p>
            <p className="text-xs text-gray-500 mb-6">Hóa đơn gốc sẽ được khôi phục lại số lượng tồn kho.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmCancelId(null)}>Không, quay lại</Button>
              <Button variant="danger" className="flex-1" disabled={detailLoading} onClick={handleConfirmCancelReturn}>
                {detailLoading ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </Button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 2 — MODAL CHI TIẾT KHÁCH HÀNG
  // ═════════════════════════════════════════════════════════════════════
  const renderCustomerDetailModal = () => {
    if (!customerDetailOpen) return null;
    const c = formState?.customer;
    if (!c) return null;

    // 5 đơn gần nhất của KH này từ orders prop
    const customerOrders = orders
      .filter(o => o.customerId === c.id)
      .slice(0, 5);

    const initial = (c.name || '?').trim().charAt(0).toUpperCase();

    return createPortal(
      <div
        className="vsp-modal-sync fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        onClick={() => setCustomerDetailOpen(false)}
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-gradient-to-br from-blue-50 to-white rounded-t-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold shadow-sm shrink-0">
                {initial}
              </div>
              <div>
                <h3 className="vsp-font-bold vsp-text-xl text-slate-900">{c.name}</h3>
                <div className="flex items-center gap-3 mt-1 vsp-text-xs vsp-font-regular text-slate-500">
                  {c.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                  {c.rank && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full vsp-text-xxxs vsp-font-bold text-white"
                      style={{ backgroundColor: (c as any).rankColor || '#6366f1' }}
                    >
                      <Award className="w-3 h-3" /> {c.rank}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setCustomerDetailOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4">
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="vsp-text-xxxs uppercase vsp-font-bold text-slate-500 tracking-wider mb-1">Tổng chi tiêu</p>
                <p className="vsp-text-sm vsp-font-bold text-slate-900 tabular-nums">
                  {formatCurrency((c as any).totalSpent || 0)}
                </p>
              </div>
              <div className={`rounded-lg p-3 text-center ${(c.debt || 0) > 0 ? 'bg-rose-50' : 'bg-slate-50'}`}>
                <p className="vsp-text-xxxs uppercase vsp-font-bold text-slate-500 tracking-wider mb-1">Công nợ</p>
                <p className={`vsp-text-sm vsp-font-bold tabular-nums ${(c.debt || 0) > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {formatCurrency(c.debt || 0)}
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="vsp-text-xxxs uppercase vsp-font-bold text-slate-500 tracking-wider mb-1">Điểm tích lũy</p>
                <p className="vsp-text-sm vsp-font-bold text-amber-700 tabular-nums">
                  {((c as any).loyaltyPoints || 0).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            {/* Liên hệ */}
            <div className="border border-slate-200 rounded-lg p-4 space-y-2">
              <h4 className="vsp-text-xxxs uppercase vsp-font-bold text-slate-500 tracking-wider mb-1">Liên hệ</h4>
              {c.phone && (
                <div className="flex items-center gap-2 vsp-text-sm vsp-font-regular">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-700">{c.phone}</span>
                </div>
              )}
              {c.email && (
                <div className="flex items-center gap-2 vsp-text-sm vsp-font-regular">
                  <span className="w-3.5 h-3.5 text-slate-400 inline-flex items-center justify-center">@</span>
                  <span className="text-slate-700">{c.email}</span>
                </div>
              )}
              {c.address && (
                <div className="flex items-start gap-2 vsp-text-sm vsp-font-regular">
                  <span className="text-slate-400 mt-0.5">📍</span>
                  <span className="text-slate-700">{c.address}</span>
                </div>
              )}
              {!c.phone && !c.email && !c.address && (
                <p className="vsp-text-xs text-slate-400 vsp-font-italic">Chưa có thông tin liên hệ</p>
              )}
            </div>

            {/* Lịch sử đơn gần đây */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                <h4 className="vsp-text-xxxs uppercase vsp-font-bold text-slate-500 tracking-wider">Đơn hàng gần đây ({customerOrders.length})</h4>
              </div>
              {customerOrders.length === 0 ? (
                <p className="py-6 text-center vsp-text-xs vsp-font-regular text-slate-400">Chưa có đơn hàng nào</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {customerOrders.map(o => (
                    <div key={o.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div>
                        <p className="vsp-text-sm vsp-font-semibold text-slate-800">{o.id}</p>
                        <p className="vsp-text-xxs vsp-font-regular text-slate-500">{formatDateShort(o.date)}</p>
                      </div>
                      <span className="vsp-text-sm vsp-font-bold text-slate-900 tabular-nums">
                        {formatCurrency(o.totalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-2">
            <button
              onClick={() => {
                setCustomerDetailOpen(false);
                navigate(`/customers`);
              }}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              Mở trang Khách hàng
            </button>
            <button
              onClick={() => setCustomerDetailOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-800 rounded-lg"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 2 — MODAL CHI TIẾT ĐƠN HÀNG GỐC
  // ═════════════════════════════════════════════════════════════════════
  const renderOriginalOrderDetailModal = () => {
    if (!originalOrderDetailOpen) return null;
    const o = formState?.originalOrder;
    if (!o) return null;

    const remainingDebt = Math.max(0, Number(o.debtRecorded || 0));
    const itemsTotal = (o.items || []).reduce((s: number, it: any) => s + (it.price * it.quantity), 0);

    return createPortal(
      <div
        className="vsp-modal-sync fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        onClick={() => setOriginalOrderDetailOpen(false)}
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-gradient-to-br from-purple-50 to-white rounded-t-xl">
            <div>
              <h3 className="vsp-font-bold vsp-text-xl text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Đơn hàng gốc #{o.id}
              </h3>
              <div className="flex items-center gap-4 mt-1.5 vsp-text-xs vsp-font-regular text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {formatDateShort(o.date)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <User className="w-3 h-3" /> {o.customerName || 'Khách lẻ'}
                </span>
                {o.paymentMethod && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 vsp-font-semibold">
                    {o.paymentMethod}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setOriginalOrderDetailOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4">
            {/* Bảng items */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="vsp-text-xxxs uppercase vsp-font-semibold text-slate-500 tracking-wider">
                    <th className="py-2 px-3 text-left">Sản phẩm</th>
                    <th className="py-2 px-3 text-center">SL</th>
                    <th className="py-2 px-3 text-right">Đơn giá</th>
                    <th className="py-2 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(o.items || []).map((it: any, idx: number) => {
                    const prod = getProductFromCache(it.productId);
                    const productCode = prod?.code || it.productId;
                    const lot = prod?.lots?.find(l => l.id === it.lotId || l.code === it.lotCode);
                    const expiryDate = lot?.expiryDate ? new Date(lot.expiryDate).toLocaleDateString('vi-VN') : '';

                    return (
                      <tr key={`${it.productId}-${idx}`}>
                        <td className="py-2.5 px-3">
                          <p className="vsp-text-xs text-slate-400 vsp-font-mono">{productCode}</p>
                          <p className="vsp-text-sm vsp-font-medium text-slate-800">{it.productName}</p>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {it.unitName && <span className="vsp-text-xxs vsp-font-regular text-slate-400">{it.unitName}</span>}
                            {it.lotCode && (
                              <span className="vsp-text-xxs text-slate-500 vsp-font-medium">
                                Lô: <span className="vsp-font-semibold text-purple-700">{it.lotCode}</span>
                                {expiryDate && ` - HSD: ${expiryDate}`}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-700 tabular-nums">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">{formatCurrency(it.price)}</td>
                        <td className="py-2.5 px-3 text-right vsp-text-sm vsp-font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(it.price * it.quantity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/50">
              <h4 className="vsp-text-xxxs uppercase vsp-font-bold text-slate-500 tracking-wider mb-2">Tổng kết</h4>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600">Tổng tiền hàng</dt>
                  <dd className="vsp-font-semibold text-slate-900 tabular-nums">{formatCurrency(itemsTotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Đã thanh toán</dt>
                  <dd className="vsp-font-semibold text-emerald-600 tabular-nums">{formatCurrency(o.paidAmount || 0)}</dd>
                </div>
                {remainingDebt > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Còn nợ</dt>
                    <dd className="vsp-font-semibold text-rose-600 tabular-nums">{formatCurrency(remainingDebt)}</dd>
                  </div>
                )}
                <div className="flex justify-between pt-2 mt-1 border-t border-slate-200">
                  <dt className="vsp-font-bold text-slate-800">Tổng đơn</dt>
                  <dd className="vsp-font-bold vsp-text-base text-slate-900 tabular-nums">{formatCurrency(o.totalAmount)}</dd>
                </div>
                {(o.note) && (
                  <div className="pt-2 mt-2 border-t border-slate-200">
                    <dt className="vsp-text-xxxs uppercase vsp-font-bold text-slate-500 tracking-wider mb-1">Ghi chú</dt>
                    <dd className="vsp-text-xs vsp-font-regular text-slate-700 whitespace-pre-wrap">{o.note}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-2">
            <button
              onClick={() => {
                setOriginalOrderDetailOpen(false);
                navigate(`/orders`);
              }}
              className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg"
            >
              Mở trang Đơn hàng
            </button>
            <button
              onClick={() => setOriginalOrderDetailOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-800 rounded-lg"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // ========================
  // PAGINATION (8 giao dịch / trang)
  // ========================
  const getPageNumbers = (current: number, total: number): (number | 'ellipsis')[] => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    const left = Math.max(2, current - 1);
    const right = Math.min(total - 1, current + 1);
    if (left > 2) pages.push('ellipsis');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total - 1) pages.push('ellipsis');
    pages.push(total);
    return pages;
  };

  const PaginationControls = () => {
    const pageNumbers = getPageNumbers(currentPage, totalPages);
    const from = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, totalCount);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 mt-4 border-t border-slate-100 px-6 pb-4">
        <div className="text-sm text-slate-400">
          Hiển thị <span className="font-medium text-slate-700">{from} - {to}</span> trên tổng số <span className="font-medium text-slate-700">{totalCount}</span> phiếu trả hàng
        </div>
        <div className="flex items-center gap-4">
          <nav className="inline-flex items-center gap-1 rounded-xl bg-slate-50 p-1">
            <button
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="inline-flex items-center p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {pageNumbers.map((p, idx) => {
              if (p === 'ellipsis') {
                return (
                  <span key={`e-${idx}`} className="px-2 text-slate-400 text-sm select-none">…</span>
                );
              }
              const isActive = p === currentPage;
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  disabled={loading}
                  className={`inline-flex items-center justify-center min-w-[32px] h-[32px] text-sm font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages || loading}
              className="inline-flex items-center p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════════════
  // CREATE VIEW — POS-style Đổi/Trả hàng (mô phỏng KiotViet)
  // ═════════════════════════════════════════════════════════════════════
  const renderCreateView = () => {
    // ─── Tính toán tài chính ────────────────────────────────────────────
    const gross = formState?.totalRefundAmount || 0;
    const blocked = !!feeResult?.blocked;
    const feePercent = feeResult?.feePercent || 0;
    const feeAmount = feeResult?.feeAmount || 0;
    const netRefund = feeResult ? feeResult.netRefundAmount : gross; // R = Tổng tiền trả thực sau phí
    const exchangeTotal = exchangeItems.reduce((s, it) => s + it.subtotal, 0); // B = Tổng tiền hàng đổi
    const diff = netRefund - exchangeTotal; // >0 = cần trả khách, <0 = khách phải trả
    const absDiff = Math.abs(diff);
    const isRefundToCustomer = diff > 0;
    const isActualAmountValid = absDiff === 0 || actualAmount >= absDiff;

    const canSubmit =
      !!formState?.originalOrder &&
      formItems.some(i => i.quantity > 0) &&
      !blocked &&
      (exchangeItems.length === 0 || isActualAmountValid);

    // Gợi ý nhanh số tiền (làm tròn lên 10k/50k/100k/200k/500k của absDiff)
    const quickAmounts = (() => {
      if (absDiff <= 0) return [10_000, 20_000, 50_000, 100_000, 200_000];
      const base = Math.ceil(absDiff / 1000) * 1000;
      return [
        Math.ceil(base / 10_000) * 10_000,
        Math.ceil(base / 20_000) * 20_000,
        Math.ceil(base / 50_000) * 50_000,
        Math.ceil(base / 100_000) * 100_000,
        Math.ceil(base / 500_000) * 500_000,
      ].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 5);
    })();

    const nowLabel = `${now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    const customer = formState?.customer;

    // ─── Render ─────────────────────────────────────────────────────────
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-slate-100">
        {/* HEADER MẢNH */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center gap-3 shrink-0">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-purple-600" />
            <h1 className="text-sm font-bold text-slate-800">Tạo phiếu đổi – trả hàng</h1>
          </div>
          {blocked && (
            <div className="ml-auto inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {feeResult?.blockReason || 'Quá hạn trả hàng'}
            </div>
          )}
        </header>

        {/* BODY 2 cột: trái 1fr + phải 380px */}
        <div
          className="flex-1 min-h-0 return-orders-body-grid"
        >
          {/* ═══════════════════════════════════════════════════ */}
          {/* CỘT TRÁI — Quản lý hàng hoá (75%) */}
          {/* ═══════════════════════════════════════════════════ */}
          <div className="flex flex-col min-h-0 gap-3 p-4 overflow-hidden">

            {!formState?.originalOrder ? (
              /* CHƯA CHỌN ĐƠN GỐC — picker đầy đủ */
              <div className="bg-white border border-slate-200 rounded-lg flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <h2 className="text-sm font-bold text-slate-800">Chọn đơn hàng gốc</h2>
                </div>
                <div className="p-4 border-b border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Tìm theo mã đơn / tên khách / SĐT..."
                      className="w-full h-10 pl-9 pr-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <div className="py-16 text-center text-sm text-slate-400">Không tìm thấy đơn hàng phù hợp</div>
                  ) : filteredOrders.map(o => (
                    <button
                      key={o.id}
                      onClick={() => handleSelectOrder(o.id)}
                      className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{o.id}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{o.customerName} · {formatDateShort(o.date)}</p>
                      </div>
                      <span className="text-sm font-bold text-purple-700 tabular-nums">{formatCurrency(o.totalAmount)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* ─── KHU VỰC TRÊN: HÀNG TRẢ LẠI ───────────────────── */}
                <div className="bg-white border border-slate-200 rounded-lg flex flex-col min-h-0 overflow-hidden return-orders-panel-half">
                  <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-purple-600" />
                      <h2 className="text-sm font-bold text-slate-800">Hàng trả lại</h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 leading-none">
                        {formItems.filter(i => i.quantity > 0).length}/{formItems.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setFormState({
                        originalOrder: null, customer: null, items: [],
                        totalRefundAmount: 0, debtReduction: 0, cashRefund: 0,
                      })}
                      className="text-xs text-slate-500 hover:text-purple-600 font-medium"
                    >
                      Đổi đơn gốc
                    </button>
                  </div>
                  <div className="px-4 py-2 border-b border-slate-100 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={returnItemsSearch}
                        onChange={(e) => setReturnItemsSearch(e.target.value)}
                        placeholder="Tìm hàng trả..."
                        className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    {filteredReturnItems.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        {formItems.length === 0 ? 'Đơn hàng này không có sản phẩm' : 'Không có sản phẩm phù hợp'}
                      </div>
                    ) : (
                      <table className="w-full table-fixed text-sm return-orders-items-table">
                        <colgroup>
                          <col />
                          <col />
                          <col />
                          <col />
                          <col />
                          <col />
                          <col />
                        </colgroup>
                        <thead className="sticky top-0 bg-slate-50 z-10">
                          <tr className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                            <th className="py-2 text-center">STT</th>
                            <th className="py-2"></th>
                            <th className="py-2 px-2 text-left">Mã / Tên SP</th>
                            <th className="py-2 text-center">Đơn vị</th>
                            <th className="py-2 text-center">SL trả</th>
                            <th className="py-2 px-2 text-right">Đơn giá</th>
                            <th className="py-2 px-3 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredReturnItems.map((item, idx) => {
                            const max = item.availableQuantity;
                            const qty = item.quantity || 0;
                            const prod = getProductFromCache(item.productId);
                            const productCode = prod?.code || item.productId;
                            const lot = prod?.lots?.find(l => l.id === item.lotId || l.code === item.lotCode);
                            const expiryDate = lot?.expiryDate ? new Date(lot.expiryDate).toLocaleDateString('vi-VN') : '';

                            return (
                              <tr key={item.productId} className={qty > 0 ? 'bg-purple-50/30' : ''}>
                                <td className="py-2 text-center text-xs text-slate-400">{idx + 1}</td>
                                <td className="py-2 text-center">
                                  <button
                                    onClick={() => updateItem(item.productId, { quantity: 0, subtotal: 0 })}
                                    disabled={qty === 0}
                                    className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Bỏ chọn"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                                <td className="py-2 px-2">
                                  <p className="text-[11px] text-slate-400 font-mono">{productCode}</p>
                                  <p className="text-sm font-medium text-slate-800 truncate">{item.productName}</p>
                                  {item.lotCode && (
                                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                      Lô: <span className="font-semibold text-purple-700">{item.lotCode}</span>
                                      {expiryDate && ` - HSD: ${expiryDate}`}
                                    </p>
                                  )}
                                </td>
                                <td className="py-2 text-center text-xs text-slate-600">{item.unitName || '—'}</td>
                                <td className="py-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => updateItem(item.productId, {
                                        quantity: Math.max(0, qty - 1),
                                        subtotal: Math.max(0, qty - 1) * item.unitPrice,
                                      })}
                                      disabled={qty === 0}
                                      className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:border-purple-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <input
                                      type="number"
                                      value={qty}
                                      min={0}
                                      max={max}
                                      onChange={(e) => {
                                        const v = Math.max(0, Math.min(max, parseInt(e.target.value || '0')));
                                        updateItem(item.productId, { quantity: v, subtotal: v * item.unitPrice });
                                      }}
                                      className="w-10 h-6 text-center text-xs font-semibold border border-slate-200 rounded focus:outline-none focus:border-purple-500 tabular-nums"
                                    />
                                    <button
                                      onClick={() => {
                                        const next = Math.min(max, qty + 1);
                                        updateItem(item.productId, { quantity: next, subtotal: next * item.unitPrice });
                                      }}
                                      disabled={qty >= max}
                                      className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:border-purple-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-center text-slate-400 mt-0.5">Còn {max}</p>
                                </td>
                                <td className="py-2 px-2 text-right text-xs text-slate-600 tabular-nums">
                                  {formatCurrency(item.unitPrice)}
                                </td>
                                <td className="py-2 px-3 text-right text-sm font-semibold text-slate-900 tabular-nums">
                                  {formatCurrency(item.subtotal || 0)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* ─── KHU VỰC DƯỚI: HÀNG ĐỔI MỚI ──────────────────── */}
                <div className="bg-white border border-slate-200 rounded-lg flex flex-col min-h-0 overflow-hidden return-orders-panel-half">
                  <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <h2 className="text-sm font-bold text-slate-800">Hàng đổi mới</h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 leading-none">
                        {exchangeItems.length}
                      </span>
                    </div>
                    {exchangeItems.length > 0 && (
                      <button
                        onClick={() => setExchangeItems([])}
                        className="text-xs text-slate-500 hover:text-rose-600 font-medium"
                      >
                        Xoá tất cả
                      </button>
                    )}
                  </div>
                  <div className="px-4 py-2 border-b border-slate-100 shrink-0 relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={exchangeSearch}
                        onChange={(e) => setExchangeSearch(e.target.value)}
                        placeholder="Tìm hàng đổi (tên, mã, barcode)..."
                        className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    {/* Dropdown kết quả */}
                    {(isSearchingExchange || filteredExchangeProducts.length > 0) && (
                      <div className="absolute left-4 right-4 top-[calc(100%-4px)] z-20 bg-white border border-slate-200 rounded-lg shadow-xl max-h-72 overflow-y-auto">
                        {isSearchingExchange ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                            Đang tìm...
                          </div>
                        ) : (
                          filteredExchangeProducts.map(p => {
                            const outOfStock = Number(p.quantity || 0) <= 0;
                            return (
                              <button
                                key={p.id}
                                onClick={() => {
                                  if (!outOfStock) {
                                    addExchangeItem(p).catch(() => {});
                                  }
                                }}
                                disabled={outOfStock}
                                className={`w-full text-left px-3 py-2 flex items-center gap-3 border-b border-slate-100 last:border-0 ${
                                  outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-50'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-400 font-mono">{p.code}</p>
                                  <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-bold text-emerald-700 tabular-nums">{formatCurrency(p.price ?? 0)}</p>
                                  <p className={`text-[10px] ${outOfStock ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                                    {outOfStock ? 'HẾT HÀNG' : `Tồn: ${p.quantity} ${p.unit}`}
                                  </p>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    {exchangeItems.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        Tìm và chọn sản phẩm khách muốn đổi/mua thêm
                      </div>
                    ) : (
                      <table className="w-full table-fixed text-sm return-orders-items-table">
                        <colgroup>
                          <col />
                          <col />
                          <col />
                          <col />
                          <col />
                          <col />
                          <col />
                        </colgroup>
                        <thead className="sticky top-0 bg-slate-50 z-10">
                          <tr className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                            <th className="py-2 text-center">STT</th>
                            <th className="py-2"></th>
                            <th className="py-2 px-2 text-left">Mã / Tên SP</th>
                            <th className="py-2 text-center">Đơn vị</th>
                            <th className="py-2 text-center">SL</th>
                            <th className="py-2 px-2 text-right">Đơn giá</th>
                            <th className="py-2 px-3 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {exchangeItems.map((it, idx) => (
                            <tr key={it.productId} className="bg-emerald-50/30">
                              <td className="py-2 text-center text-xs text-slate-400">{idx + 1}</td>
                              <td className="py-2 text-center">
                                <button
                                  onClick={() => removeExchangeItem(it.productId)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  title="Xoá"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                              <td className="py-2 px-2">
                                <p className="text-[11px] text-slate-400 font-mono">{it.code}</p>
                                <p className="text-sm font-medium text-slate-800 truncate">{it.productName}</p>
                                {(() => {
                                  const prod = getProductFromCache(it.productId);
                                  if (!prod || !prod.hasBatches || !prod.lots || prod.lots.length === 0) return null;
                                  const availableLots = prod.lots.filter(l => l.quantity > 0) || [];
                                  return (
                                    <div className="mt-1 flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-500 font-medium shrink-0">Lô xuất:</span>
                                      {availableLots.length > 0 ? (
                                        <select
                                          value={it.lotId || ''}
                                          onChange={(e) => updateExchangeItemLot(it.productId, e.target.value)}
                                          className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500 max-w-[180px] truncate"
                                        >
                                          <option value="">-- Chọn lô --</option>
                                          {availableLots.map((lot) => (
                                            <option key={lot.id} value={lot.id}>
                                              {lot.code} ({lot.quantity} {prod.unit}) - HSD: {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString('vi-VN') : 'N/A'}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                                          Hết hàng trong lô
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="py-2 text-center text-xs text-slate-600">{it.unitName}</td>
                              <td className="py-2">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => updateExchangeQty(it.productId, it.quantity - 1)}
                                    className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:border-emerald-400 hover:text-emerald-600"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="number"
                                    value={it.quantity}
                                    min={1}
                                    max={it.availableStock}
                                    onChange={(e) => updateExchangeQty(it.productId, parseInt(e.target.value || '0'))}
                                    className="w-10 h-6 text-center text-xs font-semibold border border-slate-200 rounded focus:outline-none focus:border-emerald-500 tabular-nums"
                                  />
                                  <button
                                    onClick={() => updateExchangeQty(it.productId, it.quantity + 1)}
                                    disabled={it.quantity >= it.availableStock}
                                    className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="text-[10px] text-center text-slate-400 mt-0.5">Tồn {it.availableStock}</p>
                              </td>
                              <td className="py-2 px-2 text-right text-xs text-slate-600 tabular-nums">
                                {formatCurrency(it.unitPrice)}
                              </td>
                              <td className="py-2 px-3 text-right text-sm font-semibold text-emerald-700 tabular-nums">
                                {formatCurrency(it.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* CỘT PHẢI — Sidebar thanh toán (380px) */}
          {/* ═══════════════════════════════════════════════════ */}
          <aside className="bg-white border-l border-slate-200 flex flex-col overflow-hidden return-orders-sidebar">

            {/* Header phụ: cửa hàng + giờ */}
            <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-2 min-w-0">
                <Store className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {appSettings.storeName || 'Cửa hàng'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 shrink-0">
                <Clock className="w-3 h-3" />
                <span className="tabular-nums">{nowLabel}</span>
              </div>
            </div>

            {/* Thông tin khách hàng */}
            <div className="px-4 py-3 border-b border-slate-200 shrink-0">
              {customer ? (
                <>
                  <button
                    onClick={() => setCustomerDetailOpen(true)}
                    className="text-sm font-bold text-blue-600 hover:underline text-left"
                  >
                    {customer.name}
                  </button>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    {customer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {customer.phone}
                      </span>
                    )}
                    {((customer as any).loyaltyPoints || 0) > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold">
                        <Award className="w-3 h-3" /> {((customer as any).loyaltyPoints || 0).toLocaleString('vi-VN')} điểm
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 italic">Khách lẻ</p>
              )}
            </div>

            {/* Body có thể scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto">

              {/* SECTION 1 — TRẢ HÀNG */}
              <section className="px-4 py-3 border-b border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Trả hàng</h3>
                  {formState?.originalOrder && (
                    <button
                      onClick={() => setOriginalOrderDetailOpen(true)}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      {formState.originalOrder.id}
                    </button>
                  )}
                </div>
                <dl className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Tổng tiền hàng trả</dt>
                    <dd className="font-semibold text-slate-900 tabular-nums">{formatCurrency(gross)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Giảm giá</dt>
                    <dd className="text-slate-500 tabular-nums">{formatCurrency(0)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">
                      Phí trả hàng{feePercent > 0 ? ` (${feePercent}%)` : ''}
                    </dt>
                    <dd className={`tabular-nums ${feeAmount > 0 ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
                      {feeAmount > 0 ? `-${formatCurrency(feeAmount)}` : formatCurrency(0)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Hoàn trả khác</dt>
                    <dd className="text-slate-500 tabular-nums">{formatCurrency(0)}</dd>
                  </div>
                  <div className="flex justify-between pt-1.5 mt-1.5 border-t border-slate-100">
                    <dt className="font-bold text-slate-800">Tổng tiền trả</dt>
                    <dd className="font-bold text-base text-slate-900 tabular-nums">{formatCurrency(netRefund)}</dd>
                  </div>
                </dl>
              </section>

              {/* SECTION 2 — MUA HÀNG ĐỔI */}
              <section className="px-4 py-3 border-b border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Mua hàng đổi</h3>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDelivery}
                      onChange={(e) => setIsDelivery(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <Truck className="w-3 h-3" /> Giao hàng
                  </label>
                </div>
                <dl className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Tổng tiền hàng mua mới</dt>
                    <dd className="font-semibold text-slate-900 tabular-nums">{formatCurrency(exchangeTotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Giảm giá đơn mới</dt>
                    <dd className="text-slate-500 tabular-nums">{formatCurrency(0)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Thu khác</dt>
                    <dd className="text-slate-500 tabular-nums">{formatCurrency(0)}</dd>
                  </div>
                  <div className="flex justify-between pt-1.5 mt-1.5 border-t border-slate-100">
                    <dt className="font-bold text-slate-800">Tổng tiền mua</dt>
                    <dd className="font-bold text-base text-slate-900 tabular-nums">{formatCurrency(exchangeTotal)}</dd>
                  </div>
                </dl>
              </section>

              {/* SECTION 3 — BÙ TRỪ */}
              <section className="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${isRefundToCustomer ? 'text-blue-700' : 'text-rose-600'}`}>
                    {isRefundToCustomer ? 'Cần trả khách' : 'Khách phải trả'}
                  </span>
                  <span className={`text-lg font-extrabold tabular-nums ${isRefundToCustomer ? 'text-blue-700' : 'text-rose-600'}`}>
                    {formatCurrency(absDiff)}
                  </span>
                </div>

                {/* Input tiền thực tế */}
                <div className="mt-2">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                    Tiền thực tế {isRefundToCustomer ? 'trả khách' : 'thu khách'}
                  </label>
                  <input
                    type="number"
                    value={actualAmount || ''}
                    onChange={(e) => setActualAmount(parseInt(e.target.value || '0'))}
                    placeholder="0"
                    className="w-full h-9 px-3 text-right text-sm font-bold border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 tabular-nums bg-white"
                  />
                </div>

                {/* Quick amounts */}
                <div className="flex gap-1 mt-2 flex-wrap">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setActualAmount(amt)}
                      className="flex-1 min-w-0 px-1 py-1 text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:border-purple-400 hover:text-purple-700 tabular-nums"
                    >
                      {amt >= 1000000 ? `${(amt / 1000000).toFixed(1)}tr` : `${amt / 1000}k`}
                    </button>
                  ))}
                </div>

                {/* Phương thức */}
                <div className="flex gap-1.5 mt-2.5">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                      paymentMethod === 'cash'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-purple-400'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" /> Tiền mặt
                  </button>
                  <button
                    onClick={() => setPaymentMethod('transfer')}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                      paymentMethod === 'transfer'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-purple-400'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Chuyển khoản
                  </button>
                </div>
              </section>

              {/* Reason chips + note (compact) */}
              {formState?.originalOrder && (
                <section className="px-4 py-3 border-b border-slate-200">
                  <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Lý do trả</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {REASON_CHIPS.map(chip => (
                      <button
                        key={chip}
                        onClick={() => setReason(chip)}
                        className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                          formState.reason === chip
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-purple-400'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={formState.note || ''}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú thêm..."
                    className="w-full text-xs p-2 border border-slate-200 rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </section>
              )}
            </div>

            {/* Nút TRẢ HÀNG cố định dưới */}
            <div className="p-3 border-t border-slate-200 shrink-0 bg-white">
              <button
                onClick={handleSubmitReturn}
                disabled={loading || !canSubmit || !permissions.canCreateOrder}
                className="w-full h-12 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-lg shadow-sm transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>
                ) : (
                  <><CheckCircle className="w-5 h-5" /> TRẢ HÀNG</>
                )}
              </button>
              {!canSubmit && formState?.originalOrder && !blocked && (
                <p className="text-[10px] text-amber-600 text-center mt-1.5">
                  {formItems.every(i => !i.quantity)
                    ? 'Chọn ít nhất 1 sản phẩm để trả'
                    : (!isActualAmountValid && exchangeItems.length > 0)
                      ? `Tiền thực tế phải ≥ ${formatCurrency(absDiff)}`
                      : 'Kiểm tra lại thông tin thanh toán'}
                </p>
              )}
              {exchangeItems.length > 0 && (
                <p className="text-[10px] text-emerald-600 text-center mt-1.5">
                  ⓘ Đổi-trả atomic: phiếu trả + đơn đổi sẽ được tạo trong cùng 1 giao dịch
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    );
  };

  // ========================
  // DETAIL MODAL
  // ========================
  const renderDetailModal = () => {
    if (!selectedReturnOrder && !detailLoading && !detailError) return null;
    return createPortal(
      <div className="vsp-modal-sync fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1658px] h-[728px] max-h-[95vh] flex flex-col animate-scale-in">
          {detailLoading && !selectedReturnOrder ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : detailError && !selectedReturnOrder ? (
            <div className="p-6">
              <p className="text-red-500">Lỗi: {detailError}</p>
              <Button variant="outline" className="mt-4" onClick={handleGoBack}>Đóng</Button>
            </div>
          ) : selectedReturnOrder && (() => {
            const ret = selectedReturnOrder;
            const isCancelled = ret.status === 'cancelled';
            const customer = getCustomerFromCache(ret.customerId);
            return (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-gray-50 rounded-t-xl">
                  <div>
                    <h3 className="vsp-font-bold vsp-text-xl text-gray-800 flex items-center gap-2">
                      <RotateCcw className="w-6 h-6 text-purple-600" /> Phiếu trả #{ret.id}
                    </h3>
                    <p className="vsp-text-sm vsp-font-regular text-gray-500 mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {formatDate(ret.createdAt || ret.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(ret.status || '')}
                    <button onClick={handleGoBack} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Body - chia 30:70 (trái: thông tin / phải: sản phẩm trả) */}
                <div className="p-6 overflow-hidden flex-1 flex flex-col md:flex-row gap-6">

                  {/* CỘT TRÁI 30% - Thông tin + tài chính */}
                  <div className="w-full md:w-[30%] md:flex-shrink-0 overflow-y-auto space-y-4 md:pr-2">
                    {/* Khách hàng */}
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="vsp-text-xxs vsp-font-bold text-purple-500 uppercase mb-1">Khách hàng</p>
                      <p className="vsp-text-lg vsp-font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-5 h-5" /> {ret.customerName || 'Khách lẻ'}
                      </p>
                      {customer?.phone && <p className="vsp-text-xs vsp-font-regular text-gray-500 mt-1">SĐT: {customer.phone}</p>}
                    </div>

                    {/* Đơn hàng gốc */}
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="vsp-text-xxs vsp-font-bold text-amber-600 uppercase mb-1">Đơn hàng gốc</p>
                      <p className="vsp-text-lg vsp-font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5" /> {ret.originalOrderId || '—'}
                      </p>
                    </div>

                    {/* Reason */}
                    {(ret.reason || ret.note) && (
                      <div className="space-y-2">
                        {ret.reason && (
                          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                            <p className="vsp-text-xxs vsp-font-semibold text-amber-700 uppercase mb-1">Lý do trả</p>
                            <p className="vsp-text-sm vsp-font-regular text-gray-800 whitespace-pre-wrap">{ret.reason}</p>
                          </div>
                        )}
                        {ret.note && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="vsp-text-xxs vsp-font-semibold text-gray-600 uppercase mb-1">Ghi chú</p>
                            <p className="vsp-text-sm vsp-font-regular text-gray-800 whitespace-pre-wrap">{ret.note}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Financials */}
                    <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl p-5">
                      <p className="vsp-text-xxs uppercase vsp-font-bold tracking-wider opacity-80 mb-2">Tổng kết tài chính</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center vsp-text-lg vsp-font-regular">
                          <span className="opacity-90">Tổng tiền hoàn</span>
                          <span className="vsp-font-bold pos-text-amount">{formatCurrency(ret.totalRefundAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between vsp-text-sm vsp-font-regular opacity-90">
                          <span>Giảm trừ công nợ</span>
                          <span className="vsp-font-medium">{formatCurrency(ret.debtReduction || 0)}</span>
                        </div>
                        <div className="flex justify-between vsp-text-sm vsp-font-regular">
                          <span className="opacity-90">Tiền mặt hoàn lại</span>
                          <span className="vsp-font-bold text-emerald-200">{formatCurrency(ret.cashRefund || 0)}</span>
                        </div>
                        {(ret.pointsDeducted || 0) > 0 && (
                          <div className="flex justify-between vsp-text-sm vsp-font-regular opacity-90">
                            <span>Điểm tích lũy trừ</span>
                            <span className="vsp-font-medium text-amber-200">-{ret.pointsDeducted?.toLocaleString('vi-VN')} điểm</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CỘT PHẢI 70% - Sản phẩm đã trả */}
                  <div className="w-full md:w-[70%] md:flex-1 flex flex-col overflow-hidden md:border-l md:border-gray-100 md:pl-6">
                    <h4 className="vsp-font-bold text-gray-700 mb-3 flex items-center gap-2 flex-shrink-0">
                      <Box className="w-5 h-5 text-purple-500" /> Sản phẩm đã trả
                    </h4>
                    {ret.items && ret.items.length > 0 ? (
                      <div className="border border-gray-200 rounded-xl overflow-y-auto flex-1">
                        <table className="w-full vsp-text-sm vsp-font-regular text-left">
                          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 sticky top-0">
                            <tr>
                              <th className="px-4 py-2.5">Sản phẩm</th>
                              <th className="px-4 py-2.5 text-center">SL</th>
                              <th className="px-4 py-2.5 text-right">Đơn giá</th>
                              <th className="px-4 py-2.5 text-right">Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {ret.items.map((item, idx) => {
                              const prod = getProductFromCache(item.productId);
                              const productCode = prod?.code || item.productId;
                              const lotDetails = getReturnItemLotDetails(item, ret.originalOrderId);

                              return (
                                <tr key={idx}>
                                  <td className="px-4 py-2.5">
                                    <p className="vsp-text-xs text-slate-400 vsp-font-mono">{productCode}</p>
                                    <p className="vsp-font-medium text-gray-800">{item.productName}</p>
                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                      {item.unitName && <span className="vsp-text-xs vsp-font-regular text-gray-500">{item.unitName}</span>}
                                      {lotDetails && (
                                        <span className="vsp-text-xs text-slate-500 vsp-font-medium">
                                          Lô: <span className="vsp-font-semibold text-purple-700">{lotDetails.code}</span>
                                          {lotDetails.expiryDate && ` - HSD: ${lotDetails.expiryDate}`}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-center">{item.quantity}</td>
                                  <td className="px-4 py-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                                  <td className="px-4 py-2.5 text-right vsp-font-semibold text-gray-900">
                                    {formatCurrency(item.unitPrice * item.quantity)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                        Không có sản phẩm trong phiếu trả này.
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex flex-wrap justify-between items-center gap-2">
                  <div className="flex gap-2">
                    {permissions.canDeleteOrder && !isCancelled && (
                      <Button variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => setConfirmCancelId(ret.id || null)}>
                        Hủy phiếu trả
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="primary" icon={<Printer className="w-4 h-4" />} onClick={() => handlePrintReturn(ret)}>
                      In phiếu trả
                    </Button>
                    <Button variant="outline" onClick={handleGoBack}>Đóng</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>,
      document.body
    );
  };

  // ========================
  // EARLY VIEWS
  // ========================
  if (view === 'create') {
    return (
      <>
        {renderCreateView()}
        {renderConfirmDialog()}
        {renderCustomerDetailModal()}
        {renderOriginalOrderDetailModal()}
      </>
    );
  }

  // ========================
  // LIST VIEW
  // ========================
  return (
    <PageLayout>
      
      {/* HEADER TÁC VỤ & THANH XÓA HÀNG LOẠT THEO ẢNH TRA-HANG.PNG */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-200">
            <RotateCcw className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trả hàng hoàn tiền</h1>
            <p className="text-sm text-slate-500 mt-0.5">Quản lý phiếu trả hàng và hoàn tiền khách hàng</p>
          </div>
        </div>
        {/* ===== SEARCH + FILTER (đã dời lên cùng hàng, giữa tiêu đề và nút tạo phiếu) ===== */}
        <div className="flex flex-1 flex-col md:flex-row items-stretch md:items-center gap-3 md:mx-4 flex-wrap">
          <div className="filter-bar">
            <div className="filter-bar__search">
              <Search className="filter-bar__search-icon" />
              <input
                type="text"
                placeholder="Tìm theo mã phiếu, tên khách, SĐT..."
                className="filter-bar__search-input"
                value={returnSearchInput}
                onChange={(e) => setReturnSearchInput(e.target.value)}
              />
            </div>

            <input
              type="date"
              className="filter-bar__date-input"
              value={filters.startDate}
              onChange={(e) => setFilters({ startDate: e.target.value })}
              title="Từ ngày"
            />

            <input
              type="date"
              className="filter-bar__date-input"
              value={filters.endDate}
              onChange={(e) => setFilters({ endDate: e.target.value })}
              title="Đến ngày"
            />

            <div className="filter-bar__dropdown">
              <button
                onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                className={`filter-bar__trigger ${filters.status ? 'filter-bar__trigger--active' : ''}`}
              >
                <Filter className="w-4 h-4" />
                <span>Trạng thái{filters.status ? `: ${statusOptions.find(o => o.value === filters.status)?.label}` : ''}</span>
                <ChevronDown className={`filter-bar__chevron ${isStatusFilterOpen ? 'filter-bar__chevron--open' : ''}`} />
              </button>

              {isStatusFilterOpen && (
                <div className="filter-bar__menu">
                  <div className="filter-bar__menu-scroll">
                    {statusOptions.map(opt => (
                      <div
                        key={opt.value}
                        className="filter-bar__option"
                        onClick={() => { setFilters({ status: opt.value }); setIsStatusFilterOpen(false); }}
                      >
                        <div className={`filter-bar__check ${filters.status === opt.value ? 'filter-bar__check--checked' : ''}`}>
                          {filters.status === opt.value && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="filter-bar__option-label">{opt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => fetchReturnOrdersPaginated()}
              className="filter-bar__trigger filter-bar__trigger--active"
            >
              <Filter className="w-4 h-4" />
              Lọc
            </button>

            <button
              onClick={() => { resetFilters(); setReturnSearchInput(''); }}
              className="filter-bar__reset"
            >
              <X className="w-4 h-4" />
              Xóa
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
          {permissions.canDeleteOrder && selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2 animate-fade-in">
              <span className="text-sm font-semibold text-red-700">Đã chọn {selectedIds.length} phiếu</span>
              <button 
                onClick={handleBulkCancel}
                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                title="Hủy hàng loạt"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          {permissions.canCreateOrder && (
          <button 
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-purple-100 transition-all"
            onClick={handleCreateNew}
          >
            <Plus className="w-4 h-4" />
            Tạo phiếu trả hàng
          </button>
          )}
        </div>
      </div>

      {/* STAT CARDS HOÀN TOÀN GIỐNG ẢNH TRA-HANG.PNG (CÓ SPARKLINE ĐỒ THỊ) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-slate-100/50 relative overflow-hidden">
          <div className="flex items-center gap-4 z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[13px] font-medium text-slate-400 mb-1">TỔNG PHIẾU TRẢ</span>
              <span className="block text-2xl font-bold text-slate-800">{stats.total}</span>
              <span className="text-[11px] text-slate-400">phiếu</span>
            </div>
          </div>
          <svg className="absolute right-0 bottom-0 w-24 h-12 text-purple-100 opacity-60" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path d="M0,25 Q15,15 30,20 T60,10 T90,18 T100,5 L100,30 L0,30 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-slate-100/50 relative overflow-hidden">
          <div className="flex items-center gap-4 z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-500 flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[13px] font-medium text-slate-400 mb-1">ĐÃ HOÀN TẤT</span>
              <span className="block text-2xl font-bold text-slate-800">{stats.completed}</span>
              <span className="text-[11px] text-slate-400">phiếu</span>
            </div>
          </div>
          <svg className="absolute right-0 bottom-0 w-24 h-12 text-emerald-100 opacity-60" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path d="M0,28 Q20,22 40,25 T70,12 T100,2 L100,30 L0,30 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-slate-100/50 relative overflow-hidden">
          <div className="flex items-center gap-4 z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-50 text-red-500 flex-shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[13px] font-medium text-slate-400 mb-1">ĐÃ HỦY</span>
              <span className="block text-2xl font-bold text-slate-800">{stats.cancelled}</span>
              <span className="text-[11px] text-slate-400">phiếu</span>
            </div>
          </div>
          <svg className="absolute right-0 bottom-0 w-24 h-12 text-red-100 opacity-60" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path d="M0,20 Q10,25 25,15 T50,22 T75,5 T100,18 L100,30 L0,30 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-slate-100/50 relative overflow-hidden">
          <div className="flex items-center gap-4 z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-500 flex-shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[13px] font-medium text-slate-400 mb-1">TỔNG TIỀN HOÀN</span>
              <span className="block text-xl font-bold text-slate-800">{formatCurrency(stats.totalRefund)}</span>
              <span className="text-[11px] text-slate-400">Tổng tiền hoàn</span>
            </div>
          </div>
          <svg className="absolute right-0 bottom-0 w-24 h-12 text-amber-100 opacity-60" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path d="M0,25 Q30,10 60,18 T100,8 L100,30 L0,30 Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">Lỗi: {error}</div>
      )}

      {/* ============================================== */}
      {/* BOX CHÍNH - Theo chuẩn PLAN_BOX_CHINH_SUPPLIERS_UI.md */}
      {/* Card-Centric Design: rounded-2xl + bg-white + shadow mịn + border mảnh + p-6 */}
      {/* ============================================== */}
      <DataGridBox innerRef={dataGridBoxRef}>

        {useNewDataGridReturnOrders ? (
          <div className="return-orders-v2-datagrid flex-1 min-h-0">
            <DataGrid
              className="flex-1 min-h-0"
              embedded
              data={returnOrders}
              columns={returnOrderColumns}
              keyExtractor={(r) => r.id || ''}
              loading={loading && returnOrders.length === 0}
              error={error}
              selectedRows={selectedIds}
              onSelectionChange={(ids) => setSelectedIds(ids as string[])}
              onRowClick={(r) => handleViewDetail(r)}
              sortKey={v2SortConfig?.key}
              sortDirection={v2SortConfig?.direction || 'none'}
              onSortChange={handleDataGridSort}
              pagination={{
                currentPage,
                totalPages,
                totalCount,
                pageSize,
                onPageChange: (page) => setCurrentPage(page),
                showInfo: false,
              }}
              emptyTitle="Chưa có phiếu trả hàng nào"
              emptyDescription="Tạo phiếu trả hàng mới để bắt đầu."
              emptyAction={
                permissions.canCreateOrder ? (
                <ActionButton
                  variant="primary"
                  size="md"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleCreateNew}
                >
                  Tạo phiếu trả
                </ActionButton>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            {/* ===== KHU VỰC 2: Data Table Container (overflow-x-auto -mx-6) ===== */}
            <div className="flex-1 min-h-0 overflow-x-auto -mx-6">
              <table className="min-w-full align-middle px-6 divide-y divide-slate-100">
                <thead>
                  <tr>
                    <th scope="col" className="w-12 py-3.5 pl-6">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                        checked={returnOrders.length > 0 && selectedIds.length === returnOrders.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="py-3.5 px-3 text-center text-xs uppercase font-semibold text-slate-400 tracking-wider w-16">
                      STT
                    </th>
                    <th className="py-3.5 px-3 text-left text-xs uppercase font-semibold text-slate-400 tracking-wider hover:text-slate-600 cursor-pointer transition-colors">
                      Mã phiếu
                    </th>
                    <th className="py-3.5 px-3 text-left text-xs uppercase font-semibold text-slate-400 tracking-wider hover:text-slate-600 cursor-pointer transition-colors">
                      Khách hàng
                    </th>
                    <th className="py-3.5 px-3 text-left text-xs uppercase font-semibold text-slate-400 tracking-wider hover:text-slate-600 cursor-pointer transition-colors">
                      Ngày tạo
                    </th>
                    <th className="py-3.5 px-3 text-right text-xs uppercase font-semibold text-slate-400 tracking-wider hover:text-slate-600 cursor-pointer transition-colors">
                      Tiền hoàn
                    </th>
                    <th className="py-3.5 px-3 text-right text-xs uppercase font-semibold text-slate-400 tracking-wider">
                      Tiền mặt / Giảm nợ
                    </th>
                    <th className="py-3.5 px-3 text-center text-xs uppercase font-semibold text-slate-400 tracking-wider">
                      Trạng thái
                    </th>
                    <th className="py-3.5 pr-6 text-right text-xs uppercase font-semibold text-slate-400 tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading && returnOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
                        <p className="text-slate-400">Đang tải phiếu trả hàng...</p>
                      </td>
                    </tr>
                  ) : returnOrders.map((r, index) => (
                    <tr
                      key={r.id}
                      className="group hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => handleViewDetail(r)}
                    >
                      {/* Checkbox */}
                      <td className="py-4 pl-6" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                          checked={selectedIds.includes(r.id || '')}
                          onChange={(e) => handleSelectRow(r.id || '', e.target.checked)}
                        />
                      </td>

                      {/* STT */}
                      <td className="py-4 px-3 text-center text-sm text-slate-500 whitespace-nowrap">
                        {index + 1 + (currentPage - 1) * pageSize}
                      </td>

                      {/* Mã phiếu — với avatar tròn tím */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                            <RotateCcw className="w-4 h-4 text-purple-500" />
                          </div>
                          <span className="text-gray-900 font-semibold text-sm hover:underline">
                            {r.id}
                          </span>
                        </div>
                      </td>

                      {/* Khách hàng — đổi màu tím khi hover row */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span className="text-sm text-slate-700 font-medium group-hover:text-purple-600 transition-colors">
                          {r.customerName || 'Khách lẻ'}
                        </span>
                        {(r as any).customerPhone && (
                          <p className="text-xs text-slate-400 mt-0.5">{(r as any).customerPhone}</p>
                        )}
                      </td>

                      {/* Ngày tạo */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <p className="text-sm text-slate-500">{formatDate(r.createdAt || r.date)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatTime(r.createdAt || r.date)}</p>
                      </td>

                      {/* Tiền hoàn — màu động */}
                      <td
                        className={`py-4 px-3 text-right text-sm font-semibold whitespace-nowrap ${
                          (r.totalRefundAmount || 0) > 0 ? 'text-red-500' : 'text-emerald-500'
                        }`}
                      >
                        {formatCurrency(r.totalRefundAmount || 0)}
                      </td>

                      {/* Tiền mặt / Giảm nợ */}
                      <td className="py-4 px-3 text-right whitespace-nowrap">
                        <div className="text-sm font-medium text-emerald-600">
                          TM: {formatCurrency(r.cashRefund || 0)}
                        </div>
                        {(r.debtReduction || 0) > 0 && (
                          <div className="text-xs text-amber-600 mt-0.5">
                            Nợ: {formatCurrency(r.debtReduction || 0)}
                          </div>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-4 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(r.status || '')}
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 pr-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleViewDetail(r)}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                            title="Xem chi tiết"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrintReturn(r)}
                            className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                            title="In phiếu trả"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {permissions.canDeleteOrder && r.status !== 'cancelled' && (
                            <button
                              onClick={() => setConfirmCancelId(r.id || null)}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Hủy phiếu"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {returnOrders.length === 0 && !loading && (
              <EmptyState
                icon={<RotateCcw className="w-10 h-10" />}
                title="Chưa có phiếu trả hàng nào"
                description="Tạo phiếu trả hàng mới để bắt đầu."
                action={
                  permissions.canCreateOrder ? (
                    <Button variant="primary" onClick={handleCreateNew} icon={<Plus className="w-4 h-4" />}>Tạo phiếu trả</Button>
                  ) : undefined
                }
              />
            )}

            {/* ===== KHU VỰC 3: Pagination Toolbar (border-t pt-5 mt-4) ===== */}
            {totalCount > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-5 mt-4">
                {/* Bên trái: Text thống kê */}
                <p className="text-sm text-slate-400">
                  Hiển thị{' '}
                  <span className="text-slate-700 font-medium">
                    {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                  </span>{' '}
                  -{' '}
                  <span className="text-slate-700 font-medium">
                    {Math.min(currentPage * pageSize, totalCount)}
                  </span>{' '}
                  trên tổng số{' '}
                  <span className="text-slate-700 font-medium">{totalCount}</span>{' '}
                  phiếu trả hàng
                </p>

                {/* Bên phải: Nav số trang — luôn hiển thị để giữ vị trí cố định */}
                <nav className="inline-flex items-center gap-1 rounded-xl bg-slate-50 p-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1 || loading}
                    className="min-w-[32px] h-[32px] rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {getPageNumbers(currentPage, totalPages).map((p, idx) => {
                    if (p === 'ellipsis') {
                      return (
                        <span key={`e-${idx}`} className="px-2 text-slate-400 text-sm select-none">…</span>
                      );
                    }
                    const isActive = p === currentPage;
                    return (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        disabled={loading}
                        className={`min-w-[32px] h-[32px] rounded-lg text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages || loading}
                    className="min-w-[32px] h-[32px] rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Trang sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </DataGridBox>
      {/* ============== END BOX CHÍNH ============== */}

      {/* MODAL CHI TIẾT VÀ DIALOG GIỮ NGUYÊN */}
      {view === 'detail' && renderDetailModal()}
      {renderConfirmDialog()}
    </PageLayout>
  );
};

export default ReturnOrders;