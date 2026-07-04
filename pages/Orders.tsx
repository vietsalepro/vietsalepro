import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, AppSettings, Customer, Product } from '../types';
import { 
  FileText, Calendar, User, Clock, X, Trash2, XCircle,
  Printer, ChevronLeft, ChevronRight, Loader2, Search,
  Eye, ShoppingBag, CheckCircle2, Wallet, RefreshCw, ArrowRight, Download, Upload, FileSpreadsheet, Ban, Plus,
  TrendingUp,
} from 'lucide-react';
import StatsRow from '../components/shared/StatsRow';

// ─── Helper: phân loại trạng thái đơn hàng theo 4 nhóm chuẩn ─────────
// Ưu tiên: cancelled > hasReturn > debt > completed
type OrderStatusKind = 'cancelled' | 'returned' | 'debt' | 'completed';
const getOrderStatusKind = (o: Order): OrderStatusKind => {
  if (o.status === 'cancelled') return 'cancelled';
  if (o.hasReturn) return 'returned';
  if (typeof o.debtRecorded === 'number' && o.debtRecorded > 0) return 'debt';
  return 'completed';
};
import { printOrder } from '../utils/printOrder';
import { supabaseService } from '../services/supabaseService';
import { exportOrdersToExcel, downloadOrderTemplate } from '../utils/excel/orderExporter';
import { importOrdersFromExcel, executeImport, ImportResult, ParsedOrder } from '../utils/excel/orderImporter';
import { ImportPreviewModal } from '../components/orders/ImportPreviewModal';
import { PayDebtModal } from '../components/PayDebtModal';
import { StatusBadge } from '../components/StatusBadge';
import { ActionButton } from '../components/ActionButton';
import { DataGrid, DataGridColumn, SortDirection } from '../components/DataGrid';
import { MasterModal } from '../components/MasterModal';
import { useNewDataGridOrders } from '../features';
import { PageLayout } from '../components/shared/PageLayout';
import { DataGridBox } from '../components/shared/DataGridBox';
import { useDebounce } from '../hooks/useDebounce';
import '../components/shared/FilterBar.css';
import './Orders.css';

interface OrdersProps {
  products?: Product[];
  customers?: Customer[];
  onDeleteOrder?: (id: string) => void;
  onPayDebt?: (orderId: string, amount: number) => Promise<void> | void;
  appSettings: AppSettings;
}

