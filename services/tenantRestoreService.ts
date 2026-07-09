import { supabase } from '../lib/supabase';

export interface TenantBackupFile {
  tenant?: Record<string, unknown>;
  tables: Record<string, unknown[]>;
  exportedAt?: string;
}

export interface RestoredTable {
  table: string;
  rows: number;
}

export interface RestoreError {
  table: string;
  error: string;
}

export interface RestoreResult {
  success: boolean;
  result: {
    tenant_id: string;
    restored: RestoredTable[];
    errors: RestoreError[];
    total_rows: number;
  };
}

export function validateBackup(backup: unknown): asserts backup is TenantBackupFile {
  if (!backup || typeof backup !== 'object') {
    throw new Error('File backup không hợp lệ');
  }
  const b = backup as Record<string, unknown>;
  if (!b.tables || typeof b.tables !== 'object' || Array.isArray(b.tables)) {
    throw new Error('File backup thiếu phần tables hoặc tables không hợp lệ');
  }
}

export async function restoreTenantBackup(tenantId: string, file: File): Promise<RestoreResult> {
  const text = await file.text();
  let backup: TenantBackupFile;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new Error('File backup không phải JSON hợp lệ');
  }
  validateBackup(backup);

  const { data, error } = await supabase.functions.invoke<RestoreResult & { error?: string }>('tenant-restore', {
    body: { tenant_id: tenantId, backup },
  });
  if (error) throw error;
  if (!data || typeof data !== 'object') {
    throw new Error('Phản hồi restore không hợp lệ');
  }
  if (typeof data.error === 'string') {
    throw new Error(data.error);
  }
  if (!data.success || !data.result) {
    throw new Error('Phản hồi restore không hợp lệ');
  }
  return data;
}

export function previewBackupTables(backup: TenantBackupFile): { name: string; rows: number }[] {
  return Object.entries(backup.tables)
    .map(([name, rows]) => ({ name, rows: Array.isArray(rows) ? rows.length : 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
