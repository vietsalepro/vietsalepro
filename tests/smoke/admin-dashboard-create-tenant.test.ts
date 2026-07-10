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

  it('creates tenant with generated password', async () => {
    const spy = vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: {
        tenant: mockTenant(),
        adminUser: { id: 'user-1', email: 'admin@shop.com' },
        initialPassword: 'auto-generated-password',
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
        adminPassword: undefined,
      },
    });
    expect(result.tenant.subdomain).toBe('shop-test');
    expect(result.initialPassword).toBe('auto-generated-password');
  });

  it('creates tenant with custom password', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: {
        tenant: mockTenant({ id: 'tenant-2', name: 'Shop Custom', subdomain: 'shop-custom', plan: 'vip' }),
        adminUser: { id: 'user-2', email: 'admin@custom.com' },
        initialPassword: 'my-pass-123',
      },
      error: null,
    } as any);

    const result = await createTenantWithCredentials({
      name: 'Shop Custom',
      subdomain: 'shop-custom',
      plan: 'vip',
      adminEmail: 'admin@custom.com',
      adminPassword: 'my-pass-123',
    });

    expect(result.initialPassword).toBe('my-pass-123');
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
      data: { tenant: mockTenant() }, // missing adminUser / initialPassword
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
        initialPassword: 'pass123',
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

  it('throws when initialPassword is missing', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: {
        tenant: mockTenant(),
        adminUser: { id: 'user-1', email: 'admin@shop.com' },
        initialPassword: undefined,
      },
      error: null,
    } as any);

    await expect(
      createTenantWithCredentials({
        name: 'Shop No Password',
        subdomain: 'shop-no-password',
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

  it('returns credentials for given tenant ids', async () => {
    addMockRow('tenant_credentials', {
      tenant_id: 'tenant-1',
      admin_email: 'admin@shop.com',
      admin_initial_password: 'secret-pass-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    addMockRow('tenant_credentials', {
      tenant_id: 'tenant-2',
      admin_email: 'admin@other.com',
      admin_initial_password: 'other-pass-456',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const map = await getTenantCredentials(['tenant-1', 'tenant-3']);

    expect(Object.keys(map)).toHaveLength(1);
    expect(map['tenant-1']).toEqual({
      tenantId: 'tenant-1',
      adminEmail: 'admin@shop.com',
      adminInitialPassword: 'secret-pass-123',
    });
  });

  it('returns empty map for empty input', async () => {
    const map = await getTenantCredentials([]);
    expect(map).toEqual({});
  });
});
