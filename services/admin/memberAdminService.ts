import { supabase } from '../../lib/supabase';
import {
  TenantRole,
  TenantMembership,
  MemberWithEmail,
  SearchMembersParams,
  SearchMembersResult,
  Invitation,
  InvitationStatus,
} from '../../types/tenant';
import {
  resetMemberPassword as resetMemberPasswordBase,
} from '../tenantService';

// ponytail: thin admin wrapper around member operations in tenantService.
// Phase 2.1 centralizes member-management calls used by the admin dashboard.
// Sub-Phase 5.1 adds the invitation table flow (create → send email → accept).

export type { MemberWithEmail, SearchMembersParams, SearchMembersResult };

export {
  getMemberWithEmail,
  getMembers,
  getTenantMembers,
  getTenantMembersWithEmail,
  inviteMember,
  inviteMemberByEmail,
  removeMember,
  resetInvite,
  resendMemberInvite,
  searchMembers,
  searchTenantMembers,
  toggleMemberActive,
  updateMemberRole,
} from '../tenantService';

// Sub-Phase 5.1: runtime validation mirrors tenantService for consistency.
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const VALID_ROLES = new Set(['owner', 'admin', 'cashier', 'inventory_manager', 'accountant', 'viewer']);

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

const mapInvitationFromDB = (row: any): Invitation => ({
  id: row.id,
  tenantId: row.tenant_id,
  email: row.email,
  role: row.role,
  token: row.token,
  status: row.status,
  expiresAt: row.expires_at,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function resetMemberPassword(
  tenantId: string,
  userId: string
): Promise<{ success: boolean; action?: string; redirectTo?: string; link?: string | null }> {
  return resetMemberPasswordBase(tenantId, userId);
}

export async function createInvitation(
  tenantId: string,
  email: string,
  role: TenantRole
): Promise<Invitation> {
  validateRole(role);
  validateEmail(email);

  const { data: userData } = await supabase.auth.getUser();
  const createdBy = userData.user?.id;
  if (!createdBy) throw new Error('Chưa đăng nhập');

  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      tenant_id: tenantId,
      email: normalizedEmail,
      role,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return mapInvitationFromDB(data);
}

export async function sendInvitationEmail(
  tenantId: string,
  email: string,
  role: TenantRole,
  token: string,
  invitationId?: string
): Promise<{ success: boolean; emailProviderConfigured: boolean; acceptUrl?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.functions.invoke<{
    success: boolean;
    emailProviderConfigured?: boolean;
    acceptUrl?: string;
    error?: string;
  }>('send-invitation-email', {
    body: {
      tenant_id: tenantId,
      email: normalizedEmail,
      role,
      token,
      invitation_id: invitationId,
    },
  });

  if (error) {
    throw new Error(await parseFunctionError(error));
  }
  if (!data || typeof data !== 'object' || !data.success) {
    throw new Error(data?.error || 'Gửi email mời thất bại');
  }
  return {
    success: data.success,
    emailProviderConfigured: data.emailProviderConfigured ?? false,
    acceptUrl: data.acceptUrl,
  };
}

export async function listInvitations(
  tenantId: string,
  status?: InvitationStatus
): Promise<Invitation[]> {
  let query = supabase
    .from('invitations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapInvitationFromDB);
}

export async function revokeInvitation(tenantId: string, invitationId: string): Promise<Invitation> {
  const { data, error } = await supabase
    .from('invitations')
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('tenant_id', tenantId)
    .select()
    .single();
  if (error) throw error;
  return mapInvitationFromDB(data);
}

export async function resendInvitation(
  tenantId: string,
  invitationId: string
): Promise<{ success: boolean; emailProviderConfigured: boolean; acceptUrl?: string }> {
  const { data: row, error: fetchError } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!row) throw new Error('Lời mời không tồn tại');
  if (row.status !== 'pending') throw new Error('Chỉ có thể gửi lại lời mời đang ở trạng thái pending');

  const sent = await sendInvitationEmail(tenantId, row.email, row.role, row.token, invitationId);

  const { error: updateError } = await supabase
    .from('invitations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', invitationId);
  if (updateError) throw updateError;

  return sent;
}

export interface LookupInvitationResult {
  tenantId: string;
  tenantName: string;
  tenantSubdomain: string;
  tenantCustomDomain?: string;
  role: string;
  email: string;
  active: boolean;
  expired: boolean;
}

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

export async function lookupInvitation(token: string): Promise<LookupInvitationResult | null> {
  const { data, error } = await supabase.rpc('lookup_invitation', { p_token: token });
  if (error) throw error;
  const rows = data as any[] | null;
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  return {
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    tenantSubdomain: row.tenant_subdomain,
    tenantCustomDomain: row.tenant_custom_domain,
    role: row.role,
    email: row.email,
    active: row.active,
    expired: row.expired,
  };
}

export async function acceptInvitation(token: string): Promise<TenantMembership> {
  const { data, error } = await supabase.rpc('accept_invitation', { p_token: token });
  if (error) throw error;
  return mapMembershipFromDB(data);
}

// ponytail: simple concurrency pool; keeps the same default as the old tenantService wrapper.
async function runWithConcurrency<T>(items: string[], concurrency: number, fn: (item: string) => Promise<T>): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
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
  if (!Array.isArray(emails) || emails.length === 0) {
    return { succeeded: 0, failed: 0, alreadyMember: 0, emailProviderNotConfigured: 0, errors: [] };
  }
  if (emails.length > 50) {
    throw new Error('Tối đa 50 email mỗi lần');
  }
  validateRole(role);

  const seen = new Set<string>();
  const uniqueEmails = emails
    .map((e) => e.trim().toLowerCase())
    .filter((e) => {
      if (!e || seen.has(e)) return false;
      seen.add(e);
      return true;
    });

  const validEmails = uniqueEmails.filter((e) => EMAIL_REGEX.test(e));
  const invalidCount = uniqueEmails.length - validEmails.length;

  const { data: existingMembers, error: existingError } = await supabase
    .from('tenant_memberships')
    .select('email')
    .eq('tenant_id', tenantId)
    .in('email', validEmails);
  if (existingError) throw existingError;

  const existingEmailSet = new Set((existingMembers ?? []).map((m: any) => m.email?.toLowerCase()));
  const newEmails = validEmails.filter((e) => !existingEmailSet.has(e));

  const { data: usageData, error: usageError } = await supabase.rpc('get_tenant_usage_summary', {
    p_tenant_id: tenantId,
  });
  if (usageError) throw usageError;

  const { data: pendingInvitations, error: pendingError } = await supabase
    .from('invitations')
    .select('email')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .in('email', newEmails);
  if (pendingError) throw pendingError;
  const pendingEmailSet = new Set((pendingInvitations ?? []).map((i: any) => i.email?.toLowerCase()));

  const currentUsers = usageData?.users?.current ?? 0;
  const maxUsers = usageData?.users?.max ?? 0;
  const totalSeats = maxUsers > 0 ? Math.max(0, maxUsers - currentUsers) : newEmails.length;
  const availableSlots = Math.max(0, totalSeats - pendingEmailSet.size);
  const inviteEmails = newEmails.slice(0, availableSlots);
  const quotaExceeded = newEmails.length - inviteEmails.length;

  const results = await runWithConcurrency(inviteEmails, maxConcurrency, async (email) => {
    const invitation = await createInvitation(tenantId, email, role);
    return sendInvitationEmail(tenantId, invitation.email, invitation.role as TenantRole, invitation.token, invitation.id);
  });

  let succeeded = 0;
  let failed = 0;
  let emailProviderNotConfigured = 0;
  const errors: { email: string; message: string }[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const email = inviteEmails[i];
    if (result.status === 'fulfilled') {
      succeeded++;
      if (!result.value.emailProviderConfigured) {
        emailProviderNotConfigured++;
      }
    } else {
      failed++;
      const message = result.reason instanceof Error
        ? result.reason.message
        : String(result.reason || 'Mời thất bại');
      errors.push({ email, message });
    }
  }

  for (let i = 0; i < quotaExceeded; i++) {
    failed++;
    errors.push({ email: newEmails[inviteEmails.length + i], message: 'Vượt quá giới hạn thành viên' });
  }

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

