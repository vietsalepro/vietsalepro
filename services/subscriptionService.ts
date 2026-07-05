import { supabase } from '../lib/supabase';
import { TenantSubscription } from '../types/tenant';
import { getTenantSubscription } from './tenantService';

export type LimitResource = 'users' | 'products' | 'orders_per_month';

export interface LimitStatus {
  current: number;
  max: number;
  allowed: boolean;
  remaining: number;
}

export async function getSubscription(tenantId: string): Promise<TenantSubscription | null> {
  return getTenantSubscription(tenantId);
}

export async function checkLimit(
  tenantId: string,
  resource: LimitResource
): Promise<LimitStatus> {
  const sub = await getTenantSubscription(tenantId);
  if (!sub) {
    throw new Error('Không tìm thấy subscription cho tenant');
  }

  let current = 0;
  let max = 0;

  if (resource === 'users') {
    const { count, error } = await supabase
      .from('tenant_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    if (error) throw error;
    current = count ?? 0;
    max = sub.maxUsers;
  } else if (resource === 'products') {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    if (error) throw error;
    current = count ?? 0;
    max = sub.maxProducts;
  } else if (resource === 'orders_per_month') {
    // ponytail: orders_per_month dùng counter được trigger giữ.
    // Counter tự reset khi sang tháng mới; nếu chưa có đơn nào trong tháng hiện tại,
    // giá trị cũ từ tháng trước vẫn còn trong DB nên frontend cần tự điều chỉnh.
    const currentMonth = new Date().toISOString().slice(0, 7);
    const subMonth = sub.currentMonthStart?.slice(0, 7);
    current = subMonth === currentMonth ? sub.currentMonthOrders : 0;
    max = sub.maxOrdersPerMonth;
  }

  return {
    current,
    max,
    allowed: current < max,
    remaining: Math.max(0, max - current),
  };
}

export async function isNearLimit(
  tenantId: string,
  resource: LimitResource,
  threshold = 0.8
): Promise<boolean> {
  const status = await checkLimit(tenantId, resource);
  return status.max > 0 && status.current / status.max >= threshold;
}
