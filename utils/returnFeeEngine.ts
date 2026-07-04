import { AppSettings, Order } from '../types';

// ─── Phí trả hàng (Return Fee Engine) ──────────────────────────────────
// Quy tắc:
//  - Trả trong cùng ngày mua  → không mất phí (bất kể phương thức thanh toán).
//  - Trả từ ngày hôm sau đến hết ngày thứ X → áp dụng feePercent.
//  - Trả sau X ngày → chặn cứng (eligible = false).
//  - Nếu returnFeeEnabled = false → không bao giờ tính phí, không chặn quá hạn.

export interface ReturnFeeConfig {
  enabled: boolean;       // settings.returnFeeEnabled
  maxDays: number;        // settings.returnMaxDays (X)
  feePercent: number;     // settings.returnFeePercent (%)
}

export interface ReturnFeeResult {
  eligible: boolean;          // Có được phép trả hàng không
  blocked: boolean;           // true nếu quá hạn (quá X ngày) khi đã bật tính phí
  blockReason?: string;       // Lý do chặn
  daysSincePurchase: number;  // Số ngày chênh lệch (>=0)
  sameDay: boolean;           // Trả trong ngày mua
  feePercent: number;         // % phí áp dụng thực tế (0 nếu không tính)
  feeAmount: number;          // Số tiền phí = gross * feePercent / 100
  grossRefundAmount: number;  // Giá trị hàng trả trước khi trừ phí
  netRefundAmount: number;    // Số tiền hoàn thực = gross - feeAmount
}

/** Lấy cấu hình phí trả hàng từ AppSettings (có default an toàn). */
export function getReturnFeeConfig(settings?: Partial<AppSettings> | null): ReturnFeeConfig {
  return {
    enabled: settings?.returnFeeEnabled ?? false,
    maxDays: Math.max(0, Math.floor(Number(settings?.returnMaxDays ?? 0))),
    feePercent: Math.max(0, Number(settings?.returnFeePercent ?? 0)),
  };
}

/** Số ngày lịch chênh lệch giữa ngày mua và ngày trả (bỏ phần giờ). */
export function calcDaysBetween(purchaseDate: string | Date, returnDate: string | Date = new Date()): number {
  const p = new Date(purchaseDate);
  const r = new Date(returnDate);
  // Chuẩn hoá về 00:00 để so theo ngày lịch
  const pDay = new Date(p.getFullYear(), p.getMonth(), p.getDate());
  const rDay = new Date(r.getFullYear(), r.getMonth(), r.getDate());
  const diffMs = rDay.getTime() - pDay.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

/**
 * Tính phí trả hàng cho 1 giá trị hàng trả.
 * @param grossRefundAmount  Tổng giá trị hàng trả lại (sum subtotal các item).
 * @param purchaseDate       Ngày mua (order.date).
 * @param config             Cấu hình phí.
 * @param returnDate         Ngày trả (mặc định hôm nay).
 */
export function computeReturnFee(
  grossRefundAmount: number,
  purchaseDate: string | Date,
  config: ReturnFeeConfig,
  returnDate: string | Date = new Date()
): ReturnFeeResult {
  const gross = Math.max(0, Number(grossRefundAmount) || 0);
  const days = calcDaysBetween(purchaseDate, returnDate);
  const sameDay = days === 0;

  // Tính năng tắt: luôn cho trả, không phí, không chặn.
  if (!config.enabled) {
    return {
      eligible: true,
      blocked: false,
      daysSincePurchase: days,
      sameDay,
      feePercent: 0,
      feeAmount: 0,
      grossRefundAmount: gross,
      netRefundAmount: gross,
    };
  }

  // Quá hạn: trả sau X ngày → chặn cứng.
  if (days > config.maxDays) {
    return {
      eligible: false,
      blocked: true,
      blockReason: `Quá hạn trả hàng. Đơn mua đã ${days} ngày, vượt giới hạn ${config.maxDays} ngày.`,
      daysSincePurchase: days,
      sameDay,
      feePercent: 0,
      feeAmount: 0,
      grossRefundAmount: gross,
      netRefundAmount: gross,
    };
  }

  // Trong ngày: miễn phí.
  if (sameDay) {
    return {
      eligible: true,
      blocked: false,
      daysSincePurchase: days,
      sameDay,
      feePercent: 0,
      feeAmount: 0,
      grossRefundAmount: gross,
      netRefundAmount: gross,
    };
  }

  // Từ ngày hôm sau đến hết ngày thứ X: áp dụng phí.
  const feePercent = config.feePercent;
  const feeAmount = Math.round((gross * feePercent) / 100);
  return {
    eligible: true,
    blocked: false,
    daysSincePurchase: days,
    sameDay,
    feePercent,
    feeAmount,
    grossRefundAmount: gross,
    netRefundAmount: Math.max(0, gross - feeAmount),
  };
}

/** Chuẩn hoá phương thức thanh toán của đơn gốc về 1 trong: 'debt' | 'cash' | 'transfer'. */
export function classifyPaymentMethod(order?: Pick<Order, 'paymentMethod' | 'debtRecorded'> | null): 'debt' | 'cash' | 'transfer' {
  if (!order) return 'cash';
  const pm = (order.paymentMethod || '').toLowerCase();
  if ((order.debtRecorded || 0) > 0 || pm.includes('nợ') || pm.includes('debt') || pm.includes('cong no') || pm.includes('công nợ')) {
    return 'debt';
  }
  if (pm.includes('chuyển') || pm.includes('chuyen') || pm.includes('transfer') || pm.includes('bank') || pm.includes('ck')) {
    return 'transfer';
  }
  return 'cash';
}

/** Nhãn hiển thị phương thức thanh toán. */
export function paymentMethodLabel(method: 'debt' | 'cash' | 'transfer'): string {
  switch (method) {
    case 'debt': return 'Công nợ';
    case 'transfer': return 'Chuyển khoản';
    default: return 'Tiền mặt';
  }
}
