import * as XLSX from 'xlsx';
import { Order, Customer } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';
import { capitalizeProductName } from '../stringHelper';

export type ConflictAction = 'skip' | 'create_new';
export type SourceSoftware = 'vietsale' | 'misa' | 'kiotviet' | 'fast';

export interface ImportResult {
  success: ParsedOrder[];
  errors: ImportError[];
  sourceSoftware: SourceSoftware;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    newCustomers: number;
  };
}

export interface ParsedOrder {
  order: Order;
  conflictAction?: ConflictAction;   // chỉ set khi trùng đơn (mặc định skip)
  isDuplicate?: boolean;             // đơn đã tồn tại trong hệ thống
  isNewCustomer?: boolean;           // khách hàng sẽ được auto-create
  newCustomer?: Customer;            // dữ liệu khách hàng mới (nếu auto-create)
  warnings?: string[];
}

export interface ImportError {
  row: number;
  field?: string;
  error: string;
  rawData?: any;
}

// ──────────────────────────────────────────────────────────────
// MAPPING PRESETS — chuyển cột từ phần mềm khác về cột chuẩn
// ──────────────────────────────────────────────────────────────
const MAPPING_PRESETS: Record<Exclude<SourceSoftware, 'vietsale'>, Record<string, string>> = {
  misa: {
    'Mã chứng từ': 'Mã đơn',
    'Số chứng từ': 'Mã đơn',
    'Ngày chứng từ': 'Ngày tạo',
    'Đối tượng': 'Tên khách hàng',
    'Tên khách hàng': 'Tên khách hàng',
    'Tổng tiền hàng': 'Tổng tiền',
    'Thành tiền': 'Tổng tiền',
  },
  kiotviet: {
    'Mã hóa đơn': 'Mã đơn',
    'Invoice Code': 'Mã đơn',
    'Thời gian': 'Ngày tạo',
    'Created Date': 'Ngày tạo',
    'Khách hàng': 'Tên khách hàng',
    'Customer Name': 'Tên khách hàng',
    'Tổng cộng': 'Tổng tiền',
    'Total Amount': 'Tổng tiền',
  },
  fast: {
    'Số CT': 'Mã đơn',
    'Ngày CT': 'Ngày tạo',
    'Tên đối tượng': 'Tên khách hàng',
    'Tiền hàng': 'Tổng tiền',
  },
};

/**
 * Tự động nhận diện phần mềm nguồn dựa trên header của file.
 */
function detectSourceSoftware(firstRow: any): SourceSoftware {
  if (!firstRow) return 'vietsale';
  const cols = Object.keys(firstRow);

  // Nếu đã có cột chuẩn của VietSale thì giữ nguyên
  if (cols.includes('Mã đơn') && cols.includes('Tên khách hàng') && cols.includes('Tổng tiền')) {
    return 'vietsale';
  }
  if (cols.includes('Mã chứng từ') || cols.includes('Số chứng từ') || cols.includes('Đối tượng')) {
    return 'misa';
  }
  if (cols.includes('Mã hóa đơn') || cols.includes('Invoice Code')) {
    return 'kiotviet';
  }
  if (cols.includes('Số CT') || cols.includes('Tên đối tượng')) {
    return 'fast';
  }
  return 'vietsale';
}

/**
 * Áp dụng mapping preset: trả về row mới với các cột đã đổi tên về chuẩn.
 * Giữ lại cột gốc để không mất dữ liệu.
 */
function applyMapping(row: any, source: SourceSoftware): any {
  if (source === 'vietsale') return row;
  const preset = MAPPING_PRESETS[source];
  const mapped: any = { ...row };
  for (const [sourceCol, targetCol] of Object.entries(preset)) {
    if (row[sourceCol] !== undefined && mapped[targetCol] === undefined) {
      mapped[targetCol] = row[sourceCol];
    }
  }
  return mapped;
}

/**
 * Import orders from Excel file (Phase 3 - safe scope).
 * - Auto-create khách hàng nếu chưa tồn tại
 * - Mapping presets cho MISA / KiotViet / Fast
 * - Conflict resolution: skip (mặc định) hoặc create_new
 * - KHÔNG đụng tồn kho, KHÔNG cộng điểm (đơn lịch sử)
 */
