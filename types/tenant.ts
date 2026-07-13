// ============================================================
// TENANT TYPES - Multi-tenancy foundation
// ============================================================

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'pending' | 'archived' | 'read_only';
export type TenantPlan = string;

// FIX [6.4]: Add 'viewer' role (SELECT-only permission, no mutations)
// Sub-Phase 3.2: Add 'owner' role to match the database tenant_memberships role enum.
export type TenantRole = 'owner' | 'admin' | 'cashier' | 'inventory_manager' | 'accountant' | 'viewer';

// Sub-Phase 5.1: admin dashboard RBAC role enum (Basejump permissions matrix)
export type TenantRbacRole = 'owner' | 'admin' | 'member' | 'viewer';
export type TenantPermission =
  | 'tenant.view' | 'tenant.update' | 'tenant.delete'
  | 'billing.view' | 'billing.manage'
  | 'members.view' | 'members.invite' | 'members.remove' | 'members.change_role'
  | 'settings.view' | 'settings.update'
  | 'audit.view'
  | 'analytics.view';

export type TenantIsolationMode = 'shared' | 'schema' | 'project';

export interface TenantWhiteLabel {
  brandName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: TenantStatus;
  plan: string;
  ownerId?: string;
  settings?: Record<string, any>;
  isolationMode?: TenantIsolationMode;
  isolationSchema?: string;
  isolationProjectRef?: string;
  customDomain?: string;
  customDomainVerifiedAt?: string;
  whiteLabel?: TenantWhiteLabel;
  readReplicaUrl?: string;
  connectionPoolConfig?: Record<string, any>;
  adminEmail?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface CreateTenantResult {
  tenant: Tenant;
  adminUser: {
    id: string;
    email: string;
    created_at?: string;
  };
  resetEmailSent: boolean;
  redirectTo?: string;
}

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  status?: 'pending' | 'active' | 'inactive';
  isActive?: boolean;
  invitedBy?: string;
  email?: string;
  impersonatedBy?: string;
  impersonatedAt?: string;
  impersonatedExpiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemberWithEmail extends TenantMembership {
  email?: string;
  invitedByEmail?: string;
  invitedAt?: string;
  acceptedAt?: string;
  lastSignInAt?: string;
  confirmedAt?: string;
  isOwner?: boolean;
}

// Sub-Phase 5.1: Invitation flow
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface Invitation {
  id: string;
  tenantId: string;
  email: string;
  role: string;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchMembersParams {
  tenantId: string;
  search?: string;
  role?: TenantRole | null;
  status?: 'pending' | 'active' | 'inactive' | null;
  isActive?: boolean | null;
  sortBy?: 'email' | 'role' | 'status' | 'created_at' | 'last_sign_in_at';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface SearchMembersResult {
  members: MemberWithEmail[];
  totalCount: number;
}

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'suspended' | 'cancelled';

export interface TenantSubscription {
  id?: string;
  tenantId: string;
  plan: string;
  planId?: string;
  status?: SubscriptionStatus;
  maxUsers: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
  maxStorageGb?: number;
  currentMonthOrders: number;
  currentMonthStart: string;
  billingStatus?: string;
  billingPeriod?: 'month' | 'year';
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  expiresAt?: string;
  createdAt?: string;
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
  plan?: string;
  maxUsers?: number;
  maxProducts?: number;
  maxOrdersPerMonth?: number;
  maxStorageGb?: number;
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
  plan: string;
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
// Phase 5 long-term hardening: admin dashboard feature gates default to OFF.
export interface TenantFeatureFlags {
  pos?: boolean;
  inventory?: boolean;
  reports?: boolean;
  debt?: boolean;
  loyalty?: boolean;
  promotions?: boolean;
  invoicing?: boolean;
  lotTracking?: boolean;
  adminGdprEnabled?: boolean;
  adminAuditRealtimeEnabled?: boolean;
  adminAdvancedAnalyticsEnabled?: boolean;
  adminImpersonationEnabled?: boolean;
  adminReadReplicaQueueEnabled?: boolean;
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
  adminGdprEnabled: false,
  adminAuditRealtimeEnabled: false,
  adminAdvancedAnalyticsEnabled: false,
  adminImpersonationEnabled: false,
  adminReadReplicaQueueEnabled: false,
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

// Sub-Phase 7.1: Cron job status for health page.
export type CronJobName = 'billing_reminders' | 'audit_log_cleanup';
export type CronJobStatus = 'running' | 'success' | 'failed';

export interface CronJobLog {
  id: string;
  jobName: CronJobName;
  status: CronJobStatus;
  startedAt: string;
  completedAt?: string;
  details?: Record<string, any>;
  errorMessage?: string;
  retryCount: number;
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

// P15.1: API platform keys
export interface TenantApiKey {
  id: string;
  tenantId: string;
  name: string;
  apiKey?: string;
  apiKeyPreview?: string;
  version: number;
  status: 'active' | 'revoked';
  createdBy?: string;
  revokedAt?: string;
  revokedBy?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// P15.2: Webhooks
export interface TenantWebhook {
  id: string;
  tenantId: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  status: 'active' | 'paused';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryAttempt {
  attemptedAt: string;
  httpStatus?: number;
  errorMessage?: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  tenantId: string;
  eventType: string;
  payload: any;
  idempotencyKey: string;
  status: 'pending' | 'delivered' | 'failed' | 'exhausted';
  httpStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  attemptCount: number;
  maxAttempts: number;
  attemptedAt?: string;
  deliveredAt?: string;
  nextRetryAt?: string;
  attemptLog: WebhookDeliveryAttempt[];
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryList {
  data: WebhookDelivery[];
  count: number;
}

// P15.3: Integration marketplace + partner portal
export type PartnerStatus = 'active' | 'inactive';

export interface Partner {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  logoUrl?: string;
  status: PartnerStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type IntegrationStatus = 'active' | 'inactive';

export interface Integration {
  id: string;
  partnerId?: string;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  status: IntegrationStatus;
  documentationUrl?: string;
  partnerName?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// P17.3: Terms acceptance + tenant data export
export type TermsType = 'tos' | 'privacy' | 'gdpr' | 'cookie' | 'custom';

export const TERMS_TYPE_LABELS: Record<TermsType, string> = {
  tos: 'Điều khoản sử dụng',
  privacy: 'Chính sách bảo mật',
  gdpr: 'GDPR / Dữ liệu cá nhân',
  cookie: 'Cookie',
  custom: 'Tùy chỉnh',
};

export interface TermsAcceptance {
  id: string;
  userId: string;
  tenantId?: string;
  termsVersion: string;
  termsType: TermsType;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: string;
}

export interface TermsAcceptanceList {
  data: TermsAcceptance[];
  count: number;
}

export interface TenantExportTable {
  table_name: string;
  row_count: number;
  rows: any[];
  error?: string;
}

export interface TenantExportData {
  tenant: any;
  subscription: any;
  members: any[];
  tables: TenantExportTable[];
  exported_at: string;
}

// P17.4: Fraud detection + data retention policy
export type FraudSeverity = 'low' | 'medium' | 'high';
export type FraudType = 'ip_burst' | 'email_domain_burst' | 'owner_burst';
export type FraudQueueStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface FraudQueueItem {
  id: string;
  type: FraudType;
  severity: FraudSeverity;
  status: FraudQueueStatus;
  targetValue?: string;
  eventCount: number;
  details: any;
  windowStart?: string;
  windowEnd?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FraudQueueList {
  data: FraudQueueItem[];
  count: number;
}

export interface FraudStats {
  total: number;
  byStatus: Record<FraudQueueStatus | string, number>;
  bySeverity: Record<FraudSeverity | string, number>;
}

export interface FraudDetectionConfig {
  enabled: boolean;
  ipWindowHours: number;
  ipMax: number;
  emailDomainWindowHours: number;
  emailDomainMax: number;
  ownerWindowHours: number;
  ownerMax: number;
}

export interface DataRetentionConfig {
  retentionDaysOrders: number;
  retentionDaysProcessedOperations: number;
  retentionDaysRateLimitLogs: number;
  retentionDaysFraudQueue: number;
  retentionDaysRegistrationEvents: number;
  cronSchedule: string;
}

// P18.3: Read replica + connection pooling + heavy ops queue
export type HeavyOpJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface HeavyOpJob {
  id: string;
  tenantId: string;
  jobType: string;
  payload?: any;
  status: HeavyOpJobStatus;
  attempts: number;
  maxAttempts: number;
  errorMessage?: string;
  result?: any;
  scheduledAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConnectionPoolStats {
  active: number;
  idle: number;
  total: number;
  max: number;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message?: string;
}

export interface ReadReplicaStatus {
  enabled: boolean;
  configuredTenants: number;
  message?: string;
}

export interface DataRetentionRunResult {
  archivedOrders: number;
  archivedItems: number;
  deletedProcessedOperations: number;
  deletedRateLimitLogs: number;
  deletedFraudQueue: number;
  deletedRegistrationEvents: number;
}
