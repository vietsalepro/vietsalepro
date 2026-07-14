import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resetMockData,
  setCurrentUserId,
  setSystemAdmin,
  addMockRow,
} from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  createTenantWithAdmin,
  getUsageSummary,
  updateTenantSubscription,
  resetMonthlyOrderCounter,
} from '../../services/tenantService';

// ponytail: smoke test P2 subscription & usage. Không cần kết nối DB thật,
// dùng mock in-memory để xác minh nâng/hạ gói, cảnh báo gần giới hạn, reset counter.

describe('smoke: admin dashboard P2 subscription & usage', () => {
  beforeEach(() => {
    resetMockData();
  });

  const seedTenant = async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
    const tenant = await createTenantWithAdmin({
      name: 'P2 Store',
      subdomain: 'p2-store',
      plan: 'free',
    });
    return tenant;
  };

  it('get_tenant_usage_summary trả về đúng user/product/order', async () => {
    const tenant = await seedTenant();
    addMockRow('products', { name: 'P1', code: 'P1', tenant_id: tenant.id });

    const usage = await getUsageSummary(tenant.id);
    expect(usage.tenantId).toBe(tenant.id);
    expect(usage.plan).toBe('free');
    expect(usage.users.current).toBe(1);
    expect(usage.products.current).toBe(1);
    expect(usage.orders.current).toBe(0);
  });

  it('cảnh báo khi usage >= 80%', async () => {
    const tenant = await seedTenant();
    // Free: max_products = 50. Thêm 41 sản phẩm => 82%.
    for (let i = 0; i < 41; i++) {
      addMockRow('products', { name: `P${i}`, code: `P${i}`, tenant_id: tenant.id });
    }
    const usage = await getUsageSummary(tenant.id);
    expect(usage.products.percent).toBeGreaterThanOrEqual(80);
  });

  it('nâng gói lên VIP với custom limits', async () => {
    const tenant = await seedTenant();
    const sub = await updateTenantSubscription(tenant.id, {
      plan: 'vip',
      maxUsers: 10,
      maxProducts: 500,
      maxOrdersPerMonth: 1000,
      billingStatus: 'ok',
      expiresAt: '2026-12-31T23:59:59Z',
    });
    expect(sub.plan).toBe('vip');
    expect(sub.maxUsers).toBe(10);
    expect(sub.maxProducts).toBe(500);
    expect(sub.maxOrdersPerMonth).toBe(1000);
    expect(sub.expiresAt).toBe('2026-12-31T23:59:59Z');
  });

  it('hạ gói về Free áp giới hạn mặc định', async () => {
    const tenant = await seedTenant();
    await updateTenantSubscription(tenant.id, {
      plan: 'vip',
      maxUsers: 999,
      maxProducts: 999,
      maxOrdersPerMonth: 999,
    });
    const sub = await updateTenantSubscription(tenant.id, { plan: 'free' });
    expect(sub.plan).toBe('free');
    expect(sub.maxUsers).toBe(1);
    expect(sub.maxProducts).toBe(50);
    expect(sub.maxOrdersPerMonth).toBe(300);
  });

  it('reset_monthly_order_counter về 0', async () => {
    const tenant = await seedTenant();
    const sub = await resetMonthlyOrderCounter(tenant.id);
    expect(sub.currentMonthOrders).toBe(0);
  });

  it('non-system admin bị từ chối xem usage', async () => {
    const tenant = await seedTenant();
    setSystemAdmin(false);
    await expect(getUsageSummary(tenant.id)).rejects.toThrow();
  });
});
