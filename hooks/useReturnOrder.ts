import { useState, useCallback, useMemo } from 'react';

import { 
  ReturnOrder, 
  Order, 
  Customer,
  AppSettings
} from '../types';
import { supabaseService } from '../services/supabaseService';
import {
  getReturnFeeConfig,
  computeReturnFee,
  classifyPaymentMethod,
  ReturnFeeResult,
} from '../utils/returnFeeEngine';
import { generateInvoiceNumber, generateOfflineInvoiceNumber } from '../utils/invoiceNumber';


// Local type for return order items (not exported from types.ts)
interface ReturnOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitName?: string;
  unitPrice: number;
  subtotal: number;
  reason?: string;
  lotId?: string;
  lotCode?: string;
}

interface ReturnFormItem {
  productId: string;
  productName: string;
  quantity: number;
  availableQuantity: number;
  unitName: string;
  unitPrice: number;
  subtotal: number;
  reason: string;
  lotId?: string;
  lotCode?: string;
}

interface ReturnFormData {
  originalOrder: Order | null;
  customer: Customer | null;
  items: ReturnFormItem[];
  totalRefundAmount: number;
  debtReduction: number;
  cashRefund: number;
  reason: string;
  note: string;
}

interface ReturnFilters {
  startDate: string;
  endDate: string;
  returnId: string;
  customerName: string;
  status: string;
}

interface UseReturnOrderReturn {
  returnOrders: ReturnOrder[];
  returnOrderItems: ReturnOrderItem[];
  loading: boolean;
  error: string | null;
  formData: ReturnFormData;

  // Return fee
  feeResult: ReturnFeeResult | null;        // Kết quả tính phí cho phiếu đang tạo
  paymentClass: 'debt' | 'cash' | 'transfer'; // Phương thức thanh toán của đơn gốc

  // Detail & Cancel state
  selectedReturnOrder: ReturnOrder | null;
  detailLoading: boolean;
  detailError: string | null;


  // CRUD
  fetchReturnOrders: () => Promise<void>;
  fetchReturnOrdersByOrderId: (orderId: string) => Promise<void>;
  initializeFromOrder: (order: Order, customer: Customer | null) => void;
  updateReturnItem: (productId: string, updates: Partial<ReturnFormItem>) => void;
  removeReturnItem: (productId: string) => void;
  setReason: (reason: string) => void;
  setNote: (note: string) => void;
  setDebtReduction: (amount: number) => void;
  setCashRefund: (amount: number) => void;
  submitReturn: () => Promise<ReturnOrder | null>;
  toggleItemSelection: (productId: string) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
  selectedItemIds: string[];

  // NEW: Detail & Cancel
  fetchReturnOrderDetail: (id: string) => Promise<void>;
  clearSelectedReturnOrder: () => void;
  cancelReturnOrder: (id: string) => Promise<boolean>;

  // PHASE 4 (M2): Đổi-Trả hàng atomic (return + exchange order trong 1 transaction)
  submitExchange: (payload: {
    exchangeItems: { productId: string; productName: string; code: string; unitName: string; unitPrice: number; quantity: number; subtotal: number; lotId?: string; lotCode?: string }[];
    exchangeTotal: number;
    paymentMethod: 'cash' | 'transfer';
    isDelivery: boolean;
    actualAmount: number;
  }) => Promise<{ returnOrder: ReturnOrder | null; exchangeOrderId: string | null } | null>;

  // Aliases to support ReturnOrders.tsx component
  formState: ReturnFormData;
  formItems: ReturnFormItem[];
  setFormState: (overrides: Partial<ReturnFormData>) => void;
  updateItem: (productId: string, updates: Partial<ReturnFormItem>) => void;

  // Pagination & Filters
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  filters: ReturnFilters;
  setCurrentPage: (page: number) => void;
  setFilters: (overrides: Partial<ReturnFilters>) => void;
  resetFilters: () => void;
  fetchReturnOrdersPaginated: () => Promise<void>;
}

const initialFormData: ReturnFormData = {
  originalOrder: null,
  customer: null,
  items: [],
  totalRefundAmount: 0,
  debtReduction: 0,
  cashRefund: 0,
  reason: '',
  note: '',
};

const initialFilters: ReturnFilters = {
  startDate: '',
  endDate: '',
  returnId: '',
  customerName: '',
  status: '',
};

