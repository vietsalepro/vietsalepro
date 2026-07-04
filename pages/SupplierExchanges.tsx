import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Product, Supplier, ImportReceipt, ImportItemInput, AppSettings,
  SupplierExchange, SupplierExchangeReturnItem, SupplierExchangeReceivedItem,
  ProductLot,
} from '../types';
import { supabaseService } from '../services/supabaseService';
import {
  RefreshCcw, Plus, Search, ArrowLeft, Printer, AlertTriangle,
  Check, X, Trash2, Calendar, Package, Truck, FileText, RotateCcw,
  ChevronDown, ClipboardList, Wallet, CheckCircle,
} from 'lucide-react';
import { DataGrid, DataGridColumn, SortDirection } from '../components/DataGrid';
import { StatusBadge } from '../components/StatusBadge';
import { ActionButton } from '../components/ActionButton';
import { BatchActionsBar } from '../components/BatchActionsBar';
import StatsRow from '../components/shared/StatsRow';
import { PageLayout } from '../components/shared/PageLayout';
import { printSupplierExchange } from '../utils/printSupplierExchange';
import {
  VoucherFormLayout,
  VoucherSection,
  VoucherSectionHeader,
  VoucherSectionContent,
  VoucherField,
  VoucherInput,
  VoucherButton,
  VoucherSelect,
  VoucherTextarea,
  VoucherSearch,
  VoucherProductDropdown,
  VoucherEmpty,
  VoucherTotals,
  VoucherBanner,
} from '../components/voucher-form';
import '../components/shared/FilterBar.css';
import './SupplierExchanges.css';

interface SupplierExchangesProps {
  products?: Product[];
  suppliers?: Supplier[];
  importReceipts?: ImportReceipt[];
  appSettings: AppSettings;
}

interface ExchangeFormItem {
  productId: string;
  productName: string;
  productCode?: string;
  returnLotId?: string;
  returnLotCode?: string;
  returnExpiryDate?: string;
  returnQuantity: number;
  returnCost: number;
  returnTotalValue: number;
  referenceImportItemId: string;
  newLotCode: string;
  newExpiryDate: string;
  newQuantity: number;
  newCost: number;
  newTotalValue: number;
}

