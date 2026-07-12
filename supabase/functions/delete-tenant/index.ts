import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { checkIsSystemAdmin, checkIsTenantOwner } from '../_shared/permissions.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getClientIp = (req: Request): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '0.0.0.0';
};

const isValidIp = (ip: string): boolean => {
  return /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+$/.test(ip);
};

const jsonResponse = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

async function softDeleteTenant(supabaseAdmin: any, tenantId: string, userId: string, ip: string) {
  const now = new Date().toISOString();

  // 1. Set tenant status to 'archived' + archived_at
  const { error: updateError } = await supabaseAdmin
    .from('tenants')
    .update({ 
      status: 'archived', 
      archived_at: now,
      updated_at: now,
    })
    .eq('id', tenantId);
  if (updateError) throw updateError;

  // 2. Deactivate all memberships
  const { error: deactivateError } = await supabaseAdmin
    .from('tenant_memberships')
    .update({ is_active: false, status: 'inactive', updated_at: now })
    .eq('tenant_id', tenantId);
  if (deactivateError) throw deactivateError;

  // 3. Audit log
  // ponytail: use standard CRUD action to satisfy app_audit_log CHECK constraint.
  const { error: auditError } = await supabaseAdmin.from('app_audit_log').insert({
    tenant_id: tenantId,
    user_id: userId,
    table_name: 'tenants',
    record_id: tenantId,
    action: 'UPDATE',
    new_data: { status: 'archived', archived_at: now },
    ip_address: ip,
  });
  if (auditError) {
    console.error('Failed to write soft-delete audit log', auditError);
  }

  return { success: true, action: 'soft_delete', tenantId };
}

