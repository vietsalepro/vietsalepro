import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { checkIsSystemAdmin, checkIsTenantAdmin } from '../_shared/permissions.ts';

// Sub-Phase 5.1: Send invitation email with accept link.
// Body: { tenant_id, email, role, token, invitation_id? }
// Requires RESEND_API_KEY in Supabase secrets to actually deliver email; otherwise returns
// emailProviderConfigured=false so the UI can show the fallback link.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IP_RATE_LIMIT_WINDOW_MS = 60_000;
const IP_RATE_LIMIT_MAX = 10;
const TENANT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1_000;
const TENANT_RATE_LIMIT_MAX = 50;
const EMAIL_REGEX = /^[^\s@]+@[^\s@\.]+\.[^\s@]+$/;

const getClientIp = (req: Request): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '0.0.0.0';
};

const isValidIp = (ip: string): boolean => {
  return /^((\d{1,3}\.){3}\d{1,3}|([0-9a-fA-F:]+))$/.test(ip);
};

const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(email);

const jsonResponse = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

const escapeHtml = (s: string): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFrom = Deno.env.get('RESEND_FROM') || 'VietSales Pro <support@vietsalepro.com>';
    const appBaseUrlTemplate = Deno.env.get('APP_BASE_URL') || 'https://{subdomain}.vietsalepro.com';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const rawIp = getClientIp(req);
    const ip = isValidIp(rawIp) ? rawIp : '0.0.0.0';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    const body = await req.json();
    const { tenant_id, email, role, token: invitationToken, invitation_id } = body as {
      tenant_id?: string;
      email?: string;
      role?: string;
      token?: string;
      invitation_id?: string;
    };

    if (!tenant_id || typeof tenant_id !== 'string') {
      return jsonResponse({ error: 'tenant_id không hợp lệ' }, 400);
    }
    if (!email || typeof email !== 'string') {
      return jsonResponse({ error: 'Email không hợp lệ' }, 400);
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return jsonResponse({ error: 'Email không hợp lệ' }, 400);
    }
    if (!role || typeof role !== 'string') {
      return jsonResponse({ error: 'Vai trò không hợp lệ' }, 400);
    }

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, subdomain, name, white_label')
      .eq('id', tenant_id)
      .maybeSingle();
    if (tenantError) throw tenantError;
    if (!tenant) {
      return jsonResponse({ error: 'Tenant không tồn tại' }, 404);
    }

    const isSystemAdmin = await checkIsSystemAdmin(supabaseAdmin, user.id);
    if (!isSystemAdmin && !(await checkIsTenantAdmin(supabaseAdmin, tenant_id, user.id))) {
      return jsonResponse({ error: 'Chỉ admin/owner của tenant hoặc system admin được gửi lời mời' }, 403);
    }

    const ipWindowStart = new Date(Date.now() - IP_RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: ipCount, error: ipCountError } = await supabaseAdmin
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('action', 'send_invitation_email')
      .gte('window_start', ipWindowStart);
    if (ipCountError) throw ipCountError;
    if ((ipCount ?? 0) >= IP_RATE_LIMIT_MAX) {
      return jsonResponse({ error: 'Rate limit exceeded: 10 requests per minute' }, 429);
    }

    const tenantWindowStart = new Date(Date.now() - TENANT_RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: tenantCount, error: tenantCountError } = await supabaseAdmin
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
      .eq('action', 'send_invitation_email')
      .gte('window_start', tenantWindowStart);
    if (tenantCountError) throw tenantCountError;
    if ((tenantCount ?? 0) >= TENANT_RATE_LIMIT_MAX) {
      return jsonResponse({ error: 'Rate limit exceeded: 50 invitation emails per hour for this tenant' }, 429);
    }

    const { error: logError } = await supabaseAdmin.from('rate_limit_logs').insert({
      ip_address: ip,
      tenant_id,
      action: 'send_invitation_email',
      window_start: new Date().toISOString(),
    });
    if (logError) throw logError;

    const finalToken = invitationToken || crypto.randomUUID();
    const subdomain = tenant.subdomain || 'app';
    const baseUrl = appBaseUrlTemplate.replace('{subdomain}', subdomain);
    const acceptUrl = `${baseUrl}/admin/invitations/accept?token=${encodeURIComponent(finalToken)}`;
    const tenantName = (tenant.white_label as { brandName?: string } | null)?.brandName || tenant.name || 'VietSales Pro';

    let emailProviderConfigured = false;
    let emailId: string | null = null;

    if (resendApiKey) {
      const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6;max-width:640px;margin:0 auto">
          <p>Xin chào,</p>
          <p>Bạn được mời tham gia <strong>${escapeHtml(tenantName)}</strong> với vai trò <strong>${escapeHtml(role)}</strong>.</p>
          <p>Nhấn vào liên kết bên dưới để chấp nhận lời mời:</p>
          <p>
            <a href="${escapeHtml(acceptUrl)}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">
              Chấp nhận lời mời
            </a>
          </p>
          <p style="color:#6b7280;font-size:12px">Liên kết có hiệu lực trong 7 ngày. Nếu bạn không mong đợi lời mời này, vui lòng bỏ qua email.</p>
        </div>
      `;

      const resendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [normalizedEmail],
          subject: `Lời mời tham gia ${tenantName}`,
          html,
        }),
      });

      const resendData = await resendResp.json().catch(() => ({}));
      if (!resendResp.ok) {
        return jsonResponse({ error: 'Gửi email thất bại', detail: resendData }, 502);
      }
      emailProviderConfigured = true;
      emailId = resendData?.id ?? null;
    }

    return jsonResponse({
      success: true,
      emailProviderConfigured,
      acceptUrl,
      emailId,
      invitation_id: invitation_id || null,
    }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('send-invitation-email error:', { message, timestamp: new Date().toISOString() });
    return jsonResponse({ error: message || 'Lỗi không xác định' }, 500);
  }
});
