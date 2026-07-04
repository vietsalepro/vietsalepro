import React, { useState, useEffect, useRef } from 'react';
import { Customer, Order, PointHistory, AppSettings } from '../types';
import { Plus, Search, Phone, MapPin, Edit, Trash2, ShoppingBag, User, Users, Gift, X, ArrowUpDown, Loader2, ChevronLeft, ChevronRight, Download, Upload, Wallet, History } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { EmptyState } from './ui';
import { RANK_BADGE_CLASSES } from '../utils/rankingEngine';
import MobileLayout from './MobileLayout';
import { PayDebtModal } from './PayDebtModal';
import { DebtLedgerModal } from './DebtLedgerModal';
import './MobileCustomers.css';

const RANK_ICONS: Record<string, string> = {
  diamond: '\uD83D\uDC8E',
  platinum: '\uD83C\uDFC6',
  gold: '\uD83E\uDD47',
  silver: '\uD83E\uDD48',
  bronze: '\uD83E\uDD49',
  regular: '\u2B50',
};

const RANK_LABELS: Record<string, string> = {
  diamond: 'Kim c\u01B0\u01A1ng',
  platinum: 'B\u1EA1ch kim',
  gold: 'V\u00E0ng',
  silver: 'B\u1EA1c',
  bronze: '\u0110\u1ED3ng',
  regular: 'Th\u01B0\u1EDDng',
};

interface MobileCustomersProps {
  customers?: Customer[];
  appSettings: AppSettings;
  onAddCustomer: (customer: Customer) => Promise<void>;
  onUpdateCustomer: (customer: Customer) => Promise<void>;
  onDeleteCustomer: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onPayDebt: (orderId: string, amount: number) => void;
  onDeleteOrder: (orderId: string) => void;
  onAdjustPoints: (customerId: string, amount: number, description: string) => void;
}

