// ============================================================
// CORE TYPES - Vietsale Pro v7
// ============================================================

// ─── PRODUCT ──────────────────────────────────────────────────
export interface Product {
  // Core identification
  id: string;
  tenantId?: string;
  name: string;
  code?: string;
  displayName?: string;
  barcode?: string;
  
  // Pricing
  price?: number;
  cost?: number;
  
  // Inventory
  quantity?: number;
  /** @deprecated Use quantity instead */
  stock?: number;
  unit?: string;
  location?: string;
  
  // Stock management
  minStock?: number;
  maxStock?: number;
  safetyStock?: number;
  
  // Categorization
  category?: string;
  categoryId?: string;
  categoryName?: string;
  brand?: string;
  brandId?: string;
  brandName?: string;
  
  // Lot management
  hasBatches?: boolean;
  lots?: ProductLot[];
  
  // Unit conversion
  conversionUnits?: UnitConversion[];
  
  // Advanced features
  isPointAccumulationEnabled?: boolean;
  
  // Metadata
  image?: string;
  description?: string;
  isService?: boolean;
  weight?: number;
  taxRate?: TaxRateValue;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}


// ─── CUSTOMER ─────────────────────────────────────────────────
export interface Customer {
  id: string;
  tenantId?: string;
  code?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  debt?: number;
  // Giá trị thực tế lưu trong DB
  totalSpent?: number;
  loyaltyPoints?: number;
  totalOrders?: number;
  lastPurchaseDate?: string;
  rank?: CustomerRank;
  note?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  // Tương thích ngược với code/dữ liệu cũ
  totalPurchased?: number;
  points?: number;
}

// ─── SUPPLIER ─────────────────────────────────────────────────
export interface Supplier {
  id: string;
  tenantId?: string;
  code?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  note?: string;
  debt?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── CATEGORY & BRAND ─────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  children?: Category[];
  productCount?: number;
  status?: string;
  createdAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  productCount?: number;
  status?: string;
  createdAt?: string;
}

export interface BrandManagementItem {
  id: string;
  name: string;
  type: 'category' | 'brand';
  description?: string;
  productCount?: number;
  status?: string;
}

// ─── ORDER ────────────────────────────────────────────────────
export interface Order {
  id: string;
  tenantId?: string;
  customer?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerTaxCode?: string;
  totalAmount: number;
  date: string;
  status: string;
  paymentMethod?: string;
  items?: OrderItem[];
  // Financial extensions
  paidAmount?: number;
  debtRecorded?: number;
  // Loyalty
  pointsEarned?: number;
  pointsRedeemed?: number;
  rewardsRedeemed?: RedeemedReward[];
  appliedPromotions?: AppliedPromotion[];
  // Note
  note?: string;
  // Return
  hasReturn?: boolean;
  totalReturnedAmount?: number;
  // Extra metadata
  createdAt?: string;
  updatedAt?: string;
  total?: number;
  debt?: number;
}

export interface OrderItem {
  id?: string;
  tenantId?: string;
  name?: string;
  productName?: string;
  quantity: number;
  price: number;
  totalPrice?: number;
  productId?: string;
  unit?: string;
  unitName?: string;
  taxRate?: TaxRateValue;
  // Phase 3B.2: lot traceability — NULL for orders before Phase 3B.2
  lotId?: string;
  lotCode?: string;
  // Phase 5a: giá vốn snapshot tại thời điểm bán (NULL for orders before Phase 5a)
  cost?: number;
}

// ─── CART ─────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  barcode?: string;
  code?: string;
  image?: string;
  category?: string;
  quantity?: number;
  // Số lượng trong giỏ (mô hình POS: product spread + cartQuantity)
  cartQuantity?: number;
  price?: number;
  cost?: number;
  totalPrice?: number;
  unit?: string;
  weight?: number;
  taxRate?: TaxRateValue;
  lotId?: string;
  lotExpiry?: string;
  note?: string;
  discount?: number;
  discountPercent?: number;
  // Dữ liệu sản phẩm & lựa chọn trong giỏ hàng
  lots?: ProductLot[];
  conversionUnits?: UnitConversion[];
  selectedUnit?: UnitConversion;
  selectedLot?: ProductLot;
}

