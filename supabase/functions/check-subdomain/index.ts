import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// EDG-002: this Edge Function is intentionally public (verify_jwt: false) and rate-limited by IP.
// It only reads tenant subdomain availability and writes an audit row per request (EDG-005).
const RESERVED_SUBDOMAINS = new Set(['admin', 'www', 'api', 'app']);
const SUBDOMAIN_REGEX = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isValidSubdomain(s: string): boolean {
  return s.length >= 3 && s.length <= 63 && SUBDOMAIN_REGEX.test(s) && !RESERVED_SUBDOMAINS.has(s);
}

const getClientIp = (req: Request): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '0.0.0.0';
};

const isValidIp = (ip: string): boolean => {
  // ponytail: quick regex check; INET will reject anything that slips through.
  return /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+$/.test(ip);
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const rawIp = getClientIp(req);
    const ip = isValidIp(rawIp) ? rawIp : '0.0.0.0';
    const windowStart = new Date(Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS).toISOString();

    // Rate limiting: 10 requests per fixed minute window per IP.
    const { count, error: countError } = await supabaseAdmin
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('action', 'check_subdomain')
      .gte('window_start', windowStart);

    if (countError) throw countError;
    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return jsonResponse({ error: 'Rate limit exceeded: 10 requests per minute' }, 429);
    }

    const { error: logError } = await supabaseAdmin.from('rate_limit_logs').insert({
      ip_address: ip,
      action: 'check_subdomain',
      window_start: windowStart,
    });
    if (logError) throw logError;

    // Resolve subdomain from GET query or POST body.
    let subdomain: unknown;
    if (req.method === 'GET') {
      const url = new URL(req.url);
      subdomain = url.searchParams.get('subdomain');
    } else if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      subdomain = body.subdomain;
    } else {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    if (!subdomain || typeof subdomain !== 'string' || subdomain.trim().length === 0) {
      return jsonResponse({ error: 'Subdomain không được để trống', available: false }, 400);
    }

    const s = subdomain.trim().toLowerCase();
    if (!isValidSubdomain(s)) {
      if (s.length < 3 || s.length > 63) {
        return jsonResponse({ error: 'Subdomain phải dài 3-63 ký tự', available: false }, 400);
      }
      if (RESERVED_SUBDOMAINS.has(s)) {
        return jsonResponse({ available: false, error: `Subdomain "${s}" thuộc danh sách dự trữ` }, 400);
      }
      return jsonResponse(
        { error: 'Subdomain chỉ được chứa chữ thường, số và dấu gạch ngang, không được bắt đầu/kết thúc bằng gạch ngang', available: false },
        400
      );
    }

    // FIX [6.6]: Exclude archived tenants from subdomain uniqueness check
    const { data: existingTenant, error: existsError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('subdomain', s)
      .not('status', 'eq', 'archived')
      .maybeSingle();

    if (existsError) throw existsError;

    // EDG-005: write an audit row for every public availability check.
    await supabaseAdmin.from('app_audit_log').insert({
      tenant_id: null,
      user_id: null,
      table_name: 'subdomain_checks',
      record_id: null,
      action: 'INSERT',
      new_data: { subdomain: s, available: !existingTenant },
      ip_address: ip,
      user_agent: req.headers.get('user-agent'),
    });

    return jsonResponse({ available: !existingTenant }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
