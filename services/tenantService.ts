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
} from '../types/tenant';

// --- Mappers ---

const mapTenantFromDB = (row: any): Tenant => ({
  id: row.id,
  name: row.name,
  subdomain: row.subdomain,
  status: row.status,
  plan: row.plan,
  ownerId: row.owner_id,
  settings: row.settings || {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  archivedAt: row.archived_at,
});

const mapMembershipFromDB = (row: any): TenantMembership => ({
  id: row.id,
  tenantId: row.tenant_id,
  userId: row.user_id,
  role: row.role,
  invitedBy: row.invited_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapSubscriptionFromDB = (row: any): TenantSubscription => ({
  tenantId: row.tenant_id,
  plan: row.plan,
  maxUsers: row.max_users,
  maxProducts: row.max_products,
  maxOrdersPerMonth: row.max_orders_per_month,
  currentMonthOrders: row.current_month_orders,
  currentMonthStart: row.current_month_start,
  billingStatus: row.billing_status,
  expiresAt: row.expires_at,
  updatedAt: row.updated_at,
});

export interface SearchTenantsParams {
  searchTerm?: string;
  status?: TenantStatus | null;
  plan?: TenantPlan | null;
  page?: number;
  pageSize?: number;
}

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

// --- Tenant read ---

export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('subdomain', subdomain)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? mapTenantFromDB(data) : null;
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const { data, error } = await supabase.from('tenants').select('*').eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? mapTenantFromDB(data) : null;
}

export async function getCurrentUserTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase.from('tenant_memberships').select('tenant_id (*)');
  if (error) throw error;
  return (data || []).map((row: any) => mapTenantFromDB(row.tenant_id));
}

// --- System admin (requires system_admin privileges) ---

export async function getAllTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapTenantFromDB);
}

export async function createTenantWithAdmin(input: {
  name: string;
  subdomain: string;
  plan?: Tenant['plan'];
  ownerId?: string | null;
}): Promise<Tenant> {
  const { data, error } = await supabase.rpc('create_tenant_with_admin', {
    p_name: input.name,
    p_subdomain: input.subdomain,
    p_plan: input.plan ?? 'free',
    p_owner_user_id: input.ownerId,
  });
  if (error) throw error;
  return mapTenantFromDB(data);
}

export async function updateTenantStatus(tenantId: string, status: Tenant['status']): Promise<Tenant> {
  const { data, error } = await supabase.rpc('update_tenant_status', {
    p_tenant_id: tenantId,
    p_status: status,
  });
  if (error) throw error;
  return mapTenantFromDB(data);
}

export async function searchTenants(params: SearchTenantsParams = {}): Promise<SearchTenantsResult> {
  const { data, error } = await supabase.rpc('search_tenants', {
    p_search_term: params.searchTerm || null,
    p_status: params.status || null,
    p_plan: params.plan || null,
    p_page: params.page ?? 1,
    p_page_size: params.pageSize ?? 20,
  });
  if (error) throw error;
  const result = data as {
    tenants: any[];
    totalCount: number;
    counts: SearchTenantsResult['counts'];
  };
  return {
    tenants: (result.tenants || []).map(mapTenantFromDB),
    totalCount: result.totalCount || 0,
    counts: result.counts || {
      active: 0, suspended: 0, trial: 0, pending: 0, archived: 0, free: 0, vip: 0,
    },
  };
}

export async function updateTenant(
  tenantId: string,
  input: Partial<Pick<Tenant, 'name' | 'plan' | 'status'>>
): Promise<Tenant> {
  const { data, error } = await supabase.rpc('update_tenant', {
    p_tenant_id: tenantId,
    p_name: input.name ?? null,
    p_plan: input.plan ?? null,
    p_status: input.status ?? null,
  });
  if (error) throw error;
  return mapTenantFromDB(data);
}

export async function softDeleteTenant(tenantId: string): Promise<Tenant> {
  const { data, error } = await supabase.rpc('delete_tenant_safe', { p_tenant_id: tenantId });
  if (error) throw error;
  return mapTenantFromDB(data);
}

export async function restoreTenant(tenantId: string): Promise<Tenant> {
  return updateTenantStatus(tenantId, 'active');
}

// --- Membership ---

export async function getMembership(tenantId: string, userId?: string): Promise<TenantMembership | null> {
  let query = supabase.from('tenant_memberships').select('*').eq('tenant_id', tenantId);
  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    const { data: userData } = await supabase.auth.getUser();
    query = query.eq('user_id', userData.user?.id ?? '');
  }

  const { data, error } = await query.single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? mapMembershipFromDB(data) : null;
}

