import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Product, Customer, Invoice, CartItem, Promotion, Reward, AppSettings, AppliedPromotion } from '../types';
import { applyPromotions, applyBestPromotions, suggestPromotions } from '../utils/promotionUtils';
import { supabaseService } from '../services/supabaseService';
import { useDebounce } from './useDebounce';
import { getAvailableLots, sortLotsByFifoExpiry, validateLotQuantity } from '../utils/lotUtils';

interface UsePOSProps {
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  activeTabId: number;
  promotions: Promotion[];
  rewards: Reward[];
  appSettings: AppSettings;
  onUpdateInvoices: (invoices: Invoice[]) => void;
  onSetActiveTabId: (id: number) => void;
  onCheckout: (invoiceId: number, paymentMethod: string, amountPaid: number, customerId?: string, appliedPromotions?: Promotion[]) => void;
  onAddCustomer: (customer: Customer) => Promise<void>;
}

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export function usePOS({
  products, customers, invoices, activeTabId, promotions, rewards, appSettings,
  onUpdateInvoices, onSetActiveTabId, onCheckout, onAddCustomer
}: UsePOSProps) {
  // Active Invoice
  const activeInvoice = useMemo(() => invoices.find(i => i.id === activeTabId) || invoices[0], [invoices, activeTabId]);
  const activeCart = useMemo(() => activeInvoice?.cart || [], [activeInvoice]);
  const activeCustomerId = activeInvoice?.customerId || '';

  // Phase 1 — single-record cache (thay thế .find trên prop rỗng)
  const [customerCache, setCustomerCache] = useState<Map<string, Customer>>(new Map());
  const [productCache, setProductCache] = useState<Map<string, Product>>(new Map());
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

  // Prefetch products in cart so lot picker works without global products[]
  useEffect(() => {
    const productIds = Array.from(new Set(activeCart.map((item: any) => item.id).filter((id: string) => !!id)));
    const missingIds = productIds.filter(id => !productCache.has(id));
    if (missingIds.length === 0) return;
    Promise.all(missingIds.map(id => supabaseService.getProductById(id)))
      .then(products => {
        setProductCache(prev => {
          const next = new Map(prev);
          products.forEach(p => { if (p) next.set(p.id, p); });
          return next;
        });
      })
      .catch(err => console.error('Error prefetching cart products:', err));
  }, [activeCart, productCache]);

  // Search States
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showProductResults, setShowProductResults] = useState(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Server-side Product Search
  const debouncedProductSearch = useDebounce(productSearchTerm, 400);
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const productSearchRequestId = useRef(0);

  // Goi searchProducts len server moi khi debouncedProductSearch thay doi
  useEffect(() => {
    const term = debouncedProductSearch.trim();
    if (!term) {
      setProductSearchResults([]);
      return;
    }

    const requestId = ++productSearchRequestId.current;
    setIsSearchingProduct(true);

    supabaseService.searchProducts(term, 100)
      .then((results) => {
        // Chi cap nhat neu day la request moi nhat
        if (requestId === productSearchRequestId.current) {
          setProductSearchResults(results);
          setIsSearchingProduct(false);
        }
      })
      .catch((err) => {
        console.error('Product search error:', err);
        if (requestId === productSearchRequestId.current) {
          setProductSearchResults([]);
          setIsSearchingProduct(false);
        }
      });
  }, [debouncedProductSearch]);

  // Server-side Customer Search
  const debouncedCustomerSearch = useDebounce(customerSearchTerm, 400);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const customerSearchRequestId = useRef(0);

  // Goi searchCustomers len server moi khi debouncedCustomerSearch thay doi
  useEffect(() => {
    const term = debouncedCustomerSearch.trim();
    if (!term) {
      setFilteredCustomers([]);
      return;
    }

    const requestId = ++customerSearchRequestId.current;
    setIsSearchingCustomer(true);

    supabaseService.searchCustomers(term)
      .then((results) => {
        // Chi cap nhat neu day la request moi nhat
        if (requestId === customerSearchRequestId.current) {
          setFilteredCustomers(results);
          setIsSearchingCustomer(false);
        }
      })
      .catch((err) => {
        console.error('Customer search error:', err);
        if (requestId === customerSearchRequestId.current) {
          setFilteredCustomers([]);
          setIsSearchingCustomer(false);
        }
      });
  }, [debouncedCustomerSearch]);

  // UI Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [isQuickAddCustomerOpen, setIsQuickAddCustomerOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAdvancedCustomerSearchOpen, setIsAdvancedCustomerSearchOpen] = useState(false);
  const [isCustomerOrdersOpen, setIsCustomerOrdersOpen] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Promotions
  const [selectedPromotions, setSelectedPromotions] = useState<Promotion[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Quick Add Customer
  const [quickAddForm, setQuickAddForm] = useState({ name: '', phone: '' });

  // Loading
  const [isSearching, setIsSearching] = useState(false);

  // Refs
  const productSearchRef = useRef<HTMLDivElement>(null);
  const customerSearchRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filtered Products — server-side results from searchProducts
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm.trim()) return [];
    return productSearchResults;
  }, [productSearchTerm, productSearchResults]);

  // Search product by barcode (for scanner)
  const searchProductByBarcode = useCallback(async (barcode: string): Promise<Product | null> => {
    if (!barcode) return null;
    return supabaseService.getProductByBarcode(barcode);
  }, []);

  // Cart Total
  const cartTotal = useMemo(() => {
    return activeCart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
  }, [activeCart]);

  // Total Quantity
  const totalQuantity = useMemo(() => {
    return activeCart.reduce((sum, item) => sum + item.cartQuantity, 0);
  }, [activeCart]);

  // Phase 9 — Promotion Discount: áp đúng thứ tự ưu tiên + không cộng dồn sai
  const bestPromotionResult = useMemo(() => {
    return applyBestPromotions(selectedPromotions, activeCart, activeCustomer || undefined);
  }, [selectedPromotions, activeCart, activeCustomer]);

  const totalPromotionDiscount = bestPromotionResult.totalDiscount;
  const appliedPromotionDetails = bestPromotionResult.appliedPromotions;
  const actuallyAppliedPromotions = bestPromotionResult.appliedPromotionsFull;

  const finalTotal = Math.max(0, cartTotal - totalPromotionDiscount);

  // Promotion Suggestions — Phase 9: sắp xếp theo ưu tiên + điều kiện
  const promotionSuggestions = useMemo(() => {
    if (activeCart.length === 0 || promotions.length === 0) return [];
    const raw = suggestPromotions(promotions, activeCart, activeCustomer || undefined);
    return raw.map(item => ({
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
  }, [activeCart, activeCustomer, promotions]);

  // Update Invoice
  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    onUpdateInvoices(invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
  }, [invoices, onUpdateInvoices]);

  // Cart Operations
  // Phase 7.1: chặn cộng vượt tồn ngay tại client để UX nhanh hơn
  // (server vẫn chặn cứng ở RPC process_checkout — đây chỉ là UX guard).
  // Phase 5b: tự động chọn lô theo FIFO/HSD; chặn nếu vượt tồn lô đã chọn.
  const addToCart = useCallback((product: Product) => {
    const inv = activeInvoice;
    if (!inv) return;

    const productHasLots = product.hasBatches || (product.lots && product.lots.length > 0);
    const availableLots = productHasLots ? sortLotsByFifoExpiry(getAvailableLots(product.lots)) : [];

    if (productHasLots && availableLots.length === 0) {
      showToast(`Sản phẩm "${product.name}" đã hết hàng trong các lô`, 'error');
      return;
    }

    const existing = inv.cart.find(item => item.id === product.id);
    const currentQtyInCart = existing ? existing.cartQuantity : 0;
    const nextQtyInCart = currentQtyInCart + 1;

    if (typeof product.quantity === 'number' && nextQtyInCart > product.quantity) {
      showToast(`Hết hàng "${product.name}" (còn ${product.quantity})`, 'error');
      return;
    }

    if (existing) {
      const selectedLot = (existing as any).selectedLot;
      if (selectedLot) {
        const check = validateLotQuantity(selectedLot, nextQtyInCart);
        if (!check.valid) {
          showToast(
            `Lô ${selectedLot.code || selectedLot.lotNumber} chỉ còn ${check.max} ${product.unit || 'SP'}. Vui lòng đổi lô hoặc giảm số lượng.`,
            'error'
          );
          return;
        }
      }
      updateInvoice({
        ...inv,
        cart: inv.cart.map(item =>
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        )
      });
    } else {
      const newItem: CartItem = {
        ...product,
        cartQuantity: 1,
        selectedUnit: undefined,
        selectedLot: availableLots[0],
      };
      updateInvoice({ ...inv, cart: [...inv.cart, newItem] });
    }
    setShowProductResults(false);
    setProductSearchTerm('');
  }, [activeInvoice, updateInvoice]);

  const updateCartItem = useCallback((itemId: string, updates: Partial<CartItem>) => {
    const inv = activeInvoice;
    if (!inv) return;

    const item = inv.cart.find(i => i.id === itemId);
    if (!item) return;

    // Phase 5b: chặn nếu cập nhật số lượng vượt quá tồn của lô đã chọn.
    if (updates.cartQuantity !== undefined && updates.cartQuantity !== null) {
      const selectedLot = (item as any).selectedLot;
      const nextQty = Number(updates.cartQuantity);
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

    updateInvoice({
      ...inv,
      cart: inv.cart.map(cartItem =>
        cartItem.id === itemId ? { ...cartItem, ...updates } : cartItem
      )
    });
  }, [activeInvoice, updateInvoice]);

  // Phase 7.2 + 5b: helper đổi lot cho cart item (UI lot picker gọi hàm này).
  // selectedLot: object ProductLot từ product.lots, hoặc undefined để bỏ chọn.
  // Phase 5b: chặn nếu đổi sang lô có tồn nhỏ hơn số lượng hiện tại;
  // nếu bỏ chọn (undefined) thì tự động chọn lô FIFO/HSD đầu tiên để tránh checkout lỗi.
  const changeCartItemLot = useCallback((itemId: string, selectedLot: any) => {
    const inv = activeInvoice;
    if (!inv) return;
    const item = inv.cart.find(i => i.id === itemId);
    if (!item) return;

    let finalLot = selectedLot;
    if (!finalLot) {
      const available = sortLotsByFifoExpiry(getAvailableLots(item.lots));
      finalLot = available[0];
    }

    if (finalLot) {
      const check = validateLotQuantity(finalLot, item.cartQuantity || 1);
      if (!check.valid) {
        showToast(
          `Lô ${finalLot.code || finalLot.lotNumber} chỉ còn ${check.max} ${item.unit || 'SP'}. Vui lòng giảm số lượng trước khi đổi lô.`,
          'error'
        );
        return;
      }
    }

    updateInvoice({
      ...inv,
      cart: inv.cart.map(cartItem =>
        cartItem.id === itemId ? { ...cartItem, selectedLot: finalLot } as any : cartItem
      )
    });
  }, [activeInvoice, updateInvoice]);

  // Phase 7.2 + 5b: lấy danh sách lot khả dụng cho 1 product trong cart
  // (dùng cho dropdown lot picker — chỉ trả về lot quantity > 0, sắp xếp FIFO/HSD).
  const getAvailableLotsForProduct = useCallback((productId: string) => {
    const product = productCache.get(productId);
    if (!product || !product.lots || product.lots.length === 0) return [];
    return sortLotsByFifoExpiry(getAvailableLots(product.lots));
  }, [productCache]);

  const removeCartItem = useCallback((itemId: string) => {
    const inv = activeInvoice;
    if (!inv) return;
    updateInvoice({ ...inv, cart: inv.cart.filter(item => item.id !== itemId) });
  }, [activeInvoice, updateInvoice]);

  // Customer
  const handleSelectCustomer = useCallback((customer: Customer) => {
    const inv = activeInvoice;
    if (!inv) return;
    updateInvoice({ ...inv, customerId: customer.id });
    setIsCustomerDropdownOpen(false);
    setCustomerSearchTerm('');
  }, [activeInvoice, updateInvoice]);

  const handleRemoveCustomer = useCallback(() => {
    const inv = activeInvoice;
    if (!inv) return;
    updateInvoice({ ...inv, customerId: '' });
  }, [activeInvoice, updateInvoice]);

  // Invoice Tabs
  const handleAddTab = useCallback(() => {
    // Tìm ID nhỏ nhất bắt đầu từ 1 chưa được dùng (reset bộ đếm về 1)
    const existingIds = new Set(invoices.map(i => i.id));
    let newId = 1;
    while (existingIds.has(newId)) {
      newId++;
    }
    const newInvoice: Invoice = {
      id: newId,
      name: `Hoa don ${newId}`,
      cart: [],
      customerId: '',
      redeemedRewards: [],
      note: '',
    };
    onUpdateInvoices([...invoices, newInvoice]);
    onSetActiveTabId(newId);
  }, [invoices, onUpdateInvoices, onSetActiveTabId]);

  const handleCloseTab = useCallback((e: React.MouseEvent, tabId: number) => {
    e.stopPropagation();
    if (invoices.length <= 1) return;
    const remaining = invoices.filter(i => i.id !== tabId);
    onUpdateInvoices(remaining);
    if (activeTabId === tabId) {
      onSetActiveTabId(remaining[0].id);
    }
  }, [invoices, activeTabId, onUpdateInvoices, onSetActiveTabId]);

  // Payment
  const handleOpenPayment = useCallback(() => {
    if (activeCart.length === 0) {
      showToast('Gio hang trong!', 'error');
      return;
    }
    setIsPaymentOpen(true);
    setPaymentMethod('cash');
    setAmountPaid('');
    setIsProcessing(false);
  }, [activeCart]);

  // Phase 7.4: cải thiện toast UX — phân biệt rõ lỗi tồn kho / network / business
  // và hiển thị nguyên message tiếng Việt từ server thay vì 'Loi thanh toan' chung chung.
  const showCheckoutError = useCallback((err: any) => {
    const msg = (err?.message || String(err) || '').toLowerCase();
    if (msg.includes('tồn kho không đủ') || msg.includes('hết hàng') || msg.includes('tồn lô')) {
      // Lỗi tồn kho — message từ RPC đã rõ ràng, hiển thị nguyên văn
      showToast(err?.message || 'Tồn kho không đủ', 'error');
    } else if (msg.includes('không tồn tại')) {
      showToast(err?.message || 'Sản phẩm không tồn tại', 'error');
    } else if (msg.includes('failed to fetch') || msg.includes('network')) {
      showToast('Mất kết nối — đơn đã lưu offline, sẽ tự đồng bộ khi online', 'error');
    } else if (err?.message) {
      // Lỗi business khác — message từ server
      showToast(err.message, 'error');
    } else {
      showToast('Lỗi xử lý đơn hàng. Vui lòng thử lại.', 'error');
    }
  }, []);

  // Direct checkout process payment immediately, no confirmation dialog.
  //
  // Phase 12 — Xử lý SỐ TIỀN KHÁCH ĐƯẢ:
  //   1. Ố RNG (không nhập gì)         → CHẶN checkout + toạt yêu cầu nhập
  //   2. = finalTotal                  → Đơn hoàn thành (không ghi nợ)
  //   3. > finalTotal                  → Toạt "Tiền thừa: Xđ" (paid clamp về finalTotal để server không coi là trả dư)
  //   4. < finalTotal (kể cả 0)        → Ghi nợ phần thiếu vào khách
  //   5. < finalTotal nhưng khách = guật → CHẶN: khách vãng lai không được ghi nợ
  const handleDirectCheckout = useCallback(async () => {
    if (activeCart.length === 0) {
      showToast('Giỏ hàng trống!', 'error');
      return;
    }

    // (1) Không được để rỗng — bắt nhập rõ số tiền khách đưa
    const trimmed = (amountPaid ?? '').trim();
    if (trimmed === '') {
      showToast('Vui lòng nhập số tiền khách đưa (nhập 0 nếu muốn ghi nợ toàn bộ).', 'error');
      return;
    }

    const paidInput = parseFloat(trimmed);
    if (!isFinite(paidInput) || paidInput < 0) {
      showToast('Số tiền khách đưa không hợp lệ.', 'error');
      return;
    }

    // (5) Chặn ghi nợ cho khách vãng lai
    const isGuest = !activeInvoice?.customerId || activeInvoice.customerId === 'guest';
    const willHaveDebt = paidInput < finalTotal;
    if (willHaveDebt && isGuest) {
      showToast('Khách vãng lai không được ghi nợ. Vui lòng chọn khách hàng hoặc thu đủ tiền.', 'error');
      return;
    }

    // (3) Tiền thừa: clamp paid về finalTotal để server không lưu paid > total
    const change = paidInput > finalTotal ? paidInput - finalTotal : 0;
    const paid = Math.min(paidInput, finalTotal);

    setIsProcessing(true);
    try {
      await onCheckout(
        activeInvoice!.id,
        paymentMethod,
        paid,
        activeInvoice?.customerId || undefined,
        actuallyAppliedPromotions.length > 0 ? actuallyAppliedPromotions : undefined
      );
      // Sau khi checkout thành công, xoá invoice đã hoàn tất khỏi mảng
      // để tab hóa đơn mới sau đó được reset bộ đếm về 1
      const inv = activeInvoice;
      if (inv) {
        const remaining = invoices.filter(i => i.id !== inv.id);
        if (remaining.length === 0) {
          // Không còn tab nào → tạo tab trống mới với id=1
          const freshInvoice: Invoice = {
            id: 1,
            name: `Hoa don 1`,
            cart: [],
            customerId: '',
            redeemedRewards: [],
            note: '',
          };
          onUpdateInvoices([freshInvoice]);
          onSetActiveTabId(1);
        } else {
          onUpdateInvoices(remaining);
          if (activeTabId === inv.id) {
            onSetActiveTabId(remaining[0].id);
          }
        }
        setSelectedPromotions([]);
      }
      setAmountPaid('');

      // Thông báo kết quả theo từng tình huống
      if (change > 0) {
        showToast(`Thanh toán thành công! Tiền thừa trả khách: ${change.toLocaleString('vi-VN')}đ`, 'success');
      } else if (paid < finalTotal) {
        const debt = finalTotal - paid;
        showToast(`Đã tạo đơn ghi nợ ${debt.toLocaleString('vi-VN')}đ cho khách.`, 'success');
      } else {
        showToast('Thanh toán thành công!', 'success');
      }
    } catch (err) {
      // Phase 7.4: hiển thị message lỗi chi tiết (tồn kho không đủ, ...)
      showCheckoutError(err);
    } finally {
      setIsProcessing(false);
    }
  }, [activeCart, activeInvoice, paymentMethod, amountPaid, finalTotal, actuallyAppliedPromotions, onCheckout, updateInvoice, onUpdateInvoices, onSetActiveTabId, invoices, activeTabId, showCheckoutError]);

  // Phase 12 — Modal Payment dùng cùng ngữ nghĩa với handleDirectCheckout:
  //   - Rỗng → chặn, bắt nhập rõ (0 = ghi nợ toàn bộ)
  //   - Dư → toạt tiền thừa, clamp về finalTotal
  //   - Thiếu → ghi nợ phần thiếu (nếu khách không vãng lai)
  const handlePaymentConfirm = useCallback(async () => {
    const trimmed = (amountPaid ?? '').trim();
    if (trimmed === '') {
      showToast('Vui lòng nhập số tiền khách đưa (nhập 0 nếu muốn ghi nợ toàn bộ).', 'error');
      return;
    }
    const paidInput = parseFloat(trimmed);
    if (!isFinite(paidInput) || paidInput < 0) {
      showToast('Số tiền khách đưa không hợp lệ.', 'error');
      return;
    }

    const isGuest = !activeInvoice?.customerId || activeInvoice.customerId === 'guest';
    const willHaveDebt = paidInput < finalTotal;
    if (willHaveDebt && isGuest) {
      showToast('Khách vãng lai không được ghi nợ. Vui lòng chọn khách hàng hoặc thu đủ tiền.', 'error');
      return;
    }

    const change = paidInput > finalTotal ? paidInput - finalTotal : 0;
    const paid = Math.min(paidInput, finalTotal);

    setIsProcessing(true);
    try {
      await onCheckout(
        activeInvoice!.id,
        paymentMethod,
        paid,
        activeInvoice?.customerId || undefined,
        actuallyAppliedPromotions.length > 0 ? actuallyAppliedPromotions : undefined
      );
      const inv = activeInvoice;
      if (inv) {
        updateInvoice({ ...inv, cart: [], customerId: '', redeemedRewards: [], note: '' });
        setSelectedPromotions([]);
      }
      setIsPaymentOpen(false);
      setAmountPaid('');

      if (change > 0) {
        showToast(`Thanh toán thành công! Tiền thừa trả khách: ${change.toLocaleString('vi-VN')}đ`, 'success');
      } else if (paid < finalTotal) {
        const debt = finalTotal - paid;
        showToast(`Đã tạo đơn ghi nợ ${debt.toLocaleString('vi-VN')}đ cho khách.`, 'success');
      } else {
        showToast('Thanh toán thành công!', 'success');
      }
    } catch (err) {
      showCheckoutError(err);
    } finally {
      setIsProcessing(false);
    }
  }, [activeInvoice, amountPaid, finalTotal, paymentMethod, actuallyAppliedPromotions, onCheckout, updateInvoice, showCheckoutError]);

  // Rewards
  const handleRedeemReward = useCallback((reward: Reward) => {
    if (!activeCustomer) {
      showToast('Chon khach hang truoc!', 'error');
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
        )
      });
    } else {
      updateInvoice({
        ...inv,
        redeemedRewards: [...inv.redeemedRewards, { rewardId: reward.id, rewardName: reward.name, pointCost: reward.pointCost, quantity: 1 }]
      });
    }
  }, [activeCustomer, activeInvoice, updateInvoice]);

  // Toggle Promotion
  const handleTogglePromotion = useCallback((promo: Promotion) => {
    setSelectedPromotions(prev => {
      const exists = prev.find(p => p.id === promo.id);
      if (exists) return prev.filter(p => p.id !== promo.id);
      return [...prev, promo];
    });
  }, []);

  // Quick Add Customer
  const handleQuickAddCustomer = useCallback(async () => {
    if (!quickAddForm.name.trim()) {
      showToast('Nhap ten khach hang', 'error');
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
      showToast('Them khach hang thanh cong!');
    } catch (err) {
      showToast('Loi khi them khach hang', 'error');
    }
  }, [quickAddForm, onAddCustomer, handleSelectCustomer]);

  // Toast
  function showToast(message: string, type: 'success' | 'error' = 'success') {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // Hide product search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
        setShowProductResults(false);
      }
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F3: Focus customer search
      if (e.key === 'F3') {
        e.preventDefault();
        (document.querySelector<HTMLInputElement>('[data-pos="customer-search"]'))?.focus();
      }
      // F4: Kích hoạt chế độ quét (cho cả máy quét hồng ngoại và camera)
      if (e.key === 'F4') {
        e.preventDefault();
        setIsScannerOpen(true);
        // Dispatch custom event để useBarcodeCapture kích hoạt
        window.dispatchEvent(new CustomEvent('pos-activate-barcode'));
      }
      // F9: Checkout
      if (e.key === 'F9') {
        e.preventDefault();
        if (activeCart.length > 0) {
          handleDirectCheckout();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCart, handleDirectCheckout]);

  return {
    // Refs
    productSearchRef,
    customerSearchRef,

    // Search
    productSearchTerm, setProductSearchTerm,
    customerSearchTerm, setCustomerSearchTerm,
    showProductResults, setShowProductResults,
    isCustomerDropdownOpen, setIsCustomerDropdownOpen,
    filteredProducts, filteredCustomers,
    productSearchResults, isSearchingProduct,
    isSearching, isSearchingCustomer,
    searchProductByBarcode,

    // Active Invoice
    activeInvoice, activeCart, activeCustomer, activeCustomerId,
    cartTotal, totalQuantity, finalTotal,

    // Cart Operations
    addToCart, updateCartItem, removeCartItem,
    // Phase 7.2: lot picker helpers
    changeCartItemLot, getAvailableLotsForProduct,

    // Customer
    handleSelectCustomer, handleRemoveCustomer,

    // Invoice Tabs
    handleAddTab, handleCloseTab,

    // Payment
    handleOpenPayment, handleDirectCheckout, handlePaymentConfirm,
    isPaymentOpen, setIsPaymentOpen,
    paymentMethod, setPaymentMethod,
    amountPaid, setAmountPaid,
    isProcessing, setIsProcessing,

    // Modals UI
    isRewardModalOpen, setIsRewardModalOpen,
    isPromotionModalOpen, setIsPromotionModalOpen,
    isQuickAddCustomerOpen, setIsQuickAddCustomerOpen,
    isScannerOpen, setIsScannerOpen,
    isAdvancedCustomerSearchOpen, setIsAdvancedCustomerSearchOpen,
    isCustomerOrdersOpen, setIsCustomerOrdersOpen,

    // Promotions
    selectedPromotions, setSelectedPromotions,
    handleTogglePromotion,
    promotionSuggestions, totalPromotionDiscount,
    appliedPromotionDetails, actuallyAppliedPromotions,

    // Rewards
    handleRedeemReward,

    // Quick Add
    quickAddForm, setQuickAddForm,
    handleQuickAddCustomer,

    // Toast
    toast, showToast,

    // Internal
    updateInvoice,
  };
}