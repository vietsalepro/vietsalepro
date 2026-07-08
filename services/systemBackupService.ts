import { supabase } from '../lib/supabase';
import { BackupStatus } from '../types/tenant';

export async function getBackupStatus(): Promise<{ checkedAt: string; backupStatus: BackupStatus }> {
  const { data, error } = await (supabase as any).functions.invoke('system-backup', {
    body: {},
  });
  if (error) throw error;
  if (!data || typeof data !== 'object' || data.error) {
    throw new Error(data?.error || 'Phản hồi backup không hợp lệ');
  }
  return {
    checkedAt: data.checkedAt ?? new Date().toISOString(),
    backupStatus: data.backupStatus ?? {
      pitrEnabled: null,
      pitrEarliestRecoveryPoint: null,
      lastBackupAt: null,
      cliAvailable: false,
      status: 'unknown',
    },
  };
}