// ─── IMPORT ───────────────────────────────────────────────────
export interface ImportReceipt {
  id: string;
  supplierId?: string;
  supplierName?: string;
  totalAmount?: number;
  totalCost: number;
  shippingCost?: number;
  discountTotal?: number;
  debtRecorded?: number;
  invoiceNumber?: string;
  paidAmount?: number;
  date: string;
  status: string;
  note?: string;
  items?: ImportItemInput[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportItemInput {
  id?: string;
  productId: string;
  productName?: string;
  name?: string;
  quantity: number;
  price?: number;
  totalPrice?: number;
  cost: number;
  unit?: string;
  lotNumber?: string;
  lotCode?: string;
  expiryDate?: string;
  lotId?: string;
  discount?: number;
  adjustedCost?: number;
}

// ─── PRODUCT LOT ──────────────────────────────────────────────
export interface ProductLot {
  id: string;
  productId?: string;
  productName?: string;
  code?: string;              // Mã lô (used by ProductEditModal, Inventory)
  lotNumber?: string;         // Alias for code (DB field)
  expiryDate?: string;
  quantity: number;
  originalQuantity?: number;  // Số lượng ban đầu khi nhập
  availableQuantity?: number; // Số lượng còn lại khả dụng
  cost?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UnitConversion {
  id: string;
  productId?: string;
  name?: string;              // Tên đơn vị (used by ProductEditModal, Inventory)
  fromUnit?: string;          // Đơn vị gốc (DB field)
  toUnit?: string;            // Đơn vị đích (DB field)
  ratio?: number;             // Tỷ lệ quy đổi (used by UI)
  factor?: number;            // Alias for ratio (DB field)
  price?: number;             // Giá bán theo đơn vị này
}

// ─── INVENTORY ────────────────────────────────────────────────
// Một phiếu kiểm kê (document) chứa nhiều dòng sản phẩm.
export interface InventoryCountItem {
  id: string;
  countId?: string;
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  systemQuantity: number;
  actualQuantity: number;
  cost: number;
  reason: string;
  lotId?: string;
  lotCode?: string;
  expiryDate?: string;
}

export interface InventoryCount {
  id: string;
  code: string;
  date: string;
  status: 'draft' | 'completed' | 'cancelled';
  items: InventoryCountItem[];
  notes?: string;
  createdAt?: string;
  completedAt?: string;
}

// ─── PROMOTION ────────────────────────────────────────────────
export type PromotionType =
  | 'percent_on_total'
  | 'fixed_on_total'
  | 'percent_on_product'
  | 'percent_on_category'
  | 'buy_x_get_y'
  | 'tiered_quantity'
  | 'combo'
  | 'customer_rank';

export interface PromotionTier {
  id?: string;
  minQty: number;
  discountPercent: number;
  // Tương thích ngược
  minSpend?: number;
  maxSpend?: number;
  discountAmount?: number;
  giftProductId?: string;
  giftProductName?: string;
  giftQuantity?: number;
}

export interface Promotion {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
  type: PromotionType;
  isActive?: boolean;
  // Phase 9: thứ tự ưu tiên + điều kiện + quy tắc cộng dồn (ERPNext Pricing Rule)
  priority?: number;              // số nhỏ = ưu tiên cao
  minOrderValue?: number;         // giá trị giỏ hàng tối thiểu mới được áp
  maxDiscount?: number;           // số tiền giảm tối đa cho khuyến mãi này
  stackable?: boolean;            // TRUE = cho phép cộng dồn với các KM khác
  startDate?: string;
  endDate?: string;
  // Cấu hình theo từng loại khuyến mãi
  discountPercent?: number;       // % giảm
  discountFixed?: number;         // số tiền giảm cố định
  targetProductId?: string;       // SP áp dụng
  targetProductIds?: string[];
  targetCategory?: string;        // nhóm hàng áp dụng
  buyProductId?: string;          // mua X
  buyQuantity?: number;
  giftProductId?: string;         // tặng Y
  giftQuantity?: number;
  giftDiscountPercent?: number;
  tiers?: PromotionTier[];        // chiết khấu theo bậc số lượng
  mainProductId?: string;         // combo: SP chính
  comboProductId?: string;        // combo: SP mua kèm
  comboDiscountPercent?: number;
  minCustomerRank?: string;       // hạng KH tối thiểu
  // Metadata / legacy
  value?: number;
  maxUsage?: number;
  usedCount?: number;
  getQuantity?: number;
  status?: string;
  couponCode?: string;
  couponCount?: number;
  couponUsed?: number;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppliedPromotion {
  promotionId: string;
  promotionName: string;
  discountAmount: number;
  description?: string;
  // Tương thích ngược
  id?: string;
  name?: string;
  type?: PromotionType;
  tierId?: string;
}

// ─── CUSTOMER RANK / LOYALTY ─────────────────────────────────
export type CustomerRank = 'bronze' | 'silver' | 'gold' | 'diamond' | 'platinum';

// Cấu hình hạng nâng cao (dùng bởi rankingEngine + Settings)
export interface RankCondition {
  id?: string;
  metric: 'total_spent' | 'total_quantity';
  operator: 'gte' | 'lte' | 'between';
  minValue?: number;
  maxValue?: number;
  periodType?: 'year' | 'month' | 'custom';
  periodYear?: number;
  periodMonth?: number;
  periodStart?: string;
  periodEnd?: string;
  // Tương thích ngược
  value?: number;
}

export interface CustomerRankConfig {
  id: string;
  name: string;
  key: string;
  color?: string;
  description?: string;
  order: number;
  isDefault: boolean;
  discountPercent: number;
  conditions: RankCondition[];
  createdAt?: string;
  updatedAt?: string;
}

// Cấu hình hạng đơn giản theo mức chi tiêu (legacy helper)
export interface SimpleRankTier {
  rank: CustomerRank;
  name: string;
  minSpent: number;
  discountPercent: number;
  color?: string;
  benefits?: string[];
}

export interface CustomerRankHistory {
  id: string;
  customerId: string;
  customerName?: string;
  oldRank: string;
  oldRankName?: string;
  newRank: string;
  newRankName?: string;
  changedAt: string;
  reason?: string;
  totalSpentAtChange?: number;
  createdAt?: string;
}

export const CUSTOMER_RANK_CONFIG: SimpleRankTier[] = [
  { rank: 'bronze', name: 'Đồng', minSpent: 0, discountPercent: 0, color: '#CD7F32' },
  { rank: 'silver', name: 'Bạc', minSpent: 2_000_000, discountPercent: 3, color: '#C0C0C0' },
  { rank: 'gold', name: 'Vàng', minSpent: 10_000_000, discountPercent: 5, color: '#FFD700' },
  { rank: 'diamond', name: 'Kim cương', minSpent: 30_000_000, discountPercent: 7, color: '#B9F2FF' },
  { rank: 'platinum', name: 'Bạch kim', minSpent: 100_000_000, discountPercent: 10, color: '#E5E4E2' },
];

export function getCustomerRank(totalSpent: number): CustomerRank {
  const sorted = [...CUSTOMER_RANK_CONFIG].sort((a, b) => b.minSpent - a.minSpent);
  const found = sorted.find(r => totalSpent >= r.minSpent);
  return found ? found.rank : 'bronze';
}

// ─── REWARD ───────────────────────────────────────────────────
export interface Reward {
  id: string;
  name: string;
  description?: string;
  pointCost: number;
  stock?: number;
  quantity?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PointHistory {
  id: string;
  customerId: string;
  customerName?: string;
  // Giá trị thực tế lưu trong DB (bảng point_history)
  date: string;
  type: 'earn' | 'redeem' | 'adjust';
  amount: number;
  description?: string;
  orderId?: string;
  rewardId?: string;
  // Tương thích ngược với dữ liệu/cache cũ
  points?: number;
  createdAt?: string;
  note?: string;
}

// ─── INVOICE (POS TAB) ────────────────────────────────────────
// Mỗi "Invoice" là 1 tab đơn tạm trong màn hình bán hàng (POS).
export interface RedeemedReward {
  rewardId: string;
  rewardName: string;
  pointCost: number;
  quantity: number;
}

export interface Invoice {
  id: number;
  name: string;
  cart: CartItem[];
  customerId: string;
  redeemedRewards: RedeemedReward[];
  note?: string;
  appliedPromotions?: AppliedPromotion[];
}

// ─── E-INVOICE SUMMARY (hóa đơn điện tử — dành cho mở rộng) ────
export interface EInvoiceSummary {
  id: string;
  invoiceNo: string;
  orderId: string;
  customerId?: string;
  customerName: string;
  customerTaxCode?: string;
  totalAmount: number;
  taxAmount: number;
  status: string;
  type: 'sales' | 'return' | 'adjustment';
  einvoiceStatus?: EInvoiceStatus;
  invoicePattern?: string;
  invoiceSerial?: string;
  taxCodeReceived?: string;
  issuedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── RETURN ORDER ────────────────────────────────────────────
export interface ReturnOrder {
  id: string;
  orderId?: string;
  orderCode?: string;
  customerId?: string;
  customerName?: string;
  totalAmount?: number;
  refundAmount?: number;
  returnFee?: number;
  reason?: string;
  status?: string;
  items?: ReturnOrderItem[];
  createdAt?: string;
  updatedAt?: string;
  originalOrderId?: string;
  date?: string;
  totalRefundAmount?: number;
  refundMethod?: string;
  debtReduction?: number;
  cashRefund?: number;
  note?: string;
  grossRefundAmount?: number;
  feePercent?: number;
  feeAmount?: number;
  daysSincePurchase?: number;
  originalPaymentMethod?: string;
  pointsDeducted?: number;
}

export interface ReturnOrderItem {
  id?: string;
  returnOrderId?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitName?: string;
  unitPrice: number;
  subtotal: number;
  reason?: string;
  lotId?: string;
  lotCode?: string;
}

// ─── TAX TYPES ────────────────────────────────────────────────
export type TaxRateValue = 0 | 5 | 8 | 10 | -1;
export type EInvoiceStatus = 'draft' | 'pending_code' | 'signed' | 'error' | 'canceled';
export type PaymentMethodType = 'cash' | 'transfer' | 'card' | 'other';
export type TaxProvider = 'sapo_invoice' | 'm_invoice' | 'vnpt' | 'viettel';
export type DeclarationStatusType = 'draft' | 'submitted' | 'approved' | 'rejected';

// ─── E-INVOICE CONFIG ─────────────────────────────────────────
export interface EInvoiceConfig {
  id: string;
  provider: TaxProvider;
  
  // API connection
  api_key?: string;
  api_secret?: string;
  api_token?: string;  // OAuth2/Bearer token
  username?: string;
  password?: string;
  base_url?: string;
  base_url_prod?: string;
  
  // Thông tin doanh nghiệp
  store_name?: string;
  store_address?: string;
  store_tax_code?: string;
  invoice_pattern: string;
  invoice_serial: string;
  
  // Production mode
  is_production?: boolean;

  // Trạng thái kết nối
  is_connected: boolean;
  declaration_status: DeclarationStatusType;
  declaration_id?: string;
  approved_at?: string;
  
  // Digital signature
  cert_type?: string;
  cert_serial?: string;
  cert_issuer?: string;
  
  created_at?: string;
  updated_at?: string;
}

// ─── E-INVOICE ORDER ──────────────────────────────────────────
export interface EInvoiceOrder {
  id: string;
  order_id: string;
  
  // Thông tin hóa đơn
  invoice_no?: string;
  invoice_pattern: string;
  invoice_serial: string;
  
  // Trạng thái HĐĐT
  einvoice_status: EInvoiceStatus;
  error_message?: string;
  
  // Mã CQT
  tax_code_received?: string;
  tax_code_at?: string;
  
  // Thông tin người mua
  buyer_tax_code?: string;
  buyer_address?: string;
  buyer_name?: string;
  payment_method: string;
  tax_rate: number;
  
  // Xử lý sai sót
  replacing_invoice_no?: string;
  replaced_by_invoice_no?: string;
  cancel_reason?: string;
  cancel_at?: string;
  
  // Dữ liệu XML/PDF
  xml_data?: string;
  pdf_url?: string;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  issued_at?: string;
  
  // Joined from orders table
  total_amount?: number;
}

// ─── TAX CONNECTION CONFIG (Legacy, kept for backward compat) ─
export interface TaxConnectionConfig {
  provider: TaxProvider;
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  password?: string;
  baseUrl?: string;
  isConnected: boolean;
  lastSyncAt?: string;
}

export interface DeclarationStatus {
  id: string;
  status: DeclarationStatusType;
  formType: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectReason?: string;
  description?: string;
}

export interface ExtendedOrder extends Order {
  einvoiceStatus: EInvoiceStatus;
  taxRate: number;
  invoiceNo?: string;
  invoicePattern?: string;
  invoiceSerial?: string;
  taxCodeReceived?: string;
  errorMessage?: string;
  buyerTaxCode?: string;
  buyerAddress?: string;
  paymentMethod?: PaymentMethodType;
  replacingInvoiceNo?: string;
  replacedInvoiceInfo?: string;
}

// ─── APP SETTINGS ─────────────────────────────────────────────
export interface AppSettings {
  storeName: string;
  storePhone?: string;
  storeAddress: string;
  taxCode?: string;
  bankInfo?: string;
  currency?: string;
  taxId?: string;
  pointConversionRate?: number;
  printSize?: string;
  fontSize?: number;
  fontFamily?: string;
  logo?: string;
  invoiceTitle?: string;
  loyaltyPolicy?: string;
  promoInfo?: string;
  thankYouMessage?: string;
  returnFeeEnabled?: boolean;
  returnMaxDays?: number;
  returnFeePercent?: number;
  allowNegativeStock?: boolean;
}

// ─── DISPOSAL (XUẤT HỦY) ───────────────────────────────────────
export interface Disposal {
  id: string;
  code: string;
  date: string;
  createdBy?: string;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  reason?: string;
  note?: string;
  items: DisposalItem[];
  totalQuantity: number;
  totalValue: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DisposalItem {
  id?: string;
  disposalId?: string;
  productId: string;
  productCode?: string;
  productName: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  quantity: number;
  costPrice: number;
  totalValue: number;
  lotId?: string;
  lotCode?: string;
  expiryDate?: string;
}

export interface DisposalInput {
  items: DisposalItem[];
  reason: string;
  note?: string;
  status: 'DRAFT' | 'COMPLETED';
}

export interface DisposalFilter {
  fromDate?: string;
  toDate?: string;
  status?: string;
  createdBy?: string;
  code?: string;
  searchTerm?: string;
}

// ─── STOCK LEDGER (SỔ CÁI KHO) ──────────────────────────────────
export interface StockMovement {
  id: string;
  postingDate: string;
  voucherType: string;
  voucherNo: string;
  voucherDetailNo: string;
  productId: string;
  productName?: string;
  lotId?: string;
  lotCode?: string;
  warehouse?: string;
  actualQty: number;
  qtyAfterTransaction: number;
  valuationRate: number;
  incomingRate: number;
  outgoingRate: number;
  stockValue: number;
  balanceValue: number;
  reason?: string;
  isCancelled: boolean;
  createdAt?: string;
}

export interface StockLedgerFilters {
  productId?: string;
  lotId?: string;
  voucherType?: string;
  startDate?: string;
  endDate?: string;
  includeCancelled?: boolean;
  limit?: number;
  offset?: number;
}

// ─── SUPPLIER EXCHANGE (ĐỔI TRẢ HÀNG NHÀ CUNG CẤP) ─────────────
export interface SupplierExchange {
  id: string;
  code: string;
  date: string;
  supplierId: string;
  supplierName?: string;
  referenceReceiptId: string;
  status: 'draft' | 'completed' | 'cancelled';
  returnTotalValue: number;
  receivedTotalValue: number;
  debtAdjustment: number;
  reason?: string;
  note?: string;
  returnItems: SupplierExchangeReturnItem[];
  receivedItems: SupplierExchangeReceivedItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierExchangeReturnItem {
  id?: string;
  exchangeId?: string;
  productId: string;
  productName: string;
  productCode?: string;
  lotId?: string;
  lotCode?: string;
  expiryDate?: string;
  quantity: number;
  cost: number;
  totalValue: number;
  referenceImportItemId: string;
}

export interface SupplierExchangeReceivedItem {
  id?: string;
  tenantId?: string;
  exchangeId?: string;
  productId: string;
  productName: string;
  productCode?: string;
  lotId?: string;
  lotCode: string;
  expiryDate?: string;
  quantity: number;
  cost: number;
  totalValue: number;
}

export interface SupplierExchangeInput {
  supplierId: string;
  referenceReceiptId: string;
  date?: string;
  reason?: string;
  note?: string;
  status?: 'draft' | 'completed';
  returnItems: SupplierExchangeReturnItem[];
  receivedItems: SupplierExchangeReceivedItem[];
}

export interface SupplierExchangeFilter {
  fromDate?: string;
  toDate?: string;
  status?: string;
  supplierId?: string;
  referenceReceiptId?: string;
  code?: string;
  searchTerm?: string;
}

// ─── UTILITY TYPES ────────────────────────────────────────────
export type OrderStatus = 'pending' | 'completed' | 'canceled' | 'refunded';
