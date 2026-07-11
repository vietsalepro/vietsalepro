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
  UpdateSubscriptionInput,
  SystemOverview,
  TopTenant,
  TenantGrowthPoint,
  TenantFeatureFlags,
  DEFAULT_TENANT_FEATURE_FLAGS,
  StorageUsage,
  CreateTenantResult,
  SearchMembersParams,
  SearchMembersResult,
} from '../types/tenant';

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
  billingStatus: row.billing_status,
  maxUsers: row.max_users,
  maxProducts: row.max_products,
  maxOrdersPerMonth: row.max_orders_per_month,
  maxStorageGb: row.max_storage_gb,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  currentMonthStart: row.current_month_start,
  currentMonthOrders: row.current_month_orders,
  updatedAt: row.updated_at,
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

const VALID_ROLES = new Set(['admin', 'cashier', 'inventory_manager', 'accountant']);

function validateRole(role: string): asserts role is TenantRole {
  if (!VALID_ROLES.has(role)) {
    throw new Error(`Vai trò không hợp lệ: "${role}". Chỉ chấp nhận: ${Array.from(VALID_ROLES).join(', ')}`);
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
  return data;
}

export async function updateSubscriptionLimits(
  tenantId: string,
  input: UpdateSubscriptionInput
): Promise<TenantSubscription> {
  const { data, error } = await supabase.rpc('admin_update_subscription', {
    p_tenant_id: tenantId,
    p_plan: input.plan,
    p_max_users: input.maxUsers,
    p_max_products: input.maxProducts,
    p_max_orders_per_month: input.maxOrdersPerMonth,
    p_max_storage_gb: input.maxStorageGb,
    p_billing_status: input.billingStatus,
    p_expires_at: input.expiresAt,
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

export async function getMemberWithEmail(tenantId: string, userId: string): Promise<MemberWithEmail | null> {
  const { data, error } = await supabase.rpc('get_member_with_email', {
    p_tenant_id: tenantId,
    p_user_id: userId,
  });
  if (error) throw error;
  return data ? { ...data, role: data.role as TenantRole, status: data.status } : null;
}

export async function searchMembers(params: SearchMembersParams): Promise<SearchMembersResult> {
  const { data, error } = await supabase.rpc('search_members_by_email', {
    p_tenant_id: params.tenantId,
    p_query: params.query ?? '',
    p_page: params.page ?? 1,
    p_limit: params.limit ?? 20,
    p_role_filter: params.roleFilter ?? 'all',
    p_status_filter: params.statusFilter ?? 'all',
  });

  if (error) throw error;
  return {
    members: (data?.members ?? []).map(mapMembershipFromDB),
    total: data?.total ?? 0,
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
      body: { tenant_id: tenantId },
    }
  );

  if (error) throw error;
  if (!data || typeof data !== 'object' || !data.success) {
    throw new Error(data?.error || 'Xóa cửa hàng thất bại');
  }
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
  return { data: data?.data ?? [], count: data?.count ?? 0 };
}

export async function getTenantGrowth(options: {
  months?: number;
} = {}): Promise<TenantGrowthPoint[]> {
  const { data, error } = await supabase.rpc('get_tenant_growth', {
    p_months: options.months ?? 12,
  });
  if (error) throw error;
  return data ?? [];
}

// --- Tenant CRUD for regular flow ---

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

export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('subdomain', subdomain)
    .maybeSingle();

  if (error) throw error;
  return data ? mapTenantFromDB(data) : null;
}

export async function updateTenant(id: string, updates: Partial<Pick<Tenant, 'name' | 'settings'>>): Promise<Tenant> {
  const { data, error } = await supabase
    .from('tenants')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

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

export async function getStorageUsage(tenantId: string): Promise<StorageUsage> {
  const { data, error } = await supabase.rpc('get_storage_usage', {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return data;
}

export type { TenantMembership };