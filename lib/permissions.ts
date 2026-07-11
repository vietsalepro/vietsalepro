import { supabase } from './supabase';
import { TenantRbacRole as Role, TenantPermission as Permission } from '../types/tenant';

// ============================================================
// Role constants aligned with the database tenant_memberships role enum
// ============================================================

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  CASHIER: 'cashier',
  INVENTORY_MANAGER: 'inventory_manager',
  ACCOUNTANT: 'accountant',
  VIEWER: 'viewer',
  SYSTEM_ADMIN: 'system_admin',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

// Roles that can view tenant-scoped data.
export const MEMBER_ROLES: readonly string[] = [
  ROLES.OWNER,
  ROLES.ADMIN,
  ROLES.CASHIER,
  ROLES.INVENTORY_MANAGER,
  ROLES.ACCOUNTANT,
  ROLES.VIEWER,
];

// Roles that can mutate tenant/membership data.
export const ADMIN_ROLES: readonly string[] = [ROLES.OWNER, ROLES.ADMIN];

// ============================================================
// Sub-Phase 5.1: Basejump RBAC matrix
// Higher roles inherit all permissions from lower roles.
// ============================================================

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    'tenant.view', 'tenant.update', 'tenant.delete',
    'billing.view', 'billing.manage',
    'members.view', 'members.invite', 'members.remove', 'members.change_role',
    'settings.view', 'settings.update',
    'audit.view',
    'analytics.view',
  ],
  admin: [
    'tenant.view', 'tenant.update',
    'billing.view', 'billing.manage',
    'members.view', 'members.invite', 'members.remove',
    'settings.view', 'settings.update',
    'audit.view',
    'analytics.view',
  ],
  member: ['tenant.view', 'members.view', 'settings.view', 'analytics.view'],
  viewer: ['tenant.view', 'members.view', 'settings.view', 'analytics.view'],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canManageRole(actorRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

// ============================================================
// Pure role helpers (work in browser and edge function contexts)
// ============================================================

export function isMemberRole(role: string): boolean {
  return MEMBER_ROLES.includes(role);
}

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role);
}

export function isOwnerRole(role: string): boolean {
  return role === ROLES.OWNER;
}

export function canManageTenant(role: string): boolean {
  return isAdminRole(role);
}

export function canInviteMember(role: string): boolean {
  return isAdminRole(role);
}

export function canUpdateMember(role: string): boolean {
  return isAdminRole(role);
}

export function canDeleteMember(role: string): boolean {
  return isAdminRole(role);
}

export function canDeleteTenant(role: string): boolean {
  return isOwnerRole(role);
}

export function canUpdateTenant(role: string): boolean {
  return isAdminRole(role);
}

export function canManageSubscription(role: string): boolean {
  return isAdminRole(role);
}

// ============================================================
// Async helpers for the current authenticated user
// Ceiling: client-side checks are UX guards only; real authorization lives in RLS / edge functions.
// ============================================================

export async function isSystemAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_system_admin');
  if (error) {
    // ponytail: fail closed on permission check errors.
    return false;
  }
  return !!data;
}

export async function requireSystemAdmin(): Promise<void> {
  const allowed = await isSystemAdmin();
  if (!allowed) {
    throw new Error('Chỉ system admin mới được thực hiện thao tác này.');
  }
}

export async function hasTenantRole(
  tenantId: string,
  role: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_tenant_role', {
    p_tenant_id: tenantId,
    p_role: role,
  });
  if (error) return false;
  return !!data;
}

export async function isTenantOwner(tenantId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_tenant_owner', {
    p_tenant_id: tenantId,
  });
  if (error) return false;
  return !!data;
}

export async function isTenantAdmin(tenantId: string): Promise<boolean> {
  return (
    (await hasTenantRole(tenantId, ROLES.ADMIN)) ||
    (await isTenantOwner(tenantId))
  );
}

export async function canCurrentUserManageTenant(
  tenantId: string
): Promise<boolean> {
  return isTenantAdmin(tenantId);
}

export async function canCurrentUserInviteMember(
  tenantId: string
): Promise<boolean> {
  return isTenantAdmin(tenantId);
}

export async function canCurrentUserDeleteTenant(
  tenantId: string
): Promise<boolean> {
  return isTenantOwner(tenantId) || isSystemAdmin();
}

export async function canCurrentUserDeleteMember(
  tenantId: string
): Promise<boolean> {
  return isTenantAdmin(tenantId);
}

export async function getCurrentUserTenantRole(
  tenantId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('tenant_memberships')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();
  if (error || !data) return null;
  return data.role;
}

// ============================================================
// Feature gating helper
// Basejump reference: Section 3.7 (can_use_feature)
// ponytail: fails closed on RPC errors; defaults to allow when no gating row exists (handled by DB).
// ============================================================

export async function canUseFeature(
  tenantId: string,
  featureKey: string,
  currentUsage = 0
): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_use_feature', {
    p_tenant_id: tenantId,
    p_feature_key: featureKey,
    p_current_usage: currentUsage,
  });
  if (error) {
    // ponytail: fail closed on permission-check errors.
    return false;
  }
  return !!data;
}
