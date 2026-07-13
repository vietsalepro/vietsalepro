// ============================================================
// BILLING WEBHOOKS EDGE FUNCTION
// Basejump reference: Section 3.6 (webhook handler)
// Routes incoming provider webhooks to provider-specific handlers.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { decodeBase64 } from 'https://deno.land/std@0.177.0/encoding/base64.ts';

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

const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};

const constantTimeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  return crypto.subtle.timingSafeEqual(a, b);
};

async function stripeWebhookKey(secret: string): Promise<Uint8Array> {
  // ponytail: Stripe webhook secrets are whsec_<base64-key>; decode to raw HMAC key.
  const prefix = 'whsec_';
  if (secret.startsWith(prefix)) {
    return decodeBase64(secret.slice(prefix.length));
  }
  return new TextEncoder().encode(secret);
}

async function verifyStripeSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    await stripeWebhookKey(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const parts = signature.split(',').reduce((acc, part) => {
    const [key, value] = part.trim().split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;

  // ponytail: reject events older than 5 minutes to limit replay window.
  if (Date.now() - Number(timestamp) * 1000 > 5 * 60 * 1000) return false;

  const signedPayload = `${timestamp}.${body}`;
  const computed = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload)));
  return constantTimeEqual(computed, hexToBytes(v1));
}

async function handleStripeWebhook(req: Request, _admin: ReturnType<typeof createClient>): Promise<unknown> {
  const signature = req.headers.get('stripe-signature') || '';
  const body = await req.text();
  if (!signature) {
    return { success: false, message: 'Missing stripe-signature' };
  }
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secret) {
    return { success: false, message: 'Missing STRIPE_WEBHOOK_SECRET' };
  }
  const valid = await verifyStripeSignature(body, signature, secret);
  if (!valid) {
    return { success: false, message: 'Invalid stripe-signature' };
  }
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
