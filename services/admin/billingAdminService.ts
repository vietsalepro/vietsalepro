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

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'suspended' | 'cancelled';

export interface SubscriptionLifecycleInput {
  status?: SubscriptionStatus;
  plan?: string;
  billingPeriod?: 'month' | 'year';
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
}

export async function updateSubscriptionLifecycle(
  tenantId: string,
  input: SubscriptionLifecycleInput
): Promise<TenantSubscription> {
  const { data, error } = await supabase
    .from('tenant_subscriptions')
    .update({
      status: input.status,
      plan: input.plan,
      plan_id: input.plan,
      billing_period: input.billingPeriod,
      billing_period_start: input.billingPeriodStart,
      billing_period_end: input.billingPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId)
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    tenantId: data.tenant_id,
    plan: data.plan,
    planId: data.plan_id,
    status: data.status,
    maxUsers: data.max_users,
    maxProducts: data.max_products,
    maxOrdersPerMonth: data.max_orders_per_month,
    maxStorageGb: data.max_storage_gb,
    currentMonthOrders: data.current_month_orders,
    currentMonthStart: data.current_month_start,
    billingStatus: data.billing_status,
    expiresAt: data.expires_at,
    billingPeriod: data.billing_period,
    billingPeriodStart: data.billing_period_start,
    billingPeriodEnd: data.billing_period_end,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as TenantSubscription;
}

export async function upgradeDowngradeSubscription(
  tenantId: string,
  plan: string,
  billingPeriod: 'month' | 'year' = 'month'
): Promise<TenantSubscription> {
  return updateSubscriptionLifecycle(tenantId, {
    plan,
    billingPeriod,
    status: 'active',
  });
}

export async function cancelSubscription(tenantId: string): Promise<TenantSubscription> {
  return updateSubscriptionLifecycle(tenantId, { status: 'cancelled' });
}

export async function renewSubscription(tenantId: string): Promise<TenantSubscription> {
  return updateSubscriptionLifecycle(tenantId, { status: 'active' });
}
