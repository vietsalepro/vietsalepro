import { supabase } from '../lib/supabase';

export interface RateLimitLog {
  id: string;
  ipAddress: string;
  action: string;
  attemptCount: number;
  windowStart: string;
  createdAt: string;
}

export interface SystemAdmin {
  userId: string;
  email?: string;
  createdAt?: string;
}

export interface CreateSystemAdminRequest {
  email: string;
  password: string;
}

export interface CreateSystemAdminResponse {
  success: boolean;
  userId: string;
  email: string;
}

const mapRateLimitLog = (row: any): RateLimitLog => ({
  id: row.id,
  ipAddress: row.ip_address,
  action: row.action,
  attemptCount: row.attempt_count,
  windowStart: row.window_start,
  createdAt: row.created_at,
});

const mapSystemAdmin = (row: any): SystemAdmin => ({
  userId: row.user_id,
  email: row.email,
  createdAt: row.created_at,
});

export async function getRateLimitLogs(options: { limit?: number; offset?: number } = {}): Promise<{
  data: RateLimitLog[];
  count: number;
}> {
  const { data, error } = await supabase.rpc('get_rate_limit_logs', {
    p_limit: options.limit ?? 50,
    p_offset: options.offset ?? 0,
  });
  if (error) throw error;
  return {
    data: (data?.data || []).map(mapRateLimitLog),
    count: data?.count ?? 0,
  };
}

export async function getSystemAdmins(): Promise<SystemAdmin[]> {
  const { data, error } = await supabase.rpc('get_system_admins');
  if (error) throw error;
  return (data || []).map(mapSystemAdmin);
}

export async function addSystemAdmin(userId: string): Promise<SystemAdmin> {
  const { data, error } = await supabase.rpc('add_system_admin', { p_user_id: userId });
  if (error) throw error;
  return mapSystemAdmin(data);
}

export async function removeSystemAdmin(userId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_system_admin', { p_user_id: userId });
  if (error) throw error;
}

export async function createSystemAdmin(email: string, password: string): Promise<SystemAdmin> {
  const { data, error } = await supabase.functions.invoke<CreateSystemAdminResponse>('create-system-admin', {
    body: { email, password },
  });

  if (error) {
    throw new Error(`Failed to create system admin: ${error.message}`);
  }

  if (!data || typeof data !== 'object' || !data.success || typeof data.userId !== 'string' || typeof data.email !== 'string') {
    throw new Error('Failed to create system admin: Invalid response');
  }

  return {
    userId: data.userId,
    email: data.email,
  };
}

// ============================================================
// Sub-Phase 5.2: Security hardening config
// ============================================================

export interface SecuritySettings {
  tenantId: string;
  allowedIps: string[];
  sessionTimeoutMinutes: number;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  success: boolean;
  attemptedAt: string;
}

export interface LockedEmail {
  email: string;
  failedCount: number;
  lastAttempt: string;
}

const mapSecuritySettings = (row: any): SecuritySettings => ({
  tenantId: row.tenant_id,
  allowedIps: Array.isArray(row.allowed_ips) ? row.allowed_ips : [],
  sessionTimeoutMinutes: row.session_timeout_minutes ?? 60,
});

const mapLoginAttempt = (row: any): LoginAttempt => ({
  id: row.id,
  email: row.email,
  ipAddress: row.ip_address,
  success: row.success,
  attemptedAt: row.attempted_at,
});

const mapLockedEmail = (row: any): LockedEmail => ({
  email: row.email,
  failedCount: row.failed_count,
  lastAttempt: row.last_attempt,
});

export async function getTenantSecuritySettings(tenantId: string): Promise<SecuritySettings> {
  const { data, error } = await supabase.rpc('get_tenant_security_settings', { p_tenant_id: tenantId });
  if (error) throw error;
  return mapSecuritySettings(data);
}

export async function updateTenantIpAllowlist(tenantId: string, allowedIps: string[]): Promise<void> {
  const { error } = await supabase.rpc('update_tenant_ip_allowlist', {
    p_tenant_id: tenantId,
    p_allowed_ips: allowedIps.map((ip) => ip.trim()).filter(Boolean),
  });
  if (error) throw error;
}

export async function updateTenantSessionTimeout(tenantId: string, minutes: number): Promise<void> {
  const { error } = await supabase.rpc('update_tenant_session_timeout', {
    p_tenant_id: tenantId,
    p_minutes: Math.max(5, Math.min(minutes, 1440)),
  });
  if (error) throw error;
}

export async function recordLoginAttempt(
  email: string,
  ipAddress: string,
  success: boolean
): Promise<string | null> {
  const { data, error } = await supabase.rpc('record_login_attempt', {
    p_email: email,
    p_ip_address: ipAddress,
    p_success: success,
  });
  if (error) throw error;
  return (data as string) ?? null;
}

export async function getLoginAttempts(options: {
  email?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ data: LoginAttempt[]; count: number }> {
  const { data, error } = await supabase.rpc('get_login_attempts', {
    p_email: options.email ?? null,
    p_limit: options.limit ?? 50,
    p_offset: options.offset ?? 0,
  });
  if (error) throw error;
  return {
    data: (data?.data || []).map(mapLoginAttempt),
    count: data?.count ?? 0,
  };
}

export async function getLockedEmails(): Promise<LockedEmail[]> {
  const { data, error } = await supabase.rpc('get_locked_emails');
  if (error) throw error;
  return (data || []).map(mapLockedEmail);
}

export async function unlockLoginAttempts(email: string): Promise<void> {
  const { error } = await supabase.rpc('unlock_login_attempts', { p_email: email });
  if (error) throw error;
}