export const Orders: React.FC<OrdersProps> = ({ products = [], customers: _customers = [], onDeleteOrder, onPayDebt, appSettings }) => {
  // Phase 13: state cho modal thanh toán công nợ (mode single)
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Phase 6: customer cache — fetch on-demand thay vì dùng prop customers = []
  const [customerCache, setCustomerCache] = useState<Map<string, Customer>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderIdSearch, setOrderIdSearch] = useState('');
  
  // STATE QUẢN LÝ TÍNH NĂNG CHECKBOX
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // State phục vụ thống kê Stat Cards (4 trạng thái + tổng doanh thu)
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    debtOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    returnOrders: 0
  });
  
  // State cho Export
  const [isExporting, setIsExporting] = useState(false);
  
  // State cho Import
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataGridBoxRef = useRef<HTMLDivElement>(null);

  const [pageSize] = useState(8);
  const [v2SortConfig, setV2SortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const debouncedCustomerSearch = useDebounce(customerSearch, 300);
  const debouncedOrderIdSearch = useDebounce(orderIdSearch, 300);

  const fetchOrders = async (page: number) => {
    setIsLoading(true);
    try {
      const filters = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        customerName: debouncedCustomerSearch || undefined,
        orderId: debouncedOrderIdSearch || undefined
      };
      const result = await supabaseService.getOrdersPaginated(page, pageSize, filters);
      setOrders(result.orders);
      setTotalCount(result.totalCount);

      // Tính toán thống kê theo 4 trạng thái chuẩn (loại trừ chồng chéo)
      const completed = result.orders.filter(o => getOrderStatusKind(o) === 'completed').length;
      const debt = result.orders.filter(o => getOrderStatusKind(o) === 'debt').length;
      const returned = result.orders.filter(o => getOrderStatusKind(o) === 'returned').length;
      const cancelled = result.orders.filter(o => getOrderStatusKind(o) === 'cancelled').length;
      // Doanh thu KHÔNG tính đơn đã huỷ
      const revenue = result.orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      setStats({
        totalOrders: result.totalCount,
        completedOrders: completed,
        debtOrders: debt,
        cancelledOrders: cancelled,
        totalRevenue: revenue,
        returnOrders: returned
      });

    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage);
    setSelectedIds([]);
  }, [currentPage, pageSize, startDate, endDate, debouncedCustomerSearch, debouncedOrderIdSearch]);

  // Phase 6: prefetch customers cho trang hiện tại
  useEffect(() => {
    const ids = [...new Set(orders.map(o => o.customerId).filter(Boolean))];
    if (ids.length === 0) return;
    ids.forEach(async (id) => {
      if (customerCache.has(id)) return;
      try {
        const c = await supabaseService.getCustomerById(id);
        if (c) setCustomerCache(prev => new Map(prev).set(id, c));
      } catch { /* ignore */ }
    });
  }, [orders]);

  // Helper tra cứu customer từ cache
  const getCustomer = (customerId?: string): Customer | undefined => {
    if (!customerId) return undefined;
    return customerCache.get(customerId);
  };

  // HÀM XỬ LÝ LOGIC CHECKBOX
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = orders.map(order => order.id);
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

  const handleBulkDelete = () => {
    if (!onDeleteOrder) return;
    // Lọc bỏ đơn đã huỷ (không huỷ lại được)
    const cancellableIds = selectedIds.filter(id => {
      const o = orders.find(x => x.id === id);
      return o && o.status !== 'cancelled';
    });
    if (cancellableIds.length === 0) {
      alert('Các đơn đã chọn đều ở trạng thái "Đã huỷ". Không thể huỷ lại.');
      return;
    }
    const skipped = selectedIds.length - cancellableIds.length;
    const msg = skipped > 0
      ? `Sẽ HUỶ ${cancellableIds.length} đơn hàng đã chọn (bỏ qua ${skipped} đơn đã huỷ).\n\nĐơn sẽ chuyển sang trạng thái "Đã huỷ", hoàn kho/công nợ/điểm. Tiếp tục?`
      : `Bạn có chắc chắn muốn HUỶ ${cancellableIds.length} đơn hàng đã chọn?\n\nĐơn sẽ chuyển sang trạng thái "Đã huỷ", hoàn kho/công nợ/điểm.`;
    if (window.confirm(msg)) {
      cancellableIds.forEach(id => onDeleteOrder(id));
      setSelectedIds([]);
      fetchOrders(currentPage);
    }
  };

  const handlePrint = () => {
    if (selectedOrder) {
      const customer = getCustomer(selectedOrder.customerId);
      printOrder(selectedOrder, appSettings, customer);
    }
  };

  const handleDelete = () => {
    if (selectedOrder && onDeleteOrder) {
      // Đơn đã huỷ không thao tác được nữa (Phương án A: read-only)
      if (selectedOrder.status === 'cancelled') {
        alert('Đơn hàng này đã ở trạng thái "Đã huỷ". Không thể thao tác thêm.');
        return;
      }
      // App.handleDeleteOrder tự xử lý confirm + gọi cancelOrder (soft-delete)
      onDeleteOrder(selectedOrder.id);
      setSelectedOrder(null);
      fetchOrders(currentPage);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportOrdersToExcel(orders, { startDate, endDate, customerSearch });
      alert('✅ Xuất file Excel thành công!');
    } catch (error: any) {
      console.error('Export error:', error);
      alert(`❌ Lỗi khi xuất file: ${error.message || 'Vui lòng thử lại'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadOrderTemplate();
    } catch (error: any) {
      console.error('Template download error:', error);
      alert(`❌ Lỗi khi tải file mẫu: ${error.message || 'Vui lòng thử lại'}`);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input để có thể chọn lại cùng file
    event.target.value = '';

    try {
      setIsImporting(true);
      setImportFileName(file.name);
      const result = await importOrdersFromExcel(file);
      setImportResult(result);
    } catch (error: any) {
      console.error('Import error:', error);
      alert(`❌ Lỗi khi đọc file:\n${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async (orders: ParsedOrder[]) => {
    if (!importResult) return;

    try {
      const result = await executeImport(orders, {
        fileName: importFileName || 'import.xlsx',
        sourceSoftware: importResult.sourceSoftware,
      });

      setImportResult(null);
      setImportFileName('');

      // Hiển thị kết quả
      const message = [
        `✅ Import hoàn tất!`,
        `- Nhập thành công: ${result.success} đơn`,
        result.newCustomers > 0 ? `- Khách hàng mới được tạo: ${result.newCustomers}` : '',
        result.skipped > 0 ? `- Bỏ qua: ${result.skipped} đơn (trùng)` : '',
        result.failed > 0 ? `- Thất bại: ${result.failed} đơn` : ''
      ].filter(Boolean).join('\n');

      alert(message);

      // Refresh danh sách
      fetchOrders(currentPage);
    } catch (error: any) {
      console.error('Execute import error:', error);
      alert(`❌ Lỗi khi nhập dữ liệu: ${error.message}`);
    }
  };

  const handleCancelImport = () => {
    setImportResult(null);
  };

  // V2 DataGrid helpers
  const handleDataGridSort = (key: string, direction: SortDirection) => {
    if (direction === 'none') {
      setV2SortConfig(null);
    } else {
      setV2SortConfig({ key, direction });
    }
  };

  const getV2OrderStatusBadge = (order: Order) => {
    const kind = getOrderStatusKind(order);
    switch (kind) {
      case 'cancelled':
        return <StatusBadge label="Đã huỷ" type="default" size="sm" />;
      case 'returned':
        return <StatusBadge label="Trả hàng" type="warning" size="sm" />;
      case 'debt':
        return <StatusBadge label="Công nợ" type="danger" size="sm" />;
      default:
        return <StatusBadge label="Đã hoàn thành" type="success" size="sm" />;
    }
  };



  const orderColumns: DataGridColumn<Order>[] = [
    {
      key: 'id',
      label: 'Mã đơn hàng',
      sortable: true,
      render: (order) => (
        <button
          className="orders-v2-code"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedOrder(order);
          }}
        >
          <span className="orders-v2-code-icon">
            <FileText className="w-4 h-4" />
          </span>
          #{order.id}
        </button>
      ),
    },
    {
      key: 'date',
      label: 'Thời gian',
      sortable: true,
      render: (order) => (
        <span className="orders-v2-date">
          <Clock className="w-3.5 h-3.5" />
          {new Date(order.date).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'customerName',
      label: 'Khách hàng',
      sortable: true,
      render: (order) => {
        const customer = getCustomer(order.customerId);
        return <span className="text-sm text-slate-700 font-medium">{customer ? customer.name : (order.customerName || 'Khách vãng lai')}</span>;
      },
    },
    {
      key: 'totalAmount',
      label: 'Tổng tiền',
      sortable: true,
      align: 'right',
      render: (order) => <span className="orders-v2-amount">{order.totalAmount.toLocaleString('vi-VN')}đ</span>,
    },
    {
      key: 'paidAmount',
      label: 'Khách trả',
      sortable: true,
      align: 'right',
      render: (order) => <span className="orders-v2-paid">{(order.paidAmount ?? order.totalAmount).toLocaleString('vi-VN')}đ</span>,
    },
    {
      key: 'status',
      label: 'Trạng thái',
      align: 'center',
      render: getV2OrderStatusBadge,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'right',
      render: (order) => (
        <div className="orders-v2-actions">
          {onPayDebt && getOrderStatusKind(order) === 'debt' && (
            <ActionButton
              variant="secondary"
              size="sm"
              icon={<Wallet className="w-3.5 h-3.5" />}
              onClick={(e) => {
                e?.stopPropagation();
                setPayingOrder(order);
              }}
            >
              Thanh toán
            </ActionButton>
          )}
          <ActionButton
            variant="ghost"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={(e) => {
              e?.stopPropagation();
              setSelectedOrder(order);
            }}
            aria-label="Xem chi tiết"
          />
          <ActionButton
            variant="ghost"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={(e) => {
              e?.stopPropagation();
              const customer = getCustomer(order.customerId);
              printOrder(order, appSettings, customer);
            }}
            aria-label="In hoá đơn"
          />
        </div>
      ),
    },
  ];

  return (
    <PageLayout>
      
      {/* HEADER TIÊU ĐỀ + THANH TÌM KIẾM & BỘ LỌC (cùng hàng) */}
      <div className="page-header items-start">
        <div className="flex items-center gap-3">
          <span className="inv-title-icon">
            <ShoppingBag className="w-4 h-4" />
          </span>
          <div>
            <h1 className="page-title">Lịch sử đơn hàng</h1>
            <p className="page-subtitle">Xem, in và quản lý trạng thái các hóa đơn bán hàng</p>
          </div>
        </div>

        {/* Thanh tìm kiếm & bộ lọc */}
        <div className="flex flex-1 min-w-0 items-start md:mx-4">
          <div className="filter-bar">
            <div className="filter-bar__search">
              <Search className="filter-bar__search-icon" />
              <input
                type="text"
                placeholder="Tìm mã đơn hàng (ID)..."
                value={orderIdSearch}
                onChange={(e) => { setOrderIdSearch(e.target.value); setCurrentPage(1); }}
                className="filter-bar__search-input"
              />
            </div>
            <div className="filter-bar__search">
              <User className="filter-bar__search-icon" />
              <input
                type="text"
                placeholder="Tìm theo tên khách hàng..."
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setCurrentPage(1); }}
                className="filter-bar__search-input"
              />
            </div>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} className="filter-bar__date-input" title="Từ ngày" />
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} className="filter-bar__date-input" title="Đến ngày" />
          </div>
        </div>

        {/* Hidden file input cho Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Button Group: Mẫu | Nhập | Xuất (đồng bộ tab Khách hàng / Nhà cung cấp) */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex-shrink-0">
            <button
              onClick={handleDownloadTemplate}
              className="p-2 text-slate-600 hover:text-purple-600 hover:bg-slate-50 rounded-lg flex items-center gap-1 text-sm font-medium"
              title="Tải file Excel mẫu để nhập đơn hàng"
            >
              <FileSpreadsheet className="w-4 h-4" /> <span>Mẫu</span>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-lg flex items-center gap-1 text-sm font-medium disabled:opacity-50"
              title="Nhập đơn hàng từ file Excel"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>Nhập</span>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button
              onClick={handleExportExcel}
              disabled={isExporting || orders.length === 0}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg flex items-center gap-1 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title={orders.length === 0 ? 'Không có đơn hàng để xuất' : 'Xuất file Excel'}
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Xuất</span>
            </button>
          </div>

          {/* Thanh tác vụ tự động kích hoạt */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2 animate-fade-in flex-shrink-0">
              <span className="text-sm font-semibold text-red-700">Đã chọn {selectedIds.length}</span>
              <button
                onClick={handleBulkDelete}
                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                title="Huỷ hàng loạt"
              >
                <Ban className="w-4 h-4" />
              </button>
            </div>
          )}

          <button onClick={() => navigate('/pos')} className="btn-primary flex items-center gap-2 px-4 py-2.5 self-start flex-shrink-0">
            <Plus className="w-4 h-4" /> Tạo đơn hàng
          </button>
        </div>
      </div>

      <StatsRow stats={[
        { label: 'Tổng đơn hàng', value: stats.totalOrders, subtext: 'Toàn bộ đơn', icon: <ShoppingBag />, colorScheme: 'purple' },
        { label: 'Đơn hoàn thành', value: stats.completedOrders, subtext: 'Đã xử lý xong', icon: <CheckCircle2 />, colorScheme: 'blue' },
        { label: 'Đơn ghi nợ', value: stats.debtOrders, subtext: 'Chưa thanh toán', icon: <Wallet />, colorScheme: 'orange' },
        { label: 'Tổng doanh thu', value: stats.totalRevenue.toLocaleString('vi-VN') + 'đ', subtext: 'Tổng cộng', icon: <TrendingUp />, colorScheme: 'green' },
        { label: 'Đơn trả hàng', value: stats.returnOrders, subtext: 'Đã hoàn trả', icon: <RefreshCw />, colorScheme: 'red' },
      ]} />

      {/* MAIN DATA TABLE */}
      <DataGridBox innerRef={dataGridBoxRef}>

        {useNewDataGridOrders ? (
          <div className="orders-v2-datagrid flex-1 min-h-0">
            <DataGrid
              className="flex-1 min-h-0"
              embedded
              data={orders}
              columns={orderColumns}
              keyExtractor={(order) => order.id}
              loading={isLoading && orders.length === 0}
              selectedRows={selectedIds}
              onSelectionChange={(ids) => setSelectedIds(ids as string[])}
              onRowClick={(order) => setSelectedOrder(order)}
              sortKey={v2SortConfig?.key}
              sortDirection={v2SortConfig?.direction || 'none'}
              onSortChange={handleDataGridSort}
              pagination={{
                currentPage,
                totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
                totalCount,
                pageSize,
                onPageChange: (page) => { setCurrentPage(page); fetchOrders(page); },
                showInfo: false,
              }}
              emptyTitle="Không tìm thấy hóa đơn nào"
              emptyDescription="Thử tìm kiếm với từ khóa khác hoặc tạo đơn hàng mới."
              emptyAction={
                <ActionButton
                  variant="primary"
                  size="md"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => navigate('/pos')}
                >
                  Tạo đơn hàng
                </ActionButton>
              }
            />
          </div>
        ) : (
          <>
            {/* TABLE VIEW */}
            <div className="flex-1 min-h-0 overflow-x-auto -mx-6">
              <div className="inline-block min-w-full align-middle px-6">
                <table className="min-w-full divide-y divide-slate-100 text-left text-sm table-fixed">
                  <colgroup>
                    <col className="w-12" />
                    <col className="w-[13%]" />
                    <col className="w-[13%]" />
                    <col className="w-[15%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                    <col className="w-[13%]" />
                    <col className="w-[20%]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col" className="w-12 py-3.5">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                          checked={orders.length > 0 && selectedIds.length === orders.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Mã đơn hàng</th>
                      <th scope="col" className="px-3 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Thời gian</th>
                      <th scope="col" className="px-3 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Khách hàng</th>
                      <th scope="col" className="px-3 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Tổng tiền</th>
                      <th scope="col" className="px-3 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Khách trả</th>
                      <th scope="col" className="px-3 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Trạng thái</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
                            <p className="text-xs">Đang tải hóa đơn...</p>
                          </div>
                        </td>
                      </tr>
                    ) : orders.length > 0 ? (
                      orders.map((order) => {
                        const customer = getCustomer(order.customerId);
                        
                        return (
                          <tr key={order.id} className="hover:bg-slate-50/60 transition-colors group">
                            <td className="whitespace-nowrap py-4">
                              <input 
                                type="checkbox" 
                                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                                checked={selectedIds.includes(order.id)}
                                onChange={(e) => handleSelectRow(order.id, e.target.checked)}
                              />
                            </td>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <span className="text-slate-900 font-semibold hover:underline cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                  #{order.id}
                                </span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{new Date(order.date).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit'})}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-700 font-medium">
                              {customer ? customer.name : 'Khách vãng lai'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900 font-bold text-right">
                              {order.totalAmount.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-emerald-600 font-semibold text-right">
                              {(order.paidAmount ?? order.totalAmount).toLocaleString('vi-VN')}đ
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-center">
                              {(() => {
                                const kind = getOrderStatusKind(order);
                                if (kind === 'cancelled') {
                                  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200"><Ban className="w-3 h-3" /> Đã huỷ</span>;
                                }
                                if (kind === 'returned') {
                                  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100"><RefreshCw className="w-3 h-3" /> Trả hàng</span>;
                                }
                                if (kind === 'debt') {
                                  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-100"><Wallet className="w-3 h-3" /> Công nợ</span>;
                                }
                                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle2 className="w-3 h-3" /> Đã hoàn thành</span>;
                              })()}
                            </td>
                            <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Phase 13: nút Thanh toán công nợ — chỉ hiện khi đơn còn nợ và chưa huỷ */}
                                {onPayDebt && getOrderStatusKind(order) === 'debt' && (
                                  <button
                                    onClick={() => setPayingOrder(order)}
                                    className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all flex items-center gap-1"
                                    title="Thanh toán công nợ cho đơn này"
                                  >
                                    <Wallet className="w-3.5 h-3.5" />
                                    Thanh toán
                                  </button>
                                )}
                                <button onClick={() => setSelectedOrder(order)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition-all" title="Xem chi tiết">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button onClick={() => {
                                  const customer = getCustomer(order.customerId);
                                  printOrder(order, appSettings, customer);
                                }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all" title="In hoá đơn">
                                  <Printer className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-10 text-center text-slate-400">Không tìm thấy hóa đơn nào.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINATION */}
            {totalCount > 0 && (() => {
              const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
              // Tạo danh sách số trang: hiển thị tối đa 5 số trang xung quanh trang hiện tại + đầu/cuối
              const getPageNumbers = (): (number | string)[] => {
                const pages: (number | string)[] = [];
                const showEllipsis = totalPages > 7;
                if (!showEllipsis) {
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

              return (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 mt-4 border-t border-slate-100">
                  <div className="text-sm text-slate-400">
                    Hiển thị <span className="font-medium text-slate-700">{Math.min((currentPage - 1) * pageSize + 1, totalCount)} - {Math.min(currentPage * pageSize, totalCount)}</span> trên tổng số <span className="font-medium text-slate-700">{totalCount}</span> đơn hàng
                  </div>
                  <div className="flex items-center gap-4">
                    <nav className="inline-flex items-center gap-1 rounded-xl bg-slate-50 p-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg disabled:opacity-40 transition-all"
                        title="Trang trước"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {getPageNumbers().map((page, idx) =>
                        typeof page === 'number' ? (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(page)}
                            className={`inline-flex items-center justify-center min-w-[32px] h-[32px] text-sm font-semibold rounded-lg transition-all ${
                              page === currentPage
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                            }`}
                          >
                            {page}
                          </button>
                        ) : (
                          <span key={idx} className="px-2 text-slate-400 text-sm select-none">…</span>
                        )
                      )}
                      <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage * pageSize >= totalCount}
                        className="inline-flex items-center p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg disabled:opacity-40 transition-all"
                        title="Trang sau"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </nav>
                  </div>
                </div>
              );
            })()}
          </>
        )}

      </DataGridBox>

      {/* MODAL IMPORT PREVIEW */}
      {importResult && (
        <ImportPreviewModal
          result={importResult}
          onConfirm={handleConfirmImport}
          onCancel={handleCancelImport}
        />
      )}

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <MasterModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Chi tiết hoá đơn #${selectedOrder.id}`}
          size="xl"
          footer={
            <>
              {selectedOrder.status === 'cancelled' ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 rounded-xl">
                  <Ban className="w-4 h-4" />
                  Đơn đã huỷ — chỉ xem & in
                </span>
              ) : (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                  title="Huỷ hoá đơn (đơn vẫn lưu lịch sử, hoàn kho/công nợ/điểm)"
                >
                  <Ban className="w-4 h-4" />
                  {selectedOrder.hasReturn ? 'Huỷ hoá đơn (Giữ tồn kho)' : 'Huỷ hoá đơn (Hoàn kho)'}
                </button>
              )}
              <div className="flex gap-3 ml-auto">
                {onPayDebt && getOrderStatusKind(selectedOrder) === 'debt' && (
                  <button
                    onClick={() => setPayingOrder(selectedOrder)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl transition-colors shadow-sm"
                  >
                    <Wallet className="w-4 h-4" />
                    Thanh toán công nợ
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  In hoá đơn
                </button>
                {selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => { setSelectedOrder(null); navigate(`/return-orders?orderId=${selectedOrder.id}`); }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Trả hàng
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Đóng
                </button>
              </div>
            </>
          }
        >
          <div className="flex flex-col md:flex-row gap-6">
            {/* CỘT TRÁI */}
            <div className="w-full md:w-[30%] space-y-4">
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-1">Khách hàng</p>
                <p className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  {getCustomer(selectedOrder.customerId)?.name || selectedOrder.customerName || 'Khách vãng lai'}
                </p>
              </div>
              {/* Trạng thái */}
              {(() => {
                const kind = getOrderStatusKind(selectedOrder);
                const cfg = {
                  cancelled: { bg: 'bg-slate-100', border: 'border-slate-200', label: 'text-slate-500', text: 'text-slate-700', icon: <Ban className="w-4 h-4" />, name: 'Đã huỷ' },
                  returned:  { bg: 'bg-amber-50',  border: 'border-amber-100',  label: 'text-amber-600',  text: 'text-amber-700',  icon: <RefreshCw className="w-4 h-4" />, name: 'Trả hàng' },
                  debt:      { bg: 'bg-red-50',    border: 'border-red-100',    label: 'text-red-500',    text: 'text-red-700',    icon: <Wallet className="w-4 h-4" />, name: 'Công nợ' },
                  completed: { bg: 'bg-emerald-50',border: 'border-emerald-100',label: 'text-emerald-600',text: 'text-emerald-700',icon: <CheckCircle2 className="w-4 h-4" />, name: 'Đã hoàn thành' },
                }[kind];
                return (
                  <div className={`p-4 ${cfg.bg} rounded-xl border ${cfg.border}`}>
                    <p className={`text-xs font-semibold ${cfg.label} uppercase tracking-wider mb-1`}>Trạng thái</p>
                    <p className={`text-base font-bold ${cfg.text} flex items-center gap-2`}>
                      {cfg.icon} {cfg.name}
                    </p>
                  </div>
                );
              })()}
            </div>
            {/* CỘT PHẢI */}
            <div className="w-full md:w-[70%] border-l border-gray-100 pl-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5">Sản phẩm</th>
                    <th className="px-4 py-2.5 text-center">SL</th>
                    <th className="px-4 py-2.5 text-right">Đơn giá</th>
                    <th className="px-4 py-2.5 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-800">{item.productName}</p>
                      </td>
                      <td className="px-4 py-2.5 text-center text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{item.price.toLocaleString('vi-VN')}đ</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{(item.quantity * item.price).toLocaleString('vi-VN')}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </MasterModal>
      )}

      {/* Phase 13: MODAL THANH TOÁN CÔNG NỢ (Mode SINGLE) */}
      {payingOrder && onPayDebt && (
        <div className="vsp-modal-sync">
          <PayDebtModal
            isOpen={!!payingOrder}
            onClose={() => setPayingOrder(null)}
            onPayDebt={onPayDebt}
            order={payingOrder}
            onPaymentSuccess={() => {
              // Đóng modal chi tiết nếu đang mở cùng đơn
              if (selectedOrder?.id === payingOrder.id) setSelectedOrder(null);
              fetchOrders(currentPage);
            }}
          />
        </div>
      )}
    </PageLayout>
  );
};
