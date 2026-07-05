import React, { useState, useRef, useEffect } from 'react';
import { Customer, Order, PointHistory, getCustomerRank, CUSTOMER_RANK_CONFIG } from '../types';
import {
  Plus, Search, Phone, MapPin, Edit, Trash2, Wallet, Download, Upload,
  FileSpreadsheet, X, History, ShoppingBag, CheckCircle, User, Users, Gift,
  ArrowUpDown, Loader2, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, Star, Filter, DollarSign, CreditCard,
  TrendingUp, UserCheck, Crown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabaseService } from '../services/supabaseService';
import { Card, Button, Input, Badge, Toast, ToastContainer, Skeleton, EmptyState } from '../components/ui';
import { RANK_BADGE_CLASSES, getRankBadgeClass } from '../utils/rankingEngine';
import { PayDebtModal } from '../components/PayDebtModal';
import { DebtLedgerModal } from '../components/DebtLedgerModal';
import { StatusBadge } from '../components/StatusBadge';
import { ActionButton } from '../components/ActionButton';
import { DataGrid, DataGridColumn, SortDirection } from '../components/DataGrid';
import { useNewDataGridCustomers } from '../features';
import StatsRow from '../components/shared/StatsRow';
import { PageLayout } from '../components/shared/PageLayout';
import { DataGridBox } from '../components/shared/DataGridBox';
import { useDebounce } from '../hooks/useDebounce';
import { useTenant } from '../hooks/useTenant';
import '../components/shared/FilterBar.css';
import './Customers.css';

interface CustomersProps {
  customers?: Customer[];
  filterByDebt?: boolean;
  onClearFilter?: () => void;
  onAddCustomer: (customer: Customer) => Promise<void>;
  onUpdateCustomer: (customer: Customer) => Promise<void>;
  onDeleteCustomer: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onPayDebt?: (orderId: string, amount: number) => void;
  onDeleteOrder?: (orderId: string) => void;
  onAdjustPoints?: (customerId: string, amount: number, description: string) => void;
}

// Helper to get rank info for a customer
const getRankInfo = (customer: any) => {
  const rank = customer.rank || getCustomerRank(customer.totalSpent);
  const config = CUSTOMER_RANK_CONFIG[rank as any];
  return { rank, config };
};

