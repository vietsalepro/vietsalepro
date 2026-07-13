import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateLicense,
  validateLicense,
  listTenantLicenses,
  revokeLicense,
  LicenseStatus,
} from '../../services/admin/licenseService';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return {
    supabase: mockSupabase,
    getCurrentTenantId: vi.fn(() => null),
  };
});

describe('licenseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateLicense', () => {
    it('creates a license via RPC and returns the mapped license', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: {
          id: 'lic-1',
          tenant_id: 't1',
          license_key: 'ABCD1234EFGH5678',
          plan: 'vip',
          max_users: 10,
          max_products: 1000,
          max_orders_per_month: 10000,
          expires_at: '2026-12-31T00:00:00Z',
          is_active: true,
          revoked_at: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      } as any);

      const result = await generateLicense({
        tenantId: 't1',
        plan: 'vip',
        maxUsers: 10,
        maxProducts: 1000,
        maxOrdersPerMonth: 10000,
        expiresAt: '2026-12-31T00:00:00Z',
      });

      expect(result.key).toBe('ABCD1234EFGH5678');
      expect(result.tenantId).toBe('t1');
      expect(result.plan).toBe('vip');
      expect(result.status).toBe(LicenseStatus.ACTIVE);
      expect(supabase.rpc).toHaveBeenCalledWith('generate_tenant_license', {
        p_tenant_id: 't1',
        p_plan: 'vip',
        p_max_users: 10,
        p_max_products: 1000,
        p_max_orders_per_month: 10000,
        p_expires_at: '2026-12-31T00:00:00Z',
      });
    });

    it('throws when the RPC returns an error', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Tenant không tồn tại' },
      } as any);

      await expect(
        generateLicense({ tenantId: 'missing', plan: 'vip' })
      ).rejects.toThrow('Tenant không tồn tại');
    });
  });

  describe('validateLicense', () => {
    it('returns valid=true for an active, non-expired license', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: {
          valid: true,
          license_id: 'lic-1',
          tenant_id: 't1',
          plan: 'vip',
          reason: null,
        },
        error: null,
      } as any);

      const result = await validateLicense('ABCD1234EFGH5678');

      expect(result.valid).toBe(true);
      expect(result.license?.id).toBe('lic-1');
      expect(result.license?.tenantId).toBe('t1');
      expect(result.license?.plan).toBe('vip');
      expect(supabase.rpc).toHaveBeenCalledWith('validate_tenant_license', {
        p_license_key: 'ABCD1234EFGH5678',
      });
    });

    it('returns valid=false with reason for expired license', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: {
          valid: false,
          license_id: 'lic-2',
          tenant_id: 't1',
          plan: 'vip',
          reason: 'expired',
        },
        error: null,
      } as any);

      const result = await validateLicense('EXPIREDKEY');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('expired');
      expect(result.license?.id).toBe('lic-2');
    });

    it('returns valid=false with reason not_found for unknown key', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: {
          valid: false,
          license_id: null,
          tenant_id: null,
          plan: null,
          reason: 'not_found',
        },
        error: null,
      } as any);

      const result = await validateLicense('UNKNOWN');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('not_found');
      expect(result.license).toBeUndefined();
    });
  });

  describe('listTenantLicenses', () => {
    it('returns mapped licenses for a tenant', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: [
            {
              id: 'lic-1',
              tenant_id: 't1',
              license_key: 'KEY1',
              plan: 'vip',
              max_users: 10,
              max_products: 1000,
              max_orders_per_month: 10000,
              expires_at: null,
              is_active: true,
              revoked_at: null,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          error: null,
        }),
      } as any);

      const result = await listTenantLicenses('t1');

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('KEY1');
      expect(result[0].tenantId).toBe('t1');
    });
  });

  describe('revokeLicense', () => {
    it('updates the license to inactive and sets revoked_at', async () => {
      const { supabase } = await import('../../lib/supabase');
      const updateMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValueOnce({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: updateMock,
        eq: eqMock,
      } as any);

      await revokeLicense('lic-1');

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false, revoked_at: expect.any(String) })
      );
      expect(eqMock).toHaveBeenCalledWith('id', 'lic-1');
    });
  });
});
