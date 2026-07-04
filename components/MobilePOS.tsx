import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  Search, Plus, X, User, ScanBarcode, ShoppingBag, Gift, Trash2, Check,
  Minus, AlertTriangle, Loader2, Percent, Package, CreditCard,
  Banknote, Wallet, History, ChevronRight, ChevronLeft, BadgePercent,
  FileText
} from 'lucide-react';
import { Product, Customer, Invoice, CartItem, AppSettings, Reward, Promotion } from '../types';
import { supabaseService } from '../services/supabaseService';
import { useDebounce } from '../hooks/useDebounce';
import BarcodeScannerFix from './BarcodeScannerFix';
import { applyPromotions, applyBestPromotions, suggestPromotions } from '../utils/promotionUtils';
import { getAvailableLots, sortLotsByFifoExpiry, validateLotQuantity } from '../utils/lotUtils';
import './MobilePOS.css';

/* =========================================================
   TYPES & INTERFACES
   ========================================================= */
interface MobilePOSProps {
  products?: Product[];
  customers?: Customer[];
  invoices: Invoice[];
  activeTabId: number;
  onUpdateInvoices: (invoices: Invoice[]) => void;
  onSetActiveTabId: (id: number) => void;
  onCheckout: (invoiceId: number, paymentMethod: string, amountPaid: number, customerId?: string, appliedPromotions?: Promotion[]) => void;
  onAddCustomer: (customer: Customer) => Promise<void>;
  appSettings: AppSettings;
  rewards: Reward[];
  promotions: Promotion[];
}

interface PromotionSuggestion {
  promotion: Promotion;
  result: {
    appliedPromotions: Array<{ promotionId: string; promotionName: string; discountAmount: number; description?: string }>;
    totalDiscount: number;
  };
}

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

/* =========================================================
   CUSTOM HOOKS
   ========================================================= */

/** useCountUp — animate a number towards target over duration ms */
function useCountUp(target: number, duration = 400) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = value;
    startRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const next = Math.round(fromRef.current + (target - fromRef.current) * eased);
      setValue(next);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}

/** usePullToRefresh — touch handler for pull-down-to-refresh */
function usePullToRefresh(onRefresh: () => Promise<void> | void, threshold = 80) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    } else {
      startY.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === null || isRefreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      const damped = Math.min(threshold * 1.5, diff * 0.5);
      setPullDistance(damped);
    }
  }, [isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, onRefresh]);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

/* =========================================================
   HELPERS
   ========================================================= */
const formatVnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

