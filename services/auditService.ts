import { supabase, getCurrentTenantId } from '../lib/supabase';
import { AppError } from '../utils/errors';

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT';

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
export async function writeAuditLog(
  action: AuditAction,
  tableName: string,
  options: WriteAuditLogOptions = {}
): Promise<void> {
  const tenantId = getCurrentTenantId();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

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

  const { error } = await (supabase as any).functions.invoke('audit-log', { body });
  if (error) {
    throw new AppError(error.message || 'Lỗi ghi audit log', 'AUDIT_LOG_WRITE_ERROR', { originalError: error });
  }
}

export async function getAuditLogs(options: { limit?: number; offset?: number } = {}): Promise<{
  data: AuditLogEntry[];
  count: number | null;
}> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  const { data, error, count } = await supabase
    .from('app_audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new AppError(error.message || 'Lỗi đọc audit log', 'AUDIT_LOG_READ_ERROR', { originalError: error });
  }

  return {
    data: (data || []).map(mapAuditLogFromDB),
    count,
  };
}
