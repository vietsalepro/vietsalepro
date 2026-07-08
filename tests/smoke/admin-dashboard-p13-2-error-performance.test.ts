import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetMockData } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import { getErrorPerformance } from '../../services/errorPerformanceService';

describe('smoke: admin dashboard P13.2 error + performance metrics', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('getErrorPerformance trả về error summary và performance metrics', async () => {
    const result = await getErrorPerformance();
    expect(result.errors.total).toBeGreaterThanOrEqual(0);
    expect(result.errors.bySource.length).toBeGreaterThan(0);
    expect(result.errors.bySource.some(g => g.source === 'checkout' && g.count === 2)).toBe(true);
    expect(result.performance.p95Ms).toBeGreaterThan(0);
    expect(result.performance.p99Ms).toBeGreaterThanOrEqual(result.performance.p95Ms);
    expect(result.performance.rps).toBeGreaterThanOrEqual(0);
    expect(result.performance.topQueries.length).toBeGreaterThan(0);
  });
});
