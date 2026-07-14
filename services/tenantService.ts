import { supabase } from '../lib/supabase';
import {
  Tenant,
  TenantMembership,
  MemberWithEmail,
  TenantRole,
  TenantSubscription,
  TenantStatus,
  TenantPlan,
  UsageSummary,
  UsageMetric,
  UpdateSubscriptionInput,
  SystemOverview,
  TopTenant,
  TenantGrowthPoint,
  TenantFeatureFlags,
  DEFAULT_TENANT_FEATURE_FLAGS,
  StorageUsage,
  StorageTable,
  TenantStorageUsage,
  CreateTenantResult,
  SearchMembersParams,
  SearchMembersResult,
} from '../types/tenant';
import {
  normalizeRpcArray,
  normalizeRpcObject,
  normalizeRpcPaginated,
} from '../utils/service';

// --- Admin dashboard tenant types ---

export interface SearchTenantsResult {
  tenants: Tenant[];
  totalCount: number;
  counts: {
    active: number;
    suspended: number;
    trial: number;
    pending: number;
    archived: number;
    free: number;
    vip: number;
  };
}

export interface TenantCredentials {
  tenantId: string;
  adminEmail: string;
}

// --- Mappers ---

export const mapTenantFromDB = (row: any): Tenant => ({
  id: row.id,
  name: row.name,
  subdomain: row.subdomain,
  status: row.status,
  plan: row.plan,
  ownerId: row.owner_id,
  settings: row.settings || {},
  isolationMode: row.isolation_mode || 'shared',
  isolationSchema: row.isolation_schema,
  isolationProjectRef: row.isolation_project_ref,
  customDomain: row.custom_domain,
  customDomainVerifiedAt: row.custom_domain_verified_at,
  whiteLabel: row.white_label || {},
  readReplicaUrl: row.read_replica_url,
  connectionPoolConfig: row.connection_pool_config || {},
  adminEmail: row.admin_email,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  archivedAt: row.archived_at,
});

const mapMembershipFromDB = (row: any): TenantMembership => ({
  id: row.id,
  tenantId: row.tenant_id,
  userId: row.user_id,
  role: row.role,
  status: row.status,
  invitedBy: row.invited_by,
  isActive: row.is_active,
  email: row.email,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

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
  billingPeriod: row.billing_period,
  billingPeriodStart: row.billing_period_start,
  billingPeriodEnd: row.billing_period_end,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  currentMonthStart: row.current_month_start,
  currentMonthOrders: row.current_month_orders,
  updatedAt: row.updated_at,
});

// --- Defensive mappers (Phase 5 long-term hardening) ---

const mapUsageMetricFromDB = (row: any): UsageMetric => ({
  current: row?.current ?? 0,
  max: row?.max ?? 0,
  percent: row?.percent ?? 0,
});

const mapUsageSummaryFromDB = (row: any): UsageSummary => ({
  tenantId: row?.tenantId ?? row?.tenant_id ?? '',
  plan: row?.plan ?? '',
  billingStatus: row?.billingStatus ?? row?.billing_status,
  expiresAt: row?.expiresAt ?? row?.expires_at,
  users: {
    ...mapUsageMetricFromDB(row?.users),
    monthStart: row?.users?.monthStart ?? row?.users?.month_start,
  },
  products: {
    ...mapUsageMetricFromDB(row?.products),
    monthStart: row?.products?.monthStart ?? row?.products?.month_start,
  },
  orders: {
    ...mapUsageMetricFromDB(row?.orders),
    monthStart: row?.orders?.monthStart ?? row?.orders?.month_start,
  },
});

const mapTopTenantFromDB = (row: any): TopTenant => ({
  id: row?.id,
  name: row?.name ?? '',
  subdomain: row?.subdomain ?? '',
  status: row?.status ?? 'active',
  plan: row?.plan ?? '',
  createdAt: row?.createdAt ?? row?.created_at,
  ordersThisMonth: row?.ordersThisMonth ?? row?.orders_this_month ?? 0,
  userCount: row?.userCount ?? row?.user_count ?? 0,
  productCount: row?.productCount ?? row?.product_count ?? 0,
});

