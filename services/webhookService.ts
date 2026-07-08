import { supabase } from '../lib/supabase';
import { TenantWebhook, WebhookDelivery, WebhookDeliveryList } from '../types/tenant';

const mapWebhookFromDB = (row: any): TenantWebhook => ({
  id: row.id,
  tenantId: row.tenantId ?? row.tenant_id,
  name: row.name,
  url: row.url,
  events: row.events ?? [],
  secret: row.secret,
  status: row.status,
  createdBy: row.createdBy ?? row.created_by,
  createdAt: row.createdAt ?? row.created_at,
  updatedAt: row.updatedAt ?? row.updated_at,
});

const mapDeliveryAttempt = (row: any) => ({
  attemptedAt: row.attempted_at ?? row.attemptedAt,
  httpStatus: row.http_status ?? row.httpStatus,
  errorMessage: row.error_message ?? row.errorMessage,
});

const mapDeliveryFromDB = (row: any): WebhookDelivery => ({
  id: row.id,
  webhookId: row.webhookId ?? row.webhook_id,
  tenantId: row.tenantId ?? row.tenant_id,
  eventType: row.eventType ?? row.event_type,
  payload: row.payload,
  idempotencyKey: row.idempotencyKey ?? row.idempotency_key,
  status: row.status,
  httpStatus: row.httpStatus ?? row.http_status,
  responseBody: row.responseBody ?? row.response_body,
  errorMessage: row.errorMessage ?? row.error_message,
  attemptCount: row.attemptCount ?? row.attempt_count ?? 0,
  maxAttempts: row.maxAttempts ?? row.max_attempts ?? 5,
  attemptedAt: row.attemptedAt ?? row.attempted_at,
  deliveredAt: row.deliveredAt ?? row.delivered_at,
  nextRetryAt: row.nextRetryAt ?? row.next_retry_at,
  attemptLog: (row.attemptLog ?? row.attempt_log ?? []).map(mapDeliveryAttempt),
  createdAt: row.createdAt ?? row.created_at,
  updatedAt: row.updatedAt ?? row.updated_at,
});

export async function getTenantWebhooks(tenantId: string): Promise<TenantWebhook[]> {
  const { data, error } = await supabase.rpc('list_tenant_webhooks', { p_tenant_id: tenantId });
  if (error) throw error;
  return (data || []).map(mapWebhookFromDB);
}

export async function createTenantWebhook(
  tenantId: string,
  name: string,
  url: string,
  events: string[],
  secret?: string
): Promise<TenantWebhook> {
  const { data, error } = await supabase.rpc('create_tenant_webhook', {
    p_tenant_id: tenantId,
    p_name: name,
    p_url: url,
    p_events: events,
    p_secret: secret || null,
  });
  if (error) throw error;
  return mapWebhookFromDB(data);
}

export async function updateTenantWebhook(
  webhookId: string,
  updates: {
    name?: string;
    url?: string;
    events?: string[];
    secret?: string;
    status?: 'active' | 'paused';
  }
): Promise<TenantWebhook> {
  const { data, error } = await supabase.rpc('update_tenant_webhook', {
    p_webhook_id: webhookId,
    p_name: updates.name ?? null,
    p_url: updates.url ?? null,
    p_events: updates.events ?? null,
    p_secret: updates.secret ?? null,
    p_status: updates.status ?? null,
  });
  if (error) throw error;
  return mapWebhookFromDB(data);
}

export async function deleteTenantWebhook(webhookId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_tenant_webhook', { p_webhook_id: webhookId });
  if (error) throw error;
}

export async function getWebhookDeliveries(
  webhookId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<WebhookDeliveryList> {
  const { data, error } = await supabase.rpc('list_webhook_deliveries', {
    p_webhook_id: webhookId,
    p_limit: options.limit ?? 50,
    p_offset: options.offset ?? 0,
  });
  if (error) throw error;
  return {
    data: (data?.data || []).map(mapDeliveryFromDB),
    count: data?.count ?? 0,
  };
}

export async function triggerWebhookEvent(
  tenantId: string,
  eventType: string,
  payload?: any
): Promise<{ enqueued: number; deliveries?: any[] }> {
  const { data, error } = await supabase.rpc('trigger_webhook_event', {
    p_tenant_id: tenantId,
    p_event_type: eventType,
    p_payload: payload || {},
  });
  if (error) throw error;
  return data || { enqueued: 0, deliveries: [] };
}

export async function retryWebhookDelivery(deliveryId: string): Promise<WebhookDelivery> {
  const { data, error } = await supabase.rpc('retry_webhook_delivery', { p_delivery_id: deliveryId });
  if (error) throw error;
  return mapDeliveryFromDB(data);
}
