import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resetMockData,
  setCurrentUserId,
  setSystemAdmin,
  addMockRow,
  getMockRows,
} from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import { startImpersonation, endImpersonation } from '../../services/tenantService';

// ponytail: smoke test P11.3 impersonation — dùng mock in-memory.

describe('smoke: admin dashboard P11.3 impersonation', () => {
  beforeEach(() => {
    resetMockData();
  });

  const seedTenant = () => {
    const tenant = {
      id: 'tenant-impersonate',
      name: 'Shop Impersonate',
      subdomain: 'shop-impersonate',
      status: 'active',
      plan: 'free',
      owner_id: null,
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addMockRow('tenants', tenant);
    addMockRow('tenant_subscriptions', {
      tenant_id: tenant.id,
      plan: 'free',
      max_users: 1,
      max_products: 50,
      max_orders_per_month: 300,
      current_month_orders: 0,
      current_month_start: new Date().toISOString().slice(0, 10),
      billing_status: 'ok',
      expires_at: null,
      updated_at: new Date().toISOString(),
    });
    return tenant;
  };

  it('system admin impersonate tenant admin: tạo membership, ghi audit log, kết thúc xóa membership và ghi audit end', async () => {
    const tenant = seedTenant();
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
    addMockRow('users', { id: 'sys-admin', email: 'admin@example.com' });

    const res = await startImpersonation(tenant.id);
    expect(res.success).toBe(true);
    expect(res.tenant.id).toBe(tenant.id);

    const memberships = getMockRows('tenant_memberships');
    const imp = memberships.find(
      m => m.tenant_id === tenant.id && m.user_id === 'sys-admin' && m.role === 'admin'
    );
    expect(imp).toBeDefined();
    expect(imp?.impersonated_by).toBe('sys-admin');
    expect(imp?.impersonated_at).toBeDefined();
    expect(imp?.impersonated_expires_at).toBeDefined();

    const auditLogs = getMockRows('app_audit_log');
    expect(auditLogs.some(l => l.action === 'IMPERSONATE' && l.tenant_id === tenant.id)).toBe(true);

    const endRes = await endImpersonation();
    expect(endRes.success).toBe(true);
    expect(endRes.ended).toBe(1);

    const membershipsAfter = getMockRows('tenant_memberships');
    expect(membershipsAfter.some(m => m.tenant_id === tenant.id && m.user_id === 'sys-admin')).toBe(false);

    const endLogs = getMockRows('app_audit_log').filter(l => l.action === 'IMPERSONATE_END');
    expect(endLogs.length).toBe(1);
    expect(endLogs[0].tenant_id).toBe(tenant.id);
    expect(endLogs[0].old_data.duration_seconds).toBeGreaterThanOrEqual(0);
  });

  it('non-system admin không được impersonate', async () => {
    const tenant = seedTenant();
    setCurrentUserId('user-1');
    setSystemAdmin(false);
    addMockRow('users', { id: 'user-1', email: 'user@example.com' });

    await expect(startImpersonation(tenant.id)).rejects.toThrow();
  });

  it('impersonate không tính vào giới hạn user của gói', async () => {
    const tenant = seedTenant();
    // Gói free chỉ có 1 user; thêm owner thực sự.
    addMockRow('tenant_memberships', {
      id: 'owner-member',
      tenant_id: tenant.id,
      user_id: 'owner-1',
      role: 'admin',
      invited_by: null,
      impersonated_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
    addMockRow('users', { id: 'sys-admin', email: 'admin@example.com' });

    // Nếu impersonate tính vào giới hạn, lệnh này sẽ bị từ chối.
    const res = await startImpersonation(tenant.id);
    expect(res.success).toBe(true);
  });
});
