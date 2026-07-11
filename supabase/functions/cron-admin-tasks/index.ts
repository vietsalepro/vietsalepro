import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Sub-Phase 7.1: Cron jobs worker for admin dashboard.
// Triggered by pg_cron via pg_net. X-Internal-Secret must match CRON_ADMIN_TASKS_SECRET.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

const jsonResponse = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type CronJobName = 'billing_reminders' | 'audit_cleanup';

interface CronJobResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

const insertAdminEvent = async (
  client: any,
  type: string,
  severity: 'info' | 'warning' | 'error',
  message: string,
  metadata: Record<string, any> = {}
) => {
  try {
    await client.from('admin_events').insert({
      type,
      severity,
      message,
      metadata,
    });
  } catch (err) {
    console.error('Failed to broadcast admin event:', err);
  }
};

const logCronStart = async (client: any, jobName: CronJobName) => {
  const { data, error } = await client
    .from('cron_job_logs')
    .insert({ job_name: jobName, status: 'running' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
};

const logCronComplete = async (
  client: any,
  logId: string,
  status: 'success' | 'failed',
  details: Record<string, any> = {},
  errorMessage?: string
) => {
  await client
    .from('cron_job_logs')
    .update({
      status,
      completed_at: new Date().toISOString(),
      details,
      error_message: errorMessage ?? null,
    })
    .eq('id', logId);
};

const runBillingReminders = async (client: any, supabaseUrl: string, serviceRoleKey: string): Promise<CronJobResult> => {
  // Find tenants with subscription expiring within 7 days (not already reminded today).
  const { data: rows, error: queryError } = await client
    .from('tenant_subscriptions')
    .select('tenant_id, expires_at, tenants!inner(id, name, subdomain, owner_id)')
    .lte('expires_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
    .gte('expires_at', new Date().toISOString())
    .not('tenants.status', 'in', '(archived)')
    .order('expires_at', { ascending: true });

  if (queryError) throw queryError;

  const targets = (rows || []) as any[];
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of targets) {
    const tenant = row.tenants || {};
    if (!tenant.owner_id) {
      failed++;
      errors.push(`Tenant ${tenant.subdomain || tenant.id} has no owner`);
      continue;
    }

    // Skip if already reminded today.
    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await client
      .from('billing_reminder_logs')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('reminder_type', 'expiring')
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`)
      .maybeSingle();
    if (existing) continue;

    // Get owner email.
    const { data: ownerData, error: ownerError } = await client.auth.admin.getUserById(tenant.owner_id);
    if (ownerError || !ownerData?.user?.email) {
      failed++;
      errors.push(`Cannot get email for tenant ${tenant.subdomain}: ${ownerError?.message || 'no email'}`);
      await client.from('billing_reminder_logs').insert({
        tenant_id: tenant.id,
        reminder_type: 'expiring',
        status: 'failed',
        error_message: ownerError?.message || 'no owner email',
      });
      continue;
    }

    const to = ownerData.user.email;
    const expiresAt = row.expires_at ? new Date(row.expires_at).toLocaleDateString('vi-VN') : '-';

    // Retry up to 3 times.
    let attempt = 0;
    let emailOk = false;
    let lastError = '';
    while (attempt < 3 && !emailOk) {
      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/send-template-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            template_key: 'billing_reminder',
            to,
            variables: {
              tenant_name: tenant.name || 'Quý khách',
              tenant_subdomain: tenant.subdomain || '',
              expires_at: expiresAt,
            },
          }),
        });
        if (resp.ok) {
          emailOk = true;
        } else {
          const body = await resp.json().catch(() => ({}));
          lastError = body.error || `HTTP ${resp.status}`;
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
      attempt++;
      if (!emailOk && attempt < 3) await sleep(1000);
    }

    if (emailOk) {
      sent++;
      await client.from('billing_reminder_logs').insert({
        tenant_id: tenant.id,
        reminder_type: 'expiring',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } else {
      failed++;
      errors.push(`Failed to send reminder to ${to}: ${lastError}`);
      await client.from('billing_reminder_logs').insert({
        tenant_id: tenant.id,
        reminder_type: 'expiring',
        status: 'failed',
        error_message: lastError,
      });
    }
  }

  if (failed > 0) {
    return {
      success: false,
      message: `Gửi ${sent} reminder, ${failed} thất bại`,
      details: { sent, failed, errors },
    };
  }
  return {
    success: true,
    message: `Đã gửi ${sent} reminder`,
    details: { sent, failed },
  };
};

const runAuditCleanup = async (client: any): Promise<CronJobResult> => {
  // Retry once.
  let attempt = 0;
  let deleted = 0;
  let lastError = '';

  while (attempt < 2) {
    try {
      const { error, count } = await client
        .from('audit_log')
        .delete({ count: 'exact' })
        .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
      if (error) throw error;
      deleted = count ?? 0;
      break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      attempt++;
      if (attempt < 2) await sleep(1000);
    }
  }

  if (attempt >= 2 && deleted === 0) {
    return {
      success: false,
      message: 'Xóa audit log thất bại sau 1 lần retry',
      details: { deleted, error: lastError },
    };
  }
  return {
    success: true,
    message: `Đã xóa ${deleted} bản ghi audit log cũ`,
    details: { deleted },
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const expectedSecret = Deno.env.get('CRON_ADMIN_TASKS_SECRET');

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Auth: internal cron secret or service role.
    const internalSecret = req.headers.get('X-Internal-Secret');
    const authHeader = req.headers.get('Authorization');
    let authorized = false;
    if (expectedSecret && internalSecret === expectedSecret) {
      authorized = true;
    } else if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (token === serviceRoleKey) {
        authorized = true;
      }
    }
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const body = await req.json();
    const job = body?.job as CronJobName;
    if (!job || (job !== 'billing_reminders' && job !== 'audit_cleanup')) {
      return jsonResponse({ error: 'job phải là billing_reminders hoặc audit_cleanup' }, 400);
    }

    const logId = await logCronStart(supabaseAdmin, job);

    try {
      let result: CronJobResult;
      if (job === 'billing_reminders') {
        result = await runBillingReminders(supabaseAdmin, supabaseUrl, serviceRoleKey);
      } else {
        result = await runAuditCleanup(supabaseAdmin);
      }

      if (result.success) {
        await logCronComplete(supabaseAdmin, logId, 'success', result.details ?? {});
        const eventType = job === 'billing_reminders' ? 'billing_reminder_sent' : 'audit_log_cleanup_completed';
        await insertAdminEvent(
          supabaseAdmin,
          eventType,
          'info',
          result.message,
          result.details ?? {}
        );
        return jsonResponse({ success: true, job, ...result }, 200);
      }

      await logCronComplete(supabaseAdmin, logId, 'failed', result.details ?? {}, result.message);
      const eventType = job === 'billing_reminders' ? 'billing_reminder_failed' : 'audit_log_cleanup_failed';
      await insertAdminEvent(
        supabaseAdmin,
        eventType,
        'error',
        result.message,
        result.details ?? {}
      );
      return jsonResponse({ success: false, job, ...result }, 502);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await logCronComplete(supabaseAdmin, logId, 'failed', {}, message);
      await insertAdminEvent(supabaseAdmin, 'cron_job_failed', 'error', `${job} failed: ${message}`, { job });
      return jsonResponse({ success: false, job, error: message }, 500);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
