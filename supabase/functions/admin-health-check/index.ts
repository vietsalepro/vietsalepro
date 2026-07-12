// Phase 5 long-term hardening: external health-check endpoint for monitoring.
// Called by Uptime Robot / Better Stack every few minutes. Uses service_role so
// it can exercise RPCs without a user session; returns only ok/checks, no data.

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

interface RpcCheck {
  name: string;
  rpc: string;
  params?: Record<string, unknown>;
}

const RPC_CHECKS: RpcCheck[] = [
  // ponytail: use service-role-safe RPCs. The admin-only RPCs (get_system_overview,
  // get_top_tenants, etc.) reject service_role because is_system_admin() is false.
  // These checks still exercise the PostgREST RPC path and the database.
  { name: 'is_system_admin', rpc: 'is_system_admin' },
  { name: 'is_tenant_admin', rpc: 'is_tenant_admin', params: { p_tenant_id: '00000000-0000-0000-0000-000000000000' } },
  { name: 'is_tenant_member', rpc: 'is_tenant_member', params: { p_tenant_id: '00000000-0000-0000-0000-000000000000' } },
  { name: 'has_tenant_role', rpc: 'has_tenant_role', params: { p_tenant_id: '00000000-0000-0000-0000-000000000000', p_role: 'admin' } },
  { name: 'get_tenant_by_subdomain', rpc: 'get_tenant_by_subdomain', params: { p_subdomain: 'admin' } },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const checks = [];
    for (const check of RPC_CHECKS) {
      const start = Date.now();
      try {
        const { error } = await supabaseAdmin.rpc(check.rpc, check.params ?? {});
        checks.push({
          name: check.name,
          ok: !error,
          latencyMs: Date.now() - start,
          error: error?.message ?? null,
        });
      } catch (err) {
        checks.push({
          name: check.name,
          ok: false,
          latencyMs: Date.now() - start,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const ok = checks.every((c) => c.ok);
    return jsonResponse({ ok, checkedAt: new Date().toISOString(), checks }, ok ? 200 : 503);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
