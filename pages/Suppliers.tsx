import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Supplier, ImportReceipt } from '../types';
import { Plus, Search, User, Edit, Trash2, Wallet, Download, Upload, FileSpreadsheet, X, History, CheckCircle, ArrowUpDown, Phone, MapPin, Loader2, ChevronLeft, ChevronRight, Eye, Truck, AlertCircle, Award } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabaseService } from '../services/supabaseService';
import { ActionButton } from '../components/ActionButton';
import { DataGrid, DataGridColumn, SortDirection } from '../components/DataGrid';
import { useNewDataGridSuppliers } from '../features';
import StatsRow from '../components/shared/StatsRow';
import { PageLayout } from '../components/shared/PageLayout';
import { DataGridBox } from '../components/shared/DataGridBox';
import { useDebounce } from '../hooks/useDebounce';
import { usePermissions } from '../hooks/usePermissions';
import { DebtLedgerModal } from '../components/DebtLedgerModal';
import '../components/shared/FilterBar.css';
import './Suppliers.css';

interface SuppliersProps {
  suppliers?: Supplier[];
  importReceipts?: ImportReceipt[];
  onAddSupplier: (supplier: Supplier) => Promise<void>;
  onUpdateSupplier: (supplier: Supplier) => Promise<void>;
  onDeleteSupplier: (id: string) => void;
  onPayDebt?: (receiptId: string, amount: number) => void;
}