async function hardDeleteTenant(supabaseAdmin: any, tenantId: string, userId: string, ip: string) {
  // Original hard-delete logic
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .select('id, name, subdomain, owner_id')
    .eq('id', tenantId)
    .maybeSingle();
  if (tenantError) throw tenantError;
  if (!tenant) {
    return jsonResponse({ error: 'Tenant không tồn tại' }, 404);
  }

  // ponytail: never delete the reserved admin subdomain / entry point.
  if (tenant.subdomain === 'admin') {
    return jsonResponse({ error: 'Không được xóa tenant admin' }, 403);
  }

  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from('tenant_memberships')
    .select('user_id')
    .eq('tenant_id', tenantId);
  if (membershipError) throw membershipError;

  const userIds = new Set<string>([
    ...(tenant.owner_id ? [tenant.owner_id] : []),
    ...((memberships || []).map((m) => m.user_id).filter(Boolean) as string[]),
  ]);

  // 1. Remove tenant files from the shared storage bucket.
  const bucket = supabaseAdmin.storage.from('tenant-assets');
  let storageDeleted = 0;
  let storageFailures = 0;
  let offset = 0;
  const limit = 100;
  while (true) {
    const { data: items, error: listError } = await bucket.list(tenantId, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (listError) {
      console.error('Failed to list storage for tenant', tenantId, listError);
      break;
    }
    const files = (items || []).filter((item) => item.id && item.name);
    if (files.length === 0) break;

    const paths = files.map((file) => `${tenantId}/${file.name}`);
    const { error: removeError, data: removed } = await bucket.remove(paths);
    if (removeError) {
      console.error('Failed to remove storage objects', paths, removeError);
      storageFailures += files.length;
    } else {
      storageDeleted += removed?.length ?? files.length;
    }

    if (files.length < limit) break;
    offset += limit;
  }

  // 2. Clean up rows that would otherwise become orphaned
  const orphanTables = ['app_audit_log', 'terms_acceptance'];
  for (const table of orphanTables) {
    const { error: deleteError } = await supabaseAdmin
      .from(table as any)
      .delete()
      .eq('tenant_id', tenantId);
    if (deleteError) {
      console.error(`Failed to delete rows from ${table} for tenant`, tenantId, deleteError);
    }
  }

  // 3. Set session variable to bypass guardrail trigger during cascade
  await supabaseAdmin.rpc('set_config', { 
    p_name: 'app.hard_delete_tenant', 
    p_value: 'true' 
  }).catch(() => {});

  // 4. Delete the tenant row. ON DELETE CASCADE removes business tables.
  const { error: deleteTenantError } = await supabaseAdmin
    .from('tenants')
    .delete()
    .eq('id', tenantId);
  if (deleteTenantError) throw deleteTenantError;

  // 5. Delete auth users that were created for this tenant and have no other tenant.
  let authDeleted = 0;
  let authFailures = 0;
  if (userIds.size > 0) {
    const { data: systemAdmins } = await supabaseAdmin
      .from('system_admins')
      .select('user_id')
      .in('user_id', Array.from(userIds));
    const adminIds = new Set((systemAdmins || []).map((a) => a.user_id));

    for (const userId of userIds) {
      if (adminIds.has(userId)) {
        console.log('Skipping auth delete for system admin', userId);
        continue;
      }

      const [{ count: otherMemberships }, { count: otherOwnerships }] = await Promise.all([
        supabaseAdmin
          .from('tenant_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabaseAdmin
          .from('tenants')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', userId),
      ]);

      if (otherMemberships || otherOwnerships) {
        console.log('Skipping auth delete: user still linked to other tenants', userId);
        continue;
      }

      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        console.error('Failed to delete auth user', userId, authDeleteError);
        authFailures += 1;
      } else {
        authDeleted += 1;
      }
    }
  }

  // 6. Audit log for hard delete
  // ponytail: use standard CRUD action to satisfy app_audit_log CHECK constraint.
  const { error: auditError } = await supabaseAdmin.from('app_audit_log').insert({
    tenant_id: tenantId,
    user_id: userId,
    table_name: 'tenants',
    record_id: tenantId,
    action: 'DELETE',
    new_data: { hard_deleted: true, storageDeleted, authDeleted },
    ip_address: ip,
  });
  if (auditError) {
    console.error('Failed to write hard-delete audit log', auditError);
  }

  return jsonResponse(
    {
      success: true,
      action: 'hard_delete',
      tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
      storageDeleted,
      storageFailures,
      authDeleted,
      authFailures,
    },
    200
  );
}

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

    const { count, error: countError } = await supabaseAdmin
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('action', 'delete_tenant')
      .gte('window_start', windowStart);

    if (countError) throw countError;
    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return jsonResponse({ error: 'Rate limit exceeded: 10 requests per minute' }, 429);
    }

    // ponytail: rate-limit logging must not block the actual tenant delete.
    const { error: logError } = await supabaseAdmin.from('rate_limit_logs').insert({
      ip_address: ip,
      action: 'delete_tenant',
      window_start: new Date().toISOString(),
    });
    if (logError) {
      console.error('Failed to write rate_limit_logs entry:', logError);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const tenantId = (body.tenant_id ?? body.tenantId)?.toString().trim();
    const force = body.force === true;

    if (!tenantId || !UUID_REGEX.test(tenantId)) {
      return jsonResponse({ error: 'tenant_id không hợp lệ' }, 400);
    }

    const isAdmin = await checkIsSystemAdmin(supabaseAdmin, user.id);
    const isOwner = await checkIsTenantOwner(supabaseAdmin, tenantId, user.id);
    if (!isAdmin && !isOwner) {
      return jsonResponse({ error: 'Only system admins or tenant owners can delete tenants' }, 403);
    }

    // Check tenant exists
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, subdomain, owner_id, status')
      .eq('id', tenantId)
      .maybeSingle();
    if (tenantError) throw tenantError;
    if (!tenant) {
      return jsonResponse({ error: 'Tenant không tồn tại' }, 404);
    }

    // ponytail: never delete the reserved admin subdomain / entry point.
    if (tenant.subdomain === 'admin') {
      return jsonResponse({ error: 'Không được xóa tenant admin' }, 403);
    }

    if (force) {
      // Hard-delete: requires explicit force flag
      return await hardDeleteTenant(supabaseAdmin, tenantId, user.id, ip);
    } else {
      // Default: soft-delete (archive)
      return jsonResponse(await softDeleteTenant(supabaseAdmin, tenantId, user.id, ip), 200);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});