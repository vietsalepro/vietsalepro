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

type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

interface HealthCheck {
  name: string;
  status: HealthStatus;
  latencyMs: number;
  message?: string;
  detail?: string;
}

const overallStatus = (checks: HealthCheck[]): HealthStatus => {
  if (checks.some(c => c.status === 'down')) return 'down';
  if (checks.some(c => c.status === 'degraded')) return 'degraded';
  if (checks.every(c => c.status === 'healthy')) return 'healthy';
  return 'unknown';
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

    const { data: adminRow, error: adminError } = await supabaseAdmin
      .from('system_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (adminError) throw adminError;
    if (!adminRow) {
      return jsonResponse({ error: 'Chỉ system admin được xem system health' }, 403);
    }

    const checks: HealthCheck[] = [];

    // DB health: simple head query
    const dbStart = Date.now();
    try {
      const { error } = await supabaseAdmin
        .from('tenants')
        .select('id', { count: 'exact', head: true });
      const latencyMs = Date.now() - dbStart;
      if (error) {
        checks.push({ name: 'Database', status: 'down', latencyMs, message: error.message });
      } else {
        const status = latencyMs > 2000 ? 'degraded' : 'healthy';
        checks.push({ name: 'Database', status, latencyMs, detail: `Truy vấn thành công` });
      }
    } catch (err) {
      checks.push({ name: 'Database', status: 'down', latencyMs: Date.now() - dbStart, message: err instanceof Error ? err.message : 'Lỗi không xác định' });
    }

    // Storage health: list buckets
    const storageStart = Date.now();
    try {
      const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
      const latencyMs = Date.now() - storageStart;
      if (error) {
        checks.push({ name: 'Storage', status: 'down', latencyMs, message: error.message });
      } else {
        const status = latencyMs > 2000 ? 'degraded' : 'healthy';
        checks.push({ name: 'Storage', status, latencyMs, detail: `${buckets?.length ?? 0} buckets` });
      }
    } catch (err) {
      checks.push({ name: 'Storage', status: 'down', latencyMs: Date.now() - storageStart, message: err instanceof Error ? err.message : 'Lỗi không xác định' });
    }

    // Edge Functions health: try invoking an existing lightweight function
    const edgeStart = Date.now();
    try {
      const { data, error } = await supabaseAdmin.functions.invoke('check-subdomain', {
        body: { subdomain: 'health-check' },
      });
      const latencyMs = Date.now() - edgeStart;
      if (error) {
        // Function responded but reported an error; still reachable
        checks.push({ name: 'Edge Functions', status: 'degraded', latencyMs, message: error.message });
      } else {
        const status = latencyMs > 3000 ? 'degraded' : 'healthy';
        checks.push({ name: 'Edge Functions', status, latencyMs, detail: data?.available !== undefined ? 'Phản hồi OK' : 'Phản hồi bất thường' });
      }
    } catch (err) {
      checks.push({ name: 'Edge Functions', status: 'down', latencyMs: Date.now() - edgeStart, message: err instanceof Error ? err.message : 'Lỗi không xác định' });
    }

    return jsonResponse({
      checkedAt: new Date().toISOString(),
      overall: overallStatus(checks),
      checks,
    }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