export const Suppliers: React.FC<SuppliersProps> = ({
  suppliers: _suppliersProp,
  importReceipts: _importReceipts = [],
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onPayDebt
}) => {
  // NOTE: Toàn bộ danh sách NCC chỉ còn được tải on-demand cho 2 việc đặc thù:
  //   (1) sinh mã NCC tự động khi thêm mới không nhập mã, (2) export Excel toàn bộ.
  //   Main list + stats đều đã server-side (filterSuppliersPaginated / getSupplierStats).

  // Phase 6: fetch import receipts cho supplier đang xem (thay vì dùng prop importReceipts = [])
  const [supplierReceipts, setSupplierReceipts] = useState<ImportReceipt[]>([]);
  const [isFetchingReceipts, setIsFetchingReceipts] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const permissions = usePermissions();
  
  // Tab State for Modal
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  const [formData, setFormData] = useState<any>({ 
    code: '', 
    name: '', 
    phone: '', 
    address: '', 
    contactPerson: '', 
    debt: 0,
    email: '',
    supplierGroup: '',
    note: '',
    companyName: '',
    taxCode: '',
    idNumber: ''
  });
  
  // Payment Prompt State
  const [paymentReceiptId, setPaymentReceiptId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  // Phase 8d: Sổ cái công nợ NCC
  const [ledgerSupplierId, setLedgerSupplierId] = useState<string | null>(null);

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: keyof Supplier; direction: 'asc' | 'desc' } | null>(null);

  // ===== STATE CHO TÍNH NĂNG CHECKBOX =====
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ===== PHÂN TRANG SERVER-SIDE =====
  const [supplierPageSize, setSupplierPageSize] = useState(7);
  const [currentSupplierPage, setCurrentSupplierPage] = useState(1);
  const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataGridBoxRef = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // ===== STAT VALUES FROM SERVER =====
  const [supplierStats, setSupplierStats] = useState({
    total: 0,
    withPhone: 0,
    withDebt: 0,
    totalDebt: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingStats(true);
    supabaseService.getSupplierStats()
      .then(stats => {
        if (!cancelled) setSupplierStats(stats);
      })
      .catch(err => console.error('Suppliers: fetch stats error', err))
      .finally(() => {
        if (!cancelled) setIsLoadingStats(false);
      });
    return () => { cancelled = true; };
  }, []);

  const totalSuppliers = supplierStats.total;
  const phoneSuppliers = supplierStats.withPhone;
  const debtSuppliers = supplierStats.withDebt;
  const totalDebt = supplierStats.totalDebt;
  // VIP/rating không còn trong schema NCC; hiển thị 0 cho đến khi có dữ liệu ranking
  const vipSuppliers = 0;

  // ===== SERVER-SIDE FETCH =====
  const fetchSuppliers = useCallback(async (page: number, search: string) => {
    setIsLoading(true);
    try {
      const { suppliers: data, totalCount } = await supabaseService.filterSuppliersPaginated(
        page,
        supplierPageSize,
        search,
        sortConfig ? { sortBy: sortConfig.key as string, sortOrder: sortConfig.direction } : undefined
      );
      setLocalSuppliers(data);
      setTotalCount(totalCount);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supplierPageSize, sortConfig]);

  useEffect(() => {
    fetchSuppliers(currentSupplierPage, debouncedSearchTerm);
  }, [currentSupplierPage, supplierPageSize, debouncedSearchTerm, sortConfig, fetchSuppliers]);

  // Reset về trang 1 khi tìm kiếm thay đổi
  useEffect(() => {
    setCurrentSupplierPage(1);
  }, [searchTerm]);

  // Phase 6: fetch import receipts khi mở modal supplier (thay vì dùng prop importReceipts = [])
  useEffect(() => {
    if (!editingSupplier) {
      setSupplierReceipts([]);
      return;
    }
    let cancelled = false;
    setIsFetchingReceipts(true);
    supabaseService.getImportReceiptsBySupplierId(editingSupplier.id, 50)
      .then(data => { if (!cancelled) setSupplierReceipts(data); })
      .catch(err => console.error('Suppliers: fetch receipts error', err))
      .finally(() => { if (!cancelled) setIsFetchingReceipts(false); });
    return () => { cancelled = true; };
  }, [editingSupplier?.id]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: key as keyof Supplier, direction });
    setCurrentSupplierPage(1);
  };

  // ===== TÍNH TOÁN PHÂN TRANG =====
  const totalSupplierPages = Math.max(1, Math.ceil(totalCount / supplierPageSize));
  const safeSupplierPage = Math.min(currentSupplierPage, totalSupplierPages);

  // Sinh dãy số trang có ellipsis
  const getSupplierPageNumbers = (): (number | 'ellipsis')[] => {
    const total = totalSupplierPages;
    const current = safeSupplierPage;
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

  // ===== HÀM XỬ LÝ LOGIC CHECKBOX =====
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(localSuppliers.map(s => s.id));
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
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} nhà cung cấp đã chọn?`)) {
      selectedIds.forEach(id => onDeleteSupplier(id));
      setSelectedIds([]);
      fetchSuppliers(currentSupplierPage, debouncedSearchTerm);
    }
  };

  // V2 DataGrid helpers
  const handleDataGridSort = (key: string, direction: SortDirection) => {
    if (direction === 'none') {
      setSortConfig(null);
    } else {
      handleSort(key);
    }
  };



  const supplierColumns: DataGridColumn<Supplier>[] = [
    {
      key: 'code',
      label: 'Mã NCC',
      sortable: true,
      render: (supplier) => <span className="suppliers-v2-code">{(supplier as any).code || supplier.id}</span>,
    },
    {
      key: 'name',
      label: 'Nhà cung cấp',
      sortable: true,
      render: (supplier) => (
        <button
          className="suppliers-v2-name"
          onClick={(e) => {
            e.stopPropagation();
            openModal(supplier);
          }}
        >
          {supplier.name}
        </button>
      ),
    },
    {
      key: 'contactPerson',
      label: 'Người liên hệ',
      sortable: true,
      render: (supplier) => <span className="suppliers-v2-text">{(supplier as any).contactPerson || '—'}</span>,
    },
    {
      key: 'phone',
      label: 'Điện thoại',
      sortable: true,
      render: (supplier) => <span className="suppliers-v2-text">{supplier.phone || '—'}</span>,
    },
    {
      key: 'address',
      label: 'Địa chỉ',
      render: (supplier) => <span className="suppliers-v2-text" title={supplier.address}>{supplier.address || '—'}</span>,
    },
    {
      key: 'debt',
      label: 'Công nợ phải trả',
      sortable: true,
      align: 'right',
      render: (supplier) => (
        <span className={`suppliers-v2-debt ${Number(supplier.debt || 0) > 0 ? '' : 'paid'}`}>
          {Number(supplier.debt || 0).toLocaleString('vi-VN')}₫
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'right',
      render: (supplier) => (
        <div className="suppliers-v2-actions">
          {permissions.canDeleteRecord && (
          <ActionButton
            variant="ghost"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={(e) => {
              e?.stopPropagation();
              openModal(supplier);
            }}
            aria-label="Xem / Sửa"
          />
          )}
          {permissions.canDeleteRecord && (
          <ActionButton
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={(e) => {
              e?.stopPropagation();
              onDeleteSupplier(supplier.id);
            }}
            aria-label="Xoá"
          />
          )}
        </div>
      ),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalCode = (formData as any).code;
      if (!finalCode) {
        // On-demand full fetch (rare path: thêm NCC không nhập mã) — chỉ để sinh mã tự động
        const allSuppliers = await supabaseService.getSuppliers();
        const nccCodes = allSuppliers
          .map(s => (s as any).code)
          .filter(code => code && code.startsWith('NCC'))
          .map(code => {
            const numPart = code.replace('NCC', '');
            return parseInt(numPart, 10);
          })
          .filter(num => !isNaN(num));
        const maxNum = nccCodes.length > 0 ? Math.max(...nccCodes) : 0;
        finalCode = `NCC${(maxNum + 1).toString().padStart(6, '0')}`;
      }

      if (editingSupplier) {
        await onUpdateSupplier({ ...editingSupplier, ...formData, code: finalCode } as any);
      } else {
        await onAddSupplier({ ...formData, code: finalCode, id: `S${Date.now()}`, debt: 0 } as any);
      }
      fetchSuppliers(currentSupplierPage, debouncedSearchTerm);
      closeModal();
    } catch (error) {
      console.error("Error submitting supplier:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (supplier?: Supplier) => {
    setActiveTab('info');
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({ ...supplier });
    } else {
      setEditingSupplier(null);
      setFormData({ code: '', name: '', phone: '', address: '', contactPerson: '', debt: 0 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    setPaymentReceiptId(null);
  };

  const handlePayClick = (receipt: ImportReceipt) => {
    const remainingDebt = receipt.totalCost - receipt.paidAmount;
    setPaymentReceiptId(receipt.id);
    setPaymentAmount(remainingDebt.toString());
  };

  const submitPayment = async () => {
    if (paymentReceiptId && onPayDebt) {
      const amount = Number(paymentAmount);
      if (amount <= 0) {
        alert("Số tiền thanh toán không hợp lệ");
        return;
      }

      try {
        await onPayDebt(paymentReceiptId, amount);
        // Phase 8d: refresh lại danh sách phiếu của NCC đang xem + stats sau khi thanh toán atomic
        if (editingSupplier) {
          setIsFetchingReceipts(true);
          supabaseService.getImportReceiptsBySupplierId(editingSupplier.id, 50)
            .then(data => setSupplierReceipts(data))
            .catch(err => console.error('Suppliers: refetch receipts error', err))
            .finally(() => setIsFetchingReceipts(false));
        }
        supabaseService.getSupplierStats()
          .then(setSupplierStats)
          .catch(err => console.error('Suppliers: refetch stats error', err));
        fetchSuppliers(currentSupplierPage, debouncedSearchTerm);
      } catch (err: any) {
        alert(err?.message || 'Lỗi khi thanh toán công nợ NCC.');
      } finally {
        setPaymentReceiptId(null);
        setPaymentAmount('');
      }
    }
  };

  // supplierReceipts được fetch bởi useEffect bên trên (Phase 6 server-side)

  const handleDownloadSample = () => {
    const headers = [
      {
        'Mã nhà cung cấp': 'NCC000001',
        'Tên nhà cung cấp (Bắt buộc)': 'Công ty ABC',
        'Người liên hệ': 'Anh Nam',
        'Số điện thoại (Bắt buộc)': '0281234567',
        'Địa chỉ': 'KCN Tân Bình'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Nha_Cung_Cap");
    XLSX.writeFile(wb, "mau_nhap_nha_cung_cap.xlsx");
  };

  const handleExportExcel = async () => {
    // Export đặc thù: tải toàn bộ NCC chỉ khi user bấm export
    const allSuppliers = await supabaseService.getSuppliers();
    const data = allSuppliers.map(s => ({
      'Mã nhà cung cấp': s.code,
      'Tên nhà cung cấp': s.name,
      'Người liên hệ': s.contactPerson,
      'Số điện thoại': s.phone,
      'Địa chỉ': s.address,
      'Công nợ phải trả': s.debt
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach_Nha_Cung_Cap");
    XLSX.writeFile(wb, "danh_sach_nha_cung_cap.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await new Promise<any[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            resolve(XLSX.utils.sheet_to_json(ws));
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsBinaryString(file);
      });

      let count = 0;
      for (const row of data) {
        const name = row['Tên nhà cung cấp (Bắt buộc)'] || row['Tên nhà cung cấp'];
        const phone = row['Số điện thoại (Bắt buộc)'] || row['Số điện thoại'];
        const code = row['Mã nhà cung cấp'] || `S${Date.now() + Math.random()}`;
        
        if (name) {
          const newSupplier: Supplier = {
            id: `S${Date.now() + Math.random()}`,
            code: String(code),
            name: name,
            contactPerson: row['Người liên hệ'] || '',
            phone: String(phone || ''),
            address: row['Địa chỉ'] || '',
            debt: 0
          };
          await onAddSupplier(newSupplier);
          count++;
        }
      }
      alert(`Đã nhập thành công ${count} nhà cung cấp!`);
      fetchSuppliers(currentSupplierPage, debouncedSearchTerm);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Error importing suppliers:", error);
      alert("Lỗi khi nhập dữ liệu nhà cung cấp.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <PageLayout className="crm-page">
      <style>{`
        /* ===== SUPPLIERS PAGE – Synced with Customers BOX style ===== */

        /* BOX CHÍNH = container chuẩn Customers */
        .crm-table-container {
          border: 1px solid rgba(241, 245, 249, 0.5);
          border-radius: 16px;
          overflow: hidden;
          background: #FFFFFF;
          box-shadow: 0 8px 30px rgba(0,0,0,0.015);
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
          min-height: 0;
        }
        .crm-table { width: 100%; border-collapse: collapse; }
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

        .crm-empty {
          padding: 60px 20px;
          text-align: center;
        }

      `}</style>

      {/* HEADER: Tiêu đề và Nhóm nút chức năng */}
      <div className="page-header items-start">
        <div className="flex items-center gap-3">
          <div className="inv-title-icon">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="page-title">Quản lý nhà cung cấp</h1>
            <p className="page-subtitle">Quản lý thông tin và công nợ nhà cung cấp</p>
          </div>
        </div>
        {/* ===== SEARCH + FILTER (moved into header row, between title and Excel buttons) ===== */}
        <div className="flex flex-1 flex-wrap items-center gap-3 sm:mx-4 sm:justify-center">
          <div className="filter-bar__search">
            <Search className="filter-bar__search-icon" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, mã NCC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-bar__search-input"
            />
            {searchTerm && (
              <X
                className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600"
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>

        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bulk Action Bar */}
          {permissions.canDeleteRecord && selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5 animate-fade-in mr-2">
              <span className="text-xs font-semibold text-red-700">Đã chọn {selectedIds.length}</span>
              <button 
                onClick={handleBulkDelete}
                className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                title="Xóa các mục đã chọn"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Button Group: Mẫu | Nhập | Xuất */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button onClick={handleDownloadSample} className="p-2 text-slate-600 hover:text-purple-600 hover:bg-slate-50 rounded-lg flex items-center gap-1 text-sm font-medium">
              <FileSpreadsheet className="w-4 h-4"/> <span>Mẫu</span>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-lg flex items-center gap-1 text-sm font-medium">
              <Upload className="w-4 h-4"/> <span>Nhập</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx, .xls" />
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button onClick={handleExportExcel} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg flex items-center gap-1 text-sm font-medium">
              <Download className="w-4 h-4"/> <span>Xuất</span>
            </button>
          </div>

          {permissions.canManageInventory && (
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 px-4 py-2.5 self-start flex-shrink-0">
            <Plus className="w-4 h-4" /> Thêm nhà cung cấp
          </button>
          )}
        </div>
      </div>

      <StatsRow stats={[
        { label: 'Tổng nhà cung cấp', value: totalSuppliers, subtext: 'Tất cả NCC', icon: <Truck />, colorScheme: 'purple' },
        { label: 'Có số điện thoại', value: phoneSuppliers, subtext: 'Nhà cung cấp', icon: <Phone />, colorScheme: 'blue' },
        { label: 'Có công nợ', value: debtSuppliers, subtext: 'Nhà cung cấp', icon: <AlertCircle />, colorScheme: 'orange' },
        { label: 'Tổng công nợ', value: totalDebt.toLocaleString('vi-VN') + '₫', subtext: 'Tổng số tiền nợ', icon: <Wallet />, colorScheme: 'green' },
        { label: 'Đối tác VIP', value: vipSuppliers, subtext: 'Nhà cung cấp', icon: <Award />, colorScheme: 'red' },
      ]} />

      {/* ===== BOX CHÍNH (TABLE) ===== */}
      <div ref={dataGridBoxRef} className="crm-table-container">
        {useNewDataGridSuppliers ? (
          <div className="suppliers-v2-datagrid flex-1 min-h-0">
            <DataGrid
              className="flex-1 min-h-0"
              embedded
              data={localSuppliers}
              columns={supplierColumns}
              keyExtractor={(supplier) => supplier.id}
              loading={isLoading && localSuppliers.length === 0}
              selectedRows={selectedIds}
              onSelectionChange={(ids) => setSelectedIds(ids as string[])}
              onRowClick={(supplier) => openModal(supplier)}
              sortKey={sortConfig?.key as string}
              sortDirection={sortConfig?.direction || 'none'}
              onSortChange={handleDataGridSort}
              pagination={{
                currentPage: safeSupplierPage,
                totalPages: totalSupplierPages,
                totalCount,
                pageSize: supplierPageSize,
                onPageChange: (page) => setCurrentSupplierPage(page),
                showInfo: false,
              }}
              emptyTitle="Không tìm thấy nhà cung cấp nào"
              emptyDescription="Thử tìm kiếm với từ khóa khác hoặc thêm nhà cung cấp mới."
              emptyAction={
                permissions.canManageInventory ? (
                <ActionButton
                  variant="primary"
                  size="md"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => openModal()}
                >
                  Thêm nhà cung cấp
                </ActionButton>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                        checked={localSuppliers.length > 0 && localSuppliers.every(s => selectedIds.includes(s.id))}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="sortable" onClick={() => handleSort('code')}>
                      <div className="flex items-center gap-1">Mã NCC <ArrowUpDown className="w-3 h-3"/></div>
                    </th>
                    <th className="sortable" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">Nhà cung cấp <ArrowUpDown className="w-3 h-3"/></div>
                    </th>
                    <th className="sortable" onClick={() => handleSort('contactPerson')}>
                      <div className="flex items-center gap-1">Người liên hệ <ArrowUpDown className="w-3 h-3"/></div>
                    </th>
                    <th>Điện thoại</th>
                    <th>Địa chỉ</th>
                    <th className="sortable" onClick={() => handleSort('debt')}>
                      <div className="flex items-center justify-end gap-1">Công nợ phải trả <ArrowUpDown className="w-3 h-3"/></div>
                    </th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isImporting ? (
                    <tr>
                      <td colSpan={8} className="crm-table-loading">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                          <p>Đang xử lý dữ liệu Excel...</p>
                        </div>
                      </td>
                    </tr>
                  ) : localSuppliers.length > 0 ? (
                    localSuppliers.map((supplier) => (
                      <tr
                        key={supplier.id}
                        className={selectedIds.includes(supplier.id) ? 'selected' : ''}
                      >
                        <td>
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                            checked={selectedIds.includes(supplier.id)}
                            onChange={(e) => handleSelectRow(supplier.id, e.target.checked)}
                          />
                        </td>
                        <td className="font-medium text-slate-600">{(supplier as any).code || supplier.id}</td>
                        <td>
                          <span
                            className="font-medium text-slate-900 cursor-pointer hover:text-purple-600"
                            onClick={() => openModal(supplier)}
                          >
                            {supplier.name}
                          </span>
                        </td>
                        <td className="text-slate-600">{(supplier as any).contactPerson || '\u2014'}</td>
                        <td className="text-slate-600">{supplier.phone || '\u2014'}</td>
                        <td className="text-slate-500 truncate crm-table-address">{supplier.address || '\u2014'}</td>
                        <td className="text-right">
                          <span className={`font-bold ${Number(supplier.debt || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {Number(supplier.debt || 0).toLocaleString('vi-VN')}₫
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {permissions.canDeleteRecord && (
                            <button
                              onClick={() => openModal(supplier)}
                              className="crm-action-btn edit"
                              title="Xem / Sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            )}
                            {permissions.canDeleteRecord && (
                            <button
                              onClick={() => onDeleteSupplier(supplier.id)}
                              className="crm-action-btn delete"
                              title="Xoá"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="crm-table-empty">
                        Không tìm thấy nhà cung cấp nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION: 7 nhà cung cấp / trang */}
            {localSuppliers.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 mt-4 border-t border-slate-100">
                <div className="text-sm text-slate-400">
                  Hiển thị <span className="font-medium text-slate-700">{(safeSupplierPage - 1) * supplierPageSize + 1} - {Math.min(safeSupplierPage * supplierPageSize, totalCount)}</span> trên tổng số <span className="font-medium text-slate-700">{totalCount}</span> nhà cung cấp
                </div>
                <nav className="inline-flex items-center gap-1 rounded-xl bg-slate-50 p-1" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentSupplierPage(Math.max(safeSupplierPage - 1, 1))}
                    disabled={safeSupplierPage === 1}
                    className="inline-flex items-center p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {getSupplierPageNumbers().map((p, idx) =>
                    p === 'ellipsis' ? (
                      <span key={`e-${idx}`} className="px-2 text-slate-400 text-sm select-none">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentSupplierPage(p)}
                        className={`inline-flex items-center justify-center min-w-[32px] h-[32px] text-sm font-semibold rounded-lg transition-all ${
                          p === safeSupplierPage
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setCurrentSupplierPage(Math.min(safeSupplierPage + 1, totalSupplierPages))}
                    disabled={safeSupplierPage === totalSupplierPages}
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

      {/* MAIN MODAL */}
      {isModalOpen && (
        <div className="vsp-modal-sync fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl flex flex-col relative supplier-modal">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="font-bold text-lg text-gray-800">{editingSupplier ? 'Thông tin nhà cung cấp' : 'Thêm nhà cung cấp mới'}</h3>
              <div className="flex items-center gap-2">
                {editingSupplier && (
                  <button
                    onClick={() => setLedgerSupplierId(editingSupplier.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    title="Xem sổ cái công nợ / điều chỉnh nợ"
                  >
                    <History className="w-4 h-4" /> Sổ cái nợ
                  </button>
                )}
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* SIDEBAR 20% */}
              <div className="w-[20%] border-r border-gray-200 bg-gray-50 p-4 flex flex-col gap-2">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={`w-full py-3 px-4 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${activeTab === 'info' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}
                >
                  <User className="w-5 h-5"/> 
                  <span>Thông tin chung</span>
                </button>
                {editingSupplier && (
                  <button 
                    onClick={() => setActiveTab('history')}
                    className={`w-full py-3 px-4 text-sm font-medium rounded-lg transition-all flex items-center gap-3 ${activeTab === 'history' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}
                  >
                    <History className="w-5 h-5"/> 
                    <span>Lịch sử nhập hàng</span>
                  </button>
                )}
              </div>

              {/* CONTENT 80% */}
              <div className="w-[80%] p-6 overflow-y-auto">
                {activeTab === 'info' && (
                  <form id="supplierForm" onSubmit={handleSubmit} className="space-y-6">
                    {/* Thông tin cơ bản */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Thông tin cơ bản
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mã nhà cung cấp</label>
                          <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500" placeholder="Tự động nếu để trống" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhà cung cấp <span className="text-red-500">*</span></label>
                          <input required type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                          <input required type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500" value={(formData as any).email || ''} onChange={e => setFormData({...formData, email: e.target.value} as any)} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                          <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm nhà cung cấp</label>
                          <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500" value={(formData as any).supplierGroup || ''} onChange={e => setFormData({...formData, supplierGroup: e.target.value} as any)} placeholder="VD: Nhà cung cấp nguyên liệu" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Người liên hệ</label>
                          <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500" value={formData.contactPerson || ''} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                          <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 resize-none" rows={2} value={(formData as any).note || ''} onChange={e => setFormData({...formData, note: e.target.value} as any)} placeholder="Ghi chú về nhà cung cấp"></textarea>
                        </div>
                      </div>
                    </div>

                    {/* Thông tin xuất hóa đơn */}
                    <div className="space-y-4 border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        Thông tin xuất hóa đơn
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tên công ty</label>
                          <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500" value={(formData as any).companyName || ''} onChange={e => setFormData({...formData, companyName: e.target.value} as any)} placeholder="Tên công ty trên hóa đơn" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
                          <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500" value={(formData as any).taxCode || ''} onChange={e => setFormData({...formData, taxCode: e.target.value} as any)} placeholder="Mã số thuế" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Số CCCD/CMND</label>
                          <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500" value={(formData as any).idNumber || ''} onChange={e => setFormData({...formData, idNumber: e.target.value} as any)} placeholder="Số căn cước công dân" />
                        </div>
                      </div>
                    </div>

                    {/* Công nợ */}
                    <div className="space-y-4 border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Công nợ hiện tại
                      </h4>
                      <div className={`text-2xl font-bold ${Number(formData.debt) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {(formData.debt || 0).toLocaleString('vi-VN')} ₫
                      </div>
                      <p className="vsp-text-xs text-slate-400">Nợ được cộng dồn tự động từ phiếu nhập/thanh toán. Muốn gán nợ đầu kỳ, hãy tạo xong rồi bấm “Điều chỉnh nợ”.</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Đóng</button>
                      <button
                        type="submit"
                        disabled={isSubmitting || (editingSupplier ? !permissions.canDeleteRecord : !permissions.canManageInventory)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {editingSupplier ? 'Cập nhật' : 'Lưu thông tin'}
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'history' && (
                <div className="space-y-4">
                  {supplierReceipts.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">Chưa có lịch sử nhập hàng</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="hidden md:table w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                          <tr>
                            <th className="px-3 py-2">Ngày nhập</th>
                            <th className="px-3 py-2">Mã phiếu</th>
                            <th className="px-3 py-2 text-right">Tổng tiền</th>
                            <th className="px-3 py-2 text-right">Đã trả</th>
                            <th className="px-3 py-2 text-right">Còn nợ</th>
                            <th className="px-3 py-2 text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {supplierReceipts.map(receipt => {
                            const remaining = receipt.totalCost - receipt.paidAmount;
                            return (
                              <tr key={receipt.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-600">{new Date(receipt.date).toLocaleDateString('vi-VN')}</td>
                                <td className="px-3 py-2 font-medium">{receipt.id}</td>
                                <td className="px-3 py-2 text-right text-gray-900">{receipt.totalCost.toLocaleString('vi-VN')}</td>
                                <td className="px-3 py-2 text-right text-green-600">{receipt.paidAmount.toLocaleString('vi-VN')}</td>
                                <td className="px-3 py-2 text-right">
                                  {remaining > 0 ? <span className="text-red-600 font-bold">{remaining.toLocaleString('vi-VN')}</span> : <span className="text-gray-400">0</span>}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {remaining > 0 ? (
                                    <button onClick={() => handlePayClick(receipt)} className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold hover:bg-purple-200">Thanh toán</button>
                                  ) : (
                                    <span className="flex items-center justify-center text-green-500"><CheckCircle className="w-4 h-4"/></span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <div className="md:hidden space-y-3">
                        {supplierReceipts.map(receipt => {
                          const remaining = receipt.totalCost - receipt.paidAmount;
                          return (
                            <div key={receipt.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-bold text-gray-800">{receipt.id}</div>
                                  <div className="text-xs text-gray-500">{new Date(receipt.date).toLocaleDateString('vi-VN')}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-purple-600">{receipt.totalCost.toLocaleString('vi-VN')}</div>
                                  {remaining > 0 && <div className="text-xs text-red-600 font-bold">Nợ: {remaining.toLocaleString('vi-VN')}</div>}
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <div className="text-xs text-green-600">Đã trả: {receipt.paidAmount.toLocaleString('vi-VN')}</div>
                                {remaining > 0 ? (
                                  <button onClick={() => handlePayClick(receipt)} className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold hover:bg-purple-200">Thanh toán</button>
                                ) : (
                                  <span className="flex items-center text-green-500 text-xs font-medium"><CheckCircle className="w-3 h-3 mr-1"/> Xong</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>

              {/* Nested Payment Prompt */}
              {paymentReceiptId && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20 backdrop-blur-sm rounded-xl">
                  <div className="bg-white p-6 rounded-lg shadow-xl w-80 border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-2">Thanh toán công nợ</h4>
                    <p className="text-xs text-gray-500 mb-4">Phiếu nhập: {paymentReceiptId}</p>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Số tiền thanh toán</label>
                    <input type="number" className="w-full border border-purple-300 rounded px-3 py-2 text-lg font-bold text-purple-700 focus:ring-2 focus:ring-purple-500 outline-none" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} autoFocus />
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setPaymentReceiptId(null)} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium">Huỷ</button>
                      <button onClick={submitPayment} className="flex-1 py-2 text-white bg-purple-600 rounded hover:bg-purple-700 text-sm font-bold shadow-sm">Xác nhận</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase 8d: Sổ cái công nợ NCC (xem ledger + điều chỉnh nợ có reason) */}
      {ledgerSupplierId && editingSupplier && (
        <DebtLedgerModal
          isOpen={!!ledgerSupplierId}
          onClose={() => setLedgerSupplierId(null)}
          entityType="supplier"
          entityId={ledgerSupplierId}
          entityName={editingSupplier.name || ''}
          onAdjusted={async () => {
            // Refresh editingSupplier + stats + danh sách sau khi adjust
            try {
              const fresh = await supabaseService.getSupplierById(ledgerSupplierId);
              if (fresh) setEditingSupplier(fresh as Supplier);
            } catch (err) {
              console.error('Refresh supplier after adjust failed:', err);
            }
            supabaseService.getSupplierStats()
              .then(setSupplierStats)
              .catch(err => console.error('Suppliers: refetch stats error', err));
            fetchSuppliers(currentSupplierPage, debouncedSearchTerm);
          }}
        />
      )}
    </PageLayout>
  );
};