const PAGE_SIZE = 7;
const REASONS = ['Hàng cận hạn', 'Hàng hết hạn', 'Hàng lỗi từ NCC', 'Khác'];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const formatTime = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export const SupplierExchanges: React.FC<SupplierExchangesProps> = ({
  products: _products = [],
  suppliers: _suppliers = [],
  importReceipts: _importReceipts = [],
  appSettings,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // ─── Phase 6: Server-side data — thay thế props rỗng ───
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  // lockedReceipt fetch theo ID
  const [lockedReceipt, setLockedReceipt] = useState<ImportReceipt | null>(null);
  // lotReceipts fetch theo product+lot
  const [lotReceipts, setLotReceipts] = useState<ImportReceipt[]>([]);
  // productCache: lưu products đã fetch để lookup lots trong validate/render
  const [productCache, setProductCache] = useState<Map<string, Product>>(new Map());

  // Load supplier list cho filter dropdown (table NCC nhỏ, dùng searchSuppliers server-side)
  useEffect(() => {
    supabaseService.searchSuppliers('', 500)
      .then(setSuppliers)
      .catch(err => console.error('SupplierExchanges: fetch suppliers error', err));
  }, []);

  // ─── VIEW STATE: sync với URL ───
  const isCreateRoute = useMemo(() => location.pathname === '/inventory/supplier-exchanges/create', [location.pathname]);
  const goToList = useCallback(() => navigate('/inventory/supplier-exchanges'), [navigate]);
  const goToCreate = useCallback(() => navigate('/inventory/supplier-exchanges/create'), [navigate]);

  // ─── LIST STATE ───
  const [exchanges, setExchanges] = useState<SupplierExchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('');

  // ─── FILTER DROPDOWN UI STATE — sync phong cách /inventory-count (filter-bar) ───
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isSupplierFilterOpen, setIsSupplierFilterOpen] = useState(false);

  const statusLabels: Record<string, string> = {
    '': 'Tất cả trạng thái',
    completed: 'Hoàn thành',
    draft: 'Nháp',
    cancelled: 'Đã hủy',
  };

  const isFilterActive = searchTerm.trim() !== '' || statusFilter !== '' || selectedSupplierFilter !== '';

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setSelectedSupplierFilter('');
    setIsStatusFilterOpen(false);
    setIsSupplierFilterOpen(false);
  }, []);

  // ─── LIST V2 STATE — selection + sort + detail (copy phong cách ImportGoods) ───
  const [selectedExchangeIds, setSelectedExchangeIds] = useState<Set<string>>(new Set());
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [viewingExchange, setViewingExchange] = useState<SupplierExchange | null>(null);
  const [v2SortConfig, setV2SortConfig] = useState<{ key: string; direction: SortDirection } | null>(null);

  // ─── CREATE STATE ───
  // View đồng bộ với URL: isCreateRoute đã tính ở trên
  const [exchangeDate, setExchangeDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<ExchangeFormItem[]>([]);
  const [expandedItemIndex, setExpandedItemIndex] = useState<number | null>(null);

  // Draft selection for the product/lot/receipt wizard
  const [productSearch, setProductSearch] = useState('');
  const [showProductResults, setShowProductResults] = useState(false);
  const [draftProduct, setDraftProduct] = useState<Product | null>(null);
  const [draftLot, setDraftLot] = useState<ProductLot | null>(null);
  const [lockedReceiptId, setLockedReceiptId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // ─── FETCH LIST ───
  const fetchExchanges = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getSupplierExchanges({
        status: statusFilter || undefined,
        supplierId: selectedSupplierFilter || undefined,
      });
      setExchanges(data);
    } catch (err: any) {
      console.error('Error fetching supplier exchanges:', err);
      alert(err.message || 'Lỗi tải danh sách phiếu đổi trả hàng NCC');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedSupplierFilter]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  // ─── LIST FILTERING ───
  const filteredExchanges = useMemo(() => {
    let result = [...exchanges];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.code.toLowerCase().includes(term) ||
          (e.supplierName || '').toLowerCase().includes(term) ||
          (e.reason || '').toLowerCase().includes(term)
      );
    }
    return result;
  }, [exchanges, searchTerm]);

  // ─── SORT (V2 DataGrid) ───
  const sortedExchanges = useMemo(() => {
    const arr = filteredExchanges.slice();
    if (v2SortConfig && v2SortConfig.direction !== 'none') {
      const { key, direction } = v2SortConfig;
      const dir = direction === 'asc' ? 1 : -1;
      arr.sort((a, b) => {
        let aVal: any;
        let bVal: any;
        switch (key) {
          case 'code':
            aVal = a.code || ''; bVal = b.code || ''; break;
          case 'supplierName':
            aVal = a.supplierName || ''; bVal = b.supplierName || ''; break;
          case 'date':
            aVal = new Date(a.date).getTime(); bVal = new Date(b.date).getTime(); break;
          case 'reason':
            aVal = a.reason || ''; bVal = b.reason || ''; break;
          case 'itemsCount':
            aVal = (a.returnItems || []).length; bVal = (b.returnItems || []).length; break;
          case 'returnTotalValue':
            aVal = a.returnTotalValue || 0; bVal = b.returnTotalValue || 0; break;
          case 'receivedTotalValue':
            aVal = a.receivedTotalValue || 0; bVal = b.receivedTotalValue || 0; break;
          case 'debtAdjustment':
            aVal = a.debtAdjustment || 0; bVal = b.debtAdjustment || 0; break;
          default:
            return 0;
        }
        if (aVal < bVal) return -1 * dir;
        if (aVal > bVal) return 1 * dir;
        return 0;
      });
    } else {
      // Mặc định: mới nhất lên đầu
      arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return arr;
  }, [filteredExchanges, v2SortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedExchanges.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const importStartIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedExchanges = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return sortedExchanges.slice(start, start + PAGE_SIZE);
  }, [sortedExchanges, safeCurrentPage]);

  // Reset về trang 1 khi điều kiện lọc / sắp xếp thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedSupplierFilter, v2SortConfig]);

  // Nếu trang hiện tại vượt quá tổng trang (sau khi xóa), kéo về trang cuối
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // ─── DERIVED STATS (5 cards — copy phong cách ImportGoods) ───
  const listStats = useMemo(() => {
    const totalExchanges = exchanges.length;
    const totalReturnValue = exchanges.reduce((sum, e) => sum + (e.returnTotalValue || 0), 0);
    const totalReceivedValue = exchanges.reduce((sum, e) => sum + (e.receivedTotalValue || 0), 0);
    const totalDebtAdjustment = exchanges.reduce((sum, e) => sum + (e.debtAdjustment || 0), 0);
    const completedCount = exchanges.filter((e) => e.status === 'completed').length;
    const completedPercent =
      totalExchanges > 0 ? ((completedCount / totalExchanges) * 100).toFixed(1) : '0';
    return {
      totalExchanges,
      totalReturnValue,
      totalReceivedValue,
      totalDebtAdjustment,
      completedCount,
      completedPercent,
    };
  }, [exchanges]);

  // ─── SELECTION HANDLERS (V2 DataGrid) ───
  const handleSelectExchange = (id: string) => {
    const newSelected = new Set(selectedExchangeIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedExchangeIds(newSelected);
    setIsSelectAllChecked(false);
  };

  const handleSelectAll = () => {
    if (isSelectAllChecked) {
      setSelectedExchangeIds(new Set());
      setIsSelectAllChecked(false);
    } else {
      setSelectedExchangeIds(new Set(sortedExchanges.map((e) => e.id)));
      setIsSelectAllChecked(true);
    }
  };

  const handleClearSelection = () => {
    setSelectedExchangeIds(new Set());
    setIsSelectAllChecked(false);
  };

  const handleDataGridSort = (key: string, direction: SortDirection) => {
    setV2SortConfig(direction === 'none' ? null : { key, direction });
  };

  const handlePrintSelected = () => {
    if (selectedExchangeIds.size === 0) return;
    selectedExchangeIds.forEach((id) => {
      const ex = exchanges.find((e) => e.id === id);
      if (ex) printSupplierExchange(ex, appSettings);
    });
  };

  const handleExportData = () => {
    if (selectedExchangeIds.size === 0) return;
    alert(`Xuất ${selectedExchangeIds.size} phiếu đổi trả - Tính năng sẽ được hoàn thiện`);
  };

  // ─── DERIVED: LOCKED RECEIPT (fetch by ID) & SUPPLIER ───
  // lockedReceipt state đã khai báo ở trên (Phase 6)
  useEffect(() => {
    if (!lockedReceiptId) { setLockedReceipt(null); return; }
    let cancelled = false;
    supabaseService.getImportReceiptById(lockedReceiptId)
      .then(r => { if (!cancelled) setLockedReceipt(r); })
      .catch(err => console.error('SupplierExchanges: fetch lockedReceipt error', err));
    return () => { cancelled = true; };
  }, [lockedReceiptId]);

  const lockedSupplier = useMemo(() => {
    if (!lockedReceipt?.supplierId) return null;
    return suppliers.find((s) => s.id === lockedReceipt.supplierId) || null;
  }, [lockedReceipt, suppliers]);

  // ─── PRODUCT SEARCH (Phase 6: server-side) ───
  // productSearchResults state đã khai báo ở trên
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');

  // Debounce productSearch 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedProductSearch(productSearch), 400);
    return () => clearTimeout(t);
  }, [productSearch]);

  useEffect(() => {
    const term = debouncedProductSearch.trim();
    if (!term) {
      setProductSearchResults([]);
      setShowProductResults(false);
      return;
    }
    let cancelled = false;
    setIsSearchingProduct(true);
    supabaseService.searchProducts(term, 50)
      .then(results => {
        if (!cancelled) {
          // Chỉ giữ sản phẩm có lot, và lọc thêm nếu có lockedReceipt
          const candidates = results.filter((p) => {
            if (!p.hasBatches) return false;
            const allLots = p.lots || [];
            if (!lockedReceiptId) return allLots.some((l) => l.quantity > 0);
            const lockedLotCodes = new Set(
              lockedReceipt?.items?.filter(i => i.productId === p.id).map(i => i.lotCode) || []
            );
            return allLots.some(
              l => l.quantity > 0 && l.code && lockedLotCodes.has(l.code) && !items.some(i => i.returnLotId === l.id)
            );
          });
          setProductSearchResults(candidates);
          setShowProductResults(candidates.length > 0);
        }
      })
      .catch(err => console.error('SupplierExchanges: search products error', err))
      .finally(() => { if (!cancelled) setIsSearchingProduct(false); });
    return () => { cancelled = true; };
  }, [debouncedProductSearch, lockedReceiptId, lockedReceipt, items]);

  const filteredProducts = productSearchResults;

  // ─── LOTS FOR DRAFT PRODUCT ───
  const draftProductLots = useMemo(() => {
    if (!draftProduct) return [];
    const selectedLotIds = new Set(
      items.filter((i) => i.productId === draftProduct.id).map((i) => i.returnLotId)
    );
    const lots = (draftProduct.lots || []).filter(
      (l) => l.quantity > 0 && !selectedLotIds.has(l.id)
    );
    if (!lockedReceiptId) return lots;
    const lockedLotCodes = new Set(
      lockedReceipt?.items
        ?.filter((i) => i.productId === draftProduct.id)
        .map((i) => i.lotCode) || []
    );
    return lots.filter((l) => l.code && lockedLotCodes.has(l.code));
  }, [draftProduct, lockedReceiptId, lockedReceipt, items]);

  // ─── RECEIPTS FOR DRAFT LOT (Phase 6: server-side fetch) ───
  // lotReceipts state đã khai báo ở trên
  useEffect(() => {
    if (!draftProduct || !draftLot || lockedReceiptId) {
      setLotReceipts([]);
      return;
    }
    let cancelled = false;
    supabaseService.getImportReceiptsByProductAndLot(draftProduct.id, draftLot.id)
      .then(receipts => { if (!cancelled) setLotReceipts(receipts.filter(r => r.status === 'completed')); })
      .catch(err => console.error('SupplierExchanges: fetch lotReceipts error', err));
    return () => { cancelled = true; };
  }, [draftProduct?.id, draftLot?.id, lockedReceiptId]);

  // ─── HANDLERS ───
  const resetCreateForm = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setExchangeDate(now.toISOString().slice(0, 16));
    setReason('');
    setNote('');
    setItems([]);
    setExpandedItemIndex(null);
    setProductSearch('');
    setShowProductResults(false);
    setDraftProduct(null);
    setDraftLot(null);
    setLockedReceiptId(null);
  };

  const handleProductSearchChange = (value: string) => {
    setProductSearch(value);
    if (value.trim()) {
      // Collapse current items and clear draft so user can start a new product flow
      setExpandedItemIndex(null);
      setDraftProduct(null);
      setDraftLot(null);
      setShowProductResults(true);
    } else {
      setShowProductResults(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setDraftProduct(product);
    // Cập nhật productCache để lookup lots trong validate/render
    setProductCache(prev => new Map(prev).set(product.id, product));
    setDraftLot(null);
    setProductSearch('');
    setShowProductResults(false);
    setExpandedItemIndex(null);
  };

  const handleSelectLot = (lot: ProductLot) => {
    if (lockedReceipt && draftProduct) {
      // Receipt already locked -> add item immediately
      const importItem = lockedReceipt.items?.find(
        (i) => i.productId === draftProduct.id && i.lotCode === lot.code
      );
      if (importItem) {
        addItem(draftProduct, lot, importItem);
        setDraftProduct(null);
        setDraftLot(null);
      }
      return;
    }
    setDraftLot(lot);
  };

  const handleSelectReceipt = (receipt: ImportReceipt) => {
    if (!draftProduct || !draftLot) return;
    const importItem = receipt.items?.find(
      (i) => i.productId === draftProduct.id && i.lotCode === draftLot.code
    );
    if (!importItem) return;
    addItem(draftProduct, draftLot, importItem);
    setLockedReceiptId(receipt.id);
    setDraftProduct(null);
    setDraftLot(null);
  };

  const addItem = (product: Product, lot: ProductLot, importItem: ImportItemInput) => {
    const availableQty = lot.quantity ?? 0;
    const newItem: ExchangeFormItem = {
      productId: product.id,
      productName: product.name || '',
      productCode: product.code,
      returnLotId: lot.id,
      returnLotCode: lot.code || importItem.lotCode,
      returnExpiryDate: lot.expiryDate || importItem.expiryDate,
      returnQuantity: Math.min(1, availableQty),
      returnCost: importItem.cost || lot.cost || product.cost || 0,
      returnTotalValue: 0,
      referenceImportItemId: importItem.id || '',
      newLotCode: '',
      newExpiryDate: '',
      newQuantity: Math.min(1, availableQty),
      newCost: importItem.cost || lot.cost || product.cost || 0,
      newTotalValue: 0,
    };
    newItem.returnTotalValue = newItem.returnQuantity * newItem.returnCost;
    newItem.newTotalValue = newItem.newQuantity * newItem.newCost;

    const nextIndex = items.length;
    setItems((prev) => [...prev, newItem]);
    setExpandedItemIndex(nextIndex);
  };

  const updateItem = (index: number, patch: Partial<ExchangeFormItem>) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], ...patch };
      item.returnTotalValue = item.returnQuantity * item.returnCost;
      item.newTotalValue = item.newQuantity * item.newCost;
      next[index] = item;
      return next;
    });
  };

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    if (expandedItemIndex === index) {
      setExpandedItemIndex(null);
    } else if (expandedItemIndex !== null && expandedItemIndex > index) {
      setExpandedItemIndex(expandedItemIndex - 1);
    }
    if (next.length === 0) {
      setLockedReceiptId(null);
    }
  };

  const toggleExpandItem = (index: number) => {
    setExpandedItemIndex((prev) => (prev === index ? null : index));
    setDraftProduct(null);
    setDraftLot(null);
  };

  // ─── TOTALS & VALIDATION ───
  const totals = useMemo(() => {
    const returnTotal = items.reduce((sum, i) => sum + i.returnTotalValue, 0);
    const receivedTotal = items.reduce((sum, i) => sum + i.newTotalValue, 0);
    return {
      returnTotal,
      receivedTotal,
      debtAdjustment: receivedTotal - returnTotal,
    };
  }, [items]);

  const validate = (): string | null => {
    if (!lockedReceiptId) return 'Vui lòng chọn ít nhất 1 sản phẩm và phiếu nhập gốc';
    if (items.length === 0) return 'Vui lòng thêm ít nhất 1 sản phẩm đổi trả';
    if (!reason) return 'Vui lòng chọn lý do đổi trả';
    for (const item of items) {
      if (!item.returnLotId) return `Sản phẩm "${item.productName}" chưa có lô trả`;
      if (item.returnQuantity <= 0) return `Sản phẩm "${item.productName}" số lượng trả phải > 0`;
      if (!item.newLotCode.trim()) return `Sản phẩm "${item.productName}" chưa nhập số lô mới`;
      if (item.newQuantity <= 0) return `Sản phẩm "${item.productName}" số lượng nhận phải > 0`;
      if (!item.newExpiryDate) return `Sản phẩm "${item.productName}" chưa nhập hạn sử dụng mới`;
      const product = productCache.get(item.productId);
      const lot = product?.lots?.find((l) => l.id === item.returnLotId);
      if (lot && item.returnQuantity > lot.quantity) {
        return `Sản phẩm "${item.productName}" lô "${item.returnLotCode}" không đủ tồn (còn ${lot.quantity})`;
      }
      if (item.returnExpiryDate && item.newExpiryDate) {
        const oldDate = new Date(item.returnExpiryDate);
        const newDate = new Date(item.newExpiryDate);
        if (newDate <= oldDate) {
          return `Sản phẩm "${item.productName}": HSD mới phải xa hơn HSD lô cũ`;
        }
      }
    }
    return null;
  };

  const handleSubmit = () => {
    const error = validate();
    if (error) {
      alert(error);
      return;
    }
    setShowWarning(true);
  };

  const confirmSubmit = async () => {
    setShowWarning(false);
    setSubmitting(true);
    try {
      const returnItems: SupplierExchangeReturnItem[] = items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        lotId: item.returnLotId,
        lotCode: item.returnLotCode,
        expiryDate: item.returnExpiryDate,
        quantity: item.returnQuantity,
        cost: item.returnCost,
        totalValue: item.returnTotalValue,
        referenceImportItemId: item.referenceImportItemId,
      }));
      const receivedItems: SupplierExchangeReceivedItem[] = items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        lotCode: item.newLotCode.trim(),
        expiryDate: item.newExpiryDate,
        quantity: item.newQuantity,
        cost: item.newCost,
        totalValue: item.newTotalValue,
      }));
      await supabaseService.createSupplierExchange({
        supplierId: lockedReceipt?.supplierId || '',
        referenceReceiptId: lockedReceiptId || '',
        date: exchangeDate,
        reason,
        note,
        status: 'completed',
        returnItems,
        receivedItems,
      });
      alert('Tạo phiếu đổi trả hàng NCC thành công');
      resetCreateForm();
      goToList();
      fetchExchanges();
    } catch (err: any) {
      console.error('Submit supplier exchange error:', err);
      alert(err.message || 'Lỗi khi tạo phiếu đổi trả hàng NCC');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = (exchange: SupplierExchange) => {
    printSupplierExchange(exchange, appSettings);
  };

  // ─── LIST COLUMNS (V2 — rich render, sortable, copy phong cách ImportGoods) ───
  const columns: DataGridColumn<SupplierExchange>[] = [
    {
      key: 'stt',
      label: 'STT',
      align: 'center',
      width: '48px',
      render: (_, index) => importStartIndex + index + 1,
    },
    {
      key: 'code',
      label: 'Mã phiếu',
      sortable: true,
      render: (e) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
            <RefreshCcw className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-slate-900 font-semibold text-sm hover:underline">
            {e.code}
          </span>
        </div>
      ),
    },
    {
      key: 'supplierName',
      label: 'Nhà cung cấp',
      sortable: true,
      render: (e) => (
        <span className="text-sm font-medium text-slate-700 group-hover:text-purple-600 transition-colors">
          {e.supplierName || '—'}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Ngày đổi trả',
      sortable: true,
      render: (e) => (
        <div>
          <p className="text-sm text-slate-500">{formatDate(e.date)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{formatTime(e.date)}</p>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Lý do',
      render: (e) => (
        <span className="text-sm text-slate-500">{e.reason || '—'}</span>
      ),
    },
    {
      key: 'itemsCount',
      label: 'SL mặt hàng',
      sortable: true,
      align: 'center',
      render: (e) => (
        <span className="text-sm text-slate-500 text-center">
          {(e.returnItems || []).length}
        </span>
      ),
    },
    {
      key: 'returnTotalValue',
      label: 'Giá trị trả',
      sortable: true,
      align: 'right',
      render: (e) => (
        <span className="text-sm font-semibold text-slate-700">
          {formatCurrency(e.returnTotalValue)}
        </span>
      ),
    },
    {
      key: 'receivedTotalValue',
      label: 'Giá trị nhận',
      sortable: true,
      align: 'right',
      render: (e) => (
        <span className="text-sm font-semibold text-emerald-600">
          {formatCurrency(e.receivedTotalValue)}
        </span>
      ),
    },
    {
      key: 'debtAdjustment',
      label: 'Chênh lệch công nợ',
      sortable: true,
      align: 'right',
      render: (e) => (
        <span className={`text-sm font-semibold ${e.debtAdjustment >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
          {formatCurrency(e.debtAdjustment)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      align: 'center',
      render: (e) => {
        switch (e.status) {
          case 'completed':
            return <StatusBadge label="Hoàn thành" type="success" size="sm" />;
          case 'cancelled':
            return <StatusBadge label="Đã hủy" type="danger" size="sm" />;
          default:
            return <StatusBadge label="Nháp" type="default" size="sm" />;
        }
      },
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'right',
      render: (e) => (
        <div className="inline-flex items-center gap-1">
          <ActionButton
            variant="ghost"
            size="sm"
            icon={<FileText className="w-4 h-4" />}
            onClick={(ev) => {
              ev?.stopPropagation();
              setViewingExchange(e);
            }}
            aria-label="Xem chi tiết"
          />
          <ActionButton
            variant="ghost"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={(ev) => {
              ev?.stopPropagation();
              handlePrint(e);
            }}
            aria-label="In phiếu"
          />
        </div>
      ),
    },
  ];

  // ─── RENDER LIST ───
  if (!isCreateRoute) {
    return (
      <div className="space-y-6 h-full flex flex-col animate-fade-in">
        {/* ===== PAGE HEADER (copy phong cách ImportGoods) ===== */}
        <div className="page-header items-start">
          <div className="flex items-center gap-3">
            <span className="inv-title-icon">
              <RefreshCcw className="w-4 h-4" />
            </span>
            <div>
              <h2 className="page-title">
                {viewingExchange ? 'Chi tiết phiếu đổi trả' : 'Đổi trả hàng nhà cung cấp'}
              </h2>
              <p className="page-subtitle">Quản lý đổi lô hàng cận/hết hạn với NCC</p>
            </div>
          </div>

          {/* Filters restyle — đồng bộ phong cách /inventory-count (filter-bar design) */}
          {!viewingExchange && (
            <div className="filter-bar md:mx-4">
              <div className="filter-bar__search">
                <Search className="filter-bar__search-icon" />
                <input
                  type="text"
                  placeholder="Tìm mã phiếu, NCC, lý do..."
                  className="filter-bar__search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Dropdown Filter */}
              <div className="filter-bar__dropdown">
                <button
                  onClick={() => {
                    setIsStatusFilterOpen(!isStatusFilterOpen);
                    setIsSupplierFilterOpen(false);
                  }}
                  className={`filter-bar__trigger ${statusFilter !== '' ? 'filter-bar__trigger--active' : ''}`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Trạng thái{statusFilter !== '' ? `: ${statusLabels[statusFilter]}` : ''}</span>
                  <ChevronDown className={`filter-bar__chevron ${isStatusFilterOpen ? 'filter-bar__chevron--open' : ''}`} />
                </button>

                {isStatusFilterOpen && (
                  <div className="filter-bar__menu">
                    <div className="filter-bar__menu-scroll">
                      {(['', 'completed', 'draft', 'cancelled'] as const).map(st => (
                        <div
                          key={st}
                          className="filter-bar__option"
                          onClick={() => {
                            setStatusFilter(st);
                            setIsStatusFilterOpen(false);
                          }}
                        >
                          <div className={`filter-bar__check ${statusFilter === st ? 'filter-bar__check--checked' : ''}`}>
                            {statusFilter === st && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="filter-bar__option-label">{statusLabels[st]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Supplier Dropdown Filter */}
              <div className="filter-bar__dropdown">
                <button
                  onClick={() => {
                    setIsSupplierFilterOpen(!isSupplierFilterOpen);
                    setIsStatusFilterOpen(false);
                  }}
                  className={`filter-bar__trigger ${selectedSupplierFilter !== '' ? 'filter-bar__trigger--active' : ''}`}
                >
                  <Truck className="w-4 h-4" />
                  <span>
                    {selectedSupplierFilter !== ''
                      ? `NCC: ${suppliers.find((s) => s.id === selectedSupplierFilter)?.name ?? 'Tất cả NCC'}`
                      : 'Tất cả NCC'}
                  </span>
                  <ChevronDown className={`filter-bar__chevron ${isSupplierFilterOpen ? 'filter-bar__chevron--open' : ''}`} />
                </button>

                {isSupplierFilterOpen && (
                  <div className="filter-bar__menu">
                    <div className="filter-bar__menu-scroll">
                      <div
                        className="filter-bar__option"
                        onClick={() => {
                          setSelectedSupplierFilter('');
                          setIsSupplierFilterOpen(false);
                        }}
                      >
                        <div className={`filter-bar__check ${selectedSupplierFilter === '' ? 'filter-bar__check--checked' : ''}`}>
                          {selectedSupplierFilter === '' && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="filter-bar__option-label">Tất cả NCC</span>
                      </div>
                      {suppliers.map((s) => (
                        <div
                          key={s.id}
                          className="filter-bar__option"
                          onClick={() => {
                            setSelectedSupplierFilter(s.id);
                            setIsSupplierFilterOpen(false);
                          }}
                        >
                          <div className={`filter-bar__check ${selectedSupplierFilter === s.id ? 'filter-bar__check--checked' : ''}`}>
                            {selectedSupplierFilter === s.id && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="filter-bar__option-label">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reset Filters */}
              {isFilterActive && (
                <button onClick={resetFilters} className="filter-bar__reset">
                  <X className="w-4 h-4" /> Xoá bộ lọc
                </button>
              )}
            </div>
          )}

          {!viewingExchange && (
            <button
              onClick={() => {
                resetCreateForm();
                goToCreate();
              }}
              className="btn-primary flex items-center gap-2 px-4 py-2.5 self-start flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Tạo phiếu
            </button>
          )}
        </div>

        {/* ===== 5 STAT CARDS — copy phong cách ImportGoods ===== */}
        {!viewingExchange && (
          <StatsRow
            stats={[
              {
                label: 'Tổng phiếu đổi trả',
                value: listStats.totalExchanges,
                subtext: 'Toàn bộ phiếu',
                icon: <ClipboardList />,
                colorScheme: 'purple',
              },
              {
                label: 'Tổng giá trị trả',
                value: listStats.totalReturnValue.toLocaleString('vi-VN') + '₫',
                subtext: 'Giá trị trả NCC',
                icon: <RotateCcw />,
                colorScheme: 'blue',
              },
              {
                label: 'Tổng giá trị nhận',
                value: listStats.totalReceivedValue.toLocaleString('vi-VN') + '₫',
                subtext: 'Giá trị nhận mới',
                icon: <Package />,
                colorScheme: 'orange',
              },
              {
                label: 'Đã hoàn thành',
                value: listStats.completedCount,
                subtext: listStats.completedPercent + '% tổng phiếu',
                icon: <CheckCircle />,
                colorScheme: 'green',
              },
              {
                label: 'Chênh lệch công nợ',
                value: listStats.totalDebtAdjustment.toLocaleString('vi-VN') + '₫',
                subtext: 'Tăng/giảm nợ NCC',
                icon: <Wallet />,
                colorScheme: 'red',
              },
            ]}
          />
        )}

        {/* ===== BATCH ACTIONS BAR (ẩn nút Xoá) ===== */}
        {!viewingExchange && (
          <BatchActionsBar
            selectedCount={selectedExchangeIds.size}
            onDeleteSelected={() => {}}
            onPrintSelected={handlePrintSelected}
            onExportData={handleExportData}
            onClearSelection={handleClearSelection}
            showDelete={false}
          />
        )}

        {/* ===== CONTAINER: DataGrid hoặc Detail Panel ===== */}
        <div className={viewingExchange ? 'se-page-container overflow-hidden flex-1 min-h-0' : 'bg-white rounded-3xl shadow-[0_2px_8px_rgba(15,23,42,0.03)] border border-slate-100 p-6 overflow-hidden'}>
          {viewingExchange ? (
            /* ===== DETAIL PANEL (copy phong cách ImportGoods) ===== */
            <div className="flex flex-col h-full">
              <div className="se-page-detail-header">
                <button
                  onClick={() => setViewingExchange(null)}
                  className="se-page-detail-header__back"
                  aria-label="Quay lại"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="se-page-detail-header__title">
                  Chi tiết phiếu: {viewingExchange.code}
                </h3>
                <div className="se-page-detail-header__actions">
                  <button
                    onClick={() => handlePrint(viewingExchange)}
                    className="btn-primary flex items-center gap-2 px-4 py-2"
                  >
                    <Printer className="w-4 h-4" /> In phiếu
                  </button>
                </div>
              </div>

              <div className="se-page-detail-body">
                {/* SIDEBAR CHI TIẾT */}
                <div className="se-page-detail-sidebar">
                  {/* Card Nhà cung cấp */}
                  <div className="se-page-detail-card se-page-detail-card--purple">
                    <p className="se-page-detail-card__label">Nhà cung cấp</p>
                    <p className="se-page-detail-card__value">
                      <Truck className="w-4 h-4 se-page-detail-card__value-icon" />
                      {viewingExchange.supplierName || 'Chưa rõ NCC'}
                    </p>
                    <p className="se-page-detail-card__meta">
                      <Calendar className="w-3 h-3" />
                      <span>Ngày đổi trả: <strong>{formatDate(viewingExchange.date)}</strong></span>
                    </p>
                    {viewingExchange.reason && (
                      <p className="se-page-detail-card__meta">
                        <FileText className="w-3 h-3" />
                        <span>Lý do: <strong>{viewingExchange.reason}</strong></span>
                      </p>
                    )}
                  </div>

                  {/* Card thông tin phiếu */}
                  <div className="se-page-detail-card">
                    <p className="se-page-detail-card__info-label">Thông tin phiếu</p>
                    <div className="se-page-detail-card__info-row">
                      <span className="se-page-detail-card__info-item-label">Mã phiếu</span>
                      <span className="se-page-detail-card__info-item-value">{viewingExchange.code}</span>
                    </div>
                    <div className="se-page-detail-card__info-row">
                      <span className="se-page-detail-card__info-item-label">Phiếu nhập gốc</span>
                      <span className="se-page-detail-card__info-item-value">
                        {viewingExchange.referenceReceiptId || '—'}
                      </span>
                    </div>
                    <div className="se-page-detail-card__info-row">
                      <span className="se-page-detail-card__info-item-label">SL mặt hàng</span>
                      <span className="se-page-detail-card__info-item-value">
                        {(viewingExchange.returnItems || []).length}
                      </span>
                    </div>
                    <div className="se-page-detail-card__info-row">
                      <span className="se-page-detail-card__info-item-label">Trạng thái</span>
                      <span>
                        {viewingExchange.status === 'completed' && (
                          <StatusBadge label="Hoàn thành" type="success" size="sm" />
                        )}
                        {viewingExchange.status === 'cancelled' && (
                          <StatusBadge label="Đã hủy" type="danger" size="sm" />
                        )}
                        {viewingExchange.status === 'draft' && (
                          <StatusBadge label="Nháp" type="default" size="sm" />
                        )}
                      </span>
                    </div>
                    {viewingExchange.note && (
                      <>
                        <div className="se-page-detail-card__divider" />
                        <label className="se-page-detail-card__note-label">Ghi chú</label>
                        <p className="se-page-detail-card__note">{viewingExchange.note}</p>
                      </>
                    )}
                  </div>

                  {/* Card tổng kết tài chính */}
                  <div className="se-page-summary-card">
                    <p className="se-page-summary-card__title">Tổng kết tài chính</p>
                    <div className="se-page-summary-card__row">
                      <span>Tổng giá trị trả</span>
                      <span className="se-page-summary-card__return">
                        {formatCurrency(viewingExchange.returnTotalValue)}
                      </span>
                    </div>
                    <div className="se-page-summary-card__row">
                      <span>Tổng giá trị nhận</span>
                      <span className="se-page-summary-card__received">
                        {formatCurrency(viewingExchange.receivedTotalValue)}
                      </span>
                    </div>
                    <div className="se-page-summary-card__divider" />
                    <div className="se-page-summary-card__row se-page-summary-card__row--highlight">
                      <span>Chênh lệch công nợ</span>
                      <strong>{formatCurrency(viewingExchange.debtAdjustment)}</strong>
                    </div>
                    <p className="se-page-summary-card__hint">
                      {viewingExchange.debtAdjustment >= 0
                        ? 'Cửa hàng nợ NCC thêm số tiền này.'
                        : 'NCC hoàn/cấn trừ số tiền này cho cửa hàng.'}
                    </p>
                  </div>
                </div>

                {/* BẢNG SẢN PHẨM TRẢ / NHẬN */}
                <div className="se-page-products">
                  <h4 className="se-page-products__title">
                    <Package className="w-4 h-4 se-page-products__title-icon" />
                    Chi tiết sản phẩm đổi trả
                  </h4>
                  <div className="se-page-products__table-wrap">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            Sản phẩm
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            Lô trả
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            SL trả
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            Lô nhận
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            SL nhận
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            Giá trị trả
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            Giá trị nhận
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {(viewingExchange.returnItems || []).map((rit, idx) => {
                          const received = viewingExchange.receivedItems?.[idx];
                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-slate-800">
                                    {rit.productName}
                                  </span>
                                  {rit.productCode && (
                                    <span className="text-xs text-slate-400">{rit.productCode}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center text-sm text-slate-600">
                                {rit.lotCode || '—'}
                              </td>
                              <td className="px-3 py-2.5 text-center text-sm text-slate-600">
                                {rit.quantity}
                              </td>
                              <td className="px-3 py-2.5 text-center text-sm text-slate-600">
                                {received?.lotCode || '—'}
                              </td>
                              <td className="px-3 py-2.5 text-center text-sm text-slate-600">
                                {received?.quantity ?? '—'}
                              </td>
                              <td className="px-3 py-2.5 text-right text-sm font-semibold text-slate-700 whitespace-nowrap">
                                {formatCurrency(rit.totalValue)}
                              </td>
                              <td className="px-3 py-2.5 text-right text-sm font-semibold text-emerald-600 whitespace-nowrap">
                                {received ? formatCurrency(received.totalValue) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="supplier-exchanges-loading">
              <RotateCcw size={24} className="animate-spin text-slate-400" />
            </div>
          ) : (
            <DataGrid
              data={paginatedExchanges}
              columns={columns}
              keyExtractor={(e) => e.id}
              selectedRows={Array.from(selectedExchangeIds)}
              onSelectionChange={(ids) => {
                setSelectedExchangeIds(new Set(ids as string[]));
                setIsSelectAllChecked(false);
              }}
              onRowClick={(e) => setViewingExchange(e)}
              sortKey={v2SortConfig?.key}
              sortDirection={v2SortConfig?.direction || 'none'}
              onSortChange={handleDataGridSort}
              pagination={{
                currentPage: safeCurrentPage,
                totalPages,
                totalCount: sortedExchanges.length,
                pageSize: PAGE_SIZE,
                onPageChange: (page) => setCurrentPage(page),
                showInfo: false,
              }}
              emptyTitle="Chưa có phiếu đổi trả nào"
              emptyDescription={'Bấm "Tạo phiếu" để bắt đầu đổi lô hàng cận/hết hạn.'}
              emptyAction={
                <ActionButton
                  variant="primary"
                  size="md"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    resetCreateForm();
                    goToCreate();
                  }}
                >
                  Tạo phiếu
                </ActionButton>
              }
            />
          )}
        </div>
      </div>
    );
  }

  // ─── RENDER COMPACT ITEM ───
  const renderCompactItem = (item: ExchangeFormItem, index: number) => (
    <div
      key={index}
      className="supplier-exchanges-item-card compact"
      onClick={() => toggleExpandItem(index)}
    >
      <div className="supplier-exchanges-item-header">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-indigo-500" />
          <span className="font-medium text-slate-900">{item.productName}</span>
          {item.productCode && <span className="text-xs text-slate-500">({item.productCode})</span>}
          <span className="text-xs text-slate-500">
            Lô trả: {item.returnLotCode || '—'} | Lô nhận: {item.newLotCode || '—'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {item.returnQuantity} → {item.newQuantity}
          </span>
          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </div>
    </div>
  );

  // ─── RENDER EXPANDED ITEM ───
  const renderExpandedItem = (item: ExchangeFormItem, index: number) => {
    const product = productCache.get(item.productId);
    const lot = product?.lots?.find((l) => l.id === item.returnLotId);
    return (
      <div key={index} className="supplier-exchanges-item-card expanded">
        <div className="supplier-exchanges-item-header">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-indigo-500" />
            <span className="font-medium text-slate-900">{item.productName}</span>
            {item.productCode && <span className="text-xs text-slate-500">({item.productCode})</span>}
          </div>
          <div className="flex items-center gap-1">
            <VoucherButton
              variant="ghost"
              size="sm"
              icon={<ChevronDown size={16} className="text-slate-400" />}
              onClick={() => toggleExpandItem(index)}
              title="Thu gọn"
            />
            <VoucherButton
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => removeItem(index)}
              title="Xóa"
            />
          </div>
        </div>

        <div className="supplier-exchanges-item-grid">
          {/* OLD LOT */}
          <div className="supplier-exchanges-item-block old">
            <div className="supplier-exchanges-item-block-title">
              <RotateCcw size={14} /> Lô trả
            </div>
            <VoucherField label="Số lô" fullWidth>
              <VoucherInput value={item.returnLotCode || ''} disabled fullWidth />
            </VoucherField>
            <VoucherField label="HSD cũ" fullWidth>
              <VoucherInput value={formatDate(item.returnExpiryDate)} disabled fullWidth />
            </VoucherField>
            <VoucherField label="Số lượng trả" fullWidth>
              <VoucherInput
                type="number"
                min={1}
                max={lot?.quantity ?? 0}
                value={item.returnQuantity}
                onChange={(e) => updateItem(index, { returnQuantity: Number(e.target.value) })}
                fullWidth
              />
              <span className="text-xs text-slate-500">Tồn lô: {lot?.quantity ?? 0}</span>
            </VoucherField>
            <VoucherField label="Giá vốn" fullWidth>
              <VoucherInput
                type="number"
                value={item.returnCost}
                onChange={(e) => updateItem(index, { returnCost: Number(e.target.value) })}
                fullWidth
              />
            </VoucherField>
          </div>

          {/* ARROW */}
          <div className="supplier-exchanges-item-arrow">
            <RefreshCcw size={20} className="text-slate-400" />
          </div>

          {/* NEW LOT */}
          <div className="supplier-exchanges-item-block new">
            <div className="supplier-exchanges-item-block-title">
              <Plus size={14} /> Lô nhận mới
            </div>
            <VoucherField label="Số lô mới *" fullWidth>
              <VoucherInput
                placeholder="Nhập số lô mới"
                value={item.newLotCode}
                onChange={(e) => updateItem(index, { newLotCode: e.target.value })}
                fullWidth
              />
            </VoucherField>
            <VoucherField label="HSD mới *" fullWidth>
              <VoucherInput
                type="date"
                value={item.newExpiryDate}
                onChange={(e) => updateItem(index, { newExpiryDate: e.target.value })}
                fullWidth
              />
            </VoucherField>
            <VoucherField label="Số lượng nhận *" fullWidth>
              <VoucherInput
                type="number"
                min={1}
                value={item.newQuantity}
                onChange={(e) => updateItem(index, { newQuantity: Number(e.target.value) })}
                fullWidth
              />
            </VoucherField>
            <VoucherField label="Giá vốn mới" fullWidth>
              <VoucherInput
                type="number"
                value={item.newCost}
                onChange={(e) => updateItem(index, { newCost: Number(e.target.value) })}
                fullWidth
              />
            </VoucherField>
          </div>
        </div>

        <div className="supplier-exchanges-item-summary">
          <span>
            Trả: <strong>{formatCurrency(item.returnTotalValue)}</strong>
          </span>
          <span>
            Nhận: <strong>{formatCurrency(item.newTotalValue)}</strong>
          </span>
          <span className={item.newTotalValue - item.returnTotalValue >= 0 ? 'text-red-600' : 'text-emerald-600'}>
            Chênh lệch: <strong>{formatCurrency(item.newTotalValue - item.returnTotalValue)}</strong>
          </span>
        </div>
      </div>
    );
  };

  // ─── RENDER CREATE ───
  const voucherMain = (
    <div className="flex flex-col gap-4">
      {/* PRODUCT SEARCH */}
      <VoucherSection>
        <VoucherSectionHeader title="Tìm sản phẩm cần đổi trả" />
        <VoucherSectionContent>
          <div className="relative">
            <VoucherSearch
              value={productSearch}
              onChange={handleProductSearchChange}
              placeholder={
                lockedReceiptId
                  ? 'Tìm thêm sản phẩm trong phiếu nhập gốc...'
                  : 'Nhập tên, mã hoặc barcode sản phẩm...'
              }
              loading={isSearchingProduct}
              onFocus={() => productSearch.trim() && setShowProductResults(true)}
            />
            <VoucherProductDropdown
              mode="server"
              open={showProductResults && filteredProducts.length > 0}
              onRequestClose={() => setShowProductResults(false)}
              onSelectProduct={(product) => {
                handleSelectProduct(product);
                setShowProductResults(false);
              }}
              results={filteredProducts}
              maxItems={8}
            />
          </div>
        </VoucherSectionContent>
      </VoucherSection>

      {/* LOT SELECTION */}
      {draftProduct && (
        <VoucherSection>
          <VoucherSectionHeader title={`Chọn lô date của ${draftProduct.name}`} />
          <VoucherSectionContent>
            {draftProductLots.length === 0 ? (
              <VoucherEmpty
                icon={<Package size={40} />}
                title="Không còn lô khả dụng"
                description="Không còn lô nào khả dụng cho sản phẩm này"
              />
            ) : (
              <div className="supplier-exchanges-lot-grid">
                {draftProductLots.map((lot) => (
                  <button
                    key={lot.id}
                    className="supplier-exchanges-lot-card"
                    onClick={() => handleSelectLot(lot)}
                  >
                    <div className="supplier-exchanges-lot-code">{lot.code || '—'}</div>
                    <div className="supplier-exchanges-lot-meta">
                      <span>HSD: {formatDate(lot.expiryDate)}</span>
                      <span>Tồn: {lot.quantity}</span>
                    </div>
                    {lot.cost !== undefined && (
                      <div className="supplier-exchanges-lot-cost">
                        Giá vốn: {formatCurrency(lot.cost)}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </VoucherSectionContent>
        </VoucherSection>
      )}

      {/* RECEIPT SELECTION (first item only) */}
      {!lockedReceiptId && draftLot && (
        <VoucherSection>
          <VoucherSectionHeader title={`Chọn phiếu nhập gốc của lô ${draftLot.code}`} />
          <VoucherSectionContent>
            {lotReceipts.length === 0 ? (
              <VoucherEmpty
                icon={<FileText size={40} />}
                title="Không tìm thấy phiếu nhập"
                description="Không tìm thấy phiếu nhập gốc cho lô này"
              />
            ) : (
              <div className="supplier-exchanges-receipt-list">
                {lotReceipts.map((receipt) => {
                  const supplier = suppliers.find((s) => s.id === receipt.supplierId);
                  const importItem = receipt.items?.find(
                    (i) => i.productId === draftProduct?.id && i.lotCode === draftLot?.code
                  );
                  return (
                    <button
                      key={receipt.id}
                      className="supplier-exchanges-receipt-card"
                      onClick={() => handleSelectReceipt(receipt)}
                    >
                      <div className="supplier-exchanges-receipt-main">
                        <span className="supplier-exchanges-receipt-code">{receipt.id}</span>
                        <span className="supplier-exchanges-receipt-supplier">
                          {supplier?.name || 'NCC không xác định'}
                        </span>
                      </div>
                      <div className="supplier-exchanges-receipt-meta">
                        <span>{formatDate(receipt.date)}</span>
                        <span>SL nhập: {importItem?.quantity ?? 0}</span>
                        <span>Giá vốn: {formatCurrency(importItem?.cost ?? 0)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </VoucherSectionContent>
        </VoucherSection>
      )}

      {/* LOCKED RECEIPT INFO (after first item) */}
      {lockedReceipt && (
        <VoucherBanner>
          <div className="flex items-start gap-3">
            <FileText size={18} className="text-indigo-500 shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-900">
                  Phiếu nhập gốc: {lockedReceipt.id}
                </span>
                <span className="text-sm text-slate-500">— {lockedSupplier?.name || 'NCC không xác định'}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Các sản phẩm tiếp theo sẽ được chọn trong cùng phiếu nhập này.
              </p>
            </div>
          </div>
        </VoucherBanner>
      )}

      {/* ITEMS LIST */}
      {items.length > 0 && (
        <VoucherSection>
          <VoucherSectionHeader title={`Sản phẩm đã chọn (${items.length})`} />
          <VoucherSectionContent>
            <div className="supplier-exchanges-items">
              {items.map((item, index) =>
                expandedItemIndex === index
                  ? renderExpandedItem(item, index)
                  : renderCompactItem(item, index)
              )}
            </div>
          </VoucherSectionContent>
        </VoucherSection>
      )}
    </div>
  );

  const voucherSidebar = (
    <>
      <VoucherSection>
        <VoucherSectionHeader title="Thông tin phiếu" />
        <VoucherSectionContent>
          <VoucherField label="Nhà cung cấp" fullWidth>
            <VoucherInput
              value={lockedSupplier?.name || ''}
              placeholder="Chưa chọn (sẽ lấy từ phiếu nhập gốc)"
              disabled
              fullWidth
            />
          </VoucherField>
          <VoucherField label="Phiếu nhập gốc" fullWidth>
            <VoucherInput
              value={lockedReceipt?.id || ''}
              placeholder="Chưa chọn (sẽ lấy từ sản phẩm đầu tiên)"
              disabled
              fullWidth
            />
          </VoucherField>
          <VoucherField label="Ngày đổi trả" labelFor="exchange-date" fullWidth>
            <VoucherInput
              id="exchange-date"
              type="datetime-local"
              value={exchangeDate}
              onChange={(e) => setExchangeDate(e.target.value)}
              fullWidth
            />
          </VoucherField>
          <VoucherField label="Lý do" labelFor="exchange-reason" fullWidth>
            <VoucherSelect
              id="exchange-reason"
              placeholder="Chọn lý do"
              options={REASONS.map((r) => ({ value: r, label: r }))}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
            />
          </VoucherField>
          <VoucherField label="Ghi chú" labelFor="exchange-note" fullWidth>
            <VoucherTextarea
              id="exchange-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm về phiếu đổi trả..."
              rows={3}
              fullWidth
            />
          </VoucherField>
        </VoucherSectionContent>
      </VoucherSection>

      <VoucherSection>
        <VoucherSectionHeader title="Tổng kết" />
        <VoucherSectionContent>
          <VoucherTotals
            items={[
              { label: 'Tổng giá trị trả', value: formatCurrency(totals.returnTotal) },
              { label: 'Tổng giá trị nhận', value: formatCurrency(totals.receivedTotal) },
              {
                label: 'Chênh lệch công nợ',
                value: (
                  <span className={totals.debtAdjustment >= 0 ? 'text-red-600' : 'text-emerald-600'}>
                    {formatCurrency(totals.debtAdjustment)}
                  </span>
                ),
                highlight: true,
              },
            ]}
          />
          <p className="text-xs text-slate-500 mt-2">
            {totals.debtAdjustment >= 0
              ? 'Cửa hàng nợ NCC thêm số tiền này.'
              : 'NCC hoàn/cấn trừ số tiền này cho cửa hàng.'}
          </p>
        </VoucherSectionContent>
      </VoucherSection>
    </>
  );

  const voucherActions = (
    <>
      <VoucherButton
        variant="secondary"
        icon={<X size={16} />}
        onClick={() => goToList()}
        disabled={submitting}
      >
        Hủy
      </VoucherButton>
      <VoucherButton
        variant="primary"
        icon={submitting ? <RotateCcw size={16} className="animate-spin" /> : <Check size={16} />}
        onClick={handleSubmit}
        disabled={submitting}
        loading={submitting}
      >
        Hoàn thành
      </VoucherButton>
    </>
  );

  return (
    // Đồng bộ bố cục với /import/create: PageLayout h-full flex flex-col + VoucherFormLayout flex-1 min-h-0.
    <PageLayout className="h-full flex flex-col">
      <VoucherFormLayout
        className="flex-1 min-h-0"
        title="Tạo phiếu đổi trả hàng NCC"
        onBack={() => goToList()}
        banner={
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0" />
            <p>
              <strong>Lưu ý:</strong> Phiếu đổi trả hàng NCC sau khi hoàn thành sẽ{' '}
              <strong>KHÔNG THỂ HỦY</strong> trên hệ thống. Vui lòng kiểm tra kỹ lô hàng và số lượng trước khi xác nhận.
            </p>
          </div>
        }
        main={voucherMain}
        sidebar={voucherSidebar}
        actions={voucherActions}
      />

      {/* WARNING MODAL */}
      {showWarning && (
        <div className="supplier-exchanges-modal-overlay">
          <div className="supplier-exchanges-modal">
            <div className="supplier-exchanges-modal-icon">
              <AlertTriangle size={32} />
            </div>
            <h3 className="supplier-exchanges-modal-title">Xác nhận tạo phiếu đổi trả</h3>
            <p className="supplier-exchanges-modal-desc">
              Phiếu đổi trả hàng NCC sau khi hoàn thành sẽ <strong>KHÔNG THỂ HỦY</strong> trên hệ thống.
              Hệ thống sẽ trừ lô cũ, tạo lô mới và điều chỉnh công nợ NCC.
            </p>
            <p className="supplier-exchanges-modal-desc">
              Bạn có chắc chắn muốn tiếp tục?
            </p>
            <div className="supplier-exchanges-modal-actions">
              <VoucherButton
                variant="secondary"
                onClick={() => setShowWarning(false)}
                disabled={submitting}
              >
                Quay lại kiểm tra
              </VoucherButton>
              <VoucherButton
                variant="primary"
                icon={<Check size={16} />}
                onClick={confirmSubmit}
                disabled={submitting}
                loading={submitting}
              >
                Xác nhận hoàn thành
              </VoucherButton>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
