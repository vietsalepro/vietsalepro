import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// P12.2: Gửi email dùng template (subject + body_html) + brand config (logo, màu, chữ ký) qua Resend.
// RESEND_API_KEY (bắt buộc) và RESEND_FROM (tùy chọn) đặt trong Supabase secrets.
// Body: { template_key, to, variables?, test?: boolean }
//   - template_key: key trong bảng email_templates (vd 'billing_reminder', 'welcome', ...).
//   - to: email người nhận (string) hoặc mảng string.
//   - variables: object chứa giá trị thay thế cho {{var}} trong subject + body.
//   - test: true → gửi thử đến người nhận, không cần dữ liệu thật (variables rỗng OK).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

const escapeHtml = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Thay {{var}} trong chuỗi bằng giá trị từ variables. Biến không có giá trị → giữ nguyên placeholder.
const renderTemplate = (tpl: string, variables: Record<string, string>): string => {
  return String(tpl ?? '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return escapeHtml(String(variables[key]));
    }
    return `{{${key}}}`;
  });
};

// Wrap body với header (logo + brand color) và footer (signature).
const wrapWithBrand = (bodyHtml: string, brand: {
  logo_url?: string;
  brand_color?: string;
  signature_html?: string;
  from_name?: string;
}): string => {
  const color = brand.brand_color || '#2563eb';
  const logo = brand.logo_url
    ? `<img src="${escapeHtml(brand.logo_url)}" alt="logo" style="max-height:56px;max-width:180px;display:block;margin-bottom:12px" />`
    : '';
  const signature = brand.signature_html
    ? `<p style="margin-top:24px">${brand.signature_html}</p>`
    : '';
  return `
<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6;max-width:640px;margin:0 auto">
  <div style="border-bottom:3px solid ${escapeHtml(color)};padding-bottom:12px;margin-bottom:16px">
    ${logo}
  </div>
  ${bodyHtml}
  ${signature}
</div>`;
};

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

    // Xác thực: service role hoặc system admin.
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
        return jsonResponse({ error: 'Chỉ system admin được gửi email template' }, 403);
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

    // Lấy template.
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

    // Lấy brand config.
    const { data: brand, error: brandError } = await supabaseAdmin
      .rpc('get_email_brand');
    if (brandError) throw brandError;
    const brandCfg = brand || {};

    // Render subject + body.
    const vars: Record<string, string> = { ...(variables || {}) };
    // brand_name luôn có sẵn cho template.
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