const mapTenantGrowthPointFromDB = (row: any): TenantGrowthPoint => ({
  month: row?.month ?? '',
  count: row?.count ?? 0,
});

const mapStorageTableFromDB = (row: any): StorageTable => ({
  name: row?.name ?? '',
  rowCount: row?.row_count ?? 0,
  bytes: row?.bytes ?? 0,
});

const mapTenantStorageUsageFromDB = (row: any): TenantStorageUsage => ({
  id: row?.id ?? '',
  name: row?.name ?? '',
  subdomain: row?.subdomain ?? '',
  bytes: row?.bytes ?? 0,
  tables: (row?.tables ?? []).map(mapStorageTableFromDB),
});

const mapStorageUsageFromDB = (row: any): StorageUsage => ({
  checkedAt: row?.checkedAt ?? row?.checked_at ?? new Date().toISOString(),
  totalDatabaseBytes: row?.totalDatabaseBytes ?? row?.total_database_bytes ?? 0,
  tenants: (row?.tenants ?? []).map(mapTenantStorageUsageFromDB),
});

const parseFunctionError = async (error: any): Promise<string> => {
  if (
    error && typeof error === 'object' &&
    (error.name === 'FunctionsHttpError' || error.constructor?.name === 'FunctionsHttpError') &&
    typeof error.context?.json === 'function'
  ) {
    try {
      const body = await error.context.json();
      return body?.error || body?.message || error.message;
    } catch {
      return error.message;
    }
  }
  return error?.message || 'Mời thành viên thất bại';
};

// --- Runtime validation helpers ---

// FIX [6.1]: RFC 5322 compliant email validation pattern
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// FIX [6.4]: Add 'viewer' role
const VALID_ROLES = new Set(['admin', 'cashier', 'inventory_manager', 'accountant', 'viewer']);

function validateRole(role: string): asserts role is TenantRole {
  if (!VALID_ROLES.has(role)) {
    throw new Error(`Vai trò không hợp lệ: "${role}". Chỉ chấp nhận: ${Array.from(VALID_ROLES).join(', ')}`);
  }
}

function validateEmail(email: string): void {
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    throw new Error(`Email không hợp lệ: "${email}"`);
  }
}

// --- Invite & reset ---

export async function resetInvite(tenantId: string, userId: string): Promise<{ success: boolean; action?: string; redirectTo?: string; link?: string | null }> {
  const { data: member, error: memberError } = await supabase
    .from('tenant_memberships')
    .select('status')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .maybeSingle();

  if (memberError) throw memberError;
  if (!member) throw new Error('Thành viên không tồn tại');
  if (member.status !== 'pending') {
    throw new Error('Chỉ có thể gửi lại lời mời cho thành viên đang ở trạng thái pending');
  }
  return resetMemberPassword(tenantId, userId);
}

export async function toggleMemberActive(tenantId: string, userId: string, isActive: boolean): Promise<TenantMembership> {
  // FIX [3.3]: Use RPC with SECURITY DEFINER instead of direct update
  const { data, error } = await supabase.rpc('toggle_tenant_member_active', {
    p_tenant_id: tenantId,
    p_user_id: userId,
    p_is_active: isActive,
  });
  if (error) throw error;
  return mapMembershipFromDB(data);
}

export async function inviteMemberByEmail(
  tenantId: string,
  email: string,
  role: TenantRole
): Promise<{ success: boolean; message?: string; emailProviderConfigured?: boolean }> {
  // FIX [5.5]: Add runtime validation for role
  validateRole(role);
  const { data, error } = await supabase.functions.invoke<{ success: boolean; message?: string; emailProviderConfigured?: boolean; error?: string }>('invite-member', {
    body: { tenant_id: tenantId, email, role },
  });
  if (error) {
    throw new Error(await parseFunctionError(error));
  }
  if (!data || typeof data !== 'object' || !data.success) {
    throw new Error(data?.error || data?.message || 'Mời thành viên thất bại');
  }
  return { success: data.success, message: data.message, emailProviderConfigured: data.emailProviderConfigured };
}

