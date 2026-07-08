import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { encodeToBase64 } from 'https://deno.land/std@0.177.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

const jsonResponse = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

const signPayload = async (secret: string, body: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return encodeToBase64(new Uint8Array(signature));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('WEBHOOK_DELIVERY_SECRET');

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Auth: internal secret (cron/scheduler) or service role.
    const internalSecret = req.headers.get('X-Internal-Secret');
    const isInternal = !!webhookSecret && internalSecret === webhookSecret;
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
      const url = d.url;
      const secret = d.secret;
      const payload = d.payload || {};
      const eventType = d.eventType;
      const idempotencyKey = d.idempotencyKey;

      const body = JSON.stringify({
        event: eventType,
        idempotency_key: idempotencyKey,
        timestamp: new Date().toISOString(),
        data: payload,
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'VietSales-Pro-Webhook/1.0',
        'X-Webhook-Event': eventType,
        'X-Webhook-Idempotency-Key': idempotencyKey,
      };

      if (secret) {
        try {
          headers['X-Webhook-Signature'] = await signPayload(secret, body);
        } catch (e) {
          const err = e instanceof Error ? e.message : 'signature_failed';
          await supabaseAdmin.rpc('mark_webhook_delivery', {
            p_delivery_id: deliveryId,
            p_status: 'failed',
            p_http_status: null,
            p_response_body: null,
            p_error_message: 'Không thể ký payload: ' + err,
          });
          results.push({ id: deliveryId, status: 'failed', error: err });
          continue;
        }
      }

      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers,
          body,
        });

        const responseText = await resp.text().catch(() => '');
        const isSuccess = resp.status >= 200 && resp.status < 300;

        const markResult = await supabaseAdmin.rpc('mark_webhook_delivery', {
          p_delivery_id: deliveryId,
          p_status: isSuccess ? 'delivered' : 'failed',
          p_http_status: resp.status,
          p_response_body: responseText,
          p_error_message: isSuccess ? null : `HTTP ${resp.status}`,
        });
        if (markResult.error) throw markResult.error;

        results.push({ id: deliveryId, status: isSuccess ? 'delivered' : 'failed', httpStatus: resp.status });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown fetch error';
        await supabaseAdmin.rpc('mark_webhook_delivery', {
          p_delivery_id: deliveryId,
          p_status: 'failed',
          p_http_status: null,
          p_response_body: null,
          p_error_message: message,
        });
        results.push({ id: deliveryId, status: 'failed', error: message });
      }
    }

    return jsonResponse({ processed: results.length, results }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook delivery worker error:', err);
    return jsonResponse({ error: message }, 500);
  }
});
