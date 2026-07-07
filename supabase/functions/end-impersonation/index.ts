import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    // Chỉ system admin được kết thúc impersonate
    const { data: adminRow, error: adminError } = await supabaseAdmin
      .from('system_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (adminError) throw adminError;
    if (!adminRow) {
      return jsonResponse({ error: 'Chỉ system admin được kết thúc impersonate' }, 403);
    }

    // Lấy các phiên impersonate đang active của user
    const { data: sessions, error: findError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('id, tenant_id, impersonated_at, impersonated_expires_at')
      .eq('user_id', user.id)
      .not('impersonated_by', 'is', null);
    if (findError) throw findError;

    const now = new Date();
    const ended = (sessions || []).length;

    for (const session of sessions || []) {
      const startedAt = new Date(session.impersonated_at || now);
      const durationSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000);

      const { error: auditError } = await supabaseAdmin.from('app_audit_log').insert({
        tenant_id: session.tenant_id,
        table_name: 'tenant_memberships',
        action: 'IMPERSONATE_END',
        record_id: session.id,
        user_id: user.id,
        old_data: {
          tenant_id: session.tenant_id,
          impersonated_at: session.impersonated_at,
          impersonated_expires_at: session.impersonated_expires_at,
          duration_seconds: durationSeconds,
        },
        ip_address: getClientIp(req),
        user_agent: req.headers.get('user-agent'),
      });
      if (auditError) throw auditError;
    }

    // Xóa các phiên impersonate
    const { error: deleteError } = await supabaseAdmin
      .from('tenant_memberships')
      .delete()
      .eq('user_id', user.id)
      .not('impersonated_by', 'is', null);
    if (deleteError) throw deleteError;

    return jsonResponse({ success: true, ended }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