export async function bulkInviteMembers(
  tenantId: string,
  emails: string[],
  role: TenantRole,
  maxConcurrency: number = 3
): Promise<{
  succeeded: number;
  failed: number;
  alreadyMember: number;
  emailProviderNotConfigured: number;
  errors: { email: string; message: string }[];
}> {
  // Validate
  if (!Array.isArray(emails) || emails.length === 0) {
    return { succeeded: 0, failed: 0, alreadyMember: 0, emailProviderNotConfigured: 0, errors: [] };
  }
  if (emails.length > 50) {
    throw new Error('Tối đa 50 email mỗi lần');
  }
  validateRole(role);

  // Deduplicate & normalize
  const seen = new Set<string>();
  const uniqueEmails = emails
    .map((e) => e.trim().toLowerCase())
    .filter((e) => {
      if (!e || seen.has(e)) return false;
      seen.add(e);
      return true;
    });

  // Validate email format
  const validEmails = uniqueEmails.filter((e) => EMAIL_REGEX.test(e));
  const invalidCount = uniqueEmails.length - validEmails.length;

  // Check existing members
  const { data: existingMembers, error: existingError } = await supabase
    .from('tenant_memberships')
    .select('email')
    .eq('tenant_id', tenantId)
    .in('email', validEmails);

  if (existingError) throw existingError;

  const existingEmailSet = new Set((existingMembers ?? []).map((m: any) => m.email?.toLowerCase()));
  const newEmails = validEmails.filter((e) => !existingEmailSet.has(e));

  // Check quota
  const { data: usageData, error: usageError } = await supabase.rpc('get_tenant_usage_summary', {
    p_tenant_id: tenantId,
  });
  if (usageError) throw usageError;

  const currentUsers = usageData?.users?.current ?? 0;
  const maxUsers = usageData?.users?.max ?? 0;
  const availableSlots = maxUsers > 0 ? Math.max(0, maxUsers - currentUsers) : newEmails.length;
  const inviteEmails = newEmails.slice(0, availableSlots);
  const quotaExceeded = newEmails.length - inviteEmails.length;

  // Invite concurrently
  const results = await Promise.allSettled(
    inviteEmails.map((email) =>
      supabase.functions.invoke<{ success: boolean; message?: string; emailProviderConfigured?: boolean; error?: string }>('invite-member', {
        body: { tenant_id: tenantId, email, role },
      })
    )
  );

  let succeeded = 0;
  let failed = 0;
  let emailProviderNotConfigured = 0;
  const errors: { email: string; message: string }[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const email = inviteEmails[i];
    if (result.status === 'fulfilled' && result.value.data?.success) {
      succeeded++;
      if (!result.value.data.emailProviderConfigured) {
        emailProviderNotConfigured++;
      }
    } else {
      failed++;
      const message = result.status === 'rejected'
        ? (await parseFunctionError(result.reason).catch(() => result.reason?.message || 'Lỗi không xác định'))
        : (result.value.data?.error || result.value.data?.message || 'Mời thất bại');
      errors.push({ email, message });
    }
  }

  // Add quota exceeded as failures
  for (let i = 0; i < quotaExceeded; i++) {
    failed++;
    errors.push({ email: newEmails[inviteEmails.length + i], message: 'Vượt quá giới hạn thành viên' });
  }

  // Add invalid emails as failures
  for (let i = 0; i < invalidCount; i++) {
    failed++;
    errors.push({ email: '', message: 'Email không hợp lệ' });
  }

  return {
    succeeded,
    failed,
    alreadyMember: existingEmailSet.size,
    emailProviderNotConfigured,
    errors,
  };
}

export async function resendMemberInvite(
  tenantId: string,
  userId: string
): Promise<{ success: boolean; action?: string; redirectTo?: string; link?: string | null }> {
  const { data: member, error: memberError } = await supabase
    .from('tenant_memberships')
    .select('status')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .maybeSingle();

  if (memberError) throw memberError;
  if (!member) throw new Error('Thành viên không tồn tại');
  if (member.status !== 'pending') {
    throw new Error('Chỉ có thể gửi lại lời mời cho thành viên đang ở trạng thái pending');
  }
  return resetMemberPassword(tenantId, userId);
}

