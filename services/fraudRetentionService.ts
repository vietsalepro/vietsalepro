import { supabase } from '../lib/supabase';
import {
  FraudDetectionConfig,
  FraudQueueList,
  FraudQueueStatus,
  FraudStats,
  DataRetentionConfig,
  DataRetentionRunResult,
} from '../types/tenant';

export async function getFraudDetectionConfig(): Promise<FraudDetectionConfig> {
  const { data, error } = await supabase.rpc('get_fraud_detection_config');
  if (error) throw error;
  return {
    enabled: data?.enabled ?? true,
    ipWindowHours: data?.ipWindowHours ?? 24,
    ipMax: data?.ipMax ?? 5,
    emailDomainWindowHours: data?.emailDomainWindowHours ?? 24,
    emailDomainMax: data?.emailDomainMax ?? 10,
    ownerWindowHours: data?.ownerWindowHours ?? 24,
    ownerMax: data?.ownerMax ?? 20,
  };
}

export async function setFraudDetectionConfig(
  config: Partial<FraudDetectionConfig>
): Promise<FraudDetectionConfig> {
  const current = await getFraudDetectionConfig();
  const merged = { ...current, ...config };
  const { data, error } = await supabase.rpc('set_fraud_detection_config', {
    p_enabled: merged.enabled,
    p_ip_window_hours: merged.ipWindowHours,
    p_ip_max: merged.ipMax,
    p_email_domain_window_hours: merged.emailDomainWindowHours,
    p_email_domain_max: merged.emailDomainMax,
    p_owner_window_hours: merged.ownerWindowHours,
    p_owner_max: merged.ownerMax,
  });
  if (error) throw error;
  return {
    enabled: data?.enabled ?? true,
    ipWindowHours: data?.ipWindowHours ?? 24,
    ipMax: data?.ipMax ?? 5,
    emailDomainWindowHours: data?.emailDomainWindowHours ?? 24,
    emailDomainMax: data?.emailDomainMax ?? 10,
    ownerWindowHours: data?.ownerWindowHours ?? 24,
    ownerMax: data?.ownerMax ?? 20,
  };
}

export async function runFraudDetection(): Promise<{
  enabled: boolean;
  inserted: number;
  updated: number;
}> {
  const { data, error } = await supabase.rpc('run_fraud_detection');
  if (error) throw error;
  return {
    enabled: data?.enabled ?? true,
    inserted: data?.inserted ?? 0,
    updated: data?.updated ?? 0,
  };
}

export async function getFraudQueue(params?: {
  status?: FraudQueueStatus | null;
  severity?: 'low' | 'medium' | 'high' | null;
  limit?: number;
  offset?: number;
}): Promise<FraudQueueList> {
  const { data, error } = await supabase.rpc('get_fraud_queue', {
    p_status: params?.status || null,
    p_severity: params?.severity || null,
    p_limit: params?.limit ?? 50,
    p_offset: params?.offset ?? 0,
  });
  if (error) throw error;
  return {
    data: (data?.data || []).map((row: any) => ({
      id: row.id,
      type: row.type,
      severity: row.severity,
      status: row.status,
      targetValue: row.target_value,
      eventCount: row.event_count,
      details: row.details,
      windowStart: row.window_start,
      windowEnd: row.window_end,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    count: data?.count ?? 0,
  };
}

export async function getFraudStats(): Promise<FraudStats> {
  const { data, error } = await supabase.rpc('get_fraud_stats');
  if (error) throw error;
  return {
    total: data?.total ?? 0,
    byStatus: data?.byStatus ?? {},
    bySeverity: data?.bySeverity ?? {},
  };
}

export async function updateFraudQueueStatus(
  id: string,
  status: FraudQueueStatus,
  notes?: string
): Promise<{ id: string; status: FraudQueueStatus; notes?: string; updatedAt: string }> {
  const { data, error } = await supabase.rpc('update_fraud_queue_status', {
    p_id: id,
    p_status: status,
    p_notes: notes ?? null,
  });
  if (error) throw error;
  return {
    id: data?.id,
    status: data?.status,
    notes: data?.notes,
    updatedAt: data?.updatedAt,
  };
}

export async function getDataRetentionConfig(): Promise<DataRetentionConfig> {
  const { data, error } = await supabase.rpc('get_data_retention_config');
  if (error) throw error;
  return {
    retentionDaysOrders: data?.retentionDaysOrders ?? 730,
    retentionDaysProcessedOperations: data?.retentionDaysProcessedOperations ?? 90,
    retentionDaysRateLimitLogs: data?.retentionDaysRateLimitLogs ?? 1,
    retentionDaysFraudQueue: data?.retentionDaysFraudQueue ?? 90,
    retentionDaysRegistrationEvents: data?.retentionDaysRegistrationEvents ?? 365,
    cronSchedule: data?.cronSchedule ?? '0 3 * * *',
  };
}

export async function setDataRetentionConfig(
  config: Partial<DataRetentionConfig>
): Promise<DataRetentionConfig> {
  const current = await getDataRetentionConfig();
  const merged = { ...current, ...config };
  const { data, error } = await supabase.rpc('set_data_retention_config', {
    p_retention_days_orders: merged.retentionDaysOrders,
    p_retention_days_processed_operations: merged.retentionDaysProcessedOperations,
    p_retention_days_rate_limit_logs: merged.retentionDaysRateLimitLogs,
    p_retention_days_fraud_queue: merged.retentionDaysFraudQueue,
    p_retention_days_registration_events: merged.retentionDaysRegistrationEvents,
    p_cron_schedule: merged.cronSchedule,
  });
  if (error) throw error;
  return {
    retentionDaysOrders: data?.retentionDaysOrders ?? 730,
    retentionDaysProcessedOperations: data?.retentionDaysProcessedOperations ?? 90,
    retentionDaysRateLimitLogs: data?.retentionDaysRateLimitLogs ?? 1,
    retentionDaysFraudQueue: data?.retentionDaysFraudQueue ?? 90,
    retentionDaysRegistrationEvents: data?.retentionDaysRegistrationEvents ?? 365,
    cronSchedule: data?.cronSchedule ?? '0 3 * * *',
  };
}

export async function runDataRetention(): Promise<DataRetentionRunResult> {
  const { data, error } = await supabase.rpc('run_data_retention');
  if (error) throw error;
  return {
    archivedOrders: data?.archivedOrders ?? 0,
    archivedItems: data?.archivedItems ?? 0,
    deletedProcessedOperations: data?.deletedProcessedOperations ?? 0,
    deletedRateLimitLogs: data?.deletedRateLimitLogs ?? 0,
    deletedFraudQueue: data?.deletedFraudQueue ?? 0,
    deletedRegistrationEvents: data?.deletedRegistrationEvents ?? 0,
  };
}