export function useReturnOrder(settings?: AppSettings | null): UseReturnOrderReturn {
  const [returnOrders, setReturnOrders] = useState<ReturnOrder[]>([]);
  const [returnOrderItems, setReturnOrderItems] = useState<ReturnOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReturnFormData>(initialFormData);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Detail & Cancel state
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<ReturnOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Pagination & Filters state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(8);
  const [filters, setFiltersState] = useState<ReturnFilters>(initialFilters);

  const setFilters = useCallback((overrides: Partial<ReturnFilters>) => {
    setFiltersState(prev => ({ ...prev, ...overrides }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters);
    setCurrentPage(1);
  }, []);

  const fetchReturnOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orders = await supabaseService.getReturnOrders();
      setReturnOrders(orders);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách phiếu trả hàng');
      console.error('Error fetching return orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReturnOrdersPaginated = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { returnOrders, totalCount } = await supabaseService.filterReturnOrdersPaginated(
        currentPage,
        pageSize,
        filters.returnId || filters.customerName || undefined,
        {
          fromDate: filters.startDate || undefined,
          toDate: filters.endDate || undefined,
          status: filters.status || undefined
        }
      );
      setReturnOrders(returnOrders);
      setTotalCount(totalCount);
      setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách phiếu trả hàng');
      console.error('Error fetching paginated return orders:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize]);

  const fetchReturnOrdersByOrderId = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const orders = await supabaseService.getReturnOrdersByOrderId(orderId);
      setReturnOrders(orders);
      const allItems: ReturnOrderItem[] = [];
      for (const order of orders) {
        if (order.items) {
          allItems.push(...order.items);
        }
      }
      setReturnOrderItems(allItems);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải phiếu trả hàng');
      console.error('Error fetching return orders by order id:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeFromOrder = useCallback(async (order: Order, customer: Customer | null) => {
    setLoading(true);
    setError(null);
    try {
      const existingReturns = await supabaseService.getReturnOrdersByOrderId(order.id);
      
      const alreadyReturnedMap: Record<string, number> = {};
      for (const ret of existingReturns) {
        if (ret.items) {
          for (const item of ret.items) {
            alreadyReturnedMap[item.productId] = (alreadyReturnedMap[item.productId] || 0) + item.quantity;
          }
        }
      }

      const items: ReturnFormItem[] = order.items.map(item => {
        const alreadyReturned = alreadyReturnedMap[item.productId] || 0;
        const availableQuantity = Math.max(0, item.quantity - alreadyReturned);
        return {
          productId: item.productId,
          productName: item.productName,
          quantity: 0,
          availableQuantity,
          unitName: item.unitName,
          unitPrice: item.price,
          subtotal: 0,
          reason: '',
          lotId: item.lotId,
          lotCode: item.lotCode,
        };
      });

      setFormData({
        originalOrder: order,
        customer,
        items,
        totalRefundAmount: 0,
        debtReduction: 0,
        cashRefund: 0,
        reason: '',
        note: '',
      });
      setSelectedItemIds([]);

      const allReturnedItems: ReturnOrderItem[] = [];
      for (const ret of existingReturns) {
        if (ret.items) {
          for (const item of ret.items) {
            allReturnedItems.push({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitName: item.unitName,
              unitPrice: item.unitPrice,
              subtotal: item.unitPrice * item.quantity,
              reason: (item.reason ?? '') || '',
              lotId: item.lotId,
              lotCode: item.lotCode,
            });
          }
        }
      }
      setReturnOrderItems(allReturnedItems);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi khởi tạo phiếu trả hàng');
      console.error('Error initializing from order:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReturnItem = useCallback((productId: string, updates: Partial<ReturnFormItem>) => {
    setFormData(prev => {
      const items = prev.items.map(item =>
        item.productId === productId ? { ...item, ...updates } : item
      );
      const totalRefundAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      const debtReduction = totalRefundAmount;
      const cashRefund = 0;
      return { ...prev, items, totalRefundAmount, debtReduction, cashRefund };
    });
  }, []);

  const removeReturnItem = useCallback((productId: string) => {
    setFormData(prev => {
      const items = prev.items.filter(item => item.productId !== productId);
      const totalRefundAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      const debtReduction = totalRefundAmount;
      const cashRefund = 0;
      return { ...prev, items, totalRefundAmount, debtReduction, cashRefund };
    });
    setSelectedItemIds(prev => prev.filter(id => id !== productId));
  }, []);

  const setReason = useCallback((reason: string) => {
    setFormData(prev => ({ ...prev, reason }));
  }, []);

  const setNote = useCallback((note: string) => {
    setFormData(prev => ({ ...prev, note }));
  }, []);

  const setDebtReduction = useCallback((debtReduction: number) => {
    setFormData(prev => ({ ...prev, debtReduction }));
  }, []);

  const setCashRefund = useCallback((cashRefund: number) => {
    setFormData(prev => ({ ...prev, cashRefund }));
  }, []);

  const setFormState = useCallback((overrides: Partial<ReturnFormData>) => {
    setFormData(prev => ({ ...prev, ...overrides }));
  }, []);

  const submitReturn = useCallback(async (): Promise<ReturnOrder | null> => {
    if (!formData.originalOrder) {
      setError('Chưa chọn đơn hàng gốc');
      return null;
    }

    // Tính phí trả hàng theo cấu hình + ngày mua
    const gross = formData.totalRefundAmount;
    const config = getReturnFeeConfig(settings);
    const fee = computeReturnFee(gross, formData.originalOrder.date, config);

    // Chặn cứng nếu quá hạn (kể cả admin)
    if (fee.blocked) {
      setError(fee.blockReason || 'Quá hạn trả hàng.');
      return null;
    }

    const pmClass = classifyPaymentMethod(formData.originalOrder);
    const net = fee.netRefundAmount;

    // Phân bổ số tiền hoàn theo phương thức thanh toán của đơn gốc:
    // - Công nợ  → cấn trừ công nợ
    // - Tiền mặt / Chuyển khoản → hoàn tiền mặt
    const debtReduction = pmClass === 'debt' ? net : 0;
    const cashRefund = pmClass === 'debt' ? 0 : net;

    setLoading(true);
    setError(null);
    try {
      const params = {
        originalOrderId: formData.originalOrder.id,
        customerId: formData.customer?.id || '',
        customerName: formData.customer?.name || 'Khách lẻ',
        items: formData.items
          .filter(i => i.quantity > 0)
          .map(i => ({
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            unitName: i.unitName || '',
            unitPrice: i.unitPrice,
            subtotal: i.subtotal,
            reason: i.reason || formData.reason || '',
            lotId: i.lotId,
            lotCode: i.lotCode,
          })),
        totalRefundAmount: net,
        debtReduction,
        cashRefund,
        reason: formData.reason,
        note: formData.note || undefined,
        // Thông tin phí trả hàng
        grossRefundAmount: fee.grossRefundAmount,
        feePercent: fee.feePercent,
        feeAmount: fee.feeAmount,
        daysSincePurchase: fee.daysSincePurchase,
        originalPaymentMethod: pmClass,
      };
      const result = await supabaseService.createReturnOrder(params);
      return result;
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo phiếu trả hàng');
      console.error('Error submitting return order:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [formData, settings]);


  const toggleItemSelection = useCallback((productId: string) => {
    setSelectedItemIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const selectAllItems = useCallback(() => {
    setSelectedItemIds(formData.items.map(item => item.productId));
  }, [formData.items]);

  const deselectAllItems = useCallback(() => {
    setSelectedItemIds([]);
  }, []);

  // ─── Return fee computation (live, phụ thuộc formData + settings) ────────
  const paymentClass = useMemo<'debt' | 'cash' | 'transfer'>(() => {
    return classifyPaymentMethod(formData.originalOrder ?? undefined);
  }, [formData.originalOrder]);

  const feeResult = useMemo<ReturnFeeResult | null>(() => {
    if (!formData.originalOrder || formData.totalRefundAmount === 0) return null;
    const config = getReturnFeeConfig(settings);
    return computeReturnFee(
      formData.totalRefundAmount,
      formData.originalOrder.date,
      config
    );
  }, [formData.originalOrder, formData.totalRefundAmount, settings]);

  const fetchReturnOrderDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const order = await supabaseService.getReturnOrderById(id);
      setSelectedReturnOrder(order);
    } catch (err: any) {
      setDetailError(err.message || 'Lỗi khi tải chi tiết phiếu trả hàng');
      console.error('Error fetching return order detail:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const clearSelectedReturnOrder = useCallback(() => {
    setSelectedReturnOrder(null);
    setDetailError(null);
  }, []);

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 4 (M2) — submitExchange: tạo phiếu trả + đơn đổi mới atomic
  // ═════════════════════════════════════════════════════════════════════
  const submitExchange = useCallback(async (payload: {
    exchangeItems: { productId: string; productName: string; code: string; unitName: string; unitPrice: number; quantity: number; subtotal: number; lotId?: string; lotCode?: string }[];
    exchangeTotal: number;
    paymentMethod: 'cash' | 'transfer';
    isDelivery: boolean;
    actualAmount: number;
  }): Promise<{ returnOrder: ReturnOrder | null; exchangeOrderId: string | null } | null> => {
    // Validate cơ bản
    const hasReturn = !!formData.originalOrder && formData.items.some(i => i.quantity > 0);
    const hasExchange = (payload.exchangeItems || []).length > 0 && payload.exchangeTotal > 0;

    if (!hasReturn && !hasExchange) {
      setError('Phiếu trống: chưa có hàng trả lẫn hàng đổi');
      return null;
    }

    // Tính phí trả hàng (nếu có hàng trả)
    let net = 0;
    let fee = null as ReturnFeeResult | null;
    let pmClass: 'debt' | 'cash' | 'transfer' = 'cash';
    if (hasReturn && formData.originalOrder) {
      const config = getReturnFeeConfig(settings);
      fee = computeReturnFee(formData.totalRefundAmount, formData.originalOrder.date, config);
      if (fee.blocked) {
        setError(fee.blockReason || 'Quá hạn trả hàng.');
        return null;
      }
      net = fee.netRefundAmount;
      pmClass = classifyPaymentMethod(formData.originalOrder);
    }

    // Settlement logic:
    //   R = net (tiền trả sau phí)
    //   B = exchangeTotal (tiền đơn đổi mới)
    //   offset = min(R, B): phần đối trừ trực tiếp giữa 2 đơn
    //   cashDiff = R - B: >0 trả khách, <0 khách phải trả
    //   exchangePaidAmount = max(0, B - offset) (phần khách thực trả tiền mặt cho hàng đổi)
    const R = net;
    const B = payload.exchangeTotal || 0;
    const offset = Math.min(R, B);
    const cashDiff = R - B;
    const exchangePaidAmount = Math.max(0, B - offset);
    const exchangeDebtRecorded = 0; // mặc định không ghi nợ cho đơn đổi

    // Phân bổ phần hoàn của return: theo phương thức gốc
    const debtReduction = pmClass === 'debt' ? net : 0;
    const cashRefund = pmClass === 'debt' ? 0 : net;

    const returnId = hasReturn ? await supabaseService.getReturnOrderAutoCode() : '';
    let exchangeOrderId = '';
    if (hasExchange) {
      try {
        exchangeOrderId = await generateInvoiceNumber();
      } catch (error) {
        console.error('Failed to generate exchange invoice number:', error);
        exchangeOrderId = generateOfflineInvoiceNumber();
      }
    }
    const now = new Date().toISOString();

    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.createExchangeTransaction({
        // Return
        returnId,
        originalOrderId: formData.originalOrder?.id || '',
        customerId: formData.customer?.id || '',
        customerName: formData.customer?.name || 'Khách lẻ',
        returnItems: hasReturn
          ? formData.items.filter(i => i.quantity > 0).map(i => ({
              productId: i.productId,
              productName: i.productName,
              quantity: i.quantity,
              unitName: i.unitName || '',
              unitPrice: i.unitPrice,
              subtotal: i.subtotal,
              reason: i.reason || formData.reason || '',
              lotId: i.lotId,
              lotCode: i.lotCode,
            }))
          : [],
        totalRefundAmount: net,
        grossRefundAmount: fee?.grossRefundAmount ?? formData.totalRefundAmount,
        feePercent: fee?.feePercent ?? 0,
        feeAmount: fee?.feeAmount ?? 0,
        daysSincePurchase: fee?.daysSincePurchase ?? 0,
        originalPaymentMethod: pmClass,
        reason: formData.reason,
        note: formData.note || undefined,
        debtReduction,
        cashRefund,
        // Exchange
        exchangeOrderId,
        exchangeItems: hasExchange
          ? payload.exchangeItems.map(it => ({
              productId: it.productId,
              productName: it.productName,
              quantity: it.quantity,
              unitName: it.unitName,
              unitPrice: it.unitPrice,
              lotId: it.lotId,
              lotCode: it.lotCode,
            }))
          : [],
        exchangeTotal: B,
        exchangePaidAmount,
        exchangeDebtRecorded,
        exchangePaymentMethod: payload.paymentMethod,
        isDelivery: payload.isDelivery,
        // Settlement metadata
        offsetAmount: offset,
        cashDiff,
      });

      // Build return ReturnOrder object cho UI (nếu có)
      const returnOrderObj: ReturnOrder | null = hasReturn
        ? {
            id: returnId,
            originalOrderId: formData.originalOrder?.id || '',
            date: now,
            customerId: formData.customer?.id || '',
            customerName: formData.customer?.name || 'Khách lẻ',
            totalAmount: net,
            totalRefundAmount: net,
            refundMethod: 'cash',
            debtReduction,
            cashRefund,
            reason: formData.reason,
            note: formData.note,
            status: 'completed',
            grossRefundAmount: fee?.grossRefundAmount ?? formData.totalRefundAmount,
            feePercent: fee?.feePercent ?? 0,
            feeAmount: fee?.feeAmount ?? 0,
            daysSincePurchase: fee?.daysSincePurchase ?? 0,
            originalPaymentMethod: pmClass,
            items: formData.items.filter(i => i.quantity > 0).map(i => ({
              productId: i.productId,
              productName: i.productName,
              quantity: i.quantity,
              unitName: i.unitName || '',
              unitPrice: i.unitPrice,
              subtotal: i.subtotal,
              reason: i.reason || formData.reason || '',
              lotId: i.lotId,
              lotCode: i.lotCode,
            })),
            createdAt: now,
            updatedAt: now,
          }
        : null;

      return {
        returnOrder: returnOrderObj,
        exchangeOrderId: result.exchangeOrderId,
      };
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg === 'EXCHANGE_RPC_NOT_AVAILABLE') {
        setError('Chưa cài đặt migration đổi-trả hàng. Vui lòng chạy supabase_migration_create_exchange_transaction.sql trên Supabase.');
        console.warn('[submitExchange] Fallback: RPC chưa migrate. Chỉ tạo phiếu trả qua submitReturn cũ (bỏ qua hàng đổi).');
        // Fallback: nếu có hàng trả → tạo phiếu trả qua đường cũ
        if (hasReturn) {
          const fallback = await submitReturn();
          return { returnOrder: fallback, exchangeOrderId: null };
        }
        return null;
      }
      setError(msg || 'Lỗi xử lý đổi-trả hàng');
      console.error('Error submitting exchange:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [formData, settings, submitReturn]);

  const cancelReturnOrder = useCallback(async (id: string): Promise<boolean> => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const returnOrder = await supabaseService.getReturnOrderById(id);
      if (!returnOrder) {
        setDetailError('Không tìm thấy phiếu trả hàng');
        return false;
      }

      await supabaseService.cancelReturnOrder(id);
      await fetchReturnOrders();
      setSelectedReturnOrder(null);
      return true;
    } catch (err: any) {
      setDetailError(err.message || 'Lỗi khi hủy phiếu trả hàng');
      console.error('Error cancelling return order:', err);
      return false;
    } finally {
      setDetailLoading(false);
    }
  }, [fetchReturnOrders]);

  return {
    returnOrders,
    returnOrderItems,
    loading,
    error,
    formData,

    feeResult,
    paymentClass,

    selectedReturnOrder,
    detailLoading,
    detailError,

    fetchReturnOrders,
    fetchReturnOrdersByOrderId,
    initializeFromOrder,
    updateReturnItem,
    removeReturnItem,
    setReason,
    setNote,
    setDebtReduction,
    setCashRefund,
    submitReturn,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    selectedItemIds,

    fetchReturnOrderDetail,
    clearSelectedReturnOrder,
    cancelReturnOrder,
    submitExchange,

    formState: formData,
    formItems: formData.items,
    setFormState,
    updateItem: updateReturnItem,

    currentPage,
    totalPages,
    totalCount,
    pageSize,
    setPageSize,
    filters,
    setCurrentPage,
    setFilters,
    resetFilters,
    fetchReturnOrdersPaginated,
  };
}