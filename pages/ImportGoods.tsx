import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Product, Supplier, ImportReceipt, ImportItemInput } from '../types';
import { Search, ArrowDownToLine, Plus, Minus, Trash2, ClipboardList, Calendar, User, Edit, X, ArrowLeft, Package, FileText, Check, CheckCircle, Wallet, ChevronLeft, ChevronRight, Loader2, Save, Phone } from 'lucide-react';
import { AdvancedFilterPanel, FilterState } from '../components/AdvancedFilterPanel';
import { BatchActionsBar } from '../components/BatchActionsBar';
import {
  VoucherFormLayout,
  VoucherSection,
  VoucherSectionHeader,
  VoucherSectionContent,
  VoucherField,
  VoucherInput,
  VoucherTextarea,
  VoucherButton,
  VoucherTotals,
  VoucherEmpty,
  VoucherProductDropdown,
  VoucherTable,
  VoucherTableRow,
} from '../components/voucher-form';
import StatsRow from '../components/shared/StatsRow';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { ActionButton } from '../components/ActionButton';
import { DataGrid, DataGridColumn, SortDirection } from '../components/DataGrid';
import { useNewDataGridImportGoods } from '../features';
import { PageLayout } from '../components/shared/PageLayout';
import { DataGridBox } from '../components/shared/DataGridBox';
import { useDebounce } from '../hooks/useDebounce';
import { AppError } from '../utils/errors';
import { usePermissions } from '../hooks/usePermissions';
import { supabaseService } from '../services/supabaseService';
import './ImportGoods.css';

interface ImportGoodsProps {
  products?: Product[];
  suppliers?: Supplier[];
  importReceipts?: ImportReceipt[];
  onImport: (items: ImportItemInput[], supplierId: string, total: number, paid: number, invoiceNumber: string, date: string, shippingCost: number, status?: 'draft' | 'completed', discountTotal?: number, note?: string, receiptId?: string) => void;
  onAddSupplier: (supplier: Supplier) => void;
  onDeleteImport?: (id: string) => void;
  onUpdateImport?: (receipt: ImportReceipt) => void;
}

