import { supabase } from '../lib/supabase';
import {
  BillingReminderConfig,
  BillingReminderLog,
  PendingReminder,
} from '../types/billing';

const mapConfigFromDB = (value: any): BillingReminderConfig => ({
  enabled: value?.enabled ?? true,
  milestones: [...new Set((value?.milestones ?? [7, 3, 1]) as number[])].sort((a, b) => a - b),
  sendTime: value?.send_time ?? '09:00',
  functionUrl: value?.function_url ?? '',
  serviceRoleKey: value?.service_role_key ?? '',
});

const mapLogFromDB = (row: any): BillingReminderLog => ({
  id: row.id,
  invoiceId: row.invoice_id,
  milestone: row.milestone,
  dueDate: row.due_date,
  sentAt: row.sent_at,
  status: row.status,
  error: row.error,
  createdAt: row.created_at,
});

const mapPendingReminderFromDB = (row: any): PendingReminder => ({
  invoiceId: row.invoice_id,
  milestone: row.milestone,
  dueDate: row.due_date,
});

export async function getBillingReminderConfig(): Promise<BillingReminderConfig> {
  const { data, error } = await supabase.rpc('get_billing_reminder_config');
  if (error) throw error;
  return mapConfigFromDB(data);
}

export async function setBillingReminderConfig(
  config: BillingReminderConfig
): Promise<BillingReminderConfig> {
  const { data, error } = await supabase.rpc('set_billing_reminder_config', {
    p_enabled: config.enabled,
    p_milestones: config.milestones,
    p_send_time: config.sendTime,
    p_function_url: config.functionUrl,
    p_service_role_key: config.serviceRoleKey,
  });
  if (error) throw error;
  return mapConfigFromDB(data);
}

export async function getPendingBillingReminders(): Promise<PendingReminder[]> {
  const { data, error } = await supabase.rpc('get_pending_billing_reminders');
  if (error) throw error;
  return (data || []).map(mapPendingReminderFromDB);
}

export async function sendBillingReminders(): Promise<{
  sent: number;
  skipped: number;
  error?: string;
}> {
  const { data, error } = await supabase.rpc('send_billing_reminders');
  if (error) throw error;
  return {
    sent: data?.sent ?? 0,
    skipped: data?.skipped ?? 0,
    error: data?.error || undefined,
  };
}

export async function getBillingReminderLogs(): Promise<BillingReminderLog[]> {
  const { data, error } = await supabase
    .from('invoice_reminder_logs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapLogFromDB);
}
