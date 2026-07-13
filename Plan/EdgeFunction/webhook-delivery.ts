import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { deliverWebhook } from '../_shared/webhookDelivery.ts';

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  return crypto.subtle.timingSafeEqual(aBytes, bBytes);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

const jsonResponse = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('WEBHOOK_DELIVERY_SECRET');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable');
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Auth: internal secret (cron/scheduler) or service role.
    // ponytail: constant-time comparison to avoid leaking the secret length.
    const internalSecret = req.headers.get('X-Internal-Secret') || '';
    const isInternal = !!webhookSecret && constantTimeEqual(internalSecret, webhookSecret);
    if (!isInternal) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return jsonResponse({ error: 'Missing Authorization header' }, 401);
      }
      const token = authHeader.replace('Bearer ', '');
      if (token !== serviceRoleKey) {
        return jsonResponse({ error: 'Chỉ service role hoặc internal secret được gọi worker' }, 403);
      }
    }

    const { data: pending, error: pendingError } = await supabaseAdmin.rpc('get_pending_webhook_deliveries', {
      p_limit: 100,
    });
    if (pendingError) throw pendingError;

    const deliveries = (pending as any[]) || [];
    const results: { id: string; status: string; httpStatus?: number; error?: string }[] = [];

    for (const d of deliveries) {
      const deliveryId = d.id;
      const priorAttemptLog = d.attemptLog || [];
      const priorAttemptCount = d.attemptCount || 0;

      const result = await deliverWebhook({
        url: d.url,
        secret: d.secret,
        eventType: d.eventType,
        idempotencyKey: d.idempotencyKey,
        payload: d.payload || {},
        maxAttempts: d.maxAttempts,
      });
      // result.attemptLog contains ONLY the attempts made in this worker run.
      // priorAttemptLog tracks attempts from previous runs stored in the DB.

      const now = new Date().toISOString();
      // ponytail: direct UPDATE instead of mark_webhook_delivery because the worker
      // performs inline retries and needs to record multiple attempt log entries at once.
      const update: Record<string, unknown> = {
        status: result.status,
        http_status: result.httpStatus,
        response_body: result.responseBody,
        error_message: result.errorMessage,
        attempt_count: priorAttemptCount + result.attemptLog.length,
        attempted_at: now,
        // Inline retries are exhausted in this run; no further scheduling needed.
        next_retry_at: null,
        attempt_log: [...priorAttemptLog, ...result.attemptLog],
        updated_at: now,
      };

      if (result.status === 'delivered') {
        update.delivered_at = result.deliveredAt || now;
      }

      const { data: updatedRows, error: updateError } = await supabaseAdmin
        .from('webhook_deliveries')
        .update(update)
        .eq('id', deliveryId)
        .eq('status', 'pending')
        .select('id');
      if (updateError) throw updateError;
      if (!updatedRows || updatedRows.length === 0) {
        results.push({ id: deliveryId, status: 'skipped', error: 'Delivery đã được xử lý hoặc retry bởi worker khác' });
        continue;
      }

      results.push({
        id: deliveryId,
        status: result.status,
        httpStatus: result.httpStatus,
        error: result.errorMessage,
      });
    }

    return jsonResponse({ processed: results.length, results }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook delivery worker error:', err);
    return jsonResponse({ error: message }, 500);
  }
});
