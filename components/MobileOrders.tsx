import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, AppSettings, Customer, Product } from '../types';
import {
  FileText, User, AlertCircle, X, Trash2, Printer, Search, Filter,
  Gift, Box, CheckCircle, ChevronLeft, ChevronRight, SlidersHorizontal,
  Ban, RefreshCw, Wallet
} from 'lucide-react';
import { printOrder } from '../utils/printOrder';
import { supabaseService } from '../services/supabaseService';
import MobileLayout from './MobileLayout';
import { PayDebtModal } from './PayDebtModal';
import './MobileOrders.css';

// ─── Helper: phân loại trạng thái đơn hàng theo 4 nhóm chuẩn ─────────
type OrderStatusKind = 'cancelled' | 'returned' | 'debt' | 'completed';
const getOrderStatusKind = (o: Order): OrderStatusKind => {
  if (o.status === 'cancelled') return 'cancelled';
  if (o.hasReturn) return 'returned';
  if (o.debtRecorded && Number(o.debtRecorded) > 0) return 'debt';
  return 'completed';
};

interface MobileOrdersProps {
  products?: Product[];
  customers?: Customer[];
  onDeleteOrder?: (id: string) => void;
  onPayDebt?: (orderId: string, amount: number) => Promise<void> | void;
  appSettings: AppSettings;
}

