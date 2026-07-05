import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Product, ProductLot, UnitConversion, Category, Brand } from '../types';
import { Plus, Search, Edit, Trash2, Download, Upload, FileSpreadsheet, X, Box, Barcode, Layers, AlertCircle, ChevronLeft, ChevronRight, Loader2, Save, ArrowUpDown, ChevronDown, Check, Settings2, Trash, ScanBarcode, Package, Bookmark, Wallet, ImageIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabaseService } from '../services/supabaseService';
import BarcodeScannerFix from '../components/BarcodeScannerFix';
import ProductEditModal from '../components/ProductEditModal';
import { capitalizeProductName } from '../utils/stringHelper';
import { ActionButton } from '../components/ActionButton';
import { DataGrid, DataGridColumn, SortDirection } from '../components/DataGrid';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { useNewDataGridInventory } from '../features';
import { PageLayout } from '../components/shared/PageLayout';
import { DataGridBox } from '../components/shared/DataGridBox';
import { useDebounce } from '../hooks/useDebounce';
import { useTenant } from '../hooks/useTenant';
import { usePermissions } from '../hooks/usePermissions';
import '../components/shared/FilterBar.css';
import './Inventory.css';

interface InventoryProps {
  products?: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkUpdate?: (ids: string[], updates: Partial<Product>) => void;
  onBulkImport?: (newProducts: Product[], updatedProducts: Product[]) => void;
  categories: Category[];
  brands: Brand[];
  onAddCategory: (name: string) => Promise<void>;
  onUpdateCategory: (id: string, name: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onAddBrand: (name: string) => Promise<void>;
  onUpdateBrand: (id: string, name: string) => Promise<void>;
  onDeleteBrand: (id: string) => Promise<void>;
}

type TabType = 'general' | 'units';

const PRODUCT_PAGE_SIZE = 7;

export const Products: React.FC<InventoryProps> = ({ 
  products: productsProp, 
  categories,
  brands,
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onBulkDelete,
  onBulkUpdate,
  onBulkImport,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddBrand,
  onUpdateBrand,
  onDeleteBrand
}) => {
  // Fallback: tải toàn bộ products chỉ khi prop không được truyền.
  // Full list được dùng cho: scanner lookup, inventory-count picker, export Excel,
  // import Excel matching, duplicate SKU/barcode check — đây là các trường hợp đặc thù
  // cần toàn bộ danh sách (không phải render list chính, list chính đã server-side paginate).
  const [productsFallback, setProductsFallback] = useState<Product[]>([]);
  const products = productsProp || productsFallback;
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const permissions = usePermissions();

  useEffect(() => {
    if (!tenantId) return;
    if (!productsProp) {
      supabaseService.getProducts().then(setProductsFallback).catch(console.error);
    }
  }, [productsProp, tenantId]);

  const [searchTerm, setSearchTerm] = useState('');

  // --- Scanner State ---
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'search' | 'form'>('search');

  const handleScanSuccess = (decodedText: string) => {
    if (scannerMode === 'search') {
      setSearchTerm(decodedText);
    } else if (scannerMode === 'form') {
      setFormData(prev => ({ ...prev, barcode: decodedText }));
    }
  };
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [selectedBrandIds, setSelectedBrandIds] = useState<Set<string>>(new Set());
  
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [isBrandFilterOpen, setIsBrandFilterOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PRODUCT_PAGE_SIZE);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [totalProductCount, setTotalProductCount] = useState(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productStats, setProductStats] = useState({
    total: 0,
    active: 0,
    lowStock: 0,
    outOfStock: 0,
    inventoryValue: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Phase 1: fetch product stats from server
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    setIsLoadingStats(true);
    supabaseService.getProductStats()
      .then(stats => {
        if (!cancelled) setProductStats(stats);
      })
      .catch(err => console.error('Inventory: fetch product stats error', err))
      .finally(() => {
        if (!cancelled) setIsLoadingStats(false);
      });
    return () => { cancelled = true; };
  }, [tenantId]);
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Layout refs
  const productsDataGridBoxRef = useRef<HTMLDivElement>(null);

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk Update State
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [bulkUpdateType, setBulkUpdateType] = useState<'category' | 'brand' | null>(null);
  const [newBulkValue, setNewBulkValue] = useState('');

  // --- Category/Brand Management State ---
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isBrandManagerOpen, setIsBrandManagerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [managerInputValue, setManagerInputValue] = useState('');

  // Form State (Product)
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    code: '',
    price: 0,
    cost: 0,
    quantity: 0,
    unit: 'Cái',
    category: '',
    hasBatches: false,
    conversionUnits: [],
    lots: []
  });

  // Helper State for adding sub-items
  const [newUnit, setNewUnit] = useState<Partial<UnitConversion>>({ name: '', ratio: 1, price: 0 });
  const [newLot, setNewLot] = useState<Partial<ProductLot>>({ code: '', expiryDate: '', quantity: 0 });

  // Auto-update formData.quantity when lots change (if lot management is on)
  useEffect(() => {
    if (formData.hasBatches && formData.lots) {
      const totalFromLots = formData.lots.reduce((sum, lot) => sum + lot.quantity, 0);
      if (formData.quantity !== totalFromLots) {
        setFormData(prev => ({ ...prev, quantity: totalFromLots }));
      }
    }
  }, [formData.lots, formData.hasBatches]);

  // Server-side fetch for products list
  const fetchProducts = useCallback(async (page: number) => {
    setIsLoadingProducts(true);
    try {
      // RPC chỉ hỗ trợ 1 category/brand; lấy ID đầu tiên nếu chọn nhiều
      const categoryId = selectedCategoryIds.size > 0 ? Array.from(selectedCategoryIds)[0] : undefined;
      const brandId = selectedBrandIds.size > 0 ? Array.from(selectedBrandIds)[0] : undefined;
      const { products: data, totalCount } = await supabaseService.filterProductsPaginated(
        page,
        pageSize,
        debouncedSearchTerm,
        {
          categoryId,
          brandId,
          sortBy: sortConfig ? (sortConfig.key as string) : 'created_at',
          sortOrder: sortConfig ? sortConfig.direction : 'desc'
        }
      );
      setLocalProducts(data);
      setTotalProductCount(totalCount);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [pageSize, debouncedSearchTerm, selectedCategoryIds, selectedBrandIds, sortConfig, tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    fetchProducts(currentPage);
  }, [currentPage, pageSize, debouncedSearchTerm, selectedCategoryIds, selectedBrandIds, sortConfig, fetchProducts, tenantId]);

  const handleSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // Reset to page 1 when search term or category/brand filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoryIds, selectedBrandIds]);

  // Pagination Logic (Products)
  const totalPages = Math.max(1, Math.ceil(totalProductCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = localProducts;

  // V2 DataGrid pagination state
  const dataGridTotalPages = totalPages;
  const dataGridStartIndex = startIndex;
  const dataGridProducts = localProducts;

  // --- Bulk Actions ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Chỉ chọn các sản phẩm đang hiển thị trên trang hiện tại
      setSelectedIds(new Set(paginatedProducts.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectProduct = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDeleteAction = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Bạn có chắc chắn muốn xoá ${selectedIds.size} sản phẩm đã chọn?`)) {
      if (onBulkDelete) {
        onBulkDelete(Array.from(selectedIds));
        setSelectedIds(new Set());
      } else {
        // Fallback
        Array.from(selectedIds).forEach(id => onDeleteProduct(id));
        setSelectedIds(new Set());
      }
      fetchProducts(currentPage);
    }
  };

  const handleBulkUpdateCategory = () => {
    if (selectedIds.size === 0) return;
    setBulkUpdateType('category');
    setNewBulkValue('');
    setIsBulkUpdateModalOpen(true);
  };

  const handleBulkUpdateBrand = () => {
    if (selectedIds.size === 0) return;
    setBulkUpdateType('brand');
    setNewBulkValue('');
    setIsBulkUpdateModalOpen(true);
  };

  const handleConfirmBulkUpdate = () => {
    if (!bulkUpdateType || !newBulkValue) return;
    if (onBulkUpdate) {
      onBulkUpdate(Array.from(selectedIds), { [bulkUpdateType]: newBulkValue });
      setSelectedIds(new Set());
      setIsBulkUpdateModalOpen(false);
      fetchProducts(currentPage);
    }
  };

  // --- Product Handlers ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use lots-based quantity if lot management is active and lots exist
    let finalQuantity = formData.quantity || 0;
    if (formData.hasBatches && formData.lots && formData.lots.length > 0) {
      finalQuantity = formData.lots.reduce((sum, lot) => sum + lot.quantity, 0);
    }
    
    // Chuẩn hóa tên sản phẩm trước khi lưu
    const normalizedName = capitalizeProductName(formData.name || '');
    const normalizedDisplayName = capitalizeProductName(formData.displayName || formData.name || '');

    const finalProductData = { 
      ...formData, 
      name: normalizedName,
      displayName: normalizedDisplayName,
      quantity: finalQuantity,
    };
    
    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...finalProductData } as Product);
    } else {
      onAddProduct({
        ...finalProductData,
        id: crypto.randomUUID(),
        image: formData.image || `https://picsum.photos/200/200?random=${crypto.randomUUID()}`
      } as Product);
    }
    fetchProducts(currentPage);
    closeModal();
  };

  const openModal = (product?: Product) => {
    setActiveTab('general');
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product, conversionUnits: product.conversionUnits || [], lots: product.lots || [] });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        code: '',
        displayName: '',
        barcode: '',
        price: 0,
        cost: 0,
        quantity: 0,
        unit: 'Cái',
        category: '',
        brand: '',
        location: '',
        minStock: 0,
        maxStock: 100,
        safetyStock: 10,
        conversionUnits: [],
        lots: []
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // --- Logic for Units (Product Modal) ---
  const handleAddUnit = () => {
    if (!newUnit.name || !newUnit.ratio || !newUnit.price) return;
    const unit: UnitConversion = {
      id: crypto.randomUUID(),
      name: newUnit.name,
      ratio: Number(newUnit.ratio),
      price: Number(newUnit.price)
    };
    setFormData(prev => ({ ...prev, conversionUnits: [...(prev.conversionUnits || []), unit] }));
    setNewUnit({ name: '', ratio: 1, price: 0 });
  };
  const handleRemoveUnit = (id: string) => {
    setFormData(prev => ({ ...prev, conversionUnits: (prev.conversionUnits || []).filter(u => u.id !== id) }));
  };

  // --- Logic for Lots (Product Modal) ---
  const handleAddLot = () => {
    if (!newLot.code || !newLot.expiryDate || !newLot.quantity) return;
    // ✅ Phase 2C.1: Chặn duplicate lot code (case-insensitive, trimmed)
    const isDuplicate = (formData.lots || []).some(
      l => (l.code || '').trim().toUpperCase() === newLot.code!.trim().toUpperCase()
    );
    if (isDuplicate) {
      alert('Mã lô đã tồn tại trong sản phẩm.');
      return;
    }
    const lot: ProductLot = {
      id: crypto.randomUUID(),
      code: newLot.code,
      expiryDate: newLot.expiryDate,
      quantity: Number(newLot.quantity),
      originalQuantity: Number(newLot.quantity)
    };
    setFormData(prev => ({ ...prev, lots: [...(prev.lots || []), lot] }));
    setNewLot({ code: '', expiryDate: '', quantity: 0 });
  };
  const handleRemoveLot = (id: string) => {
    setFormData(prev => ({ ...prev, lots: (prev.lots || []).filter(l => l.id !== id) }));
  };

  // --- Excel Logic (Product) ---
   const handleDownloadSample = () => {
     const headers = [{ 'Mã sản phẩm (Bắt buộc)': 'SP001', 'Tên sản phẩm (Bắt buộc)': 'Áo thun', 'Giá vốn': 50000, 'Giá bán': 100000, 'Tồn kho': 100, 'Đơn vị': 'Cái', 'Danh mục': 'Thời trang', 'Thương hiệu': 'Nike', 'Mã vạch': '', 'Vị trí': '', 'Tối thiểu': 10 }];
     const ws = XLSX.utils.json_to_sheet(headers);
     ws['!cols'] = [
       { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
     ];
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Hang");
     XLSX.writeFile(wb, "mau_nhap_san_pham.xlsx");
   };

  const handleExportExcel = () => {
    const data = products.map((p, idx) => ({
      'STT': idx + 1,
      'Mã sản phẩm': p.code,
      'Tên sản phẩm': capitalizeProductName(p.name),
      'Giá vốn': p.cost,
      'Giá bán': p.price,
      'Tồn kho': p.quantity,
      'Đơn vị': p.unit,
      'Danh mục': p.category,
      'Thương hiệu': p.brand || '',
      'Mã vạch': p.barcode || '',
      'Vị trí': p.location || '',
      'Tối thiểu': p.minStock || 0
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 }, { wch: 18 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach_San_Pham");
    XLSX.writeFile(wb, "danh_sach_san_pham.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Chuyển sheet thành JSON dạng mảng 2 chiều
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        // Giới hạn số dòng import để tránh treo trình duyệt
        const MAX_IMPORT_ROWS = 5000;
        if (data.length - 1 > MAX_IMPORT_ROWS) {
          alert(`❌ File Excel có ${data.length - 1} dòng dữ liệu, vượt quá giới hạn ${MAX_IMPORT_ROWS} dòng. Vui lòng chia nhỏ file!`);
          setIsImporting(false);
          return;
        }
        
        // Lấy header (dòng đầu tiên)
        const headers = data[0] as string[];
        
        // Xác định index các cột với hỗ trợ loại trừ (excludes)
        const getIndex = (keywords: string[], excludes: string[] = []) => headers.findIndex(h => {
          const text = h?.toString().toLowerCase() || '';
          const hasKeyword = keywords.some(k => text.includes(k));
          const hasExclude = excludes.length > 0 && excludes.some(e => text.includes(e));
          return hasKeyword && !hasExclude;
        });

        const codeIndex = getIndex(['mã sản phẩm', 'mã sp', 'sku', 'code', 'mã']);
        const nameIndex = getIndex(['tên sản phẩm', 'tên sp', 'name', 'tên']);
        
        // Giá vốn: ưu tiên từ khoá 'vốn', 'cost', 'giá nhập'. Không dùng 'nhập' vì quá rộng (có thể trùng "Ngày nhập", "Kho nhập")
        const costIndex = getIndex(['giá vốn', 'vốn', 'cost', 'giá nhập']);
        
        // Giá bán: tìm 'giá bán', 'price'. Nếu chỉ tìm 'giá', phải LOẠI TRỪ 'vốn', 'nhập' để tránh nhầm cột Giá vốn
        const priceIndex = getIndex(['giá bán', 'giá lẻ', 'price', 'giá'], ['vốn', 'nhập', 'cost']);
        
        const quantityIndex = getIndex(['tồn kho', 'số lượng', 'sl', 'quantity']);
        const unitIndex = getIndex(['đơn vị', 'đvt', 'unit']);
        const categoryIndex = getIndex(['danh mục', 'ngành hàng', 'category']);
        const barcodeIndex = getIndex(['mã vạch', 'barcode', 'mã quét']);
        const locationIndex = getIndex(['vị trí', 'kho', 'location']);
        const minStockIndex = getIndex(['tối thiểu', 'min stock', 'định mức']);
        const brandIndex = getIndex(['thương hiệu', 'brand', 'nhãn']);

        // Kiểm tra các cột bắt buộc
        if (codeIndex === -1 || nameIndex === -1) {
          alert('❌ File Excel thiếu cột "Mã sản phẩm" hoặc "Tên sản phẩm"!');
          setIsImporting(false);
          return;
        }

        // Tạo Map để tìm kiếm nhanh sản phẩm hiện có
        const productByCode = new Map<string, Product>();
        const productByName = new Map<string, Product>();
        
        // Chuẩn hoá string để so sánh
        const normalizeString = (str: string): string => {
          return str?.toString().trim().toLowerCase().replace(/\s+/g, ' ') || '';
        };
        
        products.forEach(product => {
          if (product.code) {
            productByCode.set(normalizeString(product.code), product);
          }
          if (product.name) {
            productByName.set(normalizeString(product.name), product);
          }
        });

        // Xử lý dữ liệu
        let errorCount = 0;
        const errors: string[] = [];
        const updates: { old: Product; new: Partial<Product> }[] = [];
        const inserts: Product[] = [];

        // Phase 3.1: Sets để thu thập category/brand mới chưa tồn tại
        const newCategorySet = new Set<string>();
        const newBrandSet = new Set<string>();
        const existingCatNames = new Set(categories.map(c => normalizeString(c.name)));
        const existingBrandNames = new Set(brands.map(b => normalizeString(b.name)));

        // Hàm xử lý số
        const parseNumber = (val: any): number => {
          if (val === undefined || val === null || val === '') return 0;
          const strVal = String(val).replace(/,/g, '').trim();
          const num = parseFloat(strVal);
          return isNaN(num) ? 0 : num;
        };

        // Deduplication map để tránh import trùng mã/tên trong cùng file
        const fileDedup = new Map<string, any>();
        
        // Duyệt từ dòng 2 trở đi
        for (let i = 1; i < data.length; i++) {
          const row = data[i] as any[];
          if (!row || row.length === 0 || row.every(cell => !cell)) continue;

          try {
            // Lấy dữ liệu cơ bản
            const rawCode = row[codeIndex]?.toString().trim() || '';
            const rawName = capitalizeProductName(row[nameIndex]?.toString().trim() || '');
            
            if (!rawCode && !rawName) {
              errorCount++;
              errors.push(`Dòng ${i + 1}: Thiếu cả mã và tên sản phẩm`);
              continue;
            }

            const normalizedCode = normalizeString(rawCode);
            const normalizedName = normalizeString(rawName);
            
            // Kiểm tra dedup trong file: ưu tiên mã, fallback tên
            const dedupKey = normalizedCode || normalizedName;
            if (fileDedup.has(dedupKey)) {
              // Ghi đè dòng trước bằng dòng hiện tại (dòng sau có ưu tiên)
              fileDedup.set(dedupKey, { rowIndex: i, rawCode, rawName, row });
              continue;
            }
            fileDedup.set(dedupKey, { rowIndex: i, rawCode, rawName, row });
            continue; // Lưu vào map, xử lý sau
          } catch (err) {
            errorCount++;
            errors.push(`Dòng ${i + 1}: Lỗi xử lý dữ liệu - ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        // Xử lý dữ liệu từ fileDedup
        for (const { rowIndex, rawCode, rawName, row } of fileDedup.values()) {
          try {
            const normalizedCode = normalizeString(rawCode);
            const normalizedName = normalizeString(rawName);

            // Xử lý các trường khác
            const cost = parseNumber(row[costIndex]);
            const price = parseNumber(row[priceIndex]);
            const quantity = parseNumber(row[quantityIndex]);
            
            let unit = row[unitIndex]?.toString().trim();
            if (!unit) unit = 'Cái';
            
            let category = row[categoryIndex]?.toString().trim();
            if (!category) category = 'Chưa phân loại';

            // Phase 3.1: Thu thập category/brand mới
            if (category && category !== 'Chưa phân loại') {
              const catKey = normalizeString(category);
              if (!existingCatNames.has(catKey)) newCategorySet.add(category);
            }
            const brand = row[brandIndex]?.toString().trim();
            if (brand) {
              const brandKey = normalizeString(brand);
              if (!existingBrandNames.has(brandKey)) newBrandSet.add(brand);
            }

            // Tìm sản phẩm hiện có
            let existingProduct: Product | undefined;
            
            // Ưu tiên tìm theo mã
            if (normalizedCode && productByCode.has(normalizedCode)) {
              existingProduct = productByCode.get(normalizedCode);
            }
            // Nếu không tìm thấy theo mã, tìm theo tên
            else if (normalizedName && productByName.has(normalizedName)) {
              existingProduct = productByName.get(normalizedName);
            }

            if (existingProduct) {
              // Chỉ cập nhật những trường có trong file Excel (ghi đè những gì khác biệt)
              const updateData: Partial<Product> = {};
              if (nameIndex !== -1 && row[nameIndex] !== undefined && row[nameIndex] !== null) {
                updateData.name = capitalizeProductName(row[nameIndex].toString().trim());
                updateData.displayName = updateData.name;
              }
              if (codeIndex !== -1 && row[codeIndex] !== undefined && row[codeIndex] !== null) {
                updateData.code = row[codeIndex].toString().trim();
              }
              if (costIndex !== -1 && row[costIndex] !== undefined && row[costIndex] !== null) {
                updateData.cost = parseNumber(row[costIndex]);
              }
              if (priceIndex !== -1 && row[priceIndex] !== undefined && row[priceIndex] !== null) {
                updateData.price = parseNumber(row[priceIndex]);
              }
              if (quantityIndex !== -1 && row[quantityIndex] !== undefined && row[quantityIndex] !== null) {
                updateData.quantity = parseNumber(row[quantityIndex]);
              }
              if (unitIndex !== -1 && row[unitIndex] !== undefined && row[unitIndex] !== null) {
                updateData.unit = row[unitIndex].toString().trim();
              }
              if (categoryIndex !== -1 && row[categoryIndex] !== undefined && row[categoryIndex] !== null) {
                updateData.category = row[categoryIndex].toString().trim();
                // Resolve categoryId from name
                const matchedCat = categories.find(c => c.name.toLowerCase().trim() === updateData.category!.toLowerCase().trim());
                if (matchedCat) updateData.categoryId = matchedCat.id;
              }
              if (barcodeIndex !== -1 && row[barcodeIndex] !== undefined && row[barcodeIndex] !== null) {
                updateData.barcode = row[barcodeIndex].toString().trim();
              }
              if (locationIndex !== -1 && row[locationIndex] !== undefined && row[locationIndex] !== null) {
                updateData.location = row[locationIndex].toString().trim();
              }
              if (minStockIndex !== -1 && row[minStockIndex] !== undefined && row[minStockIndex] !== null) {
                updateData.minStock = parseNumber(row[minStockIndex]);
              }
              
              if (brandIndex !== -1 && row[brandIndex] !== undefined && row[brandIndex] !== null) {
                updateData.brand = row[brandIndex].toString().trim();
                // Resolve brandId from name
                const matchedBrand = brands.find(b => b.name.toLowerCase().trim() === updateData.brand!.toLowerCase().trim());
                if (matchedBrand) updateData.brandId = matchedBrand.id;
              }
              // Lưu vào danh sách cập nhật
              updates.push({ old: existingProduct, new: updateData });
            } else {
              // Thêm sản phẩm mới với các giá trị mặc định cho cột thiếu
              const newProduct: Product = {
                id: crypto.randomUUID(),
                name: rawName || 'Sản Phẩm Mới',
                code: rawCode || `SP${crypto.randomUUID().slice(0, 8)}`,
                cost: cost,
                price: price,
                quantity: quantity,
                unit: unit || 'Cái',
                category: category || 'Chưa phân loại',
                barcode: barcodeIndex !== -1 ? row[barcodeIndex]?.toString().trim() : '',
                location: locationIndex !== -1 ? row[locationIndex]?.toString().trim() : '',
                minStock: minStockIndex !== -1 ? parseNumber(row[minStockIndex]) : 0,
                displayName: rawName || 'Sản Phẩm Mới',
                maxStock: 100,
                safetyStock: 10,
                conversionUnits: [],
                lots: [],
                brand: brand || '',
                image: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 10000)}`
              };
              inserts.push(newProduct);
            }

          } catch (err) {
            errorCount++;
            errors.push(`Dòng ${rowIndex + 1}: Lỗi xử lý dữ liệu - ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        // Khai báo biến createdItems (sẽ được tạo thực tế sau khi xác nhận)
        let createdItems: string[] = [];

        // Logic xác nhận và cập nhật
        const proceedWithUpdate = async () => {
          if (updates.length > 0) {
            const confirmMessage = 
              `🔍 Phát hiện ${updates.length} sản phẩm sẽ được CẬP NHẬT (ghi đè):\n\n` +
              updates.slice(0, 5).map(u => 
                `- ${u.old.name} (${u.old.code}) → Giá: ${u.new.price}, Tồn: ${u.new.quantity}`
              ).join('\n') +
              (updates.length > 5 ? `\n... và ${updates.length - 5} sản phẩm khác` : '') +
              `\n\n✅ ${inserts.length} sản phẩm sẽ được THÊM MỚI\n` +
              `❌ ${errorCount} dòng lỗi\n\n` +
              `Bạn có muốn tiếp tục cập nhật các sản phẩm này không?`;

            if (!window.confirm(confirmMessage)) {
              // Người dùng từ chối cập nhật -> Chỉ thêm mới
              if (inserts.length > 0) {
                 if (onBulkImport) {
                    onBulkImport(inserts, []);
                 } else {
                    inserts.forEach(p => onAddProduct(p));
                 }
                 alert(`✅ Đã thêm mới ${inserts.length} sản phẩm (Bỏ qua cập nhật).`);
              } else {
                 alert('❌ Đã huỷ thao tác import.');
              }
              return;
            }
          }

          // Phase 3.3: Tự động tạo category/brand mới sau khi đã xác nhận import
          if (newCategorySet.size > 0 || newBrandSet.size > 0) {
            // Tạo category trước
            for (const catName of newCategorySet) {
              try {
                await onAddCategory(catName);
                createdItems.push(`Danh mục "${catName}"`);
              } catch (e) {
                console.warn(`Không thể tạo danh mục "${catName}":`, e);
              }
            }
            // Tạo brand sau
            for (const brandName of newBrandSet) {
              try {
                await onAddBrand(brandName);
                createdItems.push(`Thương hiệu "${brandName}"`);
              } catch (e) {
                console.warn(`Không thể tạo thương hiệu "${brandName}":`, e);
              }
            }
          }

          // Chuẩn bị danh sách cập nhật cuối cùng
          const finalUpdates = updates.map(({ old, new: newData }) => ({
            ...old,
            ...newData,
            id: old.id,
            // Bảo toàn dữ liệu phức tạp
            image: old.image,
            conversionUnits: old.conversionUnits || [],
            lots: old.lots || []
          }));

          // Thực hiện Bulk Import
          if (onBulkImport) {
            onBulkImport(inserts, finalUpdates);
             alert(`✅ Import hoàn tất!\n` +
                  `📝 Cập nhật: ${finalUpdates.length} sản phẩm\n` +
                  `✨ Thêm mới: ${inserts.length} sản phẩm\n` +
                  (createdItems.length > 0 ? `🆕 Đã tạo mới: ${createdItems.length} danh mục/thương hiệu\n` : '') +
                  (errorCount > 0 ? `⚠️ Lỗi: ${errorCount} dòng` : ''));
          } else {
            // Fallback nếu không có bulk import (không tối ưu nhưng hoạt động)
             inserts.forEach(p => onAddProduct(p));
            finalUpdates.forEach(p => onUpdateProduct(p));
             alert('✅ Import hoàn tất (Chế độ tương thích)!' +
                   (createdItems.length > 0 ? `\n🆕 Đã tạo mới: ${createdItems.join(', ')}` : ''));
          }
        };

        // Thực thi logic
        await proceedWithUpdate();
        fetchProducts(currentPage);

        // Hiển thị chi tiết lỗi nếu có
        if (errors.length > 0) {
          console.warn('Chi tiết lỗi:', errors);
        }

      } catch (error) {
        console.error('Lỗi import Excel:', error);
        alert('❌ Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra định dạng file!');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      alert('❌ Không thể đọc file. Vui lòng thử lại!');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsImporting(false);
    };

    reader.readAsBinaryString(file);
  };

  // === V2 DataGrid helpers ===
  const handleDataGridSort = (key: string, direction: SortDirection) => {
    if (direction === 'none') {
      setSortConfig(null);
    } else {
      setSortConfig({ key: key as keyof Product, direction });
    }
  };

  const getStockStatus = (product: Product) => {
    const qty = product.quantity ?? 0;
    const minStock = product.minStock || 10;
    if (qty <= 0) return { type: 'danger' as const, label: 'Hết hàng', className: 'out' };
    if (qty < minStock) return { type: 'warning' as const, label: 'Sắp hết', className: 'low' };
    return { type: 'success' as const, label: 'Còn hàng', className: 'ok' };
  };

  const inventoryColumns: DataGridColumn<Product>[] = [
    {
      key: 'stt',
      label: 'STT',
      align: 'center',
      width: '48px',
      render: (_, index) => dataGridStartIndex + index + 1,
    },
    { key: 'code', label: 'Mã SP', sortable: true },
    {
      key: 'name',
      label: 'Tên',
      sortable: true,
      render: (product) => (
        <div className="inventory-v2-product-name">
          <span className="inventory-v2-name">{product.name}</span>
          {product.brand && <span className="inventory-v2-sub">{product.brand}</span>}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Danh mục',
      sortable: true,
      render: (product) => product.category || '—',
    },
    {
      key: 'cost',
      label: 'Giá vốn',
      sortable: true,
      align: 'right',
      render: (product) => `${(product.cost ?? 0).toLocaleString('vi-VN')} ₫`,
    },
    {
      key: 'price',
      label: 'Giá bán',
      sortable: true,
      align: 'right',
      render: (product) => `${(product.price ?? 0).toLocaleString('vi-VN')} ₫`,
    },
    {
      key: 'quantity',
      label: 'Tồn kho',
      sortable: true,
      align: 'center',
      render: (product) => {
        const qty = product.quantity ?? 0;
        const status = getStockStatus(product);
        let stockText = `${qty} ${product.unit || ''}`.trim();
        if (qty <= 0) stockText = qty === 0 ? 'Hết hàng' : `Âm (${qty})`;
        return <span className={`prd-stock ${status.className}`}>{stockText}</span>;
      },
    },
    {
      key: 'status',
      label: 'Trạng thái',
      align: 'center',
      render: (product) => {
        const status = getStockStatus(product);
        return <StatusBadge label={status.label} type={status.type} size="sm" />;
      },
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center',
      render: (product) => (
        <div className="inventory-v2-actions">
          {permissions.canUpdateProduct && (
          <ActionButton
            variant="ghost"
            size="sm"
            icon={<Edit size={16} />}
            onClick={() => openModal(product)}
            aria-label="Chỉnh sửa"
          />
          )}
          {permissions.canDeleteProduct && (
          <ActionButton
            variant="ghost"
            size="sm"
            icon={<Trash2 size={16} />}
            onClick={() => onDeleteProduct(product.id)}
            aria-label="Xoá"
          />
          )}
        </div>
      ),
    },
  ];

  return (
    <PageLayout>
      <style>{`
        /* ===== PRODUCTS TABLE — Legacy styles kept for table content ===== */
        .prd-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .prd-table thead { background: transparent; }
        .prd-table thead th {
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
        .prd-table thead th.sortable { cursor: pointer; transition: color 0.15s ease; }
        .prd-table thead th.sortable:hover { color: #475569; }
        .prd-table thead th.active { color: #7C3AED; }
        .prd-table tbody tr {
          border-bottom: 1px solid #F8FAFC;
          transition: background 0.15s ease;
        }
        .prd-table tbody tr:hover { background: rgba(248, 250, 252, 0.6); }
        .prd-table tbody tr.selected { background: #F5F3FF; }
        .prd-table tbody td {
          padding: 16px 12px;
          font-size: var(--vsp-font-size-base);
          color: #000000;
          vertical-align: middle;
        }
        .prd-table tbody tr:hover .prd-name { color: #000000; }
        .prd-name {
          font-size: var(--vsp-font-size-base);
          font-weight: var(--vsp-font-weight-medium);
          color: #000000;
          transition: color 0.15s ease;
        }
        .prd-thumb {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid #F1F5F9;
          flex-shrink: 0;
        }
        .prd-thumb-empty {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #F8FAFC;
          border: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #CBD5E1;
          flex-shrink: 0;
        }
        .prd-sub {
          font-size: var(--vsp-font-size-base);
          color: #000000;
          margin-top: 2px;
        }
        .prd-code {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: var(--vsp-font-size-base);
          font-weight: var(--vsp-font-weight-bold);
          color: #000000;
          background: #F8FAFC;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .prd-price {
          font-size: var(--vsp-font-size-base);
          font-weight: var(--vsp-font-weight-bold);
          color: #000000;
        }
        .prd-stock {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: var(--vsp-font-size-base);
          font-weight: var(--vsp-font-weight-bold);
          line-height: 1;
        }
        .prd-stock.ok { background: #ECFDF5; color: #000000; }
        .prd-stock.low { background: #FFFBEB; color: #000000; }
        .prd-stock.out { background: #FEF2F2; color: #000000; }
        .prd-action-btn {
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
        .prd-action-btn.edit:hover { background: #F1F5F9; color: #475569; }
        .prd-action-btn.delete:hover { background: #FEF2F2; color: #DC2626; }
        .prd-stt {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
          padding: 0 8px;
          border-radius: 6px;
          background: #F1F5F9;
          color: #475569;
          font-size: var(--vsp-font-size-sm);
          font-weight: var(--vsp-font-weight-semibold);
        }
      `}</style>
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="inv-title-icon">
              <Package className="w-4 h-4" />
            </span>
            <div>
              <h2 className="page-title">Danh mục sản phẩm</h2>
              <p className="page-subtitle">Quản lý danh mục và tồn kho sản phẩm</p>
            </div>
          </div>
        </div>

           <div className="filter-bar">
              {/* Search Box */}
              <div className="filter-bar__search">
                <Search className="filter-bar__search-icon" />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm, mã, barcode, thương hiệu…"
                  className="filter-bar__search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  onClick={() => { setScannerMode('search'); setIsScannerOpen(true); }}
                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors mr-1"
                  title="Quét mã vạch"
                >
                  <ScanBarcode className="w-4 h-4" />
                </button>
              </div>

              {/* Category Dropdown Filter */}
              <div className="filter-bar__dropdown z-[300]">
                <button
                  onClick={() => { setIsCategoryFilterOpen(!isCategoryFilterOpen); setIsBrandFilterOpen(false); }}
                  className={`filter-bar__trigger ${selectedCategoryIds.size > 0 ? 'filter-bar__trigger--active' : ''}`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Danh mục {selectedCategoryIds.size > 0 ? `(${selectedCategoryIds.size})` : ''}</span>
                  <ChevronDown className={`filter-bar__chevron ${isCategoryFilterOpen ? 'filter-bar__chevron--open' : ''}`} />
                </button>

                {isCategoryFilterOpen && (
                  <div className="filter-bar__menu filter-bar__menu--right">
                    <div className="filter-bar__menu-header">
                      <div className="filter-bar__menu-search">
                        <Search className="w-3.5 h-3.5" />
                        <input
                          type="text"
                          placeholder="Tìm danh mục..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                        />
                      </div>
                      <div className="filter-bar__menu-actions">
                        <button
                          onClick={() => setSelectedCategoryIds(new Set())}
                          className="filter-bar__menu-action"
                        >
                          Xoá lọc
                        </button>
                        <button
                          onClick={() => {
                            const name = prompt("Nhập tên danh mục mới:");
                            if (name) onAddCategory(name);
                          }}
                          className="filter-bar__menu-action filter-bar__menu-action--success"
                        >
                          <Plus className="w-2.5 h-2.5" /> Thêm mới
                        </button>
                      </div>
                    </div>
                    <div className="filter-bar__menu-scroll">
                      {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).map(cat => (
                        <div key={cat.id} className="filter-bar__option filter-bar__option--complex">
                          <div
                            className="filter-bar__option-main"
                            onClick={() => {
                              const newSet = new Set(selectedCategoryIds);
                              if (newSet.has(cat.id)) newSet.delete(cat.id);
                              else newSet.add(cat.id);
                              setSelectedCategoryIds(newSet);
                            }}
                          >
                            <div className={`filter-bar__check ${selectedCategoryIds.has(cat.id) ? 'filter-bar__check--checked' : ''}`}>
                              {selectedCategoryIds.has(cat.id) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="filter-bar__option-label">{cat.name}</span>
                          </div>
                          <div className="filter-bar__option-actions">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newName = prompt("Sửa tên danh mục:", cat.name);
                                if (newName && newName !== cat.name) onUpdateCategory(cat.id, newName);
                              }}
                              className="filter-bar__option-action"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCategory(cat.id);
                              }}
                              className="filter-bar__option-action filter-bar__option-action--danger"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Brand Dropdown Filter */}
              <div className="filter-bar__dropdown z-[300]">
                <button
                  onClick={() => { setIsBrandFilterOpen(!isBrandFilterOpen); setIsCategoryFilterOpen(false); }}
                  className={`filter-bar__trigger ${selectedBrandIds.size > 0 ? 'filter-bar__trigger--active' : ''}`}
                >
                  <Box className="w-4 h-4" />
                  <span>Thương hiệu {selectedBrandIds.size > 0 ? `(${selectedBrandIds.size})` : ''}</span>
                  <ChevronDown className={`filter-bar__chevron ${isBrandFilterOpen ? 'filter-bar__chevron--open' : ''}`} />
                </button>

                {isBrandFilterOpen && (
                  <div className="filter-bar__menu filter-bar__menu--right">
                    <div className="filter-bar__menu-header">
                      <div className="filter-bar__menu-search">
                        <Search className="w-3.5 h-3.5" />
                        <input
                          type="text"
                          placeholder="Tìm thương hiệu..."
                          value={brandSearch}
                          onChange={(e) => setBrandSearch(e.target.value)}
                        />
                      </div>
                      <div className="filter-bar__menu-actions">
                        <button
                          onClick={() => setSelectedBrandIds(new Set())}
                          className="filter-bar__menu-action"
                        >
                          Xoá lọc
                        </button>
                        <button
                          onClick={() => {
                            const name = prompt("Nhập tên thương hiệu mới:");
                            if (name) onAddBrand(name);
                          }}
                          className="filter-bar__menu-action filter-bar__menu-action--success"
                        >
                          <Plus className="w-2.5 h-2.5" /> Thêm mới
                        </button>
                      </div>
                    </div>
                    <div className="filter-bar__menu-scroll">
                      {brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase())).map(brand => (
                        <div key={brand.id} className="filter-bar__option filter-bar__option--complex">
                          <div
                            className="filter-bar__option-main"
                            onClick={() => {
                              const newSet = new Set(selectedBrandIds);
                              if (newSet.has(brand.id)) newSet.delete(brand.id);
                              else newSet.add(brand.id);
                              setSelectedBrandIds(newSet);
                            }}
                          >
                            <div className={`filter-bar__check ${selectedBrandIds.has(brand.id) ? 'filter-bar__check--checked' : ''}`}>
                              {selectedBrandIds.has(brand.id) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="filter-bar__option-label">{brand.name}</span>
                          </div>
                          <div className="filter-bar__option-actions">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newName = prompt("Sửa tên thương hiệu:", brand.name);
                                if (newName && newName !== brand.name) onUpdateBrand(brand.id, newName);
                              }}
                              className="filter-bar__option-action"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteBrand(brand.id);
                              }}
                              className="filter-bar__option-action filter-bar__option-action--danger"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSort('name')}
                className={`filter-bar__trigger ${sortConfig?.key === 'name' ? 'filter-bar__trigger--active' : ''}`}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden lg:inline">{sortConfig?.key === 'name' && sortConfig.direction === 'desc' ? 'Tên Z-A' : 'Tên A-Z'}</span>
              </button>

              {/* Excel Actions */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                 <button onClick={handleDownloadSample} className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded flex items-center gap-1 text-sm font-medium"><FileSpreadsheet className="w-4 h-4"/><span className="hidden sm:inline">Mẫu</span></button>
                 <div className="w-px h-6 bg-slate-200 mx-1"></div>
                 <button 
                   onClick={() => !isImporting && fileInputRef.current?.click()} 
                   disabled={isImporting}
                   className={`p-2 rounded flex items-center gap-1 text-sm font-medium ${isImporting ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-100'}`}
                 >
                   {isImporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
                   <span className="hidden sm:inline">{isImporting ? 'Đang nhập...' : 'Nhập'}</span>
                 </button>
                 <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx, .xls"/>
                 <div className="w-px h-6 bg-slate-200 mx-1"></div>
                 <button onClick={handleExportExcel} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded flex items-center gap-1 text-sm font-medium"><Download className="w-4 h-4"/><span className="hidden sm:inline">Xuất</span></button>
              </div>

              {/* Bulk Delete */}
              {useNewDataGridInventory && permissions.canDeleteProduct && selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDeleteAction}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Xóa ({selectedIds.size})
                </button>
              )}

              {permissions.canCreateProduct && (
              <button onClick={() => openModal()} className="btn-primary"><Plus className="w-4 h-4" /> Thêm sản phẩm</button>
              )}
           </div>
      </div>
        <>
            {/* ===== 5 STAT CARDS — server-side product stats ===== */}
            {(() => {
              const totalProducts = productStats.total;
              const activeProducts = productStats.active;
              const lowStockProducts = productStats.lowStock;
              const outOfStockProducts = productStats.outOfStock;
              const inventoryValue = productStats.inventoryValue;
              const activePercent = totalProducts > 0 ? ((activeProducts / totalProducts) * 100).toFixed(1) : '0';
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                  <div className="inv-stat-card">
                    <div className="inv-stat-icon purple"><Package className="w-6 h-6" /></div>
                    <div className="inv-stat-body">
                      <div className="inv-stat-value">{totalProducts.toLocaleString('vi-VN')}</div>
                      <div className="inv-stat-label">Tổng sản phẩm</div>
                      <div className="inv-stat-sub">Toàn bộ danh mục</div>
                    </div>
                  </div>

                  <div className="inv-stat-card">
                    <div className="inv-stat-icon blue"><Bookmark className="w-6 h-6" /></div>
                    <div className="inv-stat-body">
                      <div className="inv-stat-value">{activeProducts.toLocaleString('vi-VN')}</div>
                      <div className="inv-stat-label">Sản phẩm hoạt động</div>
                      <div className="inv-stat-sub up">{activePercent}% tổng số sản phẩm</div>
                    </div>
                  </div>

                  <div className="inv-stat-card">
                    <div className="inv-stat-icon orange"><AlertCircle className="w-6 h-6" /></div>
                    <div className="inv-stat-body">
                      <div className="inv-stat-value">{lowStockProducts.toLocaleString('vi-VN')}</div>
                      <div className="inv-stat-label">Sắp hết hàng</div>
                      <div className="inv-stat-sub warn">Cần nhập hàng sớm</div>
                    </div>
                  </div>

                  <div className="inv-stat-card">
                    <div className="inv-stat-icon red"><Box className="w-6 h-6" /></div>
                    <div className="inv-stat-body">
                      <div className="inv-stat-value">{outOfStockProducts.toLocaleString('vi-VN')}</div>
                      <div className="inv-stat-label">Hết hàng</div>
                      <div className="inv-stat-sub down">Ngừng kinh doanh tạm thời</div>
                    </div>
                  </div>

                  <div className="inv-stat-card">
                    <div className="inv-stat-icon green"><Wallet className="w-6 h-6" /></div>
                    <div className="inv-stat-body">
                      <div className="inv-stat-value money">{inventoryValue.toLocaleString('vi-VN')}đ</div>
                      <div className="inv-stat-label">Giá trị tồn kho</div>
                      <div className="inv-stat-sub">Tổng giá trị hàng hoá</div>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* ===== BOX CHÍNH (Desktop Table) — V2 DataGrid / Legacy ===== */}
          {useNewDataGridInventory ? (
            <DataGridBox innerRef={productsDataGridBoxRef} className="hidden md:flex">
              <DataGrid
                className="flex-1 min-h-0"
                embedded
                data={dataGridProducts}
                columns={inventoryColumns}
                keyExtractor={(product) => product.id}
                loading={isLoadingProducts && dataGridProducts.length === 0}
                selectedRows={Array.from(selectedIds)}
                onSelectionChange={(ids) => setSelectedIds(new Set(ids as string[]))}
                onRowClick={openModal}
                sortKey={sortConfig?.key}
                sortDirection={sortConfig?.direction || 'none'}
                onSortChange={handleDataGridSort}
                pagination={{
                  currentPage,
                  totalPages: dataGridTotalPages,
                  totalCount: totalProductCount,
                  pageSize,
                  onPageChange: setCurrentPage,
                  showInfo: false,
                }}
                emptyTitle="Không tìm thấy sản phẩm nào"
                emptyDescription="Thử tìm kiếm với từ khóa khác hoặc thêm sản phẩm mới."
                emptyAction={
                  permissions.canCreateProduct ? (
                  <ActionButton variant="primary" size="md" icon={<Plus size={18} />} onClick={() => openModal()}>
                    Thêm sản phẩm
                  </ActionButton>
                  ) : undefined
                }
              />
            </DataGridBox>
          ) : (
            <DataGridBox innerRef={productsDataGridBoxRef} className="hidden md:flex">
              <div className="flex-1 min-h-0 overflow-x-auto -mx-6 px-6">
                <table className="prd-table align-middle">
                  <colgroup>
                    <col />     {/* checkbox */}
                    <col className="w-16" />     {/* STT */}
                    <col />     {/* Sản phẩm */}
                    <col />    {/* Mã SP */}
                    <col />    {/* Giá vốn */}
                    <col />    {/* Giá bán */}
                    <col />    {/* Tồn kho */}
                    <col />    {/* Thao tác */}
                  </colgroup>
                  <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                        checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.has(p.id))}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-center">STT</th>
                    <th className={`sortable ${sortConfig?.key === 'name' ? 'active' : ''}`} onClick={() => handleSort('name')}>
                      <span className="inline-flex items-center gap-1">Sản phẩm <ArrowUpDown className="w-3 h-3"/></span>
                    </th>
                    <th className={`sortable ${sortConfig?.key === 'code' ? 'active' : ''}`} onClick={() => handleSort('code' as any)}>
                      <span className="inline-flex items-center gap-1">Mã SP <ArrowUpDown className="w-3 h-3"/></span>
                    </th>
                    <th className={`sortable ${sortConfig?.key === 'cost' ? 'active' : ''}`} onClick={() => handleSort('cost' as any)}>
                      <span className="inline-flex items-center justify-end gap-1 w-full">Giá vốn <ArrowUpDown className="w-3 h-3"/></span>
                    </th>
                    <th className={`sortable ${sortConfig?.key === 'price' ? 'active' : ''}`} onClick={() => handleSort('price')}>
                      <span className="inline-flex items-center justify-end gap-1 w-full">Giá bán <ArrowUpDown className="w-3 h-3"/></span>
                    </th>
                    <th className={`sortable ${sortConfig?.key === 'quantity' ? 'active' : ''}`} onClick={() => handleSort('quantity' as any)}>
                      <span className="inline-flex items-center justify-center gap-1 w-full">Tồn kho <ArrowUpDown className="w-3 h-3"/></span>
                    </th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingProducts && paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
                        <p className="text-slate-400">Đang tải sản phẩm...</p>
                      </td>
                    </tr>
                  ) : paginatedProducts.length > 0 ? (
                    paginatedProducts.map((product: any, index: number) => {
                      const qty = product.quantity ?? 0;
                      const minStock = product.minStock || 10;
                      let stockClass = 'ok';
                      let stockText = `${qty} ${product.unit || ''}`.trim();
                      if (qty <= 0) {
                        stockClass = 'out';
                        stockText = qty === 0 ? 'Hết hàng' : `Âm (${qty})`;
                      } else if (qty < minStock) {
                        stockClass = 'low';
                      }
                      const isSelected = selectedIds.has(product.id);
                      return (
                        <tr key={product.id} className={`group ${isSelected ? 'selected' : ''}`}>
                          <td>
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                              checked={isSelected}
                              onChange={() => handleSelectProduct(product.id)}
                            />
                          </td>
                          <td className="text-center">
                            <span className="prd-stt">{startIndex + index + 1}</span>
                          </td>
                          <td>
                            <div
                              className="flex items-center gap-3 cursor-pointer"
                              onClick={() => openModal(product)}
                              title="Nhấn để chỉnh sửa"
                            >
                              <div className="min-w-0">
                                <p className="prd-name truncate">{product.name}</p>
                                <p className="prd-sub truncate">{product.brand || product.category || '—'}</p>
                              </div>
                            </div>
                          </td>
                           <td>
                             {product.code ? (
                               <span className="prd-code">{product.code}</span>
                             ) : (
                               <span className="text-black">—</span>
                             )}
                           </td>
                           <td className="text-right text-black">
                             {(product.cost ?? 0).toLocaleString('vi-VN')} ₫
                           </td>
                          <td className="text-right">
                            <span className="prd-price">{(product.price ?? 0).toLocaleString('vi-VN')} ₫</span>
                          </td>
                          <td className="text-center">
                            <span className={`prd-stock ${stockClass}`}>{stockText}</span>
                          </td>
                          <td className="text-right">
                            <div className="inline-flex items-center gap-1">
                              {permissions.canUpdateProduct && (
                              <button
                                onClick={() => openModal(product)}
                                className="prd-action-btn edit"
                                title="Chỉnh sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              )}
                              {permissions.canDeleteProduct && (
                              <button
                                onClick={() => onDeleteProduct(product.id)}
                                className="prd-action-btn delete"
                                title="Xoá"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="prd-table-empty">
                        Không tìm thấy sản phẩm nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ===== Pagination — Đồng bộ Suppliers ===== */}
            {paginatedProducts.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 mt-4 border-t border-slate-100">
                <div className="text-sm text-slate-400">
                  Hiển thị <span className="font-medium text-slate-700">{startIndex + 1} - {Math.min(startIndex + pageSize, totalProductCount)}</span> trên tổng số <span className="font-medium text-slate-700">{totalProductCount}</span> sản phẩm
                </div>
                <nav className="inline-flex items-center gap-1 rounded-xl bg-slate-50 p-1" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {(() => {
                    const tp = totalPages || 1;
                    const cur = currentPage;
                    const pages: (number | 'dots')[] = [];
                    const push = (n: number | 'dots') => pages.push(n);
                    if (tp <= 7) {
                      for (let i = 1; i <= tp; i++) push(i);
                    } else {
                      push(1);
                      if (cur > 4) push('dots');
                      const start = Math.max(2, cur - 1);
                      const end = Math.min(tp - 1, cur + 1);
                      for (let i = start; i <= end; i++) push(i);
                      if (cur < tp - 3) push('dots');
                      push(tp);
                    }
                    return pages.map((p, idx) =>
                      p === 'dots' ? (
                        <span key={`d-${idx}`} className="px-2 text-slate-400 text-sm select-none">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`inline-flex items-center justify-center min-w-[32px] h-[32px] text-sm font-semibold rounded-lg transition-all ${
                            p === cur
                              ? 'bg-white text-purple-600 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    );
                  })()}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="inline-flex items-center p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Trang sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              </div>
            )}
          </DataGridBox>
          )}

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && !useNewDataGridInventory && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 shadow-xl rounded-2xl px-6 py-3 flex items-center gap-4 z-50 animate-fade-in-up">
              <div className="text-sm font-bold text-gray-700 whitespace-nowrap">
                Đã chọn <span className="text-indigo-600">{selectedIds.size}</span> sản phẩm
              </div>
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <button onClick={handleBulkUpdateCategory} className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  Sửa danh mục
                </button>
                <button onClick={handleBulkUpdateBrand} className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  Sửa thương hiệu
                </button>
                <button onClick={handleBulkDeleteAction} className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1">
                  <Trash2 className="w-4 h-4" /> Xoá
                </button>
              </div>
              <button onClick={() => setSelectedIds(new Set())} className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ===== Mobile Card View (Products) — REDESIGNED ===== */}
          <div className="md:hidden space-y-3 flex-1 overflow-y-auto pb-20">
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((product: any) => {
                const qty = product.quantity ?? 0;
                const minStock = product.minStock || 10;
                let stockClass = 'ok';
                let stockText = `${qty} ${product.unit || ''}`.trim();
                if (qty <= 0) {
                  stockClass = 'out';
                  stockText = 'Hết hàng';
                } else if (qty < minStock) {
                  stockClass = 'low';
                }
                return (
                  <div
                    key={product.id}
                    className="inv-mobile-card"
                    onClick={() => openModal(product)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h3 className="inv-product-name truncate">{product.name}</h3>
                            <p className="inv-product-brand truncate">{product.brand || product.category || '—'}</p>
                          </div>
                          <span className={`inv-badge-stock ${stockClass} flex-shrink-0`}>{stockText}</span>
                        </div>
                        <div className="flex justify-between items-end mt-3">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Giá bán</p>
                            <p className="inv-price text-base">{(product.price ?? 0).toLocaleString('vi-VN')} ₫</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Mã SP</p>
                            <p className="inv-code text-xs">{product.code || '—'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-400 py-8 bg-white rounded-xl border border-gray-200">Không tìm thấy sản phẩm</div>
            )}

            {/* Mobile Pagination — compact numeric */}
            {paginatedProducts.length > 0 && (
              <div className="flex justify-center items-center bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                <div className="inv-pagination">
                  <button
                    className="inv-pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {(() => {
                    const tp = totalPages || 1;
                    const cur = currentPage;
                    const pages: number[] = [];
                    const start = Math.max(1, Math.min(cur - 1, tp - 2));
                    const end = Math.min(tp, start + 2);
                    for (let i = start; i <= end; i++) pages.push(i);
                    return pages.map(p => (
                      <button
                        key={p}
                        className={`inv-pagination-btn ${p === cur ? 'active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    ));
                  })()}
                  <button
                    className="inv-pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      {/* Bulk Update Modal */}
      {isBulkUpdateModalOpen && (
        <div className="vsp-modal-sync fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fade-in overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">
                Đổi {bulkUpdateType === 'category' ? 'danh mục' : 'thương hiệu'} hàng loạt
              </h3>
              <button onClick={() => setIsBulkUpdateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Đang chọn {selectedIds.size} sản phẩm để cập nhật.</p>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Chọn {bulkUpdateType === 'category' ? 'danh mục' : 'thương hiệu'} mới
                </label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newBulkValue}
                    onChange={(e) => setNewBulkValue(e.target.value)}
                  >
                    <option value="">-- Chọn --</option>
                    {bulkUpdateType === 'category' 
                      ? categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                      : brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)
                    }
                  </select>
                  <button 
                    onClick={() => {
                      const name = prompt(`Thêm ${bulkUpdateType === 'category' ? 'danh mục' : 'thương hiệu'} mới:`);
                      if (name) {
                        if (bulkUpdateType === 'category') onAddCategory(name);
                        else onAddBrand(name);
                        setNewBulkValue(name);
                      }
                    }}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button onClick={() => setIsBulkUpdateModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium">Huỷ</button>
              <button 
                onClick={handleConfirmBulkUpdate}
                disabled={!newBulkValue}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold disabled:opacity-50"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PRODUCT MODAL (Redesigned) ================= */}
      {isModalOpen && (
        <ProductEditModal
          product={editingProduct}
          categories={categories}
          brands={brands}
          scannedBarcode={scannerMode === 'form' ? formData.barcode : undefined}
          onOpenScanner={() => { setScannerMode('form'); setIsScannerOpen(true); }}
          onAddCategory={onAddCategory}
          onAddBrand={onAddBrand}
          onClose={closeModal}
          onSave={(data) => {
            // === Kiểm tra trùng SKU (code) và Barcode ===
            const sku = (data.code || '').trim();
            const barcode = (data.barcode || '').trim();

            if (sku) {
              const existingSku = products.find(p => {
                if (!p.code) return false;
                if (editingProduct) return p.code === sku && p.id !== editingProduct.id;
                return p.code === sku;
              });
              if (existingSku) {
                alert('Mã sản phẩm đã tồn tại.\nVui lòng nhập mã khác.');
                return;
              }
            }

            if (barcode) {
              const existingBarcode = products.find(p => {
                if (!p.barcode) return false;
                if (editingProduct) return p.barcode === barcode && p.id !== editingProduct.id;
                return p.barcode === barcode;
              });
              if (existingBarcode) {
                alert('Mã vạch đã tồn tại.\nVui lòng nhập mã vạch khác.');
                return;
              }
            }

            let finalQuantity = data.quantity || 0;
            if (data.hasBatches && data.lots && data.lots.length > 0) {
              finalQuantity = data.lots.reduce((sum, lot) => sum + lot.quantity, 0);
            }
            const finalProductData = { ...data, quantity: finalQuantity };
            if (editingProduct) {
              onUpdateProduct({ ...editingProduct, ...finalProductData } as Product);
            } else {
            onAddProduct({
                ...finalProductData,
                id: crypto.randomUUID(),
                image: data.image || `https://picsum.photos/200/200?random=${crypto.randomUUID()}`
              } as Product);
            }
            closeModal();
          }}
        />
      )}

      {/* ===== Legacy modal removed (kept logic in onSave above) ===== */}
      {false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
            </div>

            {/* Tabs - now only 2 tabs: Thông tin chung and Đơn vị, Giá & Tồn kho */}
            <div className="flex border-b border-gray-200">
              <button onClick={() => setActiveTab('general')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-gray-500'}`}>Thông tin chung</button>
              <button onClick={() => setActiveTab('units')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'units' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-gray-500'}`}>Đơn vị, Giá & Tồn kho</button>
            </div>

            {/* Modal Content - Product */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
               <form id="productForm" onSubmit={handleSubmit} className="space-y-6">
                  {activeTab === 'general' && (
                     <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="col-span-1">
                              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tên sản phẩm <span className="text-red-500">*</span></label>
                              <input required type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                           </div>
                           <div className="col-span-1">
                              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tên hiển thị</label>
                              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} placeholder={formData.name} />
                           </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                           <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">SKU</label><input required type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} /></div>
                           <div>
                              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Barcode</label>
                              <div className="relative">
                                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                                <button 
                                  type="button"
                                  onClick={() => { setScannerMode('form'); setIsScannerOpen(true); }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                                >
                                  <ScanBarcode className="w-4 h-4" />
                                </button>
                              </div>
                           </div>
                           <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Vị trí</label><input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Danh mục</label>
                              <div className="flex gap-2">
                                 <select 
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2" 
                                    value={formData.category} 
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                 >
                                    <option value="">Chọn danh mục</option>
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                 </select>
                                 <button 
                                    type="button"
                                    onClick={async () => {
                                       const name = prompt("Thêm danh mục mới:");
                                       if (name) {
                                          await onAddCategory(name);
                                          setFormData({...formData, category: name});
                                       }
                                    }}
                                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600"
                                 >
                                    <Plus className="w-5 h-5" />
                                 </button>
                              </div>
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Thương hiệu</label>
                              <div className="flex gap-2">
                                 <select 
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2" 
                                    value={formData.brand} 
                                    onChange={e => setFormData({...formData, brand: e.target.value})}
                                 >
                                    <option value="">Chọn thương hiệu</option>
                                    {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                 </select>
                                 <button 
                                    type="button"
                                    onClick={async () => {
                                       const name = prompt("Thêm thương hiệu mới:");
                                       if (name) {
                                          await onAddBrand(name);
                                          setFormData({...formData, brand: name});
                                       }
                                    }}
                                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600"
                                 >
                                    <Plus className="w-5 h-5" />
                                 </button>
                              </div>
                           </div>
                        </div>
                        
                        {/* Point Accumulation Checkbox */}
                        <div className="flex items-center gap-2 pt-2">
                           <input 
                             type="checkbox" 
                             id="isPointAccumulationEnabled"
                             className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                             checked={formData.isPointAccumulationEnabled || false}
                             onChange={e => setFormData({...formData, isPointAccumulationEnabled: e.target.checked})}
                           />
                           <label htmlFor="isPointAccumulationEnabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                             Cho phép tích điểm thưởng cho sản phẩm này
                           </label>
                        </div>
                     </div>
                  )}
                  
                  {/* ===== MERGED "Đơn vị, Giá & Tồn kho" TAB ===== */}
                  {activeTab === 'units' && (
                     <div className="space-y-6">
                        {/* Section 1: Basic Price & Unit Info */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                           <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                              <Settings2 className="w-4 h-4 text-indigo-500" />
                              Thông tin đơn vị & giá
                           </h4>
                           <div className="grid grid-cols-4 gap-4">
                              <div>
                                 <label className="block text-xs font-bold text-gray-700 mb-1">Đơn vị cơ bản</label>
                                 <input type="text" className="w-full border px-3 py-2 rounded" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold text-gray-700 mb-1">Giá vốn</label>
                                 <input type="number" className="w-full border px-3 py-2 rounded" value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold text-green-700 mb-1">Giá bán lẻ</label>
                                 <input type="number" className="w-full border px-3 py-2 rounded" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Tồn kho tổng
                                    {formData.hasBatches && <span className="text-blue-500 ml-1">(từ lô)</span>}
                                 </label>
                                 <div className="relative">
                                    <input 
                                       type="number" 
                                       className={`w-full border px-3 py-2 rounded ${formData.hasBatches ? 'bg-blue-50 cursor-not-allowed' : ''}`}
                                       value={formData.quantity}
                                       onChange={e => !formData.hasBatches && setFormData({...formData, quantity: Number(e.target.value)})}
                                       disabled={formData.hasBatches}
                                    />
                                    {formData.hasBatches && (
                                       <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                          <Layers className="w-4 h-4 text-blue-400" />
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Section 2: Toggle Lot Management */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <Box className="w-4 h-4 text-indigo-500" />
                                 <span className="font-bold text-gray-700 text-sm">Quản lý theo lô</span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                     type="checkbox" 
                                     className="sr-only peer"
                                     checked={formData.hasBatches || false}
                                     onChange={(e) => {
                                        const checked = e.target.checked;
                                        const currentQty = (editingProduct?.quantity || 0) > 0 || (formData.quantity || 0) > 0;
                                        if (currentQty) {
                                           if (checked) {
                                              alert('Sản phẩm đang có tồn kho. Không thể bật chế độ quản lý theo lô để tránh sai lệch tồn kho!');
                                           } else {
                                              alert('Sản phẩm đang có tồn kho. Không thể tắt chế độ quản lý theo lô để tránh sai lệch tồn kho!');
                                           }
                                           e.preventDefault();
                                           return;
                                        }
                                        setFormData(prev => ({ 
                                           ...prev, 
                                           hasBatches: checked,
                                           lots: checked ? prev.lots : []
                                        }));
                                     }}
                                  />
                                 <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                           </div>
                           {formData.hasBatches && (
                              <p className="text-xs text-gray-400 mt-2">
                                 Khi bật quản lý lô, tổng tồn kho sẽ tự động được tính từ số lượng các lô.
                              </p>
                           )}
                        </div>

                        {/* Section 3: Unit Conversion Table */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                           <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                              <Layers className="w-4 h-4 text-indigo-500" />
                              Đơn vị quy đổi
                           </h4>
                           <div className="border rounded-lg overflow-hidden">
                              <div className="bg-gray-100 px-4 py-2 grid grid-cols-12 text-xs font-bold text-gray-500 uppercase">
                                 <div className="col-span-3">Đơn vị</div>
                                 <div className="col-span-4 text-center">Tỷ lệ</div>
                                 <div className="col-span-4">Giá bán</div>
                                 <div className="col-span-1"></div>
                              </div>
                               {formData.conversionUnits?.map(u => (
                                  <div key={u.id} className="px-4 py-2 grid grid-cols-12 items-center text-sm border-t bg-white">
                                     <div className="col-span-3">{u.name}</div>
                                     <div className="col-span-4 text-center">1 {u.name} = {u.ratio} {formData.unit}</div>
                                     <div className="col-span-4">{(u.price ?? 0).toLocaleString()}</div>
                                    <div className="col-span-1 text-right">
                                       <button type="button" onClick={() => handleRemoveUnit(u.id)}>
                                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                       </button>
                                    </div>
                                 </div>
                              ))}
                              <div className="px-4 py-2 grid grid-cols-12 gap-2 items-center bg-gray-50 border-t">
                                 <div className="col-span-3">
                                    <input placeholder="Tên ĐV" className="w-full border px-2 py-1 text-sm rounded" value={newUnit.name} onChange={e=>setNewUnit({...newUnit, name: e.target.value})}/>
                                 </div>
                                 <div className="col-span-4 flex items-center gap-1">
                                    <span className="text-xs text-gray-400">1 =</span>
                                    <input type="number" placeholder="SL" className="w-20 border px-2 py-1 text-center text-sm rounded" value={newUnit.ratio} onChange={e=>setNewUnit({...newUnit, ratio: Number(e.target.value)})}/>
                                    <span className="text-xs text-gray-400">{formData.unit}</span>
                                 </div>
                                 <div className="col-span-4">
                                    <input type="number" placeholder="Giá" className="w-full border px-2 py-1 text-sm rounded" value={newUnit.price} onChange={e=>setNewUnit({...newUnit, price: Number(e.target.value)})}/>
                                 </div>
                                 <div className="col-span-1 text-right">
                                    <button type="button" onClick={handleAddUnit} className="text-indigo-600 font-bold text-sm hover:text-indigo-800">+ Thêm</button>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Section 4: Lot Management (only shown if formData.hasBatches is true) */}
                        {formData.hasBatches && (
                           <div className="bg-white p-4 rounded-lg border border-blue-200">
                              <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                                 <Box className="w-4 h-4 text-blue-500" />
                                 Lô & Hạn sử dụng
                                 <span className="ml-auto text-xs font-normal text-gray-400">
                                    Tổng tồn từ lô: <strong className="text-blue-600">{formData.lots?.reduce((s,l)=>s+l.quantity,0) || 0}</strong>
                                 </span>
                              </h4>
                              
                              {formData.lots && (formData.lots || []).length > 0 ? (
                                 <div className="border rounded-lg overflow-hidden mb-3">
                                    <div className="bg-gray-100 px-4 py-2 grid grid-cols-12 text-xs font-bold text-gray-500 uppercase">
                                       <div className="col-span-3">Mã lô</div>
                                       <div className="col-span-3">Hạn sử dụng</div>
                                       <div className="col-span-2 text-center">Số lượng</div>
                                       <div className="col-span-3 text-center">Tồn ban đầu</div>
                                       <div className="col-span-1"></div>
                                    </div>
                                    {(formData.lots || []).map(l => (
                                       <div key={l.id} className="px-4 py-2 grid grid-cols-12 items-center text-sm border-t bg-white">
                                          <div className="col-span-3 font-mono">{l.code}</div>
                                          <div className="col-span-3">{l.expiryDate}</div>
                                          <div className="col-span-2 text-center font-medium">{l.quantity}</div>
                                          <div className="col-span-3 text-center text-gray-400">{l.originalQuantity}</div>
                                          <div className="col-span-1 text-right">
                                             <button type="button" onClick={() => handleRemoveLot(l.id)}>
                                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                             </button>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              ) : (
                                 <div className="text-center text-gray-400 text-sm py-4 border border-dashed border-gray-200 rounded-lg mb-3">
                                    Chưa có lô nào. Thêm lô mới bên dưới.
                                 </div>
                              )}

                              {/* Add new lot form */}
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                 <div className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-3">
                                       <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">Mã lô</label>
                                       <input placeholder="Nhập mã lô" className="w-full border border-blue-200 px-2 py-1.5 text-sm rounded bg-white" value={newLot.code} onChange={e=>setNewLot({...newLot, code: e.target.value})}/>
                                    </div>
                                    <div className="col-span-3">
                                       <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">Hạn sử dụng</label>
                                       <input type="date" className="w-full border border-blue-200 px-2 py-1.5 text-sm rounded bg-white" value={newLot.expiryDate} onChange={e=>setNewLot({...newLot, expiryDate: e.target.value})}/>
                                    </div>
                                    <div className="col-span-2">
                                       <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">Số lượng</label>
                                       <input type="number" placeholder="SL" className="w-full border border-blue-200 px-2 py-1.5 text-sm rounded bg-white" value={newLot.quantity || ''} onChange={e=>setNewLot({...newLot, quantity: Number(e.target.value)})}/>
                                    </div>
                                    <div className="col-span-2">
                                       <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">Tồn BĐ</label>
                                       <input type="number" placeholder="SL BĐ" className="w-full border border-blue-200 px-2 py-1.5 text-sm rounded bg-white bg-gray-100 text-gray-500" value={newLot.quantity || ''} disabled/>
                                    </div>
                                    <div className="col-span-2">
                                       <button 
                                          type="button" 
                                          onClick={handleAddLot}
                                          className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                                       >
                                          <Plus className="w-4 h-4" /> Thêm lô
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  )}
               </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-gray-600 font-medium">Huỷ</button>
              <button
                type="submit"
                form="productForm"
                disabled={editingProduct ? !permissions.canUpdateProduct : !permissions.canCreateProduct}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingProduct ? 'Cập nhật' : 'Lưu sản phẩm'}
              </button>
            </div>
          </div>
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