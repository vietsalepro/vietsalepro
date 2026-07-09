import { supabase } from '../lib/supabase';
import { ErrorPerformance } from '../types/tenant';

export async function getErrorPerformance(): Promise<ErrorPerformance> {
  const { data, error } = await supabase.functions.invoke<ErrorPerformance>('error-performance', {
    body: {},
  });
  if (error) throw error;
  if (!data || typeof data !== 'object') throw new Error('Phản hồi error/performance không hợp lệ');
  return {
    checkedAt: data.checkedAt ?? new Date().toISOString(),
    errors: data.errors ?? { total: 0, since: new Date().toISOString(), bySource: [], recent: [] },
    performance: data.performance ?? {
      totalQueries: 0,
      totalCalls: 0,
      averageTimeMs: 0,
      p95Ms: 0,
      p99Ms: 0,
      rps: 0,
      resetAt: new Date().toISOString(),
      topQueries: [],
    },
  };
}
