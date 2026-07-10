-- F28: Thêm email template gửi credential khi tạo shop từ Admin Dashboard
-- Template này được Edge Function create-tenant gọi qua send-template-email.

INSERT INTO public.email_templates (
  key,
  name,
  description,
  subject,
  body_html,
  variables,
  is_default,
  is_active
)
VALUES (
  'tenant_credentials',
  'Thông tin đăng nhập cửa hàng mới',
  'Gửi credential cho admin shop khi tạo tenant từ Admin Dashboard.',
  '[{{brand_name}}] Tài khoản quản trị cửa hàng {{shop_name}}',
  '<p>Xin chào <strong>{{admin_email}}</strong>,</p>
<p>Cửa hàng <strong>{{shop_name}}</strong> của bạn đã được tạo thành công trên {{brand_name}}.</p>
<p>Thông tin đăng nhập:</p>
<ul>
  <li>Link đăng nhập: <a href="{{shop_url}}" style="color:#2563eb">{{shop_url}}</a></li>
  <li>Email: <strong>{{admin_email}}</strong></li>
  <li>Mật khẩu: <strong>{{admin_password}}</strong></li>
</ul>
<p>Vui lòng đăng nhập và đổi mật khẩu ngay để đảm bảo an toàn.</p>
<p>Trân trọng,<br/>Đội ngũ {{brand_name}}</p>',
  jsonb_build_array('brand_name','shop_name','shop_url','admin_email','admin_password'),
  true,
  true
)
ON CONFLICT (key) DO NOTHING;
