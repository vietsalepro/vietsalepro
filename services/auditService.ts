import { supabase, getCurrentTenantId } from '../lib/supabase';
import { AppError } from '../utils/errors';

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPERSONATE' | 'IMPERSONATE_END';

export interface AuditLogEntry {
  id: string;
  tenantId: string | null;
  userId: string | null;
  tableName: string;
  recordId: string | null;
  action: AuditAction;
  oldData: any;
  newData: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

const mapAuditLogFromDB = (row: any): AuditLogEntry => ({
  id: row.id,
  tenantId: row.tenant_id,
  userId: row.user_id,
  tableName: row.table_name,
  recordId: row.record_id,
  action: row.action,
  oldData: row.old_data,
  newData: row.new_data,
  ipAddress: row.ip_address,
  userAgent: row.user_agent,
  createdAt: row.created_at,
});

interface WriteAuditLogOptions {
  recordId?: string | null;
  oldData?: any;
  newData?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Ghi audit log thủ công cho các sự kiện không có trigger (LOGIN, LOGOUT, EXPORT).
 * ponytail: ip_address/user_agent được điền từ Edge Function headers khi không truyền;
 * client có thể truyền user_agent nếu cần, còn IP để Edge Function tự lấy.
 */
const VALID_AUDIT_ACTIONS = new Set<string>(['INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPERSONATE', 'IMPERSONATE_END']);

export async function writeAuditLog(
  action: AuditAction,
  tableName: string,
  options: WriteAuditLogOptions = {}
): Promise<void> {
  const tenantId = getCurrentTenantId();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  // ponytail: skip audit-log calls with missing required fields to avoid Edge Function 400.
  if (!tenantId || !tableName || !action || !VALID_AUDIT_ACTIONS.has(action)) {
    // ponytail: admin subdomain has no tenantId; warn spam hides real issues, use debug log.
    console.debug('audit-log skipped: missing required fields', { tenantId, tableName, action });
    return;
  }

  const body = {
    type: 'audit',
    tenant_id: tenantId,
    table_name: tableName,
    action,
    record_id: options.recordId ?? null,
    user_id: userId,
    old_data: options.oldData ?? null,
    new_data: options.newData ?? null,
    ip_address: options.ipAddress ?? null,
    user_agent: options.userAgent ?? null,
  };

  const { error } = await supabase.functions.invoke('audit-log', { body });
  if (error) {
    throw new AppError(error.message || 'Lỗi ghi audit log', 'AUDIT_LOG_WRITE_ERROR', { originalError: error });
  }
}

export interface AuditLogFilter {
  tenantId?: string | null;
  userId?: string | null;
  action?: AuditAction | null;
  tableName?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export async function getAuditLogs(
  options: AuditLogFilter & { limit?: number; offset?: number } = {}
): Promise<{
  data: AuditLogEntry[];
  count: number | null;
}> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  let query = supabase
    .from('app_audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options.tenantId) {
    query = query.eq('tenant_id', options.tenantId);
  }
  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }
  if (options.action) {
    query = query.eq('action', options.action);
  }
  if (options.tableName) {
    query = query.ilike('table_name', `%${options.tableName}%`);
  }
  if (options.dateFrom) {
    query = query.gte('created_at', options.dateFrom);
  }
  if (options.dateTo) {
    // ponytail: bao gồm cả ngày kết thúc đến cuối ngày.
    const end = new Date(options.dateTo);
    end.setHours(23, 59, 59, 999);
    query = query.lte('created_at', end.toISOString());
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    throw new AppError(error.message || 'Lỗi đọc audit log', 'AUDIT_LOG_READ_ERROR', { originalError: error });
  }

  return {
    data: (data || []).map(mapAuditLogFromDB),
    count: count ?? 0,
  };
}
