import { AppSettings, Reward, Order, PointHistory } from '../types';

// --- Cache Keys ---
// Phase 5: no longer cache full customer/product/supplier lists.
const CACHE_KEYS = {
  settings: 'cache_settings',
  rewards: 'cache_rewards',
  updatedAt: 'cache_updated_at',
};

const QUEUE_KEY = 'offline_queue';
// Legacy key used by older versions (only stored raw orders)
const LEGACY_ORDERS_KEY = 'offline_orders';

// --- Offline operation types ---
export interface CheckoutOp {
  type: 'checkout';
  // Phase 2: opId duy nhất cho mỗi op để RPC server idempotent check.
  // Sinh bằng generateOpId() khi tạo op. Tồn tại cả khi op rồi sync nhiều lần.
  opId?: string;
  // Phase 6.2: mỗi op thuộc về một tenant; sync chỉ xử lý op của tenant hiện tại.
  tenantId?: string;
  order: Order;
  // Số lượng cần trừ kho, quy về đơn vị cơ bản.
  // Phase 4: thêm lotId (tuỳ chọn) — bắt buộc nếu product.has_lots = TRUE.
  productDeltas: { productId: string; deductBaseQty: number; lotId?: string }[];
  // Số lượng quà tặng đã đổi (trừ tồn kho quà)
  rewardDeltas: { rewardId: string; quantity: number }[];
  // Thay đổi với khách hàng (cộng dồn)
  customerUpdate?: {
    customerId: string;
    addSpent: number;
    addDebt: number;
    addPoints: number;
  };
  pointHistory: PointHistory[];
  timestamp: number;
}

/**
 * Sinh op_id duy nhất cho mỗi CheckoutOp.
 * Dùng crypto.randomUUID() nếu có (modern browsers), fallback timestamp+random.
 */
export const generateOpId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {}
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
};

export type QueuedOp = CheckoutOp;

const safeParse = <T>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

// --- Reference data cache ---
// Phase 5: only cache small reference data (settings, rewards) and queue.
// Full customer/product/supplier lists are no longer cached.
export const offlineCache = {
  setSettings(settings: AppSettings) {
    localStorage.setItem(CACHE_KEYS.settings, JSON.stringify(settings));
  },
  getSettings(): AppSettings | null {
    return safeParse<AppSettings>(localStorage.getItem(CACHE_KEYS.settings));
  },

  setRewards(items: Reward[]) {
    localStorage.setItem(CACHE_KEYS.rewards, JSON.stringify(items));
  },
  getRewards(): Reward[] {
    return safeParse<Reward[]>(localStorage.getItem(CACHE_KEYS.rewards)) || [];
  },

  markUpdated() {
    localStorage.setItem(CACHE_KEYS.updatedAt, new Date().toISOString());
  },
  getUpdatedAt(): string | null {
    return localStorage.getItem(CACHE_KEYS.updatedAt);
  },
  hasData(): boolean {
    // Phase 5: presence of settings or queue means we have useful offline data.
    return !!localStorage.getItem(CACHE_KEYS.settings) || !!localStorage.getItem(QUEUE_KEY);
  },
};

// --- Offline mutation queue ---
export const offlineQueue = {
  getAll(): QueuedOp[] {
    const ops = safeParse<QueuedOp[]>(localStorage.getItem(QUEUE_KEY)) || [];
    // Migrate legacy "offline_orders" (raw Order[]) into the new queue once.
    const legacy = safeParse<Order[]>(localStorage.getItem(LEGACY_ORDERS_KEY));
    if (legacy && legacy.length > 0) {
      const migrated: CheckoutOp[] = legacy.map(order => ({
        type: 'checkout',
        order,
        // Recreate stock deltas from order items (base unit assumed for legacy)
        productDeltas: (order.items || []).filter(i => i.productId).map(i => ({
          productId: i.productId,
          deductBaseQty: i.quantity,
        })),
        rewardDeltas: (order.rewardsRedeemed || []).map(r => ({
          rewardId: r.rewardId,
          quantity: r.quantity,
        })),
        customerUpdate: order.customerId && order.customerId !== 'guest'
          ? {
              customerId: order.customerId,
              addSpent: order.totalAmount,
              addDebt: order.debtRecorded || 0,
              addPoints: (order.pointsEarned || 0) - (order.pointsRedeemed || 0),
            }
          : undefined,
        pointHistory: [],
        timestamp: new Date(order.date || Date.now()).getTime() || Date.now(),
      }));
      const combined = [...migrated, ...ops];
      localStorage.setItem(QUEUE_KEY, JSON.stringify(combined));
      localStorage.removeItem(LEGACY_ORDERS_KEY);
      return combined;
    }
    return ops;
  },

  add(op: QueuedOp) {
    const ops = this.getAll();
    ops.push(op);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
  },

  set(ops: QueuedOp[]) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
  },

  clear() {
    localStorage.removeItem(QUEUE_KEY);
  },

  count(): number {
    return this.getAll().length;
  },
};

export const isOnline = (): boolean =>
  typeof navigator !== 'undefined' ? navigator.onLine : true;

export const isNetworkError = (error: any): boolean => {
  if (!isOnline()) return true;
  if (!error) return false;
  const msg = error.message || '';
  return (
    msg === 'Failed to fetch' ||
    msg.includes('NetworkError') ||
    msg.includes('fetch') ||
    error.name === 'TypeError'
  );
};