export async function importOrdersFromExcel(file: File): Promise<ImportResult> {
  validateFile(file);

  const data = await readExcelFile(file);

  // Nhận diện phần mềm nguồn + áp dụng mapping
  const source = detectSourceSoftware(data.orders[0]);
  const mappedOrders = data.orders.map((r: any) => applyMapping(r, source));

  const structureValidation = validateExcelStructure(mappedOrders);
  if (!structureValidation.valid) {
    throw new Error(`Cấu trúc file không đúng:\n${structureValidation.errors.join('\n')}`);
  }

  // Cache khách hàng đã xử lý trong batch (tránh tạo trùng cùng tên trong 1 file)
  const customerCache = new Map<string, { id: string; isNew: boolean; customer?: Customer }>();

  const parsedOrders: ParsedOrder[] = [];
  const errors: ImportError[] = [];

  for (let i = 0; i < mappedOrders.length; i++) {
    const row = mappedOrders[i];
    const rowNumber = i + 2;

    try {
      const parsed = await parseOrderRow(row, data.orderItems, customerCache);

      const businessValidation = validateOrderData(parsed.order);
      if (!businessValidation.valid) {
        errors.push({
          row: rowNumber,
          error: businessValidation.errors.join('; '),
          rawData: row,
        });
        continue;
      }

      const isDuplicate = await checkDuplicateOrder(parsed.order.id);
      parsed.isDuplicate = isDuplicate;
      parsed.conflictAction = isDuplicate ? 'skip' : undefined;
      if (isDuplicate) {
        parsed.warnings = [...(parsed.warnings || []), 'Đơn hàng đã tồn tại'];
      }

      parsedOrders.push(parsed);
    } catch (err: any) {
      errors.push({
        row: rowNumber,
        error: err.message || 'Lỗi không xác định',
        rawData: row,
      });
    }
  }

  const newCustomers = parsedOrders.filter(p => p.isNewCustomer).length;

  return {
    success: parsedOrders,
    errors,
    sourceSoftware: source,
    summary: {
      total: mappedOrders.length,
      valid: parsedOrders.length,
      invalid: errors.length,
      newCustomers,
    },
  };
}

/**
 * Thực thi import. Trả về thống kê + audit log.
 * - skip: bỏ qua đơn trùng
 * - create_new: tạo đơn với ID mới
 * - Auto-create khách hàng mới (upsertCustomer)
 * - pointsEarned/pointsRedeemed = 0 (không cộng điểm cho đơn lịch sử)
 */
export async function executeImport(
  parsedOrders: ParsedOrder[],
  meta: { fileName: string; sourceSoftware: SourceSoftware }
): Promise<{ success: number; failed: number; skipped: number; newCustomers: number }> {
  let success = 0;
  let failed = 0;
  let skipped = 0;
  const createdOrderIds: string[] = [];
  const newCustomerIds: string[] = [];
  const errorLog: any[] = [];
  const createdCustomerNames = new Set<string>();

  for (const parsed of parsedOrders) {
    try {
      // Bỏ qua đơn trùng nếu action = skip
      if (parsed.isDuplicate && parsed.conflictAction === 'skip') {
        skipped++;
        continue;
      }

      // Auto-create khách hàng mới (chỉ 1 lần / tên)
      if (parsed.isNewCustomer && parsed.newCustomer) {
        if (!createdCustomerNames.has(parsed.newCustomer.name)) {
          await supabaseService.upsertCustomer(parsed.newCustomer);
          createdCustomerNames.add(parsed.newCustomer.name);
          newCustomerIds.push(parsed.newCustomer.id);
        }
      }

      // Nếu create_new: cấp ID mới để không đụng đơn cũ
      const orderToInsert: Order = { ...parsed.order };
      if (parsed.isDuplicate && parsed.conflictAction === 'create_new') {
        orderToInsert.id = generateOrderId();
      }

      // Đơn lịch sử: không cộng điểm
      orderToInsert.pointsEarned = 0;
      orderToInsert.pointsRedeemed = 0;
      orderToInsert.rewardsRedeemed = [];

      await supabaseService.createOrder(orderToInsert);
      createdOrderIds.push(orderToInsert.id);
      success++;
    } catch (error: any) {
      console.error('Import order failed:', error);
      errorLog.push({ orderId: parsed.order.id, error: error.message });
      failed++;
    }
  }

  // Ghi audit log (không throw nếu lỗi)
  await supabaseService.createImportHistory({
    id: `IMP-${Date.now()}`,
    fileName: meta.fileName,
    importType: 'orders',
    sourceSoftware: meta.sourceSoftware,
    totalRecords: parsedOrders.length,
    successRecords: success,
    skippedRecords: skipped,
    failedRecords: failed,
    createdOrderIds,
    newCustomerIds,
    errorLog,
    status: failed === 0 ? (skipped > 0 ? 'partial' : 'success') : 'partial',
  });

  return { success, failed, skipped, newCustomers: newCustomerIds.length };
}

