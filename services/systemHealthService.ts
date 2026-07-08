import { supabase } from '../lib/supabase';
import { SystemHealth } from '../types/tenant';

export async function getSystemHealth(): Promise<SystemHealth> {
  const { data, error } = await (supabase as any).functions.invoke('system-health', {
    body: {},
  });
  if (error) throw error;
  if (!data || typeof data !== 'object') throw new Error('Phản hồi health không hợp lệ');
  return {
    checkedAt: data.checkedAt ?? new Date().toISOString(),
    overall: data.overall ?? 'unknown',
    checks: Array.isArray(data.checks) ? data.checks : [],
  };
}
