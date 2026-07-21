// Sub-Phase 7.2: Admin analytics service (churn, cohort, revenue).
// ponytail: reuses existing RPCs get_revenue_metrics and get_churn_cohort_metrics;
//           if the dashboard later needs dedicated per-metric RPCs, split here.

import { supabase } from '../../lib/supabase';
import type {
  RevenueMetrics,
  ChurnCohortMetrics,
  ChurnMetric,
  CohortMetrics,
} from '../../types/billing';

export interface AnalyticsDateRange {
  startDate?: string;
  endDate?: string;
}

export async function getAdminRevenueMetrics(
  options: AnalyticsDateRange = {},
): Promise<RevenueMetrics> {
  const params: Record<string, any> = {};
  if (options.startDate) params.p_start_date = options.startDate;
  if (options.endDate) params.p_end_date = options.endDate;

  const { data, error } = await supabase.rpc('get_revenue_metrics', params);
  if (error) throw error;

  const d = data || {};
  return {
    mrr: d.mrr ?? 0,
    arr: d.arr ?? 0,
    totalRevenue: d.total_revenue ?? 0,
    revenueByPlan: (d.revenue_by_plan || []).map((row: any) => ({
      plan: row.plan,
      planName: row.plan_name,
      revenue: row.revenue ?? 0,
      paymentCount: row.payment_count ?? 0,
    })),
    periodStart: d.period_start ?? '',
    periodEnd: d.period_end ?? '',
  };
}

export async function getAdminChurnCohortMetrics(
  options: AnalyticsDateRange & { cohortMonths?: number } = {},
): Promise<ChurnCohortMetrics> {
  const params: Record<string, any> = {};
  if (options.startDate) params.p_start_date = options.startDate;
  if (options.endDate) params.p_end_date = options.endDate;
  if (options.cohortMonths) params.p_cohort_months = options.cohortMonths;

  const { data, error } = await supabase.rpc('get_churn_cohort_metrics', params);
  if (error) throw error;

  const d = data || {};
  const churnRow = d.churn || {};
  const cohortRow = d.cohort || {};
  const ltvRow = d.ltv || {};
  const funnelRow = d.funnel || {};

  return {
    churn: {
      activeStart: churnRow.active_start ?? 0,
      activeEnd: churnRow.active_end ?? 0,
      churnedCount: churnRow.churned_count ?? 0,
      churnRate: churnRow.churn_rate ?? 0,
      periodStart: churnRow.period_start ?? '',
      periodEnd: churnRow.period_end ?? '',
    } as ChurnMetric,
    cohort: {
      months: cohortRow.months || [],
      cohorts: (cohortRow.cohorts || []).map((c: any) => ({
        month: c.month,
        total: c.total ?? 0,
        retention: (c.retention || []).map((r: any) => ({
          month: r.month,
          conversionRate: r.conversion_rate ?? 0,
        })),
      })),
    } as CohortMetrics,
    ltv: {
      averageLtv: ltvRow.average_ltv ?? 0,
      totalRevenue: ltvRow.total_revenue ?? 0,
      payingTenants: ltvRow.paying_tenants ?? 0,
      byPlan: (ltvRow.by_plan || []).map((row: any) => ({
        plan: row.plan,
        planName: row.plan_name,
        revenue: row.revenue ?? 0,
        tenants: row.tenants ?? 0,
        ltv: row.ltv ?? 0,
      })),
    },
    funnel: {
      trial: funnelRow.trial ?? 0,
      activeFree: funnelRow.active_free ?? 0,
      paying: funnelRow.paying ?? 0,
      churned: funnelRow.churned ?? 0,
    },
  };
}

// Convenience helpers that slice the combined RPC result per spec names.
export async function getAdminChurnMetrics(
  options: AnalyticsDateRange = {},
): Promise<ChurnMetric> {
  const metrics = await getAdminChurnCohortMetrics(options);
  return metrics.churn;
}

export async function getAdminCohortMetrics(
  options: AnalyticsDateRange & { cohortMonths?: number } = {},
): Promise<CohortMetrics> {
  const metrics = await getAdminChurnCohortMetrics(options);
  return metrics.cohort;
}

// DEP-003: overview RPC re-exports used by the admin dashboard overview tab.
export {
  getSystemOverview,
  getTopTenants,
  getTenantGrowth,
} from '../tenantService';
