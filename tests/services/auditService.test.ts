import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeAuditLog } from '../../services/auditService';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return {
    supabase: mockSupabase,
    getCurrentTenantId: vi.fn(() => null),
  };
});

describe('auditService guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not invoke audit-log edge function when tenantId is null', async () => {
    await writeAuditLog('LOGIN', 'auth', { recordId: 'u1' });

    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('skips LOGIN audit silently on admin subdomain', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await writeAuditLog('LOGIN', 'auth', { recordId: 'u1' });

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
