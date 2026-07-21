import { supabase } from '../../lib/supabase';
import { TenantSubscription, UpdateSubscriptionInput } from '../../types/tenant';
import {
  getTenantSubscription as getTenantSubscriptionBase,
  updateTenantSubscription as updateTenantSubscriptionBase,
  resetMonthlyOrderCounter as resetMonthlyOrderCounterBase,
  updateSubscriptionLimits as updateSubscriptionLimitsBase,
} from '../tenantService';

// ponytail: thin admin wrapper around billing/subscription operations.
// Phase 2.1 centralizes billing calls used by the admin dashboard.
// Phase 4.1 adds Basejump subscription lifecycle helpers.

export type { BankAccount, CompanyInfo } from '../bankAccountService';

export {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getCompanyInfo,
  setCompanyInfo,
} from '../bankAccountService';

export {
  getPlans,
  getPlanByKey,
  createPlan,
  updatePlan,
  deletePlan,
} from '../planService';

export {
  createInvoice,
  confirmPayment,
} from '../invoiceService';

export async function getTenantSubscription(tenantId: string): Promise<TenantSubscription | null> {
  return getTenantSubscriptionBase(tenantId);
}

export async function updateTenantSubscription(
  tenantId: string,
  input: UpdateSubscriptionInput
): Promise<TenantSubscription> {
  return updateTenantSubscriptionBase(tenantId, input);
}

export async function updateSubscriptionLimits(
  tenantId: string,
  input: UpdateSubscriptionInput
): Promise<TenantSubscription> {
  return updateSubscriptionLimitsBase(tenantId, input);
}

export async function resetMonthlyOrderCounter(tenantId: string): Promise<TenantSubscription> {
  return resetMonthlyOrderCounterBase(tenantId);
}

const mapSubscriptionFromDB = (row: any): TenantSubscription => ({
  id: row.id,
  tenantId: row.tenant_id,
  plan: row.plan,
  planId: row.plan_id,
  status: row.status,
  billingStatus: row.billing_status,
  maxUsers: row.max_users,
  maxProducts: row.max_products,
  maxOrdersPerMonth: row.max_orders_per_month,
  maxStorageGb: row.max_storage_gb,
  currentMonthOrders: row.current_month_orders ?? 0,
  currentMonthStart: row.current_month_start,
  billingPeriod: row.billing_period,
  billingPeriodStart: row.billing_period_start,
  billingPeriodEnd: row.billing_period_end,
  expiresAt: row.expires_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function upgradeDowngradeSubscription(
  tenantId: string,
  plan: string,
  billingPeriod: 'month' | 'year' = 'month'
): Promise<TenantSubscription> {
  const { data, error } = await supabase.rpc('create_subscription', {
    p_tenant_id: tenantId,
    p_plan: plan,
    p_billing_period: billingPeriod,
  });
  if (error) throw error;
  return mapSubscriptionFromDB(data);
}

export async function cancelSubscription(tenantId: string): Promise<TenantSubscription> {
  const { data, error } = await supabase.rpc('cancel_subscription', { p_tenant_id: tenantId });
  if (error) throw error;
  return mapSubscriptionFromDB(data);
}

export async function renewSubscription(tenantId: string): Promise<TenantSubscription> {
  const current = await getTenantSubscription(tenantId);
  if (!current) throw new Error('Không tìm thấy subscription cho tenant');
  const { data, error } = await supabase.rpc('create_subscription', {
    p_tenant_id: tenantId,
    p_plan: current.plan,
    p_billing_period: current.billingPeriod ?? 'month',
  });
  if (error) throw error;
  return mapSubscriptionFromDB(data);
}
