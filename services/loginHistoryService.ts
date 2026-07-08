import { supabase } from '../lib/supabase';

export type AdminLoginStatus = 'success' | 'failed';

export interface AdminLoginHistoryEntry {
  id: string;
  userId: string;
  email: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  status: AdminLoginStatus;
  failureReason: string | null;
  createdAt: string;
}

export interface FailedBurstAlert {
  type: 'failed_burst';
  userId: string;
  email: string | null;
  ipAddress: string | null;
  failedCount: number;
  windowStart: string;
  windowEnd: string;
}

export interface NewDeviceAlert {
  type: 'new_device';
  id: string;
  userId: string;
  email: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface RapidLoginAlert {
  type: 'rapid_login';
  userId: string;
  email: string | null;
  successCount: number;
  windowStart: string;
  windowEnd: string;
}

export type AdminLoginAlert = FailedBurstAlert | NewDeviceAlert | RapidLoginAlert;

export interface AdminLoginHistoryFilter {
  status?: AdminLoginStatus | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  limit?: number;
  offset?: number;
}

const mapEntry = (row: any): AdminLoginHistoryEntry => ({
  id: row.id,
  userId: row.user_id,
  email: row.email,
  ipAddress: row.ip_address,
  userAgent: row.user_agent,
  status: row.status,
  failureReason: row.failure_reason,
  createdAt: row.created_at,
});

export async function recordAdminLogin(options: {
  userId?: string | null;
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: AdminLoginStatus;
  failureReason?: string | null;
}): Promise<string | null> {
  const { data, error } = await supabase.rpc('record_admin_login', {
    p_user_id: options.userId ?? null,
    p_email: options.email ?? null,
    p_ip_address: options.ipAddress ?? null,
    p_user_agent: options.userAgent ?? null,
    p_status: options.status ?? 'success',
    p_failure_reason: options.failureReason ?? null,
  });
  if (error) throw error;
  return data as string | null;
}

export async function getAdminLoginHistory(
  options: AdminLoginHistoryFilter = {}
): Promise<{ data: AdminLoginHistoryEntry[]; count: number }> {
  const { data, error } = await supabase.rpc('get_admin_login_history', {
    p_limit: options.limit ?? 50,
    p_offset: options.offset ?? 0,
    p_status: options.status ?? null,
    p_date_from: options.dateFrom ?? null,
    p_date_to: options.dateTo ?? null,
  });
  if (error) throw error;
  return {
    data: (data?.data || []).map(mapEntry),
    count: data?.count ?? 0,
  };
}

export async function getAdminLoginAlerts(hoursAgo = 24): Promise<AdminLoginAlert[]> {
  const { data, error } = await supabase.rpc('get_admin_login_alerts', {
    p_hours_ago: hoursAgo,
  });
  if (error) throw error;

  const alerts: AdminLoginAlert[] = [];

  (data?.failed_burst || []).forEach((row: any) => {
    alerts.push({
      type: 'failed_burst',
      userId: row.user_id,
      email: row.email,
      ipAddress: row.ip_address,
      failedCount: row.failed_count,
      windowStart: row.window_start,
      windowEnd: row.window_end,
    });
  });

  (data?.new_device || []).forEach((row: any) => {
    alerts.push({
      type: 'new_device',
      id: row.id,
      userId: row.user_id,
      email: row.email,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
    });
  });

  (data?.rapid_login || []).forEach((row: any) => {
    alerts.push({
      type: 'rapid_login',
      userId: row.user_id,
      email: row.email,
      successCount: row.success_count,
      windowStart: row.window_start,
      windowEnd: row.window_end,
    });
  });

  // ponytail: sắp xếp theo thời gian gần nhất dựa trên window_end/created_at.
  alerts.sort((a, b) => {
    const ta = a.type === 'new_device' ? a.createdAt : a.windowEnd;
    const tb = b.type === 'new_device' ? b.createdAt : b.windowEnd;
    return new Date(tb).getTime() - new Date(ta).getTime();
  });

  return alerts;
}
