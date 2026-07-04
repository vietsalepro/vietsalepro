import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Product, InventoryCount as InventoryCountType, InventoryCountItem } from '../types';
import * as XLSX from 'xlsx';
import { DataGrid, DataGridColumn, SortDirection } from '../components/DataGrid';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { DataGridBox } from '../components/shared/DataGridBox';
import { supabaseService } from '../services/supabaseService';
import { PageLayout } from '../components/shared/PageLayout';
import { CountFormLayout } from '../components/inventory-count/CountFormLayout';
import {
  VoucherButton,
  VoucherEmpty,
  VoucherTable,
  VoucherTableRow,
} from '../components/voucher-form';
import { ActionButton } from '../components/ActionButton';
import BarcodeScannerFix from '../components/BarcodeScannerFix';
import { useNewDataGridInventoryCounts } from '../features';
import {
  ClipboardList,
  Plus,
  Search,
  FileSpreadsheet,
  Upload,
  Download,
  X,
  Layers,
  ArrowUpDown,
  ChevronDown,
  Check,
  FileText,
  Wallet,
  Edit,
  CheckCircle,
  Ban,
  Trash2,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ScanBarcode,
} from 'lucide-react';
import '../components/shared/FilterBar.css';
import './InventoryCount.css';

interface InventoryCountProps {
  inventoryCounts?: InventoryCountType[];
  products?: Product[];
  onSaveInventoryCount: (count: InventoryCountType) => void;
  onDeleteInventoryCount: (id: string) => void;
  onCancelInventoryCount: (id: string) => void;
}

const ITEMS_PER_PAGE = 20;

