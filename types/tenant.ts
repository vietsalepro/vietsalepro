// ============================================================
// TENANT TYPES - Multi-tenancy foundation
// ============================================================

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'pending' | 'archived' | 'read_only';
export type TenantPlan = string;

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

export interface MemberWithEmail extends TenantMembership {
  email?: string;
  invitedByEmail?: string;
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

export interface ExpiringTenant {
  id: string;
  name: string;
  subdomain: string;
  expiresAt: string;
  daysRemaining: number;
}

export interface NearLimitTenant {
  id: string;
  name: string;
  subdomain: string;
  userPercent: number;
  productPercent: number;
  orderPercent: number;
}

export interface SystemOverview {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  vipTenants: number;
  expiringSoon: number;
  nearLimit: number;
  newThisMonth: number;
  expiringTenants: ExpiringTenant[];
  nearLimitTenants: NearLimitTenant[];
}

export interface TopTenant {
  id: string;
  name: string;
  subdomain: string;
  status: TenantStatus;
  plan: TenantPlan;
  createdAt?: string;
  ordersThisMonth: number;
  userCount: number;
  productCount: number;
}

export interface TenantGrowthPoint {
  month: string;
  count: number;
}

export interface PlanLimits {
  maxUsers: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
}

export interface DefaultPlanLimits {
  free: PlanLimits;
  vip: PlanLimits;
}

export interface Plan {
  key: string;
  name: string;
  description?: string;
  maxUsers: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
  monthlyPrice: number;
  yearlyPrice: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlanInput {
  key: string;
  name: string;
  description?: string;
  maxUsers: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
  monthlyPrice?: number;
  yearlyPrice?: number;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string;
  maxUsers?: number;
  maxProducts?: number;
  maxOrdersPerMonth?: number;
  monthlyPrice?: number;
  yearlyPrice?: number;
  isActive?: boolean;
}

export interface MaintenanceMode {
  enabled: boolean;
  message: string;
}

export interface DataRetentionStatus {
  archivedOrdersCount: number;
  archivedOrderItemsCount: number;
  rateLimitLogsCount: number;
  lastRun: { run_at?: string } | null;
  cronSchedule: string;
  cronJob: any;
}

// P8.2: Tenant-scoped feature flags stored in tenants.settings->features
export interface TenantFeatureFlags {
  pos?: boolean;
  inventory?: boolean;
  reports?: boolean;
  debt?: boolean;
  loyalty?: boolean;
  promotions?: boolean;
  invoicing?: boolean;
  lotTracking?: boolean;
}

export const DEFAULT_TENANT_FEATURE_FLAGS: Required<TenantFeatureFlags> = {
  pos: true,
  inventory: true,
  reports: true,
  debt: true,
  loyalty: true,
  promotions: true,
  invoicing: true,
  lotTracking: true,
};
