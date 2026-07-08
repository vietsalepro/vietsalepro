import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (data: unknown, status: number, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...extraHeaders,
    },
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    const { data: adminRow, error: adminError } = await supabaseAdmin
      .from('system_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (adminError) throw adminError;
    if (!adminRow) {
      return jsonResponse({ error: 'Chỉ system admin được backup tenant' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const tenantId = body?.tenant_id;
    if (!tenantId || typeof tenantId !== 'string') {
      return jsonResponse({ error: 'Thiếu tenant_id' }, 400);
    }

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, subdomain, plan, status, owner_id, settings, created_at, updated_at, archived_at')
      .eq('id', tenantId)
      .maybeSingle();
    if (tenantError) throw tenantError;
    if (!tenant) {
      return jsonResponse({ error: 'Không tìm thấy tenant' }, 404);
    }

    // ponytail: ask the DB which tables are tenant-scoped via a service-role-locked RPC.
    // Ceiling: very large tenants may hit Edge Function memory/time; for those, stream/export by table is the upgrade path.
    const { data: tableRows, error: tablesError } = await supabaseAdmin.rpc('get_tenant_backup_tables');
    if (tablesError) throw tablesError;
    const tableNames = [...new Set((tableRows || []).map((r: any) => r.table_name))].sort();

    const PAGE_SIZE = 1000;
    const tables: Record<string, unknown[]> = {};
    for (const table of tableNames) {
      const rows: unknown[] = [];
      let start = 0;
      while (true) {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .eq('tenant_id', tenantId)
          .range(start, start + PAGE_SIZE - 1);
        if (error) {
          // ponytail: skip tables we cannot read (e.g. locked) instead of failing the whole dump.
          console.error(`Backup table ${table} failed:`, error);
          break;
        }
        if (!data || data.length === 0) break;
        rows.push(...data);
        if (data.length < PAGE_SIZE) break;
        start += PAGE_SIZE;
      }
      tables[table] = rows;
    }

    const exportedAt = new Date().toISOString();
    const filename = `tenant-${tenantId}-backup-${exportedAt.slice(0, 10)}.json`;

    return jsonResponse(
      {
        tenant,
        tables,
        exportedAt,
      },
      200,
      { 'Content-Disposition': `attachment; filename="${filename}"` }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Tenant backup error:', err);
    return jsonResponse({ error: message }, 500);
  }
});
