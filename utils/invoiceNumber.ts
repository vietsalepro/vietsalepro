import { supabase } from '../lib/supabase';

/**
 * Format số thứ tự thành mã hóa đơn HDXXXXXXX.
 * - Tối thiểu 7 chữ số (HD0000001)
 * - Tự động tăng thêm 1 X khi số lượng vượt quá 7 chữ số
 *   (ví dụ: 9.999.999 → HD9999999, 10.000.000 → HD00000001)
 */
export function formatInvoiceNumber(n: number): string {
  const minWidth = 7;
  const width = Math.max(minWidth, String(n).length);
  return `HD${String(n).padStart(width, '0')}`;
}

/**
 * Parse mã hóa đơn HDXXXXXXX để lấy số thứ tự.
 * Trả về null nếu không đúng định dạng.
 */
export function parseInvoiceNumber(id: string): number | null {
  const match = id.match(/^HD(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * [FALLBACK] Lấy số thứ tự tiếp theo từ danh sách đơn hàng có mã HD trong DB.
 * ⚠️ KHÔNG atomic (đọc MAX phía client) → chỉ dùng làm dự phòng khi RPC
 * get_order_auto_code chưa được migrate. Đường chính giờ dùng SEQUENCE phía DB
 * (xem supabase_migration_order_auto_code.sql).
 */
export async function getNextInvoiceNumber(): Promise<number> {
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .ilike('id', 'HD%');

  if (error) throw error;

  let max = 0;
  for (const order of data || []) {
    const num = parseInvoiceNumber(order.id);
    if (num !== null && num > max) {
      max = num;
    }
  }
  return max + 1;
}

/**
 * Sinh mã hóa đơn HD tiếp theo.
 * ✅ Đường chính: gọi RPC `get_order_auto_code` — dùng SEQUENCE phía DB nên
 *    ATOMIC, không bao giờ trùng kể cả khi nhiều máy bán đồng thời.
 * ↩️ Fallback: nếu RPC chưa được migrate (hàm chưa tồn tại) thì quay về cách
 *    cũ MAX+1 để không chặn nghiệp vụ — lúc này admin cần chạy migration
 *    supabase_migration_order_auto_code.sql.
 */
export async function generateInvoiceNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('get_order_auto_code');
  if (!error && typeof data === 'string' && data) {
    return data;
  }
  console.warn(
    '[invoiceNumber] RPC get_order_auto_code không khả dụng — fallback MAX+1 (không atomic). ' +
    'Hãy chạy migration supabase_migration_order_auto_code.sql.',
    error
  );
  const next = await getNextInvoiceNumber();
  return formatInvoiceNumber(next);
}

/**
 * Sinh mã hóa đơn dự phòng khi offline.
 * Vẫn giữ prefix HD để đồng nhất, nhưng kèm timestamp + random để tránh trùng.
 * Đơn offline này sẽ không theo dãy số tăng dần chuẩn, nhưng đảm bảo duy nhất.
 */
export function generateOfflineInvoiceNumber(): string {
  const random = Math.random().toString(36).slice(2, 7);
  return `HD${Date.now()}_${random}`;
}

/**
 * Nhận diện lỗi trùng khóa chính (duplicate invoice number) từ Supabase/Postgres.
 */
export function isDuplicateInvoiceNumberError(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || error.details || '').toLowerCase();
  const code = error.code || '';
  return (
    code === '23505' ||
    msg.includes('duplicate key') ||
    msg.includes('unique constraint') ||
    msg.includes('duplicate') ||
    msg.includes('already exists') ||
    msg.includes('violates unique constraint')
  );
}
