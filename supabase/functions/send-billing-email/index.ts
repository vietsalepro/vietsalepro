import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// P7.5: Gửi email billing (nhắc thanh toán / xác nhận) qua Resend.
// RESEND_API_KEY (bắt buộc) và RESEND_FROM (tùy chọn) đặt trong Supabase secrets.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

const formatVnd = (n: number) => (n ?? 0).toLocaleString('vi-VN') + 'đ';
const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');
const escapeHtml = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFrom = Deno.env.get('RESEND_FROM') || 'VietSales Pro <billing@vietsalepro.com>';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Xác thực: chỉ system admin (hoặc service role gọi từ cron/backend).
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
        return jsonResponse({ error: 'Chỉ system admin được gửi email billing' }, 403);
      }
    }

    const body = await req.json();
    const { invoice_id, type } = body as { invoice_id?: string; type?: string };
    let to: string | undefined = body?.to;

    if (!invoice_id || typeof invoice_id !== 'string') {
      return jsonResponse({ error: 'invoice_id không hợp lệ' }, 400);
    }
    if (type !== 'reminder' && type !== 'confirmation') {
      return jsonResponse({ error: 'type phải là reminder hoặc confirmation' }, 400);
    }

    // Hóa đơn + tenant.
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*, tenants(name, subdomain, owner_id)')
      .eq('id', invoice_id)
      .maybeSingle();
    if (invoiceError) throw invoiceError;
    if (!invoice) {
      return jsonResponse({ error: 'Không tìm thấy hóa đơn' }, 404);
    }
    const tenant = invoice.tenants || {};

    // Người nhận: ưu tiên `to`, sau đó email chủ tenant.
    if (!to && tenant.owner_id) {
      const { data: ownerData } = await supabaseAdmin.auth.admin.getUserById(tenant.owner_id);
      to = ownerData?.user?.email ?? undefined;
    }
    if (!to) {
      return jsonResponse({ error: 'Không tìm thấy email người nhận cho tenant này' }, 400);
    }

    // Tài khoản ngân hàng mặc định + thông tin công ty (best-effort).
    const { data: banks } = await supabaseAdmin
      .from('bank_accounts')
      .select('*')
      .order('display_order', { ascending: true });
    const bank = (banks || []).find((b: any) => b.is_default) || (banks || [])[0];

    const { data: companyRow } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'company_info')
      .maybeSingle();
    const company = companyRow?.value || {};
    const brand = company.brandName || company.companyName || 'VietSales Pro';

    const bankBlock = bank
      ? `<div style="margin:16px 0;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
           <div style="font-weight:600;margin-bottom:6px">Thông tin chuyển khoản</div>
           <div>Ngân hàng: ${escapeHtml(bank.bank_name)}</div>
           <div>Số tài khoản: ${escapeHtml(bank.account_number)}</div>
           <div>Chủ tài khoản: ${escapeHtml(bank.account_name)}</div>
           <div>Nội dung CK: ${escapeHtml(bank.transfer_content || invoice.invoice_no)}</div>
         </div>`
      : '';

    let subject: string;
    let html: string;
    if (type === 'reminder') {
      subject = `[${brand}] Nhắc thanh toán hóa đơn ${invoice.invoice_no}`;
      html = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6">
          <p>Kính gửi cửa hàng <strong>${escapeHtml(tenant.name || '')}</strong>,</p>
          <p>Hóa đơn <strong>${escapeHtml(invoice.invoice_no)}</strong> đang chờ thanh toán.</p>
          <ul>
            <li>Số tiền: <strong>${formatVnd(Number(invoice.total))}</strong></li>
            <li>Hạn thanh toán: <strong>${formatDate(invoice.due_date)}</strong></li>
            <li>Sử dụng dịch vụ đến: <strong>${formatDate(invoice.period_end)}</strong></li>
          </ul>
          <p>Vui lòng thanh toán trước hạn để tránh bị tạm khóa quyền ghi dữ liệu.</p>
          ${bankBlock}
          <p>Trân trọng,<br/>${escapeHtml(brand)}</p>
        </div>`;
    } else {
      subject = `[${brand}] Xác nhận thanh toán hóa đơn ${invoice.invoice_no}`;
      html = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6">
          <p>Kính gửi cửa hàng <strong>${escapeHtml(tenant.name || '')}</strong>,</p>
          <p>Chúng tôi đã nhận được thanh toán cho hóa đơn <strong>${escapeHtml(invoice.invoice_no)}</strong>.</p>
          <ul>
            <li>Số tiền: <strong>${formatVnd(Number(invoice.total))}</strong></li>
            <li>Dịch vụ được gia hạn đến: <strong>${formatDate(invoice.period_end)}</strong></li>
          </ul>
          <p>Cảm ơn quý cửa hàng đã tin dùng dịch vụ.</p>
          <p>Trân trọng,<br/>${escapeHtml(brand)}</p>
        </div>`;
    }

    if (!resendApiKey) {
      return jsonResponse({ error: 'RESEND_API_KEY chưa được cấu hình trong Supabase secrets' }, 500);
    }

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: resendFrom, to: [to], subject, html }),
    });

    const resendData = await resendResp.json().catch(() => ({}));
    if (!resendResp.ok) {
      return jsonResponse({ error: 'Gửi email thất bại', detail: resendData }, 502);
    }

    return jsonResponse({ success: true, id: resendData?.id ?? null, to, type }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Lỗi không xác định' }, 500);
  }
});
