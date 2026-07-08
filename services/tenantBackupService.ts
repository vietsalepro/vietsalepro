import { supabase } from '../lib/supabase';

export async function downloadTenantBackup(tenantId: string): Promise<void> {
  const { data, error } = await (supabase as any).functions.invoke('tenant-backup', {
    body: { tenant_id: tenantId },
  });
  if (error) throw error;
  if (!data || typeof data !== 'object' || data.error) {
    throw new Error(data?.error || 'Phản hồi backup không hợp lệ');
  }

  const exportedAt = data.exportedAt ?? new Date().toISOString();
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
