// ============================================================
// TENANT TYPES - Multi-tenancy foundation
// ============================================================

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'pending' | 'archived';
export type TenantPlan = 'free' | 'vip';

export type TenantRole = 'admin' | 'cashier' | 'inventory_manager' | 'accountant';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: TenantStatus;
  plan: TenantPlan;
  ownerId?: string;
  settings?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  invitedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantSubscription {
  tenantId: string;
  plan: string;
  maxUsers: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
  currentMonthOrders: number;
  currentMonthStart: string;
  billingStatus?: string;
  expiresAt?: string;
  updatedAt?: string;
}

export interface UsageMetric {
  current: number;
  max: number;
  percent: number;
}

export interface UsageSummary {
  tenantId: string;
  plan: string;
  billingStatus?: string;
  expiresAt?: string;
  users: UsageMetric & { monthStart?: string };
  products: UsageMetric & { monthStart?: string };
  orders: UsageMetric & { monthStart?: string };
}

export type BillingStatus = 'ok' | 'past_due' | 'suspended' | 'cancelled';

export interface UpdateSubscriptionInput {
  plan?: TenantPlan;
  maxUsers?: number;
  maxProducts?: number;
  maxOrdersPerMonth?: number;
  billingStatus?: BillingStatus;
  expiresAt?: string | null;
}
