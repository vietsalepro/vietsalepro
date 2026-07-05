import { supabase } from '../lib/supabase';
import { 
  Product, Customer, Supplier, Order, ImportReceipt, 
  InventoryCount, AppSettings, Reward, PointHistory,
  ProductLot, UnitConversion, CartItem, ImportItemInput,
  Category, Brand, Promotion, CustomerRank, ReturnOrder,
  Disposal, DisposalItem, DisposalInput, DisposalFilter,
  SupplierExchange, SupplierExchangeReturnItem, SupplierExchangeReceivedItem,
  SupplierExchangeInput, SupplierExchangeFilter
} from '../types';
import { offlineQueue, isNetworkError, CheckoutOp, QueuedOp } from '../utils/offlineManager';
import { capitalizeProductName } from '../utils/stringHelper';


// --- Mappers (Snake_case DB -> CamelCase App) ---

/**
 * PHASE 2G.1 — READ PATH MIGRATION
 * Mapper từ product_lots TABLE row → ProductLot object.
 * Thay thế việc đọc từ products.lots JSONB.
 */
const mapLotFromDB = (row: any): ProductLot => ({
  id: row.id,
  productId: row.product_id,
  code: row.code,
  lotNumber: row.code,          // alias — một số UI dùng lotNumber
  expiryDate: row.expiry_date,
  quantity: Number(row.quantity ?? 0),
  originalQuantity: row.original_quantity != null ? Number(row.original_quantity) : undefined,
  cost: row.cost != null ? Number(row.cost) : undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * PHASE 2G.1 / PHASE 4a — READ PATH MIGRATION
 * lots đọc từ product_lots TABLE (được JOIN trong getProducts/getProductById
 * và trả về trong các RPC search/filter/barcode dưới cột product_lots).
 * Cột products.lots JSONB đã bị xóa khỏi DB trong Phase 4b.
 */
const mapProductFromDB = (item: any): Product => ({
  id: item.id,
  name: item.name,
  displayName: item.display_name,
  code: item.sku ?? item.code,
  barcode: item.barcode,
  price: item.price,
  cost: item.cost,
  quantity: item.quantity,
  unit: item.unit,
  location: item.location,
  category: item.category,
  categoryId: item.category_id,
  brand: item.brand,
  brandId: item.brand_id,
  image: item.image,
  minStock: item.min_stock,
  maxStock: item.max_stock,
  safetyStock: item.safety_stock,
  isPointAccumulationEnabled: item.is_point_accumulation_enabled,
  hasBatches: item.has_lots,
  conversionUnits: item.conversion_units || [],
  // PHASE 2G.1: đọc từ product_lots JOIN — KHÔNG dùng item.lots JSONB
  lots: (item.product_lots || []).map(mapLotFromDB),
});

/**
 * PHASE 2G.2 / PHASE 4b — WRITE PATH MIGRATION
 * mapProductToDB KHÔNG ghi lots vào products.lots JSONB nữa.
 * Cột products.lots đã bị xóa khỏi DB trong Phase 4b SSOT.
 * Lot data chỉ được ghi vào product_lots TABLE qua replaceProductLots().
 */
const mapProductToDB = (item: Product) => ({
  id: item.id,
  name: capitalizeProductName(item.name),
  display_name: capitalizeProductName(item.displayName || item.name),
  sku: item.code,
  barcode: item.barcode,
  price: item.price,
  cost: item.cost,
  quantity: item.quantity,
  unit: item.unit,
  location: item.location,
  category: item.category,
  category_id: item.categoryId,
  brand: item.brand,
  brand_id: item.brandId,
  image: item.image,
  min_stock: item.minStock,
  max_stock: item.maxStock,
  safety_stock: item.safetyStock,
  is_point_accumulation_enabled: item.isPointAccumulationEnabled,
  has_lots: item.hasBatches,
  conversion_units: item.conversionUnits,
  // PHASE 4b SSOT: cột products.lots JSONB đã bị xóa khỏi DB.
  // Lot data được ghi riêng vào product_lots TABLE qua replaceProductLots().
});

const mapCustomerFromDB = (item: any): Customer => ({
  id: item.id,
  code: item.code || '',
  name: item.name,
  phone: item.phone,
  address: item.address,
  totalSpent: item.total_spent,
  debt: item.debt,
  loyaltyPoints: item.loyalty_points,
  rank: item.rank,
  lastPurchaseDate: item.last_purchase_date,
  createdAt: item.created_at,
  updatedAt: item.updated_at
});

const mapCustomerToDB = (item: Customer) => ({
  id: item.id,
  code: item.code,
  name: item.name,
  phone: item.phone,
  address: item.address,
  total_spent: item.totalSpent,
  debt: item.debt,
  loyalty_points: item.loyaltyPoints,
  rank: item.rank,
  last_purchase_date: item.lastPurchaseDate,
  created_at: item.createdAt,
  updated_at: item.updatedAt
});

const mapSupplierFromDB = (item: any): Supplier => ({
  id: item.id,
  code: item.code || '',
  name: item.name,
  phone: item.phone,
  address: item.address,
  contactPerson: item.contact_person,
  debt: item.debt
});

const mapSupplierToDB = (item: Supplier) => ({
  id: item.id,
  code: item.code,
  name: item.name,
  phone: item.phone,
  address: item.address,
  contact_person: item.contactPerson,
  debt: item.debt
});

const mapImportReceiptFromDB = (r: any) => ({
  id: r.id,
  invoiceNumber: r.invoice_number,
  date: r.date,
  supplierId: r.supplier_id,
  supplierName: r.supplier_name,
  totalCost: r.total_cost,
  shippingCost: r.shipping_cost,
  paidAmount: r.paid_amount,
  debtRecorded: r.debt_recorded,
  status: r.status ?? 'completed',
  discountTotal: r.discount_total ?? 0,
  note: r.note ?? '',
  items: (r.import_items || []).map((item: any) => ({
    id: item.id,
    productId: item.product_id,
    name: item.product_name,
    quantity: item.quantity,
    cost: item.cost,
    discount: item.discount ?? 0,
    adjustedCost: item.adjusted_cost ?? item.cost ?? 0,
    lotCode: item.lot_code || '',
    expiryDate: item.expiry_date ? item.expiry_date.slice(0, 10) : ''
  }))
});

const mapReturnOrderFromDB = (r: any, items: any[] = []): import('../types').ReturnOrder => ({
  id: r.id,
  originalOrderId: r.original_order_id,
  date: r.date,
  customerId: r.customer_id,
  customerName: r.customer_name,
  totalAmount: r.total_refund_amount,
  totalRefundAmount: r.total_refund_amount,
  refundMethod: r.refund_method,
  debtReduction: r.debt_reduction,
  cashRefund: r.cash_refund,
  reason: r.reason,
  note: r.note,
  status: r.status,
  pointsDeducted: r.points_deducted || 0,
  items: items.map((i: any) => ({
    id: i.id,
    returnOrderId: i.return_order_id,
    productId: i.product_id,
    productName: i.product_name,
    quantity: i.quantity,
    unitName: i.unit_name,
    unitPrice: i.unit_price,
    subtotal: i.subtotal,
    reason: i.reason,
    lotId: i.lot_id || undefined,
    lotCode: i.lot_code || undefined,
  })),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapDisposalFromDB = (d: any): Disposal => ({
  id: d.id,
  code: d.code,
  date: d.date,
  createdBy: d.created_by,
  status: d.status,
  reason: d.reason,
  note: d.note,
  totalQuantity: d.total_quantity,
  totalValue: d.total_value,
  items: (d.disposal_items || []).map((item: any) => ({
    id: item.id,
    disposalId: item.disposal_id,
    productId: item.product_id,
    productCode: item.product_code,
    productName: item.product_name,
    quantity: item.quantity,
    costPrice: item.cost_price,
    totalValue: item.total_value,
    lotId: item.lot_id,
    lotCode: item.lot_code,
    expiryDate: item.expiry_date ? item.expiry_date.slice(0, 10) : undefined,
    categoryId: item.category_id,
    categoryName: item.category_name,
    brandId: item.brand_id,
    brandName: item.brand_name,
  })),
  createdAt: d.created_at,
  updatedAt: d.updated_at,
});

// --- Service Functions ---

export const supabaseService = {
  // Categories
  async getCategories() {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    return data as Category[];
  },

  async addCategory(name: string) {
    const id = `CAT${Date.now()}${Math.random().toString(36).substring(2, 7)}`;
    const { error } = await supabase.from('categories').insert({ id, name });
    if (error) throw error;
  },

  async updateCategory(id: string, name: string) {
    const { error } = await supabase.from('categories').update({ name }).eq('id', id);
    if (error) throw error;
  },

  async deleteCategory(id: string) {
    const { error: deleteError } = await supabase.from('categories').delete().eq('id', id);
    if (deleteError) throw deleteError;
  },

  // Brands
  async getBrands() {
    const { data, error } = await supabase.from('brands').select('*').order('name');
    if (error) throw error;
    return data as Brand[];
  },

  async addBrand(name: string) {
    const id = `BRD${Date.now()}${Math.random().toString(36).substring(2, 7)}`;
    const { error } = await supabase.from('brands').insert({ id, name });
    if (error) throw error;
  },

  async updateBrand(id: string, name: string) {
    const { error } = await supabase.from('brands').update({ name }).eq('id', id);
    if (error) throw error;
  },

  async deleteBrand(id: string) {
    const { error: deleteError } = await supabase.from('brands').delete().eq('id', id);
    if (deleteError) throw deleteError;
  },

  // Products

  /**
   * PHASE 2G.1 — READ PATH MIGRATION
   * Lấy lots cho 1 sản phẩm cụ thể từ product_lots TABLE.
   * Dùng cho ProductEditModal / Inventory khi cần refresh lots độc lập.
   */
  async getProductLots(productId: string): Promise<ProductLot[]> {
    const { data, error } = await supabase
      .from('product_lots')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapLotFromDB);
  },

  // =========================================================================
  // PHASE 2G.2 / PHASE 4b — PRODUCT LOT SERVICE LAYER
  // Tất cả WRITE PATH cho lot data đều đi qua đây.
  // Cột products.lots JSONB đã bị xóa khỏi DB; lot data chỉ ghi vào product_lots.
  // =========================================================================

  /**
   * Upsert 1 lot vào product_lots TABLE.
   * Tôn trọng UNIQUE(product_id, code) — conflict → UPDATE.
   */
  async upsertProductLot(productId: string, lot: ProductLot): Promise<void> {
    const { error } = await supabase.from('product_lots').upsert({
      id: lot.id || crypto.randomUUID(),
      product_id: productId,
      code: (lot.code || '').trim(),
      expiry_date: lot.expiryDate || null,
      quantity: Number(lot.quantity ?? 0),
      original_quantity: lot.originalQuantity != null ? Number(lot.originalQuantity) : Number(lot.quantity ?? 0),
      cost: lot.cost != null ? Number(lot.cost) : null,
    }, { onConflict: 'product_id,code' });
    if (error) throw error;
  },

  /**
   * Replace toàn bộ lots của 1 sản phẩm — transaction-safe:
   * 1. DELETE tất cả lot cũ của productId
   * 2. INSERT lots mới (nếu có)
   *
   * Đây là hàm chính cho ProductEditModal SAVE và Inventory SAVE.
   * Không tạo duplicate lot code vì thực hiện delete → insert sạch.
   */
  async replaceProductLots(productId: string, lots: ProductLot[]): Promise<void> {
    if (!productId) return;

    // Bước 1: Xoá tất cả lot cũ
    const { error: deleteError } = await supabase
      .from('product_lots')
      .delete()
      .eq('product_id', productId);
    if (deleteError) throw deleteError;

    // Bước 2: Insert lots mới (nếu có)
    if (!lots || lots.length === 0) return;

    // Dedup theo code (case-insensitive) trước khi insert để tránh vi phạm UNIQUE
    const seen = new Set<string>();
    const uniqueLots = lots.filter(lot => {
      const key = (lot.code || '').trim().toUpperCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (uniqueLots.length === 0) return;

    const rows = uniqueLots.map(lot => ({
      id: lot.id || crypto.randomUUID(),
      product_id: productId,
      code: (lot.code || '').trim(),
      expiry_date: lot.expiryDate || null,
      quantity: Number(lot.quantity ?? 0),
      original_quantity: lot.originalQuantity != null ? Number(lot.originalQuantity) : Number(lot.quantity ?? 0),
      cost: lot.cost != null ? Number(lot.cost) : null,
    }));

    const { error: insertError } = await supabase.from('product_lots').insert(rows);
    if (insertError) throw insertError;
  },

  /**
   * Xoá 1 lot theo ID.
   */
  async deleteProductLot(lotId: string): Promise<void> {
    const { error } = await supabase.from('product_lots').delete().eq('id', lotId);
    if (error) throw error;
  },

  /**
   * Xoá lot theo product_id + code.
   * Dùng cho Delete Import: xoá đúng lot đã nhập theo lotCode.
   */
  async deleteProductLotByCode(productId: string, lotCode: string): Promise<void> {
    const { error } = await supabase
      .from('product_lots')
      .delete()
      .eq('product_id', productId)
      .eq('code', (lotCode || '').trim());
    if (error) throw error;
  },

  // =========================================================================
  // END PHASE 2G.2 PRODUCT LOT SERVICE LAYER
  // =========================================================================

  async getProducts() {
    // FULL-LOAD — chỉ dùng cho các trường hợp đặc thù cần toàn bộ danh sách:
    //   scanner lookup, inventory-count picker, export/import Excel, duplicate check.
    //   Main list dùng filterProductsPaginated (server-side paginate).
    // PHASE 2G.1: JOIN product_lots để hydrate lots từ TABLE thay vì JSONB
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category_name:categories!products_category_id_fkey(name),
        brand_name:brands!products_brand_id_fkey(name),
        product_lots(*)
      `);
    if (error) throw error;
    // Flatten joined names into the raw row so mapProductFromDB can use them
    const flattened = (data || []).map((row: any) => ({
      ...row,
      category: row.category_name?.name ?? row.category ?? null,
      brand: row.brand_name?.name ?? row.brand ?? null,
      // product_lots đã có trong row từ JOIN — mapProductFromDB sẽ dùng nó
    }));
    return flattened.map(mapProductFromDB);
  },

  async searchProducts(searchTerm: string, limit: number = 100) {
    const { data, error } = await supabase.rpc('search_products_rpc', {
      p_search_term: searchTerm || null,
      p_limit: limit
    });
    if (error) throw error;
    return (data || []).map(mapProductFromDB);
  },

  async getProductByBarcode(barcode: string) {
    const { data, error } = await supabase.rpc('get_product_by_barcode', {
      p_barcode: barcode
    });
    if (error) throw error;
    const items = (data || []).map(mapProductFromDB);
    return items[0] || null;
  },

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category_name:categories!products_category_id_fkey(name),
        brand_name:brands!products_brand_id_fkey(name),
        product_lots(*)
      `)
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    const flattened = {
      ...data,
      category: data.category_name?.name ?? data.category ?? null,
      brand: data.brand_name?.name ?? data.brand ?? null,
    };
    return mapProductFromDB(flattened);
  },

  async getProductsByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category_name:categories!products_category_id_fkey(name),
        brand_name:brands!products_brand_id_fkey(name),
        product_lots(*)
      `)
      .in('id', ids);
    if (error) throw error;
    const flattened = (data || []).map((row: any) => ({
      ...row,
      category: row.category_name?.name ?? row.category ?? null,
      brand: row.brand_name?.name ?? row.brand ?? null,
    }));
    return flattened.map(mapProductFromDB);
  },

  async getProductStats() {
    const { data, error } = await supabase.rpc('get_product_stats');
    if (error) throw error;
    return data as {
      total: number;
      active: number;
      lowStock: number;
      outOfStock: number;
      inventoryValue: number;
    };
  },

  async checkProductCodeExists(code: string) {
    const { data, error } = await supabase.rpc('check_product_code_exists', { p_code: code });
    if (error) throw error;
    return !!data;
  },

  async checkProductBarcodeExists(barcode: string) {
    const { data, error } = await supabase.rpc('check_product_barcode_exists', { p_barcode: barcode });
    if (error) throw error;
    return !!data;
  },

  async filterProductsPaginated(
    page: number,
    pageSize: number,
    searchTerm?: string,
    filters?: { categoryId?: string; brandId?: string; sortBy?: string; sortOrder?: 'asc' | 'desc'; stockStatus?: 'all' | 'available' | 'low' | 'out' }
  ) {
    const { data, error } = await supabase.rpc('filter_products_rpc', {
      p_search_term: searchTerm || null,
      p_page: page,
      p_page_size: pageSize,
      p_category_id: filters?.categoryId || null,
      p_brand_id: filters?.brandId || null,
      p_sort_by: filters?.sortBy || 'created_at',
      p_sort_order: filters?.sortOrder || 'desc',
      p_stock_status: filters?.stockStatus || null
    });
    if (error) throw error;
    const result = data as { products: any[]; totalCount: number };
    return {
      products: (result.products || []).map(mapProductFromDB),
      totalCount: result.totalCount || 0
    };
  },

  async upsertProduct(product: Product) {
    const { error } = await supabase.from('products').upsert(mapProductToDB(product));
    if (error) throw error;
  },

  async upsertProducts(products: Product[]) {
    const { error } = await supabase.from('products').upsert(products.map(mapProductToDB));
    if (error) throw error;
  },

  async deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteProducts(ids: string[]) {
    const { error } = await supabase.from('products').delete().in('id', ids);
    if (error) throw error;
  },

  async updateProducts(ids: string[], updates: Partial<Product>) {
    // Map updates to snake_case for DB
    const dbUpdates: any = {};
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
    if (updates.brandId !== undefined) dbUpdates.brand_id = updates.brandId;
    
    const { error } = await supabase.from('products').update(dbUpdates).in('id', ids);
    if (error) throw error;
  },

  // Customers
  async getCustomers() {
    // DÃ¹ng pagination loop Ä‘á»ƒ láº¥y ALL customers, khÃ´ng bá»‹ giá»›i háº¡n 5000
    return this.getAllCustomers();
  },

  async searchCustomers(searchTerm: string) {
    if (!searchTerm || !searchTerm.trim()) return [];
    const term = searchTerm.trim();
    // DÃ¹ng RPC function search_customers_rpc Ä‘á»ƒ há»— trá»£ tÃ¬m kiáº¿m khÃ´ng dáº¥u
    const { data, error } = await supabase.rpc('search_customers_rpc', {
      search_term: term
    });
    if (error) {
      // Fallback: náº¿u chÆ°a cháº¡y migration (RPC chÆ°a tá»“n táº¡i), dÃ¹ng query + client filter
      console.warn('RPC search_customers_rpc not found, falling back to direct query:', error.message);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })
        .limit(500);
      if (fallbackError) throw fallbackError;
      
      // Client-side unaccent filter Ä‘á»ƒ há»— trá»£ tÃ¬m khÃ´ng dáº¥u
      const normalizedTerm = term.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Ä‘/g, 'd');
      
      const unaccentStr = (s: string) => (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Ä‘/g, 'd');
      
      const filtered = (fallbackData || []).filter(c => {
        return unaccentStr(c.name).includes(normalizedTerm) ||
               (c.phone || '').toLowerCase().includes(term.toLowerCase()) ||
               unaccentStr(c.code).includes(normalizedTerm);
      });
      
      return filtered.map(mapCustomerFromDB);
    }
    return data.map(mapCustomerFromDB);
  },

  async getAllCustomers() {
    // FULL-LOAD — chỉ dùng cho tính lại hạng khách hàng (bulk rank recalc) trong Settings.
    //   Main list dùng getCustomersPaginated (server-side paginate).
    let allCustomers: Customer[] = [];
    let page = 1;
    const pageSize = 1000;
    
    while (true) {
      const { customers, totalCount } = await this.getCustomersPaginated(page, pageSize);
      allCustomers = [...allCustomers, ...customers];
      
      if (allCustomers.length >= totalCount) break;
      page++;
    }
    
    return allCustomers;
  },

  async getAllCustomerIds(searchTerm?: string) {
    let query = supabase.from('customers').select('id');
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data.map(item => item.id);
  },

  async getCustomersPaginated(
    page: number, 
    pageSize: number, 
    searchTerm?: string,
    filters?: {
      minPoints?: number;
      maxPoints?: number;
      hasDebt?: boolean | null;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    // DÃ¹ng RPC function filter_customers_rpc Ä‘á»ƒ há»— trá»£ tÃ¬m kiáº¿m khÃ´ng dáº¥u
    try {
      const { data, error } = await supabase.rpc('filter_customers_rpc', {
        p_search_term: searchTerm || null,
        p_page: page,
        p_page_size: pageSize,
        p_sort_by: filters?.sortBy || 'created_at',
        p_sort_order: filters?.sortOrder || 'desc',
        p_min_points: filters?.minPoints ?? null,
        p_max_points: filters?.maxPoints ?? null,
        p_has_debt: filters?.hasDebt === null ? null : filters?.hasDebt === undefined ? null : String(filters.hasDebt)
      });
      if (error) throw error;
      
      const result = data as { customers: any[]; totalCount: number };
      return {
        customers: (result.customers || []).map(mapCustomerFromDB),
        totalCount: result.totalCount || 0
      };
    } catch (err: any) {
      // Fallback: náº¿u chÆ°a cháº¡y migration (RPC chÆ°a tá»“n táº¡i), dÃ¹ng query cÅ©
      if (err.message && err.message.includes('function') && err.message.includes('not found')) {
        console.warn('RPC filter_customers_rpc not found, falling back to direct query');
        let query = supabase.from('customers').select('*', { count: 'exact' });
        
        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
        }

        if (filters) {
          if (filters.minPoints !== undefined && filters.minPoints > 0) {
            query = query.gte('loyalty_points', filters.minPoints);
          }
          if (filters.maxPoints !== undefined && filters.maxPoints !== Infinity) {
            query = query.lte('loyalty_points', filters.maxPoints);
          }
          if (filters.hasDebt === true) {
            query = query.gt('debt', 0);
          } else if (filters.hasDebt === false) {
            query = query.eq('debt', 0);
          }

          if (filters.sortBy) {
            const column = filters.sortBy === 'points' ? 'loyalty_points' 
                         : filters.sortBy === 'debt' ? 'debt' 
                         : filters.sortBy === 'spent' ? 'total_spent' 
                         : 'name';
            query = query.order(column, { ascending: filters.sortOrder === 'asc' });
          } else {
            query = query.order('created_at', { ascending: false });
          }
        } else {
          query = query.order('created_at', { ascending: false });
        }
        
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        const { data: fallbackData, error: fallbackError, count } = await query.range(from, to);
        if (fallbackError) throw fallbackError;
        
        return {
          customers: fallbackData.map(mapCustomerFromDB),
          totalCount: count || 0
        };
      }
      throw err;
    }
  },

  async upsertCustomer(customer: Customer) {
    const { error } = await supabase.from('customers').upsert(mapCustomerToDB(customer));
    if (error) throw error;
  },

  async deleteCustomer(id: string) {
    // To allow deleting any customer even with orders:
    // 1. Set customer_id to null in orders
    await supabase.from('orders').update({ customer_id: null }).eq('customer_id', id);
    // 2. Set customer_id to null in point_history
    await supabase.from('point_history').update({ customer_id: null }).eq('customer_id', id);
    // 3. Delete the customer
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteCustomers(ids: string[]) {
    // 1. Set customer_id to null in orders
    await supabase.from('orders').update({ customer_id: null }).in('customer_id', ids);
    // 2. Set customer_id to null in point_history
    await supabase.from('point_history').update({ customer_id: null }).in('customer_id', ids);
    // 3. Delete the customers
    const { error } = await supabase.from('customers').delete().in('id', ids);
    if (error) throw error;
  },

  async getCustomerById(id: string) {
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return mapCustomerFromDB(data);
  },

  async getGuestCustomer(): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or('name.eq.Khách lẻ,id.eq.guest,id.eq.C001')
      .limit(1)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? mapCustomerFromDB(data) : null;
  },

  async getDashboardSummary(from?: string, to?: string) {
    const { data, error } = await supabase.rpc('get_dashboard_summary', {
      p_from: from || null,
      p_to: to || null
    });
    if (error) throw error;
    return {
      revenueData: (data?.revenueData || []).map((d: any) => ({
        date: d.date,
        revenue: Number(d.revenue || 0),
        profit: Number(d.profit || 0),
        orders: Number(d.orders || 0)
      })),
      topProducts: (data?.topProducts || []).map((p: any) => ({
        name: p.name,
        quantity: Number(p.quantity || 0),
        revenue: Number(p.revenue || 0)
      })),
      inventoryValue: Number(data?.inventoryValue || 0),
      inventoryRetailValue: Number(data?.inventoryRetailValue || 0),
      debtCustomers: (data?.debtCustomers || []).map(mapCustomerFromDB),
      topCustomers: (data?.topCustomers || []).map((c: any) => ({
        ...mapCustomerFromDB(c),
        orderCount: Number(c.order_count || 0)
      })),
      totalDebt: Number(data?.totalDebt || 0),
      totalCustomers: Number(data?.totalCustomers || 0),
      totalProducts: Number(data?.totalProducts || 0),
      activeProducts: Number(data?.activeProducts || 0),
      todayRevenue: Number(data?.todayRevenue || 0),
      todayOrders: Number(data?.todayOrders || 0),
      todaySoldProducts: Number(data?.todaySoldProducts || 0),
      todayCustomers: Number(data?.todayCustomers || 0),
      yesterdayRevenue: Number(data?.yesterdayRevenue || 0)
    };
  },

  async getCustomerStats() {
    const { data, error } = await supabase.rpc('get_customer_stats');
    if (error) throw error;
    return {
      total: Number(data?.total || 0),
      vip: Number(data?.vip || 0),
      debt: Number(data?.debt || 0),
      totalSpent: Number(data?.totalSpent || 0)
    };
  },

  async getNextCustomerCode() {
    const { data, error } = await supabase
      .from('customers')
      .select('code')
      .order('code', { ascending: false })
      .limit(1);
    
    if (error) throw error;

    if (!data || data.length === 0) return 'KH000001';

    const lastCode = data[0].code;
    if (!lastCode || !lastCode.startsWith('KH')) return 'KH000001';
    
    const lastNum = parseInt(lastCode.replace('KH', ''), 10);
    if (isNaN(lastNum)) return 'KH000001';

    const nextNum = lastNum + 1;
    return `KH${nextNum.toString().padStart(6, '0')}`;
  },

  async checkCustomerPhoneExists(phone: string, excludeId?: string) {
    let query = supabase
      .from('customers')
      .select('id')
      .eq('phone', phone);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.limit(1);
    
    if (error) throw error;
    return data && data.length > 0;
  },

  // Suppliers
  async getSuppliers() {
    // FULL-LOAD — chỉ dùng cho: sinh mã NCC tự động, export Excel toàn bộ NCC.
    //   Main list dùng filterSuppliersPaginated (server-side paginate).
    const { data, error } = await supabase.from('suppliers').select('*');
    if (error) throw error;
    return data.map(mapSupplierFromDB);
  },

  async searchSuppliers(searchTerm: string, limit: number = 100) {
    const { data, error } = await supabase.rpc('search_suppliers_rpc', {
      p_search_term: searchTerm || null,
      p_limit: limit
    });
    if (error) throw error;
    return (data || []).map(mapSupplierFromDB);
  },

  async filterSuppliersPaginated(
    page: number,
    pageSize: number,
    searchTerm?: string,
    filters?: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ) {
    const { data, error } = await supabase.rpc('filter_suppliers_rpc', {
      p_search_term: searchTerm || null,
      p_page: page,
      p_page_size: pageSize,
      p_sort_by: filters?.sortBy || 'name',
      p_sort_order: filters?.sortOrder || 'asc'
    });
    if (error) throw error;
    const result = data as { suppliers: any[]; totalCount: number };
    return {
      suppliers: (result.suppliers || []).map(mapSupplierFromDB),
      totalCount: result.totalCount || 0
    };
  },

  async upsertSupplier(supplier: Supplier) {
    const { error } = await supabase.from('suppliers').upsert(mapSupplierToDB(supplier));
    if (error) throw error;
  },

  async getSupplierById(id: string) {
    const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return mapSupplierFromDB(data);
  },

  async deleteSupplier(id: string) {
    // 1. Set supplier_id to null in import_receipts
    await supabase.from('import_receipts').update({ supplier_id: null }).eq('supplier_id', id);
    // 2. Delete the supplier
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
  },

  // Orders (Complex due to relations)
  async getOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .order('date', { ascending: false });
    
    if (error) throw error;

    return data.map((order: any) => ({
      id: order.id,
      orderCode: order.order_code,
      date: order.date,
      customerId: order.customer_id,
      customerName: order.customer_name,
      totalAmount: order.total_amount,
      paidAmount: order.paid_amount,
      debtRecorded: order.debt_recorded,
      paymentMethod: order.payment_method,
      status: order.status,
      pointsEarned: order.points_earned,
      pointsRedeemed: order.points_redeemed,
      rewardsRedeemed: order.rewards_redeemed,
      note: order.note,
      hasReturn: order.has_return,
      totalReturnedAmount: order.total_returned_amount,
      items: order.order_items.map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitName: item.unit_name,
        price: item.price,
        lotId: item.lot_id || undefined,
        lotCode: item.lot_code || undefined
      }))
    }));
  },

  async getOrdersPaginated(page: number, pageSize: number = 20, filters?: { startDate?: string, endDate?: string, customerName?: string, orderId?: string }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `, { count: 'exact' })
      .order('date', { ascending: false });

    if (filters?.startDate) {
      // Ensure start of day
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      query = query.gte('date', start.toISOString());
    }
    if (filters?.endDate) {
      // Ensure end of day
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('date', end.toISOString());
    }
    if (filters?.customerName) {
      query = query.ilike('customer_name', `%${filters.customerName}%`);
    }
    if (filters?.orderId) {
      query = query.ilike('id', `%${filters.orderId}%`);
    }

    const { data, error, count } = await query.range(from, to);
    
    if (error) throw error;

    const orders = data.map((order: any) => ({
      id: order.id,
      orderCode: order.order_code,
      date: order.date,
      customerId: order.customer_id,
      customerName: order.customer_name,
      totalAmount: order.total_amount,
      paidAmount: order.paid_amount,
      debtRecorded: order.debt_recorded,
      paymentMethod: order.payment_method,
      status: order.status,
      pointsEarned: order.points_earned,
      pointsRedeemed: order.points_redeemed,
      rewardsRedeemed: order.rewards_redeemed,
      note: order.note,
      hasReturn: order.has_return,
      totalReturnedAmount: order.total_returned_amount,
      items: order.order_items.map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitName: item.unit_name,
        price: item.price,
        lotId: item.lot_id || undefined,
        lotCode: item.lot_code || undefined
      }))
    }));

    return { orders, totalCount: count || 0 };
  },

  async getDashboardStats() {
    // Get total revenue and order count using aggregations
    const { data: stats, error: statsError } = await supabase
      .from('orders')
      .select('total_amount');
    
    if (statsError) throw statsError;

    const totalRevenue = stats.reduce((sum, o) => sum + o.total_amount, 0);
    const totalOrders = stats.length;

    // Get last 7 days revenue
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentOrders, error: recentError } = await supabase
      .from('orders')
      .select('date, total_amount')
      .gte('date', sevenDaysAgo.toISOString());
    
    if (recentError) throw recentError;

    return {
      totalRevenue,
      totalOrders,
      recentOrders: recentOrders.map(o => ({ date: o.date, totalAmount: o.total_amount }))
    };
  },

  async getCustomerOrders(customerId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('customer_id', customerId)
      .order('date', { ascending: false });
    
    if (error) throw error;

    return data.map((order: any) => ({
      id: order.id,
      orderCode: order.order_code,
      date: order.date,
      customerId: order.customer_id,
      customerName: order.customer_name,
      totalAmount: order.total_amount,
      paidAmount: order.paid_amount,
      debtRecorded: order.debt_recorded,
      paymentMethod: order.payment_method,
      status: order.status,
      pointsEarned: order.points_earned,
      pointsRedeemed: order.points_redeemed,
      rewardsRedeemed: order.rewards_redeemed,
      note: order.note,
      hasReturn: order.has_return,
      totalReturnedAmount: order.total_returned_amount,
      items: order.order_items.map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitName: item.unit_name,
        price: item.price,
        lotId: item.lot_id || undefined,
        lotCode: item.lot_code || undefined
      }))
    }));
  },

  async createOrder(order: Order) {
    // Try to create order online first
    try {
      // 1. Insert Order
      const { error: orderError } = await supabase.from('orders').insert({
        id: order.id,
        order_code: order.orderCode || order.id,
        date: order.date,
        customer_id: order.customerId,
        customer_name: order.customerName,
        total_amount: order.totalAmount,
        paid_amount: order.paidAmount,
        debt_recorded: order.debtRecorded,
        payment_method: order.paymentMethod,
        status: order.status,
      points_earned: order.pointsEarned,
      points_redeemed: order.pointsRedeemed,
      rewards_redeemed: order.rewardsRedeemed,
      note: order.note || null
      });
      if (orderError) throw orderError;

      // 2. Insert Items
      const items = order.items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_name: item.unitName,
        price: item.price
      }));
      
      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;

      // 3. Update Reward Stock
      if (order.rewardsRedeemed && order.rewardsRedeemed.length > 0) {
        for (const reward of order.rewardsRedeemed) {
          // Decrement stock in DB
          const { data: currentReward } = await supabase
            .from('rewards')
            .select('stock')
            .eq('id', reward.rewardId)
            .single();
          
          if (currentReward) {
            const newStock = Math.max(0, (currentReward.stock || 0) - reward.quantity);
            await supabase
              .from('rewards')
              .update({ stock: newStock })
              .eq('id', reward.rewardId);
          }
        }
      }

      // 4. Update Customer Points & History
      if (order.customerId) {
        const { data: customer } = await supabase.from('customers').select('loyalty_points').eq('id', order.customerId).single();
        if (customer) {
          const currentPoints = customer.loyalty_points || 0;
          const newPoints = currentPoints + (order.pointsEarned || 0) - (order.pointsRedeemed || 0);
          
          // Update Customer
          await supabase.from('customers').update({ loyalty_points: newPoints }).eq('id', order.customerId);

          // Record History: Earned
          if (order.pointsEarned > 0) {
            await this.addPointHistory({
              id: `PH-${Date.now()}-E`,
              customerId: order.customerId,
              date: new Date().toISOString(),
              type: 'earn',
              amount: order.pointsEarned,
              description: `TÃ­ch Ä‘iá»ƒm tá»« Ä‘Æ¡n hÃ ng #${order.id}`,
              orderId: order.id
            });
          }

          // Record History: Redeemed
          if (order.pointsRedeemed > 0) {
             // Detailed description for rewards
             const rewardNames = order.rewardsRedeemed?.map(r => r.rewardName).join(', ') || 'Äá»•i quÃ ';
             await this.addPointHistory({
              id: `PH-${Date.now()}-R`,
              customerId: order.customerId,
              date: new Date().toISOString(),
              type: 'redeem',
              amount: -order.pointsRedeemed, // Negative for deduction
              description: `Äá»•i Ä‘iá»ƒm: ${rewardNames} (ÄÆ¡n hÃ ng #${order.id})`,
              orderId: order.id
            });
          }
        }
      }

    } catch (error: any) {
      // Check if it's a network error or explicitly offline.
      // Network errors might be TypeError (fetch failed) or have specific messages.
      const offline =

        !navigator.onLine ||
        error.message === 'Failed to fetch' ||
        error.message?.includes('NetworkError') ||
        error.name === 'TypeError';

      if (offline) {
        console.log('Network error detected, queueing order offline:', error);
        // HÃ ng Ä‘á»£i op tá»‘i thiá»ƒu (giáº£ Ä‘á»‹nh Ä‘Æ¡n vá»‹ cÆ¡ báº£n). handleCheckout
        // offline-first sáº½ truyá»n delta chÃ­nh xÃ¡c hÆ¡n khi gá»i trá»±c tiáº¿p.
        offlineQueue.add({
          type: 'checkout',
          order,
          productDeltas: order.items.map(i => ({
            productId: i.productId,
            deductBaseQty: i.quantity
          })),
          rewardDeltas: (order.rewardsRedeemed || []).map(r => ({
            rewardId: r.rewardId,
            quantity: r.quantity
          })),
          customerUpdate:
            order.customerId && order.customerId !== 'guest'
              ? {
                  customerId: order.customerId,
                  addSpent: order.totalAmount,
                  addDebt: order.debtRecorded,
                  addPoints: (order.pointsEarned || 0) - (order.pointsRedeemed || 0)
                }
              : undefined,
          pointHistory: [],
          timestamp: Date.now()
        });
        alert('Báº¡n Ä‘ang offline. ÄÆ¡n hÃ ng Ä‘Ã£ Ä‘Æ°á»£c lÆ°u táº¡m vÃ  sáº½ Ä‘á»“ng bá»™ khi cÃ³ máº¡ng.');
      } else {

        // If it's a logic/DB error (e.g. constraint violation), rethrow it
        console.error('Database/Logic error creating order:', error);
        throw error;
      }
    }
  },

  /**
   * Xoá đơn hàng ATOMIC qua PostgreSQL RPC `delete_order` (Phase 5).
   *
   * ✅ Fix MEDIUM-2: handleDeleteOrder không atomic + sai khi có lot.
   *
   * Logic server:
   *   1. Lock orders row
   *   2. CHẶN nếu còn phiếu trả status != cancelled
   *   3. Hoàn kho (lock từng product, xử lý cả lot)
   *   4. Hoàn customer (atomic arithmetic)
   *   5. Xoá point_history + order_items + orders
   *
   * ⚠️ Nếu RPC chưa migrate → fallback về _legacyDeleteOrder.
   * Migration: supabase_migration_delete_order_rpc.sql
   */
  async deleteOrder(id: string) {
    const { error: rpcError } = await supabase.rpc('delete_order', { p_order_id: id });

    if (rpcError) {
      const msg = (rpcError.message || '') + ' ' + ((rpcError as any).details || '');
      const notFound = /function.*delete_order.*does not exist|Could not find the function/i.test(msg);
      if (notFound) {
        console.warn('[deleteOrder] RPC chưa tồn tại — chạy migration supabase_migration_delete_order_rpc.sql. Fallback về legacy path.');
        return this._legacyDeleteOrder(id);
      }
      // Lỗi business (đơn có phiếu trả, không tồn tại, ...) → throw nguyên message
      throw new Error(rpcError.message || 'Lỗi xoá đơn hàng');
    }
  },

  /**
   * Phase 11: Cancel order (soft-delete) — đánh dấu status='cancelled' thay vì xoá hẳn.
   * Vẫn hoàn kho, hoàn công nợ, hoàn điểm như deleteOrder, nhưng GIỮ orders + items để tra cứu.
   * Migration: supabase_migration_cancel_order_rpc.sql
   */
  async cancelOrder(id: string) {
    const { error: rpcError } = await supabase.rpc('cancel_order', { p_order_id: id });

    if (rpcError) {
      const msg = (rpcError.message || '') + ' ' + ((rpcError as any).details || '');
      const notFound = /function.*cancel_order.*does not exist|Could not find the function/i.test(msg);
      if (notFound) {
        throw new Error('RPC cancel_order chưa được tạo. Vui lòng chạy migration: supabase_migration_cancel_order_rpc.sql');
      }
      // Lỗi business (đơn còn phiếu trả, đơn đã hủy, không tồn tại, ...) → throw nguyên message
      throw new Error(rpcError.message || 'Lỗi huỷ đơn hàng');
    }
  },

  /**
   * Legacy deleteOrder — chỉ dùng khi RPC chưa được migrate.
   * ⚠️ KHÔNG atomic, KHÔNG hoàn kho, KHÔNG xử lý lot.
   */
  async _legacyDeleteOrder(id: string) {
    // 0. Get Order Info for Point Reversal
    const { data: order } = await supabase.from('orders').select('*').eq('id', id).single();

    if (order && order.customer_id) {
       const pointsEarned = order.points_earned || 0;
       const pointsRedeemed = order.points_redeemed || 0;

       if (pointsEarned > 0 || pointsRedeemed > 0) {
          const { data: customer } = await supabase.from('customers').select('loyalty_points').eq('id', order.customer_id).single();
          if (customer) {
             const currentPoints = customer.loyalty_points || 0;
             const newPoints = currentPoints - pointsEarned + pointsRedeemed;
             await supabase.from('customers').update({ loyalty_points: newPoints }).eq('id', order.customer_id);
             await this.addPointHistory({
                id: `PH-${Date.now()}-REV`,
                customerId: order.customer_id,
                date: new Date().toISOString(),
                type: 'adjust',
                amount: pointsRedeemed - pointsEarned,
                description: `Hoàn tác điểm do xoá đơn hàng #${id}`
             });
          }
       }
    }

    await supabase.from('point_history').delete().eq('order_id', id);
    await supabase.from('order_items').delete().eq('order_id', id);
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
  },

  async updateOrderPayment(orderId: string, paidAmount: number, debtRecorded: number) {
    const { error } = await supabase
      .from('orders')
      .update({ 
        paid_amount: paidAmount, 
        debt_recorded: debtRecorded 
      })
      .eq('id', orderId);
    if (error) throw error;
  },

  /**
   * Phase 14: Atomic pay order debt via PostgreSQL RPC.
   * Lock + validate + clamp + update orders & customers trong 1 transaction.
   * Trả về: { effective_amount, change_amount, new_order_debt, new_customer_debt, fully_paid }
   * Migration: supabase_migration_pay_order_debt_rpc.sql
   */
  async payOrderDebt(orderId: string, amount: number): Promise<{
    ok: boolean;
    orderId: string;
    requestedAmount: number;
    effectiveAmount: number;
    changeAmount: number;
    newOrderPaid: number;
    newOrderDebt: number;
    newCustomerDebt: number | null;
    fullyPaid: boolean;
  }> {
    const { data, error } = await supabase.rpc('pay_order_debt', {
      p_order_id: orderId,
      p_amount: amount,
    });

    if (error) {
      const msg = (error.message || '') + ' ' + ((error as any).details || '');
      const notFound = /function.*pay_order_debt.*does not exist|Could not find the function/i.test(msg);
      if (notFound) {
        throw new Error('RPC pay_order_debt chưa được tạo. Vui lòng chạy migration: supabase_migration_pay_order_debt_rpc.sql');
      }
      // Lỗi business (đơn không tồn tại, đã huỷ, đã trả đủ, ...) → throw nguyên message
      throw new Error(error.message || 'Lỗi thanh toán công nợ');
    }

    const r = data as any;
    return {
      ok: r.ok,
      orderId: r.order_id,
      requestedAmount: Number(r.requested_amount),
      effectiveAmount: Number(r.effective_amount),
      changeAmount: Number(r.change_amount),
      newOrderPaid: Number(r.new_order_paid),
      newOrderDebt: Number(r.new_order_debt),
      newCustomerDebt: r.new_customer_debt != null ? Number(r.new_customer_debt) : null,
      fullyPaid: !!r.fully_paid,
    };
  },

  /**
   * Phase 8a: Atomic pay supplier debt via PostgreSQL RPC.
   * Lock import_receipts + suppliers, clamp amount, UPDATE + insert supplier_payment_ledger.
   * Trả về: { effective_amount, change_amount, new_receipt_debt, new_supplier_debt, ledger_balance_after, fully_paid }
   * Migration: supabase/migration_phase8a_debt_ledger.sql
   */
  async paySupplierDebt(receiptId: string, amount: number): Promise<{
    ok: boolean;
    receiptId: string;
    requestedAmount: number;
    effectiveAmount: number;
    changeAmount: number;
    newReceiptPaid: number;
    newReceiptDebt: number;
    newSupplierDebt: number | null;
    ledgerBalanceAfter: number | null;
    fullyPaid: boolean;
  }> {
    const { data, error } = await supabase.rpc('pay_supplier_debt', {
      p_receipt_id: receiptId,
      p_amount: amount,
    });

    if (error) {
      const msg = (error.message || '') + ' ' + ((error as any).details || '');
      const notFound = /function.*pay_supplier_debt.*does not exist|Could not find the function/i.test(msg);
      if (notFound) {
        throw new Error('RPC pay_supplier_debt chưa được tạo. Vui lòng chạy migration: supabase/migration_phase8a_debt_ledger.sql');
      }
      throw new Error(error.message || 'Lỗi thanh toán công nợ NCC');
    }

    const r = data as any;
    return {
      ok: r.ok,
      receiptId: r.receipt_id,
      requestedAmount: Number(r.requested_amount),
      effectiveAmount: Number(r.effective_amount),
      changeAmount: Number(r.change_amount),
      newReceiptPaid: Number(r.new_receipt_paid),
      newReceiptDebt: Number(r.new_receipt_debt),
      newSupplierDebt: r.new_supplier_debt != null ? Number(r.new_supplier_debt) : null,
      ledgerBalanceAfter: r.ledger_balance_after != null ? Number(r.ledger_balance_after) : null,
      fullyPaid: !!r.fully_paid,
    };
  },

  /**
   * Phase 8a: Điều chỉnh công nợ KH với reason bắt buộc.
   * Ghi customer_payment_ledger loại 'adjustment'. Dùng cho nợ chết/kẹt.
   * Migration: supabase/migration_phase8a_debt_ledger.sql
   */
  async adjustCustomerDebt(customerId: string, amount: number, reason: string): Promise<{
    ok: boolean;
    customerId: string;
    adjustmentAmount: number;
    newCustomerDebt: number;
    ledgerBalanceAfter: number;
    reason: string;
  }> {
    const { data, error } = await supabase.rpc('adjust_customer_debt', {
      p_customer_id: customerId,
      p_amount: amount,
      p_reason: reason,
    });

    if (error) {
      const msg = (error.message || '') + ' ' + ((error as any).details || '');
      const notFound = /function.*adjust_customer_debt.*does not exist|Could not find the function/i.test(msg);
      if (notFound) {
        throw new Error('RPC adjust_customer_debt chưa được tạo. Vui lòng chạy migration: supabase/migration_phase8a_debt_ledger.sql');
      }
      throw new Error(error.message || 'Lỗi điều chỉnh công nợ KH');
    }

    const r = data as any;
    return {
      ok: r.ok,
      customerId: r.customer_id,
      adjustmentAmount: Number(r.adjustment_amount),
      newCustomerDebt: Number(r.new_customer_debt),
      ledgerBalanceAfter: Number(r.ledger_balance_after),
      reason: r.reason,
    };
  },

  /**
   * Phase 8a: Điều chỉnh công nợ NCC với reason bắt buộc.
   * Ghi supplier_payment_ledger loại 'adjustment'.
   * Migration: supabase/migration_phase8a_debt_ledger.sql
   */
  async adjustSupplierDebt(supplierId: string, amount: number, reason: string): Promise<{
    ok: boolean;
    supplierId: string;
    adjustmentAmount: number;
    newSupplierDebt: number;
    ledgerBalanceAfter: number;
    reason: string;
  }> {
    const { data, error } = await supabase.rpc('adjust_supplier_debt', {
      p_supplier_id: supplierId,
      p_amount: amount,
      p_reason: reason,
    });

    if (error) {
      const msg = (error.message || '') + ' ' + ((error as any).details || '');
      const notFound = /function.*adjust_supplier_debt.*does not exist|Could not find the function/i.test(msg);
      if (notFound) {
        throw new Error('RPC adjust_supplier_debt chưa được tạo. Vui lòng chạy migration: supabase/migration_phase8a_debt_ledger.sql');
      }
      throw new Error(error.message || 'Lỗi điều chỉnh công nợ NCC');
    }

    const r = data as any;
    return {
      ok: r.ok,
      supplierId: r.supplier_id,
      adjustmentAmount: Number(r.adjustment_amount),
      newSupplierDebt: Number(r.new_supplier_debt),
      ledgerBalanceAfter: Number(r.ledger_balance_after),
      reason: r.reason,
    };
  },

  /**
   * Phase 8a: Đọc sổ cái công nợ KH (customer_payment_ledger).
   * Trả về: { current_balance, total_entries, entries[] }
   * Migration: supabase/migration_phase8a_debt_ledger.sql
   */
  async getCustomerDebtLedger(customerId: string, limit: number = 100, offset: number = 0): Promise<{
    customerId: string;
    currentBalance: number;
    totalEntries: number;
    entries: Array<{
      id: number;
      customerId: string;
      referenceType: string;
      referenceId: string | null;
      amount: number;
      balanceAfter: number | null;
      reason: string | null;
      createdBy: string | null;
      createdAt: string;
    }>;
  }> {
    const { data, error } = await supabase.rpc('get_customer_debt_ledger', {
      p_customer_id: customerId,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      throw new Error(error.message || 'Lỗi đọc sổ cái công nợ KH');
    }

    const r = data as any;
    return {
      customerId: r.customer_id,
      currentBalance: Number(r.current_balance),
      totalEntries: Number(r.total_entries),
      entries: (r.entries || []).map((e: any) => ({
        id: e.id,
        customerId: e.customer_id,
        referenceType: e.reference_type,
        referenceId: e.reference_id,
        amount: Number(e.amount),
        balanceAfter: e.balance_after != null ? Number(e.balance_after) : null,
        reason: e.reason,
        createdBy: e.created_by,
        createdAt: e.created_at,
      })),
    };
  },

  /**
   * Phase 8a: Đọc sổ cái công nợ NCC (supplier_payment_ledger).
   * Trả về: { current_balance, total_entries, entries[] }
   * Migration: supabase/migration_phase8a_debt_ledger.sql
   */
  async getSupplierDebtLedger(supplierId: string, limit: number = 100, offset: number = 0): Promise<{
    supplierId: string;
    currentBalance: number;
    totalEntries: number;
    entries: Array<{
      id: number;
      supplierId: string;
      referenceType: string;
      referenceId: string | null;
      amount: number;
      balanceAfter: number | null;
      reason: string | null;
      createdBy: string | null;
      createdAt: string;
    }>;
  }> {
    const { data, error } = await supabase.rpc('get_supplier_debt_ledger', {
      p_supplier_id: supplierId,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      throw new Error(error.message || 'Lỗi đọc sổ cái công nợ NCC');
    }

    const r = data as any;
    return {
      supplierId: r.supplier_id,
      currentBalance: Number(r.current_balance),
      totalEntries: Number(r.total_entries),
      entries: (r.entries || []).map((e: any) => ({
        id: e.id,
        supplierId: e.supplier_id,
        referenceType: e.reference_type,
        referenceId: e.reference_id,
        amount: Number(e.amount),
        balanceAfter: e.balance_after != null ? Number(e.balance_after) : null,
        reason: e.reason,
        createdBy: e.created_by,
        createdAt: e.created_at,
      })),
    };
  },


  // Import History (Phase 3 - audit log only)
  async createImportHistory(record: {
    id: string;
    fileName: string;
    importType?: string;
    sourceSoftware?: string;
    totalRecords: number;
    successRecords: number;
    skippedRecords: number;
    failedRecords: number;
    createdOrderIds?: string[];
    newCustomerIds?: string[];
    errorLog?: any[];
    status: string;
  }) {
    const { error } = await supabase.from('import_history').insert({
      id: record.id,
      file_name: record.fileName,
      import_type: record.importType || 'orders',
      source_software: record.sourceSoftware || 'vietsale',
      total_records: record.totalRecords,
      success_records: record.successRecords,
      skipped_records: record.skippedRecords,
      failed_records: record.failedRecords,
      created_order_ids: record.createdOrderIds || [],
      new_customer_ids: record.newCustomerIds || [],
      error_log: record.errorLog || [],
      status: record.status
    });
    // KhÃ´ng throw Ä‘á»ƒ lá»—i ghi log khÃ´ng lÃ m há»ng káº¿t quáº£ import
    if (error) console.error('createImportHistory failed:', error);
  },

  async getImportHistory() {
    const { data, error } = await supabase
      .from('import_history')
      .select('*')
      .order('import_date', { ascending: false })
      .limit(50);
    if (error) {
      console.error('getImportHistory failed:', error);
      return [];
    }
    return (data || []).map((r: any) => ({
      id: r.id,
      importDate: r.import_date,
      fileName: r.file_name,
      importType: r.import_type,
      sourceSoftware: r.source_software,
      totalRecords: r.total_records,
      successRecords: r.success_records,
      skippedRecords: r.skipped_records,
      failedRecords: r.failed_records,
      createdOrderIds: r.created_order_ids || [],
      newCustomerIds: r.new_customer_ids || [],
      errorLog: r.error_log || [],
      status: r.status
    }));
  },

  // Additional RPCs for Phase 6
  async getImportStats(fromDate: string, toDate: string) {
    const { data, error } = await supabase.rpc('get_import_stats', {
      p_from_date: fromDate,
      p_to_date: toDate
    });
    if (error) throw error;
    return data as {
      totalCount: number;
      totalCost: number;
      totalShipping: number;
      totalPaid: number;
      totalDebt: number;
    };
  },

  async getImportReceiptCountByDate(date: string) {
    const { data, error } = await supabase.rpc('get_import_receipt_count_by_date', {
      p_date: date
    });
    if (error) throw error;
    return data as number;
  },

  async getSupplierStats() {
    const { data, error } = await supabase.rpc('get_supplier_stats');
    if (error) throw error;
    return data as {
      total: number;
      withPhone: number;
      withDebt: number;
      totalDebt: number;
    };
  },

  async getCategoryProductCounts() {
    const { data, error } = await supabase.rpc('get_category_product_counts');
    if (error) throw error;
    return data as { category_id: string; name: string; product_count: number }[];
  },

  async getBrandProductCounts() {
    const { data, error } = await supabase.rpc('get_brand_product_counts');
    if (error) throw error;
    return data as { brand_id: string; name: string; product_count: number }[];
  },

  async getUnsyncedCategories() {
    const { data, error } = await supabase.rpc('get_unsynced_categories');
    if (error) throw error;
    return data as { name: string }[];
  },

  async getUnsyncedBrands() {
    const { data, error } = await supabase.rpc('get_unsynced_brands');
    if (error) throw error;
    return data as { name: string }[];
  },

  async countPointProducts() {
    const { data, error } = await supabase.rpc('count_point_products');
    if (error) throw error;
    return data as number;
  },

  async getImportReceiptsBySupplierId(supplierId: string, limit: number = 10) {
    const { data, error } = await supabase.rpc('get_import_receipts_by_supplier_id', {
      p_supplier_id: supplierId,
      p_limit: limit
    });
    if (error) throw error;
    return (data || []).map(mapImportReceiptFromDB);
  },

  async getImportReceiptsByProductAndLot(productId: string, lotId: string) {
    const { data, error } = await supabase.rpc('get_import_receipts_by_product_and_lot', {
      p_product_id: productId,
      p_lot_id: lotId
    });
    if (error) throw error;
    return (data || []).map(mapImportReceiptFromDB);
  },

  async searchOrders(searchTerm: string, limit: number = 100) {
    const { data, error } = await supabase.rpc('search_orders_rpc', {
      p_search_term: searchTerm || null,
      p_limit: limit
    });
    if (error) throw error;
    return (data || []).map((order: any) => ({
      id: order.id,
      orderCode: order.order_code,
      date: order.date,
      customerId: order.customer_id,
      customerName: order.customer_name,
      totalAmount: order.total_amount,
      paidAmount: order.paid_amount,
      debtRecorded: order.debt_recorded,
      paymentMethod: order.payment_method,
      status: order.status,
      pointsEarned: order.points_earned,
      pointsRedeemed: order.points_redeemed,
      rewardsRedeemed: order.rewards_redeemed,
      note: order.note,
      hasReturn: order.has_return,
      totalReturnedAmount: order.total_returned_amount
    }));
  },

  // Import Receipts
  // NOTE: getImportReceipts() (full-load) đã bị xoá — không còn caller nào.
  // Dùng filterImportReceiptsPaginated cho list, getImportReceiptById cho chi tiết.
  async getImportReceiptById(id: string) {
    const { data, error } = await supabase
      .from('import_receipts')
      .select(`
        *,
        import_items (*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return mapImportReceiptFromDB(data);
  },

  async getImportReceiptByInvoiceNumber(invoiceNumber: string, supplierId?: string) {
    let query = supabase
      .from('import_receipts')
      .select(`
        *,
        import_items (*)
      `)
      .eq('invoice_number', invoiceNumber)
      .limit(1);

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data && data.length > 0 ? mapImportReceiptFromDB(data[0]) : null;
  },

  async filterImportReceiptsPaginated(
    page: number,
    pageSize: number,
    searchTerm?: string,
    filters?: { fromDate?: string; toDate?: string; supplierId?: string; status?: string }
  ) {
    const { data, error } = await supabase.rpc('filter_import_receipts_rpc', {
      p_search_term: searchTerm || null,
      p_page: page,
      p_page_size: pageSize,
      p_from_date: filters?.fromDate || null,
      p_to_date: filters?.toDate || null,
      p_supplier_id: filters?.supplierId || null,
      p_status: filters?.status || null
    });
    if (error) throw error;
    const result = data as { receipts: any[]; totalCount: number };
    return {
      receipts: (result.receipts || []).map(mapImportReceiptFromDB),
      totalCount: result.totalCount || 0
    };
  },

  /**
   * REBUILD V2: Tạo hoặc hoàn thành phiếu nhập hàng (nháp -> hoàn thành)
   * Gọi RPC process_import_v2 bằng payload JSONB chuẩn hóa.
   * Đảm bảo an toàn, đồng bộ SSOT, tính giá vốn, lô và biến động kho nguyên tử.
   */
  async createImportReceipt(receipt: any) {
    const { items = [], ...receiptData } = receipt;

    // Chuẩn hóa và đóng gói payload JSONB hoàn chỉnh
    const payload = {
      id: receiptData.id,
      invoice_number: receiptData.invoiceNumber ?? receiptData.invoice_number ?? null,
      date: receiptData.date,
      supplier_id: receiptData.supplierId ?? receiptData.supplier_id,
      supplier_name: receiptData.supplierName ?? receiptData.supplier_name ?? 'N/A',
      total_cost: Number(receiptData.totalCost ?? receiptData.total_cost ?? 0),
      shipping_cost: Number(receiptData.shippingCost ?? receiptData.shipping_cost ?? 0),
      discount_total: Number(receiptData.discountTotal ?? receiptData.discount_total ?? 0),
      paid_amount: Number(receiptData.paidAmount ?? receiptData.paid_amount ?? 0),
      debt_recorded: Number(receiptData.debtRecorded ?? receiptData.debt_recorded ?? 0),
      status: receiptData.status ?? 'completed',
      note: receiptData.note ?? null,
      items: items.map((item: any) => ({
        product_id: item.productId ?? item.product_id,
        product_name: item.name ?? item.productName ?? item.product_name,
        quantity: Number(item.quantity),
        cost: Number(item.cost),
        discount: Number(item.discount ?? 0),
        lot_code: item.lotCode ?? item.lot_code ?? null,
        expiry_date: item.expiryDate ?? item.expiry_date ?? null
      }))
    };

    const { data, error } = await supabase.rpc('process_import_v2', {
      p_payload: payload
    });

    if (error) {
      console.error('Lỗi process_import_v2 RPC error:', error);
      throw new Error(error.message || 'Lỗi xử lý phiếu nhập kho');
    }

    return data;
  },

  async updateImportReceiptPayment(receiptId: string, paidAmount: number, debtRecorded: number) {
    const { error } = await supabase
      .from('import_receipts')
      .update({ 
        paid_amount: paidAmount, 
        debt_recorded: debtRecorded 
      })
      .eq('id', receiptId);
    if (error) throw error;
  },

  /**
   * REBUILD V2: Cập nhật phiếu nhập (draft -> completed hoặc completed -> đảo + nhập lại).
   * Gọi RPC update_import_v2 để đảm bảo atomic: đảo ngược phiếu cũ rồi nhập lại.
   */
  async updateImportReceipt(receipt: any) {
    const { id, items = [], ...receiptData } = receipt;
    if (!id) {
      throw new Error('Cập nhật phiếu nhập yêu cầu receipt.id');
    }

    const payload = {
      id,
      invoice_number: receiptData.invoiceNumber ?? receiptData.invoice_number ?? null,
      date: receiptData.date,
      supplier_id: receiptData.supplierId ?? receiptData.supplier_id,
      supplier_name: receiptData.supplierName ?? receiptData.supplier_name ?? 'N/A',
      total_cost: Number(receiptData.totalCost ?? receiptData.total_cost ?? 0),
      shipping_cost: Number(receiptData.shippingCost ?? receiptData.shipping_cost ?? 0),
      discount_total: Number(receiptData.discountTotal ?? receiptData.discount_total ?? 0),
      paid_amount: Number(receiptData.paidAmount ?? receiptData.paid_amount ?? 0),
      debt_recorded: Number(receiptData.debtRecorded ?? receiptData.debt_recorded ?? 0),
      status: receiptData.status ?? 'completed',
      note: receiptData.note ?? null,
      items: items.map((item: any) => ({
        product_id: item.productId ?? item.product_id,
        product_name: item.name ?? item.productName ?? item.product_name,
        quantity: Number(item.quantity),
        cost: Number(item.cost),
        discount: Number(item.discount ?? 0),
        lot_code: item.lotCode ?? item.lot_code ?? null,
        expiry_date: item.expiryDate ?? item.expiry_date ?? null
      }))
    };

    const { data, error } = await supabase.rpc('update_import_v2', {
      p_receipt_id: id,
      p_payload: payload
    });

    if (error) {
      console.error('Lỗi update_import_v2 RPC error:', error);
      throw new Error(error.message || 'Lỗi cập nhật phiếu nhập kho');
    }

    return data;
  },

  /**
   * REBUILD V2: Xóa hoặc hủy phiếu nhập kho (Draft / Completed) an toàn.
   * Gọi RPC delete_import_v2 để tự động hoàn kho, hoàn lô, hoàn nợ NCC và ghi biến động kho âm.
   */
  async deleteImportReceipt(id: string) {
    const { data, error } = await supabase.rpc('delete_import_v2', {
      p_receipt_id: id
    });

    if (error) {
      console.error('Lỗi delete_import_v2 RPC error:', error);
      throw new Error(error.message || 'Lỗi hủy và hoàn kho phiếu nhập hàng');
    }

    return data;
  },


  // Settings
  async getSettings() {
    const { data, error } = await supabase.from('app_settings').select('*').single();
    if (error && error.code !== 'PGRST116') throw error; // Ignore not found
    
    if (!data) return null;

    return {
      pointConversionRate: data.point_conversion_rate,
      storeName: data.store_name,
      storePhone: data.store_phone,
      storeAddress: data.store_address,
      taxCode: data.tax_code,
      bankInfo: data.bank_info,
      printSize: data.print_size,
      fontSize: data.font_size,
      fontFamily: data.font_family,
      logo: data.logo,
      invoiceTitle: data.invoice_title,
      loyaltyPolicy: data.loyalty_policy,
      promoInfo: data.promo_info,
      thankYouMessage: data.thank_you_message,
      returnFeeEnabled: data.return_fee_enabled ?? false,
      returnMaxDays: data.return_max_days ?? 0,
      returnFeePercent: data.return_fee_percent ?? 0,
      // Phase 7.3: Setting cho phép bán âm tồn kho (admin override). Mặc định FALSE.
      allowNegativeStock: data.allow_negative_stock ?? false,
    } as AppSettings;

  },

  async saveSettings(settings: AppSettings) {
    const dbSettings = {
      id: 'default',
      point_conversion_rate: settings.pointConversionRate,
      store_name: settings.storeName,
      store_phone: settings.storePhone,
      store_address: settings.storeAddress,
      tax_code: settings.taxCode,
      bank_info: settings.bankInfo,
      print_size: settings.printSize,
      font_size: settings.fontSize,
      font_family: settings.fontFamily,
      logo: settings.logo,
      invoice_title: settings.invoiceTitle,
      loyalty_policy: settings.loyaltyPolicy,
      promo_info: settings.promoInfo,
      thank_you_message: settings.thankYouMessage,
      return_fee_enabled: settings.returnFeeEnabled ?? false,
      return_max_days: settings.returnMaxDays ?? 0,
      return_fee_percent: settings.returnFeePercent ?? 0,
      // Phase 7.3: allow_negative_stock (admin override)
      allow_negative_stock: (settings as any).allowNegativeStock ?? false,
    };

    
    // List of optional columns that may not exist on older schemas.
    const optionalColumns = ['tax_code', 'bank_info', 'print_size', 'font_size', 'font_family', 'logo', 'invoice_title', 'loyalty_policy', 'promo_info', 'thank_you_message', 'return_fee_enabled', 'return_max_days', 'return_fee_percent', 'allow_negative_stock'];

    // Helper: detect "missing column" errors from PostgREST / Supabase.
    // Messages vary: "column ... not found", "Could not find the 'logo' column",
    // or error code PGRST204 (schema cache).
    const isMissingColumnError = (err: any) => {
      if (!err) return false;
      const msg = (err.message || '') + ' ' + (err.details || '') + ' ' + (err.hint || '');
      return err.code === 'PGRST204'
        || (msg.includes('column') && (msg.includes('not found') || msg.includes('Could not find')))
        || msg.includes('schema cache');
    };

    // Try saving; if a column is missing, drop the offending column(s) and retry.
    // Loop a few times in case multiple columns are missing one-by-one.
    let payload: any = { ...dbSettings };
    let { error } = await supabase.from('app_settings').upsert(payload);
    let attempts = 0;

    while (error && isMissingColumnError(error) && attempts < optionalColumns.length) {
      attempts++;
      const msg = (error.message || '') + ' ' + (error.details || '') + ' ' + (error.hint || '');

      // Find which optional column(s) the error mentions.
      const mentioned = optionalColumns.filter(col => msg.includes(col));
      const toRemove = mentioned.length > 0
        ? mentioned
        // If the message doesn't name a column (generic schema cache error),
        // strip all optional columns as a fallback so the core settings still save.
        : optionalColumns;

      let changed = false;
      for (const col of toRemove) {
        if (col in payload) {
          delete payload[col];
          changed = true;
        }
      }
      if (!changed) break;

      console.warn('Retrying app_settings save without missing columns:', toRemove);
      ({ error } = await supabase.from('app_settings').upsert(payload));
    }

    if (error) throw error;

  },

  // Rewards
  async getRewards() {
    const { data, error } = await supabase.from('rewards').select('*');
    if (error) throw error;
    return data.map((r: any) => ({
      id: r.id,
      name: r.name,
      pointCost: r.point_cost,
      description: r.description,
      stock: r.stock || 0
    }));
  },

  async upsertReward(reward: Reward) {
    const { error } = await supabase.from('rewards').upsert({
      id: reward.id,
      name: reward.name,
      point_cost: reward.pointCost,
      description: reward.description,
      stock: reward.stock || 0
    });
    if (error) throw error;
  },

  async deleteReward(id: string) {
    const { error } = await supabase.from('rewards').delete().eq('id', id);
    if (error) throw error;
  },

  // Point History
  async getPointHistory(customerId?: string) {
    let query = supabase.from('point_history').select('*').order('date', { ascending: false });
    
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.map((h: any) => ({
      id: h.id,
      customerId: h.customer_id,
      date: h.date,
      type: h.type,
      amount: h.amount,
      description: h.description,
      orderId: h.order_id
    }));
  },

  async addPointHistory(history: PointHistory) {
    const { error } = await supabase.from('point_history').insert({
      id: history.id,
      customer_id: history.customerId,
      date: history.date,
      type: history.type,
      amount: history.amount,
      description: history.description,
      order_id: history.orderId
    });
    if (error) throw error;
  },

  // --- Inventory Counts ---
  async getInventoryCounts() {
    const { data, error } = await supabase
      .from('inventory_counts')
      .select(`
        *,
        inventory_count_items (*)
      `)
      .order('date', { ascending: false });

    if (error) throw error;

    return data.map((c: any) => ({
      id: c.id,
      code: c.code,
      date: c.date,
      status: c.status,
      notes: c.notes,
      createdAt: c.created_at,
      completedAt: c.completed_at,
      items: c.inventory_count_items.map((item: any) => ({
        id: item.id,
        countId: item.count_id,
        productId: item.product_id,
        productCode: item.product_code,
        productName: item.product_name,
        unit: item.unit,
        systemQuantity: item.system_quantity,
        actualQuantity: item.actual_quantity,
        cost: item.cost,
        reason: item.reason,
        lotId: item.lot_id || undefined,
        lotCode: item.lot_code || undefined,
        expiryDate: item.expiry_date ? item.expiry_date.slice(0, 10) : undefined
      }))
    }));
  },

  async upsertInventoryCount(count: InventoryCount) {
    // 1. Upsert Header
    const { error: headerError } = await supabase.from('inventory_counts').upsert({
      id: count.id,
      code: count.code,
      date: count.date,
      status: count.status,
      notes: count.notes,
      created_at: count.createdAt,
      completed_at: count.completedAt
    });
    if (headerError) throw headerError;

    // 2. Upsert Items
    // First delete existing items to handle updates/removals cleanly (simplest approach for full sync)
    // Or just upsert if we are sure IDs are stable. 
    // Given the UI logic, it's safer to delete all items for this count and re-insert to handle removals.
    const { error: deleteError } = await supabase.from('inventory_count_items').delete().eq('count_id', count.id);
    if (deleteError) throw deleteError;

    if (count.items && count.items.length > 0) {
      const items = count.items.map(item => ({
        count_id: count.id,
        product_id: item.productId,
        product_code: item.productCode,
        product_name: item.productName,
        unit: item.unit,
        system_quantity: item.systemQuantity,
        actual_quantity: item.actualQuantity,
        cost: item.cost,
        reason: item.reason,
        lot_id: item.lotId || null,
        lot_code: item.lotCode || null,
        expiry_date: item.expiryDate || null
      }));
      
      const { error: itemsError } = await supabase.from('inventory_count_items').insert(items);
      if (itemsError) throw itemsError;
    }
  },

  /**
   * Hoàn thành phiếu kiểm kê ATOMIC qua PostgreSQL RPC.
   *
   * ⚡ Hàm này gọi function `complete_inventory_count` đã được tạo ở Phase 1
   *    (file: supabase_migration_inventory_count_rpc.sql).
   *
   * Toàn bộ logic được thực thi trong 1 transaction PostgreSQL duy nhất:
   *   - Khóa header phiếu + validate trạng thái (chặn re-complete)
   *   - Khóa từng dòng products (SELECT...FOR UPDATE)
   *   - Tính delta = actual_quantity - quantity_hiện_tại_DB
   *   - UPDATE products.quantity = quantity + delta (cộng chênh lệch, không ghi đè)
   *   - UPDATE system_quantity = giá trị DB tươi để báo cáo đúng
   *   - Đánh dấu phiếu completed
   *
   * ✅ Fix 4 lỗi:
   *   1. Ghi đè tồn kho    → Tính delta, cộng vào tồn kho thực tại
   *   2. Race Condition    → SELECT ... FOR UPDATE khóa dòng
   *   3. Atomicity         → 1 transaction PostgreSQL tự ROLLBACK khi lỗi
   *   4. Status validation → RAISE EXCEPTION chặn hoàn thành lại phiếu đã completed
   *
   * ⚠️ Nếu function chưa tồn tại trong DB, hãy chạy migration:
   *    supabase_migration_inventory_count_rpc.sql
   */
  async completeInventoryCount(countId: string) {
    const { error } = await supabase.rpc('complete_inventory_count', {
      p_count_id: countId
    });

    if (error) {
      // PostgreSQL function đã tự rollback - không có dữ liệu nào bị thay đổi
      console.error('completeInventoryCount RPC error:', error);
      throw new Error(error.message || 'Lỗi hoàn thành phiếu kiểm kê');
    }
  },

  async deleteInventoryCount(id: string) {
    const { error } = await supabase.rpc('delete_inventory_count_rpc', {
      p_count_id: id
    });
    if (error) throw error;
  },

  /**
   * Hủy phiếu kiểm kê (cancel) — Phase 7a.
   * Khác với deleteInventoryCount (xóa cứng): cancel chỉ đổi status thành 'cancelled'
   * + hoàn kho (bút toán đảo) + GIỮ LỊCH SỬ để truy vết.
   * Chỉ cho phiếu 'draft' hoặc 'completed'.
   */
  async cancelInventoryCount(id: string) {
    const { error } = await supabase.rpc('cancel_inventory_count_rpc', {
      p_count_id: id
    });
    if (error) throw error;
  },

  // --- Backup & Restore ---
  async getFullSystemBackup() {
    try {
      const [
        { data: customers },
        { data: products },
        { data: suppliers },
        { data: orders },
        { data: orderItems },
        { data: importReceipts },
        { data: importItems },
        { data: categories },
        { data: brands },
        { data: rewards },
        { data: pointHistory },
        { data: settings },
        { data: inventoryCounts },
        { data: inventoryCountItems }
      ] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('products').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('order_items').select('*'),
        supabase.from('import_receipts').select('*'),
        supabase.from('import_items').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('brands').select('*'),
        supabase.from('rewards').select('*'),
        supabase.from('point_history').select('*'),
        supabase.from('app_settings').select('*'),
        supabase.from('inventory_counts').select('*'),
        supabase.from('inventory_count_items').select('*')
      ]);

      return {
        timestamp: new Date().toISOString(),
        version: '1.1',
        data: {
          customers: customers || [],
          products: products || [],
          suppliers: suppliers || [],
          orders: orders || [],
          orderItems: orderItems || [],
          importReceipts: importReceipts || [],
          importItems: importItems || [],
          categories: categories || [],
          brands: brands || [],
          rewards: rewards || [],
          pointHistory: pointHistory || [],
          settings: settings || [],
          inventoryCounts: inventoryCounts || [],
          inventoryCountItems: inventoryCountItems || []
        }
      };
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  },

  async restoreSystemBackup(backupData: any) {
    const { data } = backupData;
    if (!data) throw new Error('Invalid backup file format');

    const upsertBatch = async (table: string, items: any[]) => {
      if (!items || items.length === 0) return;
      const BATCH_SIZE = 100;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from(table).upsert(batch);
        if (error) {
          console.error(`Error restoring batch for ${table}:`, error);
          throw error;
        }
      }
    };

    try {
      // 1. Restore independent tables first
      await upsertBatch('categories', data.categories);
      await upsertBatch('brands', data.brands);
      await upsertBatch('app_settings', data.settings);
      
      // 2. Restore main entities
      await upsertBatch('customers', data.customers);
      await upsertBatch('suppliers', data.suppliers);
      await upsertBatch('products', data.products);
      await upsertBatch('rewards', data.rewards);

      // 3. Restore transactional data (Orders & Imports & Inventory)
      // Note: We must restore headers first, then items
      await upsertBatch('orders', data.orders);
      await upsertBatch('order_items', data.orderItems);
      
      await upsertBatch('import_receipts', data.importReceipts);
      await upsertBatch('import_items', data.importItems);

      await upsertBatch('inventory_counts', data.inventoryCounts);
      await upsertBatch('inventory_count_items', data.inventoryCountItems);

      // 4. Restore history
      await upsertBatch('point_history', data.pointHistory);

      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  },

  async adjustCustomerPoints(customerId: string, amount: number, reason: string) {
    // 1. Get current points
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customerId)
      .single();
    
    if (fetchError) throw fetchError;

    // 2. Update points
    const newPoints = (customer.loyalty_points || 0) + amount;
    const { error: updateError } = await supabase
      .from('customers')
      .update({ loyalty_points: newPoints })
      .eq('id', customerId);

    if (updateError) throw updateError;

    // 3. Add history
    await this.addPointHistory({
      id: `PH-${Date.now()}`,
      customerId,
      date: new Date().toISOString(),
      type: 'adjust',
      amount: amount,
      description: reason
    });
  },

  // Seeding
  async seedData(
    products: Product[], 
    customers: Customer[], 
    suppliers: Supplier[]
  ) {
    if (products.length > 0) {
      const { error } = await supabase.from('products').upsert(products.map(mapProductToDB));
      if (error) console.error('Error seeding products:', error);
    }
    if (customers.length > 0) {
      const { error } = await supabase.from('customers').upsert(customers.map(mapCustomerToDB));
      if (error) console.error('Error seeding customers:', error);
    }
    if (suppliers.length > 0) {
      const { error } = await supabase.from('suppliers').upsert(suppliers.map(mapSupplierToDB));
      if (error) console.error('Error seeding suppliers:', error);
    }
  },

  // --- Offline-first Checkout ---
  /**
   * Atomic POS checkout qua PostgreSQL RPC `process_checkout` (Phase 1).
   *
   * ✅ Fix 3 lỗi CRITICAL:
   *   1. Race condition  → SELECT ... FOR UPDATE khóa từng dòng products/rewards
   *   2. Tồn kho âm       → RAISE EXCEPTION khi quantity < deductBaseQty
   *   3. Atomicity        → 1 transaction PostgreSQL tự ROLLBACK toàn bộ khi lỗi
   *
   * ⚠️ Nếu RPC chưa được migrate (function not found):
   *   - Tự fallback về logic cũ (legacy path bên dưới) để không chặn nghiệp vụ.
   *   - Hiện cảnh báo trong console để dev biết cần chạy migration.
   *
   * Migration: `supabase/migration_phase4c_checkout_lot_write.sql` (lot handling)
   *           + `supabase/migration_phase5a_checkout_cost.sql` (cost snapshot)
   */
  async pushCheckout(op: CheckoutOp, allowNegativeStock: boolean = false) {
    const { order } = op;

    // ─── Map camelCase JS → JSONB payload cho RPC ────────────────────────
    const orderPayload = {
      id: order.id,
      date: order.date,
      customerId: order.customerId,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      paidAmount: order.paidAmount,
      debtRecorded: order.debtRecorded,
      paymentMethod: order.paymentMethod,
      status: order.status,
      pointsEarned: order.pointsEarned,
      pointsRedeemed: order.pointsRedeemed,
      rewardsRedeemed: order.rewardsRedeemed || [],
      appliedPromotions: (order as any).appliedPromotions || [],
      note: order.note || null,
    };

    const itemsPayload = order.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitName: item.unitName,
      price: item.price,
      // Phase 3B.2: truyền lot_id + lot_code để RPC persist vào order_items
      lotId: (item as any).lotId || null,
      lotCode: (item as any).lotCode || null,
      // Phase 5a: truyền cost nếu frontend đã tính; nếu null RPC tự tra cứu
      cost: (item as any).cost ?? null,
    }));

    // Phase 4: gửi cả lotId xuống RPC. Nếu product.has_lots=TRUE và không có lotId
    // → RPC sẽ raise lỗi rõ ràng cho UI xử lý.
    const deltasPayload = op.productDeltas.map(d => ({
      productId: d.productId,
      deductBaseQty: d.deductBaseQty,
      lotId: d.lotId || null,
    }));

    const rewardsPayload = op.rewardDeltas.map(r => ({
      rewardId: r.rewardId,
      quantity: r.quantity,
    }));

    const customerPayload = op.customerUpdate
      ? {
          customerId: op.customerUpdate.customerId,
          addSpent: op.customerUpdate.addSpent,
          addDebt: op.customerUpdate.addDebt,
          addPoints: op.customerUpdate.addPoints,
        }
      : null;

    const phPayload = (op.pointHistory || []).map(ph => ({
      id: ph.id,
      customerId: ph.customerId,
      date: ph.date,
      type: ph.type,
      amount: ph.amount,
      description: ph.description,
      orderId: ph.orderId,
    }));

    // ─── Gọi RPC atomic + idempotent (Phase 2) ──────────────────────────
    // Truyền p_op_id để server có thể skip nếu op này đã xử lý trước đó
    // (vd: do client retry sau timeout, hoặc sync queue chạy đồng thời).
    const { data, error } = await supabase.rpc('process_checkout', {
      p_order: orderPayload,
      p_items: itemsPayload,
      p_deltas: deltasPayload,
      p_reward_deltas: rewardsPayload,
      p_customer_update: customerPayload,
      p_point_history: phPayload,
      p_allow_negative: allowNegativeStock,
      p_op_id: op.opId || null,
    });

    if (error) {
      // Nếu RPC chưa được migrate → fallback path cũ
      const msg = (error.message || '') + ' ' + ((error as any).details || '');
      const notFound = /function.*process_checkout.*does not exist|Could not find the function/i.test(msg);
      if (notFound) {
        console.warn('[pushCheckout] RPC process_checkout chưa tồn tại — chạy migration supabase/migration_phase4c_checkout_lot_write.sql + supabase/migration_phase5a_checkout_cost.sql. Fallback về legacy path.');
        return this._legacyPushCheckout(op);
      }
      // Lỗi nghiệp vụ (tồn kho không đủ, sản phẩm không tồn tại, ...) → throw nguyên message tiếng Việt
      throw new Error(error.message || 'Lỗi xử lý đơn hàng');
    }

    // Phase 2: log nếu server skip (op đã xử lý trước đó)
    if (data && (data as any).skipped) {
      console.log(`[pushCheckout] op ${op.opId} đã xử lý trước đó (idempotent skip).`);
    }
  },

  /**
   * Legacy pushCheckout — chỉ dùng khi RPC chưa được migrate.
   * ⚠️ KHÔNG atomic, KHÔNG validate tồn kho, KHÔNG row lock.
   * Giữ lại để hệ thống không gãy nếu admin quên chạy migration Phase 1.
   */
  async _legacyPushCheckout(op: CheckoutOp) {
    const { order } = op;

    const { error: orderError } = await supabase.from('orders').upsert({
      id: order.id,
      order_code: order.orderCode || order.id,
      date: order.date,
      customer_id: order.customerId === 'guest' ? null : order.customerId,
      customer_name: order.customerName,
      total_amount: order.totalAmount,
      paid_amount: order.paidAmount,
      debt_recorded: order.debtRecorded,
      payment_method: order.paymentMethod,
      status: order.status,
      points_earned: order.pointsEarned,
      points_redeemed: order.pointsRedeemed,
      rewards_redeemed: order.rewardsRedeemed,
      note: order.note || null
    });
    if (orderError) throw orderError;

    await supabase.from('order_items').delete().eq('order_id', order.id);
    if (order.items.length > 0) {
      const items = order.items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_name: item.unitName,
        price: item.price
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;
    }

    for (const d of op.productDeltas) {
      if (!d.deductBaseQty) continue;
      const { data: prod } = await supabase
        .from('products').select('quantity').eq('id', d.productId).single();
      if (prod) {
        const newQty = (prod.quantity || 0) - d.deductBaseQty;
        await supabase.from('products').update({ quantity: newQty }).eq('id', d.productId);
      }
    }

    for (const r of op.rewardDeltas) {
      if (!r.quantity) continue;
      const { data: reward } = await supabase
        .from('rewards').select('stock').eq('id', r.rewardId).single();
      if (reward) {
        const newStock = Math.max(0, (reward.stock || 0) - r.quantity);
        await supabase.from('rewards').update({ stock: newStock }).eq('id', r.rewardId);
      }
    }

    if (op.customerUpdate) {
      const cu = op.customerUpdate;
      const { data: customer } = await supabase
        .from('customers')
        .select('total_spent, debt, loyalty_points')
        .eq('id', cu.customerId).single();
      if (customer) {
        await supabase.from('customers').update({
          total_spent: (customer.total_spent || 0) + cu.addSpent,
          debt: (customer.debt || 0) + cu.addDebt,
          loyalty_points: Math.max(0, (customer.loyalty_points || 0) + cu.addPoints),
          last_purchase_date: order.date
        }).eq('id', cu.customerId);
      }
    }

    for (const ph of op.pointHistory) {
      await supabase.from('point_history').upsert({
        id: ph.id,
        customer_id: ph.customerId,
        date: ph.date,
        type: ph.type,
        amount: ph.amount,
        description: ph.description,
        order_id: ph.orderId
      });
    }
  },

  // Äá»“ng bá»™ toÃ n bá»™ hÃ ng Ä‘á»£i offline. Tráº£ vá» sá»‘ Ä‘Ã£ Ä‘á»“ng bá»™ vÃ  sá»‘ cÃ²n lá»—i.
  async syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
    const ops = offlineQueue.getAll();
    if (ops.length === 0) return { synced: 0, failed: 0 };

    console.log(`Syncing ${ops.length} offline operations...`);
    const remaining: QueuedOp[] = [];
    let synced = 0;

    for (const op of ops) {
      try {
        if (op.type === 'checkout') {
          await this.pushCheckout(op);
          synced++;
        }
      } catch (error) {
        if (isNetworkError(error)) {
          // Máº¥t máº¡ng láº¡i: giá»¯ nguyÃªn op nÃ y vÃ  xá»­ lÃ½ láº¡i láº§n sau
          remaining.push(op);
        } else {
          // Lá»—i logic/DB: log vÃ  bá» qua Ä‘á»ƒ khÃ´ng káº¹t hÃ ng Ä‘á»£i mÃ£i
          console.error('Failed to sync operation (dropped):', error, op);
        }
      }
    }

    offlineQueue.set(remaining);
    return { synced, failed: remaining.length };
  },

  // Giá»¯ láº¡i tÃªn cÅ© Ä‘á»ƒ tÆ°Æ¡ng thÃ­ch: gá»i sang hÃ ng Ä‘á»£i má»›i
  async syncOfflineOrders() {
    return this.syncOfflineQueue();
  },

  // --- PROMOTION CRUD ---
  mapPromotionFromDB(item: any): Promotion {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      description: item.description,
      isActive: item.is_active ?? true,
      // Phase 9: ưu tiên + điều kiện + cộng dồn
      priority: item.priority ?? 0,
      minOrderValue: item.min_order_value ?? 0,
      maxDiscount: item.max_discount ?? 0,
      stackable: item.stackable ?? false,
      discountPercent: item.discount_percent,
      discountFixed: item.discount_fixed,
      targetProductId: item.target_product_id,
      targetCategory: item.target_category,
      targetProductIds: item.target_product_ids,
      buyProductId: item.buy_product_id,
      buyQuantity: item.buy_quantity,
      giftProductId: item.gift_product_id,
      giftQuantity: item.gift_quantity,
      giftDiscountPercent: item.gift_discount_percent,
      tiers: item.tiers,
      mainProductId: item.main_product_id,
      comboProductId: item.combo_product_id,
      comboDiscountPercent: item.combo_discount_percent,
      minCustomerRank: item.min_customer_rank,
      startDate: item.start_date,
      endDate: item.end_date,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  },

  mapPromotionToDB(promo: Promotion) {
    return {
      id: promo.id,
      name: promo.name,
      type: promo.type,
      description: promo.description,
      is_active: promo.isActive,
      // Phase 9
      priority: promo.priority ?? 0,
      min_order_value: promo.minOrderValue ?? 0,
      max_discount: promo.maxDiscount ?? 0,
      stackable: promo.stackable ?? false,
      discount_percent: promo.discountPercent,
      discount_fixed: promo.discountFixed,
      target_product_id: promo.targetProductId,
      target_category: promo.targetCategory,
      target_product_ids: promo.targetProductIds,
      buy_product_id: promo.buyProductId,
      buy_quantity: promo.buyQuantity,
      gift_product_id: promo.giftProductId,
      gift_quantity: promo.giftQuantity,
      gift_discount_percent: promo.giftDiscountPercent,
      tiers: promo.tiers,
      main_product_id: promo.mainProductId,
      combo_product_id: promo.comboProductId,
      combo_discount_percent: promo.comboDiscountPercent,
      min_customer_rank: promo.minCustomerRank,
      start_date: promo.startDate,
      end_date: promo.endDate,
      created_at: promo.createdAt,
      updated_at: promo.updatedAt,
    };
  },

  async getPromotions(): Promise<Promotion[]> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => this.mapPromotionFromDB(item));
  },

  async addPromotion(promo: Promotion): Promise<void> {
    const { error } = await supabase
      .from('promotions')
      .insert(this.mapPromotionToDB(promo));
    if (error) throw error;
  },

  async updatePromotion(promo: Promotion): Promise<void> {
    const { error } = await supabase
      .from('promotions')
      .update(this.mapPromotionToDB(promo))
      .eq('id', promo.id);
    if (error) throw error;
  },

  async deletePromotion(id: string): Promise<void> {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // â”€â”€â”€ CUSTOMER RANK CONFIG CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getRankConfigs(): Promise<import('../types').CustomerRankConfig[]> {
    const { data, error } = await supabase
      .from('rank_configs')
      .select('*')
      .order('order', { ascending: true });
    if (error) throw error;
    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      key: item.key,
      color: item.color,
      description: item.description,
      order: item.order,
      isDefault: item.is_default,
      conditions: item.conditions || [],
      discountPercent: item.discount_percent,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  },

  async upsertRankConfig(config: import('../types').CustomerRankConfig): Promise<void> {
    const { error } = await supabase.from('rank_configs').upsert({
      id: config.id,
      name: config.name,
      key: config.key,
      color: config.color,
      description: config.description,
      order: config.order,
      is_default: config.isDefault,
      conditions: config.conditions,
      discount_percent: config.discountPercent,
      created_at: config.createdAt,
      updated_at: config.updatedAt,
    });
    if (error) throw error;
  },

  async deleteRankConfig(id: string): Promise<void> {
    const { error } = await supabase.from('rank_configs').delete().eq('id', id);
    if (error) throw error;
  },

  // â”€â”€â”€ CUSTOMER RANK HISTORY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getRankHistory(customerId?: string): Promise<import('../types').CustomerRankHistory[]> {
    let query = supabase
      .from('rank_history')
      .select('*')
      .order('changed_at', { ascending: false });
    
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((item: any) => ({
      id: item.id,
      customerId: item.customer_id,
      customerName: item.customer_name,
      oldRank: item.old_rank,
      oldRankName: item.old_rank_name,
      newRank: item.new_rank,
      newRankName: item.new_rank_name,
      changedAt: item.changed_at,
      reason: item.reason,
      totalSpentAtChange: item.total_spent_at_change,
    }));
  },

  async addRankHistory(history: import('../types').CustomerRankHistory): Promise<void> {
    const { error } = await supabase.from('rank_history').insert({
      id: history.id,
      customer_id: history.customerId,
      customer_name: history.customerName,
      old_rank: history.oldRank,
      old_rank_name: history.oldRankName,
      new_rank: history.newRank,
      new_rank_name: history.newRankName,
      changed_at: history.changedAt,
      reason: history.reason,
      total_spent_at_change: history.totalSpentAtChange,
    });
    if (error) throw error;
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // RETURN ORDERS (TRáº¢ HÃ€NG HOÃ€N TIá»€N)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Sinh mã phiếu trả hàng tự tăng dạng THXXXXXXX (TH + số thứ tự ≥ 7 chữ số).
   * Dùng RPC `get_return_order_auto_code` (SEQUENCE atomic, không trùng).
   *
   * ⚠️ Nếu RPC chưa được migrate → fallback về `RTN${Date.now()}` (mã cũ) để
   * không chặn việc tạo phiếu. Chạy migration supabase_migration_return_order_auto_code.sql
   * để bật mã TH.
   */
  async getReturnOrderAutoCode(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('get_return_order_auto_code');
      if (error || !data) throw error || new Error('empty code');
      return data as string;
    } catch (err) {
      console.warn('[getReturnOrderAutoCode] RPC chưa tồn tại — chạy migration supabase_migration_return_order_auto_code.sql. Fallback về RTN.', err);
      return `RTN${Date.now()}`;
    }
  },

  /**
   * Tạo phiếu trả hàng ATOMIC qua PostgreSQL RPC `create_return_order` (Phase 3).
   *
   * ✅ Fix:
   *   HIGH-2: Server validate KHÔNG trả vượt số đã bán (chặn bypass client)
   *   HIGH-3: Toàn bộ logic trong 1 transaction (header + items + stock + customer)
   *
   * ⚠️ Nếu RPC chưa được migrate → fallback về `_legacyCreateReturnOrder` (logic cũ).
   * Migration: supabase_migration_v7_core_consolidation.sql
   */
  async createReturnOrder(params: {
    originalOrderId: string;
    customerId: string;
    customerName: string;
    items: { productId: string; productName: string; quantity: number; unitName: string; unitPrice: number; subtotal: number; reason: string; lotId?: string; lotCode?: string }[];
    totalRefundAmount: number;
    debtReduction: number;
    cashRefund: number;
    reason: string;
    note?: string;
    grossRefundAmount?: number;
    feePercent?: number;
    feeAmount?: number;
    daysSincePurchase?: number;
    originalPaymentMethod?: string;
  }): Promise<import('../types').ReturnOrder> {
    const returnId = await this.getReturnOrderAutoCode();
    const now = new Date().toISOString();

    // ─── Gọi RPC atomic ─────────────────────────────────────────────────
    const { error: rpcError } = await supabase.rpc('create_return_order', {
      p_id: returnId,
      p_original_order_id: params.originalOrderId,
      p_customer_id: params.customerId || null,
      p_customer_name: params.customerName || 'Khách lẻ',
      p_items: params.items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitName: i.unitName,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
        reason: i.reason || '',
        lotId: i.lotId || null,
        lotCode: i.lotCode || null,
      })),
      p_total_refund_amount: params.totalRefundAmount,
      p_debt_reduction: params.debtReduction || 0,
      p_cash_refund: params.cashRefund || 0,
      p_reason: params.reason || '',
      p_note: params.note || null,
      p_gross_refund_amount: params.grossRefundAmount ?? params.totalRefundAmount,
      p_fee_percent: params.feePercent ?? 0,
      p_fee_amount: params.feeAmount ?? 0,
      p_days_since_purchase: params.daysSincePurchase ?? 0,
      p_original_payment_method: params.originalPaymentMethod ?? null,
    });

    if (rpcError) {
      const msg = (rpcError.message || '') + ' ' + ((rpcError as any).details || '');
      const notFound = /function.*create_return_order.*does not exist|Could not find the function/i.test(msg);
      if (notFound) {
        console.warn('[createReturnOrder] RPC chưa tồn tại — chạy migration supabase_migration_v7_core_consolidation.sql. Fallback về legacy path.');
        return this._legacyCreateReturnOrder(params);
      }
      // Lỗi business (trả vượt số bán, vượt tổng tiền, ...) → throw nguyên message
      throw new Error(rpcError.message || 'Lỗi tạo phiếu trả hàng');
    }

    // Trả về object đầy đủ để UI hiển thị (server không trả về full row)
    return {
      id: returnId,
      originalOrderId: params.originalOrderId,
      date: now,
      customerId: params.customerId,
      customerName: params.customerName,
      totalAmount: params.totalRefundAmount,
      totalRefundAmount: params.totalRefundAmount,
      refundMethod: 'cash',
      debtReduction: params.debtReduction,
      cashRefund: params.cashRefund,
      reason: params.reason,
      note: params.note,
      status: 'completed',
      grossRefundAmount: params.grossRefundAmount ?? params.totalRefundAmount,
      feePercent: params.feePercent ?? 0,
      feeAmount: params.feeAmount ?? 0,
      daysSincePurchase: params.daysSincePurchase ?? 0,
      originalPaymentMethod: params.originalPaymentMethod,
      items: params.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitName: item.unitName,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        reason: item.reason,
      })),
      createdAt: now,
      updatedAt: now,
    };
  },

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 4 (M2) — Đổi-Trả hàng ATOMIC qua RPC `create_exchange_transaction`
  //
  // Tạo phiếu trả hàng + đơn bán đổi mới + cập nhật customer trong 1 transaction.
  // ✅ Hỗ trợ cả 3 chế độ:
  //    - Chỉ trả hàng (exchangeItems rỗng) → tương đương createReturnOrder
  //    - Chỉ đơn bán mới (returnItems rỗng) → tương đương pushCheckout
  //    - Cả 2 → đổi-trả thực sự (mô phỏng KiotViet)
  //
  // ⚠️ Nếu RPC chưa migrate → throw 'EXCHANGE_RPC_NOT_AVAILABLE'
  //    để caller (hook useReturnOrder.submitExchange) fallback về 2 RPC riêng
  //    (createReturnOrder cũ + pushCheckout cũ — không atomic giữa 2 luồng,
  //    nhưng vẫn lưu được dữ liệu).
  //
  // Migration: supabase_migration_v7_core_consolidation.sql
  // ═════════════════════════════════════════════════════════════════════
  async createExchangeTransaction(params: {
    // Return part
    returnId: string;
    originalOrderId: string;
    customerId: string;
    customerName: string;
    returnItems: { productId: string; productName: string; quantity: number; unitName: string; unitPrice: number; subtotal: number; reason?: string }[];
    totalRefundAmount: number;
    grossRefundAmount?: number;
    feePercent?: number;
    feeAmount?: number;
    daysSincePurchase?: number;
    originalPaymentMethod?: string;
    reason?: string;
    note?: string;
    debtReduction?: number;
    cashRefund?: number;
    // Exchange part
    exchangeOrderId: string;
    exchangeItems: { productId: string; productName: string; quantity: number; unitName: string; unitPrice: number; lotId?: string; lotCode?: string }[];
    exchangeTotal: number;
    exchangePaidAmount?: number;
    exchangeDebtRecorded?: number;
    exchangePaymentMethod?: 'cash' | 'transfer';
    isDelivery?: boolean;
    // Settlement metadata (audit)
    offsetAmount?: number;
    cashDiff?: number;
    // Override
    allowNegativeStock?: boolean;
  }): Promise<{
    ok: true;
    returnId: string | null;
    exchangeOrderId: string | null;
    hasReturn: boolean;
    hasExchange: boolean;
  }> {
    const { error: rpcError, data } = await supabase.rpc('create_exchange_transaction', {
      // Return
      p_return_id:                params.returnId,
      p_original_order_id:        params.originalOrderId,
      p_customer_id:              params.customerId || null,
      p_customer_name:            params.customerName || 'Khách lẻ',
      p_return_items: (params.returnItems || []).map(i => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitName: i.unitName,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
        reason: i.reason || '',
      })),
      p_total_refund_amount:      params.totalRefundAmount || 0,
      p_gross_refund_amount:      params.grossRefundAmount ?? params.totalRefundAmount ?? 0,
      p_fee_percent:              params.feePercent ?? 0,
      p_fee_amount:               params.feeAmount ?? 0,
      p_days_since_purchase:      params.daysSincePurchase ?? 0,
      p_original_payment_method:  params.originalPaymentMethod ?? null,
      p_reason:                   params.reason || '',
      p_note:                     params.note || null,
      p_debt_reduction:           params.debtReduction ?? 0,
      p_cash_refund:              params.cashRefund ?? 0,
      // Exchange
      p_exchange_order_id:        params.exchangeOrderId,
      p_exchange_items: (params.exchangeItems || []).map(i => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitName: i.unitName,
        unitPrice: i.unitPrice,
        lotId: i.lotId || null,
        lotCode: i.lotCode || null,
      })),
      p_exchange_total:           params.exchangeTotal || 0,
      p_exchange_paid_amount:     params.exchangePaidAmount ?? 0,
      p_exchange_debt_recorded:   params.exchangeDebtRecorded ?? 0,
      p_exchange_payment_method:  params.exchangePaymentMethod ?? 'cash',
      p_is_delivery:              !!params.isDelivery,
      // Settlement
      p_offset_amount:            params.offsetAmount ?? 0,
      p_cash_diff:                params.cashDiff ?? 0,
      // Override
      p_allow_negative:           !!params.allowNegativeStock,
    });

    if (rpcError) {
      const msg = (rpcError.message || '') + ' ' + ((rpcError as any).details || '');
      const notFound = /function.*create_exchange_transaction.*does not exist|Could not find the function/i.test(msg);
      if (notFound) {
        console.warn('[createExchangeTransaction] RPC chưa tồn tại — chạy migration supabase_migration_v7_core_consolidation.sql');
        throw new Error('EXCHANGE_RPC_NOT_AVAILABLE');
      }
      // Lỗi business (tồn không đủ, trả vượt, ...) → throw nguyên message tiếng Việt
      throw new Error(rpcError.message || 'Lỗi xử lý đổi-trả hàng');
    }

    const result: any = data || {};
    return {
      ok: true,
      returnId: result.return_id ?? params.returnId,
      exchangeOrderId: result.exchange_order_id ?? params.exchangeOrderId,
      hasReturn: !!result.has_return,
      hasExchange: !!result.has_exchange,
    };
  },

  /**
   * Legacy createReturnOrder — chỉ dùng khi RPC chưa được migrate.
   * ⚠️ KHÔNG atomic, KHÔNG validate vượt số bán ở server.
   */
  async _legacyCreateReturnOrder(params: {
    originalOrderId: string;
    customerId: string;
    customerName: string;
    items: { productId: string; productName: string; quantity: number; unitName: string; unitPrice: number; subtotal: number; reason: string }[];
    totalRefundAmount: number;
    debtReduction: number;
    cashRefund: number;
    reason: string;
    note?: string;
    grossRefundAmount?: number;
    feePercent?: number;
    feeAmount?: number;
    daysSincePurchase?: number;
    originalPaymentMethod?: string;
  }): Promise<import('../types').ReturnOrder> {
    const returnId = await this.getReturnOrderAutoCode();
    const now = new Date().toISOString();

    const baseRow: any = {
      id: returnId,
      original_order_id: params.originalOrderId,
      date: now,
      customer_id: params.customerId,
      customer_name: params.customerName,
      total_refund_amount: params.totalRefundAmount,
      refund_method: 'cash',
      debt_reduction: params.debtReduction,
      cash_refund: params.cashRefund,
      reason: params.reason,
      note: params.note || null,
      status: 'completed',
    };
    const feeRow: any = {
      ...baseRow,
      gross_refund_amount: params.grossRefundAmount ?? params.totalRefundAmount,
      fee_percent: params.feePercent ?? 0,
      fee_amount: params.feeAmount ?? 0,
      days_since_purchase: params.daysSincePurchase ?? 0,
      original_payment_method: params.originalPaymentMethod ?? null,
    };

    let { error: returnError } = await supabase.from('return_orders').insert(feeRow);
    if (returnError && (returnError.code === 'PGRST204' || /column|not found|schema cache/i.test(returnError.message || ''))) {
      // Schema chưa có cột phí → insert phần cốt lõi
      console.warn('return_orders thiếu cột phí, insert fallback (chạy supabase_migration_return_fee.sql để bật phí):', returnError.message);
      ({ error: returnError } = await supabase.from('return_orders').insert(baseRow));
    }
    if (returnError) throw returnError;


    // 2. ThÃªm chi tiáº¿t
    const itemsToInsert = params.items.map((item) => ({
      id: `${returnId}_${item.productId}`,
      return_order_id: returnId,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_name: item.unitName,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
      reason: item.reason,
    }));

    const { error: itemsError } = await supabase.from('return_order_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;

    // 3. Cáº­p nháº­t Ä‘Æ¡n hÃ ng gá»‘c (cá»™ng dá»“n total_returned_amount)
    const { data: currentOrder, error: getOrderError } = await supabase
      .from('orders')
      .select('total_returned_amount, has_return')
      .eq('id', params.originalOrderId)
      .single();
    if (getOrderError) {
      console.warn('Could not fetch current order for cumulative update:', getOrderError);
    }
    const currentReturnedAmount = (currentOrder?.total_returned_amount || 0);
    const newTotalReturned = currentReturnedAmount + params.totalRefundAmount;

    // Server-side validation: prevent negative total_returned_amount (safety check)
    if (newTotalReturned < 0) {
      throw new Error('Tá»•ng tiá»n hoÃ n tráº£ khÃ´ng thá»ƒ Ã¢m. Dá»¯ liá»‡u khÃ´ng há»£p lá»‡.');
    }

    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({
        has_return: true,
        total_returned_amount: newTotalReturned,
      })
      .eq('id', params.originalOrderId);
    if (updateOrderError) throw updateOrderError;

    // 4. Cáº­p nháº­t tá»“n kho (cá»™ng láº¡i sá»‘ lÆ°á»£ng)
    for (const item of params.items) {
      const { error: stockError } = await supabase.rpc('increment_product_quantity', {
        p_product_id: item.productId,
        p_quantity: item.quantity,
      });
      if (stockError) {
        throw new Error(`Hoàn kho thất bại cho sản phẩm ${item.productName}: ${stockError.message}`);
      }
    }

    // 5. Cáº­p nháº­t cÃ´ng ná»£ khÃ¡ch hÃ ng náº¿u cÃ³ debtReduction
    if (params.debtReduction > 0) {
      // Láº¥y cÃ´ng ná»£ hiá»‡n táº¡i
      const { data: customer, error: getCustError } = await supabase
        .from('customers')
        .select('debt')
        .eq('id', params.customerId)
        .single();
      if (!getCustError && customer) {
        const newDebt = Math.max(0, customer.debt - params.debtReduction);
        const { error: updateDebtError } = await supabase
          .from('customers')
          .update({ debt: newDebt })
          .eq('id', params.customerId);
        if (updateDebtError) console.warn('KhÃ´ng thá»ƒ cáº­p nháº­t cÃ´ng ná»£:', updateDebtError);
      }
    }

    // 6. Trá»« total_spent cá»§a khÃ¡ch hÃ ng (Ä‘iá»u chá»‰nh doanh sá»‘)
    if (params.totalRefundAmount > 0) {
      const { data: customer } = await supabase
        .from('customers')
        .select('total_spent')
        .eq('id', params.customerId)
        .single();
      if (customer) {
        const newTotalSpent = Math.max(0, customer.total_spent - params.totalRefundAmount);
        await supabase
          .from('customers')
          .update({ total_spent: newTotalSpent })
          .eq('id', params.customerId);
      }
    }

    return {
      id: returnId,
      originalOrderId: params.originalOrderId,
      date: now,
      customerId: params.customerId,
      customerName: params.customerName,
      totalAmount: params.totalRefundAmount,
      totalRefundAmount: params.totalRefundAmount,
      refundMethod: 'cash',
      debtReduction: params.debtReduction,
      cashRefund: params.cashRefund,
      reason: params.reason,
      note: params.note,
      status: 'completed',
      grossRefundAmount: params.grossRefundAmount ?? params.totalRefundAmount,
      feePercent: params.feePercent ?? 0,
      feeAmount: params.feeAmount ?? 0,
      daysSincePurchase: params.daysSincePurchase ?? 0,
      originalPaymentMethod: params.originalPaymentMethod,
      items: params.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitName: item.unitName,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        reason: item.reason,
      })),
      createdAt: now,
      updatedAt: now,
    };
  },


  async getReturnOrders(): Promise<import('../types').ReturnOrder[]> {
    const { data, error } = await supabase
      .from('return_orders')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;

    const returnOrders: import('../types').ReturnOrder[] = [];
    for (const r of data || []) {
      const { data: items } = await supabase
        .from('return_order_items')
        .select('*')
        .eq('return_order_id', r.id);

      returnOrders.push(mapReturnOrderFromDB(r, items || []));
    }
    return returnOrders;
  },

  async getReturnOrdersByOrderId(orderId: string): Promise<import('../types').ReturnOrder[]> {
    const { data, error } = await supabase
      .from('return_orders')
      .select('*')
      .eq('original_order_id', orderId)
      .order('date', { ascending: false });
    if (error) throw error;

    const returnOrders: import('../types').ReturnOrder[] = [];
    for (const r of data || []) {
      const { data: items } = await supabase
        .from('return_order_items')
        .select('*')
        .eq('return_order_id', r.id);

      returnOrders.push(mapReturnOrderFromDB(r, items || []));
    }
    return returnOrders;
  },

  async getReturnOrderById(id: string): Promise<import('../types').ReturnOrder | null> {
    const { data, error } = await supabase
      .from('return_orders')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return null;

    const { data: items } = await supabase
      .from('return_order_items')
      .select('*')
      .eq('return_order_id', data.id);

    return mapReturnOrderFromDB(data, items || []);
  },

  async filterReturnOrdersPaginated(
    page: number,
    pageSize: number,
    searchTerm?: string,
    filters?: { fromDate?: string; toDate?: string; status?: string }
  ) {
    const { data, error } = await supabase.rpc('filter_return_orders_rpc', {
      p_search_term: searchTerm || null,
      p_page: page,
      p_page_size: pageSize,
      p_from_date: filters?.fromDate || null,
      p_to_date: filters?.toDate || null,
      p_status: filters?.status || null
    });
    if (error) throw error;
    const result = data as { returnOrders: any[]; totalCount: number };
    return {
      returnOrders: (result.returnOrders || []).map((r: any) => mapReturnOrderFromDB(r, [])),
      totalCount: result.totalCount || 0
    };
  },

  async cancelReturnOrder(id: string): Promise<void> {
    const { error } = await supabase.rpc('cancel_return_order_v2', {
      p_return_id: id,
    });
    if (error) throw error;
  },

  // ─── DISPOSAL (XUẤT HỦY) ───────────────────────────────────────

  async getDisposals(filters?: DisposalFilter): Promise<Disposal[]> {
    let query = supabase.from('disposals').select('*, disposal_items(*)');

    if (filters?.fromDate) query = query.gte('date', filters.fromDate);
    if (filters?.toDate) query = query.lte('date', filters.toDate);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.createdBy) query = query.eq('created_by', filters.createdBy);
    if (filters?.code) query = query.ilike('code', `%${filters.code}%`);

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;

    return (data || []).map(mapDisposalFromDB);
  },

  async getDisposalById(id: string): Promise<Disposal | null> {
    const { data, error } = await supabase
      .from('disposals')
      .select('*, disposal_items(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return mapDisposalFromDB(data);
  },

  async filterDisposalsPaginated(
    page: number,
    pageSize: number,
    searchTerm?: string,
    filters?: { fromDate?: string; toDate?: string; status?: string }
  ) {
    const { data, error } = await supabase.rpc('filter_disposals_rpc', {
      p_search_term: searchTerm || null,
      p_page: page,
      p_page_size: pageSize,
      p_from_date: filters?.fromDate || null,
      p_to_date: filters?.toDate || null,
      p_status: filters?.status || null
    });
    if (error) throw error;
    const result = data as { disposals: any[]; totalCount: number };
    return {
      disposals: (result.disposals || []).map(mapDisposalFromDB),
      totalCount: result.totalCount || 0
    };
  },

  async createDisposal(disposal: DisposalInput): Promise<Disposal> {
    const codeRes = await supabase.rpc('get_disposal_auto_code');
    if (codeRes.error) throw codeRes.error;
    const code = codeRes.data;
    if (!code) throw new Error('Không sinh được mã xuất hủy');

    const disposalId = `DSP${Date.now()}`;
    const now = new Date().toISOString();

    // Insert disposal
    const { error: disposalError } = await supabase.from('disposals').insert({
      id: disposalId,
      code: code,
      date: now,
      created_by: 'system',
      status: disposal.status,
      reason: disposal.reason,
      note: disposal.note,
      total_quantity: disposal.items.reduce((sum, i) => sum + i.quantity, 0),
      total_value: disposal.items.reduce((sum, i) => sum + i.totalValue, 0),
    });
    if (disposalError) throw disposalError;

    // Insert items
    const items = disposal.items.map((item: any) => ({
      disposal_id: disposalId,
      product_id: item.productId,
      product_code: item.productCode || null,
      product_name: item.productName,
      quantity: item.quantity,
      cost_price: item.costPrice,
      total_value: item.totalValue,
      lot_id: item.lotId || null,
      lot_code: item.lotCode || null,
      expiry_date: item.expiryDate || null,
      category_id: item.categoryId || null,
      category_name: item.categoryName || null,
      brand_id: item.brandId || null,
      brand_name: item.brandName || null,
    }));

    if (items.length > 0) {
      const { error: itemsError } = await supabase.from('disposal_items').insert(items);
      if (itemsError) throw itemsError;
    }

    return {
      id: disposalId,
      code: code,
      date: now,
      createdBy: 'system',
      status: disposal.status,
      reason: disposal.reason,
      note: disposal.note,
      items: disposal.items,
      totalQuantity: disposal.items.reduce((sum, i) => sum + i.quantity, 0),
      totalValue: disposal.items.reduce((sum, i) => sum + i.totalValue, 0),
      createdAt: now,
      updatedAt: now,
    };
  },

  async completeDisposal(id: string): Promise<Disposal> {
    const { data, error } = await supabase
      .rpc('complete_disposal', { p_disposal_id: id });

    if (error) throw new Error(error.message || 'Lỗi hoàn thành xuất hủy');

    return this.getDisposalById(id) as Promise<Disposal>;
  },

  async updateDisposal(id: string, disposal: Partial<Disposal>): Promise<Disposal> {
    const updates: any = {};
    if (disposal.status) updates.status = disposal.status;
    if (disposal.reason) updates.reason = disposal.reason;
    if (disposal.note) updates.note = disposal.note;
    if (disposal.totalQuantity) updates.total_quantity = disposal.totalQuantity;
    if (disposal.totalValue) updates.total_value = disposal.totalValue;

    const { error } = await supabase.from('disposals').update(updates).eq('id', id);
    if (error) throw error;

    return this.getDisposalById(id) as Promise<Disposal>;
  },

  async updateDisposalWithItems(id: string, disposal: DisposalInput): Promise<Disposal> {
    const updates: any = {};
    if (disposal.status) updates.status = disposal.status;
    if (disposal.reason) updates.reason = disposal.reason;
    if (disposal.note !== undefined) updates.note = disposal.note;
    updates.total_quantity = disposal.items.reduce((sum, i) => sum + i.quantity, 0);
    updates.total_value = disposal.items.reduce((sum, i) => sum + i.totalValue, 0);
    updates.updated_at = new Date().toISOString();

    const { error: disposalError } = await supabase.from('disposals').update(updates).eq('id', id);
    if (disposalError) throw disposalError;

    // Delete old items and insert new ones
    const { error: deleteError } = await supabase.from('disposal_items').delete().eq('disposal_id', id);
    if (deleteError) throw deleteError;

    const items = disposal.items.map((item: any) => ({
      disposal_id: id,
      product_id: item.productId,
      product_code: item.productCode || null,
      product_name: item.productName,
      quantity: item.quantity,
      cost_price: item.costPrice,
      total_value: item.totalValue,
      lot_id: item.lotId || null,
      lot_code: item.lotCode || null,
      expiry_date: item.expiryDate || null,
      category_id: item.categoryId || null,
      category_name: item.categoryName || null,
      brand_id: item.brandId || null,
      brand_name: item.brandName || null,
    }));

    if (items.length > 0) {
      const { error: itemsError } = await supabase.from('disposal_items').insert(items);
      if (itemsError) throw itemsError;
    }

    return this.getDisposalById(id) as Promise<Disposal>;
  },

  async deleteDisposal(id: string): Promise<void> {
    // Gọi RPC hoàn kho/lô khi xóa phiếu COMPLETED.
    // Migration: supabase_migration_delete_disposal_with_restore.sql
    const { error } = await supabase.rpc('delete_disposal_with_restore', {
      p_disposal_id: id,
    });

    if (error) {
      const msg = (error.message || '') + ' ' + ((error as any).details || '');
      const notFound = /function.*delete_disposal_with_restore.*does not exist|Could not find the function/i.test(msg);
      if (notFound) {
        // Fallback: RPC chưa migrate → xóa đơn giản (KHÔNG hoàn kho)
        console.warn('[deleteDisposal] RPC chưa tồn tại — chạy migration supabase_migration_delete_disposal_with_restore.sql. Fallback xóa đơn giản (KHÔNG hoàn kho).');
        const { error: delErr } = await supabase.from('disposals').delete().eq('id', id);
        if (delErr) throw delErr;
        return;
      }
      throw new Error(error.message || 'Lỗi xóa phiếu xuất hủy');
    }
  },

  // ─── SUPPLIER EXCHANGE (ĐỔI TRẢ HÀNG NHÀ CUNG CẤP) ─────────────────

  async getSupplierExchanges(filters?: SupplierExchangeFilter): Promise<SupplierExchange[]> {
    let query = supabase
      .from('supplier_exchanges')
      .select(`
        *,
        supplier_exchange_return_items(*),
        supplier_exchange_received_items(*)
      `);

    if (filters?.fromDate) query = query.gte('date', filters.fromDate);
    if (filters?.toDate) query = query.lte('date', filters.toDate);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.supplierId) query = query.eq('supplier_id', filters.supplierId);
    if (filters?.referenceReceiptId) query = query.eq('reference_receipt_id', filters.referenceReceiptId);
    if (filters?.code) query = query.ilike('code', `%${filters.code}%`);

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;

    return (data || []).map((d: any) => ({
      id: d.id,
      code: d.code,
      date: d.date,
      supplierId: d.supplier_id,
      supplierName: d.supplier_name,
      referenceReceiptId: d.reference_receipt_id,
      status: d.status,
      returnTotalValue: Number(d.return_total_value ?? 0),
      receivedTotalValue: Number(d.received_total_value ?? 0),
      debtAdjustment: Number(d.debt_adjustment ?? 0),
      reason: d.reason,
      note: d.note,
      returnItems: (d.supplier_exchange_return_items || []).map((item: any) => ({
        id: item.id,
        exchangeId: item.exchange_id,
        productId: item.product_id,
        productName: item.product_name,
        lotId: item.lot_id || undefined,
        lotCode: item.lot_code,
        expiryDate: item.expiry_date ? item.expiry_date.slice(0, 10) : undefined,
        quantity: Number(item.quantity ?? 0),
        cost: Number(item.cost ?? 0),
        totalValue: Number(item.total_value ?? 0),
        referenceImportItemId: item.reference_import_item_id,
      })),
      receivedItems: (d.supplier_exchange_received_items || []).map((item: any) => ({
        id: item.id,
        exchangeId: item.exchange_id,
        productId: item.product_id,
        productName: item.product_name,
        lotId: item.lot_id || undefined,
        lotCode: item.lot_code,
        expiryDate: item.expiry_date ? item.expiry_date.slice(0, 10) : undefined,
        quantity: Number(item.quantity ?? 0),
        cost: Number(item.cost ?? 0),
        totalValue: Number(item.total_value ?? 0),
      })),
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  },

  async getSupplierExchangeById(id: string): Promise<SupplierExchange | null> {
    const { data, error } = await supabase
      .from('supplier_exchanges')
      .select(`
        *,
        supplier_exchange_return_items(*),
        supplier_exchange_received_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: data.id,
      code: data.code,
      date: data.date,
      supplierId: data.supplier_id,
      supplierName: data.supplier_name,
      referenceReceiptId: data.reference_receipt_id,
      status: data.status,
      returnTotalValue: Number(data.return_total_value ?? 0),
      receivedTotalValue: Number(data.received_total_value ?? 0),
      debtAdjustment: Number(data.debt_adjustment ?? 0),
      reason: data.reason,
      note: data.note,
      returnItems: (data.supplier_exchange_return_items || []).map((item: any) => ({
        id: item.id,
        exchangeId: item.exchange_id,
        productId: item.product_id,
        productName: item.product_name,
        lotId: item.lot_id || undefined,
        lotCode: item.lot_code,
        expiryDate: item.expiry_date ? item.expiry_date.slice(0, 10) : undefined,
        quantity: Number(item.quantity ?? 0),
        cost: Number(item.cost ?? 0),
        totalValue: Number(item.total_value ?? 0),
        referenceImportItemId: item.reference_import_item_id,
      })),
      receivedItems: (data.supplier_exchange_received_items || []).map((item: any) => ({
        id: item.id,
        exchangeId: item.exchange_id,
        productId: item.product_id,
        productName: item.product_name,
        lotId: item.lot_id || undefined,
        lotCode: item.lot_code,
        expiryDate: item.expiry_date ? item.expiry_date.slice(0, 10) : undefined,
        quantity: Number(item.quantity ?? 0),
        cost: Number(item.cost ?? 0),
        totalValue: Number(item.total_value ?? 0),
      })),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async createSupplierExchange(input: SupplierExchangeInput): Promise<SupplierExchange> {
    const exchangeId = `SEX${Date.now()}`;
    const status = input.status || 'completed';

    const payload = {
      id: exchangeId,
      supplier_id: input.supplierId,
      reference_receipt_id: input.referenceReceiptId,
      date: input.date || new Date().toISOString(),
      reason: input.reason || '',
      note: input.note || '',
      status,
      return_items: input.returnItems.map((item) => ({
        product_id: item.productId,
        lot_id: item.lotId,
        quantity: item.quantity,
        cost: item.cost,
        reference_import_item_id: item.referenceImportItemId,
      })),
      received_items: input.receivedItems.map((item) => ({
        product_id: item.productId,
        lot_code: item.lotCode,
        expiry_date: item.expiryDate,
        quantity: item.quantity,
        cost: item.cost,
      })),
    };

    const { data, error } = await supabase.rpc('create_supplier_exchange', {
      p_payload: payload,
    });

    if (error) {
      console.error('create_supplier_exchange error:', error);
      throw new Error(error.message || 'Lỗi khi tạo phiếu đổi trả hàng NCC');
    }

    if (!data?.ok) {
      throw new Error(data?.message || 'Tạo phiếu đổi trả thất bại');
    }

    return this.getSupplierExchangeById(exchangeId) as Promise<SupplierExchange>;
  },

  async cancelSupplierExchange(id: string): Promise<any> {
    const { data, error } = await supabase.rpc('cancel_supplier_exchange', {
      p_exchange_id: id,
    });

    if (error) {
      throw new Error(error.message || 'Lỗi khi hủy phiếu đổi trả hàng NCC');
    }

    return data;
  },

  // Reports (Phase 8)
  async getSalesReport(
    startDate: string,
    endDate: string,
    filters?: { status?: string; paymentMethod?: string; productKeyword?: string; customerKeyword?: string }
  ) {
    const { data, error } = await supabase.rpc('get_sales_report', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_status: filters?.status || 'all',
      p_payment_method: filters?.paymentMethod || '',
      p_product_keyword: filters?.productKeyword || '',
      p_customer_keyword: filters?.customerKeyword || ''
    });
    if (error) throw error;
    return data as {
      summary: {
        totalRevenue: number;
        totalOrders: number;
        avgOrderValue: number;
        uniqueCustomers: number;
        completedRevenue: number;
        cancelledRevenue: number;
        completedOrders: number;
        cancelledOrders: number;
        prevRevenue: number;
        prevOrdersCount: number;
      };
      dailyRevenue: { date: string; revenue: number; orders: number; profit: number }[];
      paymentData: { name: string; value: number }[];
      groupedByProduct: { key: string; label: string; revenue: number; orders: number; count: number }[];
      groupedByCustomer: { key: string; label: string; revenue: number; orders: number; count: number }[];
      groupedByDay: { key: string; label: string; revenue: number; orders: number; count: number }[];
      groupedByOrder: { key: string; label: string; revenue: number; orders: number; count: number }[];
      detailRows: { date: string; orderId: string; productName: string; quantity: number; revenue: number; customerName: string; paymentMethod: string }[];
    };
  },

  async getProfitReport(
    startDate: string,
    endDate: string,
    filters?: { status?: string; paymentMethod?: string; productKeyword?: string; customerKeyword?: string; compareMode?: string }
  ) {
    const { data, error } = await supabase.rpc('get_profit_report', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_status: filters?.status || 'all',
      p_payment_method: filters?.paymentMethod || '',
      p_product_keyword: filters?.productKeyword || '',
      p_customer_keyword: filters?.customerKeyword || '',
      p_compare_mode: filters?.compareMode || 'prev'
    });
    if (error) throw error;
    return data as {
      summary: {
        totalRevenue: number;
        totalCost: number;
        profit: number;
        margin: number;
        prevRevenue: number;
        prevCost: number;
        prevProfit: number;
        profitChange: number;
      };
      dailyProfit: { date: string; currentRevenue: number; currentProfit: number; prevRevenue: number; prevProfit: number }[];
      profitDetails: { date: string; orderId: string; productName: string; revenue: number; cost: number; profit: number; margin: number }[];
      groupedByProduct: { key: string; label: string; revenue: number; cost: number; profit: number; count: number }[];
      groupedByCustomer: { key: string; label: string; revenue: number; cost: number; profit: number; count: number }[];
      groupedByDay: { key: string; label: string; revenue: number; cost: number; profit: number; count: number }[];
    };
  },

  async getInventoryReport(
    startDate: string,
    endDate: string,
    filters?: { category?: string; stockStatus?: string }
  ) {
    const { data, error } = await supabase.rpc('get_inventory_report', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_category: filters?.category || '',
      p_stock_status: filters?.stockStatus || 'all'
    });
    if (error) throw error;
    return data as {
      summary: {
        totalValue: number;
        totalQty: number;
        lowStockCount: number;
        outOfStockCount: number;
      };
      inventoryByCategory: { name: string; value: number }[];
      exportInPeriod: { productId: string; name: string; qty: number; value: number }[];
      lowStockProducts: { id: string; code: string; name: string; category: string; unit: string; quantity: number; minStock: number; cost: number; value: number }[];
      products: { id: string; code: string; name: string; category: string; unit: string; quantity: number; minStock: number; cost: number; value: number }[];
      categories: string[];
    };
  },

  async getStockLedger(filters: {
    productId?: string;
    lotId?: string;
    voucherType?: string;
    startDate?: string;
    endDate?: string;
    includeCancelled?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const { data, error } = await supabase.rpc('get_stock_ledger', {
      p_product_id: filters.productId || null,
      p_from_date: filters.startDate || null,
      p_to_date: filters.endDate || null,
      p_lot_id: filters.lotId || null,
      p_voucher_type: filters.voucherType || null,
      p_is_cancelled: filters.includeCancelled ? null : false,
      p_limit: filters.limit || 1000,
      p_offset: filters.offset || 0
    });
    if (error) throw error;
    return data as {
      id: string;
      posting_date: string;
      voucher_type: string;
      voucher_no: string;
      voucher_detail_no: string;
      product_id: string;
      product_name: string;
      lot_id: string;
      lot_code: string;
      warehouse: string;
      actual_qty: number;
      qty_after_transaction: number;
      valuation_rate: number;
      incoming_rate: number;
      outgoing_rate: number;
      stock_value: number;
      balance_value: number;
      reason: string;
      is_cancelled: boolean;
      created_at: string;
    }[];
  },

  async checkStockLedgerDrift() {
    const { data, error } = await supabase.rpc('check_stock_ledger_drift');
    if (error) throw error;
    return data as {
      product_id: string;
      lot_id: string;
      products_quantity: number;
      lot_sum: number;
      movement_sum: number;
      diff: number;
    }[];
  },

  async getCustomerReport(startDate: string, endDate: string) {
    const { data, error } = await supabase.rpc('get_customer_report', {
      p_start_date: startDate,
      p_end_date: endDate
    });
    if (error) throw error;
    return data as {
      summary: {
        totalCustomers: number;
        newCustomers: number;
        totalDebt: number;
        totalPoints: number;
        totalSpent: number;
      };
      topCustomers: { id: string; name: string; totalSpent: number; debt: number; loyaltyPoints: number; orderCount: number }[];
      customerGrowth: { date: string; newCustomers: number }[];
    };
  },

  async getSupplierReport(startDate: string, endDate: string) {
    const { data, error } = await supabase.rpc('get_supplier_report', {
      p_start_date: startDate,
      p_end_date: endDate
    });
    if (error) throw error;
    return data as {
      summary: {
        totalSuppliers: number;
        totalDebt: number;
        totalPaid: number;
        totalImportValue: number;
      };
      topSuppliers: { id: string; code: string; name: string; totalImportValue: number; totalPaid: number; debt: number; importCount: number }[];
      supplierGrowth: { date: string; newSuppliers: number }[];
      importBySupplier: { id: string; name: string; value: number }[];
    };
  },
};

