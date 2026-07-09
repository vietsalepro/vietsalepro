import { supabase } from '../lib/supabase';
import {
  DataRetentionStatus,
  DefaultPlanLimits,
  MaintenanceMode,
  PlanLimits,
} from '../types/tenant';

const mapPlanLimits = (row: any): PlanLimits => ({
  maxUsers: row?.max_users ?? 0,
  maxProducts: row?.max_products ?? 0,
  maxOrdersPerMonth: row?.max_orders_per_month ?? 0,
});

export async function getDataRetentionStatus(): Promise<DataRetentionStatus> {
  const { data, error } = await supabase.rpc('get_data_retention_status');
  if (error) throw error;
  return {
    archivedOrdersCount: data?.archivedOrdersCount ?? 0,
    archivedOrderItemsCount: data?.archivedOrderItemsCount ?? 0,
    rateLimitLogsCount: data?.rateLimitLogsCount ?? 0,
    lastRun: data?.lastRun ?? null,
    cronSchedule: data?.cronSchedule ?? '0 3 * * *',
    cronJob: data?.cronJob ?? null,
  };
}

export async function getDefaultPlanLimits(): Promise<DefaultPlanLimits> {
  const { data, error } = await supabase.rpc('get_default_plan_limits');
  if (error) throw error;
  return {
    free: mapPlanLimits(data?.free),
    vip: mapPlanLimits(data?.vip),
  };
}

export async function setDefaultPlanLimits(
  plan: 'free' | 'vip',
  limits: PlanLimits
): Promise<PlanLimits> {
  const { data, error } = await supabase.rpc('set_default_plan_limits', {
    p_plan: plan,
    p_max_users: limits.maxUsers,
    p_max_products: limits.maxProducts,
    p_max_orders_per_month: limits.maxOrdersPerMonth,
  });
  if (error) throw error;
  return mapPlanLimits(data);
}

export async function getMaintenanceMode(): Promise<MaintenanceMode> {
  const { data, error } = await supabase.rpc('get_maintenance_mode');
  if (error) throw error;
  return {
    enabled: data?.enabled ?? false,
    message: data?.message ?? '',
  };
}

export async function setMaintenanceMode(
  enabled: boolean,
  message?: string
): Promise<MaintenanceMode> {
  const { data, error } = await supabase.rpc('set_maintenance_mode', {
    p_enabled: enabled,
    p_message: message ?? null,
  });
  if (error) throw error;
  return {
    enabled: data?.enabled ?? false,
    message: data?.message ?? '',
  };
}

export async function checkSubdomain(subdomain: string): Promise<{
  available: boolean;
  error?: string;
}> {
  const { data, error } = await supabase.functions.invoke<{ available: boolean; error?: string }>('check-subdomain', {
    body: { subdomain: subdomain.trim().toLowerCase() },
  });
  if (error) throw error;
  if (!data || typeof data !== 'object' || typeof data.available !== 'boolean') {
    throw new Error(data?.error || 'Phản hồi kiểm tra subdomain không hợp lệ');
  }
  return {
    available: data.available,
    error: data.error,
  };
}
