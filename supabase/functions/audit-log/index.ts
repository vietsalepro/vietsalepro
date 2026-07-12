import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX = 5;
const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX = 10;
const CLEANUP_AGE_MS = 24 * 60 * 60 * 1000;

const RATE_LIMITED_ACTIONS = new Set(['login', 'create_tenant', 'check_subdomain', 'invite_member']);
const AUDIT_ACTIONS = new Set(['INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPERSONATE', 'IMPERSONATE_END']);

const getClientIp = (req: Request): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '0.0.0.0';
};

const isValidIp = (ip: string): boolean => {
  // ponytail: quick regex check; INET will reject anything that slips through.
  return /^((\d{1,3}\.){3}\d{1,3}|([0-9a-fA-F:]+))$/.test(ip);
};

const jsonResponse = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

const getRateLimitConfig = (action: string) => {
  if (action === 'login') {
    return { windowMs: LOGIN_WINDOW_MS, maxAttempts: LOGIN_MAX };
  }
  return { windowMs: DEFAULT_WINDOW_MS, maxAttempts: DEFAULT_MAX };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const type = body?.type;

    if (type === 'audit') {
      const { tenant_id, table_name, action, record_id, user_id, old_data, new_data, user_agent, ip_address } = body;
      if (!tenant_id || typeof tenant_id !== 'string') {
        return jsonResponse({ error: 'tenant_id is required' }, 400);
      }
      if (!table_name || typeof table_name !== 'string') {
        return jsonResponse({ error: 'table_name is required' }, 400);
      }
      if (!action || !AUDIT_ACTIONS.has(action)) {
        return jsonResponse({ error: 'action must be one of INSERT, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, IMPERSONATE, IMPERSONATE_END' }, 400);
      }

      const rawIp = ip_address || getClientIp(req);
      const ip = isValidIp(rawIp) ? rawIp : '0.0.0.0';

      const { error } = await supabaseAdmin.from('app_audit_log').insert({
        tenant_id,
        table_name,
        action,
        record_id: record_id ?? null,
        user_id: user_id ?? null,
        old_data: old_data ?? null,
        new_data: new_data ?? null,
        ip_address: ip,
        user_agent: user_agent ?? req.headers.get('user-agent'),
      });
      if (error) throw error;

      return jsonResponse({ success: true }, 201);
    }

    if (type === 'rate_limit') {
      const { action, ip_address, success } = body;
      if (!action || !RATE_LIMITED_ACTIONS.has(action)) {
        return jsonResponse(
          { error: 'action must be one of login, create_tenant, check_subdomain, invite_member' },
          400
        );
      }

      const rawIp = ip_address || getClientIp(req);
      const ip = isValidIp(rawIp) ? rawIp : '0.0.0.0';
      const { windowMs, maxAttempts } = getRateLimitConfig(action);
      const windowStart = new Date(Date.now() - windowMs).toISOString();

      const { count, error: countError } = await supabaseAdmin
        .from('rate_limit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .eq('action', action)
        .gte('window_start', windowStart);

      if (countError) throw countError;

      if ((count ?? 0) >= maxAttempts) {
        const retryAfterSeconds = Math.ceil(windowMs / 1000);
        return jsonResponse(
          {
            allowed: false,
            error: `Rate limit exceeded: ${maxAttempts} attempts per ${windowMs / 1000}s`,
            retry_after_seconds: retryAfterSeconds,
          },
          429
        );
      }

      // Successful logins don't consume an attempt, but are still blocked during a lockout.
      if (!(action === 'login' && success === true)) {
        const { error: logError } = await supabaseAdmin.from('rate_limit_logs').insert({
          ip_address: ip,
          action,
          window_start: new Date().toISOString(),
        });
        if (logError) throw logError;
      }

      return jsonResponse({ allowed: true, remaining: maxAttempts - (count ?? 0) - 1 }, 200);
    }

    if (type === 'cleanup') {
      const cutoff = new Date(Date.now() - CLEANUP_AGE_MS).toISOString();
      const { error, count } = await supabaseAdmin
        .from('rate_limit_logs')
        .delete({ count: 'exact' })
        .lt('created_at', cutoff);
      if (error) throw error;
      return jsonResponse({ deleted: count ?? 0 }, 200);
    }

    return jsonResponse({ error: 'type must be one of audit, rate_limit, cleanup' }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
