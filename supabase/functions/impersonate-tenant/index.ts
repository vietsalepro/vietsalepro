import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IMPERSONATION_TTL_MS = 60 * 60 * 1000; // 1 giờ

const jsonResponse = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

const getClientIp = (req: Request): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '0.0.0.0';
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

    // Xác thực caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    // Chỉ system admin được impersonate
    const { data: adminRow, error: adminError } = await supabaseAdmin
      .from('system_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (adminError) throw adminError;
    if (!adminRow) {
      return jsonResponse({ error: 'Chỉ system admin được impersonate' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const { tenant_id } = body;
    if (!tenant_id || typeof tenant_id !== 'string') {
      return jsonResponse({ error: 'tenant_id không hợp lệ' }, 400);
    }

    // Kiểm tra tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, subdomain, status')
      .eq('id', tenant_id)
      .maybeSingle();
    if (tenantError) throw tenantError;
    if (!tenant) {
      return jsonResponse({ error: 'Tenant không tồn tại' }, 404);
    }
    if (tenant.status !== 'active') {
      return jsonResponse({ error: 'Tenant không hoạt động' }, 403);
    }

    // Nếu user đã là thành viên thực sự của tenant thì không impersonate đè lên
    const { data: realMembership, error: realMembershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('user_id', user.id)
      .is('impersonated_by', null)
      .maybeSingle();
    if (realMembershipError) throw realMembershipError;
    if (realMembership) {
      return jsonResponse({ error: 'Bạn đã là thành viên của tenant này, không cần impersonate' }, 409);
    }

    // Dọn phiên impersonate cũ cho user/tenant này (nếu có)
    await supabaseAdmin
      .from('tenant_memberships')
      .delete()
      .eq('tenant_id', tenant_id)
      .eq('user_id', user.id)
      .not('impersonated_by', 'is', null);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + IMPERSONATION_TTL_MS);

    // Tạo membership impersonate
    const { data: membership, error: insertError } = await supabaseAdmin
      .from('tenant_memberships')
      .insert({
        tenant_id,
        user_id: user.id,
        role: 'admin',
        invited_by: user.id,
        impersonated_by: user.id,
        impersonated_at: now.toISOString(),
        impersonated_expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();
    if (insertError) throw insertError;

    // Ghi audit log
    const { error: auditError } = await supabaseAdmin.from('app_audit_log').insert({
      tenant_id,
      table_name: 'tenant_memberships',
      action: 'IMPERSONATE',
      record_id: membership.id,
      user_id: user.id,
      new_data: {
        tenant_id,
        tenant_name: tenant.name,
        tenant_subdomain: tenant.subdomain,
        impersonated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      ip_address: getClientIp(req),
      user_agent: req.headers.get('user-agent'),
    });
    if (auditError) throw auditError;

    return jsonResponse({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
      },
      expires_at: expiresAt.toISOString(),
    }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
