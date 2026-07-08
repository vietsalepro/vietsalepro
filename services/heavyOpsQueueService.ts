import { supabase } from '../lib/supabase';
import {
  HeavyOpJob,
  HeavyOpJobStatus,
  ConnectionPoolStats,
  ReadReplicaStatus,
} from '../types/tenant';

const mapJobFromDB = (row: any): HeavyOpJob => ({
  id: row.id,
  tenantId: row.tenant_id,
  jobType: row.job_type,
  payload: row.payload,
  status: row.status,
  attempts: row.attempts ?? 0,
  maxAttempts: row.max_attempts ?? 3,
  errorMessage: row.error_message,
  result: row.result,
  scheduledAt: row.scheduled_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export interface EnqueueHeavyOpJobInput {
  tenantId: string;
  jobType: string;
  payload?: any;
  maxAttempts?: number;
  scheduledAt?: string;
}

export async function enqueueHeavyOpJob(input: EnqueueHeavyOpJobInput): Promise<HeavyOpJob> {
  const { data, error } = await supabase.rpc('enqueue_heavy_op_job', {
    p_tenant_id: input.tenantId,
    p_job_type: input.jobType,
    p_payload: input.payload ?? {},
    p_max_attempts: input.maxAttempts ?? 3,
    p_scheduled_at: input.scheduledAt ?? null,
  });
  if (error) throw error;
  return mapJobFromDB(data);
}

export interface GetHeavyOpJobsParams {
  tenantId?: string;
  status?: HeavyOpJobStatus | null;
  limit?: number;
  offset?: number;
}

export async function getHeavyOpJobs(params: GetHeavyOpJobsParams = {}): Promise<HeavyOpJob[]> {
  const { data, error } = await supabase.rpc('get_heavy_op_jobs', {
    p_tenant_id: params.tenantId ?? null,
    p_status: params.status ?? null,
    p_limit: params.limit ?? 50,
    p_offset: params.offset ?? 0,
  });
  if (error) throw error;
  return (data || []).map(mapJobFromDB);
}

export async function claimHeavyOpJob(): Promise<HeavyOpJob | null> {
  const { data, error } = await supabase.rpc('claim_heavy_op_job');
  if (error) throw error;
  return data ? mapJobFromDB(data) : null;
}

export async function completeHeavyOpJob(
  jobId: string,
  status: HeavyOpJobStatus,
  result?: any,
  errorMessage?: string
): Promise<HeavyOpJob> {
  const { data, error } = await supabase.rpc('complete_heavy_op_job', {
    p_job_id: jobId,
    p_status: status,
    p_result: result ?? null,
    p_error_message: errorMessage ?? null,
  });
  if (error) throw error;
  return mapJobFromDB(data);
}

export async function retryHeavyOpJob(jobId: string): Promise<HeavyOpJob> {
  const { data, error } = await supabase.rpc('retry_heavy_op_job', { p_job_id: jobId });
  if (error) throw error;
  return mapJobFromDB(data);
}

export async function getConnectionPoolStats(): Promise<ConnectionPoolStats> {
  const { data, error } = await supabase.rpc('get_connection_pool_stats');
  if (error) throw error;
  return {
    active: data?.active ?? 0,
    idle: data?.idle ?? 0,
    total: data?.total ?? 0,
    max: data?.max ?? 0,
    status: data?.status ?? 'unknown',
    message: data?.message,
  };
}

export async function getReadReplicaStatus(): Promise<ReadReplicaStatus> {
  const { data, error } = await supabase.rpc('get_read_replica_status');
  if (error) throw error;
  return {
    enabled: data?.enabled ?? false,
    configuredTenants: data?.configured_tenants ?? 0,
    message: data?.message,
  };
}
