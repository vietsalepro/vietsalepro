import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resetMockData,
  setCurrentUserId,
  setSystemAdmin,
  getMockRows,
} from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  createTenantWithAdmin,
  getTenantsAdmin,
  getCurrentUserTenants,
} from '../../services/tenantService';

// ponytail: smoke test P2 service/mocks đồng bộ với RPC contracts.
// Kiểm tra get_tenants_admin, get_current_user_tenants và phân quyền system admin.

describe('smoke: admin dashboard P2 tenant admin', () => {
  beforeEach(() => {
    resetMockData();
  });

  const seedTenant = async (name: string, subdomain: string, plan: 'free' | 'vip' = 'free') => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
    return createTenantWithAdmin({ name, subdomain, plan });
  };

  it('get_tenants_admin trả về tenants với phân trang', async () => {
    await seedTenant('TA Store A', 'ta-store-a');
    await seedTenant('TA Store B', 'ta-store-b', 'vip');

    const result = await getTenantsAdmin({ limit: 10 });
    expect(result.total).toBe(2);
    expect(result.items.length).toBe(2);
  });

  it('get_tenants_admin lọc theo plan', async () => {
    await seedTenant('TA Free', 'ta-free');
    await seedTenant('TA VIP', 'ta-vip', 'vip');

    const result = await getTenantsAdmin({ plan: 'vip' });
    expect(result.items.length).toBe(1);
    expect(result.items[0].plan).toBe('vip');
  });

  it('get_tenants_admin tìm kiếm theo tên/subdomain', async () => {
    await seedTenant('TA Search', 'ta-search');
    await seedTenant('TA Other', 'ta-other');

    const result = await getTenantsAdmin({ search: 'search' });
    expect(result.items.length).toBe(1);
    expect(result.items[0].subdomain).toBe('ta-search');
  });

  it('non-system admin bị từ chối gọi get_tenants_admin', async () => {
    await seedTenant('TA Store', 'ta-store');
    setSystemAdmin(false);
    await expect(getTenantsAdmin({})).rejects.toThrow();
  });

  it('get_current_user_tenants trả về tenants của user hiện tại', async () => {
    setCurrentUserId('owner-1');
    setSystemAdmin(false);
    const tenant = await createTenantWithAdmin({ name: 'TA User', subdomain: 'ta-user' });

    // Đảm bảo membership được gắn với owner-1
    const memberships = getMockRows('tenant_memberships');
    expect(memberships.some(m => m.user_id === 'owner-1' && m.tenant_id === tenant.id)).toBe(true);

    setCurrentUserId('owner-1');
    const rows = await getCurrentUserTenants();
    expect(rows.some(r => r.id === tenant.id)).toBe(true);
  });
});
