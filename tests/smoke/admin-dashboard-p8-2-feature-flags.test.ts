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
  createTenantWithAdmin,
  getTenantFeatureFlags,
  updateTenantFeatureFlags,
} from '../../services/tenantService';

// ponytail: smoke test P8.2 feature flags via tenants.settings JSONB.

describe('smoke: admin dashboard P8.2 feature flags', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('chỉ system admin mới được đọc/ghi feature flags', async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
    const tenant = await createTenantWithAdmin({ name: 'Shop', subdomain: 'shop', plan: 'free' });

    setCurrentUserId('user-1');
    setSystemAdmin(false);
    await expect(getTenantFeatureFlags(tenant.id)).rejects.toThrow();
    await expect(updateTenantFeatureFlags(tenant.id, { pos: false })).rejects.toThrow();
  });

  it('system admin đọc default flags (tất cả bật)', async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
    const tenant = await createTenantWithAdmin({ name: 'Shop', subdomain: 'shop', plan: 'free' });

    const flags = await getTenantFeatureFlags(tenant.id);
    expect(flags.pos).toBe(true);
    expect(flags.inventory).toBe(true);
    expect(flags.reports).toBe(true);
    expect(flags.debt).toBe(true);
    expect(flags.loyalty).toBe(true);
    expect(flags.promotions).toBe(true);
    expect(flags.invoicing).toBe(true);
    expect(flags.lotTracking).toBe(true);
  });

  it('system admin bật/tắt feature flags theo tenant', async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
    const tenant = await createTenantWithAdmin({ name: 'Shop', subdomain: 'shop', plan: 'free' });

    await updateTenantFeatureFlags(tenant.id, { pos: false, reports: false });
    const flags = await getTenantFeatureFlags(tenant.id);
    expect(flags.pos).toBe(false);
    expect(flags.reports).toBe(false);
    expect(flags.inventory).toBe(true);
    expect(flags.loyalty).toBe(true);
  });

  it('merge flags giữ nguyên các flag chưa được động đến', async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
    const tenant = await createTenantWithAdmin({ name: 'Shop', subdomain: 'shop', plan: 'free' });

    await updateTenantFeatureFlags(tenant.id, { pos: false });
    await updateTenantFeatureFlags(tenant.id, { inventory: false });
    const flags = await getTenantFeatureFlags(tenant.id);
    expect(flags.pos).toBe(false);
    expect(flags.inventory).toBe(false);
    expect(flags.reports).toBe(true);
  });
});
