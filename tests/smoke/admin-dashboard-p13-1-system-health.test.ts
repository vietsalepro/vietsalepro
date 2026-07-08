import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetMockData } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import { getSystemHealth } from '../../services/systemHealthService';

describe('smoke: admin dashboard P13.1 system health', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('getSystemHealth trả về đủ các checks DB/Storage/Edge Functions', async () => {
    const health = await getSystemHealth();
    expect(health.overall).toBe('healthy');
    expect(health.checks.length).toBe(3);
    expect(health.checks.some(c => c.name === 'Database')).toBe(true);
    expect(health.checks.some(c => c.name === 'Storage')).toBe(true);
    expect(health.checks.some(c => c.name === 'Edge Functions')).toBe(true);
    health.checks.forEach(c => {
      expect(c.status).toBe('healthy');
      expect(c.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });
});
