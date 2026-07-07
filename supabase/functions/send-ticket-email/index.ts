import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// P11.2: Gửi email thông báo cập nhật ticket qua Resend.
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

const escapeHtml = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const statusLabel = (status?: string) => {
  switch (status) {
    case 'open': return 'Mở';
    case 'in_progress': return 'Đang xử lý';
    case 'waiting_customer': return 'Chờ khách hàng';
    case 'resolved': return 'Đã giải quyết';
    case 'closed': return 'Đã đóng';
    default: return status || 'Không xác định';
  }
};

const priorityLabel = (priority?: string) => {
  switch (priority) {
    case 'low': return 'Thấp';
    case 'medium': return 'Trung bình';
    case 'high': return 'Cao';
    case 'urgent': return 'Khẩn cấp';
    default: return priority || 'Không xác định';
  }
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
        return jsonResponse({ error: 'Chỉ system admin được gửi email ticket' }, 403);
      }
    }

    const body = await req.json();
    const { ticket_id, event, to, reply_id } = body as {
      ticket_id?: string;
      event?: 'reply' | 'assigned' | 'status';
      to?: string;
      reply_id?: string;
    };

    if (!ticket_id || typeof ticket_id !== 'string') {
      return jsonResponse({ error: 'ticket_id không hợp lệ' }, 400);
    }
    if (!event || !['reply', 'assigned', 'status'].includes(event)) {
      return jsonResponse({ error: 'event phải là reply, assigned hoặc status' }, 400);
    }

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .select('*, tenants(id, name, subdomain, owner_id)')
      .eq('id', ticket_id)
      .maybeSingle();
    if (ticketError) throw ticketError;
    if (!ticket) {
      return jsonResponse({ error: 'Không tìm thấy ticket' }, 404);
    }
    const tenant = ticket.tenants || {};

    // Người nhận: ưu tiên `to`, sau đó email chủ tenant.
    let recipient = to;
    if (!recipient && tenant.owner_id) {
      const { data: ownerData } = await supabaseAdmin.auth.admin.getUserById(tenant.owner_id);
      recipient = ownerData?.user?.email ?? undefined;
    }
    if (!recipient) {
      return jsonResponse({ error: 'Không tìm thấy email người nhận cho ticket này' }, 400);
    }

    // Brand từ cấu hình công ty (best-effort).
    const { data: companyRow } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'company_info')
      .maybeSingle();
    const company = companyRow?.value || {};
    const brand = company.brandName || company.companyName || 'VietSales Pro';

    // Lấy thêm thông tin reply nếu có reply_id.
    let replyContent: string | undefined;
    if (reply_id) {
      const { data: replyRow } = await supabaseAdmin
        .from('ticket_replies')
        .select('content')
        .eq('id', reply_id)
        .maybeSingle();
      replyContent = replyRow?.content;
    }

    let subject: string;
    let html: string;
    const ticketUrl = `https://${escapeHtml(tenant.subdomain || 'app')}.vietsalepro.com/support/tickets/${ticket_id}`;

    if (event === 'reply') {
      subject = `[${brand}] Phản hồi mới cho ticket #${ticket_id.slice(0, 8)}`;
      html = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6">
          <p>Kính gửi cửa hàng <strong>${escapeHtml(tenant.name || '')}</strong>,</p>
          <p>Ticket <strong>${escapeHtml(ticket.title)}</strong> vừa có phản hồi mới từ đội ngũ hỗ trợ.</p>
          ${replyContent ? `<p style="padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">${escapeHtml(replyContent)}</p>` : ''}
          <p><a href="${ticketUrl}" style="color:#2563eb">Xem chi tiết ticket</a></p>
          <p>Trân trọng,<br/>${escapeHtml(brand)}</p>
        </div>`;
    } else if (event === 'assigned') {
      let assigneeName = 'một thành viên hỗ trợ';
      if (ticket.assigned_to) {
        const { data: assignee } = await supabaseAdmin.auth.admin.getUserById(ticket.assigned_to);
        assigneeName = assignee?.user?.email || assigneeName;
      }
      subject = `[${brand}] Ticket #${ticket_id.slice(0, 8)} đã được gán người phụ trách`;
      html = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6">
          <p>Kính gửi cửa hàng <strong>${escapeHtml(tenant.name || '')}</strong>,</p>
          <p>Ticket <strong>${escapeHtml(ticket.title)}</strong> đã được gán cho <strong>${escapeHtml(assigneeName)}</strong>.</p>
          <p><a href="${ticketUrl}" style="color:#2563eb">Xem chi tiết ticket</a></p>
          <p>Trân trọng,<br/>${escapeHtml(brand)}</p>
        </div>`;
    } else {
      subject = `[${brand}] Cập nhật trạng thái ticket #${ticket_id.slice(0, 8)}`;
      html = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6">
          <p>Kính gửi cửa hàng <strong>${escapeHtml(tenant.name || '')}</strong>,</p>
          <p>Ticket <strong>${escapeHtml(ticket.title)}</strong> đã chuyển sang trạng thái <strong>${statusLabel(ticket.status)}</strong>.</p>
          <p>Ưu tiên: ${priorityLabel(ticket.priority)}</p>
          <p><a href="${ticketUrl}" style="color:#2563eb">Xem chi tiết ticket</a></p>
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
      body: JSON.stringify({ from: resendFrom, to: [recipient], subject, html }),
    });

    const resendData = await resendResp.json().catch(() => ({}));
    if (!resendResp.ok) {
      return jsonResponse({ error: 'Gửi email thất bại', detail: resendData }, 502);
    }

    return jsonResponse({ success: true, id: resendData?.id ?? null, to: recipient, event }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Lỗi không xác định' }, 500);
  }
});
