import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetMockData } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import { createTenantWithCredentials, getTenantCredentials } from '../../services/tenantService';
import { supabase } from '../../lib/supabase';
import { addMockRow, setSystemAdmin } from '../mocks/supabase';

const mockTenant = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'tenant-1',
  name: 'Shop Test',
  subdomain: 'shop-test',
  status: 'active',
  plan: 'free',
  owner_id: 'owner-1',
  settings: {},
  isolation_mode: 'shared',
  created_at: '2026-07-10T00:00:00Z',
  updated_at: '2026-07-10T00:00:00Z',
  ...overrides,
});

describe('createTenantWithCredentials', () => {
  beforeEach(() => {
    resetMockData();
    vi.restoreAllMocks();
  });

  it('creates tenant and reports reset email sent', async () => {
    const spy = vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: {
        tenant: mockTenant(),
        adminUser: { id: 'user-1', email: 'admin@shop.com' },
        resetEmailSent: true,
        redirectTo: 'https://shop-test.vietsalepro.com/set-password',
      },
      error: null,
    } as any);

    const result = await createTenantWithCredentials({
      name: 'Shop Test',
      subdomain: 'shop-test',
      plan: 'free',
      adminEmail: 'admin@shop.com',
    });

    expect(spy).toHaveBeenCalledWith('create-tenant', {
      body: {
        name: 'Shop Test',
        subdomain: 'shop-test',
        email: 'admin@shop.com',
        plan: 'free',
      },
    });
    expect(result.tenant.subdomain).toBe('shop-test');
    expect(result.resetEmailSent).toBe(true);
    expect(result.redirectTo).toBe('https://shop-test.vietsalepro.com/set-password');
  });

  it('creates tenant even when reset email could not be sent', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: {
        tenant: mockTenant({ id: 'tenant-2', name: 'Shop Custom', subdomain: 'shop-custom', plan: 'vip' }),
        adminUser: { id: 'user-2', email: 'admin@custom.com' },
        resetEmailSent: false,
      },
      error: null,
    } as any);

    const result = await createTenantWithCredentials({
      name: 'Shop Custom',
      subdomain: 'shop-custom',
      plan: 'vip',
      adminEmail: 'admin@custom.com',
    });

    expect(result.resetEmailSent).toBe(false);
  });

  it('throws when Edge Function returns business error', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: { error: 'Email đã được sử dụng' },
      error: null,
    } as any);

    await expect(
      createTenantWithCredentials({
        name: 'Shop Dup',
        subdomain: 'shop-dup',
        plan: 'free',
        adminEmail: 'dup@shop.com',
      })
    ).rejects.toThrow('Email đã được sử dụng');
  });

  it('throws when Edge Function returns invoke error', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: null,
      error: { message: 'Subdomain đã tồn tại', name: 'FunctionsInvokeError' },
    } as any);

    await expect(
      createTenantWithCredentials({
        name: 'Shop Dup',
        subdomain: 'shop-dup',
        plan: 'free',
        adminEmail: 'dup@shop.com',
      })
    ).rejects.toThrow('Subdomain đã tồn tại');
  });

  it('throws on invalid response shape', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: { tenant: mockTenant() }, // missing adminUser / resetEmailSent
      error: null,
    } as any);

    await expect(
      createTenantWithCredentials({
        name: 'Shop Bad',
        subdomain: 'shop-bad',
        plan: 'free',
        adminEmail: 'bad@shop.com',
      })
    ).rejects.toThrow('Phản hồi tạo cửa hàng không hợp lệ');
  });

  it('throws when adminUser is missing id or email', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: {
        tenant: mockTenant(),
        adminUser: { id: '', email: '' },
        resetEmailSent: true,
      },
      error: null,
    } as any);

    await expect(
      createTenantWithCredentials({
        name: 'Shop Bad Admin',
        subdomain: 'shop-bad-admin',
        plan: 'free',
        adminEmail: 'badadmin@shop.com',
      })
    ).rejects.toThrow('Phản hồi tạo cửa hàng không hợp lệ');
  });

  it('throws when resetEmailSent is missing', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: {
        tenant: mockTenant(),
        adminUser: { id: 'user-1', email: 'admin@shop.com' },
        resetEmailSent: undefined,
      },
      error: null,
    } as any);

    await expect(
      createTenantWithCredentials({
        name: 'Shop No Reset',
        subdomain: 'shop-no-reset',
        plan: 'free',
        adminEmail: 'admin@shop.com',
      })
    ).rejects.toThrow('Phản hồi tạo cửa hàng không hợp lệ');
  });
});

describe('getTenantCredentials', () => {
  beforeEach(() => {
    resetMockData();
    setSystemAdmin(true);
  });

  it('returns admin email for given tenant ids', async () => {
    addMockRow('tenant_credentials', {
      tenant_id: 'tenant-1',
      admin_email: 'admin@shop.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    addMockRow('tenant_credentials', {
      tenant_id: 'tenant-2',
      admin_email: 'admin@other.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const map = await getTenantCredentials(['tenant-1', 'tenant-3']);

    expect(Object.keys(map)).toHaveLength(1);
    expect(map['tenant-1']).toEqual({
      tenantId: 'tenant-1',
      adminEmail: 'admin@shop.com',
    });
  });

  it('returns empty map for empty input', async () => {
    const map = await getTenantCredentials([]);
    expect(map).toEqual({});
  });
});
