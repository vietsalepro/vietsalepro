import { supabase } from '../lib/supabase';
import { BackupStatus } from '../types/tenant';

export async function getBackupStatus(): Promise<{ checkedAt: string; backupStatus: BackupStatus }> {
  const { data, error } = await supabase.functions.invoke<{ checkedAt?: string; backupStatus?: BackupStatus; error?: string }>('system-backup', {
    body: {},
  });
  if (error) throw error;
  if (!data || typeof data !== 'object') {
    throw new Error('Phản hồi backup không hợp lệ');
  }
  if (typeof data.error === 'string') {
    throw new Error(data.error);
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
