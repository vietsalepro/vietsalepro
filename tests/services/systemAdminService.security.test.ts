import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  recordLoginAttempt,
  updateTenantSessionTimeout,
  getLoginAttempts,
  getLockedEmails,
} from '../../services/admin/systemAdminService';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return {
    supabase: mockSupabase,
    getCurrentTenantId: vi.fn(() => null),
  };
});

describe('systemAdminService security ops', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records a login attempt via RPC', async () => {
    const { supabase } = await import('../../lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: 'attempt-1',
      error: null,
    } as any);

    const result = await recordLoginAttempt('user@example.com', '127.0.0.1', false);

    expect(result).toBe('attempt-1');
    expect(supabase.rpc).toHaveBeenCalledWith('record_login_attempt', {
      p_email: 'user@example.com',
      p_ip_address: '127.0.0.1',
      p_success: false,
    });
  });

  it('clamps session timeout to allowed range', async () => {
    const { supabase } = await import('../../lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: null } as any);

    await updateTenantSessionTimeout('t1', 5);

    expect(supabase.rpc).toHaveBeenCalledWith('update_tenant_session_timeout', {
      p_tenant_id: 't1',
      p_minutes: 5,
    });
  });

  it('throws when record login attempt RPC fails', async () => {
    const { supabase } = await import('../../lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'Không thể ghi nhận đăng nhập' },
    } as any);

    await expect(recordLoginAttempt('user@example.com', '127.0.0.1', false)).rejects.toThrow(
      'Không thể ghi nhận đăng nhập'
    );
  });

  it('returns locked emails from RPC', async () => {
    const { supabase } = await import('../../lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [
        { email: 'locked@example.com', failed_count: 5, last_attempt: '2026-07-10T08:00:00Z' },
      ],
      error: null,
    } as any);

    const result = await getLockedEmails();

    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('locked@example.com');
    expect(result[0].failedCount).toBe(5);
  });

  it('returns login attempts from RPC', async () => {
    const { supabase } = await import('../../lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        data: [
          { id: 'a1', email: 'user@example.com', ip_address: '127.0.0.1', success: false, attempted_at: '2026-07-10T08:00:00Z' },
        ],
        count: 1,
      },
      error: null,
    } as any);

    const result = await getLoginAttempts({ email: 'user@example.com' });

    expect(result.count).toBe(1);
    expect(result.data[0].email).toBe('user@example.com');
  });
});
