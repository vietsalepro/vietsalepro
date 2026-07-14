import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resetMockData,
  setCurrentUserId,
  setSystemAdmin,
} from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  getPlans,
  getPlanByKey,
  createPlan,
  updatePlan,
  deletePlan,
} from '../../services/planService';
import { createTenantWithAdmin, getUsageSummary, updateTenantSubscription } from '../../services/tenantService';
import { getDefaultPlanLimits, setDefaultPlanLimits } from '../../services/operationsService';

// ponytail: smoke test P8.1 plan builder schema. CRUD plans + migrate Free/VIP sang bảng.

describe('smoke: admin dashboard P8.1 plan builder schema', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('chỉ system admin mới được quản lý plans', async () => {
    setCurrentUserId('user-1');
    setSystemAdmin(false);

    await expect(getPlans()).rejects.toThrow();
    await expect(getPlanByKey('free')).rejects.toThrow();
    await expect(createPlan({ key: 'pro', name: 'Pro', maxUsers: 5, maxProducts: 500, maxOrdersPerMonth: 5000 })).rejects.toThrow();
    await expect(updatePlan('free', { maxUsers: 2 })).rejects.toThrow();
    await expect(deletePlan('pro')).rejects.toThrow();
  });

  it('system admin đọc danh sách plans và chi tiết plan', async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);

    const plans = await getPlans();
    expect(plans.length).toBeGreaterThanOrEqual(2);
    expect(plans.find(p => p.key === 'free')).toBeDefined();
    expect(plans.find(p => p.key === 'vip')).toBeDefined();

    const vip = await getPlanByKey('vip');
    expect(vip.name).toBe('VIP');
    expect(vip.maxUsers).toBe(999);
    expect(vip.monthlyPrice).toBe(69000);
    expect(vip.yearlyPrice).toBe(59000);
  });

  it('system admin tạo và cập nhật plan mới', async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);

    const created = await createPlan({
      key: 'pro',
      name: 'Pro',
      description: 'Gói chuyên nghiệp',
      maxUsers: 10,
      maxProducts: 1000,
      maxOrdersPerMonth: 10000,
      monthlyPrice: 99000,
      yearlyPrice: 89000,
    });
    expect(created.key).toBe('pro');
    expect(created.name).toBe('Pro');
    expect(created.maxUsers).toBe(10);
    expect(created.monthlyPrice).toBe(99000);

    const updated = await updatePlan('pro', { maxUsers: 20, monthlyPrice: 129000 });
    expect(updated.maxUsers).toBe(20);
    expect(updated.monthlyPrice).toBe(129000);
    expect(updated.description).toBe('Gói chuyên nghiệp');
  });

  it('system admin xóa plan không phải mặc định và không đang dùng', async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);

    await createPlan({ key: 'pro', name: 'Pro', maxUsers: 5, maxProducts: 500, maxOrdersPerMonth: 5000 });
    const deleted = await deletePlan('pro');
    expect(deleted).toBe(true);

    await expect(deletePlan('free')).rejects.toThrow();

    await createPlan({ key: 'pro', name: 'Pro', maxUsers: 5, maxProducts: 500, maxOrdersPerMonth: 5000 });
    await createTenantWithAdmin({ name: 'Pro Shop', subdomain: 'pro-shop', plan: 'pro' });
    await expect(deletePlan('pro')).rejects.toThrow();
  });

  it('cập nhật giới hạn mặc định Free/VIP lưu vào plans', async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);

    await setDefaultPlanLimits('free', { maxUsers: 3, maxProducts: 200, maxOrdersPerMonth: 1000 });
    const limits = await getDefaultPlanLimits();
    expect(limits.free.maxUsers).toBe(3);
    expect(limits.free.maxProducts).toBe(200);
    expect(limits.free.maxOrdersPerMonth).toBe(1000);

    const freePlan = await getPlanByKey('free');
    expect(freePlan.maxUsers).toBe(3);
  });

  it('tạo tenant với plan mới dùng limits từ plans', async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);

    await createPlan({ key: 'pro', name: 'Pro', maxUsers: 7, maxProducts: 700, maxOrdersPerMonth: 7000 });
    const tenant = await createTenantWithAdmin({ name: 'Pro Shop', subdomain: 'pro-shop-2', plan: 'pro' });

    const usage = await getUsageSummary(tenant.id);
    expect(usage.plan).toBe('pro');
    expect(usage.users.max).toBe(7);
    expect(usage.products.max).toBe(700);
    expect(usage.orders.max).toBe(7000);
  });

  it('đổi gói tenant sang plan mới áp limits từ plans', async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);

    await createPlan({ key: 'pro', name: 'Pro', maxUsers: 7, maxProducts: 700, maxOrdersPerMonth: 7000 });
    const tenant = await createTenantWithAdmin({ name: 'Shop', subdomain: 'shop-limits', plan: 'free' });

    await updateTenantSubscription(tenant.id, { plan: 'pro' });
    const usage = await getUsageSummary(tenant.id);
    expect(usage.plan).toBe('pro');
    expect(usage.users.max).toBe(7);
    expect(usage.products.max).toBe(700);
    expect(usage.orders.max).toBe(7000);
  });
});
