import { supabase } from '../lib/supabase';
import {
  Tenant,
  TenantMembership,
  TenantRole,
  TenantSubscription,
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

export async function updateTenantStatus(tenantId: string, status: Tenant['status']): Promise<Tenant> {
  const { data, error } = await supabase.rpc('update_tenant_status', {
    p_tenant_id: tenantId,
    p_status: status,
  });
  if (error) throw error;
  return mapTenantFromDB(data);
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