const MobileOrders: React.FC<MobileOrdersProps> = ({ products = [], customers = [], onDeleteOrder, onPayDebt, appSettings }) => {
  // Phase 13: state cho modal thanh toán công nợ
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderIdSearch, setOrderIdSearch] = useState('');
  const pageSize = 20;

  // Phase 1 — cache single-record customer / product (thay thế .find trên prop rỗng)
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

  const fetchOrders = async (page: number) => {
    setIsLoading(true);
    try {
      const filters = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        customerName: customerSearch || undefined,
        orderId: orderIdSearch || undefined
      };
      const result = await supabaseService.getOrdersPaginated(page, pageSize, filters);
      setOrders(result.orders as Order[]);
      setTotalCount(result.totalCount);
    } catch (error) {

    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  // Phase 1 — prefetch customer / products for selected order detail
  useEffect(() => {
    if (!selectedOrder) return;
    const tasks: Promise<void>[] = [];
    if (selectedOrder.customerId && !customerCache.has(selectedOrder.customerId)) {
      tasks.push(
        supabaseService.getCustomerById(selectedOrder.customerId).then(c => {
          if (c) setCustomerCache(prev => new Map(prev).set(c.id, c));
        }).catch(() => {})
      );
    }
    const productIds = Array.from(new Set((selectedOrder.items || []).map(it => it.productId).filter((id): id is string => !!id)));
    const missingProductIds = productIds.filter(id => !productCache.has(id));
    if (missingProductIds.length > 0) {
      tasks.push(
        supabaseService.getProductsByIds(missingProductIds).then(products => {
          setProductCache(prev => {
            const next = new Map(prev);
            products.forEach(p => next.set(p.id, p));
            return next;
          });
        }).catch(() => {})
      );
    }
    if (tasks.length > 0) Promise.all(tasks);
  }, [selectedOrder, customerCache, productCache]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchOrders(1);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCustomerSearch('');
    setOrderIdSearch('');
    setCurrentPage(1);
    setIsLoading(true);
    supabaseService.getOrdersPaginated(1, pageSize, {})
      .then((result) => {
        setOrders(result.orders as Order[]);
        setTotalCount(result.totalCount);
      })
      .finally(() => setIsLoading(false));
  };

  const handleDelete = async () => {
    if (selectedOrder && onDeleteOrder) {
      // Phương án A: đơn đã huỷ là read-only
      if (selectedOrder.status === 'cancelled') {
        alert('Đơn hàng này đã ở trạng thái "Đã huỷ". Không thể thao tác thêm.');
        return;
      }
      try {
        await onDeleteOrder(selectedOrder.id);
        setSelectedOrder(null);
        fetchOrders(currentPage);
      } catch (error) {

      }
    }
  };

  const handlePrint = async () => {
    if (selectedOrder) {
      const customer = await ensureCustomer(selectedOrder.customerId || '');
      printOrder(selectedOrder, appSettings, customer ?? undefined);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <MobileLayout>
      <div className="m-bg mord-page">
        {/* Header */}
        <div className="mord-header animate-fade-in-up flex justify-between items-center">
          <div>
            <h2 className="mord-title">Lịch sử đơn hàng</h2>
            <p className="mord-subtitle">{totalCount} đơn hàng</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`mord-filter-btn ${showFilters ? 'mord-filter-btn--active' : 'mord-filter-btn--inactive'}`}
            aria-label="Bộ lọc"
          >
            <SlidersHorizontal className="mord-filter-btn-icon" strokeWidth={2.2} />
          </button>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="m-card mord-filters animate-fade-in-down">
            <div className="mord-filter-grid">
              <div>
                <label className="mord-filter-label">Từ ngày</label>
                <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="mord-filter-label">Đến ngày</label>
                <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mord-filter-label">Mã đơn hàng</label>
              <div className="mord-filter-input-wrap">
                <FileText className="mord-filter-input-icon" />
                <input type="text" placeholder="Tìm mã đơn..." className="input input-icon" value={orderIdSearch} onChange={e => setOrderIdSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
            </div>
            <div>
              <label className="mord-filter-label">Khách hàng</label>
              <div className="mord-filter-input-wrap">
                <Search className="mord-filter-input-icon" />
                <input type="text" placeholder="Tìm tên hoặc SĐT..." className="input input-icon" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
            </div>
            <div className="mord-filter-actions">
              <button onClick={handleSearch} className="btn-primary flex-1 py-2.5">Lọc</button>
              <button onClick={handleClearFilters} className="btn-ghost mord-filter-clear-btn">Xoá</button>
            </div>
          </div>
        )}

        {/* Orders List */}
        {isLoading ? (
          <div className="mord-loading">
            <div className="mord-loading-spinner" />
          </div>
        ) : orders.length === 0 ? (
          <div className="m-card mord-empty animate-fade-in">
            <div className="mord-empty-icon-wrap">
              <FileText className="mord-empty-icon" />
            </div>
            <p className="mord-empty-title">Chưa có đơn hàng nào</p>
            <p className="mord-empty-hint">Đơn hàng sẽ hiển thị ở đây khi bạn bán hàng.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 stagger">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="m-card m-card-interactive mord-card"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="mord-card-top">
                    <div className="mord-card-id-wrap">
                      <div className="mord-card-icon">
                        <FileText className="w-4 h-4" strokeWidth={2.4} />
                      </div>
                      <div>
                        <span className="mord-card-id">#{order.id}</span>
                        <span className="mord-card-date">
                          {new Date(order.date).toLocaleDateString('vi-VN')} • {new Date(order.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {(() => {
                      const kind = getOrderStatusKind(order);
                      if (kind === 'cancelled') {
                        return <span className="mord-status-badge mord-status-badge--cancelled"><Ban className="mord-status-badge-icon" /> Đã huỷ</span>;
                      }
                      if (kind === 'returned') {
                        return <span className="mord-status-badge mord-status-badge--returned"><RefreshCw className="mord-status-badge-icon" /> Trả hàng</span>;
                      }
                      if (kind === 'debt') {
                        return <span className="mord-status-badge mord-status-badge--debt"><Wallet className="mord-status-badge-icon" /> Công nợ</span>;
                      }
                      return <span className="mord-status-badge mord-status-badge--completed"><CheckCircle className="mord-status-badge-icon" /> Đã hoàn thành</span>;
                    })()}
                  </div>
                  <div className="mord-customer-row">
                    <User className="mord-customer-icon" />
                    <span className="mord-customer-name">{order.customerName}</span>
                  </div>
                  <div className="mord-card-stats">
                    <div>
                      <p className="mord-stat-label">Tổng tiền</p>
                      <p className="mord-stat-total m-counter">{order.totalAmount.toLocaleString('vi-VN')} ₫</p>
                    </div>
                    <div className="mord-stat-right">
                      <p className="mord-stat-label">Đã trả</p>
                      <p className="mord-stat-paid m-counter">{order.paidAmount?.toLocaleString('vi-VN')} ₫</p>
                    </div>
                  </div>
                  {Number(order.debtRecorded || 0) > 0 && (
                    <div className="mord-debt-note">
                      <AlertCircle className="mord-debt-note-icon" /> Ghi nợ: <span className="mord-debt-note-value">{Number(order.debtRecorded || 0).toLocaleString('vi-VN')} ₫</span>
                    </div>
                  )}
                  {/* Phase 13: nút Thanh toán công nợ — chỉ hiện khi đơn còn nợ và chưa huỷ */}
                  {onPayDebt && getOrderStatusKind(order) === 'debt' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setPayingOrder(order); }}
                      className="mord-pay-debt-btn"
                    >
                      <Wallet className="mord-pay-debt-btn-icon" /> Thanh toán công nợ
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalCount > pageSize && (
              <div className="m-card mord-pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="mord-page-btn"
                >
                  <ChevronLeft className="mord-page-btn-icon" />
                  Trước
                </button>
                <span className="mord-page-info">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="mord-page-btn"
                >
                  Sau
                  <ChevronRight className="mord-page-btn-icon" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal (Full Screen Mobile) */}
      {selectedOrder && (
        <div className="mord-modal-overlay animate-fade-in">
          <div className="mord-modal">
            {/* Drag handle */}
            <div className="mord-modal-drag">
              <div className="mord-modal-drag-handle" />
            </div>

            {/* Header */}
            <div className="mord-modal-header">
              <div className="mord-modal-header-id-wrap">
                <div className="mord-modal-header-icon">
                  <FileText className="mord-modal-header-icon-svg" strokeWidth={2.4} />
                </div>
                <div>
                  <h3 className="mord-modal-title">#{selectedOrder.id}</h3>
                  <p className="mord-modal-subtitle">
                    {new Date(selectedOrder.date).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="mord-modal-close">
                <X className="mord-modal-close-icon" />
              </button>
            </div>

            {/* Content */}
            <div className="mord-modal-body">
              <div className="mord-modal-grid">
                <div className="mord-info-tile mord-info-tile--customer">
                  <p className="mord-info-tile-label mord-info-tile-label--customer">Khách hàng</p>
                  <p className="mord-info-tile-value">
                    <User className="mord-info-tile-value-icon" /> <span className="mord-info-tile-value-text">{selectedOrder.customerName}</span>
                  </p>
                </div>
                {(() => {
                  const kind = getOrderStatusKind(selectedOrder);
                  const cfg = {
                    cancelled: { tile: 'mord-status-tile--cancelled', label: 'mord-status-tile-label--cancelled', text: 'mord-status-tile-value--cancelled', icon: <Ban className="mord-status-tile-icon" />, name: 'Đã huỷ' },
                    returned:  { tile: 'mord-status-tile--returned',  label: 'mord-status-tile-label--returned',  text: 'mord-status-tile-value--returned',  icon: <RefreshCw className="mord-status-tile-icon" />, name: 'Trả hàng' },
                    debt:      { tile: 'mord-status-tile--debt',      label: 'mord-status-tile-label--debt',      text: 'mord-status-tile-value--debt',      icon: <Wallet className="mord-status-tile-icon" />, name: 'Công nợ' },
                    completed: { tile: 'mord-status-tile--completed', label: 'mord-status-tile-label--completed', text: 'mord-status-tile-value--completed', icon: <CheckCircle className="mord-status-tile-icon" />, name: 'Đã hoàn thành' },
                  }[kind];
                  return (
                    <div className={`mord-info-tile ${cfg.tile}`}>
                      <p className={`mord-info-tile-label ${cfg.label}`}>Trạng thái</p>
                      <p className={`mord-status-tile-value ${cfg.text}`}>
                        {cfg.icon} {cfg.name}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div>
                <h4 className="m-section-title mord-section-title-row">
                  <Box className="mord-section-title-icon" /> Danh sách sản phẩm
                </h4>
                <div className="m-card mord-items-card">
                  {selectedOrder.items?.map((item, idx) => {
                    const product = getProductFromCache(item.productId);
                    const lot = product?.lots?.find(l => l.id === item.lotId || l.code === item.lotCode);
                    const expiryStr = lot?.expiryDate
                      ? new Date(lot.expiryDate).toLocaleDateString('vi-VN')
                      : null;

                    return (
                      <div key={idx} className="mord-item">
                        <div className="mord-item-top">
                          <span className="mord-item-name">{item.productName}</span>
                          <span className="mord-item-total m-counter">{(item.quantity * item.price).toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="mord-item-bottom">
                          <span className="mord-item-qty">{item.quantity} {item.unitName} × {item.price.toLocaleString('vi-VN')}</span>
                          <div className="mord-item-tags">
                            {item.lotCode && (
                              <span className="mord-item-tag mord-item-tag--lot">
                                Lô: {item.lotCode}
                              </span>
                            )}
                            {expiryStr && (
                              <span className="mord-item-tag mord-item-tag--expiry">
                                HSD: {expiryStr}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedOrder.rewardsRedeemed && (selectedOrder.rewardsRedeemed as any).length > 0 && (
                <div>
                  <h4 className="m-section-title mord-section-title-row mord-section-title--reward">
                    <Gift className="mord-section-title-icon" /> Quà tặng đã đổi
                  </h4>
                  <div className="mord-rewards-card">
                    {(selectedOrder.rewardsRedeemed as any).map((reward: any, idx: number) => (
                      <div key={idx} className="mord-reward-row">
                        <span className="mord-reward-name">{reward.rewardName} × {reward.quantity}</span>
                        <span className="mord-reward-cost">{reward.pointCost.toLocaleString('vi-VN')} điểm</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="m-card mord-summary">
                <div className="mord-summary-row">
                  <span className="mord-summary-label">Tổng tiền hàng</span>
                  <span className="mord-summary-value m-counter">{selectedOrder.totalAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="mord-summary-paid-row">
                  <span className="mord-summary-paid-label">Khách đã trả</span>
                  <span className="mord-summary-paid-value m-counter">{(selectedOrder.paidAmount || 0).toLocaleString('vi-VN')} ₫</span>
                </div>
                {Number(selectedOrder.debtRecorded || 0) > 0 && (
                  <div className="mord-summary-debt-row">
                    <span className="mord-summary-debt-label"><AlertCircle className="mord-summary-debt-icon" /> Ghi nợ đơn này</span>
                    <span className="mord-summary-debt-value m-counter">{Number(selectedOrder.debtRecorded || 0).toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer — đơn đã huỷ chỉ cho In + Đóng (read-only) */}
            {selectedOrder.status === 'cancelled' ? (
              <div className="mord-footer">
                <div className="mord-readonly-notice">
                  <Ban className="mord-readonly-notice-icon" />
                  <span>Đơn đã huỷ — chỉ xem & in</span>
                </div>
                <button onClick={handlePrint} className="btn-primary mord-print-btn">
                  <Printer className="mord-print-btn-icon" /> In hoá đơn
                </button>
              </div>
            ) : (
              <div className="mord-footer-actions">
                {/* Phase 13: nút Thanh toán công nợ ở trên, nổi bật — chỉ hiện khi đơn còn nợ */}
                {onPayDebt && getOrderStatusKind(selectedOrder) === 'debt' && (
                  <button
                    onClick={() => setPayingOrder(selectedOrder)}
                    className="mord-detail-pay-btn"
                  >
                    <Wallet className="mord-detail-pay-btn-icon" /> Thanh toán công nợ
                  </button>
                )}
                <div className="mord-action-grid">
                  <button onClick={handleDelete} className="btn-danger mord-action-btn mord-action-btn--cancel" title="Huỷ hoá đơn">
                    <Ban className="mord-action-btn-icon" /> Huỷ
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOrder(null);
                      navigate(`/return-orders?orderId=${selectedOrder.id}`);
                    }}
                    className="mord-action-btn mord-action-btn--return"
                  >
                    ↩ Trả hàng
                  </button>
                  <button onClick={handlePrint} className="btn-primary mord-action-btn">
                    <Printer className="mord-action-btn-icon" /> In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase 13: MODAL THANH TOÁN CÔNG NỢ (Mode SINGLE) */}
      {payingOrder && onPayDebt && (
        <PayDebtModal
          isOpen={!!payingOrder}
          onClose={() => setPayingOrder(null)}
          onPayDebt={onPayDebt}
          order={payingOrder}
          onPaymentSuccess={() => {
            if (selectedOrder?.id === payingOrder.id) setSelectedOrder(null);
            fetchOrders(currentPage);
          }}
        />
      )}
    </MobileLayout>
  );
};

export default MobileOrders;