export const ImportGoods: React.FC<ImportGoodsProps> = ({ 
  products = [], 
  suppliers = [], 
  importReceipts = [], 
  onImport, 
  onAddSupplier,
  onDeleteImport,
  onUpdateImport
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const activeTab = useMemo<'create' | 'history'>(() => location.pathname === '/import/create' ? 'create' : 'history', [location.pathname]);
  const [viewingReceipt, setViewingReceipt] = useState<ImportReceipt | null>(null);
  const dataGridBoxRef = useRef<HTMLDivElement>(null);

  // Helpers for item-row quantity input formatting/parse.
  const formatQty = (n: number) => n.toLocaleString('vi-VN');
  const parseQty = (raw: string) => {
    const digits = raw.replace(/\./g, '').replace(/\D/g, '');
    return digits === '' ? 0 : parseInt(digits, 10);
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [importList, setImportList] = useState<ImportItemInput[]>([]);
  const [shippingCost, setShippingCost] = useState<number | string>('');
  const [amountPaid, setAmountPaid] = useState<number | string>('');
  
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receiptCode, setReceiptCode] = useState(''); // Phase 6/8 — user nhập hoặc auto-gen khi submit
  const [discountTotal, setDiscountTotal] = useState<number | string>(''); // Phase 7
  const [note, setNote] = useState(''); // Phase 7
  const [paidTouched, setPaidTouched] = useState(false); // Phase 7 — chặn auto-fill khi user đã sửa
  const [importDate, setImportDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  // Phase 5b — placeholder mã phiếu cập nhật theo ngày nhập đã chọn
  const [receiptCodePlaceholder, setReceiptCodePlaceholder] = useState('Tự sinh nếu để trống...');
  useEffect(() => {
    const d = new Date(importDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const prefix = `PN-${yyyy}${mm}${dd}-`;
    let cancelled = false;
    supabaseService.getImportReceiptCountByDate(`${yyyy}-${mm}-${dd}`)
      .then(count => {
        if (cancelled) return;
        setReceiptCodePlaceholder(`${prefix}${String((count || 0) + 1).padStart(3, '0')}`);
      })
      .catch(err => {
        if (cancelled) return;

        setReceiptCodePlaceholder(`${prefix}XXX`);
      });
    return () => { cancelled = true; };
  }, [importDate]);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({ name: '', phone: '', address: '', contactPerson: '' });

  // Phase 7.1 — supplier combobox state (was inside SupplierSection)
  const [supplierQuery, setSupplierQuery] = useState('');
  const [isPickingSupplier, setIsPickingSupplier] = useState(!selectedSupplier);
  const supplierContainerRef = useRef<HTMLDivElement | null>(null);

  // Phase 3 — autocomplete dropdown sản phẩm
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Phase 1 — cache single-record supplier / product (thay thế .find trên prop rỗng)
  const [supplierCache, setSupplierCache] = useState<Map<string, Supplier>>(new Map());
  const [productCache, setProductCache] = useState<Map<string, Product>>(new Map());

  // Phase 1a — local suppliers & stats (server-side, thay thế prop rỗng)
  const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>([]);
  const [localImportStats, setLocalImportStats] = useState({
    totalReceipts: 0,
    totalCost: 0,
    totalShipping: 0,
    totalPaid: 0,
    totalDebt: 0,
    paidPercent: '0',
  });
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Phase 1b — local products from server-side search (thay thế prop rỗng)
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const productSearchRequestId = useRef(0);
  const debouncedProductSearchTerm = useDebounce(searchTerm, 300);

  const getSupplierFromCache = useCallback((id?: string) => id ? supplierCache.get(id) : undefined, [supplierCache]);
  const getProductFromCache = useCallback((id?: string) => id ? productCache.get(id) : undefined, [productCache]);

  const ensureSupplier = useCallback(async (id: string): Promise<Supplier | null> => {
    if (!id) return null;
    const cached = supplierCache.get(id);
    if (cached) return cached;
    try {
      const supplier = await supabaseService.getSupplierById(id);
      if (supplier) {
        setSupplierCache(prev => new Map(prev).set(id, supplier));
      }
      return supplier;
    } catch (err) {

      return null;
    }
  }, [supplierCache]);

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

  // Phase 1a — mount: load suppliers from server (fall back to prop if provided)
  useEffect(() => {
    if (suppliers.length > 0) {
      setLocalSuppliers(suppliers);
      setSupplierCache(prev => {
        const next = new Map(prev);
        suppliers.forEach(s => next.set(s.id, s));
        return next;
      });
      return;
    }
    let cancelled = false;
    setIsLoadingSuppliers(true);
    supabaseService.getSuppliers()
      .then(data => {
        if (cancelled) return;
        setLocalSuppliers(data);
        setSupplierCache(prev => {
          const next = new Map(prev);
          data.forEach(s => next.set(s.id, s));
          return next;
        });
      })
      .catch(() => {
        // ponytail: lỗi load suppliers không cần xử lý thêm
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSuppliers(false);
      });
    return () => { cancelled = true; };
  }, [suppliers]);

  // Phase 1b — server-side product search when user types in create form
  useEffect(() => {
    const term = debouncedProductSearchTerm.trim();
    if (activeTab !== 'create') return;
    const requestId = ++productSearchRequestId.current;
    if (!term) {
      setLocalProducts([]);
      return;
    }
    setIsLoadingProducts(true);
    supabaseService.searchProducts(term, 50)
      .then(data => {
        if (requestId !== productSearchRequestId.current) return;
        setProductCache(prev => {
          const next = new Map(prev);
          data.forEach((p: Product) => next.set(p.id, p));
          return next;
        });
        setLocalProducts(data);
      })
      .catch(err => {
        if (requestId !== productSearchRequestId.current) return;

        setLocalProducts([]);
      })
      .finally(() => {
        if (requestId === productSearchRequestId.current) setIsLoadingProducts(false);
      });
  }, [debouncedProductSearchTerm, activeTab]);

  // Phase 7.1 — supplier combobox sync + click-outside (was inside SupplierSection)
  const selectedSupplierObj = useMemo(
    () => localSuppliers.find((s) => s.id === selectedSupplier),
    [localSuppliers, selectedSupplier]
  );
  useEffect(() => {
    if (!selectedSupplierObj) setIsPickingSupplier(true);
  }, [selectedSupplierObj]);
  useEffect(() => {
    if (!isPickingSupplier) return;
    const handler = (e: MouseEvent) => {
      if (supplierContainerRef.current && !supplierContainerRef.current.contains(e.target as Node)) {
        if (selectedSupplierObj) setIsPickingSupplier(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isPickingSupplier, selectedSupplierObj]);
  const filteredSuppliers = useMemo(() => {
    const q = supplierQuery.trim().toLowerCase();
    if (!q) return [];
    return localSuppliers
      .filter(
        (s) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.phone || '').toLowerCase().includes(q) ||
          ((s as any).code || '').toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [localSuppliers, supplierQuery]);
  const supplierDebt = selectedSupplierObj?.debt || 0;
  const handleClearSupplier = () => {
    setSelectedSupplier('');
    setSupplierQuery('');
    setIsPickingSupplier(true);
  };

  // Phase 7 — tổng tiền hàng sau giảm giá theo dòng (dùng cho totals).
  const totalGoodsAfterLineDiscount = useMemo(
    () => importList.reduce((sum, it) => sum + Math.max(0, it.quantity * it.cost - (it.discount || 0)), 0),
    [importList]
  );
  // Phase 7.1 — totals calculation + paid auto-fill (moved from TotalsSection to page).
  const ship = Number(shippingCost) || 0;
  const disc = Number(discountTotal) || 0;
  const paid = Number(amountPaid) || 0;
  const needToPay = Math.max(0, totalGoodsAfterLineDiscount + ship - disc);
  const debtDelta = needToPay - paid;
  const lastAutoFillRef = useRef<number>(-1);
  useEffect(() => {
    if (paidTouched) return;
    if (needToPay !== lastAutoFillRef.current) {
      lastAutoFillRef.current = needToPay;
      setAmountPaid(String(needToPay));
    }
  }, [needToPay, paidTouched]);

  // Phase 8 — trạng thái đang submit (chặn double-click 2 nút Lưu tạm / Hoàn thành)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phase 10 — Keyboard shortcuts cho form tạo phiếu nhập:
  //   Ctrl/Cmd + S  → Lưu tạm (draft)
  //   Ctrl/Cmd + Enter → Hoàn thành
  //   Esc → Quay lại danh sách (huỷ tạo/sửa)
  // Chỉ kích hoạt khi đang ở tab 'create'. Esc vẫn cho phép khi focus input
  // (để thoát nhanh); Ctrl+S / Ctrl+Enter dùng modifier nên an toàn khi gõ.
  useEffect(() => {
    if (activeTab !== 'create') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (!isSubmitting && importList.length > 0) submitReceipt('draft');
      } else if (mod && e.key === 'Enter') {
        e.preventDefault();
        if (!isSubmitting && importList.length > 0) submitReceipt('completed');
      } else if (e.key === 'Escape') {
        // Không thoát nếu đang mở modal NCC
        if (isSupplierModalOpen) return;
        e.preventDefault();
        handleCancelEdit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isSubmitting, importList.length, isSupplierModalOpen]);

  /**
   * Phase 5b/8 — Sinh mã phiếu nhập tự động theo format `PN-YYYYMMDD-XXX`.
   * XXX = số thứ tự trong ngày (đếm phiếu cùng prefix từ server + 1).
   * Lấy ngày từ `importDate` (ngày người dùng chọn) thay vì `new Date()`.
   */
  const generateReceiptCode = async (): Promise<string> => {
    const d = new Date(importDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const prefix = `PN-${yyyy}${mm}${dd}-`;
    try {
      const count = await supabaseService.getImportReceiptCountByDate(`${yyyy}-${mm}-${dd}`);
      return `${prefix}${String((count || 0) + 1).padStart(3, '0')}`;
    } catch (err) {

      return `${prefix}001`;
    }
  };

  const getImportStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <StatusBadge label="Lưu tạm" type="default" size="sm" />;
      case 'completed':
      default:
        return <StatusBadge label="Hoàn thành" type="success" size="sm" />;
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN');
  const formatTime = (date: string) => new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  // V2 DataGrid helpers
  const [v2SortConfig, setV2SortConfig] = useState<{ key: string; direction: SortDirection } | null>(null);

  const handleDataGridSort = (key: string, direction: SortDirection) => {
    setV2SortConfig(direction === 'none' ? null : { key, direction });
  };

  const handleV2Search = (value: string) => {
    setKeyword(value);
  };

  const [selectedReceiptIds, setSelectedReceiptIds] = useState<Set<string>>(new Set());
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);

  const [filters, setFilters] = useState<FilterState>({});
  const [keyword, setKeyword] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Phân trang phiếu nhập server-side
  const [pageSize] = useState(7);
  const [currentImportPage, setCurrentImportPage] = useState(1);
  const [receiptList, setReceiptList] = useState<ImportReceipt[]>([]);
  const [totalReceiptCount, setTotalReceiptCount] = useState(0);
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(false);
  const debouncedKeyword = useDebounce(keyword, 300);

  // Phase 6 — fetch stats from server-side RPC (global, filtered by date range)
  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const stats = await supabaseService.getImportStats(
        filters.dateFrom || '',
        filters.dateTo || ''
      );
      const totalValue = stats.totalCost + stats.totalShipping;
      const paidPercent = totalValue > 0
        ? ((stats.totalPaid / totalValue) * 100).toFixed(1)
        : '0';
      setLocalImportStats({
        totalReceipts: stats.totalCount,
        totalCost: stats.totalCost,
        totalShipping: stats.totalShipping,
        totalPaid: stats.totalPaid,
        totalDebt: stats.totalDebt,
        paidPercent,
      });
    } catch (error) {

    } finally {
      setIsLoadingStats(false);
    }
  }, [filters.dateFrom, filters.dateTo]);

  // Phase 1a — fallback page stats computed from the current server-side receipt list
  useEffect(() => {
    setIsLoadingStats(true);
    const totalCost = receiptList.reduce((sum, r) => sum + r.totalCost, 0);
    const shipping = receiptList.reduce((sum, r) => sum + (r.shippingCost || 0), 0);
    const paid = receiptList.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
    const debt = receiptList.reduce((sum, r) => sum + (r.debtRecorded || 0), 0);
    const paidPercent = totalCost + shipping > 0
      ? ((paid / (totalCost + shipping)) * 100).toFixed(1)
      : '0';
    setLocalImportStats({
      totalReceipts: totalReceiptCount,
      totalCost,
      totalShipping: shipping,
      totalPaid: paid,
      totalDebt: debt,
      paidPercent,
    });
    setIsLoadingStats(false);
  }, [receiptList, totalReceiptCount]);

  // Phase 1 — prefetch suppliers / products needed by current receipt list and viewing receipt
  useEffect(() => {
    const supplierIds = Array.from(new Set(receiptList.map(r => r.supplierId).filter((id): id is string => !!id)));
    const missingSupplierIds = supplierIds.filter(id => !supplierCache.has(id));
    if (missingSupplierIds.length > 0) {
      Promise.all(missingSupplierIds.map(id => supabaseService.getSupplierById(id)))
        .then(suppliers => {
          setSupplierCache(prev => {
            const next = new Map(prev);
            suppliers.forEach(s => { if (s) next.set(s.id, s); });
            return next;
          });
        })
        .catch(() => {});
    }
    const productIds = Array.from(new Set(receiptList.flatMap(r => (r.items || []).map(it => it.productId)).filter((id): id is string => !!id)));
    const missingProductIds = productIds.filter(id => !productCache.has(id));
    if (missingProductIds.length > 0) {
      Promise.all(missingProductIds.map(id => supabaseService.getProductById(id)))
        .then(products => {
          setProductCache(prev => {
            const next = new Map(prev);
            products.forEach(p => { if (p) next.set(p.id, p); });
            return next;
          });
        })
        .catch(() => {});
    }
  }, [receiptList, supplierCache, productCache]);

  useEffect(() => {
    if (!viewingReceipt) return;
    const supplierId = viewingReceipt.supplierId;
    const productIds = Array.from(new Set((viewingReceipt.items || []).map(it => it.productId).filter((id): id is string => !!id)));
    const tasks: Promise<void>[] = [];
    if (supplierId && !supplierCache.has(supplierId)) {
      tasks.push(
        supabaseService.getSupplierById(supplierId).then(s => {
          if (s) setSupplierCache(prev => new Map(prev).set(s.id, s));
        }).catch(() => {})
      );
    }
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
  }, [viewingReceipt, supplierCache, productCache]);


  const addToImportList = (product: Product) => {
    // Đảm bảo product được chọn từ dropdown nằm trong cache để table lookup.
    setProductCache(prev => {
      if (!prev.has(product.id)) return new Map(prev).set(product.id, product);
      return prev;
    });
    // Nếu SP đã có trong danh sách → tăng SL lên 1 thay vì thêm dòng trùng.
    setImportList(prev => {
      const existingIdx = prev.findIndex(it => it.productId === product.id);
      if (existingIdx !== -1) {
        return prev.map((it, i) =>
          i === existingIdx ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          code: product.code,
          unit: product.unit,
          quantity: 1,
          cost: product.cost || 0,
          discount: 0,
          lotCode: '',
          expiryDate: '',
        },
      ];
    });
  };

  const updateItem = (index: number, field: keyof ImportItemInput, value: any) => {
    setImportList(prev => prev.map((item, idx) => 
      idx === index ? { ...item, [field]: value } : item
    ));
  };

  // Patch-style updater dùng cho item rows.
  // Cho phép cập nhật nhiều field cùng lúc trong 1 lần render.
  const patchItem = (index: number, patch: Partial<ImportItemInput>) => {
    setImportList(prev => prev.map((item, idx) =>
      idx === index ? { ...item, ...patch } : item
    ));
  };

  const removeItem = (index: number) => {
    setImportList(prev => prev.filter((_, idx) => idx !== index));
  };

  const resetForm = () => {
    setImportList([]);
    setShippingCost('');
    setAmountPaid('');
    setInvoiceNumber('');
    setReceiptCode('');
    setDiscountTotal('');
    setNote('');
    setPaidTouched(false);
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setImportDate(now.toISOString().slice(0, 16));
    setEditingId(null);
    setSelectedSupplier(''); // Mặc định không chọn sẵn NCC — user tự chọn.
  };

  const handleImportOrUpdate = async () => {
    if (importList.length === 0) return;
    let status: 'draft' | 'completed' = 'completed';
    if (editingId) {
      try {
        const receipt = await supabaseService.getImportReceiptById(editingId);
        status = receipt?.status === 'draft' ? 'draft' : 'completed';
      } catch (err) {

      }
    }
    await submitReceipt(status);
  };

  /**
   * Phase 8 — Submit phiếu nhập theo trạng thái 'draft' hoặc 'completed'.
   *
   * Hiện tại signature của onImport / onUpdateImport ở App.tsx CHƯA hỗ trợ
   * status / discountTotal / note → ở Phase 8a tôi chỉ wire UI và gọi đúng
   * hàm cũ. Phase 8b sẽ mở rộng signature ở App.tsx + service để truyền các
   * field mới và xử lý nhánh draft (không cập nhật tồn kho).
   */
  const submitReceipt = async (status: 'draft' | 'completed') => {
    if (importList.length === 0) {
      alert('Vui lòng thêm ít nhất 1 sản phẩm trước khi lưu phiếu.');
      return;
    }
    if (!selectedSupplier) {
      alert('Vui lòng chọn nhà cung cấp.');
      return;
    }

    // Kiểm tra tính hợp lệ của Số lô/HSD đối với sản phẩm có quản lý lô
    const productIds = Array.from(new Set(importList.map(it => it.productId).filter((id): id is string => !!id)));
    const missingProductIds = productIds.filter(id => !productCache.has(id));
    if (missingProductIds.length > 0) {
      try {
        const products = await supabaseService.getProductsByIds(missingProductIds);
        setProductCache(prev => {
          const next = new Map(prev);
          products.forEach(p => next.set(p.id, p));
          return next;
        });
      } catch (err) {

      }
    }
    for (const item of importList) {
      const prod = productCache.get(item.productId);
      if (prod?.hasBatches) {
        if (!item.lotCode || !item.lotCode.trim()) {
          alert(`Sản phẩm "${item.name}" bật quản lý theo lô, bắt buộc phải nhập Số lô!`);
          return;
        }
        if (!item.expiryDate || !item.expiryDate.trim()) {
          alert(`Sản phẩm "${item.name}" bật quản lý theo lô, bắt buộc phải nhập Hạn sử dụng!`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      // Tự sinh mã phiếu nếu user để trống
      const finalCode = receiptCode.trim() || await generateReceiptCode();

      const paid = Number(amountPaid) || 0;
      const ship = Number(shippingCost) || 0;
      const disc = Number(discountTotal) || 0;
      const goods = totalGoodsAfterLineDiscount;
      const needToPay = Math.max(0, goods + ship - disc);
      const debtDelta = needToPay - paid; // có thể âm (trừ công nợ) hoặc dương (ghi nợ)
      const supplier = await ensureSupplier(selectedSupplier);
      const supplierName = supplier?.name || 'N/A';

      if (editingId && onUpdateImport) {
        const updatedReceipt: ImportReceipt = {
          id: editingId,
          date: new Date(importDate).toISOString(),
          invoiceNumber: invoiceNumber,
          supplierId: selectedSupplier,
          supplierName,
          items: importList,
          totalCost: goods,
          shippingCost: ship,
          discountTotal: disc,
          paidAmount: paid,
          debtRecorded: debtDelta,
          note: note,
          status,
        };
        await onUpdateImport(updatedReceipt);
        alert(status === 'draft' ? 'Đã lưu tạm phiếu nhập.' : 'Cập nhật phiếu nhập thành công!');
      } else {
        // Phase 10: onImport đã nhận status/discount/note → draft round-trip end-to-end.
        await onImport(
          importList,
          selectedSupplier,
          goods,
          paid,
          invoiceNumber,
          new Date(importDate).toISOString(),
          ship,
          status,
          disc,
          note,
          finalCode
        );
        // App.tsx hiển thị alert phù hợp cho draft/completed.
      }

      resetForm();
      navigate('/import');
      setViewingReceipt(null);
      await fetchReceipts(currentImportPage);
      await fetchStats();
    } catch (err) {

      alert('Có lỗi xảy ra khi lưu phiếu nhập. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = async (receipt: ImportReceipt) => {
    try {
      const fullReceipt = await supabaseService.getImportReceiptById(receipt.id);
      if (!fullReceipt) return;
      const productIds = Array.from(new Set((fullReceipt.items || []).map(it => it.productId).filter((id): id is string => typeof id === 'string'))) as string[];
      if (productIds.length > 0) {
        const missingProductIds = productIds.filter(id => !productCache.has(id));
        if (missingProductIds.length > 0) {
          const products = await supabaseService.getProductsByIds(missingProductIds);
          setProductCache(prev => {
            const next = new Map(prev);
            products.forEach(p => { if (p) next.set(p.id, p); });
            return next;
          });
        }
      }
      setEditingId(fullReceipt.id);
      setSelectedSupplier(fullReceipt.supplierId || '');
      setImportList((fullReceipt.items || []).map(item => ({...item})));
      setShippingCost(fullReceipt.shippingCost || '');
      setAmountPaid(fullReceipt.paidAmount || 0);
      setPaidTouched(true);
      setInvoiceNumber(fullReceipt.invoiceNumber || '');
      setReceiptCode(fullReceipt.id);
      const d = new Date(fullReceipt.date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setImportDate(d.toISOString().slice(0, 16));
      setViewingReceipt(null);
      navigate('/import/create');
    } catch (err) {

      alert('Không thể tải chi tiết phiếu nhập. Vui lòng thử lại.');
    }
  };

  const handleViewDetail = async (receipt: ImportReceipt) => {
    try {
      const fullReceipt = await supabaseService.getImportReceiptById(receipt.id);
      if (!fullReceipt) return;
      const productIds = Array.from(new Set((fullReceipt.items || []).map(it => it.productId).filter((id): id is string => typeof id === 'string'))) as string[];
      if (productIds.length > 0) {
        const missingProductIds = productIds.filter(id => !productCache.has(id));
        if (missingProductIds.length > 0) {
          const products = await supabaseService.getProductsByIds(missingProductIds);
          setProductCache(prev => {
            const next = new Map(prev);
            products.forEach(p => { if (p) next.set(p.id, p); });
            return next;
          });
        }
      }
      setViewingReceipt(fullReceipt);
    } catch (err) {

      alert('Không thể tải chi tiết phiếu nhập. Vui lòng thử lại.');
    }
  };

  const handleCancelEdit = () => {
    resetForm();
    navigate('/import');
  };

  const handleDeleteClick = async (id: string) => {
    if (onDeleteImport) {
      await onDeleteImport(id);
      await fetchReceipts(currentImportPage);
      await fetchStats();
      setViewingReceipt(null);
    }
  }

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `S${Date.now()}`;

    try {
      // Fetch full supplier list from server to ensure code uniqueness
      // (the suppliers prop may be empty and localSuppliers might be stale).
      const allSuppliers = await supabaseService.getSuppliers();
      const nccCodes = allSuppliers
        .map((s: any) => s.code)
        .filter(code => code && code.startsWith('NCC'))
        .map(code => {
          const numPart = code.replace('NCC', '');
          return parseInt(numPart, 10);
        })
        .filter(num => !isNaN(num));
      const maxNum = nccCodes.length > 0 ? Math.max(...nccCodes) : 0;
      const finalCode = `NCC${(maxNum + 1).toString().padStart(6, '0')}`;

      const newSupplier: Supplier = {
        id: newId,
        name: newSupplierData.name,
        phone: newSupplierData.phone,
        address: newSupplierData.address,
        code: finalCode,
        debt: 0
      };

      // Notify parent (App.tsx) but do not depend on it for local state.
      await onAddSupplier(newSupplier);

      // Verify the supplier was actually created before updating local state,
      // because App.tsx's handler catches errors internally and does not rethrow.
      const created = await supabaseService.getSupplierById(newId);
      if (!created) {
        throw new AppError('Supplier creation could not be verified', 'SUPPLIER_CREATION_FAILED');
      }

      setLocalSuppliers(prev => {
        const merged = new Map(prev.map(s => [s.id, s]));
        allSuppliers.forEach(s => merged.set(s.id, s));
        merged.set(newId, created);
        return Array.from(merged.values());
      });
      setSupplierCache(prev => {
        const next = new Map(prev);
        allSuppliers.forEach(s => next.set(s.id, s));
        next.set(newId, created);
        return next;
      });
      setSelectedSupplier(newId);
      setIsSupplierModalOpen(false);
      setNewSupplierData({ name: '', phone: '', address: '', contactPerson: '' });
    } catch (error) {

      alert('Có lỗi xảy ra khi tạo nhà cung cấp. Vui lòng thử lại.');
    }
  };

  const handleSelectReceipt = (id: string) => {
    const newSelected = new Set(selectedReceiptIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedReceiptIds(newSelected);
    setIsSelectAllChecked(false);
  };

  const handleSelectAll = () => {
    if (isSelectAllChecked) {
      setSelectedReceiptIds(new Set());
      setIsSelectAllChecked(false);
    } else {
      setSelectedReceiptIds(new Set(filteredReceipts.map(r => r.id)));
      setIsSelectAllChecked(true);
    }
  };

  const handleClearSelection = () => {
    setSelectedReceiptIds(new Set());
    setIsSelectAllChecked(false);
  };

  // Server-side fetch for import receipts
  const fetchReceipts = useCallback(async (page: number) => {
    setIsLoadingReceipts(true);
    try {
      const { receipts, totalCount } = await supabaseService.filterImportReceiptsPaginated(
        page,
        pageSize,
        debouncedKeyword,
        {
          fromDate: filters.dateFrom || undefined,
          toDate: filters.dateTo || undefined,
          supplierId: filters.createdBy || undefined,
          status: filters.status || undefined
        }
      );
      setReceiptList(receipts);
      setTotalReceiptCount(totalCount);
    } catch (error) {

      alert('Lỗi tải danh sách phiếu nhập');
    } finally {
      setIsLoadingReceipts(false);
    }
  }, [pageSize, debouncedKeyword, filters.dateFrom, filters.dateTo, filters.createdBy, filters.status]);

  useEffect(() => {
    fetchReceipts(currentImportPage);
  }, [currentImportPage, pageSize, debouncedKeyword, filters.dateFrom, filters.dateTo, filters.createdBy, filters.status, fetchReceipts]);

  // Bộ lọc còn lại (variance) áp dụng client-side trên trang hiện tại
  const filteredReceipts = useMemo(() => {
    let result = receiptList;
    if (filters.variance) result = result.filter(r => (r as any).variance === filters.variance);
    return result;
  }, [receiptList, filters.variance]);

  // useMemo chỉ recompute danh sách lọc; áp dụng filter là tức thời nên handler này là no-op (giữ để khớp props panel).
  const handleApplyFilters = () => {};

  const handleResetFilters = () => {
    setFilters({});
    setKeyword('');
    handleClearSelection();
  };

  const handleDeleteSelected = () => {
    if (selectedReceiptIds.size === 0) return;
    if (!confirm(`Xóa ${selectedReceiptIds.size} phiếu? Hành động này không thể hoàn tác.`)) return;
    selectedReceiptIds.forEach(id => handleDeleteClick(id));
    handleClearSelection();
  };

  const handlePrintSelected = () => {
    if (selectedReceiptIds.size === 0) return;
    alert(`In ${selectedReceiptIds.size} phiếu - Tính năng sẽ được hoàn thiện`);
  };

  const handleExportData = () => {
    if (selectedReceiptIds.size === 0) return;
    alert(`Xuất ${selectedReceiptIds.size} phiếu - Tính năng sẽ được hoàn thiện`);
  };


  // Sắp xếp theo ngày: 'newest' = mới nhất lên đầu, 'oldest' = cũ nhất lên đầu.
  // V2 DataGrid sort được ưu tiên khi active.
  const sortedReceipts = useMemo(() => {
    let arr = filteredReceipts.slice();
    if (v2SortConfig && v2SortConfig.direction !== 'none') {
      const { key, direction } = v2SortConfig;
      const dir = direction === 'asc' ? 1 : -1;
      arr.sort((a, b) => {
        let aVal: any;
        let bVal: any;
        switch (key) {
          case 'id':
            aVal = a.id || ''; bVal = b.id || ''; break;
          case 'supplierName':
            aVal = a.supplierName || ''; bVal = b.supplierName || ''; break;
          case 'date':
            aVal = new Date(a.date).getTime(); bVal = new Date(b.date).getTime(); break;
          case 'totalAmount':
            aVal = a.totalCost + (a.shippingCost || 0); bVal = b.totalCost + (b.shippingCost || 0); break;
          case 'debt':
            aVal = a.debtRecorded || 0; bVal = b.debtRecorded || 0; break;
          case 'itemsCount':
            aVal = (a.items || []).length; bVal = (b.items || []).length; break;
          case 'invoiceNumber':
            aVal = a.invoiceNumber || ''; bVal = b.invoiceNumber || ''; break;
          default:
            return 0;
        }
        if (aVal < bVal) return -1 * dir;
        if (aVal > bVal) return 1 * dir;
        return 0;
      });
    } else {
      arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (sortOrder === 'oldest') arr.reverse();
    }
    return arr;
  }, [filteredReceipts, sortOrder, v2SortConfig]);
  const totalImportPages = Math.max(1, Math.ceil(totalReceiptCount / pageSize));
  const safeCurrentPage = Math.min(currentImportPage, totalImportPages);
  const importStartIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedReceipts = sortedReceipts;

  // Reset về trang 1 khi điều kiện lọc / sắp xếp thay đổi
  useEffect(() => {
    setCurrentImportPage(1);
  }, [filters, keyword, sortOrder]);

  // Nếu trang hiện tại vượt quá tổng trang (sau khi xóa), kéo về trang cuối
  useEffect(() => {
    if (currentImportPage > totalImportPages) {
      setCurrentImportPage(totalImportPages);
    }
  }, [totalImportPages, currentImportPage]);

  // Helper sinh dãy số trang có ellipsis
  const getImportPageNumbers = (): (number | 'ellipsis')[] => {
    const total = totalImportPages;
    const current = safeCurrentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    const left = Math.max(2, current - 1);
    const right = Math.min(total - 1, current + 1);
    if (left > 2) pages.push('ellipsis');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total - 1) pages.push('ellipsis');
    pages.push(total);
    return pages;
  };

  const importReceiptColumns: DataGridColumn<ImportReceipt>[] = [
    {
      key: 'stt',
      label: 'STT',
      align: 'center',
      width: '48px',
      render: (_, index) => importStartIndex + index + 1,
    },
    {
      key: 'id',
      label: 'Mã phiếu',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
            <ArrowDownToLine className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-slate-900 font-semibold text-sm hover:underline">
            {r.id}
          </span>
        </div>
      ),
    },
    {
      key: 'supplierName',
      label: 'Nhà cung cấp',
      sortable: true,
      render: (r) => (
        <span className="text-sm font-medium text-slate-700">
          {r.supplierName}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Ngày nhập',
      sortable: true,
      render: (r) => (
        <div>
          <p className="text-sm text-slate-500">{formatDate(r.date)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{formatTime(r.date)}</p>
        </div>
      ),
    },
    {
      key: 'invoiceNumber',
      label: 'Số HĐ NCC',
      sortable: true,
      render: (r) => (
        <span className="text-sm text-slate-500">{r.invoiceNumber || '—'}</span>
      ),
    },
    {
      key: 'itemsCount',
      label: 'SL mặt hàng',
      sortable: true,
      align: 'center',
      render: (r) => (
        <span className="text-sm text-slate-500 text-center">{(r.items || []).length}</span>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Tổng tiền',
      sortable: true,
      align: 'right',
      render: (r) => {
        const totalAmount = r.totalCost + (r.shippingCost || 0);
        return (
          <span className={`text-sm font-semibold ${totalAmount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {totalAmount.toLocaleString('vi-VN')} ₫
          </span>
        );
      },
    },
    {
      key: 'debt',
      label: 'Công nợ',
      sortable: true,
      align: 'right',
      render: (r) => {
        const debt = r.debtRecorded || 0;
        return (
          <span className={`text-sm font-semibold ${debt > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {debt.toLocaleString('vi-VN')} ₫
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Trạng thái',
      align: 'center',
      render: (r) => getImportStatusBadge(r.status || ''),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'right',
      render: (r) => (
        <div className="inline-flex items-center gap-1">
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
          {permissions.canDeleteRecord && r.status === 'draft' && (
            <ActionButton
              variant="ghost"
              size="sm"
              icon={<Edit className="w-4 h-4" />}
              onClick={(e) => {
                e?.stopPropagation();
                handleEditClick(r);
              }}
              aria-label="Mở lại / Sửa"
            />
          )}
          {permissions.canDeleteRecord && (
          <ActionButton
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={(e) => {
              e?.stopPropagation();
              handleDeleteClick(r.id);
            }}
            aria-label="Xóa"
          />
          )}
        </div>
      ),
    },
  ];

  return (
    <PageLayout>
      {/* Page Header — chỉ hiển thị ở tab history. */}
      {activeTab === 'history' && (<>
      <div className="page-header items-start">
        <div className="flex items-center gap-3">
          <span className="inv-title-icon">
            <Package className="w-4 h-4" />
          </span>
          <div>
            <h2 className="page-title">{viewingReceipt ? 'Chi tiết phiếu nhập' : 'Phiếu nhập hàng'}</h2>
            <p className="page-subtitle">Quản lý các phiếu nhập hàng</p>
          </div>
        </div>
        {activeTab === 'history' && !viewingReceipt && (
          <div className="flex flex-col flex-1 min-w-0 md:mx-4">
            <AdvancedFilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              onApplyFilters={handleApplyFilters}
              onResetFilters={handleResetFilters}
              suppliers={localSuppliers}
              resultCount={paginatedReceipts.length}
              totalCount={totalReceiptCount}
              keyword={keyword}
              onKeywordChange={handleV2Search}
            />
          </div>
        )}
        {activeTab === 'history' && !viewingReceipt && permissions.canManageInventory && (
          <button onClick={() => { navigate('/import/create'); setViewingReceipt(null); resetForm(); }} className="btn-primary flex items-center gap-2 px-4 py-2.5 self-start flex-shrink-0">
            <Plus className="w-4 h-4" /> Nhập hàng
          </button>
        )}
      </div>

      {/* ===== 5 STAT CARDS — Import Goods ===== */}
      {activeTab === 'history' && !viewingReceipt && (
        <StatsRow stats={[
          { label: 'Tổng phiếu nhập', value: localImportStats.totalReceipts, subtext: 'Toàn bộ phiếu', icon: <ClipboardList />, colorScheme: 'purple' },
          { label: 'Tổng tiền hàng', value: localImportStats.totalCost.toLocaleString('vi-VN') + '₫', subtext: 'Giá trị nhập kho', icon: <Package />, colorScheme: 'blue' },
          { label: 'Phí vận chuyển', value: localImportStats.totalShipping.toLocaleString('vi-VN') + '₫', subtext: 'Tổng phí ship', icon: <FileText />, colorScheme: 'orange' },
          { label: 'Đã thanh toán', value: localImportStats.totalPaid.toLocaleString('vi-VN') + '₫', subtext: localImportStats.paidPercent + '% tổng giá trị', icon: <CheckCircle />, colorScheme: 'green' },
          { label: 'Công nợ', value: localImportStats.totalDebt.toLocaleString('vi-VN') + '₫', subtext: 'Chưa thanh toán', icon: <Wallet />, colorScheme: 'red' },
        ]} />
      )}
      </>)}

      {activeTab === 'create' ? (
        <VoucherFormLayout
          className="flex-1 min-h-0"
          title={editingId ? 'Sửa phiếu nhập' : 'Nhập hàng'}
          onBack={handleCancelEdit}
          searchValue={searchTerm}
          onSearchChange={(v) => {
            setSearchTerm(v);
            setIsSearchOpen(true);
          }}
          searchSlot={
            <VoucherProductDropdown
              mode="client"
              products={localProducts}
              searchValue={searchTerm}
              open={isSearchOpen}
              onRequestClose={() => setIsSearchOpen(false)}
              onSelectProduct={(p) => {
                addToImportList(p);
                setSearchTerm('');
                setIsSearchOpen(false);
              }}
              maxItems={8}
            />
          }
          main={
            <div className="flex flex-col h-full min-h-0 overflow-hidden">
              {importList.length === 0 ? (
                <VoucherEmpty
                  icon={<Package className="w-12 h-12 text-slate-300" />}
                  title="Chưa có sản phẩm nào trong phiếu nhập"
                  description="Tìm sản phẩm ở khung tìm kiếm phía trên và chọn để thêm vào danh sách. Bạn có thể điều chỉnh số lượng, đơn giá và giảm giá cho từng dòng."
                />
              ) : (
                <>
                  <div className="flex-1 min-h-0">
                    <VoucherTable>
                      <thead>
                        <tr>
                          <th className="text-center w-12">
                            <span className="sr-only">Xóa</span>
                          </th>
                          <th className="text-center w-12">#</th>
                          <th className="w-32">Mã hàng</th>
                          <th>Tên hàng</th>
                          <th className="text-center w-20">ĐVT</th>
                          <th className="text-center w-40">Số lô</th>
                          <th className="text-center w-36">Hạn sử dụng</th>
                          <th className="text-center w-40">Số lượng</th>
                          <th className="text-right w-32">Đơn giá</th>
                          <th className="text-right w-32">Giảm giá</th>
                          <th className="text-right w-36">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importList.map((item, idx) => {
                          const product = getProductFromCache(item.productId);
                          const lineTotal = Math.max(0, item.quantity * item.cost - (item.discount || 0));
                          const existingLots = product?.lots || [];
                          const datalistId = `ig-lots-row-${product?.id || 'x'}-${idx}`;
                          return (
                            <VoucherTableRow key={`${item.productId}-${idx}`}>
                              <td className="text-center">
                                <VoucherButton
                                  variant="danger"
                                  size="sm"
                                  icon={<X className="w-4 h-4" />}
                                  onClick={() => removeItem(idx)}
                                  title="Xóa dòng"
                                  aria-label="Xóa dòng"
                                />
                              </td>
                              <td className="text-center text-slate-500">{idx + 1}</td>
                              <td>
                                <span className="font-mono text-xs text-slate-500">{product?.code || (item as any).code || '—'}</span>
                              </td>
                              <td>
                                <span className="text-sm font-medium text-slate-900">{item.name}</span>
                              </td>
                              <td className="text-center text-slate-500">{item.unit || '—'}</td>
                              <td>
                                {product?.hasBatches ? (
                                  <>
                                    <VoucherInput
                                      list={datalistId}
                                      type="text"
                                      value={item.lotCode || ''}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        const matched = existingLots.find((l) => l.code === v);
                                        if (matched && matched.expiryDate) {
                                          patchItem(idx, { lotCode: v, expiryDate: matched.expiryDate });
                                        } else {
                                          patchItem(idx, { lotCode: v });
                                        }
                                      }}
                                      placeholder="Nhập số lô"
                                      size="sm"
                                      fullWidth
                                    />
                                    {existingLots.length > 0 && (
                                      <datalist id={datalistId}>
                                        {existingLots.map((l) => (
                                          <option key={l.id} value={l.code}>
                                            {l.expiryDate ? `${l.code} (${l.expiryDate})` : l.code}
                                          </option>
                                        ))}
                                      </datalist>
                                    )}
                                  </>
                                ) : (
                                  <VoucherInput
                                    type="text"
                                    value=""
                                    disabled
                                    placeholder="Không dùng lô"
                                    size="sm"
                                    fullWidth
                                  />
                                )}
                              </td>
                              <td>
                                {product?.hasBatches ? (
                                  <VoucherInput
                                    type="text"
                                    value={item.expiryDate || ''}
                                    onChange={(e) => patchItem(idx, { expiryDate: e.target.value })}
                                    placeholder="YYYY-MM-DD"
                                    size="sm"
                                    fullWidth
                                  />
                                ) : (
                                  <VoucherInput
                                    type="text"
                                    value=""
                                    disabled
                                    placeholder="N/A"
                                    size="sm"
                                    fullWidth
                                  />
                                )}
                              </td>
                              <td>
                                <div className="flex items-center justify-center gap-1">
                                  <VoucherButton
                                    variant="ghost"
                                    size="sm"
                                    icon={<Minus className="w-4 h-4" />}
                                    onClick={() => patchItem(idx, { quantity: Math.max(1, item.quantity - 1) })}
                                    disabled={item.quantity <= 1}
                                    title="Giảm"
                                    aria-label="Giảm số lượng"
                                  />
                                  <VoucherInput
                                    type="text"
                                    inputMode="numeric"
                                    value={formatQty(item.quantity)}
                                    onChange={(e) => {
                                      const qty = Math.max(1, parseQty(e.target.value) || 1);
                                      patchItem(idx, { quantity: qty });
                                    }}
                                    size="sm"
                                    className="w-16"
                                    style={{ textAlign: 'center' }}
                                    aria-label="Số lượng"
                                  />
                                  <VoucherButton
                                    variant="ghost"
                                    size="sm"
                                    icon={<Plus className="w-4 h-4" />}
                                    onClick={() => patchItem(idx, { quantity: item.quantity + 1 })}
                                    title="Tăng"
                                    aria-label="Tăng số lượng"
                                  />
                                </div>
                              </td>
                              <td>
                                <VoucherInput
                                  type="number"
                                  min={0}
                                  value={item.cost}
                                  onChange={(e) => patchItem(idx, { cost: Math.max(0, Number(e.target.value) || 0) })}
                                  size="sm"
                                  className="w-24"
                                  style={{ textAlign: 'right' }}
                                  aria-label="Đơn giá (giá vốn)"
                                />
                              </td>
                              <td>
                                <VoucherInput
                                  type="number"
                                  min={0}
                                  value={item.discount || 0}
                                  onChange={(e) => patchItem(idx, { discount: Math.max(0, Number(e.target.value) || 0) })}
                                  size="sm"
                                  className="w-24"
                                  style={{ textAlign: 'right' }}
                                  aria-label="Giảm giá"
                                  placeholder="0"
                                />
                              </td>
                              <td className="text-right">
                                <span className="font-semibold font-mono text-slate-900">{lineTotal.toLocaleString('vi-VN')}</span>
                              </td>
                            </VoucherTableRow>
                          );
                        })}
                      </tbody>
                    </VoucherTable>
                  </div>
                  <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-5">
                      <span className="text-sm text-slate-500">
                        Mặt hàng: <strong className="text-slate-700 font-semibold">{importList.length}</strong>
                      </span>
                      <span className="text-sm text-slate-500">
                        Tổng SL: <strong className="text-slate-700 font-semibold">{importList.reduce((sum, it) => sum + (it.quantity || 0), 0).toLocaleString('vi-VN')}</strong>
                      </span>
                      {importList.reduce((sum, it) => sum + (it.discount || 0), 0) > 0 && (
                        <span className="text-sm text-slate-500">
                          Giảm giá dòng: <strong className="text-slate-700 font-semibold">{importList.reduce((sum, it) => sum + (it.discount || 0), 0).toLocaleString('vi-VN')} ₫</strong>
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-slate-500 font-medium">Tổng tiền hàng</span>
                      <span className="text-base font-bold text-slate-900">
                        {importList.reduce((sum, it) => sum + Math.max(0, it.quantity * it.cost - (it.discount || 0)), 0).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          }
            sidebar={
              <>
                <VoucherSection>
                  <VoucherSectionHeader
                    title="Nhà cung cấp"
                    action={selectedSupplierObj && !isPickingSupplier && (
                      <div className="flex items-center gap-1">
                        <VoucherButton
                          variant="ghost"
                          size="sm"
                          onClick={() => { setIsPickingSupplier(true); setSupplierQuery(''); }}
                          title="Thay đổi nhà cung cấp"
                        >
                          Thay đổi
                        </VoucherButton>
                        <VoucherButton
                          variant="ghost"
                          size="sm"
                          onClick={handleClearSupplier}
                          title="Xóa nhà cung cấp đã chọn"
                        >
                          Xóa
                        </VoucherButton>
                      </div>
                    )}
                  />
                  <VoucherSectionContent>
                    <div ref={supplierContainerRef}>
                      {selectedSupplierObj && !isPickingSupplier ? (
                        <div className="flex items-center justify-between gap-2 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{selectedSupplierObj.name}</p>
                            {selectedSupplierObj.phone && (
                              <p className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                                <Phone className="w-3 h-3 text-slate-400" /> {selectedSupplierObj.phone}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <VoucherButton
                              variant="danger"
                              size="sm"
                              icon={<Trash2 className="w-4 h-4" />}
                              onClick={handleClearSupplier}
                              title="Xóa nhà cung cấp đã chọn"
                              aria-label="Xóa nhà cung cấp đã chọn"
                            />
                            <VoucherButton
                              variant="ghost"
                              size="sm"
                              icon={<Plus className="w-4 h-4" />}
                              onClick={() => setIsSupplierModalOpen(true)}
                              title="Thêm NCC mới"
                              aria-label="Thêm nhà cung cấp mới"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <VoucherInput
                                type="text"
                                value={supplierQuery}
                                onChange={(e) => setSupplierQuery(e.target.value)}
                                placeholder="Tìm nhà cung cấp..."
                                autoFocus
                                prefixIcon={<Search className="w-5 h-5" />}
                                size="md"
                                fullWidth
                              />
                            </div>
                            <VoucherButton
                              variant="ghost"
                              size="sm"
                              icon={<Plus className="w-4 h-4" />}
                              onClick={() => setIsSupplierModalOpen(true)}
                              title="Thêm NCC mới"
                              aria-label="Thêm nhà cung cấp mới"
                            />
                          </div>
                          {supplierQuery.trim() && (
                            <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden">
                              {filteredSuppliers.length === 0 ? (
                                <VoucherEmpty
                                  icon={<Search className="w-6 h-6" />}
                                  title="Không tìm thấy nhà cung cấp"
                                  description="Thử tìm kiếm bằng tên, số điện thoại hoặc mã NCC khác."
                                />
                              ) : (
                                <ul className="max-h-[280px] overflow-y-auto py-1 list-none m-0">
                                  {filteredSuppliers.map((s) => {
                                    const active = s.id === selectedSupplier;
                                    return (
                                      <li key={s.id}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedSupplier(s.id);
                                            setIsPickingSupplier(false);
                                            setSupplierQuery('');
                                          }}
                                          className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left bg-transparent border-0 cursor-pointer transition-colors hover:bg-slate-50 ${active ? 'bg-slate-50' : ''}`}
                                        >
                                          <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">{s.name}</p>
                                            {s.phone && <p className="text-xs text-slate-500">{s.phone}</p>}
                                          </div>
                                          {(s.debt ?? 0) > 0 && (
                                            <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                                              {(s.debt ?? 0).toLocaleString('vi-VN')} ₫
                                            </span>
                                          )}
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {selectedSupplierObj && (
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm text-slate-500">Công nợ hiện tại</span>
                          <span className={`font-semibold font-mono ${supplierDebt > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                            {supplierDebt.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      )}
                    </div>
                  </VoucherSectionContent>
                </VoucherSection>

                <VoucherSection>
                  <VoucherSectionHeader title="Thông tin phiếu" />
                  <VoucherSectionContent>
                    <div className="flex flex-col gap-3">
                      <VoucherField label="Mã phiếu nhập">
                        <VoucherInput
                          type="text"
                          value={receiptCode}
                          onChange={(e) => setReceiptCode(e.target.value)}
                          placeholder={receiptCodePlaceholder}
                          autoComplete="off"
                          size="md"
                          fullWidth
                        />
                      </VoucherField>
                      <VoucherField label="Số hóa đơn đầu vào">
                        <VoucherInput
                          type="text"
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          placeholder="VD: HD00123"
                          autoComplete="off"
                          size="md"
                          fullWidth
                        />
                      </VoucherField>
                      <VoucherField label="Ngày giờ nhập">
                        <VoucherInput
                          type="datetime-local"
                          value={importDate}
                          onChange={(e) => setImportDate(e.target.value)}
                          size="md"
                          fullWidth
                        />
                      </VoucherField>
                    </div>
                  </VoucherSectionContent>
                </VoucherSection>

                <VoucherSection>
                  <VoucherSectionHeader title="Tổng kết tiền" />
                  <VoucherSectionContent>
                    <VoucherTotals
                      items={[
                        { label: 'Tổng tiền hàng', value: `${totalGoodsAfterLineDiscount.toLocaleString('vi-VN')} ₫` },
                        {
                          label: 'Phí vận chuyển',
                          value: (
                            <VoucherInput
                              type="number"
                              min={0}
                              value={shippingCost}
                              onChange={(e) => setShippingCost(e.target.value)}
                              placeholder="0"
                              size="sm"
                              className="w-[140px]"
                              style={{ textAlign: 'right' }}
                            />
                          ),
                        },
                        {
                          label: 'Giảm giá',
                          value: (
                            <VoucherInput
                              type="number"
                              min={0}
                              value={discountTotal}
                              onChange={(e) => setDiscountTotal(e.target.value)}
                              placeholder="0"
                              size="sm"
                              className="w-[140px]"
                              style={{ textAlign: 'right' }}
                            />
                          ),
                        },
                        { label: 'Cần trả nhà cung cấp', value: `${needToPay.toLocaleString('vi-VN')} ₫`, highlight: true },
                        {
                          label: 'Tiền trả nhà cung cấp',
                          value: (
                            <VoucherInput
                              type="number"
                              min={0}
                              value={amountPaid}
                              onChange={(e) => {
                                setPaidTouched(true);
                                setAmountPaid(e.target.value);
                              }}
                              placeholder="0"
                              size="sm"
                              className="w-[140px]"
                              style={{ textAlign: 'right' }}
                            />
                          ),
                        },
                        {
                          label: 'Tính vào công nợ',
                          value: (
                            <span className={`font-semibold ${debtDelta > 0 ? 'text-red-600' : debtDelta < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                              {debtDelta > 0
                                ? `+ ${debtDelta.toLocaleString('vi-VN')} ₫`
                                : debtDelta < 0
                                ? `Trừ ${Math.abs(debtDelta).toLocaleString('vi-VN')} ₫`
                                : 'Đã thanh toán đủ'}
                            </span>
                          ),
                        },
                      ]}
                    />
                  </VoucherSectionContent>
                </VoucherSection>

                <VoucherSection>
                  <VoucherSectionHeader title="Ghi chú" />
                  <VoucherSectionContent>
                    <VoucherField>
                      <VoucherTextarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Ghi chú nội bộ về phiếu nhập (tuỳ chọn)..."
                        rows={3}
                        fullWidth
                      />
                    </VoucherField>
                  </VoucherSectionContent>
                </VoucherSection>
              </>
            }
            actions={
              <>
                <VoucherButton
                  variant="secondary"
                  size="md"
                  fullWidth
                  loading={isSubmitting}
                  disabled={importList.length === 0 || isSubmitting || !permissions.canManageInventory}
                  icon={<Save className="w-5 h-5" />}
                  onClick={() => submitReceipt('draft')}
                  title="Lưu tạm (chưa ghi nhận tồn kho)"
                >
                  Lưu tạm
                </VoucherButton>
                <VoucherButton
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={isSubmitting}
                  disabled={importList.length === 0 || isSubmitting || !permissions.canManageInventory}
                  icon={<Check className="w-5 h-5" />}
                  onClick={() => submitReceipt('completed')}
                  title={editingId ? 'Cập nhật phiếu nhập' : 'Hoàn thành — ghi nhận tồn kho và công nợ'}
                >
                  {editingId ? 'Cập nhật' : 'Hoàn thành'}
                </VoucherButton>
              </>
            }
          />
      ) : (
        <>
          {!viewingReceipt && (
            <>
              <BatchActionsBar
                selectedCount={selectedReceiptIds.size}
                onDeleteSelected={handleDeleteSelected}
                onPrintSelected={handlePrintSelected}
                onExportData={handleExportData}
                onClearSelection={handleClearSelection}
              />
            </>
          )}

          {viewingReceipt ? (
            <div className="ig-page-container overflow-hidden">
            <div className="flex flex-col h-full">
              <div className="ig-page-detail-header">
                 <button onClick={() => setViewingReceipt(null)} className="ig-page-detail-header__back"><ArrowLeft className="w-5 h-5" /></button>
                 <h3 className="ig-page-detail-header__title">Chi tiết phiếu: {viewingReceipt.id}</h3>
                 <div className="ig-page-detail-header__actions">
                    {/* REBUILD V2: Chỉ hiển thị nút Sửa/Mở lại khi phiếu ở dạng draft */}
                    {permissions.canDeleteRecord && viewingReceipt.status === 'draft' && (
                      <button onClick={() => handleEditClick(viewingReceipt)} className="btn-primary flex items-center gap-2 px-4 py-2"><Edit className="w-4 h-4" /> Sửa</button>
                    )}
                    {permissions.canDeleteRecord && (
                    <button onClick={() => handleDeleteClick(viewingReceipt.id)} className="flex items-center gap-2 px-4 py-2 btn-danger"><Trash2 className="w-4 h-4" /> Xoá</button>
                    )}
                 </div>
              </div>
              <div className="ig-page-detail-body">
                {/* SIDEBAR CHI TIẾT (30%) */}
                <div className="ig-page-detail-sidebar">
                  {/* Card Nhà Cung Cấp */}
                  <div className="ig-page-detail-card ig-page-detail-card--purple">
                    <p className="ig-page-detail-card__label">Nhà cung cấp</p>
                    <p className="ig-page-detail-card__value">
                      <User className="w-4 h-4 ig-page-detail-card__value-icon" />
                      {viewingReceipt.supplierName || 'Chưa rõ nhà cung cấp'}
                    </p>
                    {getSupplierFromCache(viewingReceipt.supplierId)?.phone && (
                      <p className="ig-page-detail-card__meta">
                        <span>SĐT:</span>
                        <strong>{getSupplierFromCache(viewingReceipt.supplierId)?.phone}</strong>
                      </p>
                    )}
                    {getSupplierFromCache(viewingReceipt.supplierId)?.address && (
                      <p className="ig-page-detail-card__meta">
                        <span>Đ/c:</span>
                        <strong className="truncate">{getSupplierFromCache(viewingReceipt.supplierId)?.address}</strong>
                      </p>
                    )}
                  </div>

                  {/* Card Thông tin Phiếu */}
                  <div className="ig-page-detail-card">
                    <p className="ig-page-detail-card__info-label">Thông tin phiếu</p>
                    
                    <div className="ig-page-detail-card__info-row">
                      <span className="ig-page-detail-card__info-item-label">Mã phiếu:</span>
                      <span className="ig-page-detail-card__info-item-value">{viewingReceipt.id}</span>
                    </div>

                    <div className="ig-page-detail-card__info-row">
                      <span className="ig-page-detail-card__info-item-label">Số hóa đơn NCC:</span>
                      <span className="ig-page-detail-card__info-item-value vsp-font-mono">{viewingReceipt.invoiceNumber || '—'}</span>
                    </div>

                    <div className="ig-page-detail-card__info-row">
                      <span className="ig-page-detail-card__info-item-label">Ngày nhập:</span>
                      <span className="ig-page-detail-card__info-item-value">
                        {new Date(viewingReceipt.date).toLocaleDateString('vi-VN')} {new Date(viewingReceipt.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {viewingReceipt.note && (
                      <div className="ig-page-detail-card__divider">
                        <span className="ig-page-detail-card__info-item-label ig-page-detail-card__note-label">Ghi chú nội bộ:</span>
                        <p className="ig-page-detail-card__note">{viewingReceipt.note}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Tổng kết Tài chính */}
                  <div className="ig-page-summary-card">
                    <p className="ig-page-summary-card__title">Tóm tắt tài chính</p>
                    
                    <div className="space-y-2">
                      <div className="ig-page-summary-card__row">
                        <span>Tiền hàng:</span>
                        <span className="ig-page-summary-card__value">{viewingReceipt.totalCost.toLocaleString('vi-VN')} ₫</span>
                      </div>

                      <div className="ig-page-summary-card__row">
                        <span>Phí vận chuyển (+):</span>
                        <span className="ig-page-summary-card__value">{(viewingReceipt.shippingCost || 0).toLocaleString('vi-VN')} ₫</span>
                      </div>

                      {viewingReceipt.discountTotal ? (
                        <div className="ig-page-summary-card__row ig-page-summary-card__discount">
                          <span>Giảm giá (-):</span>
                          <span className="ig-page-summary-card__value">{(viewingReceipt.discountTotal).toLocaleString('vi-VN')} ₫</span>
                        </div>
                      ) : null}

                      <div className="ig-page-summary-card__divider"></div>

                      <div className="ig-page-summary-card__row ig-page-summary-card__row--highlight">
                        <span className="ig-page-summary-card__label">Tổng cần thanh toán:</span>
                        <strong>
                          {(viewingReceipt.totalCost + (viewingReceipt.shippingCost || 0) - (viewingReceipt.discountTotal || 0)).toLocaleString('vi-VN')} ₫
                        </strong>
                      </div>

                      <div className="ig-page-summary-card__row">
                        <span>Thực tế đã trả:</span>
                        <span className="ig-page-summary-card__paid">{(viewingReceipt.paidAmount || 0).toLocaleString('vi-VN')} ₫</span>
                      </div>

                      <div className="ig-page-summary-card__row ig-page-summary-card__row--debt">
                        <span>Công nợ:</span>
                        {viewingReceipt.debtRecorded && viewingReceipt.debtRecorded > 0 ? (
                          <span className="ig-page-summary-card__debt-badge ig-page-summary-card__debt-badge--owe">
                            Nợ NCC: {viewingReceipt.debtRecorded.toLocaleString('vi-VN')} ₫
                          </span>
                        ) : viewingReceipt.debtRecorded && viewingReceipt.debtRecorded < 0 ? (
                          <span className="ig-page-summary-card__debt-badge ig-page-summary-card__debt-badge--prepaid">
                            Trừ nợ: {Math.abs(viewingReceipt.debtRecorded).toLocaleString('vi-VN')} ₫
                          </span>
                        ) : (
                          <span className="ig-page-summary-card__debt-badge ig-page-summary-card__debt-badge--prepaid">
                            Đã trả đủ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BẢNG SẢN PHẨM (70%) */}
                <div className="ig-page-products">
                  <h4 className="ig-page-products__title">
                    <Package className="w-5 h-5 ig-page-products__title-icon" />
                    <span>Sản phẩm đã nhập ({ (viewingReceipt.items || []).length })</span>
                  </h4>

                  <div className="ig-page-products__table-wrap">
                    <table className="ig-table-detail w-full text-left">
                      <thead>
                        <tr>
                          <th className="col-num text-center">#</th>
                          <th>Sản phẩm</th>
                          <th className="col-lot text-center">Số Lô / Hạn dùng</th>
                          <th className="col-qty text-center">SL</th>
                          <th className="col-price text-right">Giá nhập</th>
                          {viewingReceipt.items?.some(it => it.discount && it.discount > 0) ? (
                            <th className="col-discount text-right">Giảm giá</th>
                          ) : null}
                          <th className="col-total text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(viewingReceipt.items || []).map((item, idx) => {
                          const itemTotal = item.quantity * item.cost - (item.discount || 0);
                          return (
                            <tr key={idx}>
                              <td className="text-center">{idx + 1}</td>
                              <td>
                                <div className="flex flex-col">
                                  <span className="product-name">{item.name || item.productName}</span>
                                  {item.productId && (
                                    <span className="product-code">{item.productId}</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                {item.lotCode ? (
                                  <div className="flex flex-col items-center gap-0.5 justify-center">
                                    <span className="lot-badge">
                                      {item.lotCode}
                                    </span>
                                    {item.expiryDate && (
                                      <span className="lot-expiry">
                                        HSD: {item.expiryDate}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center">—</div>
                                )}
                              </td>
                              <td className="text-center">{item.quantity}</td>
                              <td className="text-right">{item.cost.toLocaleString('vi-VN')} ₫</td>
                              {viewingReceipt.items?.some(it => it.discount && it.discount > 0) ? (
                                <td className="ig-page-products__discount">
                                  {item.discount ? `${item.discount.toLocaleString('vi-VN')} ₫` : '—'}
                                </td>
                              ) : null}
                              <td className="text-right">
                                {itemTotal.toLocaleString('vi-VN')} ₫
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
            </div>
          ) : (
            <DataGridBox innerRef={dataGridBoxRef}>
            {useNewDataGridImportGoods ? (
              <DataGrid
                className="flex-1 min-h-0"
                embedded
                data={paginatedReceipts}
                columns={importReceiptColumns}
                keyExtractor={(r) => r.id || ''}
                loading={isLoadingReceipts && paginatedReceipts.length === 0}
                selectedRows={Array.from(selectedReceiptIds)}
                onSelectionChange={(ids) => {
                  setSelectedReceiptIds(new Set(ids as string[]));
                  setIsSelectAllChecked(false);
                }}
                onRowClick={(r) => handleViewDetail(r)}
                sortKey={v2SortConfig?.key}
                sortDirection={v2SortConfig?.direction || 'none'}
                onSortChange={handleDataGridSort}
                pagination={{
                  currentPage: safeCurrentPage,
                  totalPages: totalImportPages,
                  totalCount: totalReceiptCount,
                  pageSize: pageSize,
                  onPageChange: (page) => setCurrentImportPage(page),
                  showInfo: false,
                }}
                emptyTitle="Chưa có phiếu nhập nào"
                emptyDescription="Tạo phiếu nhập mới để bắt đầu."
                emptyAction={
                  permissions.canManageInventory ? (
                  <ActionButton
                    variant="primary"
                    size="md"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => { navigate('/import/create'); setViewingReceipt(null); resetForm(); }}
                  >
                    Nhập hàng
                  </ActionButton>
                  ) : undefined
                }
              />
            ) : (
              <>
                {/* ===== KHU VỰC 2: Data Table (overflow-x-auto -mx-6) ===== */}
                <div className="flex-1 min-h-0 overflow-x-auto -mx-6">
                  <table className="min-w-full align-middle px-6 divide-y divide-slate-100 hidden md:table">
                    <thead>
                      <tr>
                        <th scope="col" className="w-12 h-[52px] pl-5">
                          <input
                            type="checkbox"
                            checked={isSelectAllChecked}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                        </th>
                        <th className="h-[52px] px-5 text-left text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px] hover:text-slate-900 cursor-pointer transition-colors">
                          Mã phiếu
                        </th>
                        <th className="h-[52px] px-5 text-left text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px] hover:text-slate-900 cursor-pointer transition-colors">
                          Nhà cung cấp
                        </th>
                        <th className="h-[52px] px-5 text-left text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px] hover:text-slate-900 cursor-pointer transition-colors">
                          Ngày nhập
                        </th>
                        <th className="h-[52px] px-5 text-left text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px]">
                          Số HĐ NCC
                        </th>
                        <th className="h-[52px] px-5 text-center text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px]">
                          SL mặt hàng
                        </th>
                        <th className="h-[52px] px-5 text-right text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px] hover:text-slate-900 cursor-pointer transition-colors">
                          Tổng tiền
                        </th>
                        <th className="h-[52px] px-5 text-right text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px]">
                          Công nợ
                        </th>
                        <th className="h-[52px] px-5 text-center text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px]">
                          Trạng thái
                        </th>
                        <th className="h-[52px] pr-5 text-right text-[13px] uppercase font-semibold text-slate-700 tracking-[0.2px]">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {isLoadingReceipts && paginatedReceipts.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
                            <p className="text-slate-400">Đang tải phiếu nhập...</p>
                          </td>
                        </tr>
                      ) : paginatedReceipts.map((receipt) => {
                        const totalAmount = receipt.totalCost + (receipt.shippingCost || 0);
                        const debt = receipt.debtRecorded || 0;
                        return (
                          <tr
                            key={receipt.id}
                            className="group h-[56px] hover:bg-[#FAFBFC] transition-all duration-[150ms] cursor-pointer"
                            onClick={() => handleViewDetail(receipt)}
                          >
                            {/* Checkbox */}
                            <td className="h-[56px] pl-5 align-middle" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedReceiptIds.has(receipt.id)}
                                onChange={() => handleSelectReceipt(receipt.id)}
                                className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                              />
                            </td>

                            {/* Mã phiếu — avatar tròn tím */}
                            <td className="py-4 px-5 whitespace-nowrap align-middle">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                                  <ArrowDownToLine className="w-4 h-4 text-purple-500" />
                                </div>
                                <span className="text-slate-900 font-semibold text-sm hover:underline">
                                  {receipt.id}
                                </span>
                              </div>
                            </td>

                            {/* Nhà cung cấp — đổi tím khi hover row */}
                            <td className="py-4 px-5 whitespace-nowrap align-middle">
                              <span className="text-sm font-medium text-slate-700 group-hover:text-purple-600 transition-colors">
                                {receipt.supplierName}
                              </span>
                            </td>

                            {/* Ngày nhập */}
                            <td className="py-4 px-5 whitespace-nowrap align-middle">
                              <p className="text-sm text-slate-500">{formatDate(receipt.date)}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{formatTime(receipt.date)}</p>
                            </td>

                            {/* Số HĐ NCC */}
                            <td className="py-4 px-5 whitespace-nowrap align-middle text-sm text-slate-500">
                              {receipt.invoiceNumber || '—'}
                            </td>

                            {/* SL mặt hàng */}
                            <td className="py-4 px-5 whitespace-nowrap align-middle text-sm text-slate-500 text-center">
                              {(receipt.items || []).length}
                            </td>

                            {/* Tổng tiền — màu động theo giá trị */}
                            <td className={`py-4 px-5 text-right text-sm font-semibold whitespace-nowrap align-middle ${
                              totalAmount > 0 ? 'text-red-500' : 'text-emerald-500'
                            }`}>
                              {totalAmount.toLocaleString('vi-VN')} ₫
                            </td>

                            {/* Công nợ */}
                            <td className={`py-4 px-5 text-right text-sm font-semibold whitespace-nowrap align-middle ${
                              debt > 0 ? 'text-red-500' : 'text-emerald-500'
                            }`}>
                              {debt.toLocaleString('vi-VN')} ₫
                            </td>

                            {/* Trạng thái */}
                            <td className="py-4 px-5 text-center whitespace-nowrap align-middle">
                              {getImportStatusBadge(receipt.status || '')}
                            </td>

                            {/* Thao tác */}
                            <td className="h-[56px] pr-5 text-right whitespace-nowrap align-middle" onClick={(e) => e.stopPropagation()}>
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => handleViewDetail(receipt)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                                  title="Xem chi tiết"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                {receipt.status === 'draft' && (
                                  <button
                                    onClick={() => handleEditClick(receipt)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                                    title="Mở lại / Sửa"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteClick(receipt.id)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
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

                {/* Mobile card view */}
                <div className="md:hidden ig-page-mobile-list">
                   {paginatedReceipts.length > 0 ? (
                     paginatedReceipts.map(receipt => (
                        <div key={receipt.id} className="ig-page-mobile-card" onClick={() => handleViewDetail(receipt)}>
                           <div className="ig-page-mobile-card__header">
                              <div className="ig-page-mobile-card__id-row">
                                <div className="ig-page-mobile-card__id-avatar">
                                  <ArrowDownToLine className="w-4 h-4 ig-page-mobile-card__id-avatar-icon" />
                                </div>
                                <span className="ig-page-mobile-card__id-text">{receipt.id}</span>
                                {getImportStatusBadge(receipt.status || '')}
                              </div>
                              <span className="ig-page-mobile-card__amount">{(receipt.totalCost + (receipt.shippingCost || 0)).toLocaleString('vi-VN')} ₫</span>
                           </div>
                           <div className="ig-page-mobile-card__supplier">
                              <User className="w-4 h-4 ig-page-mobile-card__supplier-icon"/> {receipt.supplierName}
                           </div>
                           <div className="ig-page-mobile-card__date">
                              <Calendar className="w-4 h-4 ig-page-mobile-card__date-icon"/> {new Date(receipt.date).toLocaleDateString('vi-VN')}
                           </div>
                            <div className="ig-page-mobile-card__footer">
                               <span className="ig-page-mobile-card__footer-count">{(receipt.items || []).length} mặt hàng</span>
                               <div className="inline-flex items-center gap-1">
                                <button onClick={(e) => { e.stopPropagation(); handleViewDetail(receipt); }} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition" title="Xem chi tiết"><FileText className="w-4 h-4"/></button>
                                {permissions.canDeleteRecord && receipt.status === 'draft' && (
                                  <button onClick={(e) => { e.stopPropagation(); handleEditClick(receipt); }} className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition" title="Mở lại / Sửa"><Edit className="w-4 h-4"/></button>
                                )}
                                {permissions.canDeleteRecord && (
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(receipt.id); }} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition" title="Xóa"><Trash2 className="w-4 h-4"/></button>
                                )}
                              </div>
                           </div>
                        </div>
                     ))
                   ) : (
                      <EmptyState
                        icon={<ArrowDownToLine className="w-10 h-10" />}
                        title="Chưa có phiếu nhập nào"
                        description="Tạo phiếu nhập mới để bắt đầu."
                        action={
                          permissions.canManageInventory ? (
                          <ActionButton
                            variant="primary"
                            size="md"
                            icon={<Plus className="w-4 h-4" />}
                            onClick={() => { navigate('/import/create'); setViewingReceipt(null); resetForm(); }}
                          >
                            Nhập hàng
                          </ActionButton>
                          ) : undefined
                        }
                      />
                   )}
                </div>

                {/* ===== KHU VỰC 3: Pagination Toolbar (border-t pt-5 mt-4) ===== */}
                {paginatedReceipts.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-5 mt-4">
                    <p className="text-sm text-slate-400">
                      Hiển thị{' '}
                      <span className="text-slate-700 font-medium">
                        {totalReceiptCount === 0 ? 0 : importStartIndex + 1}
                      </span>{' '}
                      -{' '}
                      <span className="text-slate-700 font-medium">
                        {Math.min(importStartIndex + pageSize, totalReceiptCount)}
                      </span>{' '}
                      trên tổng số{' '}
                      <span className="text-slate-700 font-medium">{totalReceiptCount}</span>{' '}
                      phiếu nhập
                    </p>

                    <nav className="pagination-toolbar inline-flex items-center gap-1 rounded-xl bg-slate-50 p-1">
                        <button
                          onClick={() => setCurrentImportPage(Math.max(safeCurrentPage - 1, 1))}
                          disabled={safeCurrentPage === 1}
                          className="min-w-[32px] h-[32px] rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Trang trước"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {getImportPageNumbers().map((p, idx) =>
                          p === 'ellipsis' ? (
                            <span key={`e-${idx}`} className="px-2 text-slate-400 text-sm select-none">…</span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => setCurrentImportPage(p)}
                              className={`min-w-[32px] h-[32px] rounded-lg text-sm font-semibold transition-all ${
                                p === safeCurrentPage
                                  ? 'bg-white text-purple-600 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                              }`}
                            >
                              {p}
                            </button>
                          )
                        )}

                        <button
                          onClick={() => setCurrentImportPage(Math.min(safeCurrentPage + 1, totalImportPages))}
                          disabled={safeCurrentPage === totalImportPages}
                          className="min-w-[32px] h-[32px] rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Trang sau"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </nav>
                  </div>
                )}
              </>
            )
          }
          </DataGridBox>
        )}
        </>
      )}

       {isSupplierModalOpen && (
        <div className="ig-page-modal-overlay">
          <div className="ig-page-modal">
             <div className="ig-page-modal__header">
              <h3 className="ig-page-modal__title">Thêm nhà cung cấp mới</h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="ig-page-modal__close">&times;</button>
            </div>
            <form onSubmit={handleCreateSupplier} className="ig-page-modal__body">
              <div className="ig-page-modal__field"><label className="ig-page-modal__field-label">Tên nhà cung cấp</label><input required type="text" className="ig-page-modal__input" value={newSupplierData.name} onChange={e => setNewSupplierData({...newSupplierData, name: e.target.value})} /></div>
              <div className="ig-page-modal__field"><label className="ig-page-modal__field-label">Số điện thoại</label><input required type="text" className="ig-page-modal__input" value={newSupplierData.phone} onChange={e => setNewSupplierData({...newSupplierData, phone: e.target.value})} /></div>
              <div className="ig-page-modal__footer"><button type="button" onClick={() => setIsSupplierModalOpen(false)} className="ig-page-modal__btn-cancel">Huỷ</button><button type="submit" className="ig-page-modal__btn-save">Lưu</button></div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
};