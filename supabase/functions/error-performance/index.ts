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

interface ErrorSummary {
  total: number;
  since: string;
  bySource: { source: string; level: string; count: number }[];
  recent: { id: string; source: string; level: string; message: string; detail?: string; metadata?: any; created_at: string }[];
}

interface PerformanceMetrics {
  totalQueries: number;
  totalCalls: number;
  averageTimeMs: number;
  p95Ms: number;
  p99Ms: number;
  rps: number;
  resetAt: string;
  topQueries: {
    query: string;
    calls: number;
    mean_ms: number;
    p95_ms: number;
    p99_ms: number;
    total_ms: number;
  }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
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
      return jsonResponse({ error: 'Chỉ system admin được xem error/performance metrics' }, 403);
    }

    // ponytail: call admin RPCs with the user's token so auth.uid() resolves inside SECURITY INVOKER functions.
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const hours = 24;
    let errors: ErrorSummary = { total: 0, since: new Date().toISOString(), bySource: [], recent: [] };
    let performance: PerformanceMetrics = {
      totalQueries: 0,
      totalCalls: 0,
      averageTimeMs: 0,
      p95Ms: 0,
      p99Ms: 0,
      rps: 0,
      resetAt: new Date().toISOString(),
      topQueries: [],
    };

    try {
      const { data, error } = await supabaseUser.rpc('get_error_log_summary', { p_hours: hours, p_limit: 50 });
      if (error) throw error;
      if (data) {
        errors = {
          total: data.total ?? 0,
          since: data.since ?? new Date().toISOString(),
          bySource: Array.isArray(data.bySource) ? data.bySource : [],
          recent: Array.isArray(data.recent) ? data.recent : [],
        };
      }
    } catch (err) {
      console.error('get_error_log_summary failed:', err);
      errors = { total: 0, since: new Date().toISOString(), bySource: [], recent: [] };
    }

    try {
      const { data, error } = await supabaseUser.rpc('get_query_performance_metrics');
      if (error) throw error;
      if (data) {
        performance = {
          totalQueries: data.totalQueries ?? 0,
          totalCalls: data.totalCalls ?? 0,
          averageTimeMs: data.averageTimeMs ?? 0,
          p95Ms: data.p95Ms ?? 0,
          p99Ms: data.p99Ms ?? 0,
          rps: data.rps ?? 0,
          resetAt: data.resetAt ?? new Date().toISOString(),
          topQueries: Array.isArray(data.topQueries) ? data.topQueries : [],
        };
      }
    } catch (err) {
      console.error('get_query_performance_metrics failed:', err);
      performance = {
        totalQueries: 0,
        totalCalls: 0,
        averageTimeMs: 0,
        p95Ms: 0,
        p99Ms: 0,
        rps: 0,
        resetAt: new Date().toISOString(),
        topQueries: [],
      };
    }

    return jsonResponse({
      checkedAt: new Date().toISOString(),
      errors,
      performance,
    }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
