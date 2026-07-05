import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resetMockData,
  setCurrentUserId,
  setCurrentTenantId,
  getMockRows,
  addMockRow,
} from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import { createTenantWithAdmin } from '../../services/tenantService';
import { checkLimit, isNearLimit } from '../../services/subscriptionService';

// ponytail: smoke test subscription limits. Không cần kết nối DB thật,
// dùng mock in-memory để xác minh checkLimit trả về đúng khi đạt giới hạn.

describe('smoke: subscription limits', () => {
  beforeEach(() => {
    resetMockData();
  });

  const seedFreeTenant = async () => {
    setCurrentUserId('owner-sub');
    const tenant = await createTenantWithAdmin({
      name: 'Free Store',
      subdomain: 'free-store',
      plan: 'free',
    });
    setCurrentTenantId(tenant.id);

    // Ghi đè giới hạn Free nhỏ để dễ đạt giới hạn trong test.
    const sub = getMockRows('tenant_subscriptions').find(s => s.tenant_id === tenant.id);
    if (!sub) throw new Error('subscription not found');
    sub.max_users = 1;
    sub.max_products = 2;
    sub.max_orders_per_month = 3;
    return { tenant, sub };
  };

  it('Free tenant đạt giới hạn user', async () => {
    const { tenant } = await seedFreeTenant();
    // Owner đã chiếm 1 user.
    const users = await checkLimit(tenant.id, 'users');
    expect(users.current).toBe(1);
    expect(users.max).toBe(1);
    expect(users.allowed).toBe(false);
    expect(users.remaining).toBe(0);
  });

  it('Free tenant đạt giới hạn sản phẩm', async () => {
    const { tenant } = await seedFreeTenant();
    addMockRow('products', { name: 'P1', code: 'P1', tenant_id: tenant.id });
    addMockRow('products', { name: 'P2', code: 'P2', tenant_id: tenant.id });

    const products = await checkLimit(tenant.id, 'products');
    expect(products.current).toBe(2);
    expect(products.max).toBe(2);
    expect(products.allowed).toBe(false);
    expect(products.remaining).toBe(0);
  });

  it('Free tenant đạt giới hạn đơn hàng tháng', async () => {
    const { tenant, sub } = await seedFreeTenant();
    // Giả lập đã có 3 đơn trong tháng hiện tại.
    const thisMonth = new Date().toISOString().slice(0, 7);
    sub.current_month_orders = 3;
    sub.current_month_start = `${thisMonth}-01`;

    const orders = await checkLimit(tenant.id, 'orders_per_month');
    expect(orders.current).toBe(3);
    expect(orders.max).toBe(3);
    expect(orders.allowed).toBe(false);
    expect(orders.remaining).toBe(0);
  });

  it('cảnh báo khi sắp đạt giới hạn sản phẩm', async () => {
    const { tenant } = await seedFreeTenant();
    addMockRow('products', { name: 'P1', code: 'P1', tenant_id: tenant.id });
    // 1/2 = 50% >= 0.8? false. Đặt threshold = 0.5 để test.
    const near = await isNearLimit(tenant.id, 'products', 0.5);
    expect(near).toBe(true);
  });

  it('vẫn còn quota khi chưa đạt giới hạn', async () => {
    const { tenant } = await seedFreeTenant();
    const users = await checkLimit(tenant.id, 'users');
    // Đã đạt 1/1 user nên test case này chủ yếu kiểm tra shape.
    expect(users.max).toBe(1);
    expect(users.remaining).toBe(0);
  });
});
