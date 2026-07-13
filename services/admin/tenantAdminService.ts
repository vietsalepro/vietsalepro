import { supabase } from '../../lib/supabase';
import { Tenant, TenantStatus, TenantRole, TenantMembership } from '../../types/tenant';
import {
  normalizeSubdomain,
  isValidSubdomainFormat,
} from '../../utils/subdomain';
import {
  isValidDomain as isValidCustomDomain,
} from '../../supabase/functions/_shared/domain-verification';
import {
  mapTenantFromDB,
  getAllTenants as getAllTenantsBase,
  searchTenants as searchTenantsBase,
  updateTenant as updateTenantBase,
  softDeleteTenant as softDeleteTenantBase,
  restoreTenant,
  getCurrentUserTenants as getCurrentUserTenantsBase,
  createTenantWithAdmin as createTenantWithAdminBase,
} from '../tenantService';

// ponytail: thin admin wrapper around existing tenantService.
// Phase 2 will consolidate all admin queries behind RPC/security definer.

export interface AccountWithRole {
  account: Tenant;
  role: TenantRole;
  status?: 'pending' | 'active' | 'inactive';
}

export interface ListAccountsOptions {
  search?: string;
  status?: TenantStatus | null;
  plan?: string | null;
  page?: number;
  pageSize?: number;
}

export interface ListAccountsResult {
  accounts: Tenant[];
  totalCount: number;
}

export async function listAccounts(options: ListAccountsOptions = {}): Promise<ListAccountsResult> {
  const { search, status, plan, page = 1, pageSize = 20 } = options;

  // ponytail: reuse existing search when filters are present; otherwise fetch all.
  if (search || status || plan) {
    const result = await searchTenantsBase({
      searchTerm: search,
      status: status ?? null,
      plan: plan ?? null,
      page,
      pageSize,
    });
    return { accounts: result.tenants, totalCount: result.totalCount };
  }

  const accounts = await getAllTenantsBase();
  return { accounts, totalCount: accounts.length };
}

export async function getAccount(id: string): Promise<Tenant | null> {
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

export async function updateAccountStatus(id: string, status: TenantStatus): Promise<Tenant> {
  return updateTenantBase(id, { status });
}

export async function deleteAccount(id: string): Promise<Tenant> {
  return softDeleteTenantBase(id);
}

export async function getUserAccounts(userId: string): Promise<AccountWithRole[]> {
  // ponytail: prefer joined query to avoid N+1; fallback to existing helper if userId is current user.
  if (userId === (await supabase.auth.getUser()).data.user?.id) {
    const accounts = await getCurrentUserTenantsBase();
    return accounts.map((account) => ({ account, role: 'admin' as TenantRole }));
  }

  const { data, error } = await supabase
    .from('tenant_memberships')
    .select('role, status, tenants (*)')
    .eq('user_id', userId);

  if (error) throw error;

  return (data || [])
    .filter((row: any) => row.tenants)
    .map((row: any) => ({
      account: mapTenantFromDB(row.tenants),
      role: row.role as TenantRole,
      status: row.status as AccountWithRole['status'],
    }));
}

export async function getAccountMembers(accountId: string): Promise<TenantMembership[]> {
  const { data, error } = await supabase
    .from('tenant_memberships')
    .select('*')
    .eq('tenant_id', accountId);

  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function setAccountActive(id: string, isActive: boolean): Promise<Tenant> {
  return updateTenantBase(id, { status: isActive ? 'active' : 'suspended' });
}

export async function createAccount(input: {
  name: string;
  subdomain: string;
  plan?: string;
  ownerId?: string;
}): Promise<Tenant> {
  return createTenantWithAdminBase(input);
}

export interface SubdomainAvailabilityResult {
  available: boolean;
  error?: string;
}

export async function checkSubdomainAvailability(subdomain: string): Promise<SubdomainAvailabilityResult> {
  const s = normalizeSubdomain(subdomain);
  if (!isValidSubdomainFormat(s)) {
    return { available: false, error: 'Subdomain không hợp lệ hoặc thuộc danh sách dự trữ.' };
  }

  const { data, error } = await supabase.functions.invoke<{ available: boolean; error?: string }>('check-subdomain', {
    body: { subdomain: s },
  });

  if (error) throw error;
  if (!data || typeof data !== 'object' || typeof data.available !== 'boolean') {
    throw new Error(data?.error || 'Phản hồi kiểm tra subdomain không hợp lệ');
  }

  return { available: data.available, error: data.error };
}

export async function setTenantSubdomain(tenantId: string, subdomain: string): Promise<Tenant> {
  const s = normalizeSubdomain(subdomain);
  if (!isValidSubdomainFormat(s)) {
    throw new Error('Subdomain không hợp lệ hoặc thuộc danh sách dự trữ.');
  }

  const { data, error } = await supabase.rpc('set_tenant_subdomain', {
    p_tenant_id: tenantId,
    p_subdomain: s,
  });

  if (error) throw error;
  return mapTenantFromDB(data);
}

export interface CustomDomainVerificationRequest {
  token: string;
  txtRecord: string;
}

export interface CustomDomainVerificationResult {
  verified: boolean;
  message?: string;
}

export { isValidCustomDomain };

export async function requestCustomDomainVerification(
  tenantId: string
): Promise<CustomDomainVerificationRequest> {
  const { data, error } = await supabase.functions.invoke<{ token: string; txtRecord: string; error?: string }>(
    'verify-domain',
    { body: { tenant_id: tenantId, action: 'token' } }
  );

  if (error) throw error;
  if (!data || data.error || typeof data.token !== 'string' || typeof data.txtRecord !== 'string') {
    throw new Error(data?.error || 'Phản hồi yêu cầu token không hợp lệ');
  }

  return { token: data.token, txtRecord: data.txtRecord };
}

export async function verifyCustomDomain(
  tenantId: string,
  domain: string
): Promise<CustomDomainVerificationResult> {
  const { data, error } = await supabase.functions.invoke<{
    verified: boolean;
    message?: string;
    error?: string;
  }>('verify-domain', { body: { tenant_id: tenantId, domain, action: 'verify' } });

  if (error) throw error;
  if (!data || data.error || typeof data.verified !== 'boolean') {
    throw new Error(data?.error || 'Phản hồi xác minh domain không hợp lệ');
  }

  return { verified: data.verified, message: data.message };
}

// ponytail: re-export tenant-scoped admin helpers used by the admin dashboard.
// Phase 2.1 consolidates all admin tenant queries behind this file.
// These thin wrappers delegate to tenantService today; future phases may inline
// them as dedicated RPC-first admin functions.
export type {
  SearchTenantsResult,
  TenantCredentials,
} from '../tenantService';

export {
  createTenantWithCredentials,
  getAllTenants,
  getTenantById,
  getTenantBySubdomain,
  getTenantCredentials,
  getTenantUsageSummary,
  getTenantFeatureFlags,
  updateTenantFeatureFlags,
  getTopTenants,
  getTenantGrowth,
  searchTenants,
  softDeleteTenant,
  hardDeleteTenant,
  updateTenant,
} from '../tenantService';

// ponytail: alias so callers using the older naming convention still work.
export const restoreTenantStatus = restoreTenant;
