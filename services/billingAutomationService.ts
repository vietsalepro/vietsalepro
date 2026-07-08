import { supabase } from '../lib/supabase';
import {
  BillingAutomationStatus,
  BillingJobLog,
  RevenueMetrics,
  RevenueByPlanItem,
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
