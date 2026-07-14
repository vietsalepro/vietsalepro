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
  getDataRetentionStatus,
  getDefaultPlanLimits,
  setDefaultPlanLimits,
  getMaintenanceMode,
  setMaintenanceMode,
} from '../../services/operationsService';
import { checkSubdomain } from '../../services/admin/systemAdminService';
import { createTenantWithAdmin, getUsageSummary } from '../../services/tenantService';

// ponytail: smoke test P6 operations & support. Dùng mock in-memory để xác minh
// data retention, default plan limits, maintenance mode, và subdomain check.

describe('smoke: admin dashboard P6 operations & support', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('chỉ system admin mới xem/sửa cấu hình vận hành', async () => {
    setCurrentUserId('user-1');
    setSystemAdmin(false);

    await expect(getDataRetentionStatus()).rejects.toThrow();
    await expect(getDefaultPlanLimits()).rejects.toThrow();
    await expect(setDefaultPlanLimits('free', { maxUsers: 1, maxProducts: 10, maxOrdersPerMonth: 100 })).rejects.toThrow();
    await expect(getMaintenanceMode()).rejects.toThrow();
    await expect(setMaintenanceMode(true, 'Bảo trì')).rejects.toThrow();
  });

  it('system admin đọc default plan limits và cập nhật', async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);

    const limits = await getDefaultPlanLimits();
    expect(limits.free.maxUsers).toBe(1);
    expect(limits.vip.maxProducts).toBe(999999);

    await setDefaultPlanLimits('free', { maxUsers: 2, maxProducts: 100, maxOrdersPerMonth: 500 });
    const updated = await getDefaultPlanLimits();
    expect(updated.free.maxUsers).toBe(2);
    expect(updated.free.maxProducts).toBe(100);
    expect(updated.free.maxOrdersPerMonth).toBe(500);
  });

  it('system admin bật/tắt maintenance mode', async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);

    const initial = await getMaintenanceMode();
    expect(initial.enabled).toBe(false);

    const mode = await setMaintenanceMode(true, 'Hệ thống đang bảo trì.');
    expect(mode.enabled).toBe(true);
    expect(mode.message).toBe('Hệ thống đang bảo trì.');

    const current = await getMaintenanceMode();
    expect(current.enabled).toBe(true);
  });

  it('system admin xem trạng thái data retention', async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);

    addMockRow('orders_archive', { id: 'oa-1', created_at: new Date().toISOString() });
    addMockRow('order_items_archive', { id: 'oia-1', created_at: new Date().toISOString() });
    addMockRow('rate_limit_logs', { id: 'rl-1', created_at: new Date().toISOString() });

    const status = await getDataRetentionStatus();
    expect(status.archivedOrdersCount).toBe(1);
    expect(status.archivedOrderItemsCount).toBe(1);
    expect(status.rateLimitLogsCount).toBe(1);
    expect(status.cronSchedule).toBe('0 3 * * *');
  });

  it('check-subdomain trả về khả dụng khi chưa có tenant', async () => {
    const res = await checkSubdomain('new-shop');
    expect(res.available).toBe(true);
  });

  it('check-subdomain trả về không khả dụng khi đã có tenant', async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
    await createTenantWithAdmin({ name: 'Shop A', subdomain: 'taken-shop', plan: 'free' });

    const res = await checkSubdomain('taken-shop');
    expect(res.available).toBe(false);
  });

  it('tạo tenant dùng default limits mới sau khi cập nhật', async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);

    await setDefaultPlanLimits('free', { maxUsers: 3, maxProducts: 200, maxOrdersPerMonth: 1000 });
    const tenant = await createTenantWithAdmin({ name: 'Shop B', subdomain: 'shop-b', plan: 'free' });

    const usage = await getUsageSummary(tenant.id);
    expect(usage.users.max).toBe(3);
    expect(usage.products.max).toBe(200);
    expect(usage.orders.max).toBe(1000);
  });
});
