import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { resetMockData } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import { getErrorPerformance } from '../../services/errorPerformanceService';
import ErrorPerformancePanel from '../../components/ErrorPerformancePanel';

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

  it('ErrorPerformancePanel render KPI cards, chart và top queries', async () => {
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      value: () => ({ width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0, toJSON: () => ({}) }),
    });

    const div = document.createElement('div');
    div.style.width = '800px';
    div.style.height = '600px';
    document.body.appendChild(div);
    const { container } = render(<ErrorPerformancePanel />, { container: div });

    await waitFor(() => {
      expect(screen.getByText('Tổng lỗi 24h')).toBeInTheDocument();
    });

    expect(screen.getByText('Lỗi theo nguồn (24h)')).toBeInTheDocument();
    expect(screen.getByText('Top queries theo tổng thời gian')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