export async function getTenantMembers(tenantId: string): Promise<TenantMembership[]> {
  const { data, error } = await supabase
    .from('tenant_memberships')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error) throw error;
  return (data || []).map(mapMembershipFromDB);
}

const mapMemberWithEmailFromDB = (row: any): MemberWithEmail => ({
  ...mapMembershipFromDB(row),
  email: row.email,
  invitedByEmail: row.invited_by_email,
});

export async function getTenantMembersWithEmail(tenantId: string): Promise<MemberWithEmail[]> {
  const { data, error } = await supabase.rpc('get_tenant_members_with_email', { p_tenant_id: tenantId });
  if (error) throw error;
  return (data || []).map(mapMemberWithEmailFromDB);
}


export async function inviteMemberByEmail(
  tenantId: string,
  email: string,
  role: TenantRole
): Promise<{ success: boolean; message?: string }> {
  const { data, error } = await (supabase as any).functions.invoke('invite-member', {
    body: { tenant_id: tenantId, email, role },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return { success: true, ...data };
}

export async function resetMemberPassword(
  tenantId: string,
  userId: string
): Promise<{ success: boolean; action?: string; redirectTo?: string; link?: string | null }> {
  const { data, error } = await (supabase as any).functions.invoke('reset-password', {
    body: { tenant_id: tenantId, user_id: userId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return { success: true, ...data };
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
  const { data, error } = await supabase
    .from('tenant_memberships')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapMembershipFromDB(data);
}

export async function removeMember(tenantId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('tenant_memberships')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('user_id', userId);

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
  return data ? mapSubscriptionFromDB(data) : null;
}

const mapUsageSummaryFromDB = (row: any): UsageSummary => ({
  tenantId: row.tenantId,
  plan: row.plan,
  billingStatus: row.billingStatus,
  expiresAt: row.expiresAt,
  users: row.users || { current: 0, max: 0, percent: 0 },
  products: row.products || { current: 0, max: 0, percent: 0 },
  orders: row.orders || { current: 0, max: 0, percent: 0, monthStart: '' },
});

export async function getTenantUsageSummary(tenantId: string): Promise<UsageSummary> {
  const { data, error } = await supabase.rpc('get_tenant_usage_summary', { p_tenant_id: tenantId });
  if (error) throw error;
  return mapUsageSummaryFromDB(data);
}

export async function updateTenantSubscription(
  tenantId: string,
  input: UpdateSubscriptionInput
): Promise<TenantSubscription> {
  const { data, error } = await supabase.rpc('update_tenant_subscription', {
    p_tenant_id: tenantId,
    p_plan: input.plan ?? null,
    p_max_users: input.maxUsers ?? null,
    p_max_products: input.maxProducts ?? null,
    p_max_orders_per_month: input.maxOrdersPerMonth ?? null,
    p_billing_status: input.billingStatus ?? null,
    p_expires_at: input.expiresAt ?? null,
  });
  if (error) throw error;
  return mapSubscriptionFromDB(data);
}

export async function resetMonthlyOrderCounter(tenantId: string): Promise<TenantSubscription> {
  const { data, error } = await supabase.rpc('reset_monthly_order_counter', { p_tenant_id: tenantId });
  if (error) throw error;
  return mapSubscriptionFromDB(data);
}

// --- Feature flags (P8.2) stored in tenants.settings->features ---

export async function getTenantFeatureFlags(tenantId: string): Promise<TenantFeatureFlags> {
  const { data, error } = await supabase.rpc('get_tenant_feature_flags', { p_tenant_id: tenantId });
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

const mapTopTenantFromDB = (row: any): TopTenant => ({
  id: row.id,
  name: row.name,
  subdomain: row.subdomain,
  status: row.status,
  plan: row.plan,
  createdAt: row.created_at,
  ordersThisMonth: row.orders_this_month ?? 0,
  userCount: row.user_count ?? 0,
  productCount: row.product_count ?? 0,
});

export async function getTopTenants(limit = 10): Promise<TopTenant[]> {
  const { data, error } = await supabase.rpc('get_top_tenants', { p_limit: limit });
  if (error) throw error;
  return (data || []).map(mapTopTenantFromDB);
}

export async function getTenantGrowth(months = 6): Promise<TenantGrowthPoint[]> {
  const { data, error } = await supabase.rpc('get_tenant_growth', { p_months: months });
  if (error) throw error;
  return (data || []).map((row: any) => ({ month: row.month, count: row.count ?? 0 }));
}
