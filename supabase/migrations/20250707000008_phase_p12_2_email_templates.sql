-- P12.2: Admin dashboard — Email templates + composer
-- Bảng email_templates + RLS + RPC + seed mặc định + brand config (logo, màu, chữ ký).
-- ponytail: migration idempotent; system admin quản lý template; Edge Function render + gửi qua Resend.

-- ============================================================
-- 1. Bảng email_templates
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE
    CHECK (key ~ '^[a-z0-9_]+$'),
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_templates_active_idx ON public.email_templates(is_active);
CREATE INDEX IF NOT EXISTS email_templates_default_idx ON public.email_templates(is_default);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'email_templates' AND policyname = 'email_templates_select_admin'
  ) THEN
    CREATE POLICY "email_templates_select_admin" ON public.email_templates FOR SELECT TO authenticated
      USING (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'email_templates' AND policyname = 'email_templates_insert_admin'
  ) THEN
    CREATE POLICY "email_templates_insert_admin" ON public.email_templates FOR INSERT TO authenticated
      WITH CHECK (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'email_templates' AND policyname = 'email_templates_update_admin'
  ) THEN
    CREATE POLICY "email_templates_update_admin" ON public.email_templates FOR UPDATE TO authenticated
      USING (public.is_system_admin())
      WITH CHECK (public.is_system_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'email_templates' AND policyname = 'email_templates_delete_admin'
  ) THEN
    CREATE POLICY "email_templates_delete_admin" ON public.email_templates FOR DELETE TO authenticated
      USING (public.is_system_admin());
  END IF;
END $$;

-- ============================================================
-- 2. Trigger updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_email_template_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_email_templates_updated_at' AND tgrelid = 'public.email_templates'::regclass
  ) THEN
    CREATE TRIGGER update_email_templates_updated_at
      BEFORE UPDATE ON public.email_templates
      FOR EACH ROW
      EXECUTE FUNCTION public.update_email_template_updated_at();
  END IF;
END $$;

-- ============================================================
-- 3. Brand config mặc định trong system_settings
--    (logo_url, brand_color, signature_html, from_name)
-- ============================================================

