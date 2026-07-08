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
  impersonatedBy?: string;
  impersonatedAt?: string;
  impersonatedExpiresAt?: string;
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

// P13.1: System health dashboard
export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
  detail?: string;
}

export interface SystemHealth {
  checkedAt: string;
  overall: HealthStatus;
  checks: HealthCheck[];
}

// P13.2: Error log aggregation + performance metrics
export interface ErrorLogGroup {
  source: string;
  level: string;
  count: number;
}

export interface ErrorLogEntry {
  id: string;
  source: string;
  level: string;
  message: string;
  detail?: string;
  metadata?: any;
  created_at: string;
}

export interface ErrorLogSummary {
  total: number;
  since: string;
  bySource: ErrorLogGroup[];
  recent: ErrorLogEntry[];
}

export interface TopQueryMetric {
  query: string;
  calls: number;
  mean_ms: number;
  p95_ms: number;
  p99_ms: number;
  total_ms: number;
}

export interface QueryPerformanceMetrics {
  totalQueries: number;
  totalCalls: number;
  averageTimeMs: number;
  p95Ms: number;
  p99Ms: number;
  rps: number;
  resetAt: string;
  topQueries: TopQueryMetric[];
}

export interface ErrorPerformance {
  checkedAt: string;
  errors: ErrorLogSummary;
  performance: QueryPerformanceMetrics;
}

// P13.3: Storage usage per tenant + backup status
export interface StorageTable {
  name: string;
  rowCount: number;
  bytes: number;
}

export interface TenantStorageUsage {
  id: string;
  name: string;
  subdomain: string;
  bytes: number;
  tables: StorageTable[];
}

export interface StorageUsage {
  checkedAt: string;
  totalDatabaseBytes: number;
  tenants: TenantStorageUsage[];
}

export interface BackupStatus {
  pitrEnabled: boolean | null;
  pitrEarliestRecoveryPoint: string | null;
  lastBackupAt: string | null;
  cliAvailable: boolean;
  status: 'healthy' | 'degraded' | 'unknown';
}

// P13.4: Bulk operations + maintenance scheduler
export type MaintenanceWindowStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface MaintenanceWindow {
  id: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  status: MaintenanceWindowStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BulkUpdateTenantsResult {
  updated: number;
  updatedIds: string[];
  skippedIds: string[];
}
