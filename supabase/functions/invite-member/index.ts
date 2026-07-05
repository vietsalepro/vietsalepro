import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const ROLES = new Set(['admin', 'cashier', 'inventory_manager', 'accountant']);

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
      .eq('action', 'invite_member')
      .gte('window_start', windowStart);

    if (countError) throw countError;
    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return jsonResponse({ error: 'Rate limit exceeded: 10 requests per minute' }, 429);
    }

    const { error: logError } = await supabaseAdmin.from('rate_limit_logs').insert({
      ip_address: ip,
      action: 'invite_member',
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

    // Request body.
    const body = await req.json();
    const { tenant_id, email, role } = body;

    if (!tenant_id || typeof tenant_id !== 'string') {
      return jsonResponse({ error: 'tenant_id không hợp lệ' }, 400);
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return jsonResponse({ error: 'Email không hợp lệ' }, 400);
    }
    if (!role || typeof role !== 'string' || !ROLES.has(role)) {
      return jsonResponse({ error: 'Vai trò không hợp lệ' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Tenant + admin check.
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, subdomain, status')
      .eq('id', tenant_id)
      .maybeSingle();
    if (tenantError) throw tenantError;
    if (!tenant) {
      return jsonResponse({ error: 'Tenant không tồn tại' }, 404);
    }
    if (tenant.status !== 'active') {
      return jsonResponse({ error: 'Tenant không hoạt động' }, 403);
    }

    const { data: adminMembership, error: adminError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (adminError) throw adminError;
    if (!adminMembership) {
      return jsonResponse({ error: 'Chỉ admin của tenant được mời nhân viên' }, 403);
    }

    // Subscription limit check.
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('tenant_subscriptions')
      .select('max_users')
      .eq('tenant_id', tenant_id)
      .maybeSingle();
    if (subError) throw subError;
    if (!subscription) {
      return jsonResponse({ error: 'Không tìm thấy subscription cho tenant' }, 400);
    }

    const { count: memberCount, error: memberCountError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id);
    if (memberCountError) throw memberCountError;
    if ((memberCount ?? 0) >= subscription.max_users) {
      return jsonResponse({ error: 'Đã đạt giới hạn số user của gói dịch vụ' }, 403);
    }

    // Find user by email via Auth Admin API (auth schema is not exposed through PostgREST).
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) throw listError;
    const existingUser = users?.users.find((u) => u.email === normalizedEmail);

    let targetUserId: string;

    if (existingUser) {
      // Existing user: ensure not already a member of this tenant.
      targetUserId = existingUser.id as string;
      const { data: existingMembership, error: existingMembershipError } = await supabaseAdmin
        .from('tenant_memberships')
        .select('id')
        .eq('tenant_id', tenant_id)
        .eq('user_id', targetUserId)
        .maybeSingle();
      if (existingMembershipError) throw existingMembershipError;
      if (existingMembership) {
        return jsonResponse({ error: 'User đã là thành viên của tenant này' }, 409);
      }
    } else {
      // New user: create with a random temporary password (never stored or logged).
      const tempPassword = crypto.randomUUID();
      const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: false,
      });
      if (createUserError) {
        if (createUserError.message.toLowerCase().includes('already')) {
          return jsonResponse({ error: 'Email đã được sử dụng' }, 409);
        }
        throw createUserError;
      }
      const newUser = createUserData.user;
      if (!newUser) {
        throw new Error('Tạo user thất bại');
      }
      targetUserId = newUser.id;

      // Generate recovery link pointing to the tenant subdomain.
      // ponytail: generateLink returns the link; the project assumes Supabase Auth's default
      // email provider handles delivery. If email is not received, verify the project's
      // Auth email provider / SMTP settings or add a custom send-email hook.
      // In staging without email provider, we continue so the admin can set the password manually.
      const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: normalizedEmail,
        options: { redirectTo: `https://${tenant.subdomain}.vietsalepro.com/set-password` },
      });
      if (linkError) {
        console.warn('generateLink failed for new user:', linkError.message);
      }
    }

    // Add membership.
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .insert({
        tenant_id,
        user_id: targetUserId,
        role,
        invited_by: user.id,
      })
      .select()
      .single();
    if (membershipError) throw membershipError;

    // Manual audit log (trigger not attached yet; include IP and user agent).
    const { error: auditError } = await supabaseAdmin.from('app_audit_log').insert({
      tenant_id,
      user_id: user.id,
      table_name: 'tenant_memberships',
      record_id: membership.id as string,
      action: 'INSERT',
      new_data: membership,
      ip_address: ip,
      user_agent: req.headers.get('user-agent'),
    });
    if (auditError) throw auditError;

    return jsonResponse({ success: true, userId: targetUserId }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Unknown error');
    return jsonResponse({ error: message }, 500);
  }
});
