import { supabase } from '../lib/supabase';
import {
  BillingAutomationStatus,
  BillingJobLog,
  RevenueMetrics,
  RevenueByPlanItem,
  ChurnCohortMetrics,
  ChurnMetric,
  CohortMetrics,
  LtvMetrics,
  FunnelMetrics,
} from '../types/billing';

const mapJobLogFromDB = (row: any): BillingJobLog => ({
  id: row.id,
  jobName: row.job_name,
  status: row.status,
  runAt: row.run_at,
  durationMs: row.duration_ms,
  recordsAffected: row.records_affected,
  message: row.message,
  details: row.details,
  createdAt: row.created_at,
});

export async function getBillingAutomationStatus(): Promise<BillingAutomationStatus> {
  const { data, error } = await supabase.rpc('get_billing_automation_status');
  if (error) throw error;
  const d = data || {};
  return {
    expiringSoonCount: d.expiring_soon_count ?? 0,
    expiringSoon: (d.expiring_soon || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      subdomain: row.subdomain,
      expiresAt: row.expires_at,
      daysRemaining: row.days_remaining,
    })),
    pendingInvoiceCount: d.pending_invoice_count ?? 0,
    overdueInvoiceCount: d.overdue_invoice_count ?? 0,
    overdueInvoices: (d.overdue_invoices || []).map((row: any) => ({
      id: row.id,
      invoiceNo: row.invoice_no,
      tenantId: row.tenant_id,
      tenantName: row.tenant_name,
      tenantSubdomain: row.tenant_subdomain,
      dueDate: row.due_date,
      status: row.status,
      balance: row.balance,
    })),
    dunningTenantCount: d.dunning_tenant_count ?? 0,
    dunningTenants: (d.dunning_tenants || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      subdomain: row.subdomain,
      status: row.status,
      billingStatus: row.billing_status,
    })),
  };
}

export async function getBillingJobLogs(limit = 100): Promise<BillingJobLog[]> {
  const { data, error } = await supabase.rpc('get_billing_job_logs', { p_limit: limit });
  if (error) throw error;
  return (data || []).map(mapJobLogFromDB);
}

const mapRevenueByPlanFromDB = (row: any): RevenueByPlanItem => ({
  plan: row.plan,
  planName: row.plan_name,
  revenue: row.revenue ?? 0,
  paymentCount: row.payment_count ?? 0,
});

export async function getRevenueMetrics(options?: {
  startDate?: string;
  endDate?: string;
}): Promise<RevenueMetrics> {
  const params: Record<string, any> = {};
  if (options?.startDate) params.p_start_date = options.startDate;
  if (options?.endDate) params.p_end_date = options.endDate;

  const { data, error } = await supabase.rpc('get_revenue_metrics', params);
  if (error) throw error;

  const d = data || {};
  return {
    mrr: d.mrr ?? 0,
    arr: d.arr ?? 0,
    totalRevenue: d.total_revenue ?? 0,
    revenueByPlan: (d.revenue_by_plan || []).map(mapRevenueByPlanFromDB),
    periodStart: d.period_start ?? '',
    periodEnd: d.period_end ?? '',
  };
}

const mapChurnMetric = (row: any): ChurnMetric => ({
  activeStart: row.active_start ?? 0,
  activeEnd: row.active_end ?? 0,
  churnedCount: row.churned_count ?? 0,
  churnRate: row.churn_rate ?? 0,
  periodStart: row.period_start ?? '',
  periodEnd: row.period_end ?? '',
});

const mapCohortMetrics = (row: any): CohortMetrics => ({
  months: row.months || [],
  cohorts: (row.cohorts || []).map((c: any) => ({
    month: c.month,
    total: c.total ?? 0,
    retention: (c.retention || []).map((r: any) => ({
      month: r.month,
      conversionRate: r.conversion_rate ?? 0,
    })),
  })),
});

const mapLtvByPlan = (row: any) => ({
  plan: row.plan,
  planName: row.plan_name,
  revenue: row.revenue ?? 0,
  tenants: row.tenants ?? 0,
  ltv: row.ltv ?? 0,
});

const mapLtvMetrics = (row: any): LtvMetrics => ({
  averageLtv: row.average_ltv ?? 0,
  totalRevenue: row.total_revenue ?? 0,
  payingTenants: row.paying_tenants ?? 0,
  byPlan: (row.by_plan || []).map(mapLtvByPlan),
});

const mapFunnelMetrics = (row: any): FunnelMetrics => ({
  trial: row.trial ?? 0,
  activeFree: row.active_free ?? 0,
  paying: row.paying ?? 0,
  churned: row.churned ?? 0,
});

export async function getChurnCohortMetrics(options?: {
  startDate?: string;
  endDate?: string;
  cohortMonths?: number;
}): Promise<ChurnCohortMetrics> {
  const params: Record<string, any> = {};
  if (options?.startDate) params.p_start_date = options.startDate;
  if (options?.endDate) params.p_end_date = options.endDate;
  if (options?.cohortMonths) params.p_cohort_months = options.cohortMonths;

  const { data, error } = await supabase.rpc('get_churn_cohort_metrics', params);
  if (error) throw error;

  const d = data || {};
  return {
    churn: mapChurnMetric(d.churn || {}),
    cohort: mapCohortMetrics(d.cohort || {}),
    ltv: mapLtvMetrics(d.ltv || {}),
    funnel: mapFunnelMetrics(d.funnel || {}),
  };
}
