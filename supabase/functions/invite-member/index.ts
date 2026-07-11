import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IP_RATE_LIMIT_WINDOW_MS = 60_000;
const IP_RATE_LIMIT_MAX = 10;
const TENANT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const TENANT_RATE_LIMIT_MAX = 50;
const ROLES = new Set(['admin', 'cashier', 'inventory_manager', 'accountant']);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getClientIp = (req: Request): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '0.0.0.0';
};

const isValidIp = (ip: string): boolean => {
  // ponytail: quick regex check; INET will reject anything that slips through.
  return /^((\d{1,3}\.){3}\d{1,3}|([0-9a-fA-F:]+))$/.test(ip);
};

const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(email);

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
    if (!email || typeof email !== 'string') {
      return jsonResponse({ error: 'Email không hợp lệ' }, 400);
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return jsonResponse({ error: 'Email không hợp lệ' }, 400);
    }
    if (!role || typeof role !== 'string' || !ROLES.has(role)) {
      return jsonResponse({ error: 'Vai trò không hợp lệ' }, 400);
    }

    // Tenant lookup.
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, subdomain, status')
      .eq('id', tenant_id)
      .maybeSingle();
    if (tenantError) throw tenantError;
    if (!tenant) {
      return jsonResponse({ error: 'Tenant không tồn tại' }, 404);
    }
    // FIX [4.8]: Allow trial tenants to invite members (đồng bộ với trigger check_tenant_limits)
    if (!['active', 'trial'].includes(tenant.status)) {
      return jsonResponse({ error: 'Tenant không hoạt động hoặc đã hết hạn dùng thử' }, 403);
    }

    // Rate limiting: IP (10/min) and tenant (50/hour).
    const ipWindowStart = new Date(Date.now() - IP_RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: ipCount, error: ipCountError } = await supabaseAdmin
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('action', 'invite_member')
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
      .eq('action', 'invite_member')
      .gte('window_start', tenantWindowStart);
    if (tenantCountError) throw tenantCountError;
    if ((tenantCount ?? 0) >= TENANT_RATE_LIMIT_MAX) {
      return jsonResponse({ error: 'Rate limit exceeded: 50 invites per hour for this tenant' }, 429);
    }

    const { error: logError } = await supabaseAdmin.from('rate_limit_logs').insert({
      ip_address: ip,
      tenant_id,
      action: 'invite_member',
      window_start: new Date().toISOString(),
    });
    if (logError) throw logError;

    // Caller authorization: system admin or tenant admin.
    const { data: adminRow, error: adminError } = await supabaseAdmin
      .from('system_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (adminError) throw adminError;

    if (!adminRow) {
      const { data: tenantAdmin, error: tenantAdminError } = await supabaseAdmin
        .from('tenant_memberships')
        .select('id')
        .eq('tenant_id', tenant_id)
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (tenantAdminError) throw tenantAdminError;
      if (!tenantAdmin) {
        return jsonResponse({ error: 'Chỉ admin của tenant hoặc system admin được mời nhân viên' }, 403);
      }
    }

    // Subscription limit check: only pending/active members count against the seat cap.
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
      .eq('tenant_id', tenant_id)
      .in('status', ['pending', 'active']);
    if (memberCountError) throw memberCountError;
    if ((memberCount ?? 0) >= subscription.max_users) {
      return jsonResponse({ error: 'Đã đạt giới hạn số user của gói dịch vụ' }, 403);
    }

    // Find user by email via SECURITY DEFINER RPC (auth schema is not exposed over PostgREST).
    const { data: userRows, error: userRowError } = await supabaseAdmin.rpc(
      'get_user_by_email',
      { p_email: normalizedEmail }
    );
    if (userRowError) throw userRowError;
    const userRow = userRows && Array.isArray(userRows) && userRows.length > 0 ? userRows[0] : null;

    let targetUserId: string;
    let isNewUser = false;
    let emailProviderConfigured: boolean | undefined;
    let existingUserLink: string | null = null;

    if (userRow) {
      // Existing user: ensure not already a member of this tenant.
      targetUserId = userRow.id as string;
      const { data: existingMembership, error: existingMembershipError } = await supabaseAdmin
        .from('tenant_memberships')
        .select('id')
        .eq('tenant_id', tenant_id)
        .eq('user_id', targetUserId)
        .maybeSingle();
      if (existingMembershipError) throw existingMembershipError;
      if (existingMembership) {
        return jsonResponse({ error: 'already_member' }, 409);
      }

      // FIX [4.5]: Generate recovery link for existing user so they can set password / login
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: normalizedEmail,
        options: { redirectTo: `https://${tenant.subdomain}.vietsalepro.com/login` },
      });
      if (linkError) {
        console.warn('generateLink failed for existing user:', linkError.message);
      }
      // Store the link to return in response (used by internal reset flow)
      existingUserLink = linkData?.properties?.action_link ?? null;
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
          // ponytail: race guard - another request created the user between our query and insert.
          // Re-query and continue as an existing user; if it is already a member we will 409 below.
          const { data: raceUsers } = await supabaseAdmin.rpc(
            'get_user_by_email',
            { p_email: normalizedEmail }
          );
          const raceUser = raceUsers && Array.isArray(raceUsers) && raceUsers.length > 0 ? raceUsers[0] : null;
          if (!raceUser) {
            throw new Error('Tạo user thất bại');
          }
          targetUserId = raceUser.id as string;
          const { data: existingMembership, error: existingMembershipError } = await supabaseAdmin
            .from('tenant_memberships')
            .select('id')
            .eq('tenant_id', tenant_id)
            .eq('user_id', targetUserId)
            .maybeSingle();
          if (existingMembershipError) throw existingMembershipError;
          if (existingMembership) {
            return jsonResponse({ error: 'already_member' }, 409);
          }
        } else {
          throw createUserError;
        }
      } else {
        const newUser = createUserData.user;
        if (!newUser) {
          throw new Error('Tạo user thất bại');
        }
        targetUserId = newUser.id;
        isNewUser = true;

        // Generate invite link pointing to the tenant subdomain.
        // ponytail: new users have never signed in, so 'invite' (not 'recovery') is the correct
        // Supabase Auth link type. generateLink returns the link; the project assumes Supabase Auth's
        // default email provider handles delivery. If email is not received, verify the project's
        // Auth email provider / SMTP settings or add a custom send-email hook.
        // In staging without email provider, we continue so the admin can set the password manually.
        const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'invite',
          email: normalizedEmail,
          options: { redirectTo: `https://${tenant.subdomain}.vietsalepro.com/set-password` },
        });
        emailProviderConfigured = !linkError;
        if (linkError) {
          console.warn('generateLink failed for new user:', linkError.message);
        }
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

    const response: Record<string, unknown> = { success: true, userId: targetUserId };
    if (isNewUser) {
      response.emailProviderConfigured = emailProviderConfigured ?? false;
    }
    if (existingUserLink) {
      response.existingUserLink = existingUserLink;
    }
    return jsonResponse(response, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Unknown error');
    // ponytail: map known business-rule exceptions to 4xx so the UI shows a useful
    // message instead of the generic "Edge Function returned a non-2xx status code".
    if (message.includes('Đã đạt giới hạn')) {
      return jsonResponse({ error: message }, 403);
    }
    if (
      message.includes('Tenant không hoạt động') ||
      message.includes('Không tìm thấy subscription') ||
      message.includes('already_member') ||
      message.includes('Không thể xóa') ||
      message.includes('Không thể hạ')
    ) {
      return jsonResponse({ error: message }, 400);
    }
    return jsonResponse({ error: message }, 500);
  }
});
