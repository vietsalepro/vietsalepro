import { supabase } from '../lib/supabase';

export interface ResetDemoResult {
  tenantId: string;
  cleared: { table: string; rows: number }[];
  totalRows: number;
}

export interface MigrateTenantResult {
  sourceTenantId: string;
  targetTenantId: string;
  result: Record<string, unknown>;
}

export async function resetDemoData(tenantId: string): Promise<ResetDemoResult> {
  const { data, error } = await supabase.rpc('reset_demo_data', { p_tenant_id: tenantId });
  if (error) throw error;
  return {
    tenantId: data?.tenant_id ?? tenantId,
    cleared: (data?.cleared || []).map((r: any) => ({ table: r.table, rows: r.rows })),
    totalRows: data?.total_rows ?? 0,
  };
}

export async function migrateTenantData(
  sourceTenantId: string,
  targetTenantId: string,
): Promise<MigrateTenantResult> {
  const { data, error } = await supabase.rpc('migrate_tenant_data', {
    p_source_tenant_id: sourceTenantId,
    p_target_tenant_id: targetTenantId,
  });
  if (error) throw error;
  return {
    sourceTenantId: data?.source_tenant_id ?? sourceTenantId,
    targetTenantId: data?.target_tenant_id ?? targetTenantId,
    result: data?.result ?? {},
  };
}
