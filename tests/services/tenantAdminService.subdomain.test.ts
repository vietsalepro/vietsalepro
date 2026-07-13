import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkSubdomainAvailability,
  setTenantSubdomain,
} from '../../services/admin/tenantAdminService';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return {
    supabase: mockSupabase,
    getCurrentTenantId: vi.fn(() => null),
  };
});

describe('tenantAdminService subdomain functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns available=true for an unused subdomain', async () => {
    const result = await checkSubdomainAvailability('newshop');
    expect(result.available).toBe(true);
  });

  it('returns available=false for a reserved subdomain', async () => {
    const result = await checkSubdomainAvailability('admin');
    expect(result.available).toBe(false);
  });

  it('throws for an invalid subdomain response shape', async () => {
    const { supabase } = await import('../../lib/supabase');
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { wrong: true },
      error: null,
    } as any);

    await expect(checkSubdomainAvailability('anything')).rejects.toThrow(
      'Phản hồi kiểm tra subdomain không hợp lệ'
    );
  });

  it('sets a tenant subdomain via RPC', async () => {
    const { supabase } = await import('../../lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        id: 't1',
        name: 'Shop A',
        subdomain: 'updated',
        status: 'active',
        plan: 'free',
      },
      error: null,
    } as any);

    const tenant = await setTenantSubdomain('t1', 'updated');
    expect(tenant.subdomain).toBe('updated');
    expect(supabase.rpc).toHaveBeenCalledWith('set_tenant_subdomain', {
      p_tenant_id: 't1',
      p_subdomain: 'updated',
    });
  });

  it('throws when subdomain update RPC fails', async () => {
    const { supabase } = await import('../../lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'Subdomain đã tồn tại' },
    } as any);

    await expect(setTenantSubdomain('t1', 'taken')).rejects.toThrow(
      'Subdomain đã tồn tại'
    );
  });
});
