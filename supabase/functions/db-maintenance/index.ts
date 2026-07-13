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

type DbMaintenanceOperation = 'vacuum_analyze' | 'reindex' | 'bloat_check' | 'index_stats' | 'list_jobs';

interface MaintenanceRequest {
  operation?: DbMaintenanceOperation;
  tables?: string[];
  limit?: number;
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
      return jsonResponse({ error: 'Chỉ system admin được chạy database maintenance' }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as MaintenanceRequest;
    const operation = body?.operation ?? 'list_jobs';

    if (!isValidOperation(operation)) {
      return jsonResponse({ error: 'Operation không hợp lệ' }, 400);
    }

    if (operation === 'vacuum_analyze' || operation === 'reindex') {
      const { data, error: rpcError } = await supabaseAdmin.rpc('run_db_maintenance_job', {
        p_operation: operation,
        p_tables: body.tables ?? null,
      });
      if (rpcError) throw rpcError;
      return jsonResponse({ job: data }, 200);
    }

    if (operation === 'bloat_check') {
      const { data, error: rpcError } = await supabaseAdmin.rpc('get_db_table_stats');
      if (rpcError) throw rpcError;
      return jsonResponse({ stats: data ?? [] }, 200);
    }

    if (operation === 'index_stats') {
      const { data, error: rpcError } = await supabaseAdmin.rpc('get_db_index_stats');
      if (rpcError) throw rpcError;
      return jsonResponse({ stats: data ?? [] }, 200);
    }

    const { data, error: rpcError } = await supabaseAdmin.rpc('list_db_maintenance_jobs', {
      p_limit: body.limit ?? 50,
    });
    if (rpcError) throw rpcError;
    return jsonResponse({ jobs: data ?? [] }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Database maintenance error:', err);
    return jsonResponse({ error: message }, 500);
  }
});

function isValidOperation(op: string): op is DbMaintenanceOperation {
  return ['vacuum_analyze', 'reindex', 'bloat_check', 'index_stats', 'list_jobs'].includes(op);
}
