import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { supabase } from '../../lib/supabase';
import { getChurnCohortMetrics } from '../../services/billingAutomationService';

// ponytail: runnable self-check for P16.2 service wiring + mapper logic.
// Does not hit the real database; it verifies RPC call and field mapping.

const rpcMock = vi.fn() as Mock<(...args: any[]) => any>;

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: (...args: any[]) => rpcMock(...args),
  },
}));

const churnCohortRow = {
  churn: {
    active_start: 100,
    active_end: 92,
    churned_count: 8,
    churn_rate: 8.0,
    period_start: '2025-07-08',
    period_end: '2026-07-08',
  },
  cohort: {
    months: ['2025-07', '2025-08'],
    cohorts: [
      {
        month: '2025-07',
        total: 10,
        retention: [
          { month: '2025-08', conversion_rate: 30.0 },
        ],
      },
    ],
  },
  ltv: {
    average_ltv: 690000,
    total_revenue: 3450000,
    paying_tenants: 5,
    by_plan: [
      { plan: 'vip', plan_name: 'VIP', revenue: 3450000, tenants: 5, ltv: 690000 },
    ],
  },
  funnel: {
    trial: 2,
    active_free: 3,
    paying: 5,
    churned: 1,
  },
};

describe('smoke: admin dashboard P16.2 churn/cohort/LTV/funnel', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('gọi RPC get_churn_cohort_metrics và map đúng trường', async () => {
    rpcMock.mockResolvedValueOnce({ data: churnCohortRow, error: null });
    const result = await getChurnCohortMetrics();

    expect(rpcMock).toHaveBeenCalledWith('get_churn_cohort_metrics', {});

    expect(result.churn.activeStart).toBe(100);
    expect(result.churn.activeEnd).toBe(92);
    expect(result.churn.churnedCount).toBe(8);
    expect(result.churn.churnRate).toBe(8.0);
    expect(result.churn.periodStart).toBe('2025-07-08');

    expect(result.cohort.months).toEqual(['2025-07', '2025-08']);
    expect(result.cohort.cohorts).toHaveLength(1);
    expect(result.cohort.cohorts[0].month).toBe('2025-07');
    expect(result.cohort.cohorts[0].retention[0].conversionRate).toBe(30.0);

    expect(result.ltv.averageLtv).toBe(690000);
    expect(result.ltv.totalRevenue).toBe(3450000);
    expect(result.ltv.payingTenants).toBe(5);
    expect(result.ltv.byPlan[0].ltv).toBe(690000);

    expect(result.funnel.trial).toBe(2);
    expect(result.funnel.activeFree).toBe(3);
    expect(result.funnel.paying).toBe(5);
    expect(result.funnel.churned).toBe(1);
  });

  it('truyền đúng tham số kỳ và cohort', async () => {
    rpcMock.mockResolvedValueOnce({ data: churnCohortRow, error: null });
    await getChurnCohortMetrics({ startDate: '2026-01-01', endDate: '2026-06-30', cohortMonths: 6 });
    expect(rpcMock).toHaveBeenCalledWith('get_churn_cohort_metrics', {
      p_start_date: '2026-01-01',
      p_end_date: '2026-06-30',
      p_cohort_months: 6,
    });
  });
});
