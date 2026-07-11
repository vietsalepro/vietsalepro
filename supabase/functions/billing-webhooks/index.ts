// ============================================================
// BILLING WEBHOOKS EDGE FUNCTION
// Basejump reference: Section 3.6 (webhook handler)
// Routes incoming provider webhooks to provider-specific handlers.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

function jsonResponse(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function isValidProvider(name: string): name is 'stripe' | 'momo' | 'vnpay' | 'bank_transfer' {
  return ['stripe', 'momo', 'vnpay', 'bank_transfer'].includes(name);
}

async function handleStripeWebhook(req: Request, _admin: ReturnType<typeof createClient>): Promise<unknown> {
  // ponytail: real signature verification needs STRIPE_WEBHOOK_SECRET and crypto.subtle.
  const signature = req.headers.get('stripe-signature') || '';
  const body = await req.text();
  if (!signature) {
    return { success: false, message: 'Missing stripe-signature' };
  }
  // TODO: verify signature with crypto.subtle + STRIPE_WEBHOOK_SECRET
  return { success: true, provider: 'stripe', event: 'stripe.webhook.received' };
}

async function handleMomoWebhook(req: Request): Promise<unknown> {
  const body = await req.json().catch(() => ({}));
  return {
    success: body?.resultCode === 0,
    provider: 'momo',
    event: body?.resultCode === 0 ? 'payment.success' : 'payment.failed',
  };
}

async function handleVNPayWebhook(req: Request): Promise<unknown> {
  const body = await req.json().catch(() => ({}));
  return {
    success: body?.vnp_ResponseCode === '00',
    provider: 'vnpay',
    event: body?.vnp_ResponseCode === '00' ? 'payment.success' : 'payment.failed',
  };
}

async function handleBankTransferWebhook(req: Request): Promise<unknown> {
  const body = await req.json().catch(() => ({}));
  return {
    success: true,
    provider: 'bank_transfer',
    event: body?.status || 'pending',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const url = new URL(req.url);
  const provider = url.searchParams.get('provider') || '';
  if (!isValidProvider(provider)) {
    return jsonResponse({ error: `Unsupported provider: ${provider}` }, 400);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let result: unknown;
    switch (provider) {
      case 'stripe':
        result = await handleStripeWebhook(req, admin);
        break;
      case 'momo':
        result = await handleMomoWebhook(req);
        break;
      case 'vnpay':
        result = await handleVNPayWebhook(req);
        break;
      case 'bank_transfer':
        result = await handleBankTransferWebhook(req);
        break;
    }

    return jsonResponse({ success: true, provider, result }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('billing-webhooks error:', message);
    return jsonResponse({ error: message, provider }, 500);
  }
});
