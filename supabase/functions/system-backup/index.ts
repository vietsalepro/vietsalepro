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

interface BackupStatus {
  pitrEnabled: boolean | null;
  pitrEarliestRecoveryPoint: string | null;
  lastBackupAt: string | null;
  cliAvailable: boolean;
  status: 'healthy' | 'degraded' | 'unknown';
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
      return jsonResponse({ error: 'Chỉ system admin được xem backup status' }, 403);
    }

    const projectRef = Deno.env.get('SUPABASE_PROJECT_REF') ?? '';
    const managementToken = Deno.env.get('SUPABASE_MANAGEMENT_TOKEN') ?? '';

    const backupStatus: BackupStatus = {
      pitrEnabled: null,
      pitrEarliestRecoveryPoint: null,
      lastBackupAt: null,
      cliAvailable: false,
      status: 'unknown',
    };

    if (projectRef && managementToken) {
      try {
        const res = await fetch(
          `https://api.supabase.com/v1/projects/${projectRef}/database/backups`,
          {
            headers: {
              Authorization: `Bearer ${managementToken}`,
              'Content-Type': 'application/json',
            },
          },
        );
        if (res.ok) {
          const data = (await res.json()) as Record<string, any>;
          backupStatus.pitrEnabled = data?.pitr_enabled ?? null;
          backupStatus.pitrEarliestRecoveryPoint = data?.pitr_earliest_recovery_point ?? null;

          const backups = Array.isArray(data?.backups) ? data.backups : [];
          if (backups.length > 0) {
            const latest = backups.reduce((a: any, b: any) => {
              const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
              const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
              return aTime > bTime ? a : b;
            });
            backupStatus.lastBackupAt = latest?.created_at ?? null;
          }
          backupStatus.cliAvailable = true;
          backupStatus.status = backupStatus.pitrEnabled ? 'healthy' : 'degraded';
        } else {
          console.error('Supabase Management API backup status returned', res.status, await res.text());
        }
      } catch (err) {
        console.error('Backup status fetch failed:', err);
      }
    } else {
      console.error('SUPABASE_PROJECT_REF or SUPABASE_MANAGEMENT_TOKEN not set; backup status unavailable');
    }

    return jsonResponse({
      checkedAt: new Date().toISOString(),
      backupStatus,
    }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
