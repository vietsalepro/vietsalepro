import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMockData, setCurrentUserId, setSystemAdmin } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import { createTenantWithAdmin, updateTenant, getTenantByDomain, getAllTenants } from '../../services/tenantService';

describe('smoke: admin dashboard P18.2 white-label / custom domain', () => {
  beforeEach(() => {
    resetMockData();
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
  });

  it('cập nhật custom domain và white-label cho tenant VIP', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop VIP', subdomain: 'shop-vip', plan: 'vip' });

    const updated = await updateTenant(tenant.id, {
      customDomain: 'brand.example.com',
      whiteLabel: {
        brandName: 'Brand Example',
        logoUrl: 'https://example.com/logo.png',
        faviconUrl: 'https://example.com/favicon.ico',
        primaryColor: '#10b981',
      },
    });

    expect(updated.customDomain).toBe('brand.example.com');
    expect(updated.whiteLabel?.brandName).toBe('Brand Example');
    expect(updated.whiteLabel?.primaryColor).toBe('#10b981');

    const found = await getTenantByDomain('BRAND.example.com');
    expect(found).not.toBeNull();
    expect(found?.subdomain).toBe('shop-vip');
  });

  it('từ chối custom domain cho tenant Free', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Free', subdomain: 'shop-free', plan: 'free' });

    await expect(
      updateTenant(tenant.id, { customDomain: 'free.example.com' })
    ).rejects.toThrow();
  });

  it('từ chối cập nhật white-label khi không phải system admin', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Admin', subdomain: 'shop-admin', plan: 'vip' });
    setSystemAdmin(false);
    setCurrentUserId('user-1');

    await expect(
      updateTenant(tenant.id, { customDomain: 'unauth.example.com' })
    ).rejects.toThrow();
  });

  it('xóa custom domain khi truyền chuỗi rỗng', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Clear', subdomain: 'shop-clear', plan: 'vip' });
    await updateTenant(tenant.id, { customDomain: 'clear.example.com' });

    const cleared = await updateTenant(tenant.id, { customDomain: '' });
    expect(cleared.customDomain).toBeFalsy();

    const found = await getTenantByDomain('clear.example.com');
    expect(found).toBeNull();
  });

  it('getTenantByDomain trả về null khi không tìm thấy', async () => {
    const found = await getTenantByDomain('notfound.example.com');
    expect(found).toBeNull();
  });

  it('getAllTenants trả về customDomain và whiteLabel', async () => {
    await createTenantWithAdmin({ name: 'Shop List', subdomain: 'shop-list', plan: 'vip' });
    const tenants = await getAllTenants();
    expect(tenants.length).toBeGreaterThan(0);
    expect(tenants[0].customDomain).toBeDefined();
    expect(tenants[0].whiteLabel).toBeDefined();
  });
});
