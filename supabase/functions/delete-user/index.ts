// supabase/functions/delete-user/index.ts
// FIX [5.7]: Edge Function xoá auth user nếu không còn membership/ownership nào khác

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { checkIsSystemAdmin } from '../_shared/permissions.ts';

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

    // Caller authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing Authorization header' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return jsonResponse({ error: 'Invalid token' }, 401);

    // System admin check
    const isAdmin = await checkIsSystemAdmin(supabaseAdmin, user.id);
    if (!isAdmin) return jsonResponse({ error: 'Only system admins can delete users' }, 403);

    const body = await req.json();
    const { user_id } = body;
    if (!user_id || typeof user_id !== 'string') {
      return jsonResponse({ error: 'user_id is required' }, 400);
    }

    // Check 1: User is not a system admin
    const { data: isSystemAdmin } = await supabaseAdmin
      .from('system_admins')
      .select('user_id')
      .eq('user_id', user_id)
      .maybeSingle();
    if (isSystemAdmin) {
      return jsonResponse({ error: 'Cannot delete a system admin. Use remove-system-admin first.' }, 403);
    }

    // Check 2: User has no active memberships
    const { count: membershipCount } = await supabaseAdmin
      .from('tenant_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);
    if (membershipCount && membershipCount > 0) {
      return jsonResponse({ error: `User still has ${membershipCount} active membership(s). Remove them first.` }, 403);
    }

    // Check 3: User is not an owner of any tenant
    const { count: ownershipCount } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user_id);
    if (ownershipCount && ownershipCount > 0) {
      return jsonResponse({ error: `User is owner of ${ownershipCount} tenant(s). Transfer ownership first.` }, 403);
    }

    // Delete auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (deleteError) throw deleteError;

    // Audit log
    await supabaseAdmin.from('app_audit_log').insert({
      user_id: user.id,
      table_name: 'auth.users',
      record_id: user_id,
      action: 'USER_DELETE',
      new_data: { deleted_user_id: user_id },
    });

    return jsonResponse({ success: true, userId: user_id }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});