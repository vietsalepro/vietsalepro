import { supabase } from '../lib/supabase';
import { CronJobLog } from '../types/tenant';

export async function getCronJobLogs(): Promise<CronJobLog[]> {
  const { data, error } = await supabase
    .from('cron_job_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map(mapCronJobLogFromDB);
}

const mapCronJobLogFromDB = (row: any): CronJobLog => ({
  id: row.id,
  jobName: row.job_name,
  status: row.status,
  startedAt: row.started_at,
  completedAt: row.completed_at ?? undefined,
  details: row.details ?? {},
  errorMessage: row.error_message ?? undefined,
  retryCount: row.retry_count ?? 0,
});
