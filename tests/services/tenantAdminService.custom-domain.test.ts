import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  requestCustomDomainVerification,
  verifyCustomDomain,
  isValidCustomDomain,
} from '../../services/admin/tenantAdminService';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return {
    supabase: mockSupabase,
    getCurrentTenantId: vi.fn(() => null),
  };
});

describe('tenantAdminService custom domain functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isValidCustomDomain', () => {
    it('accepts valid custom domains', () => {
      expect(isValidCustomDomain('shop.brand.com')).toBe(true);
      expect(isValidCustomDomain('pos.my-store.vn')).toBe(true);
    });

    it('rejects invalid inputs', () => {
      expect(isValidCustomDomain('brand')).toBe(false);
      expect(isValidCustomDomain('https://brand.com')).toBe(false);
      expect(isValidCustomDomain('-brand.com')).toBe(false);
      expect(isValidCustomDomain('')).toBe(false);
    });
  });

  describe('requestCustomDomainVerification', () => {
    it('returns token and txt record on success', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { token: 'abc123', txtRecord: 'abc123' },
        error: null,
      } as any);

      const result = await requestCustomDomainVerification('t1');

      expect(result.token).toBe('abc123');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('verify-domain', {
        body: { tenant_id: 't1', action: 'token' },
      });
    });

    it('throws when the response shape is invalid', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { token: 123 },
        error: null,
      } as any);

      await expect(requestCustomDomainVerification('t1')).rejects.toThrow(
        'Phản hồi yêu cầu token không hợp lệ'
      );
    });
  });

  describe('verifyCustomDomain', () => {
    it('returns verified=true when DNS matches', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { verified: true, message: 'Domain đã được xác minh' },
        error: null,
      } as any);

      const result = await verifyCustomDomain('t1', 'shop.brand.com');

      expect(result.verified).toBe(true);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('verify-domain', {
        body: { tenant_id: 't1', domain: 'shop.brand.com', action: 'verify' },
      });
    });

    it('returns verified=false when DNS does not match', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { verified: false, message: 'Không tìm thấy TXT record' },
        error: null,
      } as any);

      const result = await verifyCustomDomain('t1', 'shop.brand.com');
      expect(result.verified).toBe(false);
    });

    it('throws when the response shape is invalid', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { verified: 'yes' },
        error: null,
      } as any);

      await expect(verifyCustomDomain('t1', 'shop.brand.com')).rejects.toThrow(
        'Phản hồi xác minh domain không hợp lệ'
      );
    });
  });
});
