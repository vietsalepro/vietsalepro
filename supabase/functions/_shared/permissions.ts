// Permission helpers for Supabase Edge Functions.
// Mirrors the role constants and logic in lib/permissions.ts but uses the service role client
// so edge functions can authorize requests before bypassing RLS.

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  CASHIER: 'cashier',
  INVENTORY_MANAGER: 'inventory_manager',
  ACCOUNTANT: 'accountant',
  VIEWER: 'viewer',
  SYSTEM_ADMIN: 'system_admin',
} as const;

export const MEMBER_ROLES = [
  ROLES.OWNER,
  ROLES.ADMIN,
  ROLES.CASHIER,
  ROLES.INVENTORY_MANAGER,
  ROLES.ACCOUNTANT,
  ROLES.VIEWER,
] as const;

export const ADMIN_ROLES = [ROLES.OWNER, ROLES.ADMIN] as const;

export async function checkIsSystemAdmin(
  client: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await client
    .from('system_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function checkHasTenantRole(
  client: SupabaseClient,
  tenantId: string,
  userId: string,
  role: string
): Promise<boolean> {
  const { data, error } = await client
    .from('tenant_memberships')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function checkIsTenantOwner(
  client: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<boolean> {
  const isRoleOwner = await checkHasTenantRole(client, tenantId, userId, ROLES.OWNER);
  if (isRoleOwner) return true;
  const { data, error } = await client
    .from('tenants')
    .select('id')
    .eq('id', tenantId)
    .eq('owner_id', userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function checkIsTenantAdmin(
  client: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<boolean> {
  const isAdmin = await checkHasTenantRole(client, tenantId, userId, ROLES.ADMIN);
  if (isAdmin) return true;
  return checkIsTenantOwner(client, tenantId, userId);
}

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number]);
}

export function isMemberRole(role: string): boolean {
  return MEMBER_ROLES.includes(role as typeof MEMBER_ROLES[number]);
}

export function isOwnerRole(role: string): boolean {
  return role === ROLES.OWNER;
}
