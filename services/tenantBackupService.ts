import { supabase } from '../lib/supabase';

export async function downloadTenantBackup(tenantId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<Record<string, unknown> & { error?: string }>('tenant-backup', {
    body: { tenant_id: tenantId },
  });
  if (error) throw error;
  if (!data || typeof data !== 'object') {
    throw new Error('Phản hồi backup không hợp lệ');
  }
  if (typeof data.error === 'string') {
    throw new Error(data.error);
  }

  const exportedAt = typeof data.exportedAt === 'string' ? data.exportedAt : new Date().toISOString();
  const datePart = exportedAt.slice(0, 10);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tenant-${tenantId}-backup-${datePart}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
