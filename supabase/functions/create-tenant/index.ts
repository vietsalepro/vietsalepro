import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESERVED_SUBDOMAINS = new Set(['admin', 'www', 'api', 'app']);
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

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
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    // Rate limiting: 10 requests per minute per IP.
    const { count, error: countError } = await supabaseAdmin
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('action', 'create_tenant')
      .gte('window_start', windowStart);

    if (countError) throw countError;
    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return jsonResponse({ error: 'Rate limit exceeded: 10 requests per minute' }, 429);
    }

    const { error: logError } = await supabaseAdmin.from('rate_limit_logs').insert({
      ip_address: ip,
      action: 'create_tenant',
      window_start: new Date().toISOString(),
    });
    if (logError) throw logError;

    // Caller authentication.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    // System admin check.
    const { data: adminRow, error: adminError } = await supabaseAdmin
      .from('system_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (adminError) throw adminError;
    if (!adminRow) {
      return jsonResponse({ error: 'Only system admins can create tenants' }, 403);
    }

    // Request body.
    const body = await req.json();
    const { name, subdomain, email, plan = 'free', adminPassword } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return jsonResponse({ error: 'Tên cửa hàng không được để trống' }, 400);
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return jsonResponse({ error: 'Email admin không hợp lệ' }, 400);
    }

    const initialPassword =
      typeof adminPassword === 'string' && adminPassword.length >= 6
        ? adminPassword
        : crypto.randomUUID();

    if (typeof adminPassword === 'string' && adminPassword.length < 6) {
      return jsonResponse({ error: 'Mật khẩu admin phải có ít nhất 6 ký tự' }, 400);
    }

    if (!subdomain || typeof subdomain !== 'string') {
      return jsonResponse({ error: 'Subdomain không được để trống' }, 400);
    }

    const s = subdomain.trim().toLowerCase();
    if (s.length < 3 || s.length > 63) {
      return jsonResponse({ error: 'Subdomain phải dài 3-63 ký tự' }, 400);
    }
    if (!/^[a-z0-9-]+$/.test(s) || s.startsWith('-') || s.endsWith('-')) {
      return jsonResponse(
        { error: 'Subdomain chỉ được chứa chữ thường, số và dấu gạch ngang, không được bắt đầu/kết thúc bằng gạch ngang' },
        400
      );
    }
    if (RESERVED_SUBDOMAINS.has(s)) {
      return jsonResponse({ error: 'Subdomain đã được bảo lưu' }, 400);
    }
    if (plan !== 'free' && plan !== 'vip') {
      return jsonResponse({ error: 'Gói dịch vụ không hợp lệ' }, 400);
    }

    // Subdomain uniqueness.
    const { data: existingTenant, error: existsError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('subdomain', s)
      .maybeSingle();
    if (existsError) throw existsError;
    if (existingTenant) {
      return jsonResponse({ error: 'Subdomain đã tồn tại' }, 409);
    }

    // Fetch default plan limits from Plan Builder.
    const { data: limits, error: limitsError } = await supabaseAdmin.rpc(
      'get_default_plan_limit_values',
      { p_plan: plan }
    );
    if (limitsError) throw limitsError;

    const maxUsers = (limits?.max_users as number) ?? (plan === 'vip' ? 999 : 1);
    const maxProducts = (limits?.max_products as number) ?? (plan === 'vip' ? 999999 : 50);
    const maxOrdersPerMonth =
      (limits?.max_orders_per_month as number) ?? (plan === 'vip' ? 999999 : 300);

    // Create admin user.
    const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: initialPassword,
      email_confirm: true,
    });
    if (createUserError) {
      if (createUserError.message.toLowerCase().includes('already')) {
        return jsonResponse({ error: 'Email đã được sử dụng' }, 409);
      }
      throw createUserError;
    }
    const adminUser = createUserData.user;
    if (!adminUser) {
      throw new Error('Tạo user thất bại');
    }

    let tenant: Record<string, unknown>;
    try {
      const { data: tenantData, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .insert({
          name: name.trim(),
          subdomain: s,
          plan,
          owner_id: adminUser.id,
          status: 'active',
        })
        .select()
        .single();
      if (tenantError || !tenantData) throw tenantError ?? new Error('Tạo tenant thất bại');
      tenant = tenantData;

      const { error: subError } = await supabaseAdmin.from('tenant_subscriptions').insert({
        tenant_id: tenant.id as string,
        plan: tenant.plan as string,
        max_users: maxUsers,
        max_products: maxProducts,
        max_orders_per_month: maxOrdersPerMonth,
      });
      if (subError) throw subError;

      const { error: membershipError } = await supabaseAdmin.from('tenant_memberships').insert({
        tenant_id: tenant.id as string,
        user_id: adminUser.id,
        role: 'admin',
      });
      if (membershipError) throw membershipError;

      // Store admin credentials for system admin dashboard lookup.
      const { error: credentialsError } = await supabaseAdmin.from('tenant_credentials').insert({
        tenant_id: tenant.id as string,
        admin_email: adminUser.email as string,
        admin_initial_password: initialPassword,
      });
      if (credentialsError) throw credentialsError;

      // Manual audit log (trigger not attached yet).
      const { error: auditError } = await supabaseAdmin.from('app_audit_log').insert({
        tenant_id: tenant.id as string,
        user_id: adminUser.id,
        table_name: 'tenants',
        record_id: tenant.id as string,
        action: 'INSERT',
        new_data: tenant,
        ip_address: ip,
        user_agent: req.headers.get('user-agent'),
      });
      if (auditError) throw auditError;

      // Best-effort: gửi email credential. Lỗi email không rollback tenant.
      const { error: emailErr } = await supabaseAdmin.functions.invoke('send-template-email', {
        body: {
          template_key: 'tenant_credentials',
          to: adminUser.email,
          variables: {
            shop_name: tenant.name as string,
            shop_url: `https://${tenant.subdomain}.vietsalepro.com/`,
            admin_email: adminUser.email as string,
            admin_password: initialPassword,
          },
        },
      });

      if (emailErr) {
        console.error('Failed to send tenant credentials email:', emailErr);
        await supabaseAdmin.from('app_audit_log').insert({
          tenant_id: tenant.id as string,
          user_id: adminUser.id,
          table_name: 'tenants',
          record_id: tenant.id as string,
          action: 'EMAIL_FAILED',
          new_data: { error: emailErr.message || String(emailErr) },
        }).catch(() => {});
      }
    } catch (e) {
      // ponytail: best-effort cleanup of the orphaned auth user if tenant setup fails.
      await supabaseAdmin.auth.admin.deleteUser(adminUser.id).catch(() => {});
      throw e;
    }

    return jsonResponse(
      {
        tenant,
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          created_at: adminUser.created_at,
        },
        initialPassword,
      },
      201
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
