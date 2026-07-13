// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendSms } from '../../services/admin/smsService';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

describe('services/admin/smsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes send-sms edge function with a single recipient', async () => {
    const { supabase } = await import('../../lib/supabase');
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: {
        success: true,
        id: 'SM123',
        ids: ['SM123'],
        to: ['+84912345678'],
        body: 'Xin chào',
        provider: 'twilio',
        test: false,
      },
      error: null,
    });

    const result = await sendSms({ to: '+84912345678', body: 'Xin chào' });

    expect(supabase.functions.invoke).toHaveBeenCalledWith('send-sms', {
      body: { to: '+84912345678', body: 'Xin chào', test: undefined },
    });
    expect(result.success).toBe(true);
    expect(result.id).toBe('SM123');
    expect(result.to).toEqual(['+84912345678']);
    expect(result.provider).toBe('twilio');
  });

  it('invokes send-sms edge function with multiple recipients', async () => {
    const { supabase } = await import('../../lib/supabase');
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: {
        success: true,
        ids: ['SM123', 'SM124'],
        to: ['+84912345678', '+84987654321'],
        body: 'Xin chào',
        provider: 'twilio',
        test: true,
      },
      error: null,
    });

    const result = await sendSms({
      to: ['+84912345678', '+84987654321'],
      body: 'Xin chào',
      test: true,
    });

    expect(result.success).toBe(true);
    expect(result.ids).toEqual(['SM123', 'SM124']);
    expect(result.test).toBe(true);
  });

  it('throws when the edge function reports an error', async () => {
    const { supabase } = await import('../../lib/supabase');
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { error: 'body không được để trống' },
      error: null,
    });

    await expect(sendSms({ to: '+84912345678', body: '' })).rejects.toThrow(
      'body không được để trống'
    );
  });
});
