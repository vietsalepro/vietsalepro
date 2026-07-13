import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { checkIsSystemAdmin, checkIsTenantAdmin } from '../_shared/permissions.ts';
import {
  isValidDomain,
  parseTxtRecords,
  findVerificationToken,
  buildTxtRecord,
} from '../_shared/domain-verification.ts';

const DNS_LOOKUP_TIMEOUT_MS = 10_000;

const corsHeaders = (req: Request) => ({
  'Access-Control-Allow-Origin': req.headers.get('origin') || '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
});

const jsonResponse = (req: Request, data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  });

const getAuthenticatedUser = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  req: Request
): Promise<{ user: { id: string } | null; status?: number; data?: unknown }> => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { user: null, status: 401, data: { error: 'Missing Authorization header' } };
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) {
    return { user: null, status: 401, data: { error: 'Invalid token' } };
  }
  return { user: user as { id: string } };
};

const lookupTxtRecords = async (domain: string): Promise<string[]> => {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=TXT`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DNS_LOOKUP_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`DNS lookup failed: ${res.status}`);
    }
    const json = await res.json();
    return parseTxtRecords(json);
  } finally {
    clearTimeout(timeout);
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const auth = await getAuthenticatedUser(supabaseAdmin, req);
    if (!auth.user) {
      return jsonResponse(req, auth.data, auth.status ?? 401);
    }

    const body = await req.json().catch(() => ({}));
    const { tenant_id, domain, action } = body;

    if (!tenant_id || typeof tenant_id !== 'string') {
      return jsonResponse(req, { error: 'tenant_id không hợp lệ' }, 400);
    }

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, custom_domain, custom_domain_verification_token, custom_domain_verified_at')
      .eq('id', tenant_id)
      .maybeSingle();

    if (tenantError) throw tenantError;
    if (!tenant) {
      return jsonResponse(req, { error: 'Tenant không tồn tại' }, 404);
    }

    const isSystemAdmin = await checkIsSystemAdmin(supabaseAdmin, auth.user.id);
    const isTenantAdmin = await checkIsTenantAdmin(supabaseAdmin, tenant_id, auth.user.id);
    if (!isSystemAdmin && !isTenantAdmin) {
      return jsonResponse(req, { error: 'Chỉ system admin hoặc admin tenant mới được xác minh domain' }, 403);
    }

    const tenantDomain = (tenant.custom_domain || '').trim().toLowerCase();

    if (action === 'token') {
      if (!tenantDomain) {
        return jsonResponse(req, { error: 'Tenant chưa có custom domain. Vui lòng cấu hình domain trước.' }, 400);
      }

      const { data: token, error: tokenError } = await supabaseAdmin.rpc(
        'get_or_create_custom_domain_token',
        { p_tenant_id: tenant_id }
      );
      if (tokenError) throw tokenError;
      if (!token || typeof token !== 'string') {
        return jsonResponse(req, { error: 'Không thể tạo verification token' }, 500);
      }

      return jsonResponse(req, { token, txtRecord: buildTxtRecord(token) }, 200);
    }

    if (action === 'verify') {
      if (!domain || typeof domain !== 'string' || !isValidDomain(domain)) {
        return jsonResponse(req, { error: 'Domain không hợp lệ' }, 400);
      }

      const normalizedDomain = domain.trim().toLowerCase();
      if (tenantDomain !== normalizedDomain) {
        return jsonResponse(
          req,
          { error: 'Domain xác minh không khớp với custom_domain của tenant' },
          400
        );
      }

      const token = tenant.custom_domain_verification_token;
      if (!token) {
        return jsonResponse(req, { error: 'Chưa có verification token. Vui lòng tạo token trước.' }, 400);
      }

      const txtRecords = await lookupTxtRecords(normalizedDomain);
      const prefixedRecord = buildTxtRecord(token);
      const verified = findVerificationToken(txtRecords, token) || txtRecords.includes(prefixedRecord);

      if (verified) {
        const { error: updateError } = await supabaseAdmin
          .from('tenants')
          .update({ custom_domain_verified_at: new Date().toISOString() })
          .eq('id', tenant_id);
        if (updateError) throw updateError;
        return jsonResponse(req, { verified: true, message: 'Domain đã được xác minh' }, 200);
      }

      return jsonResponse(req, { verified: false, message: 'Không tìm thấy TXT record chứa token' }, 200);
    }

    return jsonResponse(req, { error: 'action không hợp lệ (token hoặc verify)' }, 400);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return jsonResponse(req, { error: 'DNS lookup timed out' }, 504);
    }
    // ponytail: do not leak internal error details to the client.
    console.error('verify-domain error:', err);
    return jsonResponse(req, { error: 'Internal server error' }, 500);
  }
});
