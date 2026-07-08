import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (data: unknown, status: number) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

interface BackupPayload {
  tenant_id?: string;
  backup?: {
    tenant?: Record<string, unknown>;
    tables?: Record<string, unknown[]>;
    exportedAt?: string;
  };
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
      return jsonResponse({ error: 'Chỉ system admin được restore tenant' }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as BackupPayload;
    const tenantId = body?.tenant_id;
    const backup = body?.backup;

    if (!tenantId || typeof tenantId !== 'string') {
      return jsonResponse({ error: 'Thiếu tenant_id' }, 400);
    }

    if (!backup || typeof backup !== 'object' || !backup.tables || typeof backup.tables !== 'object') {
      return jsonResponse({ error: 'Backup không hợp lệ: thiếu tables' }, 400);
    }

    // ponytail: Edge Function payload ceiling (~6MB) is the practical size limit for full backup restore.
    // For larger tenants, stream table-by-table or use Supabase CLI/pg_dump as the upgrade path.
    const { data, error: rpcError } = await supabaseAdmin.rpc('restore_tenant_tables', {
      p_tenant_id: tenantId,
      p_tables: backup.tables as Record<string, unknown[]>,
    });

    if (rpcError) throw rpcError;

    return jsonResponse({ success: true, result: data }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Tenant restore error:', err);
    return jsonResponse({ error: message }, 500);
  }
});
