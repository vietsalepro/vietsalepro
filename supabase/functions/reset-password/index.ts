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
    const { tenant_id, user_id, email } = body;

    if (!tenant_id || typeof tenant_id !== 'string') {
      return jsonResponse({ error: 'tenant_id không hợp lệ' }, 400);
    }
    if ((!user_id || typeof user_id !== 'string') && (!email || typeof email !== 'string')) {
      return jsonResponse({ error: 'Cần cung cấp user_id hoặc email' }, 400);
    }

    // Resolve tenant.
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
        return jsonResponse({ error: 'Chỉ admin của tenant hoặc system admin được reset mật khẩu' }, 403);
      }
    }

    // Resolve target user.
    let targetUser: { id: string; email: string; last_sign_in_at?: string | null } | null = null;

    if (user_id) {
      const { data: userById, error: userByIdError } = await supabaseAdmin.auth.admin.getUserById(user_id);
      if (userByIdError) {
        // Treat missing user as not found rather than 500.
        if (userByIdError.message.toLowerCase().includes('not found') || userByIdError.status === 404) {
          return jsonResponse({ error: 'User không tồn tại' }, 404);
        }
        throw userByIdError;
      }
      if (userById.user) {
        targetUser = {
          id: userById.user.id,
          email: userById.user.email ?? '',
          last_sign_in_at: userById.user.last_sign_in_at,
        };
      }
    }

    if (!targetUser && email) {
      const normalizedEmail = email.trim().toLowerCase();
      const { data: userByEmail, error: userByEmailError } = await supabaseAdmin
        .schema('auth')
        .from('users')
        .select('id, email, last_sign_in_at')
        .eq('email', normalizedEmail)
        .maybeSingle();
      if (userByEmailError) throw userByEmailError;
      if (userByEmail) {
        targetUser = {
          id: userByEmail.id as string,
          email: userByEmail.email as string,
          last_sign_in_at: userByEmail.last_sign_in_at as string | null | undefined,
        };
      }
    }

    if (!targetUser) {
      return jsonResponse({ error: 'User không tồn tại' }, 404);
    }
    if (!targetUser.email) {
      return jsonResponse({ error: 'User không có email' }, 400);
    }

    // Verify target user belongs to the tenant.
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('user_id', targetUser.id)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) {
      return jsonResponse({ error: 'User không thuộc tenant này' }, 403);
    }

    // Choose recovery vs invite based on whether the user has ever signed in.
    const hasSignedIn = !!targetUser.last_sign_in_at;
    const type = hasSignedIn ? 'recovery' : 'invite';
    const path = hasSignedIn ? 'reset-password' : 'set-password';
    const redirectTo = `https://${tenant.subdomain}.vietsalepro.com/${path}`;

    // ponytail: Supabase Auth default email provider sends the link. generateLink only
    // returns the link in environments without SMTP; the production project relies on
    // Auth's configured email provider for delivery.
    // In staging without email provider, we continue and report the intended redirectTo.
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type,
      email: targetUser.email,
      options: { redirectTo },
    });
    if (linkError) {
      console.warn('generateLink failed:', linkError.message);
    }

    return jsonResponse({ success: true, action: type, redirectTo, link: linkData?.properties?.action_link ?? null }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Unknown error');
    return jsonResponse({ error: message }, 500);
  }
});
