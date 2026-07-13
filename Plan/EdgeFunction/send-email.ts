import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { renderTemplate, wrapWithBrand } from '../_shared/email.ts';

// SP-6.1: Generic email service integration.
// Receives template_key, to, variables; renders template; calls Resend API.
// RESEND_API_KEY (required) and RESEND_FROM (optional) are stored in Supabase secrets.
// Body: { template_key, to, variables?, test?: boolean }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFrom = Deno.env.get('RESEND_FROM') || 'VietSales Pro <support@vietsalepro.com>';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Authentication: service role or system admin.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const isServiceRole = token === serviceRoleKey;
    if (!isServiceRole) {
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
        return jsonResponse({ error: 'Chỉ system admin được gửi email' }, 403);
      }
    }

    const body = await req.json();
    const { template_key, to, variables, test } = body as {
      template_key?: string;
      to?: string | string[];
      variables?: Record<string, string>;
      test?: boolean;
    };

    if (!template_key || typeof template_key !== 'string') {
      return jsonResponse({ error: 'template_key không hợp lệ' }, 400);
    }
    if (!to || (typeof to !== 'string' && !Array.isArray(to))) {
      return jsonResponse({ error: 'to phải là email hoặc mảng email' }, 400);
    }
    const recipients = Array.isArray(to) ? to : [to];
    if (recipients.length === 0) {
      return jsonResponse({ error: 'Danh sách người nhận rỗng' }, 400);
    }

    // Fetch template.
    const { data: template, error: tplError } = await supabaseAdmin
      .rpc('get_email_template_by_key', { p_key: template_key });
    if (tplError) throw tplError;
    if (!template || template.length === 0) {
      return jsonResponse({ error: `Không tìm thấy template '${template_key}'` }, 404);
    }
    const tpl = template[0];
    if (!tpl.is_active) {
      return jsonResponse({ error: `Template '${template_key}' đang bị tắt` }, 400);
    }

    // Fetch brand config.
    const { data: brand, error: brandError } = await supabaseAdmin
      .rpc('get_email_brand');
    if (brandError) throw brandError;
    const brandCfg = brand || {};

    // Render subject + body.
    const vars: Record<string, string> = { ...(variables || {}) };
    if (!vars.brand_name) {
      vars.brand_name = brandCfg.from_name || 'VietSales Pro';
    }
    const subject = renderTemplate(tpl.subject, vars);
    const renderedBody = renderTemplate(tpl.body_html, vars);
    const html = wrapWithBrand(renderedBody, brandCfg);

    if (!resendApiKey) {
      return jsonResponse({ error: 'RESEND_API_KEY chưa được cấu hình trong Supabase secrets' }, 500);
    }

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: resendFrom, to: recipients, subject, html }),
    });

    const resendData = await resendResp.json().catch(() => ({}));
    if (!resendResp.ok) {
      return jsonResponse({ error: 'Gửi email thất bại', detail: resendData }, 502);
    }

    return jsonResponse({
      success: true,
      id: resendData?.id ?? null,
      to: recipients,
      template_key,
      subject,
      test: !!test,
    }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Lỗi không xác định' }, 500);
  }
});
