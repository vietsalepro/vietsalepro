import { supabase } from '../lib/supabase';
import {
  BulkUpdateTenantsResult,
  MaintenanceWindow,
  MaintenanceWindowStatus,
} from '../types/tenant';

const mapMaintenanceWindowFromDB = (row: any): MaintenanceWindow => ({
  id: row.id,
  title: row.title,
  description: row.description,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  status: row.status,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function bulkUpdateTenants(
  tenantIds: string[],
  options: { status?: string; plan?: string } = {}
): Promise<BulkUpdateTenantsResult> {
  const { data, error } = await supabase.rpc('bulk_update_tenants', {
    p_tenant_ids: tenantIds,
    p_status: options.status ?? null,
    p_plan: options.plan ?? null,
  });
  if (error) throw error;
  return {
    updated: data?.updated ?? 0,
    updatedIds: data?.updatedIds ?? [],
    skippedIds: data?.skippedIds ?? [],
  };
}

export async function getMaintenanceWindows(
  options: { start?: string; end?: string } = {}
): Promise<MaintenanceWindow[]> {
  const { data, error } = await supabase.rpc('get_maintenance_windows', {
    p_start: options.start ?? null,
    p_end: options.end ?? null,
  });
  if (error) throw error;
  return (data || []).map(mapMaintenanceWindowFromDB);
}

export async function createMaintenanceWindow(
  input: Omit<MaintenanceWindow, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
): Promise<MaintenanceWindow> {
  const { data, error } = await supabase.rpc('create_maintenance_window', {
    p_title: input.title,
    p_description: input.description ?? null,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
  });
  if (error) throw error;
  return mapMaintenanceWindowFromDB(data);
}

export async function updateMaintenanceWindow(
  id: string,
  input: Partial<Pick<MaintenanceWindow, 'title' | 'description' | 'startsAt' | 'endsAt'>> & {
    status?: MaintenanceWindowStatus;
  }
): Promise<MaintenanceWindow> {
  const { data, error } = await supabase.rpc('update_maintenance_window', {
    p_id: id,
    p_title: input.title ?? null,
    p_description: input.description ?? null,
    p_starts_at: input.startsAt ?? null,
    p_ends_at: input.endsAt ?? null,
    p_status: input.status ?? null,
  });
  if (error) throw error;
  return mapMaintenanceWindowFromDB(data);
}

export async function deleteMaintenanceWindow(id: string): Promise<{ id: string; deleted: boolean }> {
  const { data, error } = await supabase.rpc('delete_maintenance_window', { p_id: id });
  if (error) throw error;
  return { id: data?.id ?? id, deleted: data?.deleted ?? true };
}