export const InventoryCount: React.FC<InventoryCountProps> = ({
  inventoryCounts = [],
  products: productsProp,
  onSaveInventoryCount,
  onDeleteInventoryCount,
  onCancelInventoryCount,
}) => {
  const [productsFallback, setProductsFallback] = useState<Product[]>([]);
  const products = productsProp || productsFallback;
  const location = useLocation();
  const navigate = useNavigate();
  const isCreateRoute = useMemo(() => location.pathname === '/inventory-count/create', [location.pathname]);

  useEffect(() => {
    if (!productsProp) {
      supabaseService.getProducts().then(setProductsFallback).catch(console.error);
    }
  }, [productsProp]);

  // --- Inventory Count Filter/Search/Pagination State ---
  const [countSearchTerm2, setCountSearchTerm2] = useState('');
  const [countStatusFilter, setCountStatusFilter] = useState<'all' | 'draft' | 'completed' | 'cancelled'>('all');
  const [isCountStatusFilterOpen, setIsCountStatusFilterOpen] = useState(false);
  const [countDateFrom, setCountDateFrom] = useState('');
  const [countDateTo, setCountDateTo] = useState('');
  const [countDiffFilter, setCountDiffFilter] = useState<'all' | 'increase' | 'decrease' | 'none'>('all');
  const [isCountDiffFilterOpen, setIsCountDiffFilterOpen] = useState(false);
  const [countSortBy, setCountSortBy] = useState<'date_desc' | 'date_asc' | 'diff_desc' | 'diff_asc'>('date_desc');
  const [isCountSortOpen, setIsCountSortOpen] = useState(false);
  const [countCurrentPage, setCountCurrentPage] = useState(1);
  const [countPageSize, setCountPageSize] = useState(ITEMS_PER_PAGE);

  // Bulk Selection State (Inventory Counts)
  const [selectedCountIds, setSelectedCountIds] = useState<Set<string>>(new Set());

  // --- Inventory Count State ---
  // URL /inventory-count/create mở form tạo mới; edit/view dùng internal state trên /inventory-count
  const [editingCount, setEditingCount] = useState<InventoryCountType | null>(null);
  const isCountFormOpen = isCreateRoute || editingCount !== null;

  const [countSearchTerm, setCountSearchTerm] = useState(''); // Search inside count modal
  const [countFormData, setCountFormData] = useState<Partial<InventoryCountType>>({
     code: '',
     date: '',
     status: 'draft',
     items: [],
     notes: ''
  });

  // --- Scanner State ---
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const countFileInputRef = useRef<HTMLInputElement>(null);

  // Layout refs
  const countsDataGridBoxRef = useRef<HTMLDivElement>(null);

  // Filter Logic (Product Search inside Count Modal)
  const filteredProductsForCount = products.filter(p => {
    const keyword = countSearchTerm.trim().toLowerCase();
    return (p.name || '').toLowerCase().includes(keyword) ||
      (p.displayName || '').toLowerCase().includes(keyword) ||
      (p.code || '').toLowerCase().includes(keyword) ||
      (p.barcode || '').toLowerCase().includes(keyword);
  });

  // --- Inventory Count Filter + Sort + Pagination Logic ---
  const countStatusLabels: Record<string, string> = { all: 'Tất cả', draft: 'Bản nháp', completed: 'Hoàn thành', cancelled: 'Đã huỷ' };
  const countDiffLabels: Record<string, string> = { all: 'Tất cả', increase: 'Tăng (+)', decrease: 'Giảm (-)', none: 'Không lệch' };
  const countSortLabels: Record<string, string> = { date_desc: 'Ngày mới nhất', date_asc: 'Ngày cũ nhất', diff_desc: 'Chênh lệch cao nhất', diff_asc: 'Chênh lệch thấp nhất' };

  // Helper: tổng chênh lệch số lượng của 1 phiếu
  const getCountQtyDiff = (c: InventoryCountType) =>
    c.items.reduce((sum, item) => sum + (item.actualQuantity - item.systemQuantity), 0);

  const isCountFilterActive =
    countSearchTerm2.trim() !== '' ||
    countStatusFilter !== 'all' ||
    countDateFrom !== '' ||
    countDateTo !== '' ||
    countDiffFilter !== 'all' ||
    countSortBy !== 'date_desc';

  const filteredCounts = inventoryCounts
    .slice()
    .filter(c => {
      const matchesSearch = c.code.toLowerCase().includes(countSearchTerm2.toLowerCase());
      const matchesStatus = countStatusFilter === 'all' || c.status === countStatusFilter;

      // Lọc theo khoảng ngày kiểm kê (so sánh theo chuỗi yyyy-mm-dd)
      const countDay = c.date ? c.date.slice(0, 10) : '';
      const matchesDateFrom = !countDateFrom || (countDay && countDay >= countDateFrom);
      const matchesDateTo = !countDateTo || (countDay && countDay <= countDateTo);

      // Lọc theo chênh lệch
      const qtyDiff = getCountQtyDiff(c);
      const matchesDiff =
        countDiffFilter === 'all' ||
        (countDiffFilter === 'increase' && qtyDiff > 0) ||
        (countDiffFilter === 'decrease' && qtyDiff < 0) ||
        (countDiffFilter === 'none' && qtyDiff === 0);

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesDiff;
    })
    .sort((a, b) => {
      switch (countSortBy) {
        case 'date_asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'diff_desc':
          return getCountQtyDiff(b) - getCountQtyDiff(a);
        case 'diff_asc':
          return getCountQtyDiff(a) - getCountQtyDiff(b);
        case 'date_desc':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  const countTotalPages = Math.ceil(filteredCounts.length / countPageSize);
  const countStartIndex = (countCurrentPage - 1) * countPageSize;
  const paginatedCounts = filteredCounts.slice(countStartIndex, countStartIndex + countPageSize);

  // Reset selection + page về đầu khi đổi bộ lọc
  useEffect(() => {
    setSelectedCountIds(new Set());
    setCountCurrentPage(1);
  }, [countSearchTerm2, countStatusFilter, countDateFrom, countDateTo, countDiffFilter, countSortBy]);

  // Reset selection khi đổi trang
  useEffect(() => {
    setSelectedCountIds(new Set());
  }, [countCurrentPage]);

  const resetCountFilters = () => {
    setCountSearchTerm2('');
    setCountStatusFilter('all');
    setCountDateFrom('');
    setCountDateTo('');
    setCountDiffFilter('all');
    setCountSortBy('date_desc');
  };

  // === V2 DataGrid helpers (Inventory Counts) ===
  const countSortKey = countSortBy.startsWith('date_')
    ? 'date'
    : countSortBy.startsWith('diff_')
    ? 'qtyDiff'
    : undefined;
  const countSortDirection: SortDirection =
    countSortBy === 'date_asc' || countSortBy === 'diff_asc'
      ? 'asc'
      : countSortBy === 'date_desc' || countSortBy === 'diff_desc'
      ? 'desc'
      : 'none';

  const handleCountDataGridSort = (key: string, direction: SortDirection) => {
    if (direction === 'none') {
      setCountSortBy('date_desc');
    } else if (key === 'date') {
      setCountSortBy(direction === 'asc' ? 'date_asc' : 'date_desc');
    } else if (key === 'qtyDiff') {
      setCountSortBy(direction === 'asc' ? 'diff_asc' : 'diff_desc');
    }
  };

  // --- V2 DataGrid columns for Inventory Counts ---
  const countColumns: DataGridColumn<InventoryCountType>[] = [
    {
      key: 'stt',
      label: 'STT',
      align: 'center',
      width: '48px',
      render: (_, index) => countStartIndex + index + 1,
    },
    {
      key: 'code',
      label: 'Mã phiếu',
      sortable: true,
      render: (count) => (
        <div className="inventory-count-v2-code">
          <ClipboardList className="inventory-count-v2-code__icon" />
          <span>{count.code}</span>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Ngày kiểm kê',
      sortable: true,
      render: (count) => (
        <span className="inventory-count-v2-date">
          {new Date(count.date).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'itemsCount',
      label: 'SL sản phẩm',
      align: 'center',
      render: (count) => (
        <span className="inventory-count-v2-items">{count.items.length}</span>
      ),
    },
    {
      key: 'qtyDiff',
      label: 'SL lệch',
      sortable: true,
      align: 'center',
      render: (count) => {
        const totalQtyDiff = count.items.reduce(
          (sum, item) => sum + (item.actualQuantity - item.systemQuantity),
          0
        );
        return (
          <span
            className={[
              'inventory-count-v2-diff',
              totalQtyDiff > 0
                ? 'inventory-count-v2-diff--up'
                : totalQtyDiff < 0
                ? 'inventory-count-v2-diff--down'
                : 'inventory-count-v2-diff--zero',
            ].join(' ')}
          >
            {totalQtyDiff > 0 ? '+' : ''}
            {totalQtyDiff.toLocaleString('vi-VN')}
          </span>
        );
      },
    },
    {
      key: 'valueDiff',
      label: 'Giá trị lệch',
      align: 'right',
      render: (count) => {
        const totalValDiff = count.items.reduce(
          (sum, item) =>
            sum + (item.actualQuantity - item.systemQuantity) * item.cost,
          0
        );
        return (
          <span className="inventory-count-v2-value">
            {totalValDiff.toLocaleString('vi-VN')} ₫
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Trạng thái',
      align: 'center',
      render: (count) => {
        const status = count.status;
        const label =
          status === 'completed'
            ? 'Hoàn thành'
            : status === 'cancelled'
            ? 'Đã huỷ'
            : 'Bản nháp';
        const type =
          status === 'completed'
            ? 'success'
            : status === 'cancelled'
            ? 'danger'
            : 'warning';
        return <StatusBadge label={label} type={type} size="sm" />;
      },
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center',
      render: (count) => (
        <div className="inventory-count-v2-actions">
          <ActionButton
            variant="ghost"
            size="sm"
            icon={<FileText size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              openCountForm(count);
            }}
            aria-label="Xem chi tiết"
          />
          {/* Phase 7a: Nút Hủy phiếu (cancel) — cho draft/completed, giữ lịch sử + hoàn kho */}
          {(count.status === 'draft' || count.status === 'completed') &&
            onCancelInventoryCount && (
              <ActionButton
                variant="ghost"
                size="sm"
                icon={<Ban size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelInventoryCount(count.id);
                }}
                aria-label="Hủy phiếu"
                title="Hủy phiếu (giữ lịch sử + hoàn kho)"
              />
            )}
          {/* Phase 7a: Nút Xóa hẳn — chỉ cho draft/cancelled (không cho completed) */}
          {(count.status === 'draft' || count.status === 'cancelled') &&
            onDeleteInventoryCount && (
              <ActionButton
                variant="ghost"
                size="sm"
                icon={<Trash2 size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteInventoryCount(count.id);
                }}
                aria-label="Xoá hẳn"
                title="Xoá hẳn (không thể hoàn tác)"
              />
            )}
        </div>
      ),
    },
  ];

  // --- Inventory Count Handlers ---
  const generateNewCountCode = () => {
    const today = new Date();
    return `CK${today.getFullYear().toString().substr(2, 2)}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}${String((inventoryCounts?.length || 0) + 1).padStart(3, '0')}`;
  };

  const resetCountForm = () => {
    const today = new Date();
    setCountFormData({
      code: generateNewCountCode(),
      date: today.toISOString().split('T')[0],
      status: 'draft',
      items: [],
      notes: ''
    });
  };

  // Khi URL /inventory-count/create, luôn reset form tạo mới
  useEffect(() => {
    if (isCreateRoute) {
      setEditingCount(null);
      resetCountForm();
      setCountSearchTerm('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateRoute]);

  const openCountForm = (count?: InventoryCountType) => {
    if (count) {
      setEditingCount(count);
      setCountFormData(count);
      // Edit/view mở trên trang list
      if (isCreateRoute) {
        navigate('/inventory-count');
      }
    } else {
      // Create new draft -> chuyển sang URL /create
      setEditingCount(null);
      resetCountForm();
      navigate('/inventory-count/create');
    }
    setCountSearchTerm('');
  };

  const closeCountForm = () => {
    setEditingCount(null);
    navigate('/inventory-count');
  };

  const addItemToCount = (product: Product) => {
    if (product.hasBatches) {
      const lots = product.lots || [];
      if (lots.length > 0) {
        const newItems = lots.map(lot => ({
          id: crypto.randomUUID(),
          productId: product.id,
          productCode: product.code || '',
          productName: product.name,
          unit: product.unit || 'Cái',
          systemQuantity: lot.quantity || 0,
          actualQuantity: lot.quantity || 0,
          cost: product.cost || 0,
          reason: 'Khớp',
          lotId: lot.id,
          lotCode: lot.code,
          expiryDate: lot.expiryDate
        }));
        
        // Lọc các lô chưa có trong danh sách kiểm
        const nonExisting = newItems.filter(item => 
          !countFormData.items?.some(orig => orig.productId === product.id && orig.lotCode === item.lotCode)
        );
        
        if (nonExisting.length > 0) {
          setCountFormData(prev => ({
            ...prev,
            items: [...nonExisting, ...(prev.items || [])]
          }));
        } else {
          // Nếu tất cả các lô hiện có của sản phẩm này đã được thêm,
          // thì cho phép tạo thêm một dòng lô mới hoàn toàn
          const newItem: InventoryCountItem = {
            id: crypto.randomUUID(),
            productId: product.id,
            productCode: product.code || '',
            productName: product.name,
            unit: product.unit || 'Cái',
            systemQuantity: 0,
            actualQuantity: 0,
            cost: product.cost || 0,
            reason: 'Khớp',
            lotCode: '',
            expiryDate: ''
          };
          setCountFormData(prev => ({
            ...prev,
            items: [newItem, ...(prev.items || [])]
          }));
        }
      } else {
        // Sản phẩm quản lý lô nhưng chưa có lô nào
        const newItem: InventoryCountItem = {
          id: crypto.randomUUID(),
          productId: product.id,
          productCode: product.code || '',
          productName: product.name,
          unit: product.unit || 'Cái',
          systemQuantity: 0,
          actualQuantity: 0,
          cost: product.cost || 0,
          reason: 'Khớp',
          lotCode: '',
          expiryDate: ''
        };
        setCountFormData(prev => ({
          ...prev,
          items: [newItem, ...(prev.items || [])]
        }));
      }
    } else {
      // Check if already exists
      const exists = countFormData.items?.find(i => i.productId === product.id);
      if (exists) return; // Already in list

      const newItem: InventoryCountItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        productCode: product.code || '',
        productName: product.name,
        unit: product.unit || 'Cái',
        systemQuantity: product.quantity || 0,
        actualQuantity: product.quantity || 0,
        cost: product.cost || 0,
        reason: 'Khớp'
      };

      setCountFormData(prev => ({
        ...prev,
        items: [newItem, ...(prev.items || [])]
      }));
    }
    setCountSearchTerm('');
  };

  const handleScanSuccess = (decodedText: string) => {
    const product = products.find(p => p.barcode === decodedText || p.code === decodedText);
    if (product) {
      addItemToCount(product);
    } else {
      alert('Không tìm thấy sản phẩm!');
    }
  };

  const updateCountItem = (itemId: string, field: keyof InventoryCountItem, value: any) => {
    setCountFormData(prev => ({
      ...prev,
      items: prev.items?.map(item => item.id === itemId ? { ...item, [field]: value } : item)
    }));
  };

  const removeCountItem = (itemId: string) => {
    setCountFormData(prev => ({
      ...prev,
      items: prev.items?.filter(item => item.id !== itemId)
    }));
  };

  const formatQty = (n: number) => n.toLocaleString('vi-VN');
  const parseQty = (raw: string) => {
    const digits = raw.replace(/\./g, '').replace(/\D/g, '');
    return digits === '' ? 0 : parseInt(digits, 10);
  };

  const handleSaveCount = (status: 'draft' | 'completed') => {
    if (!onSaveInventoryCount) return;

    if (status === 'completed') {
      // Phase 7a: Bắt buộc lý do khi có chênh lệch (actual != system)
      const missingReasonItems = (countFormData.items || []).filter(
        item => item.actualQuantity !== item.systemQuantity && (!item.reason || item.reason === 'Khớp' || item.reason.trim() === '')
      );
      if (missingReasonItems.length > 0) {
        const names = missingReasonItems.map(i => `"${i.productName}"`).join(', ');
        alert(`Các sản phẩm có chênh lệch nhưng chưa nhập lý do: ${names}.\nVui lòng chọn lý do chênh lệch (không để "Khớp") trước khi hoàn thành.`);
        return;
      }

      if (!confirm('Sau khi hoàn thành, tồn kho hệ thống sẽ được cập nhật theo số lượng thực tế. Bạn có chắc chắn không?')) {
        return;
      }
    }

    const finalCount: InventoryCountType = {
      id: editingCount?.id || crypto.randomUUID(),
      code: countFormData.code || 'CK_NEW',
      date: countFormData.date || new Date().toISOString(),
      status: status,
      items: countFormData.items || [],
      notes: countFormData.notes || '',
      createdAt: editingCount?.createdAt || new Date().toISOString(),
      completedAt: status === 'completed' ? new Date().toISOString() : undefined
    };

    onSaveInventoryCount(finalCount);
    closeCountForm();
  };

  // --- Bulk Actions (Inventory Counts) ---
  const handleSelectAllCounts = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCountIds(new Set(paginatedCounts.map(c => c.id)));
    } else {
      setSelectedCountIds(new Set());
    }
  };

  const handleSelectCount = (id: string) => {
    const newSelected = new Set(selectedCountIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedCountIds(newSelected);
  };

  const handleBulkDeleteCounts = () => {
    if (selectedCountIds.size === 0 || !onDeleteInventoryCount) return;
    if (confirm(`Bạn có chắc chắn muốn xoá ${selectedCountIds.size} phiếu kiểm kê đã chọn?`)) {
      Array.from(selectedCountIds).forEach(id => onDeleteInventoryCount(id));
      setSelectedCountIds(new Set());
    }
  };

  const handleDownloadCountSample = () => {
    const headers = [{ 'Mã sản phẩm (Bắt buộc)': 'SP001', 'Tên sản phẩm': 'Áo thun', 'Số lượng thực tế': 100 }];
    const ws = XLSX.utils.json_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Kiem_Ke");
    XLSX.writeFile(wb, "mau_kiem_ke.xlsx");
  };

  // Xuất Excel: danh sách phiếu kiểm kê (Tab Kiểm kê)
  const handleExportCountExcel = () => {
    if (!inventoryCounts || inventoryCounts.length === 0) {
      alert('Chưa có phiếu kiểm kê nào để xuất.');
      return;
    }

    const statusLabel = (s: string) => {
      switch (s) {
        case 'draft': return 'Nháp';
        case 'completed': return 'Hoàn thành';
        case 'cancelled': return 'Đã huỷ';
        default: return s || '';
      }
    };

    const formatDate = (d: any) => {
      if (!d) return '';
      try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return String(d);
        return dt.toLocaleString('vi-VN');
      } catch {
        return String(d);
      }
    };

    // Sheet 1: Tổng hợp các phiếu kiểm kê
    const summaryData = inventoryCounts.map((c, idx) => {
      const totalItems = c.items?.length || 0;
      const totalSystemQty = c.items?.reduce((s, i) => s + (i.systemQuantity || 0), 0) || 0;
      const totalActualQty = c.items?.reduce((s, i) => s + (i.actualQuantity || 0), 0) || 0;
      const qtyDiff = totalActualQty - totalSystemQty;
      const valueDiff = c.items?.reduce(
        (s, i) => s + ((i.actualQuantity || 0) - (i.systemQuantity || 0)) * (i.cost || 0),
        0
      ) || 0;
      return {
        'STT': idx + 1,
        'Mã phiếu': c.id,
        'Ngày tạo': formatDate((c as any).createdAt || (c as any).date),
        'Trạng thái': statusLabel(c.status),
        'Ghi chú': (c as any).note || (c as any).reason || '',
        'Số mặt hàng': totalItems,
        'Tổng SL hệ thống': totalSystemQty,
        'Tổng SL thực tế': totalActualQty,
        'Chênh lệch SL': qtyDiff,
        'Chênh lệch giá trị': valueDiff,
      };
    });

    // Sheet 2: Chi tiết tất cả các mặt hàng trong các phiếu
    const detailData: any[] = [];
    let stt = 1;
    inventoryCounts.forEach((c) => {
      (c.items || []).forEach((item) => {
        const diffQty = (item.actualQuantity || 0) - (item.systemQuantity || 0);
        const diffValue = diffQty * (item.cost || 0);
        detailData.push({
          'STT': stt++,
          'Mã phiếu': c.id,
          'Ngày phiếu': formatDate((c as any).createdAt || (c as any).date),
          'Trạng thái phiếu': statusLabel(c.status),
          'Mã sản phẩm': item.productCode,
          'Tên sản phẩm': item.productName,
          'Đơn vị': item.unit,
          'SL hệ thống': item.systemQuantity,
          'SL thực tế': item.actualQuantity,
          'Chênh lệch SL': diffQty,
          'Giá vốn': item.cost,
          'Chênh lệch giá trị': diffValue,
          'Lý do': item.reason || '',
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    // Đặt độ rộng cột cho sheet tổng hợp
    (wsSummary as any)['!cols'] = [
      { wch: 6 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 30 },
      { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tong_Hop_Phieu');

    if (detailData.length > 0) {
      const wsDetail = XLSX.utils.json_to_sheet(detailData);
      (wsDetail as any)['!cols'] = [
        { wch: 6 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 16 },
        { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
        { wch: 14 }, { wch: 18 }, { wch: 24 },
      ];
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Chi_Tiet_Mat_Hang');
    }

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `phieu_kiem_ke_${today}.xlsx`);
  };

  const handleImportCountExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        const headers = data[0] as string[];
        const getIndex = (keywords: string[]) => headers.findIndex(h => {
          const text = h?.toString().toLowerCase() || '';
          return keywords.some(k => text.includes(k));
        });

        const codeIndex = getIndex(['mã sản phẩm', 'mã sp', 'sku', 'code']);
        const nameIndex = getIndex(['tên sản phẩm', 'tên sp', 'name']);
        const quantityIndex = getIndex(['số lượng thực tế', 'thực tế', 'actual', 'sl']);

        if (codeIndex === -1 && nameIndex === -1) {
          alert('❌ File Excel thiếu cột "Mã sản phẩm" hoặc "Tên sản phẩm"!');
          return;
        }

        let addedCount = 0;
        const newItems: InventoryCountItem[] = [];

        // Create map for fast lookup
        const productByCode = new Map<string, Product>(products.map(p => [(p.code || '').toLowerCase(), p]));
        const productByName = new Map<string, Product>(products.map(p => [p.name.toLowerCase(), p]));

        for (let i = 1; i < data.length; i++) {
          const row = data[i] as any[];
          if (!row || row.length === 0) continue;

          const rawCode = row[codeIndex]?.toString().trim().toLowerCase();
          const rawName = row[nameIndex]?.toString().trim().toLowerCase();
          const quantity = parseFloat(row[quantityIndex]) || 0;

          let product: Product | undefined;
          if (rawCode && productByCode.has(rawCode)) {
            product = productByCode.get(rawCode);
          } else if (rawName && productByName.has(rawName)) {
            product = productByName.get(rawName);
          }

          if (product) {
            // Check if already in current list
            const existingItemIndex = countFormData.items?.findIndex(item => item.productId === product!.id);
            
            if (existingItemIndex !== undefined && existingItemIndex !== -1) {
              // Update existing
               setCountFormData(prev => ({
                ...prev,
                items: prev.items?.map((item, idx) => idx === existingItemIndex ? { ...item, actualQuantity: quantity } : item)
              }));
            } else {
              // Add new
              newItems.push({
                id: crypto.randomUUID(),
                productId: product.id,
                productCode: product.code || '',
                productName: product.name,
                unit: product.unit || '',
                systemQuantity: product.quantity || 0,
                actualQuantity: quantity,
                cost: product.cost || 0,
                reason: 'Import Excel'
              });
            }
            addedCount++;
          }
        }

        if (newItems.length > 0) {
          setCountFormData(prev => ({
            ...prev,
            items: [...newItems, ...(prev.items || [])]
          }));
        }

        alert(`✅ Đã nhập ${addedCount} sản phẩm vào phiếu kiểm kê.`);
        
      } catch (error) {
        console.error('Error importing count excel:', error);
        alert('❌ Lỗi đọc file Excel.');
      } finally {
        if (countFileInputRef.current) countFileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <PageLayout>
      {!isCountFormOpen && (
        <>
          {/* Page Header */}
          <div className="inventory-count-page__header">
        <div className="inventory-count-page__title-group">
          <span className="inventory-count-page__title-icon">
            <ClipboardList />
          </span>
          <div>
            <h2 className="page-title">Kiểm kê</h2>
            <p className="page-subtitle">Quản lý phiếu kiểm kê tồn kho</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <div className="filter-bar__search">
            <Search className="filter-bar__search-icon" />
            <input
              type="text"
              placeholder="Tìm mã phiếu..."
              className="filter-bar__search-input"
              value={countSearchTerm2}
              onChange={(e) => { setCountSearchTerm2(e.target.value); setCountCurrentPage(1); }}
            />
          </div>

          {/* Status Dropdown Filter */}
          <div className="filter-bar__dropdown">
            <button
              onClick={() => setIsCountStatusFilterOpen(!isCountStatusFilterOpen)}
              className={`filter-bar__trigger ${countStatusFilter !== 'all' ? 'filter-bar__trigger--active' : ''}`}
            >
              <Layers />
              <span>Trạng thái{countStatusFilter !== 'all' ? `: ${countStatusLabels[countStatusFilter]}` : ''}</span>
              <ChevronDown className={`filter-bar__chevron ${isCountStatusFilterOpen ? 'filter-bar__chevron--open' : ''}`} />
            </button>

            {isCountStatusFilterOpen && (
              <div className="filter-bar__menu">
                <div className="filter-bar__menu-scroll">
                  {(['all', 'draft', 'completed', 'cancelled'] as const).map(st => (
                    <div
                      key={st}
                      className="filter-bar__option"
                      onClick={() => { setCountStatusFilter(st); setCountCurrentPage(1); setIsCountStatusFilterOpen(false); }}
                    >
                      <div className={`filter-bar__check ${countStatusFilter === st ? 'filter-bar__check--checked' : ''}`}>
                        {countStatusFilter === st && <Check />}
                      </div>
                      <span className="filter-bar__option-label">{countStatusLabels[st]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date Range Filter */}
          <input
            type="date"
            className="filter-bar__date-input"
            value={countDateFrom}
            max={countDateTo || undefined}
            onChange={(e) => setCountDateFrom(e.target.value)}
            title="Từ ngày"
          />
          <input
            type="date"
            className="filter-bar__date-input"
            value={countDateTo}
            min={countDateFrom || undefined}
            onChange={(e) => setCountDateTo(e.target.value)}
            title="Đến ngày"
          />

          {/* Diff Dropdown Filter */}
          <div className="filter-bar__dropdown">
            <button
              onClick={() => { setIsCountDiffFilterOpen(!isCountDiffFilterOpen); setIsCountSortOpen(false); setIsCountStatusFilterOpen(false); }}
              className={`filter-bar__trigger ${countDiffFilter !== 'all' ? 'filter-bar__trigger--active' : ''}`}
            >
              <ArrowUpDown />
              <span>Chênh lệch{countDiffFilter !== 'all' ? `: ${countDiffLabels[countDiffFilter]}` : ''}</span>
              <ChevronDown className={`filter-bar__chevron ${isCountDiffFilterOpen ? 'filter-bar__chevron--open' : ''}`} />
            </button>

            {isCountDiffFilterOpen && (
              <div className="filter-bar__menu">
                <div className="filter-bar__menu-scroll">
                  {(['all', 'increase', 'decrease', 'none'] as const).map(df => (
                    <div
                      key={df}
                      className="filter-bar__option"
                      onClick={() => { setCountDiffFilter(df); setIsCountDiffFilterOpen(false); }}
                    >
                      <div className={`filter-bar__check ${countDiffFilter === df ? 'filter-bar__check--checked' : ''}`}>
                        {countDiffFilter === df && <Check />}
                      </div>
                      <span className="filter-bar__option-label">{countDiffLabels[df]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="filter-bar__dropdown">
            <button
              onClick={() => { setIsCountSortOpen(!isCountSortOpen); setIsCountDiffFilterOpen(false); setIsCountStatusFilterOpen(false); }}
              className={`filter-bar__trigger ${countSortBy !== 'date_desc' ? 'filter-bar__trigger--active' : ''}`}
            >
              <ArrowUpDown />
              <span>{countSortLabels[countSortBy]}</span>
              <ChevronDown className={`filter-bar__chevron ${isCountSortOpen ? 'filter-bar__chevron--open' : ''}`} />
            </button>

            {isCountSortOpen && (
              <div className="filter-bar__menu">
                <div className="filter-bar__menu-scroll">
                  {(['date_desc', 'date_asc', 'diff_desc', 'diff_asc'] as const).map(sb => (
                    <div
                      key={sb}
                      className="filter-bar__option"
                      onClick={() => { setCountSortBy(sb); setIsCountSortOpen(false); }}
                    >
                      <div className={`filter-bar__check ${countSortBy === sb ? 'filter-bar__check--checked' : ''}`}>
                        {countSortBy === sb && <Check />}
                      </div>
                      <span className="filter-bar__option-label">{countSortLabels[sb]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reset Filters */}
          {isCountFilterActive && (
            <button
              onClick={resetCountFilters}
              className="filter-bar__reset"
            >
              <X /> Xoá bộ lọc
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="inventory-count-page__actions">
          <div className="inventory-count-page__toolbar">
            <button onClick={handleDownloadCountSample} className="inventory-count-page__toolbar-btn inventory-count-page__toolbar-btn--sample"><FileSpreadsheet /><span>Mẫu</span></button>
            <div className="inventory-count-page__toolbar-divider"></div>
            <button onClick={() => countFileInputRef.current?.click()} className="inventory-count-page__toolbar-btn inventory-count-page__toolbar-btn--import"><Upload /><span>Nhập</span></button>
            <input type="file" ref={countFileInputRef} onChange={handleImportCountExcel} className="inventory-count-page__file-input" accept=".xlsx, .xls"/>
            <div className="inventory-count-page__toolbar-divider"></div>
            <button onClick={handleExportCountExcel} className="inventory-count-page__toolbar-btn inventory-count-page__toolbar-btn--export" title="Xuất danh sách phiếu kiểm kê ra Excel"><Download /><span>Xuất</span></button>
          </div>
          <button onClick={() => openCountForm()} className="btn-primary"><Plus className="inventory-count-page__btn-icon" /> Tạo phiếu kiểm kê</button>
          <ActionButton
            variant="secondary"
            size="md"
            icon={<ScanBarcode />}
            onClick={() => setIsScannerOpen(true)}
            title="Quét mã vạch"
          >
            Quét
          </ActionButton>
        </div>
      </div>

      {/* 5 Stat Cards */}
      {(() => {
        const totalCounts = inventoryCounts.length;
        const draftCounts = inventoryCounts.filter(c => c.status === 'draft').length;
        const completedCounts = inventoryCounts.filter(c => c.status === 'completed').length;
        const activeCounts = inventoryCounts.filter(c => c.status !== 'cancelled').length;
        const totalDiffValue = inventoryCounts.reduce((sum, c) => 
          sum + c.items.reduce((s, i) => s + (i.actualQuantity - i.systemQuantity) * i.cost, 0), 0);
        const activePercent = totalCounts > 0 ? ((activeCounts / totalCounts) * 100).toFixed(1) : '0';
        
        return (
          <div className="inventory-count-page__stats-grid">
            <div className="inv-stat-card">
              <div className="inv-stat-icon purple"><ClipboardList /></div>
              <div className="inv-stat-body">
                <div className="inv-stat-value">{totalCounts.toLocaleString('vi-VN')}</div>
                <div className="inv-stat-label">Tổng phiếu kiểm kê</div>
                <div className="inv-stat-sub">Toàn bộ phiếu</div>
              </div>
            </div>

            <div className="inv-stat-card">
              <div className="inv-stat-icon blue"><FileText /></div>
              <div className="inv-stat-body">
                <div className="inv-stat-value">{activeCounts.toLocaleString('vi-VN')}</div>
                <div className="inv-stat-label">Phiếu hoạt động</div>
                <div className="inv-stat-sub up">{activePercent}% tổng số phiếu</div>
              </div>
            </div>

            <div className="inv-stat-card">
              <div className="inv-stat-icon orange"><Edit /></div>
              <div className="inv-stat-body">
                <div className="inv-stat-value">{draftCounts.toLocaleString('vi-VN')}</div>
                <div className="inv-stat-label">Bản nháp</div>
                <div className="inv-stat-sub warn">Chưa hoàn thành</div>
              </div>
            </div>

            <div className="inv-stat-card">
              <div className="inv-stat-icon green"><CheckCircle /></div>
              <div className="inv-stat-body">
                <div className="inv-stat-value">{completedCounts.toLocaleString('vi-VN')}</div>
                <div className="inv-stat-label">Hoàn thành</div>
                <div className="inv-stat-sub up">Đã cập nhật tồn kho</div>
              </div>
            </div>

            <div className="inv-stat-card">
              <div className="inv-stat-icon red"><Wallet /></div>
              <div className="inv-stat-body">
                <div className="inv-stat-value money">{totalDiffValue.toLocaleString('vi-VN')}₫</div>
                <div className="inv-stat-label">Giá trị chênh lệch</div>
                <div className="inv-stat-sub">Tổng giá trị lệch</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Count List */}
      {!isCountFormOpen && (
        <>
          <DataGridBox innerRef={countsDataGridBoxRef} className="inventory-count-page__data-grid-box">
            {useNewDataGridInventoryCounts ? (
              <DataGrid
                className="inventory-count-page__data-grid"
                embedded
                data={paginatedCounts}
                columns={countColumns}
                keyExtractor={(count) => count.id}
                selectedRows={Array.from(selectedCountIds)}
                onSelectionChange={(ids) => setSelectedCountIds(new Set(ids as string[]))}
                onRowClick={openCountForm}
                sortKey={countSortKey}
                sortDirection={countSortDirection}
                onSortChange={handleCountDataGridSort}
                pagination={{
                  currentPage: countCurrentPage,
                  totalPages: countTotalPages,
                  totalCount: filteredCounts.length,
                  pageSize: countPageSize,
                  onPageChange: (page) => setCountCurrentPage(page),
                  showInfo: false,
                }}
                emptyTitle="Chưa có phiếu kiểm kê nào"
                emptyDescription="Tạo phiếu kiểm kê mới để bắt đầu."
                emptyAction={
                  <ActionButton
                    variant="primary"
                    size="md"
                    icon={<Plus />}
                    onClick={() => openCountForm()}
                  >
                    Tạo phiếu kiểm kê
                  </ActionButton>
                }
              />
            ) : (
              <>
                <div className="inventory-count-table__wrapper">
              <table className="inventory-count-table">
                <thead className="inventory-count-table__head">
                  <tr>
                    <th scope="col" className="inventory-count-table__head-cell inventory-count-table__head-cell--checkbox">
                      <input
                        type="checkbox"
                        className="inventory-count-table__checkbox"
                        checked={paginatedCounts.length > 0 && selectedCountIds.size === paginatedCounts.length}
                        ref={el => { if (el) el.indeterminate = selectedCountIds.size > 0 && selectedCountIds.size < paginatedCounts.length; }}
                        onChange={handleSelectAllCounts}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th className="inventory-count-table__head-cell inventory-count-table__head-cell--sortable">
                      STT
                    </th>
                    <th className="inventory-count-table__head-cell inventory-count-table__head-cell--sortable">
                      Mã phiếu
                    </th>
                    <th className="inventory-count-table__head-cell inventory-count-table__head-cell--sortable">
                      Ngày kiểm kê
                    </th>
                    <th className="inventory-count-table__head-cell inventory-count-table__head-cell--sortable inventory-count-table__head-cell--center">
                      SL sản phẩm
                    </th>
                    <th className="inventory-count-table__head-cell inventory-count-table__head-cell--sortable inventory-count-table__head-cell--center">
                      SL lệch
                    </th>
                    <th className="inventory-count-table__head-cell inventory-count-table__head-cell--sortable inventory-count-table__head-cell--right">
                      Giá trị lệch
                    </th>
                    <th className="inventory-count-table__head-cell inventory-count-table__head-cell--center">
                      Trạng thái
                    </th>
                    <th className="inventory-count-table__head-cell inventory-count-table__head-cell--right">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="inventory-count-table__body">
                  {paginatedCounts.length > 0 ? (
                    paginatedCounts.map(count => {
                      const totalQtyDiff = count.items.reduce((sum, item) => sum + (item.actualQuantity - item.systemQuantity), 0);
                      const totalValDiff = count.items.reduce((sum, item) => sum + ((item.actualQuantity - item.systemQuantity) * item.cost), 0);
                      return (
                        <tr
                          key={count.id}
                          className="inventory-count-table__row"
                          onClick={() => openCountForm(count)}
                        >
                          <td className="inventory-count-table__cell inventory-count-table__cell--checkbox" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="inventory-count-table__checkbox"
                              checked={selectedCountIds.has(count.id)}
                              onChange={() => handleSelectCount(count.id)}
                            />
                          </td>
                          <td className="inventory-count-table__cell inventory-count-v2-index">
                            {countStartIndex + paginatedCounts.indexOf(count) + 1}
                          </td>
                          <td className="inventory-count-table__cell">
                            <div className="inventory-count-v2-code">
                              <div className="inventory-count-table__icon-wrap">
                                <ClipboardList className="inventory-count-v2-code__icon" />
                              </div>
                              <span>{count.code}</span>
                            </div>
                          </td>
                          <td className="inventory-count-table__cell">
                            <span className="inventory-count-v2-date">{new Date(count.date).toLocaleDateString('vi-VN')}</span>
                          </td>
                          <td className="inventory-count-table__cell inventory-count-table__cell--center inventory-count-v2-items">
                            {count.items.length}
                          </td>
                          <td className="inventory-count-table__cell inventory-count-table__cell--center">
                            <span className={[
                              'inventory-count-v2-diff',
                              totalQtyDiff > 0
                                ? 'inventory-count-v2-diff--up'
                                : totalQtyDiff < 0
                                ? 'inventory-count-v2-diff--down'
                                : 'inventory-count-v2-diff--zero',
                            ].join(' ')}>
                              {totalQtyDiff > 0 ? '+' : ''}{totalQtyDiff.toLocaleString('vi-VN')}
                            </span>
                          </td>
                          <td className="inventory-count-table__cell inventory-count-table__cell--right">
                            <span className="inventory-count-v2-value">
                              {totalValDiff.toLocaleString('vi-VN')} ₫
                            </span>
                          </td>
                          <td className="inventory-count-table__cell inventory-count-table__cell--center">
                            <StatusBadge
                              label={
                                count.status === 'completed' ? 'Hoàn thành'
                                : count.status === 'cancelled' ? 'Đã huỷ'
                                : 'Bản nháp'
                              }
                              type={
                                count.status === 'completed' ? 'success'
                                : count.status === 'cancelled' ? 'danger'
                                : 'warning'
                              }
                              size="sm"
                            />
                          </td>
                          <td className="inventory-count-table__cell inventory-count-table__cell--right" onClick={(e) => e.stopPropagation()}>
                            <div className="inventory-count-table__actions">
                              <button
                                onClick={() => openCountForm(count)}
                                className="inventory-count-table__action-btn"
                                title="Xem chi tiết"
                              >
                                <FileText />
                              </button>
                              {/* Phase 7a: Nút Hủy phiếu (cancel) — cho draft/completed */}
                              {(count.status === 'draft' || count.status === 'completed') && onCancelInventoryCount && (
                                <button
                                  onClick={() => onCancelInventoryCount(count.id)}
                                  className="inventory-count-table__action-btn inventory-count-table__action-btn--cancel"
                                  title="Hủy phiếu (giữ lịch sử + hoàn kho)"
                                >
                                  <Ban />
                                </button>
                              )}
                              {/* Phase 7a: Nút Xóa hẳn — chỉ cho draft/cancelled */}
                              {(count.status === 'draft' || count.status === 'cancelled') && onDeleteInventoryCount && (
                                <button
                                  onClick={() => onDeleteInventoryCount(count.id)}
                                  className="inventory-count-table__action-btn inventory-count-table__action-btn--delete"
                                  title="Xoá hẳn (không thể hoàn tác)"
                                >
                                  <Trash2 />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="inventory-count-table__empty-cell">
                        <EmptyState
                          icon={<ClipboardList />}
                          title="Chưa có phiếu kiểm kê nào"
                          description="Tạo phiếu kiểm kê mới để bắt đầu."
                          action={
                            <button onClick={() => openCountForm()} className="btn-primary">
                              <Plus className="inventory-count-page__btn-icon" /> Tạo phiếu kiểm kê
                            </button>
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination — master style theo PAGINATION_RETURN.md */}
            {filteredCounts.length > 0 && (
              <div className="inventory-count-pagination">
                <p className="inventory-count-pagination__info">
                  Hiển thị{' '}
                  <span>{countStartIndex + 1}</span>
                  {' '}–{' '}
                  <span>{Math.min(countStartIndex + countPageSize, filteredCounts.length)}</span>
                  {' '}trên tổng số{' '}
                  <span>{filteredCounts.length}</span>
                  {' '}phiếu kiểm kê
                </p>
                <nav className="inventory-count-pagination__nav">
                  <button
                    onClick={() => setCountCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={countCurrentPage === 1}
                    className="inventory-count-pagination__btn"
                    title="Trang trước"
                  >
                    <ChevronLeft />
                  </button>
                  {(() => {
                    const tp = countTotalPages || 1;
                    const cur = countCurrentPage;
                    const pages: (number | 'ellipsis')[] = [];
                    if (tp <= 7) {
                      for (let i = 1; i <= tp; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      if (cur > 3) pages.push('ellipsis');
                      const start = Math.max(2, cur - 1);
                      const end = Math.min(tp - 1, cur + 1);
                      for (let i = start; i <= end; i++) pages.push(i);
                      if (cur < tp - 2) pages.push('ellipsis');
                      pages.push(tp);
                    }
                    return pages.map((p, idx) =>
                      p === 'ellipsis' ? (
                        <span key={`e-${idx}`} className="inventory-count-pagination__ellipsis">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCountCurrentPage(p)}
                          className={`inventory-count-pagination__btn ${p === cur ? 'inventory-count-pagination__btn--active' : ''}`}
                        >
                          {p}
                        </button>
                      )
                    );
                  })()}
                  <button
                    onClick={() => setCountCurrentPage(prev => Math.min(countTotalPages, prev + 1))}
                    disabled={countCurrentPage === countTotalPages || countTotalPages === 0}
                    className="inventory-count-pagination__btn"
                    title="Trang sau"
                  >
                    <ChevronRight />
                  </button>
                </nav>
              </div>
            )}
              </>
            )}
          </DataGridBox>

           {/* Mobile Card View (Counts) */}
           <div className="inventory-count-mobile-list">
             {paginatedCounts.length > 0 ? (
               paginatedCounts.map(count => {
                  const totalQtyDiff = count.items.reduce((sum, item) => sum + (item.actualQuantity - item.systemQuantity), 0);
                  return (
                     <div key={count.id} className="inventory-count-mobile-card" onClick={() => openCountForm(count)}>
                        <div className="inventory-count-mobile-card__header">
                           <div className="inventory-count-mobile-card__title">
                              <div className="inventory-count-mobile-card__icon">
                                 <ClipboardList />
                              </div>
                              <span className="inventory-count-mobile-card__code">{count.code}</span>
                           </div>
                           <StatusBadge
                             label={
                               count.status === 'completed' ? 'Hoàn thành'
                               : count.status === 'cancelled' ? 'Đã huỷ'
                               : 'Bản nháp'
                             }
                             type={
                               count.status === 'completed' ? 'success'
                               : count.status === 'cancelled' ? 'danger'
                               : 'warning'
                             }
                             size="sm"
                           />
                        </div>
                        <div className="inventory-count-mobile-card__date">
                           <Calendar /> {new Date(count.date).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="inventory-count-mobile-card__footer">
                           <span className="inventory-count-mobile-card__items">{count.items.length} sản phẩm</span>
                           <span className={[
                             'inventory-count-mobile-card__diff',
                             totalQtyDiff > 0 ? 'inventory-count-mobile-card__diff--up' : totalQtyDiff < 0 ? 'inventory-count-mobile-card__diff--down' : 'inventory-count-mobile-card__diff--zero',
                           ].join(' ')}>
                              Lệch: {totalQtyDiff > 0 ? '+' : ''}{totalQtyDiff}
                           </span>
                        </div>
                     </div>
                  );
               })
             ) : (
               <EmptyState
                 icon={<ClipboardList className="inventory-count-page__empty-icon" />}
                 title="Chưa có phiếu kiểm kê nào"
                 description="Tạo phiếu kiểm kê mới để bắt đầu."
                 action={
                   <button onClick={() => openCountForm()} className="btn-primary">
                     <Plus className="inventory-count-page__btn-icon" /> Tạo phiếu kiểm kê
                   </button>
                 }
               />
             )}

             {/* Mobile Pagination — compact numeric */}
             {filteredCounts.length > 0 && (
                <div className="inventory-count-pagination inventory-count-pagination--mobile">
                  <nav className="inventory-count-pagination__nav">
                    <button
                      onClick={() => setCountCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={countCurrentPage === 1}
                      className="inventory-count-pagination__btn"
                    >
                      <ChevronLeft />
                    </button>
                    {(() => {
                      const tp = countTotalPages || 1;
                      const cur = countCurrentPage;
                      const pages: number[] = [];
                      const start = Math.max(1, Math.min(cur - 1, tp - 2));
                      const end = Math.min(tp, start + 2);
                      for (let i = start; i <= end; i++) pages.push(i);
                      return pages.map(p => (
                        <button
                          key={p}
                          onClick={() => setCountCurrentPage(p)}
                          className={`inventory-count-pagination__btn ${p === cur ? 'inventory-count-pagination__btn--active' : ''}`}
                        >
                          {p}
                        </button>
                      ));
                    })()}
                    <button
                      onClick={() => setCountCurrentPage(prev => Math.min(countTotalPages, prev + 1))}
                      disabled={countCurrentPage === countTotalPages || countTotalPages === 0}
                      className="inventory-count-pagination__btn"
                    >
                      <ChevronRight />
                    </button>
                  </nav>
                </div>
             )}
           </div>

           {/* Bulk Actions Bar (Inventory Counts) */}
           {selectedCountIds.size > 0 && (
             <div className="inventory-count-page__bulk-bar">
               <div className="inventory-count-page__bulk-bar-count">
                 Đã chọn <span>{selectedCountIds.size}</span> phiếu
               </div>
               <div className="inventory-count-page__bulk-bar-divider"></div>
               <button onClick={handleBulkDeleteCounts} className="inventory-count-page__bulk-bar-btn">
                 <Trash2 /> Xoá
               </button>
               <button onClick={() => setSelectedCountIds(new Set())} className="inventory-count-page__bulk-bar-close" title="Bỏ chọn">
                 <X />
               </button>
             </div>
           )}
         </>
        )}
      </>
      )}

      {/* Count Form */}
      {isCountFormOpen && (
        <div className="flex-1 min-h-0">
          <CountFormLayout
            formData={countFormData}
            setFormData={setCountFormData}
            isEditing={!!editingCount}
            onBack={closeCountForm}
            searchTerm={countSearchTerm}
            onSearchChange={setCountSearchTerm}
            searchResults={filteredProductsForCount}
            onSelectProduct={addItemToCount}
            actions={
              <>
                <ActionButton variant="ghost" onClick={closeCountForm}>Hủy</ActionButton>
                <ActionButton variant="secondary" onClick={() => handleSaveCount('draft')}>Lưu nháp</ActionButton>
                <ActionButton variant="primary" onClick={() => handleSaveCount('completed')}>Hoàn thành</ActionButton>
              </>
            }
          >
            {(() => {
              const items = countFormData.items || [];
              const isCompleted = countFormData.status === 'completed';
              const totalDiff = items.reduce((sum, it) => sum + (it.actualQuantity - it.systemQuantity), 0);
              const totalDiffValue = items.reduce((sum, it) => sum + ((it.actualQuantity - it.systemQuantity) * it.cost), 0);

              return items.length === 0 ? (
                <VoucherEmpty
                  icon={<Search className="w-12 h-12 text-slate-300" />}
                  title="Chưa có sản phẩm nào trong phiếu kiểm kê"
                  description="Tìm sản phẩm ở khung tìm kiếm phía trên và chọn để thêm vào danh sách. Điều chỉnh số lượng thực tế cho từng sản phẩm."
                />
              ) : (
                <>
                  <div className="flex-1 min-h-0">
                    <VoucherTable>
                      <thead>
                        <tr>
                          <th className="text-center w-12"><span className="sr-only">Xoá</span></th>
                          <th className="text-center w-12">#</th>
                          <th className="w-28">Mã hàng</th>
                          <th className="min-w-[160px]">Tên hàng</th>
                          <th className="text-center w-20">ĐVT</th>
                          <th className="text-center w-36">Số lô</th>
                          <th className="text-center w-36">Hạn sử dụng</th>
                          <th className="text-center w-28">Hệ thống</th>
                          <th className="text-center w-28">Thực tế</th>
                          <th className="text-center w-28">Lệch</th>
                          <th className="text-right w-32">Giá trị lệch</th>
                          <th className="w-40">Lý do</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          const diff = item.actualQuantity - item.systemQuantity;
                          const diffVal = diff * item.cost;
                          return (
                            <VoucherTableRow key={item.id}>
                              <td className="text-center">
                                {!isCompleted && (
                                  <VoucherButton
                                    variant="danger"
                                    size="sm"
                                    icon={<Trash2 className="w-4 h-4" />}
                                    onClick={() => removeCountItem(item.id)}
                                    aria-label="Xoá sản phẩm"
                                  />
                                )}
                              </td>
                              <td className="text-center text-slate-400">{idx + 1}</td>
                              <td>{item.productCode || '---'}</td>
                              <td>
                                <span className="block max-w-[240px] truncate">{item.productName}</span>
                              </td>
                              <td className="text-center">{item.unit || '---'}</td>
                              <td className="text-center">
                                {item.lotId !== undefined || item.lotCode !== undefined ? (
                                  item.lotId ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                                      {item.lotCode}
                                    </span>
                                  ) : (
                                    <input
                                      type="text"
                                      value={item.lotCode || ''}
                                      onChange={(e) => updateCountItem(item.id, 'lotCode', e.target.value)}
                                      disabled={isCompleted}
                                      placeholder="Mã lô mới"
                                      className="w-full max-w-[120px] h-9 px-2.5 border border-slate-200 rounded-md text-sm text-center outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                    />
                                  )
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="text-center">
                                {item.lotId !== undefined || item.lotCode !== undefined ? (
                                  item.lotId ? (
                                    <span className="text-slate-400">{item.expiryDate || '—'}</span>
                                  ) : (
                                    <input
                                      type="date"
                                      value={item.expiryDate || ''}
                                      onChange={(e) => updateCountItem(item.id, 'expiryDate', e.target.value)}
                                      disabled={isCompleted}
                                      className="w-full max-w-[140px] h-9 px-2.5 border border-slate-200 rounded-md text-sm text-center outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                    />
                                  )
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="text-center font-medium">{item.systemQuantity}</td>
                              <td className="text-center">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={formatQty(item.actualQuantity)}
                                  onChange={(e) => updateCountItem(item.id, 'actualQuantity', parseQty(e.target.value))}
                                  disabled={isCompleted}
                                  className="w-20 h-9 px-2 border border-slate-200 rounded-md text-sm text-center outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                />
                              </td>
                              <td className={`text-center font-medium ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                {diff > 0 ? '+' : ''}{diff}
                              </td>
                              <td className="text-right">
                                {diffVal !== 0 ? (
                                  <span className={`font-medium ${diffVal > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {diffVal.toLocaleString('vi-VN')} ₫
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td>
                                <select
                                  value={item.reason}
                                  onChange={(e) => updateCountItem(item.id, 'reason', e.target.value)}
                                  disabled={isCompleted}
                                  className={`w-full max-w-[160px] h-9 px-2.5 border border-slate-200 rounded-md text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${diff !== 0 && (!item.reason || item.reason === 'Khớp') ? 'border-amber-500 bg-amber-50 shadow-[0_0_0_1px_#f59e0b]' : ''}`}
                                >
                                  <option value="Khớp">Khớp</option>
                                  <option value="Đếm thừa">Đếm thừa</option>
                                  <option value="Đếm thiếu">Đếm thiếu</option>
                                  <option value="Hư hỏng">Hư hỏng</option>
                                  <option value="Mất hàng">Mất hàng</option>
                                  <option value="Nhập sai">Nhập sai</option>
                                  <option value="Khác">Khác</option>
                                </select>
                              </td>
                            </VoucherTableRow>
                          );
                        })}
                      </tbody>
                    </VoucherTable>
                  </div>
                  <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-5">
                      <span className="text-sm text-slate-500">
                        Sản phẩm: <strong className="text-slate-700 font-semibold">{items.length}</strong>
                      </span>
                      <span className="text-sm text-slate-500">
                        Tổng chênh lệch:{' '}
                        <strong className={totalDiff > 0 ? 'text-emerald-600' : totalDiff < 0 ? 'text-rose-600' : 'text-slate-900 font-semibold'}>
                          {totalDiff > 0 ? '+' : ''}{totalDiff.toLocaleString('vi-VN')}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium uppercase text-slate-500">Giá trị chênh lệch</span>
                      <span className="text-base font-bold text-purple-600">{totalDiffValue.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </CountFormLayout>
        </div>
      )}

      <BarcodeScannerFix 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </PageLayout>
  );
};