INSERT INTO public.system_settings (key, value)
VALUES (
  'email_brand',
  jsonb_build_object(
    'logo_url', '',
    'brand_color', '#2563eb',
    'signature_html', 'Trân trọng,<br/>Đội ngũ VietSales Pro',
    'from_name', 'VietSales Pro'
  )
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 4. Seed các template mặc định (is_default = true)
--    Biến {{...}} được thay bằng giá trị thực khi gửi.
-- ============================================================

INSERT INTO public.email_templates (key, name, description, subject, body_html, variables, is_default, is_active)
VALUES
  (
    'billing_reminder',
    'Nhắc thanh toán hóa đơn',
    'Gửi khi hóa đơn chưa thanh toán (cron T-7/T-3/T-1 hoặc gửi thử).',
    '[{{brand_name}}] Nhắc thanh toán hóa đơn {{invoice_no}}',
    '<p>Kính gửi cửa hàng <strong>{{tenant_name}}</strong>,</p>
<p>Hóa đơn <strong>{{invoice_no}}</strong> đang chờ thanh toán.</p>
<ul>
  <li>Số tiền: <strong>{{invoice_total}}</strong></li>
  <li>Hạn thanh toán: <strong>{{invoice_due_date}}</strong></li>
  <li>Sử dụng dịch vụ đến: <strong>{{invoice_period_end}}</strong></li>
</ul>
<p>Vui lòng thanh toán trước hạn để tránh bị tạm khóa quyền ghi dữ liệu.</p>
{{bank_block}}',
    jsonb_build_array('brand_name','tenant_name','invoice_no','invoice_total','invoice_due_date','invoice_period_end','bank_block'),
    true,
    true
  ),
  (
    'billing_confirmation',
    'Xác nhận thanh toán hóa đơn',
    'Gửi khi admin xác nhận đã nhận tiền cho hóa đơn.',
    '[{{brand_name}}] Xác nhận thanh toán hóa đơn {{invoice_no}}',
    '<p>Kính gửi cửa hàng <strong>{{tenant_name}}</strong>,</p>
<p>Chúng tôi đã nhận được thanh toán cho hóa đơn <strong>{{invoice_no}}</strong>.</p>
<ul>
  <li>Số tiền: <strong>{{invoice_total}}</strong></li>
  <li>Dịch vụ được gia hạn đến: <strong>{{invoice_period_end}}</strong></li>
</ul>
<p>Cảm ơn quý cửa hàng đã tin dùng dịch vụ.</p>',
    jsonb_build_array('brand_name','tenant_name','invoice_no','invoice_total','invoice_period_end'),
    true,
    true
  ),
  (
    'ticket_reply',
    'Phản hồi ticket mới',
    'Gửi khi support ticket có phản hồi mới.',
    '[{{brand_name}}] Phản hồi mới cho ticket #{{ticket_short_id}}',
    '<p>Kính gửi cửa hàng <strong>{{tenant_name}}</strong>,</p>
<p>Ticket <strong>{{ticket_title}}</strong> vừa có phản hồi mới từ đội ngũ hỗ trợ.</p>
{{reply_content}}
<p><a href="{{ticket_url}}" style="color:#2563eb">Xem chi tiết ticket</a></p>',
    jsonb_build_array('brand_name','tenant_name','ticket_short_id','ticket_title','reply_content','ticket_url'),
    true,
    true
  ),
  (
    'ticket_assigned',
    'Ticket được gán người phụ trách',
    'Gửi khi ticket được gán cho một thành viên hỗ trợ.',
    '[{{brand_name}}] Ticket #{{ticket_short_id}} đã được gán người phụ trách',
    '<p>Kính gửi cửa hàng <strong>{{tenant_name}}</strong>,</p>
<p>Ticket <strong>{{ticket_title}}</strong> đã được gán cho <strong>{{assignee_name}}</strong>.</p>
<p><a href="{{ticket_url}}" style="color:#2563eb">Xem chi tiết ticket</a></p>',
    jsonb_build_array('brand_name','tenant_name','ticket_short_id','ticket_title','assignee_name','ticket_url'),
    true,
    true
  ),
  (
    'ticket_status',
    'Cập nhật trạng thái ticket',
    'Gửi khi trạng thái ticket thay đổi.',
    '[{{brand_name}}] Cập nhật trạng thái ticket #{{ticket_short_id}}',
    '<p>Kính gửi cửa hàng <strong>{{tenant_name}}</strong>,</p>
<p>Ticket <strong>{{ticket_title}}</strong> đã chuyển sang trạng thái <strong>{{ticket_status_label}}</strong>.</p>
<p>Ưu tiên: {{ticket_priority_label}}</p>
<p><a href="{{ticket_url}}" style="color:#2563eb">Xem chi tiết ticket</a></p>',
    jsonb_build_array('brand_name','tenant_name','ticket_short_id','ticket_title','ticket_status_label','ticket_priority_label','ticket_url'),
    true,
    true
  ),
  (
    'welcome',
    'Chào mừng tenant mới',
    'Gửi khi tạo tenant mới (manual hoặc tự động).',
    '[{{brand_name}}] Chào mừng {{tenant_name}} đến với VietSales Pro',
    '<p>Kính gửi cửa hàng <strong>{{tenant_name}}</strong>,</p>
<p>Tài khoản của bạn đã được tạo thành công trên nền tảng VietSales Pro.</p>
<p>Đăng nhập tại: <a href="{{login_url}}" style="color:#2563eb">{{login_url}}</a></p>
<p>Nếu cần hỗ trợ, vui lòng liên hệ qua hệ thống ticket trong dashboard.</p>',
    jsonb_build_array('brand_name','tenant_name','login_url'),
    true,
    true
  )
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 5. RPC: lấy brand config (dùng cho Edge Function + UI)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_email_brand()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value FROM public.system_settings WHERE key = 'email_brand';
  RETURN COALESCE(v_value, jsonb_build_object(
    'logo_url', '',
    'brand_color', '#2563eb',
    'signature_html', 'Trân trọng,<br/>Đội ngũ VietSales Pro',
    'from_name', 'VietSales Pro'
  ));
END;
$$;

REVOKE ALL ON FUNCTION public.get_email_brand() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_brand() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_brand() TO service_role;

-- ============================================================
-- 6. RPC: lấy template theo key (dùng cho Edge Function)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_email_template_by_key(p_key TEXT)
RETURNS TABLE (
  id UUID,
  key TEXT,
  name TEXT,
  subject TEXT,
  body_html TEXT,
  variables JSONB,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id, t.key, t.name, t.subject, t.body_html, t.variables, t.is_active
  FROM public.email_templates t
  WHERE t.key = p_key
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_email_template_by_key(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_template_by_key(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_template_by_key(TEXT) TO service_role;