// ========== HELPER FUNCTIONS ==========

function validateFile(file: File): void {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File quá lớn (>10MB). Vui lòng chọn file nhỏ hơn.');
  }
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  const isValidType =
    validTypes.includes(file.type) ||
    file.name.endsWith('.xlsx') ||
    file.name.endsWith('.xls');
  if (!isValidType) {
    throw new Error('File không đúng định dạng. Chỉ chấp nhận file .xlsx hoặc .xls');
  }
}

async function readExcelFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        if (workbook.SheetNames.length === 0) {
          throw new Error('File Excel không có sheet nào');
        }
        const ordersSheet = workbook.Sheets[workbook.SheetNames[0]];
        const orders = XLSX.utils.sheet_to_json(ordersSheet);
        let orderItems: any[] = [];
        if (workbook.SheetNames.length > 1) {
          const itemsSheet = workbook.Sheets[workbook.SheetNames[1]];
          orderItems = XLSX.utils.sheet_to_json(itemsSheet);
        }
        resolve({ orders, orderItems });
      } catch (err: any) {
        reject(new Error(`Không thể đọc file Excel: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file'));
    reader.readAsBinaryString(file);
  });
}

function validateExcelStructure(orders: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!orders || orders.length === 0) {
    errors.push('File Excel không có dữ liệu đơn hàng (Sheet 1 trống)');
    return { valid: false, errors };
  }
  const requiredColumns = ['Mã đơn', 'Ngày tạo', 'Tên khách hàng', 'Tổng tiền'];
  const firstRow = orders[0];
  requiredColumns.forEach((col) => {
    if (!(col in firstRow)) {
      errors.push(`Thiếu cột bắt buộc: "${col}" (kiểm tra lại định dạng file hoặc phần mềm nguồn)`);
    }
  });
  return { valid: errors.length === 0, errors };
}

async function parseOrderRow(
  row: any,
  orderItems: any[],
  customerCache: Map<string, { id: string; isNew: boolean; customer?: Customer }>
): Promise<ParsedOrder> {
  const customerName = (row['Tên khách hàng'] || '').toString().trim();
  if (!customerName) {
    throw new Error('Thiếu tên khách hàng');
  }

  // Resolve / auto-create khách hàng (có cache theo tên)
  let cacheEntry = customerCache.get(customerName.toLowerCase());
  if (!cacheEntry) {
    const existingId = await findCustomerByName(customerName);
    if (existingId) {
      cacheEntry = { id: existingId, isNew: false };
    } else {
      const newCustomer = await buildNewCustomer(customerName, row['Mã khách'] || row['Mã khách hàng']);
      cacheEntry = { id: newCustomer.id, isNew: true, customer: newCustomer };
    }
    customerCache.set(customerName.toLowerCase(), cacheEntry);
  }

  const orderDate = parseExcelDate(row['Ngày tạo']);

  const maDon = row['Mã đơn'];
  const items = orderItems
    .filter((item) => item['Mã đơn'] === maDon)
    .map((item) => {
      const productName = item['Tên sản phẩm'];
      if (!productName) {
        throw new Error(`Thiếu tên sản phẩm trong chi tiết đơn ${maDon}`);
      }
      return {
        productId: item['Mã SP'] || '',
        productName: capitalizeProductName(productName),
        quantity: parseFloat(item['Số lượng']) || 0,
        unitName: item['Đơn vị'] || 'cái',
        price: parseFloat(item['Đơn giá']) || 0,
      };
    });

  if (items.length === 0) {
    throw new Error('Đơn hàng không có sản phẩm (kiểm tra Sheet 2 "Chi tiết SP")');
  }

  const order: Order = {
    id: (maDon || '').toString().trim() || generateOrderId(),
    date: orderDate.toISOString(),
    customerId: cacheEntry.id,
    customerName,
    items,
    totalAmount: parseFloat(row['Tổng tiền']) || 0,
    paidAmount: parseFloat(row['Khách trả']) || parseFloat(row['Tổng tiền']) || 0,
    debtRecorded: parseFloat(row['Ghi nợ']) || 0,
    paymentMethod: row['PT Thanh toán'] || row['Phương thức TT'] || 'cash',
    status: parseStatus(row['Trạng thái']) as any,
    pointsEarned: 0,
    pointsRedeemed: 0,
    note: row['Ghi chú'] || undefined,
    hasReturn: row['Có trả hàng'] === 'Có',
    totalReturnedAmount: parseFloat(row['Tiền đã trả']) || 0,
  };

  return {
    order,
    isNewCustomer: cacheEntry.isNew,
    newCustomer: cacheEntry.customer,
    warnings: cacheEntry.isNew ? [`Khách hàng mới sẽ được tạo: ${customerName}`] : [],
  };
}

async function findCustomerByName(name: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('customers')
      .select('id')
      .ilike('name', name)
      .limit(1)
      .single();
    return data?.id || null;
  } catch {
    return null;
  }
}

async function buildNewCustomer(name: string, code?: string): Promise<Customer> {
  let customerCode = (code || '').toString().trim();
  if (!customerCode) {
    try {
      customerCode = await supabaseService.getNextCustomerCode();
    } catch {
      customerCode = `KH${Date.now().toString().slice(-8)}`;
    }
  }
  return {
    id: `CUS-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    code: customerCode,
    name,
    phone: '',
    totalSpent: 0,
    debt: 0,
    loyaltyPoints: 0,
  };
}

function parseExcelDate(dateStr: string | number): Date {
  if (typeof dateStr === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + dateStr * 86400000);
  }
  const str = String(dateStr);
  const dmyPattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
  if (dmyPattern.test(str)) {
    const match = str.match(dmyPattern);
    if (match) {
      const [, day, month, year] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }
  const ymdPattern = /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/;
  if (ymdPattern.test(str)) {
    return new Date(str);
  }
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Không thể parse ngày tháng: "${dateStr}"`);
  }
  return parsed;
}

function parseStatus(status: string): string {
  if (!status) return 'completed';
  const statusMap: Record<string, string> = {
    'Hoàn thành': 'completed',
    'Chờ xử lý': 'pending',
    'Đã hủy': 'cancelled',
    completed: 'completed',
    pending: 'pending',
    cancelled: 'cancelled',
  };
  return statusMap[status] || 'completed';
}

function validateOrderData(order: Order): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!order.customerName || order.customerName.trim() === '') {
    errors.push('Thiếu tên khách hàng');
  }
  if (!order.totalAmount || order.totalAmount <= 0) {
    errors.push('Tổng tiền phải lớn hơn 0');
  }
  if (!order.items || order.items.length === 0) {
    errors.push('Đơn hàng không có sản phẩm');
  }
  if (order.paidAmount > order.totalAmount) {
    errors.push('Số tiền khách trả không được lớn hơn tổng tiền');
  }
  return { valid: errors.length === 0, errors };
}

async function checkDuplicateOrder(orderId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .single();
    return !!data;
  } catch {
    return false;
  }
}

function generateOrderId(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