const MobileCustomers: React.FC<MobileCustomersProps> = ({
  customers: initialCustomers = [],
  appSettings,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onBulkDelete,
  onPayDebt,
  onDeleteOrder,
  onAdjustPoints,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(initialCustomers);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'points'>('info');
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [customerPointHistory, setCustomerPointHistory] = useState<PointHistory[]>([]);
  // Phase 13: Thanh toán công nợ tổng (mode multi)
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  // Phase 8d: Sổ cái công nợ KH
  const [ledgerCustomerId, setLedgerCustomerId] = useState<string | null>(null);
  const [isPointHistoryLoading, setIsPointHistoryLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({ code: '', name: '', phone: '', address: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const PAGE_SIZE = 20;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCustomers = async (page: number, search: string) => {
    setIsLoading(true);
    try {
      const result = await supabaseService.getCustomersPaginated(page, PAGE_SIZE, search, { sortBy, sortOrder });
      setLocalCustomers(result.customers as Customer[]);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(currentPage, searchTerm);
  }, [currentPage, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    if (activeTab === 'history' && editingCustomer) {
      setIsOrdersLoading(true);
      supabaseService.getCustomerOrders(editingCustomer.id)
        .then(setCustomerOrders)
        .catch(console.error)
        .finally(() => setIsOrdersLoading(false));
    }
    if (activeTab === 'points' && editingCustomer) {
      setIsPointHistoryLoading(true);
      supabaseService.getPointHistory(editingCustomer.id)
        .then(setCustomerPointHistory as any)
        .catch(console.error)
        .finally(() => setIsPointHistoryLoading(false));
    }
  }, [activeTab, editingCustomer]);

  const openModal = (customer?: Customer) => {
    setActiveTab('info');
    setCustomerOrders([]);
    setCustomerPointHistory([]);
    if (customer) {
      setEditingCustomer(customer);
      setFormData({ code: customer.code, name: customer.name, phone: customer.phone, address: customer.address });
    } else {
      setEditingCustomer(null);
      setFormData({ code: '', name: '', phone: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Vui lòng nhập đầy đủ tên và số điện thoại.');
      return;
    }
    try {
      const phoneExists = await supabaseService.checkCustomerPhoneExists(formData.phone, editingCustomer?.id);
      if (phoneExists) {
        alert('Số điện thoại này đã tồn tại trên hệ thống.');
        return;
      }
    } catch (error) {
      console.error('Error checking phone:', error);
    }

    let finalCode = formData.code;
    if (!finalCode) {
      try {
        finalCode = await supabaseService.getNextCustomerCode();
      } catch (error) {
        finalCode = 'KH' + Date.now().toString().slice(-6);
      }
    }

    if (editingCustomer) {
      const updated: Customer = { ...editingCustomer, ...formData, code: String(finalCode) } as any;
      await onUpdateCustomer(updated);
      setLocalCustomers(prev => prev.map(c => c.id === editingCustomer.id ? updated : c));
    } else {
      const newCustomer: Customer = {
        id: 'C' + Date.now(),
        code: String(finalCode),
        name: formData.name || '',
        phone: formData.phone || '',
        address: formData.address || '',
        totalSpent: 0,
        debt: 0,
        loyaltyPoints: 0,
      } as any;
      await onAddCustomer(newCustomer);
      setLocalCustomers(prev => [newCustomer, ...prev]);
    }
    closeModal();
    showToast(editingCustomer ? 'Đã cập nhật khách hàng' : 'Đã thêm khách hàng');
  };

  const handleDelete = (id: string) => {
    if (confirm('Xoá khách hàng này?')) {
      onDeleteCustomer(id);
      setLocalCustomers(prev => prev.filter(c => c.id !== id));
      showToast('Đã xoá khách hàng');
    }
  };

  const handleExportExcel = () => {
    const data = localCustomers.map(c => ({
      'Mã KH': (c as any).code,
      'Tên khách hàng': c.name,
      'Số điện thoại': c.phone,
      'Địa chỉ': c.address,
      'Tổng chi tiêu': (c as any).totalSpent,
      'Công nợ': c.debt,
    }));
    const XLSX = require('xlsx');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KhachHang');
    XLSX.writeFile(wb, 'khach_hang.xlsx');
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const XLSX = require('xlsx');
      const data = await new Promise<any[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const wb = XLSX.read(evt.target?.result, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            resolve(XLSX.utils.sheet_to_json(ws));
          } catch (err) { reject(err); }
        };
        reader.onerror = reject;
        reader.readAsBinaryString(file);
      });
      let count = 0;
      for (const row of data) {
        const name = ((row['Tên khách hàng'] || row['Tên']) ?? '').toString().trim();
        const phone = ((row['Số điện thoại'] || row['Điện thoại']) ?? '').toString().trim();
        if (name && phone) {
          const newCustomer: Customer = {
            id: 'C' + Date.now() + Math.floor(Math.random() * 1000),
            code: row['Mã KH'] || 'KH' + Date.now().toString().slice(-6),
            name,
            phone,
            address: row['Địa chỉ'] || '',
            totalSpent: 0,
            debt: 0,
            loyaltyPoints: Number(row['Điểm'] || row['Điểm tích luỹ']) || 0,
          } as any;
          await onAddCustomer(newCustomer);
          count++;
        }
      }
      showToast('Đã nhập ' + count + ' khách hàng');
      fetchCustomers(1, '');
    } catch (error) {
      showToast('Lỗi khi nhập file', 'error');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const renderSortOption = (opt: { key: string; label: string; order?: string }, i: number) => {
    const active = sortBy === opt.key && (opt.order || 'asc') === sortOrder;
    return (
      <button
        key={i}
        className={
          'mcust-sort-option ' +
          (active ? 'mcust-sort-option--active' : '')
        }
        onClick={() => {
          setSortBy(opt.key);
          setSortOrder((opt.order || (opt.key === 'name' ? 'asc' : 'desc')) as 'asc' | 'desc');
          setShowSortOptions(false);
          setCurrentPage(1);
        }}
      >
        {opt.label}
      </button>
    );
  };

  const renderCustomerCard = (customer: Customer) => {
    const rank = customer.rank || 'regular';
    const rankLabel = RANK_LABELS[rank] || 'Thường';
    const rankIcon = RANK_ICONS[rank] || '\u2B50';
    const rankBadgeClass = RANK_BADGE_CLASSES[rank] || RANK_BADGE_CLASSES.regular;
    return (
      <div
        key={customer.id}
        className="m-card m-card-interactive mcust-card"
        onClick={() => openModal(customer)}
      >
        <div className="flex items-start mcust-card-row">
          <div className="m-avatar mcust-card-avatar">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="mcust-card-name truncate">{customer.name}</span>
              <span className={'mcust-rank-badge ' + rankBadgeClass}>
                {rankIcon} {rankLabel}
              </span>
            </div>
            <div className="flex items-center mcust-card-meta">
              <span className="flex items-center gap-1"><Phone className="mcust-card-meta-icon" /> {customer.phone}</span>
              {customer.address && <span className="flex items-center gap-1 truncate"><MapPin className="mcust-card-meta-icon" /> {customer.address}</span>}
            </div>
            <div className="flex items-center justify-between mcust-card-stats">
              <div className="flex mcust-card-stats-group">
                <div>
                  <p className="mcust-stat-label">Đã chi</p>
                  <p className="mcust-stat-value mcust-stat-spent m-counter">{((customer as any).totalSpent || 0).toLocaleString('vi-VN')}₫</p>
                </div>
                <div>
                  <p className="mcust-stat-label">Nợ</p>
                  <p className={'mcust-stat-value m-counter ' + (Number(customer.debt || 0) > 0 ? 'mcust-stat-debt--positive' : 'mcust-stat-debt--zero')}>
                    {Number(customer.debt || 0) > 0 ? Number(customer.debt || 0).toLocaleString('vi-VN') + '₫' : '0₫'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="mcust-stat-label">Điểm</p>
                <p className="mcust-stat-value mcust-stat-points m-counter">{((customer as any).loyaltyPoints || 0).toLocaleString('vi-VN')}</p>
              </div>
            </div>
            {/* Phase 13: nút Thanh toán công nợ — chỉ hiện khi khách đang có nợ */}
            {Number(customer.debt || 0) > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setPayingCustomer(customer); }}
                className="mcust-pay-debt-btn"
              >
                <Wallet className="mcust-pay-debt-icon" /> Thanh toán công nợ
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <MobileLayout>
      <div className="m-bg m-with-nav mcust-page">
      <div className="flex justify-between items-center mcust-header animate-fade-in-up">
        <div>
          <h2 className="mcust-title">Khách hàng</h2>
          <p className="mcust-subtitle">{totalCount} khách hàng</p>
        </div>
        <div className="flex mcust-header-actions">
          <div className="relative">
            <button
              onClick={() => setShowSortOptions(!showSortOptions)}
              className="m-card mcust-icon-btn"
              aria-label="Sắp xếp"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
            {showSortOptions && (
              <div className="absolute right-0 top-full mt-2 mcust-sort-dropdown animate-fade-in-down">
                {renderSortOption({ key: 'name', label: 'Tên A-Z' }, 0)}
                {renderSortOption({ key: 'name', label: 'Tên Z-A', order: 'desc' }, 1)}
                {renderSortOption({ key: 'totalSpent', label: 'Chi tiêu cao nhất', order: 'desc' }, 2)}
                {renderSortOption({ key: 'totalSpent', label: 'Chi tiêu thấp nhất', order: 'asc' }, 3)}
                {renderSortOption({ key: 'debt', label: 'Công nợ cao nhất', order: 'desc' }, 4)}
                {renderSortOption({ key: 'loyaltyPoints', label: 'Điểm cao nhất', order: 'desc' }, 5)}
              </div>
            )}
          </div>
          <button onClick={handleExportExcel} className="m-card mcust-icon-btn" title="Xuất Excel">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="m-card mcust-icon-btn" title="Nhập Excel">
            <Upload className="w-4 h-4" />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="mcust-file-input" accept=".xlsx,.xls" />
          <button onClick={() => openModal()} className="btn-primary mcust-add-btn">
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </div>
      </div>

      <div className="m-search flex items-center px-3 py-2 mb-4">
        <Search className="w-4 h-4 mcust-search-icon shrink-0" />
        <input
          type="text"
          placeholder="Tìm tên hoặc số điện thoại..."
          className="mcust-search-input"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center mcust-loading">
          <Loader2 className="mcust-loading-icon" />
        </div>
      ) : localCustomers.length === 0 ? (
        <div className="m-card mcust-empty animate-fade-in">
          <div className="mcust-empty-icon-wrap">
            <Users className="mcust-empty-icon" />
          </div>
          <p className="mcust-empty-title">Không tìm thấy khách hàng</p>
          <p className="mcust-empty-hint">Thử thay đổi từ khoá tìm kiếm hoặc thêm mới.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5 stagger">
            {localCustomers.map(customer => renderCustomerCard(customer))}
          </div>

          {totalCount > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4 m-card mcust-pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="mcust-page-btn"
              >
                <ChevronLeft className="mcust-page-btn-icon" /> Trước
              </button>
              <span className="mcust-page-info">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="mcust-page-btn"
              >
                Sau <ChevronRight className="mcust-page-btn-icon" />
              </button>
            </div>
          )}
        </>
      )}
      </div>

      {/* Customer Detail Modal */}
      {isModalOpen && editingCustomer && (
        <div className="mcust-modal-overlay">
          <div className="mcust-modal">
            <div className="mcust-modal-header">
              <div className="flex items-center gap-3">
                <div className="mcust-detail-avatar">
                  {editingCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="mcust-detail-name">{editingCustomer.name}</h3>
                  <p className="mcust-detail-meta">{(editingCustomer as any).code} · {editingCustomer.phone}</p>
                </div>
              </div>
              <button onClick={closeModal} className="mcust-modal-close">
                <X className="mcust-modal-close-icon" />
              </button>
            </div>

            <div className="mcust-tabs">
              {[
                { key: 'info', label: 'Thông tin', icon: User },
                { key: 'history', label: 'Lịch sử mua', icon: ShoppingBag },
                { key: 'points', label: 'Điểm thưởng', icon: Gift },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'info' | 'history' | 'points')}
                  className={'mcust-tab ' + (activeTab === tab.key ? 'mcust-tab--active' : '')}
                >
                  <tab.icon className="mcust-tab-icon" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mcust-modal-body">
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="mcust-stat-tile mcust-stat-tile--spent">
                      <p className="mcust-stat-tile-label mcust-stat-tile-label--spent">Tổng chi tiêu</p>
                      <p className="mcust-stat-tile-value mcust-stat-tile-value--spent">{((editingCustomer as any).totalSpent || 0).toLocaleString('vi-VN')}₫</p>
                    </div>
                    <div className="mcust-stat-tile mcust-stat-tile--points">
                      <p className="mcust-stat-tile-label mcust-stat-tile-label--points">Điểm thưởng</p>
                      <p className="mcust-stat-tile-value mcust-stat-tile-value--points">{((editingCustomer as any).loyaltyPoints || 0).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>

                  <div className="mcust-summary-block space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="mcust-summary-label">Công nợ</span>
                      <span className={'mcust-summary-value ' + (Number(editingCustomer.debt || 0) > 0 ? 'mcust-summary-value--debt-positive' : 'mcust-summary-value--debt-zero')}>
                        {Number(editingCustomer.debt || 0).toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="mcust-summary-label">Địa chỉ</span>
                      <span className="mcust-summary-value--address">{editingCustomer.address || 'Chưa cập nhật'}</span>
                    </div>
                  </div>

                  {/* Phase 13: nút Thanh toán công nợ trên modal chi tiết khách — chỉ hiện khi đang nợ */}
                  {Number(editingCustomer.debt || 0) > 0 && (
                    <button
                      onClick={() => setPayingCustomer(editingCustomer)}
                      className="mcust-detail-pay-btn"
                    >
                      <Wallet className="w-4 h-4" />
                      Thanh toán công nợ
                      <span className="mcust-detail-pay-chip">
                        {Number(editingCustomer.debt || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </button>
                  )}

                  {/* Phase 8d: nút xem sổ cái công nợ KH + điều chỉnh nợ */}
                  <button
                    onClick={() => setLedgerCustomerId(editingCustomer.id)}
                    className="mcust-action-btn mcust-action-btn--edit"
                    style={{ marginTop: 8 }}
                  >
                    <History className="mcust-action-icon" /> Sổ cái nợ
                  </button>

                  <div className="flex mcust-action-row">
                    <button
                      onClick={() => openModal(editingCustomer)}
                      className="mcust-action-btn mcust-action-btn--edit"
                    >
                      <Edit className="mcust-action-icon" /> Chỉnh sửa
                    </button>
                    <button
                      onClick={() => { handleDelete(editingCustomer.id); closeModal(); }}
                      className="mcust-action-btn mcust-action-btn--delete"
                    >
                      <Trash2 className="mcust-action-icon" /> Xoá
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  {isOrdersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="mcust-tab-spinner" />
                    </div>
                  ) : customerOrders.length === 0 ? (
                    <div className="mcust-empty-tab">
                      <ShoppingBag className="mcust-empty-tab-icon" />
                      <p className="mcust-empty-tab-text">Chưa có đơn hàng</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customerOrders.map(order => (
                        <div key={order.id} className="mcust-list-item">
                          <div className="flex justify-between items-start mb-2">
                            <span className="mcust-list-item-id">#{order.id}</span>
                            <span className="mcust-list-item-date">{new Date(order.date).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="mcust-list-item-amount">{order.totalAmount.toLocaleString('vi-VN')}₫</span>
                            <div className="flex items-center gap-2">
                              {Number(order.debtRecorded || 0) > 0 && (
                                <span className="mcust-debt-chip">Nợ {Number(order.debtRecorded || 0).toLocaleString('vi-VN')}₫</span>
                              )}
                              <span className="mcust-status-chip">Hoàn thành</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'points' && (
                <div>
                  {isPointHistoryLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="mcust-tab-spinner" />
                    </div>
                  ) : customerPointHistory.length === 0 ? (
                    <div className="mcust-empty-tab">
                      <Gift className="mcust-empty-tab-icon" />
                      <p className="mcust-empty-tab-text">Chưa có lịch sử điểm</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customerPointHistory.map((entry, idx) => (
                        <div key={idx} className="mcust-points-row">
                          <div>
                            <p className="mcust-points-desc">{(entry as any).description || (entry as any).points || 'Hoạt động điểm'}</p>
                            <p className="mcust-points-date">{new Date((entry as any).date || (entry as any).createdAt).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <span className={'mcust-points-value ' + (Number((entry as any).amount || (entry as any).points || 0) > 0 ? 'mcust-points-value--positive' : 'mcust-points-value--negative')}>
                            {Number((entry as any).amount || (entry as any).points || 0) > 0 ? '+' : ''}{Number((entry as any).amount || (entry as any).points || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isModalOpen && !editingCustomer && (
        <div className="mcust-modal-overlay">
          <div className="mcust-modal">
            <div className="mcust-modal-header">
              <h3 className="mcust-form-title">Thêm khách hàng mới</h3>
              <button onClick={closeModal} className="mcust-modal-close">
                <X className="mcust-modal-close-icon" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mcust-form space-y-4 overflow-y-auto">
              <div className="mcust-form-field">
                <label className="mcust-form-label">Mã khách hàng</label>
                <input
                  type="text"
                  className="mcust-form-input"
                  placeholder="Để trống để tự động tạo"
                  value={formData.code || ''}
                  onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                />
              </div>
              <div className="mcust-form-field">
                <label className="mcust-form-label">Tên khách hàng *</label>
                <input
                  type="text"
                  className="mcust-form-input"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="mcust-form-field">
                <label className="mcust-form-label">Số điện thoại *</label>
                <input
                  type="tel"
                  className="mcust-form-input"
                  required
                  value={formData.phone || ''}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="mcust-form-field">
                <label className="mcust-form-label">Địa chỉ</label>
                <input
                  type="text"
                  className="mcust-form-input"
                  value={formData.address || ''}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <button type="submit" className="mcust-form-submit">
                {editingCustomer ? 'Cập nhật' : 'Thêm khách hàng'}
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="mcust-toast-wrap">
          <div className={
            'mcust-toast ' + (toast.type === 'error' ? 'mcust-toast--error' : 'mcust-toast--success')
          }>
            {toast.message}
            <button onClick={() => setToast(null)} className="mcust-toast-close">
              <X className="mcust-toast-close-icon" />
            </button>
          </div>
        </div>
      )}

      {/* Phase 13: MODAL THANH TOÁN CÔNG NỢ TỔNG (Mode MULTI - chọn từng đơn) */}
      {payingCustomer && onPayDebt && (
        <PayDebtModal
          isOpen={!!payingCustomer}
          onClose={() => setPayingCustomer(null)}
          onPayDebt={onPayDebt}
          customer={payingCustomer}
          onPaymentSuccess={async () => {
            showToast('Thanh toán công nợ thành công!');
            await fetchCustomers(currentPage, searchTerm);
            // Refresh editingCustomer để tab Thông tin hiển thị công nợ mới
            if (editingCustomer?.id === payingCustomer.id) {
              try {
                const [fresh, orders] = await Promise.all([
                  supabaseService.getCustomerById(editingCustomer.id),
                  supabaseService.getCustomerOrders(editingCustomer.id),
                ]);
                if (fresh) setEditingCustomer(fresh);
                setCustomerOrders(orders);
              } catch (err) {
                console.error('Refresh customer detail failed:', err);
              }
            }
          }}
        />
      )}

      {/* Phase 8d: Sổ cái công nợ KH (xem ledger + điều chỉnh nợ có reason) */}
      {ledgerCustomerId && editingCustomer && (
        <DebtLedgerModal
          isOpen={!!ledgerCustomerId}
          onClose={() => setLedgerCustomerId(null)}
          entityType="customer"
          entityId={ledgerCustomerId}
          entityName={editingCustomer.name || ''}
          onAdjusted={async () => {
            try {
              const fresh = await supabaseService.getCustomerById(ledgerCustomerId);
              if (fresh) setEditingCustomer(fresh as Customer);
            } catch (err) {
              console.error('Refresh customer after adjust failed:', err);
            }
            await fetchCustomers(currentPage, searchTerm);
          }}
        />
      )}
    </MobileLayout>
  );
};

export default MobileCustomers;