export async function resetMemberPassword(
  tenantId: string,
  userId: string
): Promise<{ success: boolean; action?: string; redirectTo?: string; link?: string | null }> {
  const { data, error } = await supabase.functions.invoke<{ success: boolean; action?: string; redirectTo?: string; link?: string | null; error?: string }>('reset-password', {
    body: { tenant_id: tenantId, user_id: userId },
  });
  if (error) throw error;
  if (!data || typeof data !== 'object' || !data.success) {
    throw new Error(data?.error || 'Đặt lại mật khẩu thất bại');
  }
  return { success: data.success, action: data.action, redirectTo: data.redirectTo, link: data.link };
}

export async function inviteMember(
  tenantId: string,
  userId: string,
  role: TenantRole,
  invitedBy?: string
): Promise<TenantMembership> {
  // FIX [5.5]: Add runtime validation for role
  validateRole(role);
  const { data: userData } = await supabase.auth.getUser();
  const inviterId = invitedBy ?? userData.user?.id ?? null;

  const { data, error } = await supabase
    .from('tenant_memberships')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      role,
      invited_by: inviterId,
    })
    .select()
    .single();

  if (error) throw error;
  return mapMembershipFromDB(data);
}

export async function updateMemberRole(
  tenantId: string,
  userId: string,
  role: TenantRole
): Promise<TenantMembership> {
  // FIX [3.2] + [5.5]: Use RPC with SECURITY DEFINER + runtime validation
  validateRole(role);
  const { data, error } = await supabase.rpc('update_tenant_member_role', {
    p_tenant_id: tenantId,
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw error;
  return mapMembershipFromDB(data);
}

export async function removeMember(tenantId: string, userId: string): Promise<void> {
  // FIX [3.1]: Use RPC with SECURITY DEFINER instead of direct delete
  const { error } = await supabase.rpc('remove_tenant_member', {
    p_tenant_id: tenantId,
    p_user_id: userId,
  });
  if (error) throw error;
}

// --- Subscription ---

export async function getTenantSubscription(tenantId: string): Promise<TenantSubscription | null> {
  const { data, error } = await supabase
    .from('tenant_subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapSubscriptionFromDB(data);
}

export async function getUsageSummary(tenantId: string): Promise<UsageSummary> {
  const { data, error } = await supabase.rpc('get_tenant_usage_summary', {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return normalizeRpcObject(data, mapUsageSummaryFromDB);
}

export async function updateSubscriptionLimits(
  tenantId: string,
  input: UpdateSubscriptionInput
): Promise<TenantSubscription> {
  const { data, error } = await supabase.rpc('update_tenant_subscription', {
    p_tenant_id: tenantId,
    p_plan: input.plan,
    p_max_users: input.maxUsers,
    p_max_products: input.maxProducts,
    p_max_orders_per_month: input.maxOrdersPerMonth,
    p_max_storage_gb: input.maxStorageGb ?? null,
    p_billing_status: input.billingStatus,
    p_expires_at: input.expiresAt,
  });

  if (error) throw error;
  return mapSubscriptionFromDB(data);
}

// ponytail: aliases used by the admin dashboard; reuse the same RPCs as above.
export async function getTenantUsageSummary(tenantId: string): Promise<UsageSummary> {
  const { data, error } = await supabase.rpc('get_tenant_usage_summary', {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return normalizeRpcObject(data, mapUsageSummaryFromDB);
}

export async function updateTenantSubscription(
  tenantId: string,
  input: UpdateSubscriptionInput
): Promise<TenantSubscription> {
  const { data, error } = await supabase.rpc('update_tenant_subscription', {
    p_tenant_id: tenantId,
    p_plan: input.plan,
    p_max_users: input.maxUsers,
    p_max_products: input.maxProducts,
    p_max_orders_per_month: input.maxOrdersPerMonth,
    p_max_storage_gb: input.maxStorageGb ?? null,
    p_billing_status: input.billingStatus,
    p_expires_at: input.expiresAt,
  });

  if (error) throw error;
  return mapSubscriptionFromDB(data);
}

export async function resetMonthlyOrderCounter(tenantId: string): Promise<TenantSubscription> {
  const { data, error } = await supabase.rpc('reset_monthly_order_counter', {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return mapSubscriptionFromDB(data);
}

// --- Tenant management (admin) ---

export async function getTenantsAdmin(options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: TenantStatus | 'all';
  plan?: TenantPlan | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ items: Tenant[]; total: number }> {
  const { data, error } = await supabase.rpc('get_tenants_admin', {
    p_page: options.page ?? 1,
    p_limit: options.limit ?? 20,
    p_search: options.search ?? null,
    p_status: options.status ?? 'all',
    p_plan: options.plan ?? 'all',
    p_sort_by: options.sortBy ?? 'created_at',
    p_sort_order: options.sortOrder ?? 'desc',
  });

  if (error) throw error;
  return {
    items: (data?.data ?? []).map(mapTenantFromDB),
    total: data?.total ?? 0,
  };
}

export async function searchTenants(options: {
  searchTerm?: string | null;
  status?: TenantStatus | null;
  plan?: TenantPlan | null;
  page?: number;
  pageSize?: number;
}): Promise<SearchTenantsResult> {
  const { data, error } = await supabase.rpc('search_tenants', {
    p_search_term: options.searchTerm ?? null,
    p_status: options.status ?? null,
    p_plan: options.plan ?? null,
    p_page: options.page ?? 1,
    p_page_size: options.pageSize ?? 20,
  });

  if (error) throw error;
  return {
    tenants: (data?.tenants ?? []).map(mapTenantFromDB),
    totalCount: data?.totalCount ?? 0,
    counts: {
      active: data?.counts?.active ?? 0,
      suspended: data?.counts?.suspended ?? 0,
      trial: data?.counts?.trial ?? 0,
      pending: data?.counts?.pending ?? 0,
      archived: data?.counts?.archived ?? 0,
      free: data?.counts?.free ?? 0,
      vip: data?.counts?.vip ?? 0,
    },
  };
}

export async function getMemberWithEmail(tenantId: string, userId: string): Promise<MemberWithEmail | null> {
  // ponytail: canonical get_tenant_members_with_email returns the full tenant member list;
  // filter client-side to preserve the single-member contract without adding a one-off RPC.
  const { data, error } = await supabase.rpc('get_tenant_members_with_email', {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  if (!data) return null;
  const row = (data as any[]).find((m: any) => m.user_id === userId);
  if (!row) return null;
  return {
    ...mapMembershipFromDB(row),
    email: row.email,
    invitedByEmail: row.invited_by_email,
    invitedAt: row.invited_at,
    acceptedAt: row.accepted_at,
    lastSignInAt: row.last_sign_in_at,
    confirmedAt: row.confirmed_at,
    isOwner: row.is_owner ?? false,
  };
}

export async function searchMembers(params: SearchMembersParams): Promise<SearchMembersResult> {
  const { data, error } = await supabase.rpc('search_tenant_members', {
    p_tenant_id: params.tenantId,
    p_search: params.search ?? null,
    p_role: params.role ?? null,
    p_status: params.status ?? null,
    p_is_active: params.isActive ?? null,
    p_sort_by: params.sortBy ?? 'created_at',
    p_sort_dir: params.sortDir ?? 'desc',
    p_page: params.page ?? 1,
    p_page_size: params.pageSize ?? 20,
  });

  if (error) throw error;
  return {
    members: (data?.items ?? []).map(mapMembershipFromDB),
    totalCount: data?.total_count ?? 0,
  };
}

export async function searchTenantMembers(params: SearchMembersParams): Promise<SearchMembersResult> {
  const { data, error } = await supabase.rpc('search_tenant_members', {
    p_tenant_id: params.tenantId,
    p_search: params.search ?? null,
    p_role: params.role ?? null,
    p_status: params.status ?? null,
    p_is_active: params.isActive ?? null,
    p_sort_by: params.sortBy ?? 'created_at',
    p_sort_dir: params.sortDir ?? 'desc',
    p_page: params.page ?? 1,
    p_page_size: params.pageSize ?? 20,
  });

  if (error) throw error;
  return {
    members: (data?.items ?? []).map((row: any) => ({
      ...mapMembershipFromDB(row),
      invitedByEmail: row.invited_by_email,
      invitedAt: row.invited_at,
      acceptedAt: row.accepted_at,
      lastSignInAt: row.last_sign_in_at,
      confirmedAt: row.confirmed_at,
      isOwner: row.is_owner ?? false,
    })),
    totalCount: data?.total_count ?? 0,
  };
}

// --- Feature flags ---

export async function getTenantFeatureFlags(tenantId: string): Promise<TenantFeatureFlags> {
  const { data, error } = await supabase.rpc('get_tenant_feature_flags', {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return { ...DEFAULT_TENANT_FEATURE_FLAGS, ...(data || {}) };
}

export async function updateTenantFeatureFlags(
  tenantId: string,
  flags: Partial<TenantFeatureFlags>
): Promise<TenantFeatureFlags> {
  const { data, error } = await supabase.rpc('update_tenant_feature_flags', {
    p_tenant_id: tenantId,
    p_features: flags,
  });
  if (error) throw error;
  return { ...DEFAULT_TENANT_FEATURE_FLAGS, ...(data || {}) };
}

// --- Admin helpers (requires system admin privileges) ---

export async function createTenantWithAdmin(input: {
  name: string;
  subdomain: string;
  plan?: TenantPlan;
  ownerId?: string;
}): Promise<Tenant> {
  const { data, error } = await supabase.rpc('create_tenant_with_admin', {
    p_name: input.name,
    p_subdomain: input.subdomain,
    p_plan: input.plan ?? 'free',
    p_owner_user_id: input.ownerId ?? null,
  });

  if (error) throw error;
  return mapTenantFromDB(data);
}

export async function createTenant(input: {
  name: string;
  subdomain: string;
  plan?: Tenant['plan'];
  ownerId?: string;
}): Promise<Tenant> {
  // FIX [3.5]: Add auth guard before direct insert
  const { data: isAdmin } = await supabase.rpc('is_system_admin');
  if (!isAdmin) {
    throw new Error('Chỉ system admin mới được tạo tenant');
  }
  
  const { data, error } = await supabase
    .from('tenants')
    .insert({
      name: input.name,
      subdomain: input.subdomain,
      plan: input.plan ?? 'free',
      owner_id: input.ownerId ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapTenantFromDB(data);
}

export async function createTenantSubscription(tenantId: string): Promise<TenantSubscription> {
  const { data, error } = await supabase
    .from('tenant_subscriptions')
    .insert({ tenant_id: tenantId })
    .select()
    .single();

  if (error) throw error;
  return mapSubscriptionFromDB(data);
}

export async function deleteTenant(tenantId: string): Promise<void> {
  const { error } = await supabase.from('tenants').delete().eq('id', tenantId);
  if (error) throw error;
}

export async function hardDeleteTenant(tenantId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>(
    'delete-tenant',
    {
      body: { tenant_id: tenantId, force: true },
    }
  );

  if (error) throw error;
  if (!data || typeof data !== 'object' || !data.success) {
    throw new Error(data?.error || 'Xóa cửa hàng thất bại');
  }
}

export async function softDeleteTenant(tenantId: string): Promise<Tenant> {
  const { data, error } = await supabase.rpc('delete_tenant_safe', {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return mapTenantFromDB(data);
}

export async function restoreTenant(tenantId: string): Promise<Tenant> {
  const { data, error } = await supabase.rpc('update_tenant', {
    p_tenant_id: tenantId,
    p_status: 'active',
  });
  if (error) throw error;
  return mapTenantFromDB(data);
}

export async function createTenantWithCredentials(input: {
  name: string;
  subdomain: string;
  plan?: TenantPlan;
  adminEmail: string;
}): Promise<CreateTenantResult> {
  const { data, error } = await supabase.functions.invoke<{
    tenant?: Record<string, unknown>;
    adminUser?: { id?: string; email?: string };
    resetEmailSent?: boolean;
    redirectTo?: string;
    error?: string;
  }>('create-tenant', {
    body: {
      name: input.name,
      subdomain: input.subdomain,
      email: input.adminEmail,
      plan: input.plan ?? 'free',
    },
  });

  if (error) throw new Error(error.message || 'Tạo cửa hàng thất bại');
  if (!data || typeof data !== 'object') {
    throw new Error('Phản hồi tạo cửa hàng không hợp lệ');
  }
  if (data.error) throw new Error(data.error);
  if (!data.tenant || !data.adminUser || typeof data.resetEmailSent !== 'boolean') {
    throw new Error('Phản hồi tạo cửa hàng không hợp lệ');
  }
  if (!data.adminUser.id || !data.adminUser.email) {
    throw new Error('Phản hồi tạo cửa hàng không hợp lệ');
  }

  return {
    tenant: mapTenantFromDB(data.tenant),
    adminUser: { id: data.adminUser.id, email: data.adminUser.email },
    resetEmailSent: data.resetEmailSent,
    redirectTo: data.redirectTo,
  };
}

export async function getTenantCredentials(tenantIds: string[]): Promise<Record<string, TenantCredentials>> {
  if (tenantIds.length === 0) return {};
  const { data, error } = await supabase
    .from('tenant_credentials')
    .select('tenant_id, admin_email')
    .in('tenant_id', tenantIds);

  if (error) throw error;

  const map: Record<string, TenantCredentials> = {};
  (data ?? []).forEach((row: any) => {
    map[row.tenant_id] = {
      tenantId: row.tenant_id,
      adminEmail: row.admin_email,
    };
  });
  return map;
}

// --- System analytics (requires system admin privileges) ---

const mapSystemOverviewFromDB = (row: any): SystemOverview => ({
  totalTenants: row.totalTenants ?? 0,
  activeTenants: row.activeTenants ?? 0,
  trialTenants: row.trialTenants ?? 0,
  vipTenants: row.vipTenants ?? 0,
  expiringSoon: row.expiringSoon ?? 0,
  nearLimit: row.nearLimit ?? 0,
  newThisMonth: row.newThisMonth ?? 0,
  expiringTenants: (row.expiringTenants ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    subdomain: t.subdomain,
    expiresAt: t.expires_at,
    daysRemaining: t.days_remaining,
  })),
  nearLimitTenants: (row.nearLimitTenants ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    subdomain: t.subdomain,
    userPercent: t.user_percent ?? 0,
    productPercent: t.product_percent ?? 0,
    orderPercent: t.order_percent ?? 0,
  })),
});

export async function getSystemOverview(): Promise<SystemOverview> {
  const { data, error } = await supabase.rpc('get_system_overview');
  if (error) throw error;
  return mapSystemOverviewFromDB(data);
}

export async function getTopTenants(options: {
  limit?: number;
  offset?: number;
} = {}): Promise<{ data: TopTenant[]; count: number }> {
  const { data, error } = await supabase.rpc('get_top_tenants', {
    p_limit: options.limit ?? 10,
    p_offset: options.offset ?? 0,
  });
  if (error) throw error;
  return normalizeRpcPaginated(data, mapTopTenantFromDB);
}

export async function getTenantGrowth(options: {
  months?: number;
} = {}): Promise<TenantGrowthPoint[]> {
  const { data, error } = await supabase.rpc('get_tenant_growth', {
    p_months: options.months ?? 12,
  });
  if (error) throw error;
  return normalizeRpcArray(data, mapTenantGrowthPointFromDB);
}

// --- Tenant CRUD for regular flow ---

export async function getAllTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapTenantFromDB);
}

export async function getTenant(id: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapTenantFromDB(data);
}

// FIX [6.6]: Exclude archived tenants from subdomain lookup
export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('subdomain', subdomain)
    .not('status', 'eq', 'archived')
    .maybeSingle();

  if (error) throw error;
  return data ? mapTenantFromDB(data) : null;
}

// ponytail: aliases for callers using the older naming convention.
export const getTenantById = getTenant;

export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('custom_domain', domain.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return data ? mapTenantFromDB(data) : null;
}

export async function getCurrentUserTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase.rpc('get_current_user_tenants');
  if (error) throw error;
  return (data ?? []).map(mapTenantFromDB);
}

export async function updateTenant(
  id: string,
  updates: Partial<Pick<Tenant, 'name' | 'plan' | 'status' | 'isolationMode' | 'isolationSchema' | 'isolationProjectRef' | 'customDomain' | 'whiteLabel' | 'readReplicaUrl' | 'connectionPoolConfig' | 'settings'>>
): Promise<Tenant> {
  const { data, error } = await supabase.rpc('update_tenant', {
    p_tenant_id: id,
    p_name: updates.name ?? null,
    p_plan: updates.plan ?? null,
    p_status: updates.status ?? null,
    p_isolation_mode: updates.isolationMode ?? null,
    p_isolation_schema: updates.isolationSchema ?? null,
    p_isolation_project_ref: updates.isolationProjectRef ?? null,
    p_custom_domain: updates.customDomain ?? null,
    p_white_label: updates.whiteLabel ?? null,
    p_read_replica_url: updates.readReplicaUrl ?? null,
    p_connection_pool_config: updates.connectionPoolConfig ?? null,
  });

  if (error) throw error;
  return mapTenantFromDB(data);
}

export async function getMembers(tenantId: string): Promise<TenantMembership[]> {
  const { data, error } = await supabase
    .from('tenant_memberships')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error) throw error;
  return (data ?? []).map(mapMembershipFromDB);
}

// ponytail: aliases for callers using the older naming convention.
export const getTenantMembers = getMembers;

export async function getMembership(tenantId: string, userId: string): Promise<TenantMembership | null> {
  const { data, error } = await supabase
    .from('tenant_memberships')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapMembershipFromDB(data) : null;
}

export async function getTenantMembersWithEmail(tenantId: string): Promise<MemberWithEmail[]> {
  const { data, error } = await supabase.rpc('get_tenant_members_with_email', {
    p_tenant_id: tenantId,
  });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    ...mapMembershipFromDB(row),
    email: row.email,
    invitedByEmail: row.invited_by_email,
    invitedAt: row.invited_at,
    acceptedAt: row.accepted_at,
    lastSignInAt: row.last_sign_in_at,
    confirmedAt: row.confirmed_at,
    isOwner: row.is_owner ?? false,
  }));
}

export async function getStorageUsage(tenantId: string): Promise<StorageUsage> {
  const { data, error } = await supabase.rpc('get_storage_usage', {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return normalizeRpcObject(data, mapStorageUsageFromDB);
}

export async function getTenantStorageUsage(): Promise<StorageUsage> {
  const { data, error } = await supabase.rpc('get_storage_usage', {
    p_tenant_id: null,
  });
  if (error) throw error;
  return normalizeRpcObject(data, mapStorageUsageFromDB);
}

// --- Impersonation (system admin) ---

export async function startImpersonation(tenantId: string): Promise<{
  success: boolean;
  tenant: Tenant;
  expires_at: string;
}> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean;
    tenant: Record<string, unknown>;
    expires_at: string;
    error?: string;
  }>('impersonate-tenant', {
    body: { tenant_id: tenantId },
  });
  if (error) throw error;
  if (!data || typeof data !== 'object' || !data.success) {
    throw new Error(data?.error || 'Impersonate tenant thất bại');
  }
  return { success: data.success, tenant: mapTenantFromDB(data.tenant), expires_at: data.expires_at };
}

export async function endImpersonation(): Promise<{
  success: boolean;
  ended: number;
}> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean;
    ended: number;
    error?: string;
  }>('end-impersonation', {
    body: {},
  });
  if (error) throw error;
  if (!data || typeof data !== 'object' || !data.success) {
    throw new Error(data?.error || 'Kết thúc impersonate thất bại');
  }
  return { success: data.success, ended: data.ended };
}

export type { TenantMembership };
