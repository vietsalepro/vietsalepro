// ponytail: admin dashboard audit log queries against the dedicated audit_log table.
// Sub-Phase 5.2 adds tenant-management audit logging separate from app_audit_log.

import { supabase } from '../../lib/supabase';
import { AppError } from '../../utils/errors';

export type AdminAuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AdminAuditLogEntry {
  id: string;
  tenantId: string | null;
  actorId: string | null;
  action: AdminAuditAction;
  entityType: string;
  entityId: string;
  oldData: any;
  newData: any;
  ipAddress: string | null;
  createdAt: string;
}

export interface AdminAuditLogFilter {
  tenantId?: string | null;
  actorId?: string | null;
  action?: AdminAuditAction | null;
  entityType?: string | null;
  entityId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

const mapAdminAuditLogFromDB = (row: any): AdminAuditLogEntry => ({
  id: row.id,
  tenantId: row.tenant_id,
  actorId: row.actor_id,
  action: row.action,
  entityType: row.entity_type,
  entityId: row.entity_id,
  oldData: row.old_data,
  newData: row.new_data,
  ipAddress: row.ip_address,
  createdAt: row.created_at,
});

export async function getAdminAuditLogs(
  options: AdminAuditLogFilter & { limit?: number; offset?: number } = {}
): Promise<{ data: AdminAuditLogEntry[]; count: number | null }> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options.tenantId) {
    query = query.eq('tenant_id', options.tenantId);
  }
  if (options.actorId) {
    query = query.eq('actor_id', options.actorId);
  }
  if (options.action) {
    query = query.eq('action', options.action);
  }
  if (options.entityType) {
    query = query.ilike('entity_type', `%${options.entityType}%`);
  }
  if (options.entityId) {
    query = query.eq('entity_id', options.entityId);
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
    data: (data || []).map(mapAdminAuditLogFromDB),
    count,
  };
}

export type { AdminLoginAlert, AdminLoginHistoryEntry, AdminLoginHistoryFilter } from '../loginHistoryService';
export {
  getAdminLoginAlerts,
  getAdminLoginHistory,
  recordAdminLogin,
} from '../loginHistoryService';

export type { RateLimitLog } from '../systemAdminService';
export { getRateLimitLogs } from '../systemAdminService';