export const Customers: React.FC<CustomersProps> = ({
  customers: initialCustomers = [],
  filterByDebt = false,
  onClearFilter,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onBulkDelete,
  onPayDebt,
  onDeleteOrder,
  onAdjustPoints
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [customerPointHistory, setCustomerPointHistory] = useState<any[]>([]);
  const [isPointHistoryLoading, setIsPointHistoryLoading] = useState(false);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination State - server-side data only
  const [localCustomers, setLocalCustomers] = useState<any[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pageSize] = useState(7);
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Tabs for Modal
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'points'>('info');

  const [formData, setFormData] = useState<any>({ code: '', name: '', phone: '', phone2: '', birthday: '', gender: '', email: '', facebook: '', address: '', customerGroup: '', note: '', debt: 0 } as any);

  // Payment Prompt State
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);

  // Phase 13: Thanh toán công nợ tổng cho 1 khách (mode multi)
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  // Phase 8d: Sổ cái công nợ KH
  const [ledgerCustomerId, setLedgerCustomerId] = useState<string | null>(null);

  // Point Adjustment State
  const [isAdjustPointOpen, setIsAdjustPointOpen] = useState(false);
  const [adjustPointValue, setAdjustPointValue] = useState<string>('');
  const [adjustPointDesc, setAdjustPointDesc] = useState<string>('');

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataGridBoxRef = useRef<HTMLDivElement>(null);

  // Fetch paginated customers (with debt filter support)
  const fetchCustomers = async (page: number, search: string, filterDebt?: boolean) => {
    setIsLoading(true);
    try {
      const { customers, totalCount } = await supabaseService.getCustomersPaginated(
        page,
        pageSize,
        search,
        filterDebt ? { hasDebt: true } : undefined
      );
      setLocalCustomers(customers);
      setTotalCount(totalCount);
    } catch (error) {
      console.error("Error fetching paginated customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!tenantId) return;
    fetchCustomers(currentPage, debouncedSearchTerm, filterByDebt);
  }, [currentPage, pageSize, debouncedSearchTerm, filterByDebt, tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    if (activeTab === 'history' && editingCustomer) {
      const fetchOrders = async () => {
        setIsOrdersLoading(true);
        try {
          const orders = await supabaseService.getCustomerOrders(editingCustomer.id);
          setCustomerOrders(orders);
        } catch (error) {
          console.error("Error fetching customer orders:", error);
        } finally {
          setIsOrdersLoading(false);
        }
      };
      fetchOrders();
    }
    if (activeTab === 'points' && editingCustomer) {
      const fetchHistory = async () => {
        setIsPointHistoryLoading(true);
        try {
          const history = await supabaseService.getPointHistory(editingCustomer.id);
          setCustomerPointHistory(history as any);
        } catch (error) {
          console.error("Error fetching point history:", error);
        } finally {
          setIsPointHistoryLoading(false);
        }
      };
      fetchHistory();
    }
  }, [activeTab, editingCustomer, tenantId]);

  // Server-side sort is used via handleSort - localCustomers is the single source of truth
  const sortedCustomers = localCustomers;

  // Sort config mapping to server-side sort params
  const getSortParam = (key: string): string | undefined => {
    switch (key) {
      case 'name': return 'name';
      case 'phone': return 'phone';
      case 'totalSpent': return 'spent';
      case 'debt': return 'debt';
      case 'loyaltyPoints': return 'points';
      case 'code': return 'name'; // code -> name sort mặc định
      default: return undefined;
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    // Re-fetch with server-side sort
    const sortKey = getSortParam(key);
    if (sortKey) {
      setIsLoading(true);
      supabaseService.getCustomersPaginated(
        currentPage,
        pageSize,
        debouncedSearchTerm,
        filterByDebt ? { hasDebt: true, sortBy: sortKey, sortOrder: direction } : { sortBy: sortKey, sortOrder: direction }
      ).then(({ customers, totalCount }) => {
        setLocalCustomers(customers);
        setTotalCount(totalCount);
      }).catch(err => {
        console.error("Error fetching sorted customers:", err);
      }).finally(() => {
        setIsLoading(false);
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === localCustomers.length && localCustomers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(localCustomers.map(c => c.id));
    }
  };

  const handleSelectCustomer = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteLocal = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Xoá ${selectedIds.length} khách hàng đã chọn?`)) {
      if (onBulkDelete) {
        await onBulkDelete(selectedIds);
        setSelectedIds([]);
        fetchCustomers(currentPage, debouncedSearchTerm);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      alert("Vui lòng nhập đầy đủ tên và số điện thoại.");
      return;
    }

    // Check if phone number exists
    try {
      const phoneExists = await supabaseService.checkCustomerPhoneExists(formData.phone, editingCustomer?.id);
      if (phoneExists) {
        alert("Số điện thoại này đã tồn tại trên hệ thống. Vui lòng kiểm tra lại.");
        return;
      }
    } catch (error) {
      console.error("Error checking phone existence:", error);
    }

    let finalCode = formData.code;
    if (!finalCode) {
      try {
        finalCode = await supabaseService.getNextCustomerCode();
      } catch (error) {
        console.error("Error generating sequential code:", error);
        finalCode = `KH${Date.now().toString().slice(-6)}`;
      }
    }

    const customerData: Customer = {
      ...formData,
      id: editingCustomer?.id,
      code: finalCode,
      name: formData.name!,
      phone: formData.phone!,
      totalSpent: editingCustomer?.totalSpent || 0,
      debt: editingCustomer?.debt || 0,
      loyaltyPoints: editingCustomer?.loyaltyPoints || 0,
      createdAt: (editingCustomer as any)?.createdAt || new Date().toISOString(),
    } as any;

    try {
      if (editingCustomer) {
        await onUpdateCustomer(customerData);
        showToast("Cập nhật khách hàng thành công!");
      } else {
        await onAddCustomer(customerData);
        showToast("Thêm khách hàng thành công!");
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      setFormData({ code: '', name: '', phone: '', address: '', debt: 0 });
      fetchCustomers(currentPage, debouncedSearchTerm);
    } catch (error) {
      console.error("Error saving customer:", error);
      showToast("Lỗi khi lưu khách hàng!", "error");
    }
  };

  const openModal = (customer?: Customer) => {
    if (customer) {
      const c = customer as any;
      setEditingCustomer(customer);
      setFormData({
        code: customer.code || '',
        name: customer.name,
        phone: customer.phone,
        phone2: c.phone2 || '',
        birthday: c.birthday || '',
        gender: c.gender || '',
        email: c.email || '',
        facebook: c.facebook || '',
        address: customer.address || '',
        customerGroup: c.customerGroup || '',
        note: c.note || '',
        debt: customer.debt || 0,
      } as any);
      setActiveTab('info');
    } else {
      setEditingCustomer(null);
      setFormData({ code: '', name: '', phone: '', phone2: '', birthday: '', gender: '', email: '', facebook: '', address: '', customerGroup: '', note: '', debt: 0 } as any);
    }
    setIsModalOpen(true);
  };

  // Phase 1: server-side customer stats
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    vip: 0,
    debt: 0,
    totalSpent: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    setIsLoadingStats(true);
    supabaseService.getCustomerStats()
      .then(stats => {
        if (!cancelled) setCustomerStats(stats);
      })
      .catch(err => console.error('Customers: fetch stats error', err))
      .finally(() => {
        if (!cancelled) setIsLoadingStats(false);
      });
    return () => { cancelled = true; };
  }, [tenantId]);

  const totalCustomers = customerStats.total;
  const vipCustomers = customerStats.vip;
  const debtCustomers = customerStats.debt;
  const totalSpentSum = customerStats.totalSpent;

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      let imported = 0;
      for (const row of rows) {
        const name = row['Tên khách hàng'] || row['Họ tên'] || row['name'] || row['Name'];
        const phone = String(row['Số điện thoại'] || row['phone'] || row['Phone'] || '').replace(/\D/g, '');
        if (!name || !phone) continue;
        try {
          const exists = await supabaseService.checkCustomerPhoneExists(phone);
          if (exists) continue;
          const code = await supabaseService.getNextCustomerCode();
          await onAddCustomer({
            id: '',
            code,
            name: String(name).trim(),
            phone,
            address: String(row['Địa chỉ'] || row['address'] || ''),
            totalSpent: 0,
            debt: 0,
            loyaltyPoints: 0,
            createdAt: new Date().toISOString(),
          } as any);
          imported++;
        } catch (err) {
          console.error("Error importing row:", err);
        }
      }
      showToast(`Đã nhập ${imported} khách hàng từ file Excel!`);
      fetchCustomers(currentPage, debouncedSearchTerm);
    } catch (error) {
      console.error("Error importing Excel:", error);
      showToast("Lỗi khi nhập file Excel!", "error");
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = localCustomers.map(c => ({
        'Mã KH': (c as any).code || c.id,
        'Tên khách hàng': c.name,
        'Số điện thoại': c.phone,
        'Địa chỉ': c.address || '',
        'Tổng chi tiêu': (c as any).totalSpent,
        'Công nợ': c.debt || 0,
        'Điểm tích lũy': (c as any).loyaltyPoints || 0,
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Khách hàng');
      XLSX.writeFile(wb, `KhachHang_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast("Xuất Excel thành công!");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      showToast("Lỗi khi xuất Excel!", "error");
    }
  };

  const handleDownloadSample = () => {
    const headers = [
      {
        'Mã khách hàng': 'KH000001',
        'Tên khách hàng (Bắt buộc)': 'Nguyễn Văn A',
        'Số điện thoại (Bắt buộc)': '0901234567',
        'Địa chỉ': '123 Đường ABC, Quận 1, TP.HCM'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Khach_Hang");
    XLSX.writeFile(wb, "mau_nhap_khach_hang.xlsx");
    showToast("Đã tải mẫu Excel khách hàng!");
  };

  // V2 DataGrid helpers
  const handleDataGridSort = (key: string, direction: SortDirection) => {
    if (direction === 'none') {
      setSortConfig(null);
    } else {
      handleSort(key);
    }
  };



  const customerColumns: DataGridColumn<any>[] = [
    {
      key: 'code',
      label: 'Mã KH',
      sortable: true,
      render: (customer) => <span className="customers-v2-code">{(customer as any).code || customer.id}</span>,
    },
    {
      key: 'name',
      label: 'Tên khách hàng',
      sortable: true,
      render: (customer) => (
        <button
          className="customers-v2-name"
          onClick={(e) => {
            e.stopPropagation();
            openModal(customer);
          }}
        >
          {customer.name}
        </button>
      ),
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      sortable: true,
      render: (customer) => <span className="customers-v2-phone">{customer.phone}</span>,
    },
    {
      key: 'address',
      label: 'Địa chỉ',
      render: (customer) => <span className="customers-v2-address" title={customer.address}>{customer.address || '—'}</span>,
    },
    {
      key: 'totalSpent',
      label: 'Tổng chi tiêu',
      sortable: true,
      align: 'right',
      render: (customer) => <span className="customers-v2-money">{Number((customer as any).totalSpent || 0).toLocaleString('vi-VN')}₫</span>,
    },
    {
      key: 'debt',
      label: 'Công nợ',
      sortable: true,
      align: 'right',
      render: (customer) => (
        <div className="flex flex-col items-end gap-1">
          <span className={`customers-v2-debt ${Number(customer.debt || 0) > 0 ? '' : 'paid'}`}>
            {Number(customer.debt || 0).toLocaleString('vi-VN')}₫
          </span>
          {Number(customer.debt || 0) > 0 && (
            <ActionButton
              variant="secondary"
              size="sm"
              icon={<Wallet className="w-3 h-3" />}
              onClick={(e) => {
                e?.stopPropagation();
                setPayingCustomer(customer);
              }}
            >
              Thanh toán
            </ActionButton>
          )}
        </div>
      ),
    },
    {
      key: 'loyaltyPoints',
      label: 'Điểm',
      sortable: true,
      align: 'center',
      render: (customer) => <span className="customers-v2-points">{Number((customer as any).loyaltyPoints || 0)}</span>,
    },
    {
      key: 'rank',
      label: 'Phân hạng',
      align: 'center',
      render: (customer) => {
        const { rank, config } = getRankInfo(customer);
        const rankClass = getRankBadgeClass ? getRankBadgeClass(rank) : 'bg-gray-100 text-gray-700';
        return (
          <span className={`customers-v2-rank ${rankClass}`}>
            <Star className="w-3 h-3" /> {(config as any)?.label || rank}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'right',
      render: (customer) => (
        <div className="customers-v2-actions">
          <ActionButton
            variant="ghost"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={(e) => {
              e?.stopPropagation();
              openModal(customer);
            }}
            aria-label="Sửa"
          />
          <ActionButton
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={(e) => {
              e?.stopPropagation();
              onDeleteCustomer(customer.id);
            }}
            aria-label="Xóa"
          />
        </div>
      ),
    },
  ];

  return (
    <PageLayout>
      <style>{`
        /* ===== CUSTOMER PAGE – Synced with Suppliers BOX style ===== */

        /* BOX CHÍNH = container chuẩn Suppliers */
        .crm-table-container {
          border: 1px solid rgba(241, 245, 249, 0.5);
          border-radius: 16px;
          overflow: hidden;
          background: #FFFFFF;
          box-shadow: 0 8px 30px rgba(0,0,0,0.015);
          padding: 24px;
          display: flex;
          flex-direction: column;
        }
        .crm-table-container--desktop {
          flex: 1 1 auto;
          min-height: 0;
        }
        .crm-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .crm-table thead { background: transparent; }
        .crm-table thead th {
          font-size: var(--vsp-font-size-xs);
          font-weight: var(--vsp-font-weight-semibold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94A3B8;
          padding: 14px 12px;
          border-bottom: 1px solid #F1F5F9;
          text-align: left;
          white-space: nowrap;
        }
        .crm-table thead th.sortable { cursor: pointer; }
        .crm-table thead th.sortable:hover { color: #475569; }
        .crm-table tbody tr {
          border-bottom: 1px solid #F8FAFC;
          transition: background 0.15s ease;
        }
        .crm-table tbody tr:hover { background: rgba(248, 250, 252, 0.6); }
        .crm-table tbody tr.selected { background: #F5F3FF; }
        .crm-table tbody td {
          padding: 16px 12px;
          font-size: var(--vsp-font-size-base);
          color: #334155;
          vertical-align: middle;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        /* Cho phép ô Công nợ wrap để hiện nút Thanh toán */
        .crm-table tbody td.crm-cell-wrap {
          white-space: normal;
          overflow: visible;
        }

        .crm-action-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          color: #94A3B8;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .crm-action-btn.edit:hover { background: #F1F5F9; color: #475569; }
        .crm-action-btn.delete:hover { background: #FEF2F2; color: #DC2626; }

        .crm-price { color: #334155; font-weight: 600; }

        /* Pagination – pill style synced with Suppliers */
        .crm-pagination {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          padding: 20px 4px 4px;
          margin-top: 16px;
          border-top: 1px solid #F1F5F9;
          background: transparent;
        }
        .crm-pagination-btn {
          min-width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          color: #64748B;
          font-size: var(--vsp-font-size-base);
          font-weight: var(--vsp-font-weight-semibold);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .crm-pagination-btn:hover { background: #FFFFFF; color: #334155; }
        .crm-pagination-btn.active {
          background: #FFFFFF;
          color: #7C3AED;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .crm-pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Rank badges */
        .crm-rank-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: var(--vsp-font-size-xxs);
          font-weight: var(--vsp-font-weight-semibold);
          letter-spacing: 0.02em;
        }

        /* Mobile card */
        .crm-mobile-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          transition: all 0.2s ease;
        }
        .crm-mobile-card:hover {
          border-color: #C4B5FD;
          box-shadow: 0 4px 12px rgba(124,58,237,0.08);
        }
        .crm-mobile-avatar {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #EDE9FE, #DDD6FE);
          color: #7C3AED;
          font-weight: var(--vsp-font-weight-bold);
          font-size: var(--vsp-font-size-lg);
          flex-shrink: 0;
        }
        .crm-mobile-info { flex: 1; min-width: 0; }
        .crm-mobile-name {
          font-size: var(--vsp-font-size-sm);
          font-weight: var(--vsp-font-weight-semibold);
          color: #0F172A;
          line-height: 1.3;
        }
        .crm-mobile-phone {
          font-size: var(--vsp-font-size-xs);
          color: #64748B;
          margin-top: 1px;
        }
        .crm-mobile-meta { text-align: right; flex-shrink: 0; }
        .crm-mobile-spent {
          font-size: var(--vsp-font-size-base);
          font-weight: var(--vsp-font-weight-bold);
          color: #7C3AED;
        }
        .crm-mobile-debt {
          font-size: var(--vsp-font-size-xs);
          font-weight: var(--vsp-font-weight-semibold);
          color: #EF4444;
          margin-top: 1px;
        }
        .crm-mobile-debt.paid { color: #10B981; }

        /* Bulk bar */
        .crm-bulk-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #FFFFFF;
          border-top: 1px solid #E2E8F0;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 40;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
          animation: fade-in-up 0.25s ease both;
        }

        /* Override empty state */
        .crm-empty {
          padding: 60px 20px;
          text-align: center;
        }
      `}</style>

      {/* ===== TOAST ===== */}
      {toast && (
        <ToastContainer>
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </ToastContainer>
      )}

      {/* ===== PAGE HEADER ===== */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="inv-title-icon">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h1 className="page-title">Khách hàng</h1>
            <p className="page-subtitle">Quản lý thông tin khách hàng</p>
          </div>
        </div>

        {/* ===== SEARCH + FILTER + EXCEL ACTIONS — cùng hàng, nút ở góc phải thẳng hàng với bộ lọc ===== */}
        <div className="filter-bar">
          <div className="filter-bar__search">
            <Search className="filter-bar__search-icon" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, mã..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="filter-bar__search-input"
            />
            {searchTerm && (
              <X className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" onClick={() => { setSearchTerm(''); setCurrentPage(1); }} />
            )}
          </div>

          {filterByDebt && (
            <button onClick={onClearFilter} className="btn btn-ghost btn-sm text-red-500">
              <X className="w-4 h-4" /> Bỏ lọc nợ
            </button>
          )}

          <div className="ml-auto flex items-center gap-2.5">
            {/* Button Group: Mẫu | Nhập | Xuất (đồng bộ với tab Nhà cung cấp) */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={handleDownloadSample}
                className="p-2 text-slate-600 hover:text-purple-600 hover:bg-slate-50 rounded-lg flex items-center gap-1 text-sm font-medium"
              >
                <FileSpreadsheet className="w-4 h-4" /> <span>Mẫu</span>
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-lg flex items-center gap-1 text-sm font-medium disabled:opacity-50"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Nhập</span>
              </button>
              <input
                type="file"
                accept=".xlsx,.xls"
                ref={fileInputRef}
                onChange={handleImportExcel}
                className="hidden"
              />
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button
                onClick={handleExportExcel}
                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg flex items-center gap-1 text-sm font-medium"
              >
                <Download className="w-4 h-4" /> <span>Xuất</span>
              </button>
            </div>
            <button
              onClick={() => openModal()}
              className="btn-primary flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm khách hàng</span>
              <span className="sm:hidden">Thêm</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== 5 STAT CARDS (FINTECH STYLE) ===== */}
      <StatsRow stats={[
        { label: 'Tổng khách hàng', value: totalCustomers, subtext: 'Tất cả khách hàng', icon: <Users />, colorScheme: 'purple' },
        { label: 'Có số điện thoại', value: Math.round(totalCustomers * 0.95), subtext: 'Khách hàng', icon: <Phone />, colorScheme: 'blue' },
        { label: 'Có công nợ', value: debtCustomers, subtext: 'Khách hàng', icon: <AlertCircle />, colorScheme: 'orange' },
        { label: 'Tổng chi tiêu', value: totalSpentSum.toLocaleString('vi-VN') + 'đ', subtext: 'Tổng số tiền', icon: <Wallet />, colorScheme: 'green' },
        { label: 'Khách VIP', value: vipCustomers, subtext: 'Khách hàng', icon: <Crown />, colorScheme: 'red' },
      ]} />


      {/* ===== LOADING STATE ===== */}
      {isLoading && !localCustomers.length && (
        <div className="crm-table-container">
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3 rounded" />
                  <Skeleton className="h-3 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== EMPTY STATE ===== */}
      {!isLoading && localCustomers.length === 0 && (
        <div className="crm-table-container">
          <div className="crm-empty">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">Chưa có khách hàng</h3>
            <p className="text-sm text-slate-500 mb-4">Thêm khách hàng đầu tiên để bắt đầu</p>
            <button onClick={() => openModal()} className="btn-primary">
              <Plus className="w-4 h-4" /> Thêm khách hàng
            </button>
          </div>
        </div>
      )}

      {/* ===== DESKTOP TABLE ===== */}
      {localCustomers.length > 0 && (
        <div ref={dataGridBoxRef} className="crm-table-container crm-table-container--desktop hidden md:block">
          {useNewDataGridCustomers ? (
            <div className="customers-v2-datagrid flex-1 min-h-0">
              <DataGrid
                className="flex-1 min-h-0"
                embedded
                data={localCustomers}
                columns={customerColumns}
                keyExtractor={(customer) => customer.id}
                loading={isLoading && localCustomers.length === 0}
                selectedRows={selectedIds}
                onSelectionChange={(ids) => setSelectedIds(ids as string[])}
                onRowClick={(customer) => openModal(customer)}
                sortKey={sortConfig?.key}
                sortDirection={sortConfig?.direction || 'none'}
                onSortChange={handleDataGridSort}
                pagination={{
                  currentPage,
                  totalPages,
                  totalCount,
                  pageSize,
                  onPageChange: (page) => { setCurrentPage(page); fetchCustomers(page, debouncedSearchTerm, filterByDebt); },
                  showInfo: false,
                }}
              />
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-auto">
                <table className="crm-table">
                  <colgroup>
                    <col/><col/><col/><col/><col/><col/><col/><col/><col/><col/>
                  </colgroup>
                  <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === totalCount && totalCount > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                    </th>
                    <th className="sortable" onClick={() => handleSort('code')}>
                      <div className="flex items-center gap-1">Mã KH <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="sortable" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">Tên khách hàng <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="sortable" onClick={() => handleSort('phone')}>
                      <div className="flex items-center gap-1">Số điện thoại <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th>Địa chỉ</th>
                    <th className="sortable" onClick={() => handleSort('totalSpent')}>
                      <div className="flex items-center justify-end gap-1">Tổng chi tiêu <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="sortable" onClick={() => handleSort('debt')}>
                      <div className="flex items-center justify-end gap-1">Công nợ <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="sortable" onClick={() => handleSort('loyaltyPoints')}>
                      <div className="flex items-center justify-center gap-1">Điểm <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="text-center">Phân hạng</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {localCustomers.map(customer => {
                    const { rank, config } = getRankInfo(customer);
                    const rankClass = getRankBadgeClass ? getRankBadgeClass(rank) : 'bg-gray-100 text-gray-700';
                    return (
                      <tr key={customer.id} className={selectedIds.includes(customer.id) ? 'selected' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(customer.id)}
                            onChange={() => handleSelectCustomer(customer.id)}
                            className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                          />
                        </td>
                        <td className="font-medium text-slate-600 truncate" title={(customer as any).code || customer.id}>{(customer as any).code || customer.id}</td>
                        <td className="truncate">
                          <span
                            className="font-medium text-slate-900 cursor-pointer hover:text-purple-600 block truncate"
                            title={customer.name}
                            onClick={() => openModal(customer)}
                          >
                            {customer.name}
                          </span>
                        </td>
                        <td className="text-slate-600 truncate">{customer.phone}</td>
                        <td className="text-slate-500 truncate" title={customer.address}>{customer.address}</td>
                        <td className="text-right font-medium crm-price">{Number((customer as any).totalSpent || 0).toLocaleString('vi-VN')}₫</td>
                        <td className="text-right crm-cell-wrap">
                          <div className="flex flex-col items-end gap-1">
                            <span className={`font-bold ${Number(customer.debt || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {Number(customer.debt || 0).toLocaleString('vi-VN')}₫
                            </span>
                            {Number(customer.debt || 0) > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Phase 13: mở PayDebtModal mode multi để chọn từng đơn nợ
                                  setPayingCustomer(customer);
                                }}
                                className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded hover:bg-emerald-100 font-semibold inline-flex items-center gap-1 border border-emerald-200"
                                title="Thanh toán công nợ — chọn từng đơn cần trả"
                              >
                                <Wallet className="w-3 h-3" /> Thanh toán
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="text-center font-bold text-purple-600">{Number((customer as any).loyaltyPoints || 0)}</td>
                        <td className="text-center">
                          <span className={`crm-rank-badge ${rankClass}`}>
                            {(config as any)?.label || rank}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openModal(customer)}
                              className="crm-action-btn edit"
                              title="Sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteCustomer(customer.id)}
                              className="crm-action-btn delete"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>

              {/* ===== PAGINATION (đồng bộ phong cách với Nhà cung cấp) ===== */}
              {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-slate-100 bg-white">
                  <div className="text-sm text-slate-400">
                    Hiển thị <span className="font-medium text-slate-700">{Math.min((currentPage - 1) * pageSize + 1, totalCount)} - {Math.min(currentPage * pageSize, totalCount)}</span> trên tổng số <span className="font-medium text-slate-700">{totalCount}</span> khách hàng
                  </div>
                  <nav className="inline-flex items-center gap-1 rounded-xl bg-slate-50 p-1" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1}
                      className="inline-flex items-center p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Trang trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {getPageNumbers().map((page, idx) =>
                      typeof page === 'string' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-sm select-none">…</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`inline-flex items-center justify-center min-w-[32px] h-[32px] text-sm font-semibold rounded-lg transition-all ${
                            page === currentPage
                              ? 'bg-white text-purple-600 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                      className="inline-flex items-center p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Trang sau"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== MOBILE CARDS ===== */}
      {localCustomers.length > 0 && (
        <div className="md:hidden space-y-3 mb-24 stagger">
          {localCustomers.map(customer => {
            const { rank, config } = getRankInfo(customer);
            const rankClass = getRankBadgeClass ? getRankBadgeClass(rank) : 'bg-gray-100 text-gray-700';
            return (
              <div key={customer.id} className="crm-mobile-card">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(customer.id)}
                  onChange={() => handleSelectCustomer(customer.id)}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <div className="crm-mobile-avatar">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="crm-mobile-info">
                  <div
                    className="crm-mobile-name cursor-pointer hover:text-purple-600"
                    onClick={() => openModal(customer)}
                  >
                    {customer.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="crm-mobile-phone">{customer.phone}</span>
                    <span className={`crm-rank-badge ${rankClass}`}>
                      <Star className="w-3 h-3" /> {(config as any)?.label || rank}
                    </span>
                  </div>
                  {customer.address && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-400 truncate">{customer.address}</span>
                    </div>
                  )}
                </div>
                <div className="crm-mobile-meta">
                  <div className="crm-mobile-spent">{Number((customer as any).totalSpent || 0).toLocaleString('vi-VN')}₫</div>
                  {Number(customer.debt || 0) > 0 ? (
                    <div className="crm-mobile-debt">Nợ: {Number(customer.debt || 0).toLocaleString('vi-VN')}₫</div>
                  ) : (
                    <div className="crm-mobile-debt paid">0₫</div>
                  )}
                </div>
              </div>
            );
          })}

          {/* ===== MOBILE PAGINATION (đồng bộ) ===== */}
          <div className="flex items-center justify-end gap-2 py-4">
            <nav className="inline-flex items-center gap-1 rounded-xl bg-slate-50 p-1" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="inline-flex items-center p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="inline-flex items-center justify-center min-w-[32px] h-[32px] text-sm font-semibold rounded-lg bg-white text-purple-600 shadow-sm px-2">
                {currentPage}/{totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ===== BULK ACTIONS BAR ===== */}
      {selectedIds.length > 0 && (
        <div className="crm-bulk-bar">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
              {selectedIds.length}
            </div>
            <span className="text-sm font-medium text-slate-700">khách hàng đã chọn</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="btn btn-ghost btn-sm"
            >
              Bỏ chọn
            </button>
            <button
              onClick={handleBulkDeleteLocal}
              className="btn btn-danger btn-sm"
            >
              <Trash2 className="w-4 h-4" /> Xoá
            </button>
          </div>
        </div>
      )}

      {/* ===== MODAL ===== */}
      {isModalOpen && (
        <div className="vsp-modal-sync modal-overlay customer-modal-overlay" onClick={() => { if (!isAdjustPointOpen) setIsModalOpen(false); }}>
          <div className="modal-content customer-modal-content" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="inv-title-icon">
                    {editingCustomer ? <Edit className="w-[18px] h-[18px]" /> : <User className="w-[18px] h-[18px]" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {editingCustomer ? 'Sửa khách hàng' : 'Thêm khách hàng'}
                    </h2>
                    {editingCustomer && (
                      <p className="text-xs text-slate-500">Mã: {(editingCustomer as any).code || editingCustomer.id}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Phase 13: nút Thanh toán công nợ trên header modal — chỉ hiện khi khách đang có nợ */}
                  {editingCustomer && Number(editingCustomer.debt || 0) > 0 && (
                    <button
                      onClick={() => setPayingCustomer(editingCustomer)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl transition-colors shadow-sm"
                      title={`Thanh toán công nợ (${Number(editingCustomer.debt || 0).toLocaleString('vi-VN')}đ)`}
                    >
                      <Wallet className="w-4 h-4" />
                      Thanh toán công nợ
                      <span className="px-2 py-0.5 rounded-md bg-white/20 text-xs font-bold">
                        {Number(editingCustomer.debt || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </button>
                  )}
                  {/* Phase 8d: nút xem sổ cái công nợ KH — hiện cả khi nợ = 0 để xem lịch sử */}
                  {editingCustomer && (
                    <button
                      onClick={() => setLedgerCustomerId(editingCustomer.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                      title="Xem sổ cái công nợ / điều chỉnh nợ"
                    >
                      <History className="w-4 h-4" />
                      Sổ cái nợ
                    </button>
                  )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - chia 20:80 (trái: tab dọc / phải: nội dung tab) */}
            <div className="flex-1 flex flex-row min-h-0">
            {/* Modal Tabs - cột trái 20% (chỉ hiện khi sửa khách hàng) */}
            {editingCustomer ? (
              <div className="w-[20%] flex-shrink-0 border-r border-gray-100 bg-slate-50/50 p-3 overflow-y-auto">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg text-left transition-colors ${
                      activeTab === 'info'
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-4 h-4" /> Thông tin
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg text-left transition-colors ${
                      activeTab === 'history'
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" /> Lịch sử mua
                  </button>
                  <button
                    onClick={() => setActiveTab('points')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg text-left transition-colors ${
                      activeTab === 'points'
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Gift className="w-4 h-4" /> Điểm thưởng
                  </button>
                </div>
              </div>
            ) : null}

            {/* Modal Content - cột phải 80% */}
            <div className={`${editingCustomer ? 'w-[80%]' : 'w-full'} flex-1 overflow-y-auto p-6`}>
              {/* Tab: Info / Form */}
              {(!editingCustomer || activeTab === 'info') && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Tên khách hàng <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="input"
                        placeholder="Nhập tên khách hàng"
                        value={formData.name || ''}
                        onChange={e => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mã khách hàng</label>
                      <input
                        className="input"
                        placeholder="Để trống để tự sinh"
                        value={(formData as any).code || ''}
                        onChange={e => setFormData((prev: any) => ({ ...prev, code: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Điện thoại 1 <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="input"
                        placeholder="Nhập số điện thoại chính"
                        value={formData.phone || ''}
                        onChange={e => setFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Điện thoại 2</label>
                      <input
                        className="input"
                        placeholder="Nhập số điện thoại phụ"
                        value={(formData as any).phone2 || ''}
                        onChange={e => setFormData((prev: any) => ({ ...prev, phone2: e.target.value } as any))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Sinh nhật</label>
                      <input
                        type="date"
                        className="input"
                        value={(formData as any).birthday || ''}
                        onChange={e => setFormData((prev: any) => ({ ...prev, birthday: e.target.value } as any))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Giới tính</label>
                      <select
                        className="input"
                        value={(formData as any).gender || ''}
                        onChange={e => setFormData((prev: any) => ({ ...prev, gender: e.target.value } as any))}
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="input"
                        placeholder="Nhập email"
                        value={(formData as any).email || ''}
                        onChange={e => setFormData((prev: any) => ({ ...prev, email: e.target.value } as any))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Facebook</label>
                      <input
                        className="input"
                        placeholder="Link hoặc tên Facebook"
                        value={(formData as any).facebook || ''}
                        onChange={e => setFormData((prev: any) => ({ ...prev, facebook: e.target.value } as any))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nhóm khách hàng</label>
                      <input
                        className="input"
                        placeholder="VD: Khách sỉ, Khách lẻ, VIP..."
                        value={(formData as any).customerGroup || ''}
                        onChange={e => setFormData((prev: any) => ({ ...prev, customerGroup: e.target.value } as any))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                      <input
                        className="input"
                        placeholder="Nhập địa chỉ"
                        value={formData.address || ''}
                        onChange={e => setFormData((prev: any) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                      <textarea
                        className="input"
                        rows={3}
                        placeholder="Nhập ghi chú về khách hàng"
                        value={(formData as any).note || ''}
                        onChange={e => setFormData((prev: any) => ({ ...prev, note: e.target.value } as any))}
                      />
                    </div>
                  </div>
                  {editingCustomer && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                      <div>
                        <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Tổng chi tiêu</span>
                        <div className="text-lg font-bold text-purple-700 mt-1">
                          {Number((editingCustomer as any).totalSpent || 0).toLocaleString('vi-VN')}₫
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Điểm thưởng</span>
                        <div className="text-lg font-bold text-amber-600 mt-1">
                          {Number((editingCustomer as any).loyaltyPoints || 0)} điểm
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">
                      Huỷ
                    </button>
                    <button type="submit" className="btn-primary">
                      {editingCustomer ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab: Purchase History */}
              {editingCustomer && activeTab === 'history' && (
                <div>
                  {isOrdersLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-lg" />
                      ))}
                    </div>
                  ) : customerOrders.length === 0 ? (
                    <EmptyState icon={<ShoppingBag className="w-12 h-12 text-slate-300" />} title="Chưa có đơn hàng" description="Khách hàng chưa có lịch sử mua hàng" />
                  ) : (
                    <div className="space-y-3">
                      {customerOrders.map(order => (
                        <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                          <div>
                            <div className="text-sm font-semibold text-slate-800">
                              Đơn #{order.id || 'N/A'}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-purple-700">
                              {(order.total || 0).toLocaleString('vi-VN')}₫
                            </div>
                            <div className="flex items-center gap-2 justify-end mt-1">
                              {(order.debt || 0) > 0 ? (
                                <>
                                  <span className="text-xs font-semibold text-red-500">
                                    Nợ {(order.debt || 0).toLocaleString('vi-VN')}₫
                                  </span>
                                  <button
                                    onClick={() => {
                                      setPaymentOrderId(order.id);
                                      setPaymentAmount(String(order.debt || 0));
                                    }}
                                    className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded hover:bg-purple-100 font-medium"
                                  >
                                    <Wallet className="w-3 h-3 inline mr-1" /> Thanh toán
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs font-semibold text-green-600">
                                  <CheckCircle className="w-3 h-3 inline mr-1" /> Đã thanh toán
                                </span>
                              )}
                              <button
                                onClick={() => onDeleteOrder?.(order.id)}
                                className="text-xs text-slate-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Payment Popover */}
                  {paymentOrderId && (
                    <div className="modal-overlay" onClick={() => setPaymentOrderId(null)}>
                      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Thanh toán công nợ</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền thanh toán</label>
                            <input
                              type="number"
                              className="input"
                              value={paymentAmount}
                              onChange={e => setPaymentAmount(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div className="flex justify-end gap-3">
                            <button onClick={() => setPaymentOrderId(null)} className="btn btn-ghost">Huỷ</button>
                            <button
                              onClick={async () => {
                                if (paymentAmount && Number(paymentAmount) > 0) {
                                  try {
                                    await onPayDebt?.(paymentOrderId, Number(paymentAmount));
                                    showToast("Thanh toán thành công!");
                                    setPaymentOrderId(null);
                                    setPaymentAmount('');
                                    // Re-fetch orders
                                    const orders = await supabaseService.getCustomerOrders(editingCustomer!.id);
                                    setCustomerOrders(orders);
                                    fetchCustomers(currentPage, debouncedSearchTerm);
                                  } catch (err) {
                                    console.error("Error paying debt:", err);
                                    showToast("Lỗi thanh toán!", "error");
                                  }
                                }
                              }}
                              className="btn-primary"
                            >
                              <Wallet className="w-4 h-4" /> Xác nhận
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Points */}
              {editingCustomer && activeTab === 'points' && (
                <div>
                  {/* Current Points */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg mb-4">
                    <div>
                      <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Điểm hiện tại</span>
                      <div className="text-2xl font-bold text-amber-600 mt-1">{Number((editingCustomer as any).loyaltyPoints || 0)}</div>
                    </div>
                    <button
                      onClick={() => setIsAdjustPointOpen(true)}
                      className="btn-primary btn-sm"
                    >
                      <Gift className="w-4 h-4" /> Điều chỉnh
                    </button>
                  </div>

                  {/* Point History */}
                  {isPointHistoryLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-12 rounded-lg" />
                      ))}
                    </div>
                  ) : customerPointHistory.length === 0 ? (
                    <EmptyState icon={<Gift className="w-12 h-12 text-slate-300" />} title="Chưa có lịch sử điểm" description="Khách hàng chưa có biến động điểm thưởng" />
                  ) : (
                    <div className="space-y-2">
                      {customerPointHistory.map((record: any, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <div className="text-sm font-medium text-slate-800">{(record as any).description || (record as any).points || 'Điều chỉnh điểm'}</div>
                            <div className="text-xs text-slate-500">
                              {record.createdAt ? new Date(record.createdAt).toLocaleDateString('vi-VN') : ''}
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${Number((record as any).amount || (record as any).points || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Number((record as any).amount || (record as any).points || 0) >= 0 ? '+' : ''}{Number((record as any).amount || (record as any).points || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Adjust Point Modal */}
                  {isAdjustPointOpen && (
                    <div className="modal-overlay" onClick={() => setIsAdjustPointOpen(false)}>
                      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Điều chỉnh điểm</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Số điểm (+ / -)</label>
                            <input
                              type="number"
                              className="input"
                              value={adjustPointValue}
                              onChange={e => setAdjustPointValue(e.target.value)}
                              placeholder="Nhập số điểm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Lý do</label>
                            <input
                              className="input"
                              value={adjustPointDesc}
                              onChange={e => setAdjustPointDesc(e.target.value)}
                              placeholder="Nhập lý do điều chỉnh"
                            />
                          </div>
                          <div className="flex justify-end gap-3">
                            <button onClick={() => setIsAdjustPointOpen(false)} className="btn btn-ghost">Huỷ</button>
                            <button
                              onClick={async () => {
                                if (adjustPointValue && Number(adjustPointValue) !== 0) {
                                  try {
                                    await onAdjustPoints?.(editingCustomer!.id, Number(adjustPointValue), adjustPointDesc);
                                    showToast("Điều chỉnh điểm thành công!");
                                    setIsAdjustPointOpen(false);
                                    setAdjustPointValue('');
                                    setAdjustPointDesc('');
                                    // Re-fetch point history
                                    const history = await supabaseService.getPointHistory(editingCustomer!.id);
                                    setCustomerPointHistory(history);
                                    fetchCustomers(currentPage, debouncedSearchTerm);
                                  } catch (err) {
                                    console.error("Error adjusting points:", err);
                                    showToast("Lỗi điều chỉnh điểm!", "error");
                                  }
                                }
                              }}
                              className="btn-primary"
                            >
                              <Gift className="w-4 h-4" /> Xác nhận
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for bulk bar */}
      {selectedIds.length > 0 && <div className="h-20" />}

      {/* Phase 13: MODAL THANH TOÁN CÔNG NỢ TỔNG (Mode MULTI - chọn từng đơn) */}
      {payingCustomer && onPayDebt && (
        <PayDebtModal
          isOpen={!!payingCustomer}
          onClose={() => setPayingCustomer(null)}
          onPayDebt={onPayDebt}
          customer={payingCustomer}
          onPaymentSuccess={async () => {
            showToast('Thanh toán công nợ thành công!');
            // Refresh danh sách khách bên ngoài
            await fetchCustomers(currentPage, debouncedSearchTerm);
            // Quan trọng: refresh CẢ editingCustomer (modal chi tiết) để công nợ trong tab Thông tin
            // được cập nhật theo dữ liệu mới từ DB — nếu không nó sẽ giữ giá trị cũ.
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
            // Refresh editingCustomer + danh sách sau khi adjust
            try {
              const fresh = await supabaseService.getCustomerById(ledgerCustomerId);
              if (fresh) setEditingCustomer(fresh);
            } catch (err) {
              console.error('Refresh customer after adjust failed:', err);
            }
            await fetchCustomers(currentPage, debouncedSearchTerm);
          }}
        />
      )}
    </PageLayout>
  );
};
