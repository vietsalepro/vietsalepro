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

const getClientIp = (req: Request): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '0.0.0.0';
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

    // Xác thực caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !caller) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const { target_user_id, approved_by_user_id } = body;

    if (!target_user_id || typeof target_user_id !== 'string') {
      return jsonResponse({ error: 'target_user_id không hợp lệ' }, 400);
    }
    if (!approved_by_user_id || typeof approved_by_user_id !== 'string') {
      return jsonResponse({ error: 'approved_by_user_id không hợp lệ' }, 400);
    }
    if (target_user_id === caller.id) {
      return jsonResponse({ error: 'Không thể tự override 2FA của chính mình' }, 400);
    }
    if (approved_by_user_id === caller.id) {
      return jsonResponse({ error: 'Người phê duyệt phải khác người thực hiện' }, 400);
    }

    // Caller và approver đều phải là system admin
    const [isCallerAdmin, isApproverAdmin] = await Promise.all([
      checkIsSystemAdmin(supabaseAdmin, caller.id),
      checkIsSystemAdmin(supabaseAdmin, approved_by_user_id),
    ]);
    if (!isCallerAdmin) {
      return jsonResponse({ error: 'Chỉ system admin mới được thực hiện override' }, 403);
    }
    if (!isApproverAdmin) {
      return jsonResponse({ error: 'Người phê duyệt không phải system admin' }, 403);
    }

    // Lấy danh sách TOTP factor của target user
    const { data: factors, error: factorsError } = await supabaseAdmin.auth.admin.mfa.listFactors({
      userId: target_user_id,
    });
    if (factorsError) throw factorsError;

    const totpFactors = (factors?.factors || []).filter((f: any) => f.factor_type === 'totp');

    // Unenroll từng factor
    const unenrolled: string[] = [];
    for (const factor of totpFactors) {
      const { error: unenrollError } = await supabaseAdmin.auth.admin.mfa.deleteFactor({
        id: factor.id,
        userId: target_user_id,
      });
      if (unenrollError) throw unenrollError;
      unenrolled.push(factor.id);
    }

    // Xóa backup codes
    const { error: deleteCodesError } = await supabaseAdmin
      .from('admin_2fa_backup_codes')
      .delete()
      .eq('user_id', target_user_id);
    if (deleteCodesError) throw deleteCodesError;

    // Ghi audit log
    const { error: auditError } = await supabaseAdmin.from('app_audit_log').insert({
      tenant_id: null,
      table_name: 'auth.mfa_factors',
      action: 'UPDATE',
      record_id: target_user_id,
      user_id: caller.id,
      new_data: {
        action: 'manual_2fa_override',
        target_user_id,
        approved_by_user_id,
        unenrolled_factor_ids: unenrolled,
      },
      ip_address: getClientIp(req),
      user_agent: req.headers.get('user-agent'),
    });
    if (auditError) throw auditError;

    return jsonResponse({
      success: true,
      target_user_id,
      unenrolled_factor_ids: unenrolled,
      backup_codes_deleted: true,
    }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