/** Tiny animated counter component using useCountUp */
function AnimatedNumber({ value, suffix = 'đ' }: { value: number; suffix?: string }) {
  const display = useCountUp(value, 350);
  return <span className="m-counter">{display.toLocaleString('vi-VN')}{suffix}</span>;
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */
export function MobilePOS(props: MobilePOSProps) {
  const {
    products = [], customers = [], invoices, activeTabId,
    onUpdateInvoices, onSetActiveTabId, onCheckout, onAddCustomer,
    appSettings, rewards, promotions
  } = props;

  // Suppress unused-variable warnings for props we accept but don't directly read here
  void appSettings;
  void onSetActiveTabId;

  // === ACTIVE INVOICE (mobile uses single invoice only — UI tabs hidden per spec) ===
  const activeInvoice = (invoices.find(i => Number(i.id) === Number(activeTabId)) || invoices[0]) as any;
  const activeCart = (activeInvoice?.cart || []) as any[];
  const activeCustomerId = (activeInvoice?.customerId || '') as string;
  const activeRedeemedRewards = (activeInvoice?.redeemedRewards || []) as any[];

  // Phase 1 — fetch active customer on demand (prop customers rỗng)
  const [customerCache, setCustomerCache] = useState<Map<string, Customer>>(new Map());
  const activeCustomer = useMemo(() => activeCustomerId ? customerCache.get(activeCustomerId) : undefined, [customerCache, activeCustomerId]);

  useEffect(() => {
    if (!activeCustomerId || customerCache.has(activeCustomerId)) return;
    supabaseService.getCustomerById(activeCustomerId)
      .then(customer => {
        if (customer) {
          setCustomerCache(prev => new Map(prev).set(activeCustomerId, customer));
        }
      })
      .catch(err => console.error('Error fetching active customer:', err));
  }, [activeCustomerId, customerCache]);

  // === SEARCH STATES ===
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const debouncedProductSearch = useDebounce(productSearchTerm, 400);
  const [showProductResults, setShowProductResults] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Server-side product search results
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const productSearchRequestId = useRef(0);

  // === PAYMENT MODAL ===
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChangeConfirm, setShowChangeConfirm] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  // === REWARD MODAL ===
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

  // === PROMOTION MODAL ===
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [selectedPromotions, setSelectedPromotions] = useState<Promotion[]>([]);
  const [promotionSuggestions, setPromotionSuggestions] = useState<PromotionSuggestion[]>([]);

  // === CUSTOMER MODALS ===
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [isQuickAddCustomerOpen, setIsQuickAddCustomerOpen] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ name: '', phone: '' });
  const [isCustomerOrdersOpen, setIsCustomerOrdersOpen] = useState(false);

  // === CART OPS MODALS ===
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // === REFS ===
  const productSearchRef = useRef<HTMLDivElement>(null);

  /* =====================================================
     EFFECTS
     ===================================================== */
  useEffect(() => {
    if (activeCart.length > 0 && promotions.length > 0) {
      const raw = suggestPromotions(promotions, activeCart, activeCustomer || undefined);
      const suggestions: PromotionSuggestion[] = raw.map(item => ({
        promotion: item.promotion,
        result: {
          appliedPromotions: [{
            promotionId: item.promotionId,
            promotionName: item.promotionName,
            discountAmount: item.discountAmount,
            description: item.description,
          }],
          totalDiscount: item.discountAmount,
        },
      }));
      setPromotionSuggestions(suggestions);
    } else {
      setPromotionSuggestions([]);
    }
  }, [activeCart, activeCustomer, promotions]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
        setShowProductResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Server-side product search
  useEffect(() => {
    const term = debouncedProductSearch.trim();
    if (!term) {
      setProductSearchResults([]);
      return;
    }

    const requestId = ++productSearchRequestId.current;
    setIsSearchingProduct(true);

    supabaseService.searchProducts(term, 30)
      .then((results) => {
        if (requestId === productSearchRequestId.current) {
          setProductSearchResults(results);
          setIsSearchingProduct(false);
        }
      })
      .catch((err) => {
        console.error('MobilePOS product search error:', err);
        if (requestId === productSearchRequestId.current) {
          setProductSearchResults([]);
          setIsSearchingProduct(false);
        }
      });
  }, [debouncedProductSearch]);

  /* =====================================================
     DERIVED DATA
     ===================================================== */
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm.trim()) return [];
    return productSearchResults;
  }, [productSearchTerm, productSearchResults]);

  const cartTotal = useMemo(
    () => activeCart.reduce((sum: number, item: any) => sum + item.price * item.cartQuantity, 0),
    [activeCart]
  );

  // Phase 9 — áp khuyến mãi đúng thứ tự ưu tiên + không cộng dồn sai
  const bestPromotionResult = useMemo(() => {
    return applyBestPromotions(selectedPromotions, activeCart, activeCustomer || undefined);
  }, [selectedPromotions, activeCart, activeCustomer]);

  const totalPromotionDiscount = bestPromotionResult.totalDiscount;
  const appliedPromotionDetails = bestPromotionResult.appliedPromotions;
  const actuallyAppliedPromotions = bestPromotionResult.appliedPromotionsFull;

  const finalTotal = Math.max(0, cartTotal - totalPromotionDiscount);
  const cartItemCount = activeCart.reduce((sum: number, item: any) => sum + item.cartQuantity, 0);
  const hasCartItems = activeCart.length > 0;

  /* =====================================================
     HELPERS
     ===================================================== */
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const updateInvoice = (updatedInvoice: Invoice) => {
    onUpdateInvoices(invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
  };

  const checkStockAvailability = (product: any, quantity: number): boolean => {
    if (!product) return false;
    if (quantity <= 0) return false;
    return quantity <= Number(product.quantity || 0) + 5;
  };

  /* =====================================================
     CART OPERATIONS
     ===================================================== */
  // Phase 5b: tự động chọn lô theo FIFO/HSD; chặn nếu vượt tồn lô đã chọn.
  const addToCart = (product: any) => {
    const inv = activeInvoice as any;
    if (!inv) return;

    const productHasLots = product.hasBatches || (product.lots && product.lots.length > 0);
    const availableLots = productHasLots ? sortLotsByFifoExpiry(getAvailableLots(product.lots)) : [];

    if (productHasLots && availableLots.length === 0) {
      showToast(`Sản phẩm "${product.name}" đã hết hàng trong các lô`, 'error');
      return;
    }

    const existing = inv.cart.find((item: any) => item.id === product.id);
    if (existing) {
      const currentQty = existing.cartQuantity || 0;
      const nextQty = currentQty + 1;
      const selectedLot = existing.selectedLot;
      if (selectedLot) {
        const check = validateLotQuantity(selectedLot, nextQty);
        if (!check.valid) {
          showToast(
            `Lô ${selectedLot.code || selectedLot.lotNumber} chỉ còn ${check.max} ${product.unit || 'SP'}. Vui lòng đổi lô hoặc giảm số lượng.`,
            'error'
          );
          return;
        }
      }
      updateInvoice({ ...inv, cart: inv.cart.map((item: any) =>
        item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
      )});
    } else {
      const newItem: any = {
        ...product,
        cartQuantity: 1,
        selectedUnit: undefined,
        selectedLot: availableLots[0],
      };
      updateInvoice({ ...inv, cart: [...inv.cart, newItem] });
    }
    setShowProductResults(false);
    setProductSearchTerm('');
    showToast(`Đã thêm: ${product.name}`);
  };

  // Phase 5b: chặn nếu cập nhật số lượng vượt quá tồn của lô đã chọn.
  const updateCartItem = (itemId: string, updates: Record<string, any>) => {
    const inv = activeInvoice as any;
    if (!inv) return;
    const item = inv.cart.find((i: any) => i.id === itemId);
    if (!item) return;

    if (updates.cartQuantity !== undefined && updates.cartQuantity !== null) {
      const nextQty = Number(updates.cartQuantity);
      const selectedLot = item.selectedLot;
      if (selectedLot) {
        const check = validateLotQuantity(selectedLot, nextQty);
        if (!check.valid) {
          showToast(
            `Lô ${selectedLot.code || selectedLot.lotNumber} chỉ còn ${check.max} ${item.unit || 'SP'}. Vui lòng đổi lô hoặc giảm số lượng.`,
            'error'
          );
          return;
        }
      }
      if (typeof item.quantity === 'number' && nextQty > item.quantity) {
        showToast(`Hết hàng "${item.name}" (còn ${item.quantity})`, 'error');
        return;
      }
    }

    // Phase 5b: chặn nếu đổi sang lô không đủ tồn cho số lượng hiện tại;
    // nếu bỏ chọn (undefined) thì tự động chọn lô FIFO/HSD đầu tiên để tránh checkout lỗi.
    if (updates.selectedLot !== undefined) {
      let lot = updates.selectedLot;
      if (!lot) {
        const available = sortLotsByFifoExpiry(getAvailableLots(item.lots));
        lot = available[0];
      }
      if (lot && item.cartQuantity) {
        const check = validateLotQuantity(lot, item.cartQuantity);
        if (!check.valid) {
          showToast(
            `Lô ${lot.code || lot.lotNumber} chỉ còn ${check.max} ${item.unit || 'SP'}. Vui lòng giảm số lượng trước khi đổi lô.`,
            'error'
          );
          return;
        }
      }
      updates = { ...updates, selectedLot: lot };
    }

    updateInvoice({ ...inv, cart: inv.cart.map((cartItem: any) =>
      cartItem.id === itemId ? { ...cartItem, ...updates } : cartItem
    )});
  };

  const removeCartItem = (itemId: string) => {
    const inv = activeInvoice as any;
    if (!inv) return;
    updateInvoice({ ...inv, cart: inv.cart.filter((item: any) => item.id !== itemId) });
  };

  const clearAllCart = () => {
    const inv = activeInvoice as any;
    if (!inv) return;
    updateInvoice({ ...inv, cart: [], redeemedRewards: [] } as any);
    setSelectedPromotions([]);
    setShowClearCartConfirm(false);
    showToast('Đã xóa toàn bộ giỏ hàng');
  };

  /* =====================================================
     CUSTOMER OPERATIONS
     ===================================================== */
  const handleSelectCustomer = (customer: Customer) => {
    const inv = activeInvoice;
    if (!inv) return;
    updateInvoice({ ...inv, customerId: customer.id });
    setIsCustomerSearchOpen(false);
  };

  const handleClearCustomer = () => {
    const inv = activeInvoice;
    if (!inv) return;
    updateInvoice({ ...inv, customerId: '' });
  };

  const handleQuickAddCustomer = async () => {
    if (!quickAddForm.name.trim()) {
      showToast('Nhập tên khách hàng', 'error');
      return;
    }
    try {
      const newCustomer: Customer = {
        id: `KH${Date.now()}`,
        code: `KH${Date.now()}`.slice(-8),
        name: quickAddForm.name.trim(),
        phone: quickAddForm.phone.trim(),
        address: '',
        debt: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
        createdAt: new Date().toISOString(),
      };
      await onAddCustomer(newCustomer);
      handleSelectCustomer(newCustomer);
      setQuickAddForm({ name: '', phone: '' });
      setIsQuickAddCustomerOpen(false);
      showToast('Thêm khách hàng thành công!');
    } catch (err) {
      showToast('Lỗi khi thêm khách hàng', 'error');
    }
  };

  /* =====================================================
     REWARD / PROMOTION OPS
     ===================================================== */
  const handleRedeemReward = (reward: Reward) => {
    if (!activeCustomer) {
      showToast('Chọn khách hàng trước!', 'error');
      return;
    }
    const inv = activeInvoice;
    if (!inv) return;
    const existing = inv.redeemedRewards.find(r => r.rewardId === reward.id);
    if (existing) {
      updateInvoice({
        ...inv,
        redeemedRewards: inv.redeemedRewards.map(r =>
          r.rewardId === reward.id ? { ...r, quantity: r.quantity + 1 } : r
        ),
      });
    } else {
      updateInvoice({
        ...inv,
        redeemedRewards: [...inv.redeemedRewards, {
          rewardId: reward.id,
          rewardName: reward.name,
          pointCost: reward.pointCost,
          quantity: 1,
        }],
      });
    }
  };

  const handleRemoveRedeemedReward = (rewardId: string) => {
    const inv = activeInvoice;
    if (!inv) return;
    updateInvoice({ ...inv, redeemedRewards: inv.redeemedRewards.filter(r => r.rewardId !== rewardId) });
  };

  const handleTogglePromotion = (promo: Promotion) => {
    setSelectedPromotions(prev => {
      const exists = prev.find(p => p.id === promo.id);
      if (exists) return prev.filter(p => p.id !== promo.id);
      return [...prev, promo];
    });
  };

  /* =====================================================
     PAYMENT FLOW
     ===================================================== */
  const handleOpenPayment = () => {
    if (activeCart.length === 0) {
      showToast('Giỏ hàng trống!', 'error');
      return;
    }
    setIsPaymentOpen(true);
    setPaymentMethod('cash');
    setAmountPaid('');
    setIsProcessing(false);
    setShowChangeConfirm(false);
  };

  const finalizeCheckout = async (method: string, paid: number) => {
    await onCheckout(
      activeInvoice!.id,
      method,
      paid,
      activeInvoice?.customerId || undefined,
      actuallyAppliedPromotions.length > 0 ? actuallyAppliedPromotions : undefined
    );
    const inv = activeInvoice;
    if (inv) {
      updateInvoice({ ...inv, cart: [], customerId: '', redeemedRewards: [] });
      setSelectedPromotions([]);
      setOrderNote('');
    }
    setIsPaymentOpen(false);
    setShowSuccessAnim(true);
    setTimeout(() => setShowSuccessAnim(false), 1800);
  };

  const handlePaymentConfirm = async () => {
    setIsProcessing(true);
    try {
      const paid = parseFloat(amountPaid) || 0;
      if (paymentMethod === 'cash') {
        const change = paid - finalTotal;
        if (change >= 0) {
          await finalizeCheckout(paymentMethod, paid);
          showToast('Thanh toán thành công!');
        } else {
          setShowChangeConfirm(true);
        }
      } else {
        await finalizeCheckout(paymentMethod, paid);
        showToast('Thanh toán thành công!');
      }
    } catch (err) {
      showToast('Lỗi thanh toán: ' + String(err), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDebtCheckout = async () => {
    const paid = parseFloat(amountPaid) || 0;
    if (paid >= finalTotal) return;
    try {
      await finalizeCheckout('debt', paid);
      setShowChangeConfirm(false);
      showToast('Đã tạo đơn nợ!');
    } catch (err) {
      showToast('Lỗi tạo đơn nợ', 'error');
    }
  };

  /* =====================================================
     PULL TO REFRESH (placeholder no-op; parent owns data)
     ===================================================== */
  const handleRefresh = useCallback(async () => {
    // simulate refresh delay; parent App owns data so we only show feedback
    await new Promise(res => setTimeout(res, 600));
    showToast('Đã làm mới');
  }, []);

  const { containerRef, pullDistance, isRefreshing, touchHandlers } = usePullToRefresh(handleRefresh);

  /* =====================================================
     RENDER
     ===================================================== */
  return (
    <div className="flex flex-col h-full m-bg overflow-hidden mpos-root">
      {/* ============== HEADER (70px sticky) ============== */}
      <header
        className="shrink-0 flex items-center justify-between px-4 pb-1 pt-[calc(0.75rem+env(safe-area-inset-top))] mpos-header"
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => window.history.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center mpos-back-btn"
          aria-label="Quay lại"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.2} />
        </motion.button>

        <h1 className="text-2xl font-bold tracking-tight mpos-title">
          Bán hàng
        </h1>

        <div className="w-10 h-10 flex items-center justify-center relative">
          {hasCartItems && (
            <motion.div
              key={cartItemCount}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.35 }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg mpos-cart-badge"
            >
              {cartItemCount}
            </motion.div>
          )}
        </div>
      </header>

      {/* ============== SCROLLABLE BODY with PULL-TO-REFRESH ============== */}
      <div
        ref={containerRef}
        {...touchHandlers}
        className="flex-1 overflow-y-auto mpos-scroll-body"
      >
        {/* Pull-to-refresh indicator */}
        <motion.div
          animate={{ height: pullDistance }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex items-center justify-center overflow-hidden"
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : (pullDistance / 80) * 180 }}
            transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0.2 }}
          >
            <Loader2 className="w-5 h-5 mpos-refresh-icon" />
          </motion.div>
        </motion.div>

        <div className="px-4 pt-3 pb-6 space-y-4">
          {/* ============== SEARCH + QR CARD (60px) ============== */}
          <div ref={productSearchRef} className="relative">
            <div className="flex items-center gap-2.5">
              {/* Search input card */}
              <div
                className="flex-1 flex items-center gap-2.5 px-4 bg-white transition-all mpos-search-card"
              >
                <Search className="w-5 h-5 shrink-0 mpos-search-icon" />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm (tên, mã, barcode...)"
                  value={productSearchTerm}
                  onChange={(e) => { setProductSearchTerm(e.target.value); setShowProductResults(true); }}
                  onFocus={() => setShowProductResults(true)}
                  className="flex-1 bg-transparent outline-none text-base placeholder:text-[#9CA3AF] mpos-search-input"
                />
                {productSearchTerm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => { setProductSearchTerm(''); setShowProductResults(false); }}
                    className="w-6 h-6 rounded-full flex items-center justify-center mpos-clear-btn"
                  >
                    <X className="w-3.5 h-3.5 mpos-search-icon" />
                  </motion.button>
                )}
              </div>

              {/* QR Scan button */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={async () => {
                  // iOS Safari 16+ FIX: getUserMedia yêu cầu transient activation
                  // (phải gọi đồng bộ từ user gesture). Pre-request camera permission
                  // NGAY trong click handler, trước khi React setState.
                  // Nếu không pre-request, iOS sẽ mất context và báo NotFoundError
                  // khi html5-qrcode gọi getUserMedia từ useEffect/rAF.
                  let granted = false;
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                      video: { facingMode: 'environment' }
                    });
                    // Đã cấp quyền, stop stream ngay vì html5-qrcode sẽ tự tạo stream mới
                    stream.getTracks().forEach(t => t.stop());
                    granted = true;
                  } catch (e) {
                    // NotFoundError = no camera hardware available (expected on desktop)
                    if (e instanceof DOMException && e.name === 'NotFoundError') {
                      console.log('No camera hardware available, barcode scan will be unavailable');
                    } else {
                      console.warn('Camera pre-check failed (may need permission):', e);
                    }
                    granted = false;
                  }
                  // Store camera grant status for BarcodeScannerFix
                  (window as any).__cameraGranted = granted;
                  setIsScannerOpen(true);
                }}
                className="shrink-0 flex flex-col items-center justify-center gap-0.5 mpos-qr-btn"
                aria-label="Quét mã vạch"
              >
                <ScanBarcode className="w-5 h-5" strokeWidth={2.2} />
                <span className="text-xs-caption font-bold leading-none">Quét mã</span>
              </motion.button>
            </div>

            {/* Product results dropdown */}
            <AnimatePresence>
              {showProductResults && productSearchTerm && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 right-0 mt-2 bg-white overflow-hidden z-40 mpos-results-dropdown"
                >
                  {isSearchingProduct ? (
                    <div className="p-6 text-center text-sm mpos-text-muted">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Đang tìm...
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map(product => {
                      const isOut = product.quantity <= 0;
                      return (
                        <button
                          key={product.id}
                          onClick={() => !isOut && addToCart(product)}
                          disabled={isOut}
                          className={`w-full flex items-center gap-3 p-3 text-left transition-colors mpos-result-item${isOut ? ' mpos-result-item--out' : ''}`}
                        >
                          <div
                            className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center overflow-hidden mpos-thumb"
                          >
                            {product.image ? (
                              <img src={product.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 mpos-text-muted" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate mpos-text-primary">
                              {product.name}
                            </p>
                            <p className="text-xs-caption mpos-text-secondary">{product.code}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold mpos-text-brand">
                              {formatVnd(product.price)}
                            </p>
                            <p
                              className={`text-xs-caption font-semibold ${isOut ? 'mpos-stock--out' : 'mpos-stock--in'}`}
                            >
                              {isOut ? 'Hết hàng' : `Tồn ${product.quantity}`}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-sm mpos-text-muted">
                      Không tìm thấy sản phẩm
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ============== CUSTOMER CARD (90px) ============== */}
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setIsCustomerSearchOpen(true)}
            className={`flex items-center gap-3 px-4 cursor-pointer mpos-customer-card${activeCustomer ? ' mpos-customer-card--active' : ''}`}
          >
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-lg mpos-avatar"
            >
              {activeCustomer
                ? activeCustomer.name.charAt(0).toUpperCase()
                : <User className="w-5 h-5" strokeWidth={2.4} />}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              {activeCustomer ? (
                <>
                  <p className="text-base font-bold truncate mpos-customer-name">
                    {activeCustomer.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs mpos-text-secondary">
                      {activeCustomer.phone || 'Không có SĐT'}
                    </span>
                    <span
                      className="text-xs-caption font-bold px-1.5 py-0.5 rounded-full mpos-loyalty-badge"
                    >
                      {(activeCustomer.loyaltyPoints || 0).toLocaleString('vi-VN')} điểm
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold mpos-text-primary">
                    Chọn khách hàng
                  </p>
                  <p className="text-xs mt-0.5 mpos-text-secondary">
                    Áp dụng giá và tích điểm
                  </p>
                </>
              )}
            </div>

            {/* Actions */}
            {activeCustomer ? (
              <div className="flex items-center gap-1 shrink-0">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => { e.stopPropagation(); setIsCustomerOrdersOpen(true); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center mpos-icon-btn"
                  aria-label="Lịch sử đơn"
                >
                  <History className="w-4 h-4 mpos-text-brand" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => { e.stopPropagation(); handleClearCustomer(); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center mpos-icon-btn-danger"
                  aria-label="Bỏ chọn khách"
                >
                  <X className="w-4 h-4 mpos-text-danger" />
                </motion.button>
              </div>
            ) : (
              <ChevronRight className="w-5 h-5 shrink-0 mpos-text-muted" />
            )}
          </motion.div>

          {/* ============== CART LIST CARD ============== */}
          <div
            className="mpos-cart-card"
          >
            {/* Cart header */}
            <div className={`flex items-center justify-between px-4 py-3.5 mpos-cart-header${hasCartItems ? ' mpos-cart-header--has-items' : ''}`}>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold mpos-text-primary">Danh sách hàng hóa</h2>
                {hasCartItems && (
                  <span
                    className="text-xs-caption font-bold px-2 py-0.5 rounded-full mpos-count-badge"
                  >
                    {activeCart.length} sản phẩm
                  </span>
                )}
              </div>
              {hasCartItems && (
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setShowClearCartConfirm(true)}
                  className="w-8 h-8 rounded-full flex items-center justify-center mpos-icon-btn-danger"
                  aria-label="Xóa toàn bộ"
                >
                  <Trash2 className="w-4 h-4 mpos-text-danger" />
                </motion.button>
              )}
            </div>

            {/* Cart items */}
            {hasCartItems ? (
              <div className="py-2">
                <AnimatePresence>
                  {activeCart.map((item) => {
                    const isInvalid = !checkStockAvailability(item, item.cartQuantity);
                    return (
                      <SwipeableCartItem
                        key={`${item.id}-${item.selectedLot?.id || 'nolot'}`}
                        item={item}
                        isInvalid={isInvalid}
                        onUpdate={updateCartItem}
                        onRemove={removeCartItem}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ShoppingBag className="w-20 h-20 mpos-empty-icon" strokeWidth={1.5} />
                </motion.div>
                <p className="mt-4 text-base font-semibold mpos-text-secondary">
                  Chưa có sản phẩm
                </p>
                <p className="mt-1 text-xs text-center mpos-text-muted">
                  Tìm kiếm hoặc quét mã QR để thêm sản phẩm
                </p>
              </div>
            )}

            {/* Note card (dashed) */}
            <div className="p-3">
              {showNoteInput ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Nhập ghi chú đơn hàng..."
                    rows={3}
                    className="w-full px-3 py-2.5 outline-none text-sm resize-none mpos-note-input"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => { setShowNoteInput(false); }}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold mpos-btn-secondary"
                    >
                      Xong
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowNoteInput(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 mpos-add-note-btn"
                >
                  {orderNote ? <FileText className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span className="text-sm font-semibold">
                    {orderNote ? `Ghi chú: ${orderNote.slice(0, 30)}${orderNote.length > 30 ? '...' : ''}` : 'Thêm ghi chú đơn hàng'}
                  </span>
                </motion.button>
              )}
            </div>
          </div>

          {/* ============== SUMMARY CARD ============== */}
          {hasCartItems && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 mpos-summary-card"
            >
              <div className="grid grid-cols-5 gap-3 items-center">
                {/* Left col - details */}
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs-caption mpos-text-secondary">Tạm tính</span>
                  </div>
                  <div className="text-sm font-semibold mpos-text-primary">
                    {formatVnd(cartTotal)}
                  </div>
                  {totalPromotionDiscount > 0 && (
                    <div className="text-xs font-medium mpos-text-danger">
                      -{formatVnd(totalPromotionDiscount)}
                    </div>
                  )}
                  <div className="text-xs-caption mpos-text-muted">
                    {cartItemCount} món
                  </div>
                </div>

                {/* Right col - total */}
                <div className="col-span-3 text-right">
                  <p className="text-xs-caption font-bold uppercase tracking-wider mpos-text-muted">
                    Tổng tiền hàng
                  </p>
                  <div
                    className="font-bold leading-tight mt-1 mpos-total-amount"
                  >
                    <AnimatedNumber value={finalTotal} />
                  </div>
                  {totalPromotionDiscount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs-caption font-bold mpos-savings-badge"
                    >
                      💰 Tiết kiệm {formatVnd(totalPromotionDiscount)}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Redeemed rewards chips */}
              {activeRedeemedRewards.length > 0 && (
                <div className="mt-4 pt-3 flex flex-wrap gap-1.5 mpos-rewards-chips">
                  {activeRedeemedRewards.map(rr => (
                    <span
                      key={rr.rewardId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs-caption font-semibold mpos-reward-chip"
                    >
                      🎁 {rr.rewardName} x{rr.quantity}
                      <button onClick={() => handleRemoveRedeemedReward(rr.rewardId)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ============== CTA 1: CHỌN KHUYẾN MÃI ============== */}
          {hasCartItems && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsPromotionModalOpen(true)}
              className="w-full flex items-center justify-between px-5 relative mpos-cta-primary"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center mpos-cta-icon"
                >
                  <Gift className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="text-left">
                  <p className="text-base font-bold">Chọn khuyến mãi</p>
                  <p className="text-xs-caption opacity-90">
                    {promotionSuggestions.length > 0 ? `${promotionSuggestions.length} ưu đãi khả dụng` : 'Áp mã giảm giá'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedPromotions.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs-caption font-bold mpos-cta-badge"
                  >
                    {selectedPromotions.length}
                  </motion.div>
                )}
                <ChevronRight className="w-5 h-5" />
              </div>
            </motion.button>
          )}

          {/* ============== CTA 2: THANH TOÁN ============== */}
          <motion.button
            whileTap={hasCartItems ? { scale: 0.97 } : undefined}
            onClick={handleOpenPayment}
            disabled={!hasCartItems}
            className={`w-full flex items-center justify-between px-5 relative mpos-cta-payment${hasCartItems ? '' : ' mpos-cta-payment--disabled'}`}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center mpos-cta-icon"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <div className="text-left">
                <p className="text-base font-bold">Thanh toán</p>
                {hasCartItems && (
                  <p className="text-xs-caption opacity-90">{formatVnd(finalTotal)}</p>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          {/* Extra bottom safe area for floating nav */}
          <div className="mpos-bottom-spacer" />
        </div>
      </div>

      {/* ============== TOAST ============== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-full text-sm font-bold flex items-center gap-2 mpos-toast ${toast.type === 'success' ? 'mpos-toast--success' : 'mpos-toast--error'}`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============== SUCCESS ANIMATION OVERLAY ============== */}
      <AnimatePresence>
        {showSuccessAnim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center mpos-success-overlay"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="flex flex-col items-center gap-4"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mpos-success-circle"
              >
                <svg viewBox="0 0 52 52" className="w-14 h-14">
                  <motion.path
                    fill="none"
                    stroke="white"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 27 L22 35 L38 17"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
                  />
                </svg>
              </div>
              <p className="text-lg font-bold mpos-text-primary">Thanh toán thành công!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============== PAYMENT MODAL ============== */}
      <AnimatePresence>
        {isPaymentOpen && (
          <BottomSheet onClose={() => !isProcessing && setIsPaymentOpen(false)} title="Thanh toán">
            <div className="p-5 space-y-5">
              {/* Total */}
              <div className="text-center py-2">
                <p className="text-xs-caption font-bold uppercase tracking-wider mpos-text-muted">
                  Số tiền cần thanh toán
                </p>
                <div
                  className="font-bold mt-1 mpos-payment-total"
                >
                  {formatVnd(finalTotal)}
                </div>
                {totalPromotionDiscount > 0 && (
                  <p className="text-xs font-semibold mt-1 mpos-text-success">
                    Đã giảm {formatVnd(totalPromotionDiscount)}
                  </p>
                )}
              </div>

              {/* Payment methods */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'Tiền mặt', Icon: Wallet },
                  { id: 'transfer', label: 'Chuyển khoản', Icon: CreditCard },
                  { id: 'card', label: 'Thẻ', Icon: Banknote },
                ].map(({ id, label, Icon }) => {
                  const sel = paymentMethod === id;
                  return (
                    <motion.button
                      key={id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPaymentMethod(id)}
                      className={`flex flex-col items-center gap-2 py-3 px-2 mpos-pay-method${sel ? ' mpos-pay-method--selected' : ''}`}
                    >
                      <Icon className={`w-6 h-6 ${sel ? 'mpos-pay-method-icon--selected' : 'mpos-pay-method-icon'}`} />
                      <span className={`text-xs font-semibold ${sel ? 'mpos-pay-method-label--selected' : 'mpos-pay-method-label'}`}>
                        {label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Amount input (cash only) */}
              {paymentMethod === 'cash' && (
                <div>
                  <label className="text-xs font-bold mb-1.5 block mpos-text-secondary">
                    Khách đưa
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="Nhập số tiền..."
                      className="w-full px-4 py-3.5 outline-none text-lg font-bold mpos-amount-input"
                      autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm mpos-text-muted">đ</span>
                  </div>
                  {/* Quick amount chips */}
                  <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                    {[finalTotal, 50000, 100000, 200000, 500000, 1000000].map((amt, i) => (
                      <button
                        key={i}
                        onClick={() => setAmountPaid(String(amt))}
                        className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold mpos-quick-amount"
                      >
                        {i === 0 ? 'Vừa đủ' : amt.toLocaleString('vi-VN')}
                      </button>
                    ))}
                  </div>
                  {amountPaid && parseFloat(amountPaid) >= finalTotal && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm mt-2 text-right font-bold mpos-text-success"
                    >
                      Tiền thừa: {formatVnd(parseFloat(amountPaid) - finalTotal)}
                    </motion.p>
                  )}
                </div>
              )}

              {/* Confirm */}
              <motion.button
                whileTap={!isProcessing ? { scale: 0.97 } : undefined}
                onClick={handlePaymentConfirm}
                disabled={isProcessing}
                className={`w-full flex items-center justify-center gap-2 py-4 font-bold text-base mpos-confirm-btn${isProcessing ? ' mpos-confirm-btn--processing' : ''}`}
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>
                ) : (
                  <><Check className="w-5 h-5" /> Xác nhận thanh toán</>
                )}
              </motion.button>
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>

      {/* ============== CHANGE CONFIRM (insufficient cash) ============== */}
      <AnimatePresence>
        {showChangeConfirm && (
          <CenterModal onClose={() => setShowChangeConfirm(false)}>
            <div className="p-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 mpos-warning-circle"
              >
                <AlertTriangle className="w-7 h-7 mpos-text-warning" />
              </div>
              <h3 className="vsp-text-17px vsp-font-bold text-center mpos-text-primary">
                Số tiền không đủ
              </h3>
              <p className="vsp-text-sm vsp-font-regular text-center mt-2 mpos-text-secondary">
                Khách đưa {formatVnd(parseFloat(amountPaid) || 0)}, cần {formatVnd(finalTotal)}
              </p>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowChangeConfirm(false)}
                  className="flex-1 py-3 rounded-2xl vsp-text-base vsp-font-bold mpos-btn-secondary"
                >
                  Nhập lại
                </button>
                <button
                  onClick={handleDebtCheckout}
                  className="flex-1 py-3 rounded-2xl vsp-text-base vsp-font-bold text-white mpos-btn-debt"
                >
                  Ghi nợ
                </button>
              </div>
            </div>
          </CenterModal>
        )}
      </AnimatePresence>

      {/* ============== REWARD MODAL ============== */}
      <AnimatePresence>
        {isRewardModalOpen && (
          <BottomSheet onClose={() => setIsRewardModalOpen(false)} title="Đổi quà tặng">
            <div className="p-5 space-y-3 flex-1 overflow-y-auto">
              {activeCustomer && (
                <div
                  className="p-3 rounded-2xl mpos-points-box"
                >
                  <p className="vsp-text-xs vsp-font-regular mpos-text-brand">
                    Điểm của {activeCustomer.name}:{' '}
                    <span className="vsp-font-bold vsp-text-xl">
                      {(activeCustomer.loyaltyPoints || 0).toLocaleString('vi-VN')}
                    </span>
                  </p>
                </div>
              )}
              {rewards.filter(r => r.isActive).length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 mx-auto opacity-30 mpos-text-muted" />
                  <p className="vsp-text-sm vsp-font-regular mt-2 mpos-text-muted">Chưa có quà tặng</p>
                </div>
              ) : (
                rewards.filter(r => r.isActive).map(reward => {
                  const canRedeem = activeCustomer && (activeCustomer.loyaltyPoints || 0) >= reward.pointCost;
                  return (
                    <div
                      key={reward.id}
                      className={`p-3 mpos-reward-card${canRedeem ? ' mpos-reward-card--available' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="vsp-text-base vsp-font-bold mpos-text-primary">{reward.name}</h4>
                          {reward.description && (
                            <p className="vsp-text-xs vsp-font-regular mt-0.5 mpos-text-secondary">{reward.description}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="vsp-text-xs vsp-font-bold mpos-text-brand">
                            {reward.pointCost.toLocaleString('vi-VN')} điểm
                          </p>
                          {reward.quantity != null && (
                            <p className="vsp-text-xxxs vsp-font-regular mpos-text-muted">Còn: {reward.quantity}</p>
                          )}
                        </div>
                      </div>
                      <motion.button
                        whileTap={canRedeem ? { scale: 0.97 } : undefined}
                        onClick={() => canRedeem && handleRedeemReward(reward)}
                        disabled={!canRedeem}
                        className={`mt-3 w-full py-2.5 rounded-xl vsp-text-xs vsp-font-bold ${canRedeem ? 'mpos-redeem-btn--available' : 'mpos-redeem-btn'}`}
                      >
                        {canRedeem ? 'Đổi ngay' : 'Không đủ điểm'}
                      </motion.button>
                    </div>
                  );
                })
              )}
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>

      {/* ============== PROMOTION MODAL ============== */}
      <AnimatePresence>
        {isPromotionModalOpen && (
          <BottomSheet onClose={() => setIsPromotionModalOpen(false)} title="Chọn khuyến mãi">
            <div className="p-5 space-y-3 flex-1 overflow-y-auto">
              {promotionSuggestions.length === 0 ? (
                <div className="text-center py-8">
                  <Percent className="w-12 h-12 mx-auto opacity-30 mpos-text-muted" />
                  <p className="vsp-text-sm vsp-font-regular mt-2 mpos-text-muted">Không có khuyến mãi phù hợp</p>
                </div>
              ) : (
                promotionSuggestions.map(({ promotion: promo, result }) => {
                  const sel = selectedPromotions.some(p => p.id === promo.id);
                  return (
                    <motion.button
                      key={promo.id}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => handleTogglePromotion(promo)}
                      className={`w-full p-3 text-left mpos-promo-item${sel ? ' mpos-promo-item--selected' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="vsp-text-base vsp-font-bold mpos-text-primary">{promo.name}</h4>
                            <span
                              className="vsp-text-xxxs vsp-font-bold px-2 py-0.5 rounded-full mpos-savings-badge"
                            >
                              -{formatVnd(result.totalDiscount)}
                            </span>
                          </div>
                          {promo.description && (
                            <p className="vsp-text-xs vsp-font-regular mt-1 mpos-text-secondary">{promo.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(promo.priority ?? 0) > 0 && (
                              <span className="vsp-text-xxxs px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 vsp-font-medium">
                                Ưu tiên {promo.priority}
                              </span>
                            )}
                            {(promo.minOrderValue ?? 0) > 0 && (
                              <span className="vsp-text-xxxs px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 vsp-font-medium">
                                Đơn tối thiểu {formatVnd(promo.minOrderValue ?? 0)}
                              </span>
                            )}
                            {promo.stackable && (
                              <span className="vsp-text-xxxs px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 vsp-font-medium">
                                Cộng dồn
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${sel ? 'mpos-checkbox--checked' : 'mpos-checkbox'}`}
                        >
                          {sel && <Check className="w-3.5 h-3.5 mpos-check-icon" strokeWidth={3} />}
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
            <div className="p-5 pt-2 mpos-modal-footer">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsPromotionModalOpen(false)}
                className="w-full py-3 rounded-2xl vsp-font-bold vsp-text-sm text-white mpos-promo-confirm-btn"
              >
                Xác nhận ({selectedPromotions.length} KM)
              </motion.button>
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>

      {/* ============== CUSTOMER SEARCH MODAL ============== */}
      <AnimatePresence>
        {isCustomerSearchOpen && (
          <CustomerSearchModal
            onSearchCustomers={supabaseService.searchCustomers}
            onSelectCustomer={handleSelectCustomer}
            onClose={() => setIsCustomerSearchOpen(false)}
            onOpenQuickAdd={() => { setIsCustomerSearchOpen(false); setIsQuickAddCustomerOpen(true); }}
          />
        )}
      </AnimatePresence>

      {/* ============== QUICK ADD CUSTOMER MODAL ============== */}
      <AnimatePresence>
        {isQuickAddCustomerOpen && (
          <CenterModal onClose={() => setIsQuickAddCustomerOpen(false)}>
            <div className="p-5">
              <h3 className="vsp-text-base vsp-font-bold mb-4 mpos-text-primary">
                Thêm khách hàng nhanh
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Tên khách hàng *"
                  value={quickAddForm.name}
                  onChange={(e) => setQuickAddForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 outline-none vsp-text-sm vsp-font-regular mpos-modal-input"
                  autoFocus
                />
                <input
                  type="tel"
                  placeholder="Số điện thoại"
                  value={quickAddForm.phone}
                  onChange={(e) => setQuickAddForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 outline-none vsp-text-sm vsp-font-regular mpos-modal-input"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsQuickAddCustomerOpen(false)}
                    className="flex-1 py-3 rounded-2xl vsp-text-sm vsp-font-bold mpos-btn-secondary"
                  >
                    Hủy
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleQuickAddCustomer}
                    className="flex-1 py-3 rounded-2xl vsp-text-sm vsp-font-bold text-white mpos-btn-primary"
                  >
                    Thêm
                  </motion.button>
                </div>
              </div>
            </div>
          </CenterModal>
        )}
      </AnimatePresence>

      {/* ============== CUSTOMER ORDERS MODAL ============== */}
      <AnimatePresence>
        {isCustomerOrdersOpen && activeCustomer && (
          <CustomerOrdersModal
            customer={activeCustomer}
            onClose={() => setIsCustomerOrdersOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ============== CONFIRM CLEAR CART ============== */}
      <AnimatePresence>
        {showClearCartConfirm && (
          <CenterModal onClose={() => setShowClearCartConfirm(false)}>
            <div className="p-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 mpos-danger-circle"
              >
                <Trash2 className="w-7 h-7 mpos-text-danger" />
              </div>
              <h3 className="vsp-text-17px vsp-font-bold text-center mpos-text-primary">
                Xóa toàn bộ giỏ hàng?
              </h3>
              <p className="vsp-text-sm vsp-font-regular text-center mt-2 mpos-text-secondary">
                Hành động này sẽ xóa hết sản phẩm và quà đã đổi.
              </p>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowClearCartConfirm(false)}
                  className="flex-1 py-3 rounded-2xl vsp-text-sm vsp-font-bold mpos-btn-secondary"
                >
                  Hủy
                </button>
                <button
                  onClick={clearAllCart}
                  className="flex-1 py-3 rounded-2xl vsp-text-sm vsp-font-bold text-white mpos-btn-danger"
                >
                  Xóa hết
                </button>
              </div>
            </div>
          </CenterModal>
        )}
      </AnimatePresence>

      {/* ============== BARCODE SCANNER ============== */}
      <BarcodeScannerFix
        isOpen={isScannerOpen}
        onScanSuccess={async (code: string) => {
          try {
            const product = await supabaseService.getProductByBarcode(code);
            if (product) {
              addToCart(product);
            } else {
              showToast('Không tìm thấy sản phẩm', 'error');
            }
          } catch (err) {
            console.error('Barcode lookup error:', err);
            showToast('Lỗi tìm sản phẩm', 'error');
          }
        }}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}

/* =========================================================
   SUB-COMPONENT: SwipeableCartItem (swipe-to-delete + stepper)
   ========================================================= */
interface SwipeableCartItemProps {
  item: CartItem;
  isInvalid: boolean;
  onUpdate: (itemId: string, updates: Record<string, any>) => void;
  onRemove: (itemId: string) => void;
}

function SwipeableCartItem({ item, isInvalid, onUpdate, onRemove }: SwipeableCartItemProps) {
  const [bounceKey, setBounceKey] = useState(0);
  const lineTotal = item.price * item.cartQuantity;

  const handleDragEnd = (_e: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      onRemove(item.id);
    }
  };

  const dec = () => {
    onUpdate(item.id, { cartQuantity: Math.max(1, item.cartQuantity - 1) });
    setBounceKey(k => k + 1);
  };
  const inc = () => {
    onUpdate(item.id, { cartQuantity: item.cartQuantity + 1 });
    setBounceKey(k => k + 1);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="relative overflow-hidden"
    >
      {/* Red delete background revealed on swipe */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-6 mpos-swipe-delete-bg"
      >
        <Trash2 className="w-5 h-5 mpos-text-danger" />
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        className="relative flex items-center gap-3 px-4 py-2.5 bg-white mpos-swipe-content"
      >
        {/* Thumbnail */}
        <div
          className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center overflow-hidden mpos-thumb"
        >
          {item.image ? (
            <img src={item.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <Package className="w-6 h-6 mpos-text-muted" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold leading-tight mpos-item-name${isInvalid ? ' mpos-item-name--invalid' : ''}`}
          >
            {item.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs-caption mpos-text-muted">
              {item.barcode || item.code}
            </span>
            <span className="text-xs font-semibold mpos-text-brand">
              {formatVnd(item.price)}
            </span>
          </div>
          {isInvalid && (
            <p className="text-xs-caption mt-0.5 flex items-center gap-1 mpos-text-danger">
              <AlertTriangle className="w-3 h-3" /> Vượt tồn kho
            </p>
          )}
          {item.lots && item.lots.length > 0 && (
            <select
              value={item.selectedLot?.id || ''}
              onChange={(e) => {
                const lot = item.lots?.find(l => l.id === e.target.value);
                onUpdate(item.id, { selectedLot: lot });
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-xs-caption mt-1 px-1.5 py-0.5 outline-none mpos-lot-select"
            >
              <option value="">Chọn lô</option>
              {sortLotsByFifoExpiry(getAvailableLots(item.lots)).map(lot => (
                <option key={lot.id} value={lot.id}>
                  Lô {lot.code} (Tồn {lot.quantity}{item.unit ? ` ${item.unit}` : ''}{lot.expiryDate ? ` - HSD ${new Date(lot.expiryDate).toLocaleDateString('vi-VN')}` : ''})
                </option>
              ))}
            </select>
          )}
          {item.conversionUnits && item.conversionUnits.length > 0 && (
            <select
              value={item.selectedUnit?.name || item.unit}
              onChange={(e) => {
                const unitName = e.target.value;
                const conv = (item.conversionUnits || []).find(u => u.name === unitName);
                onUpdate(item.id, { selectedUnit: conv, price: conv ? conv.price : item.price });
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-xs-caption mt-1 ml-1 px-1.5 py-0.5 outline-none mpos-unit-select"
            >
              <option value={item.unit}>{item.unit}</option>
              {item.conversionUnits.map(u => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Right column: stepper + line total + X */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <p className="text-sm font-bold mpos-text-primary">
            {formatVnd(lineTotal)}
          </p>
          <motion.div
            key={bounceKey}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-0.5 mpos-stepper"
          >
            <button
              onClick={dec}
              className="w-6 h-6 rounded-md flex items-center justify-center bg-white"
              aria-label="Giảm"
            >
              <Minus className="w-3 h-3 mpos-text-secondary" />
            </button>
            <span className="px-2 text-sm font-bold min-w-[20px] text-center mpos-text-primary">
              {item.cartQuantity}
            </span>
            <button
              onClick={inc}
              className="w-6 h-6 rounded-md flex items-center justify-center bg-white"
              aria-label="Tăng"
            >
              <Plus className="w-3 h-3 mpos-text-brand" />
            </button>
          </motion.div>
        </div>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onRemove(item.id)}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mpos-icon-btn-danger"
          aria-label="Xóa"
        >
          <X className="w-3.5 h-3.5 mpos-text-danger" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   SUB-COMPONENT: BottomSheet wrapper
   ========================================================= */
interface BottomSheetProps {
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
function BottomSheet({ onClose, title, children }: BottomSheetProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] mpos-backdrop"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed left-0 right-0 bottom-0 z-[210] bg-white h-[92vh] max-h-[92vh] mpos-sheet"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full mpos-handle" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pt-2 pb-1">
            <h3 className="text-lg font-bold mpos-text-primary">{title}</h3>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center mpos-icon-btn"
            >
              <X className="w-4 h-4 mpos-text-secondary" />
            </motion.button>
          </div>
        )}
        <div className="flex-1 overflow-hidden">{children}</div>
      </motion.div>
    </>
  );
}

/* =========================================================
   SUB-COMPONENT: CenterModal
   ========================================================= */
interface CenterModalProps {
  onClose: () => void;
  children: React.ReactNode;
}
function CenterModal({ onClose, children }: CenterModalProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] mpos-backdrop"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-sm pointer-events-auto mpos-center-modal"
        >
          {children}
        </motion.div>
      </div>
    </>
  );
}

/* =========================================================
   SUB-COMPONENT: CustomerSearchModal
   ========================================================= */
interface CustomerSearchModalProps {
  onSearchCustomers: (term: string) => Promise<Customer[]>;
  onSelectCustomer: (c: Customer) => void;
  onClose: () => void;
  onOpenQuickAdd: () => void;
}
function CustomerSearchModal({ onSearchCustomers, onSelectCustomer, onClose, onOpenQuickAdd }: CustomerSearchModalProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRequestId = useRef(0);

  useEffect(() => {
    const term = debouncedSearch.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }

    const requestId = ++searchRequestId.current;
    setIsSearching(true);

    onSearchCustomers(term)
      .then((results) => {
        if (requestId === searchRequestId.current) {
          setSearchResults(results);
          setIsSearching(false);
        }
      })
      .catch((err) => {
        console.error('MobilePOS customer search error:', err);
        if (requestId === searchRequestId.current) {
          setSearchResults([]);
          setIsSearching(false);
        }
      });
  }, [debouncedSearch, onSearchCustomers]);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    return searchResults;
  }, [search, searchResults]);

  return (
    <BottomSheet onClose={onClose} title="Tìm khách hàng">
      <div className="px-5 pb-3">
        <div
          className="flex items-center gap-2 px-3 py-2.5 mpos-customer-search-box"
        >
          <Search className="w-4 h-4 mpos-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tên, SĐT, mã KH..."
            className="flex-1 bg-transparent outline-none text-sm mpos-search-input"
            autoFocus
          />
        </div>
        <button
          onClick={onOpenQuickAdd}
          className="w-full mt-2 py-2.5 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold mpos-add-customer-btn"
        >
          <Plus className="w-4 h-4" /> Thêm khách hàng mới
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
        {isSearching ? (
          <div className="text-center py-8 text-sm mpos-text-muted">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Đang tìm...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-sm mpos-text-muted">
            Không tìm thấy khách hàng
          </div>
        ) : (
          filtered.map(c => (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.985 }}
              onClick={() => onSelectCustomer(c)}
              className="w-full flex items-center gap-3 p-3 text-left mpos-customer-item"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mpos-avatar"
              >
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate mpos-text-primary">{c.name}</p>
                <p className="text-xs-caption mpos-text-secondary">
                  {c.phone || 'Không có SĐT'} {c.code ? `· ${c.code}` : ''}
                </p>
              </div>
              {c.debt > 0 && (
                <span
                  className="text-xs-caption font-bold px-2 py-0.5 rounded-full mpos-debt-badge"
                >
                  Nợ
                </span>
              )}
              <ChevronRight className="w-4 h-4 mpos-text-muted" />
            </motion.button>
          ))
        )}
      </div>
    </BottomSheet>
  );
}

/* =========================================================
   SUB-COMPONENT: CustomerOrdersModal
   ========================================================= */
interface CustomerOrdersModalProps {
  customer: Customer;
  onClose: () => void;
}
function CustomerOrdersModal({ customer, onClose }: CustomerOrdersModalProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await supabaseService.getOrders();
        if (cancelled) return;
        const filtered = (data || []).filter((o: any) =>
          o.customerId === customer.id || o.customer_id === customer.id
        );
        setOrders(filtered);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [customer.id]);

  return (
    <BottomSheet onClose={onClose} title="Lịch sử mua hàng">
      <div className="px-5 pb-2">
        <div
          className="p-3 rounded-2xl mpos-customer-info-box"
        >
          <p className="text-sm font-bold mpos-text-primary">{customer.name}</p>
          <p className="text-xs mpos-text-secondary">{customer.phone || 'Không có SĐT'}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2 mt-2">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mpos-text-brand" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-sm mpos-text-muted">
            Chưa có đơn hàng nào
          </div>
        ) : (
          orders.map((order: any) => (
            <div
              key={order.id}
              className="p-3 mpos-order-card"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs-caption mpos-text-secondary">
                  {new Date(order.date).toLocaleDateString('vi-VN')}
                </span>
                <span className="text-sm font-bold mpos-text-brand">
                  {(order.totalAmount || 0).toLocaleString('vi-VN')}đ
                </span>
              </div>
              {order.items && (
                <p className="mt-1 text-xs mpos-text-secondary">
                  {order.items.slice(0, 3).map((it: any, i: number) =>
                    `${it.productName} x${it.quantity}${i < Math.min(2, order.items.length - 1) ? ', ' : ''}`
                  ).join('')}
                  {order.items.length > 3 ? '...' : ''}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </BottomSheet>
  );
}

export default MobilePOS;