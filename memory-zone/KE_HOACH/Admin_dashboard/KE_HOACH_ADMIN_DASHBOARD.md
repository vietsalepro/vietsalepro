# KẾ HOẠCH NÂNG CẤP ADMIN DASHBOARD — admin.vietsalepro.com

> **Ngày lập:** 2026-07-06  
> **Mục tiêu:** Biến `SystemAdminDashboard` hiện tại thành dashboard quản trị SaaS đầy đủ, tối ưu cho chủ hệ thống.  
> **Phạm vi:** File này chỉ là kế hoạch. Chưa implement code. Mỗi phase sẽ được triển khai riêng theo thứ tự ưu tiên.  
> **File tham chiếu:**
> - `pages/SystemAdminDashboard.tsx` — dashboard hiện tại
> - `services/tenantService.ts` — các hàm tenant/membership có sẵn
> - `services/subscriptionService.ts` — giới hạn subscription
> - `services/auditService.ts` — audit log
> - `supabase/migrations/20250705000002_phase8_admin_dashboard_rpc.sql` — RPC tạo/cập nhật tenant
> - `supabase/migrations/20250705000001_phase7_subscription_limits.sql` — trigger giới hạn
> - `supabase/migrations/20250705000007_phase9_6_audit_log_rate_limit.sql` — audit log + rate limit

---

## 1. Hiện trạng

`pages/SystemAdminDashboard.tsx` hiện tại chỉ có 3 chức năng cơ bản:

1. Liệt kê tất cả tenant dạng bảng đơn giản.
2. Tạo tenant mới (tên, subdomain, gói Free/VIP).
3. Đổi trạng thái tenant (active / suspended / trial / pending).

Các khả năng còn thiếu:

- Tìm kiếm, lọc, phân trang danh sách tenant.
- Sửa thông tin tenant (tên, subdomain, gói).
- Xóa/archive tenant.
- Xem giới hạn subscription và usage thực tế.
- Nâng/hạ gói và tùy chỉnh giới hạn từng tenant.
- Quản lý thành viên trong từng tenant.
- Reset password / mời member cho tenant.
- KPI và analytics hệ thống.
- Audit log toàn hệ thống.
- Rate limit logs.
- Quản lý system admin.
- Cấu hình và vận hành (data retention, gói mặc định, maintenance mode).

---

## 2. Tổng quan các phase

| Phase | Tên | Mục tiêu chính | Backend cần thêm | Frontend cần thêm |
|---|---|---|---|---|
| 1 | Tenant List & Core Management | Tìm kiếm, lọc, phân trang, sửa/xóa tenant | RPC search/update/delete tenant | KPI cards, filter bar, pagination, edit modal |
| 2 | Subscription & Usage | Giám sát giới hạn, nâng/hạ gói, custom limits | RPC usage summary + update subscription | Usage panel, progress bars, plan upgrade form |
| 3 | Member Management | Quản lý thành viên từng tenant | Dùng lại `invite-member` Edge Function | Member tab, invite/change role/remove |
| 4 | System Analytics | KPI hệ thống, top tenant, biểu đồ | RPC system overview + top tenants | Overview tab, KPI cards, charts |
| 5 | Audit & Security | Audit log toàn hệ thống, rate limit, system admin | RPC audit filter + rate limit logs + system admin CRUD | Audit tab, rate limit tab, system admin tab |
| 6 | Operations & Support | Data retention, cấu hình, export | RPC retention status + config | Operations tab, export CSV |

---

## 3. Chi tiết từng phase

### Phase 1 — Tenant List & Core Management

**Mục tiêu:** Cho phép chủ hệ thống quản lý danh sách tenant dễ dàng khi số lượng tăng.

#### Backend

- Tạo RPC `public.search_tenants(
    p_query TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_plan TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
  )` trả về `TABLE` + `total_count`.
- Tạo RPC `public.update_tenant(
    p_tenant_id UUID,
    p_name TEXT,
    p_subdomain TEXT,
    p_plan TEXT
  )` — chỉ system admin, kiểm tra unique subdomain.
- Tạo RPC `public.delete_tenant_safe(p_tenant_id UUID)` — xóa tenant và cascade `tenant_memberships`, `tenant_subscriptions`, `tenant_assets` (nếu có). Cân nhắc archive dữ liệu kinh doanh trước khi xóa.
- Hoặc tái sử dụng `tenantService.deleteTenant` nếu đủ.

#### Frontend

- KPI cards ở đầu trang:
  - Tổng số tenant
  - Active / Suspended / Trial / Pending
- Thanh tìm kiếm theo tên/subdomain.
- Filter dropdown: status, plan.
- Bảng tenant phân trang.
- Nút "Sửa" mở modal edit tên/subdomain/gói.
- Nút "Xóa" có xác nhận.
- Cột "Hành động": mở link `https://{subdomain}.vietsalepro.com`.

#### Verification

- `npm run lint` pass.
- `npm run build` pass.
- Manual test: tạo, sửa, xóa, tìm kiếm, phân trang.

---

### Phase 2 — Subscription & Usage

**Mục tiêu:** Quản lý giới hạn và gói dịch vụ của từng tenant.

#### Backend

- Tạo RPC `public.get_tenant_usage_summary(p_tenant_id UUID)` trả về:
  - `users_count`, `max_users`
  - `products_count`, `max_products`
  - `current_month_orders`, `max_orders_per_month`
  - `current_month_start`
- Tạo RPC `public.update_tenant_subscription(
    p_tenant_id UUID,
    p_plan TEXT,
    p_max_users INTEGER,
    p_max_products INTEGER,
    p_max_orders_per_month INTEGER,
    p_billing_status TEXT,
    p_expires_at TIMESTAMPTZ
  )` — chỉ system admin.
- Tạo RPC `public.reset_monthly_order_counter(p_tenant_id UUID)` (nếu cần hỗ trợ thủ công).

#### Frontend

- Expand row / detail panel cho từng tenant hiển thị usage.
- Progress bar cho user/product/order limits.
- Badge cảnh báo khi usage > 80%.
- Nút "Nâng cấp / Hạ cấp" gói.
- Form chỉnh custom limits, `billing_status`, `expires_at`.

#### Verification

- Test nâng/hạ gói.
- Test cảnh báo khi tenant gần đạt giới hạn.
- Test trigger `check_tenant_limits` vẫn hoạt động.

---

### Phase 3 — Member Management

**Mục tiêu:** Quản lý user và role trong từng tenant.

#### Backend

- Sử dụng lại Edge Function `supabase/functions/invite-member/index.ts`.
- Sử dụng lại `tenantService.updateMemberRole`, `tenantService.removeMember`.
- Tạo RPC `public.reset_tenant_user_password(p_tenant_id UUID, p_user_id UUID)` hoặc gọi Edge Function `reset-password`.

#### Frontend

- Trang/tab "Thành viên" trong chi tiết tenant.
- Bảng members với: email, role, invited_by, created_at.
- Form mời member (email + role).
- Dropdown đổi role.
- Nút xóa member có xác nhận.
- Nút reset password cho user.

#### Verification

- Test mời member, đổi role, xóa member.
- Test reset password.
- Test không vượt giới hạn số user của gói.

---

### Phase 4 — System Analytics

**Mục tiêu:** Cung cấp cái nhìn tổng quan về hệ thống.

#### Backend

- Tạo RPC `public.get_system_overview()` trả về:
  - total_tenants, active_tenants, suspended_tenants
  - total_users, total_orders, total_revenue
- Tạo RPC `public.get_top_tenants(p_limit INTEGER, p_order_by TEXT)` — theo revenue/orders/users.
- Tạo RPC `public.get_tenant_growth(p_days INTEGER)` — tenant mới theo ngày.

#### Frontend

- Tab "Tổng quan".
- KPI cards hệ thống (tái sử dụng component từ `pages/Dashboard.tsx`).
- Biểu đồ tenant mới theo thời gian.
- Bảng top tenant.
- Tenant gần hết hạn / sắp đạt giới hạn.

#### Verification

- Test RPC với dữ liệu lớn.
- Đảm bảo system admin có thể xem toàn bộ tenant.

---

### Phase 5 — Audit & Security

**Mục tiêu:** Giám sát hoạt động và bảo mật hệ thống.

#### Backend

- Mở rộng `getAuditLogs` trong `services/auditService.ts` để filter theo `tenant_id`, `user_id`, `action`, `table_name`, `date_from`, `date_to`.
- Tạo RPC `public.get_rate_limit_logs(
    p_action TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
  )` — chỉ system admin.
- Tạo RPC `public.add_system_admin(p_user_id UUID)` và `public.remove_system_admin(p_user_id UUID)`.

#### Frontend

- Tab "Audit log" với bộ lọc theo tenant, action, date range.
- Tab "Rate limit" hiển thị đăng nhập sai, tạo tenant nhiều lần, invite nhiều lần.
- Tab "System admins": bảng system admin, form thêm/xóa.

#### Verification

- Test filter audit log.
- Test rate limit logs chỉ system admin xem được.
- Test thêm/xóa system admin.

---

### Phase 6 — Operations & Support

**Mục tiêu:** Cấu hình hệ thống và hỗ trợ vận hành.

#### Backend

- Tạo RPC `public.get_data_retention_status()` trả về last_run, archived_orders_count, cleaned_rate_limit_logs, v.v.
- Tạo RPC `public.get_default_plan_limits()` và `public.set_default_plan_limits(...)`.
- Tạo RPC `public.set_maintenance_mode(p_enabled BOOLEAN, p_message TEXT)`.

#### Frontend

- Tab "Vận hành":
  - Trạng thái data retention cron.
  - Cấu hình giới hạn mặc định Free/VIP.
  - Maintenance mode toggle + thông báo.
- Nút "Export CSV" danh sách tenant với đầy đủ thông tin.
- Nút kiểm tra subdomain availability trực tiếp trong form tạo tenant.

#### Verification

- Test export CSV.
- Test cấu hình maintenance mode.

---

## 4. Thứ tự triển khai đề xuất

1. **Phase 1** — Ngay lập tức giá trị nhất, dashboard dùng được với nhiều tenant.
2. **Phase 2** — Quan trọng cho mô hình SaaS (billing/limits).
3. **Phase 3** — Hỗ trợ tenant và user onboarding.
4. **Phase 5** — Bảo mật và giám sát.
5. **Phase 4** — Analytics sau khi đã có đủ dữ liệu.
6. **Phase 6** — Tối ưu vận hành.

Có thể hoán đổi Phase 4 và 5 tùy ưu tiên.

---

## 5. Nguyên tắc chung khi implement

- **Lazy / ponytail:** Reuse component và service có sẵn (`AuditLog.tsx`, `Dashboard.tsx` charts, `tenantService`, `subscriptionService`, `auditService`).
- **Mỗi phase một backup:** Tạo backup folder trước khi sửa code.
- **Mỗi phase chạy lint + build:** Đảm bảo `npm run lint` và `npm run build` pass trước khi sang phase tiếp theo.
- **Mỗi phase có test nhỏ:** Failing test trước, fix sau (theo workflow của dự án).
- **Không implement tất cả một lượt:** Giảm rủi ro, dễ review, dễ rollback.
- **Không để lộ service role key:** Các thao tác nhạy cảm (tạo user, reset password) tiếp tục dùng Edge Functions.

---

## 6. Tài nguyên cần dùng lại

- `pages/SystemAdminDashboard.tsx` — nâng cấp từ từ.
- `services/tenantService.ts` — đã có CRUD tenant/membership/subscription.
- `services/subscriptionService.ts` — check limit.
- `services/auditService.ts` — đọc/ghi audit log.
- `pages/AuditLog.tsx` — tái sử dụng UI cho audit log.
- `pages/Dashboard.tsx` — tái sử dụng KPI card và chart components.
- Edge Functions: `create-tenant`, `invite-member`, `reset-password`, `audit-log`.

---

## 7. Câu hỏi cần làm rõ trước khi bắt đầu

> Cập nhật 2026-07-06: trạng thái từng câu hỏi.

- [ ] Có muốn chức năng **"Login as tenant admin"** (impersonation) không? → **CHƯA CHỐT** — xem mục 21.
- [ ] Khi xóa tenant, có muốn **archive toàn bộ dữ liệu kinh doanh** (orders, products, v.v.) trước khi xóa không? → **CHƯA CHỐT** — xem mục 21.
- [x] Gói Free/VIP có thêm gói trung gian trong tương lai không? → **ĐÃ CHỐT: Không.** Chỉ Free và VIP (mục 17.1). Do đó Plan Builder (P8) bị hoãn — xem ghi chú YAGNI ở mục 13.
- [ ] Có muốn dashboard hỗ trợ **dark mode** hoặc **mobile responsive** hoàn chỉnh không? → **CHƯA CHỐT** — ưu tiên thấp, quyết định khi implement UI.

---

## 8. Đánh giá độ đầy đủ so với admin dashboard SaaS chuẩn

Kế hoạch 6 phase ở trên đủ cho **MVP admin dashboard** của VietSale Pro. Tuy nhiên, so với các admin dashboard SaaS chuyên nghiệp (KiotViet, Shopify, Stripe, v.v.), vẫn còn nhiều nhóm tính năng chưa đề cập.

### 8.1. Những gì đã có trong kế hoạch (MVP đủ dùng)

- Quản lý tenant cơ bản (CRUD, tìm kiếm, phân trang)
- Subscription & usage giới hạn
- Member management
- System-wide analytics cơ bản
- Audit log & rate limit
- System admin management
- Cấu hình và vận hành cơ bản

### 8.2. Những tính năng còn thiếu so với SaaS chuẩn

| Nhóm | Tính năng thiếu | Mức độ ưu tiên | Ghi chú |
|---|---|---|---|
| **Billing & Payments** | Hóa đơn, thanh toán, lịch sử giao dịch, refund/credit | Cao | Rất cần khi bắt đầu thu phí thực tế |
| **Billing & Payments** | MRR/ARR, churn rate, cohort analysis | Trung bình | Dùng cho analytics tài chính |
| **Support** | Ticket support / help desk cho từng tenant | Trung bình | Cần khi có nhiều tenant |
| **Feature Management** | Feature flags / tính năng bật/tắt theo tenant | Cao | Cho phép thử nghiệm gói mới |
| **Feature Management** | Custom plan / plan builder | Cao | Tạo gói linh hoạt hơn Free/VIP |
| **Security** | 2FA bắt buộc cho system admin | Cao | Nâng cao bảo mật |
| **Security** | Fraud/abuse detection | Trung bình | Phát hiện tenant dùng sai mục đích |
| **Integrations** | API key / webhook management cho tenant | Trung bình | KiotViet có kết nối API |
| **Integrations** | Marketplace / đối tác (Shopee, Lazada, v.v.) | Thấp | Phụ thuộc chiến lược kinh doanh |
| **Operations** | Backup/restore từng tenant | Cao | Cần cho support nghiêm trọng |
| **Operations** | System health monitoring (DB, storage, edge functions) | Trung bình | Giám sát hạ tầng |
| **Operations** | Bulk operations trên nhiều tenant | Trung bình | Cập nhật cấu hình hàng loạt |
| **Tenant Experience** | Onboarding checklist / wizard | Trung bình | Giúp tenant setup nhanh |
| **Tenant Experience** | Custom domain / white-label | Thấp | Yêu cầu kỹ thuật phức tạp |
| **Communications** | Global announcements / in-app messages | Trung bình | Thông báo bảo trì, khuyến mãi |
| **Communications** | Email templates / notification settings | Trung bình | Cá nhân hóa thông báo |
| **Legal/Compliance** | GDPR / data export per tenant | Trung bình | Xuất dữ liệu cá nhân |
| **Legal/Compliance** | Terms acceptance log | Thấp | Theo dõi chấp thuận điều khoản |

### 8.3. Về KiotViet cụ thể

KiotViet là **phần mềm quản lý bán hàng cho cửa hàng**, không phải nền tảng multi-tenant SaaS công khai cho bên thứ 3. Những tài liệu công khai của KiotViet chủ yếu mô tả:

- Quản lý cửa hàng (hàng hóa, đối tác, giao dịch, nhân viên)
- Phân quyền người dùng và vai trò
- Xác thực 2 lớp
- Kết nối API cho đối tác
- Báo cáo doanh thu, lợi nhuận

KiotViet **không công khai** admin dashboard cấp hệ thống (super admin) dùng để quản lý nhiều cửa hàng. Do đó, không thể so sánh trực tiếp 1:1. Thay vào đó, nên dùng **checklist SaaS admin panel chuẩn** làm tham chiếu.

---

## 9. Làm sao để kiểm tra độ tin cậy / đầy đủ của kế hoạch?

### 9.1. Phương pháp 1: User Story Mapping cho system admin

Viết ra các câu chuyện người dùng của chủ hệ thống, ví dụ:

- "Tôi muốn thấy tổng quan doanh thu của tất cả cửa hàng"
- "Tôi muốn tìm cửa hàng đang gặp lỗi đăng nhập"
- "Tôi muốn đình chỉ cửa hàng vi phạm"
- "Tôi muốn xem ai đang dùng thử và sắp hết hạn"
- "Tôi muốn hoàn tiền cho một cửa hàng"
- "Tôi muốn gửi thông báo bảo trì cho tất cả cửa hàng"

Nếu một câu chuyện không có tính năng tương ứng trong kế hoạch → đó là gap cần bổ sung.

### 9.2. Phương pháp 2: "Day in the life" của admin

Tưởng tượng một ngày làm việc của chủ hệ thống VietSale Pro:

- Buổi sáng: mở dashboard, xem tổng quan hệ thống, kiểm tra alert.
- Có tenant báo lỗi: tìm tenant, xem audit log, reset password, kiểm tra giới hạn.
- Có tenant đăng ký mới: duyệt, kích hoạt, gửi hướng dẫn.
- Cuối tháng: xuất báo cáo doanh thu, kiểm tra subscription sắp hết hạn.
- Bảo trì: đặt maintenance mode, thông báo.

Nếu bước nào chưa có trong dashboard → cần thêm.

### 9.3. Phương pháp 3: So sánh với 2-3 nền tảng tham chiếu

Lập bảng so sánh tính năng với:

- Shopify Partners / Shopify Admin
- Stripe Dashboard
- Vercel Team / Organization Admin
- Notion Enterprise Admin
- Hoặc bất kỳ SaaS admin panel nào bạn đã dùng

Mỗi tính năng đánh dấu: **Có / Chưa có / Không cần**. Cái nào "Chưa có" và "Cần" thì thêm vào kế hoạch.

### 9.4. Phương pháp 4: Đặt câu hỏi định kỳ sau khi vận hành

Sau 1-2 tháng vận hành thực tế, tự hỏi:

- Việc nào tôi phải làm thủ công qua SQL/Supabase Dashboard thay vì dashboard?
- Việc nào mất nhiều click nhất?
- Tenant nào hay gặp vấn đề gì? Có cần cảnh báo sớm không?
- Tôi có cần hoàn tiền, đổi gói, gia hạn hàng loạt không?

Câu trả lời sẽ cho ra các tính năng cần bổ sung tiếp theo.

### 9.5. Phương pháp 5: Mô hình Cấp độ trưởng thành (Maturity Model)

Chia admin dashboard thành 4 cấp độ:

| Cấp độ | Tên | Đặc điểm |
|---|---|---|
| **L1 — Survival** | Sống sót | CRUD tenant, đổi trạng thái, tạo user. Đủ để vận hành cơ bản. |
| **L2 — Operational** | Vận hành | Subscription, usage, member management, audit log. Đủ để quản lý hàng chục tenant. |
| **L3 — Analytical** | Phân tích | KPI, top tenant, churn, MRR, cohort, system health. Đủ để ra quyết định kinh doanh. |
| **L4 — Strategic** | Chiến lược | Billing tự động, feature flags, support tickets, marketplace, white-label. Đủ để scale. |

Kế hoạch 6 phase hiện tại đưa VietSale Pro lên **L2 — Operational**, có phần chạm L3 nếu làm Phase 4 và 5. Các tính năng L3/L4 sẽ được bổ sung dần dựa trên phản hồi thực tế.

---

## 10. Kết luận về độ đầy đủ

- Kế hoạch **đủ để vận hành MVP multi-tenant** với hàng chục tenant.
- Kế hoạch **chưa đầy đủ** so với admin dashboard SaaS chuyên nghiệp có hàng trăm/thousands tenant.
- KiotViet không công khai admin dashboard cấp hệ thống, nên không thể so sánh trực tiếp. Nên dùng **checklist SaaS admin chuẩn**.
- Cách đáng tin cậy nhất để kiểm tra: **vận hành thực tế 1-2 tháng**, ghi lại các thao tác thủ công, và bổ sung tính năng theo nhu cầu thực.
- Kế hoạch là **tài liệu sống**: cần cập nhật khi phát hiện gap mới, không cần hoàn thiện 100% từ đầu.

---

# PHẦN 2: KẾ HOẠCH ADMIN DASHBOARD PRODUCTION-READY — 20 NĂM VẬN HÀNH

> **Yêu cầu mới:** Admin dashboard phải sẵn sàng production ngay, không phải MVP thử nghiệm. Cần đầy đủ tính năng để vận hành lâu dài.
>
> **Lưu ý:** "20 năm" không có nghĩa là phải xây hết mọi thứ ngay bây giờ. Nghĩa là kiến trúc và nền tảng phải đủ vững để có thể mở rộng dần trong 20 năm, không phải refactor lại từ đầu.

---

## 11. Những tính năng bắt buộc phải có cho production

### 11.1. Billing & Payments (thu phí thực tế)

| Tính năng | Mô tả | Backend cần | Frontend cần |
|---|---|---|---|
| Invoicing | Tạo hóa đơn định kỳ cho tenant | Bảng `invoices`, `invoice_items` | Quản lý hóa đơn, xem chi tiết, gửi email |
| Payment records | Ghi nhận thanh toán | Bảng `payments` | Lịch sử thanh toán, ghi nhận thủ công |
| Refund / credit | Hoàn tiền, tạo credit | RPC refund/credit | Form hoàn tiền, credit balance |
| Plan change proration | Tính tiền khi đổi gói giữa kỳ | Edge Function tính proration | Preview chi phí khi đổi gói |
| Billing reminder | Nhắc nhở thanh toán sắp đến hạn | Cron + email template | Cấu hình reminder |
| ~~Payment gateway integration~~ | ~~Kết nối Stripe/VNPay/Momo~~ — **HOÃN: đã chốt chuyển khoản thủ công (mục 17.1)** | — | — |

### 11.2. Advanced Subscription & Plan Management

| Tính năng | Mô tả | Backend cần | Frontend cần |
|---|---|---|---|
| Plan builder | Tạo nhiều gói linh hoạt | Bảng `plans` thay vì chỉ `free`/`vip` | CRUD plan, set limits |
| Feature flags | Bật/tắt tính năng theo tenant | Bảng `tenant_features` | Toggle feature per tenant |
| Add-ons | Mua thêm user/product/đơn | Bảng `add_ons`, `tenant_add_ons` | Quản lý add-on |
| Trial management | Trial 7/14/30 ngày, convert, extend | RPC trial control | Trial dashboard |
| Promo codes | Mã giảm giá cho gói | Bảng `promo_codes` | Tạo/apply promo code |
| Cancellation / downgrade | Cho phép tenant hủy/hạ gói | Workflow cancellation | Nút hủy, retain logic |

### 11.3. Security & Compliance

| Tính năng | Mô tả | Backend cần | Frontend cần |
|---|---|---|---|
| 2FA for system admin | Bắt buộc xác thực 2 lớp | TOTP setup, backup codes | 2FA setup page |
| Login history | Lịch sử đăng nhập system admin | Bảng `admin_login_history` | Xem login history |
| Suspicious activity alert | Cảnh báo đăng nhập bất thường | Rule engine | Alert panel |
| Fraud detection | Phát hiện tenant spam/tạo nhiều account | Heuristic + rate limit | Fraud queue |
| Data export per tenant | Xuất dữ liệu theo yêu cầu | RPC export | Nút export |
| Terms acceptance log | Ghi nhận đồng ý điều khoản | Bảng `terms_acceptance` | Log viewer |
| Data retention policy | Xóa dữ liệu cũ theo quy định | Cron + config | Policy config |

### 11.4. Support & Communication

| Tính năng | Mô tả | Backend cần | Frontend cần |
|---|---|---|---|
| Support tickets | Tenant mở ticket hỗ trợ | Bảng `support_tickets`, `ticket_replies` | Ticket inbox, assign, reply |
| Knowledge base | Tài liệu hướng dẫn | CMS đơn giản | KB editor |
| Announcements | Thông báo toàn hệ thống | Bảng `announcements` | Tạo/schedule announcement |
| In-app messages | Tin nhắn trong app tenant | API message | Message composer |
| Email templates | Mẫu email welcome, reminder, invoice | Bảng `email_templates` | Template editor |
| Notification log | Lịch sử gửi email/notification | Bảng `notification_logs` | Log viewer |

### 11.5. System Observability & Operations

| Tính năng | Mô tả | Backend cần | Frontend cần |
|---|---|---|---|
| System health dashboard | Trạng thái DB, storage, edge functions | Metrics collector / Supabase API | Health cards |
| Error log aggregation | Tập hợp lỗi từ edge functions | Sentry/Supabase logs integration | Error list |
| Performance metrics | P95/P99 query time, RPS | pg_stat_statements, logs | Charts |
| Storage usage per tenant | Giám sát dung lượng storage | Storage size RPC | Usage bars |
| Backup status | Last backup, restore point | Supabase CLI / PITR status | Backup status card |
| Bulk operations | Update nhiều tenant cùng lúc | RPC bulk update | Bulk action UI |
| Maintenance scheduler | Lên lịch bảo trì | Bảng `maintenance_windows` | Calendar / schedule |

### 11.6. Tenant Data Operations

| Tính năng | Mô tả | Backend cần | Frontend cần |
|---|---|---|---|
| Backup per tenant | Xuất toàn bộ dữ liệu 1 tenant | RPC dump tenant data | Nút backup |
| Restore per tenant | Khôi phục dữ liệu tenant | Import workflow | Nút restore |
| Archive tenant | Đóng băng tenant nhưng giữ dữ liệu | Status `archived` | Archive action |
| Data migration | Chuyển tenant giữa các môi trường | Migration script | Migration tool |
| Reset demo data | Xóa dữ liệu demo cho tenant trial | RPC reset demo | Reset button |

### 11.7. Integrations & API Platform

| Tính năng | Mô tả | Backend cần | Frontend cần |
|---|---|---|---|
| API key management | Tenant tạo/revoke API key | Bảng `tenant_api_keys` | API key UI |
| Webhook management | Tenant cấu hình webhook | Bảng `tenant_webhooks` | Webhook UI |
| Webhook event log | Log gửi webhook | Bảng `webhook_deliveries` | Delivery log |
| Integration marketplace | Liệt kê tích hợp sẵn có | Bảng `integrations` | Marketplace UI |
| Partner portal | Quản lý đối tác API | Bảng `partners` | Partner admin |

### 11.8. Analytics & Business Intelligence

| Tính năng | Mô tả | Backend cần | Frontend cần |
|---|---|---|---|
| MRR / ARR dashboard | Monthly/Annual Recurring Revenue | RPC tính MRR | KPI cards |
| Churn analysis | Tỷ lệ tenant rời bỏ | RPC churn | Churn chart |
| Cohort analysis | Retention theo tháng tạo tenant | RPC cohort | Cohort table |
| Revenue by plan | Doanh thu theo gói | RPC revenue by plan | Pie chart |
| Tenant lifetime value | LTV trung bình | RPC LTV | KPI |
| Sales funnel | Trial → paid conversion | RPC funnel | Funnel chart |

---

## 12. Kiến trúc cho 20 năm vận hành

### 12.1. Database

- **Partitioning:** `app_audit_log` đã được chuẩn bị partition. Tiếp tục partition các bảng lớn: `orders`, `order_items`, `payments`, `invoices`.
- **Read replica:** Khi lượng đọc analytics tăng, thêm read replica và chuyển report queries sang replica.
- **Connection pooling:** Dùng Supabase connection pooler khi số tenant lớn.
- **Archival:** Tiếp tục archive orders > 2 năm. Mở rộng archive cho `invoices`, `payments`, `audit_log`.
- **Multi-schema hoặc multi-project:** Khi đạt ~1000 tenant hoặc cần cách ly vật lý, cân nhắc tách tenant VIP sang schema/project riêng.

### 12.2. Backend / Edge Functions

- **API versioning:** Version API để không break existing tenant integrations.
- **Rate limiting:** Mở rộng rate limit cho billing webhooks, API keys.
- **Queue system:** Dùng Supabase background functions hoặc external queue (QStash, Inngest) cho heavy operations: backup tenant, export data, bulk email.
- **Idempotency:** Tất cả payment webhooks và bulk operations phải idempotent.

### 12.3. Frontend

- **Modular architecture:** Chia dashboard thành các module riêng biệt: tenant, billing, support, analytics, system.
- **Role-based admin:** Có thể cần nhiều cấp system admin (super admin, billing admin, support admin).
- **Audit UI changes:** Log cả thao tác trong admin dashboard.
- **Mobile responsive:** Admin cần xem trên tablet/mobile.

### 12.4. Security

- **Zero-trust:** System admin luôn phải 2FA.
- **Least privilege:** Phân quyền nhỏ trong admin dashboard.
- **Secret management:** Không để lộ API keys trong frontend.
- **Penetration testing:** Định kỳ kiểm thử bảo mật.

### 12.5. Operations

- **Monitoring:** Uptime, error rate, DB health, storage health.
- **Alerting:** PagerDuty/Slack alerts khi system down.
- **Runbooks:** Tài liệu xử lý sự cố.
- **Disaster recovery:** Test restore định kỳ (đã có trong Phase 17).
- **CI/CD:** Tự động deploy từ master, có staging gate.

---

## 13. Lộ trình triển khai đề xuất (production-ready)

Thay vì 6 phase, production-ready cần **14 phase** chia thành 4 giai đoạn lớn:

### Giai đoạn 1: Foundation

| Phase | Nội dung | Mục tiêu |
|---|---|---|
| P1 | Tenant list & core management | Tìm kiếm, phân trang, sửa/xóa |
| P2 | Subscription & usage | Giới hạn, usage, nâng/hạ gói |
| P3 | Member management | Quản lý thành viên tenant |
| P4 | System analytics | KPI hệ thống cơ bản |
| P5 | Audit & security | Audit log, rate limit, system admin |
| P6 | Operations & support cơ bản | Data retention, export, config |

### Giai đoạn 2: Billing & Monetization

| Phase | Nội dung | Mục tiêu |
|---|---|---|
| P7 | Invoicing & payment records | Tạo hóa đơn, ghi nhận thanh toán |
| P8 | Plan builder & feature flags | Gói linh hoạt, bật/tắt tính năng |
| P9 | Billing automation & reminders | Tự động hóa đơn, nhắc thanh toán |
| P10 | Refund, credit, proration | Hoàn tiền, credit, tính tiền đổi gói |

> **Ghi chú YAGNI (2026-07-06):** Đã chốt chỉ có Free và VIP (mục 17.1), nên **P8 Plan Builder bị hoãn vô thời hạn** — giữ hardcode `free`/`vip`, KHÔNG tạo bảng `plans` trước. Chỉ làm P8 khi thực sự cần thêm gói mới. Feature flags (nếu cần) có thể dùng cột JSONB `tenants.settings` sẵn có thay vì bảng riêng.

### Giai đoạn 3: Support & Scale

| Phase | Nội dung | Mục tiêu |
|---|---|---|
| P11 | Support tickets & knowledge base | Hỗ trợ tenant có hệ thống |
| P12 | Communications & announcements | Thông báo, email templates |
| P13 | System observability & health | Giám sát hạ tầng, alerting |
| P14 | Tenant data operations | Backup/restore/archive per tenant |

### Giai đoạn 4: Advanced

| Phase | Nội dung | Mục tiêu |
|---|---|---|
| P15 | API platform & webhooks | Cho phép tenant tích hợp |
| P16 | Advanced analytics & BI | MRR, churn, cohort, LTV |
| P17 | Compliance & security hardening | 2FA, data export, fraud detection |
| P18 | Multi-region & enterprise features | Scale toàn cầu, white-label |

> **Ghi chú YAGNI (2026-07-06):** Giai đoạn 4 (trừ phần 2FA/login history của P17 đã kéo vào Milestone 1) chỉ là **tầm nhìn dài hạn**. KHÔNG tạo schema, KHÔNG viết code chuẩn bị trước cho P15, P16, P18. Chỉ bắt đầu khi có nhu cầu thực tế từ vận hành.

---

## 14. Những quyết định kinh doanh cần chốt NGAY BÂY GIỜ

> Cập nhật 2026-07-06: Đồng bộ với các quyết định đã chốt ở mục 17 và 19. Các mục còn `[ ]` là thực sự chưa quyết định.

### 14.1. Billing

- [x] Thanh toán tự động hay thủ công? → **Chuyển khoản ngân hàng thủ công** (mục 17.1).
- [x] Gói dịch vụ có gì ngoài Free/VIP? Có cần gói trung gian? → **Không. Chỉ Free và VIP** (mục 17.1).
- [x] Thanh toán theo tháng hay năm? Có giảm giá năm? → **Cả hai. 69.000 ₫/tháng, 59.000 ₫/tháng khi mua năm** (mục 17.1).
- [ ] Có hoàn tiền không? Chính sách refund là gì? → **CHƯA CHỐT chi tiết** — P10 mới phác thảo cơ chế (negative payment/credit note), chưa có chính sách cụ thể (hoàn trong bao nhiêu ngày, điều kiện gì).
- [ ] Có dùng thử (trial) bao lâu? Có yêu cầu thẻ tín dụng? → **CHƯA CHỐT** — status `trial` đã tồn tại trong schema nhưng chưa định nghĩa thời hạn/workflow convert.

### 14.2. Support

- [x] Có cần ticket support không? Hay chỉ email/Zalo? → **Zalo cá nhân là kênh chính + ticket system trong dashboard là kênh phụ** (mục 17.2).
- [ ] SLA là gì? (ví dụ: phản hồi trong 24h) → **CHƯA CHỐT.**
- [ ] Có knowledge base riêng không? → **CHƯA CHỐT** — YAGNI, hoãn đến Giai đoạn 3.

### 14.3. Security

- [x] Có bắt buộc 2FA cho system admin không? → **Không bắt buộc, tùy chọn. TOTP/Google Authenticator** (mục 17.3).
- [x] Có cần login history và suspicious activity alert? → **Có** (mục 18.4).
- [ ] Có cần IP whitelist cho admin dashboard? → **CHƯA CHỐT.**

### 14.4. Operations

- [ ] Có cần multi-region? (Vietnam only hay ASEAN?) → **CHƯA CHỐT** — YAGNI, mặc định Vietnam only, chỉ xem lại ở Giai đoạn 4.
- [ ] Có cần white-label / custom domain cho tenant VIP? → **CHƯA CHỐT** — YAGNI, Giai đoạn 4.
- [ ] Có cần integration với Shopee/Lazada/Tiki? → **CHƯA CHỐT** — YAGNI, Giai đoạn 4.
- [ ] Có cần API public cho đối tác? → **CHƯA CHỐT** — YAGNI, Giai đoạn 4.

### 14.5. Compliance

- [ ] Có tuân thủ GDPR / Nghị định 13/2023 (bảo vệ dữ liệu cá nhân VN)? → **CHƯA CHỐT.**
- [ ] Có cần data localization (dữ liệu phải ở VN)? → **CHƯA CHỐT** — lưu ý: Supabase region hiện tại cần kiểm tra nếu yêu cầu này thành bắt buộc.
- [ ] Có cần điều khoản sử dụng và log chấp thuận? → **CHƯA CHỐT.**
- [ ] **Lưu ý pháp lý về hóa đơn:** "Hóa đơn" trong kế hoạch này là **phiếu thanh toán nội bộ**, KHÔNG phải hóa đơn điện tử hợp lệ theo Nghị định 123/2020. Nếu doanh nghiệp có đăng ký kinh doanh và cần xuất hóa đơn VAT, phải tích hợp nhà cung cấp hóa đơn điện tử (Viettel, VNPT, MISA meInvoice...) — **CHƯA CHỐT**, cần làm rõ trước khi thu phí chính thức.

---

## 15. Những gì cần sửa trong codebase hiện tại để chuẩn production-ready

### 15.1. Schema cần bổ sung

> Cập nhật 2026-07-06: Chia theo mức độ cần thiết. Chỉ tạo bảng khi phase tương ứng bắt đầu — KHÔNG tạo trước.

**Milestone 1 (cần cho launch):**

- `invoices`, `invoice_items` — hóa đơn (P7)
- `payments` — thanh toán (P7)
- `bank_accounts` — thông tin ngân hàng hiển thị trên hóa đơn (P7)
- `promo_codes` — voucher/khuyến mãi (P10 partial)
- `promotion_rules` — khuyến mãi cố định (ví dụ: mua năm tặng x tháng) (P10 partial)
- `support_tickets`, `ticket_replies`, `ticket_reply_templates` — hỗ trợ (P11)
- `admin_login_history` — lịch sử đăng nhập admin (P17)
- `admin_2fa_backup_codes` — backup codes 2FA, **lưu hash** (P17)

**Milestone 2 (khi cần):**

- `announcements` — thông báo (P12)
- `email_templates` — mẫu email (P12)
- `notification_logs` — log notification (P12)
- `maintenance_windows` — lịch bảo trì (P13)

**YAGNI — KHÔNG tạo trước (Giai đoạn 4 hoặc hoãn vô thời hạn):**

- ~~`plans`~~ — hoãn, chỉ có Free/VIP hardcode (xem ghi chú YAGNI mục 13)
- ~~`tenant_features`~~ — dùng `tenants.settings` JSONB nếu cần
- `tenant_api_keys`, `tenant_webhooks`, `webhook_deliveries` — chỉ khi làm P15
- `terms_acceptance` — chỉ khi chốt compliance (mục 14.5)

### 15.2. Code cần refactor

- `SystemAdminDashboard.tsx` — chia thành nhiều page/tab/module thay vì một file.
- `tenantService.ts` — tách thành `tenantAdminService`, `billingService`, `supportService`, `promotionService`.
- Tạo `bankAccountService` để admin cấu hình thông tin ngân hàng.
- Thêm `useAdminPermissions` hook nếu có nhiều cấp admin.
- Thêm error boundary và loading states chuẩn.

### 15.3. Infrastructure cần chuẩn bị

- Supabase Pro hoặc Enterprise cho PITR, read replica, connection pooling.
- Email service: **ĐÃ CHỐT Resend** (2026-07-06) — gửi qua Edge Function, API key lưu trong Supabase secrets.
- SMS provider (Twilio, Vonage, esms.vn, speedsms.vn) cho 2FA.
- Monitoring tool (Sentry, Logflare, hoặc Supabase logs).
- Alerting channel (Slack, email, Telegram).

---

## 16. Kết luận production-ready

- Để admin dashboard **production-ready lâu dài**, cần ít nhất **14 phase** (6 phase foundation + 8 phase production).
- Không thể làm hết 14 phase trong một lượt. Cần chia thành các milestone:
  - **Milestone 1 (launch):** P1-P6 + P7 (invoicing cơ bản) + P11 (support ticket đơn giản) + P17 cơ bản (2FA cho system admin).
  - **Milestone 2 (scale):** P8-P10 (billing automation) + P12-P14 (support & operations).
  - **Milestone 3 (enterprise):** P15-P18 (API platform, BI, compliance, multi-region).
- Kiến trúc phải đủ mở để mở rộng: modular frontend, API versioning, partition, read replica, queue system.
- Cần chốt các quyết định kinh doanh ở mục 14 trước khi bắt đầu implement.

---

## 17. Quyết định kinh doanh đã chốt (2026-07-06)

Dựa trên phản hồi của chủ hệ thống, các quyết định sau đã được chốt để điều chỉnh kế hoạch:

### 17.1. Thanh toán

- **Phương thức:** Chuyển khoản ngân hàng thủ công.
- **Không tích hợp:** Stripe / VNPay / Momo tự động trong giai đoạn đầu.
- **Giá gói VIP:**
  - Theo tháng: **69.000 ₫/tháng**.
  - Theo năm: **59.000 ₫/tháng**, tính ra **708.000 ₫/năm** (12 tháng × 59.000 ₫).
  - Người dùng tự chọn mua theo tháng hoặc năm.
- **Gói Free:** Giữ nguyên giới hạn hiện tại (1 user, 50 SKU, 300 đơn/tháng). Không thay đổi.
- **Không có gói trung gian:** Chỉ Free và VIP.
- **Khuyến mãi do admin cấu hình:**
  - **Voucher/promo code:** Admin tạo mã giảm giá, tenant nhập khi thanh toán.
  - **Mua 1 năm tặng x tháng:** Admin cấu hình `bonus_months`. Ví dụ: mua 12 tháng tặng 2 tháng = 14 tháng sử dụng.
  - **Giảm giá phần trăm theo voucher:** Ví dụ giảm 20% cho mã `KHAITRUONG`.
- **Voucher giới hạn:** Mỗi hóa đơn chỉ dùng 1 voucher. Không kết hợp nhiều voucher. Nhưng có thể kết hợp voucher + chương trình khuyến mãi (ví dụ: voucher 10% + mua năm tặng 1 tháng).
- **Thông tin ngân hàng:** Admin có thể tùy chỉnh và lưu trong dashboard (tên TK, số TK, ngân hàng, nội dung chuyển khoản).
- **Số hóa đơn:** Có quy tắc tự động (ví dụ: `INV-2026-0001`).
- **Xuất PDF:** Có thể xuất hóa đơn ra PDF.
- **Thời hạn hóa đơn:** Hóa đơn có hiệu lực **48 giờ** (điều chỉnh từ 24 giờ ngày 2026-07-06 — đủ thời gian chuyển khoản thủ công kể cả cuối tuần). Nếu tenant chưa thanh toán trong 48 giờ, hóa đơn tự động chuyển sang `expired`. Admin vẫn có thể **xác nhận thanh toán trên hóa đơn expired** → tenant kích hoạt lại ngay (xem mục 21.1).
- **Hóa đơn thủ công:** Admin có thể tạo hóa đơn thủ công cho tenant bất kỳ lúc nào, không cần chờ chu kỳ.
- **Thanh toán trước:** Cho phép tenant chọn số tháng trả trước tự do (3, 6, 12, ...). `expires_at` được cộng dồn theo số tháng đã thanh toán.
- **Xử lý khi hóa đơn hết hạn 24 giờ:** Tenant chuyển sang trạng thái **read-only** — vẫn xem được dữ liệu cũ nhưng không thể tạo đơn hàng, nhập hàng, hoặc thêm user/SKU.
- **Tên công ty / thương hiệu trên hóa đơn:** Do **admin tự nhập** trong dashboard (tùy chỉnh tên công ty pháp lý, địa chỉ, MST nếu cần).
- **Workflow:**
  1. Hệ thống tạo hóa đơn (`invoices`) dựa trên gói + chu kỳ + khuyến mãi.
  2. Hóa đơn hiển thị số hóa đơn, thông tin ngân hàng, đếm ngược 24 giờ, và có thể xuất PDF.
  3. Tenant chuyển khoản theo thông tin trong hóa đơn.
  4. Admin vào dashboard, kiểm tra sao kê/ngân hàng, bấm "Xác nhận thanh toán".
  5. Hệ thống ghi nhận `payments`, cập nhật `billing_status` và `expires_at` (cộng thêm bonus months nếu có).
  6. Nếu quá 24 giờ chưa thanh toán, hóa đơn tự động chuyển sang `expired`/`cancelled` và tenant chuyển sang read-only.
- **Ưu tiên:** Cao — cần làm sớm vì đây là cách thu phí thực tế.

### 17.2. Hỗ trợ khách hàng

- **Kênh chính:** Zalo cá nhân (ngoài dashboard, do team support vận hành).
- **Không dùng Zalo OA:** Không tích hợp Zalo OA, không gửi thông báo tự động qua Zalo.
- **Kênh phụ:** Ticket system trong dashboard khi Zalo không xử lý được hoặc cần theo dõi formal.
- **Workflow đề xuất:**
  1. Khách báo vấn đề qua Zalo cá nhân.
  2. Nếu vấn đề cần theo dõi, support tạo ticket trong dashboard thủ công.
  3. Ticket có status: `open`, `in_progress`, `waiting_customer`, `resolved`, `closed`.
  4. Thông báo cập nhật ticket qua email (không qua Zalo tự động).
- **Phân loại ticket:** Có phân loại: `bug`, `billing`, `support`, `feature_request`.
- **Gán người phụ trách:** Có thể gán ticket cho admin cụ thể phụ trách.
- **Template reply:** Có template reply sẵn để xử lý nhanh các vấn đề thường gặp.
- **Dashboard cần có:** Ticket inbox, assign ticket, reply, link ticket với tenant, phân loại, template reply.

### 17.3. Bảo mật

- **2FA cho admin.vietsalepro.com:** Bật tùy chọn (optional), không bắt buộc.
- **Phương thức 2FA:** **TOTP / Google Authenticator** (không dùng SMS OTP).
- **Workflow:**
  1. System admin có thể bật 2FA trong profile/settings.
  2. Hệ thống hiển thị QR code để quét bằng Google Authenticator.
  3. Trước khi bật 2FA, hệ thống **bắt buộc** hiển thị backup codes một lần và yêu cầu admin xác nhận đã lưu. Không cho phép bật 2FA nếu chưa xác nhận.
  4. Sau khi bật, mỗi lần đăng nhập yêu cầu mã 6 số từ Google Authenticator.
  5. Cần backup codes để khôi phục khi mất điện thoại.
  6. Cần cơ chế khôi phục khi mất cả điện thoại và backup codes: **manual override bởi system admin khác** (do đó cần ít nhất 2 system admin).
- **Ưu tiên:** Cao vì liên quan đến quyền system admin.
- **Ghi chú:** Nếu sau này cần SMS cho các mục đích khác (ví dụ: reset password tenant, thông báo), các provider SMS phổ biến ở Việt Nam là: **esms.vn**, **speedsms.vn**, **twilio.com**, **vonage.com**.

### 17.4. Không implement trong chat này

- Chỉ cập nhật kế hoạch, không viết code.
- Implement sẽ được thực hiện trong các phiên riêng theo từng phase.

---

## 18. Kế hoạch điều chỉnh theo lựa chọn

### 18.1. Điều chỉnh Phase 7 — Invoicing & Payment Records

Vì thanh toán là chuyển khoản thủ công, Phase 7 sẽ không tích hợp payment gateway tự động. Thay vào đó:

- Tạo bảng `invoices` (hóa đơn) và `invoice_items`.
- Tạo bảng `payments` (lịch sử thanh toán).
- Tạo bảng `promo_codes` (voucher/khuyến mãi).
- Tạo bảng `promotion_rules` (khuyến mãi cố định như "mua năm tặng x tháng").
- Tạo bảng `bank_accounts` để admin lưu thông tin ngân hàng.
- Tạo RPC tạo hóa đơn định kỳ (cron hoặc manual trigger).
- Tạo RPC xác nhận thanh toán thủ công (`confirm_payment`).
- Tạo RPC áp dụng voucher vào hóa đơn.
- Tạo RPC tính giá theo chu kỳ (monthly/yearly) + bonus months.
- Hóa đơn có số tự động theo quy tắc (ví dụ: `INV-2026-0001`).
- Hóa đơn có thể xuất PDF.
- Hóa đơn có đếm ngược 24 giờ. Sau 24 giờ chưa thanh toán, hóa đơn tự động hủy.
- Gửi email nhắc thanh toán khi hóa đơn đến hạn.
- Hiển thị trạng thái: `pending`, `paid`, `overdue`, `cancelled`, `expired`.
- Không cần webhook payment gateway trong giai đoạn đầu.

**Bổ sung kỹ thuật (2026-07-06) — bắt buộc trong P7:**

- **Cron hết hạn hóa đơn:** Dùng `pg_cron` (đã dùng cho data-retention ở Phase 17 vận hành) chạy định kỳ: chuyển hóa đơn `pending` quá hạn sang `expired` và chuyển tenant sang read-only (xem thiết kế mục 18.6).
- **Cron tạo hóa đơn gia hạn:** Tự động tạo hóa đơn gia hạn N ngày trước `expires_at` của tenant trả phí (đề xuất N=7). Nếu không có phần này, admin phải tạo tay hóa đơn cho từng tenant mỗi chu kỳ — không khả thi khi >10 tenant trả phí. (Đây là phần tối thiểu của P9 được kéo vào P7.)
- **Timezone:** Mọi mốc thời gian billing (đếm ngược hết hạn, chu kỳ tháng, `current_month_start`, ngày trên hóa đơn) tính theo **Asia/Ho_Chi_Minh**, không dùng UTC mặc định của server.
- **Phụ thuộc email provider:** Email nhắc thanh toán/xác nhận cần transactional email provider (Supabase Auth email KHÔNG gửi được email tùy ý). Phải chốt provider trước khi làm P7 — xem mục 21.
- **Xuất PDF:** Cần chốt cách làm (client-side bằng thư viện JS vs Edge Function render) — xem mục 21. Ưu tiên client-side nếu dự án đã có pattern export tương tự (Excel).
- **Hóa đơn expired nhưng tenant đã chuyển khoản:** Cần quy tắc xử lý — xem mục 21 (chưa chốt).

### 18.2. Điều chỉnh Phase 10 — Refund / Credit / Proration & Promotions

> Cập nhật 2026-07-06: Đã chốt **KHÔNG hoàn tiền** (mục 21.3) → P10 thu hẹp phạm vi: bỏ refund/negative payment; credit note chỉ làm nếu phát sinh nhu cầu thực tế. Trọng tâm P10 còn lại là **voucher/promotion**.

- ~~**Refund:** Admin có thể tạo negative payment hoặc credit note.~~ → **BỎ — đã chốt không hoàn tiền.**
- **Credit:** Tenant có credit balance dùng để trừ vào hóa đơn sau. → **Hoãn — chỉ làm khi có nhu cầu thực tế.**
- **Proration:** Khi đổi gói, tính tiền chênh lệch thủ công (hoặc tự động tính để admin review).
- **Promotions & Vouchers:**
  - Admin tạo voucher với loại: phần trăm giảm giá, giảm số tiền cố định, tặng thêm tháng.
  - Voucher có ngày hiệu lực, số lần sử dụng, giới hạn theo tenant.
  - **Giới hạn sử dụng voucher:** Voucher có thể giới hạn **theo tenant** (mỗi tenant tối đa X lần) và **tổng số lần** toàn hệ thống.
  - **Đối tượng voucher:** Có thể giới hạn theo nhiều điều kiện kết hợp: tenant mới (đăng ký trong vòng N ngày), gói cụ thể (Free/VIP), hoặc từng tenant cụ thể.
  - **Cảnh báo voucher:** Dashboard hiển thị badge/danh sách voucher sắp hết hạn (trong 7 ngày) và đã hết hạn.
  - Mỗi hóa đơn chỉ dùng 1 voucher. Không kết hợp nhiều voucher.
  - "Mua 1 năm tặng x tháng" là một loại promotion, admin cấu hình `bonus_months`.
  - Có thể kết hợp voucher + promotion (ví dụ: voucher 10% + mua năm tặng 1 tháng).
  - Tenant nhập voucher khi thanh toán, hóa đơn tự động tính lại.
- Không cần tích hợp gateway để hoàn tiền tự động.

### 18.3. Điều chỉnh Phase 11 — Support Tickets

- Ticket system là kênh phụ sau Zalo cá nhân.
- Không cần chat real-time trong dashboard.
- Không tích hợp Zalo OA — không gửi thông báo tự động qua Zalo.
- Thông báo cập nhật ticket qua email.
- Ticket được tạo thủ công bởi admin từ thông tin Zalo cá nhân.
- Ticket có phân loại: `bug`, `billing`, `support`, `feature_request`.
- Ticket có thể gán cho admin cụ thể phụ trách.
- Có template reply sẵn để xử lý nhanh các vấn đề thường gặp.

### 18.4. Điều chỉnh Phase 17 — Security Hardening

- 2FA là **tùy chọn**, không bắt buộc.
- Dùng **TOTP / Google Authenticator** (không dùng SMS OTP).
- Admin quét QR code bằng Google Authenticator để bật 2FA.
- Trước khi bật 2FA, **bắt buộc** hiển thị backup codes một lần và yêu cầu admin xác nhận đã lưu.
- Mỗi lần đăng nhập sau đó yêu cầu mã 6 số từ Google Authenticator.
- Cần backup codes để khôi phục.
- Cần cơ chế khôi phục khi mất cả điện thoại và backup codes: **manual override bởi system admin khác** (cần ít nhất 2 system admin).
- Vẫn cần login history và suspicious activity alert.

**Bổ sung kỹ thuật (2026-07-06):**

- **Dùng Supabase Auth MFA native (TOTP):** Supabase Auth đã hỗ trợ sẵn MFA TOTP (enroll → QR code → verify → challenge khi đăng nhập). KHÔNG tự viết TOTP. Chỉ phần backup codes là phải tự làm (Supabase chưa hỗ trợ native).
- **Backup codes phải lưu dạng hash** (như password), không lưu plaintext. Mỗi code dùng 1 lần.
- **Manual override 2FA:** Thực hiện qua Edge Function với service role (unenroll MFA factor của admin kia), ghi audit log đầy đủ.

### 18.6. Thiết kế kỹ thuật: trạng thái read-only cho tenant (BẮT BUỘC trước P7)

> Đây là phần enforce quyết định "hóa đơn hết hạn → tenant read-only" (mục 17.1). Kế hoạch trước đây chưa thiết kế phần này.

**Vấn đề:** Schema hiện tại chỉ cho phép `tenants.status IN ('active','suspended','trial','pending')` — chưa có `read_only`, và chưa có cơ chế nào chặn ghi dữ liệu mà vẫn cho đọc.

**Thiết kế đề xuất (ponytail — sửa 1 chỗ, không rải logic khắp nơi):**

1. **Schema:** Migration thêm `read_only` và `archived` vào CHECK constraint của `tenants.status` (cùng 1 migration — `archived` phục vụ soft delete ở mục 21.2, kèm cột `archived_at TIMESTAMPTZ` để cron purge sau 30 ngày).
2. **Helper function:** Tạo `public.is_tenant_writable(p_tenant_id UUID) RETURNS BOOLEAN` — trả về `false` khi `status = 'read_only'` (hoặc `suspended`). `STABLE`, `SECURITY DEFINER`, dùng được trong RLS.
3. **RLS enforcement:** Sửa các RLS policy **INSERT/UPDATE/DELETE** của các bảng nghiệp vụ (orders, order_items, products, customers, import_receipts, v.v.) thêm điều kiện `is_tenant_writable(tenant_id)` vào `WITH CHECK`/`USING`. Policy **SELECT giữ nguyên** → tenant vẫn xem được dữ liệu cũ.
4. **RPC/Edge Function:** `process_checkout` và các RPC ghi dữ liệu khác kiểm tra `is_tenant_writable` ở đầu hàm, trả lỗi rõ ràng (ví dụ `TENANT_READ_ONLY`) để frontend hiển thị đúng thông báo.
5. **Frontend tenant:** Khi nhận lỗi `TENANT_READ_ONLY` hoặc khi load app thấy `status = 'read_only'`: hiển thị banner "Tài khoản đã hết hạn — vui lòng thanh toán để tiếp tục" + disable các nút tạo/sửa. Kèm link đến hóa đơn đang chờ.
6. **Chuyển trạng thái:**
   - Cron hết hạn hóa đơn (mục 18.1) chuyển tenant `active → read_only` khi hóa đơn gia hạn hết hạn mà `expires_at` đã qua.
   - Khi admin xác nhận thanh toán (`confirm_payment`): tự động chuyển `read_only → active` và cập nhật `expires_at`.
7. **Không áp dụng cho gói Free:** Tenant Free không có hóa đơn nên không bao giờ bị read-only vì billing (chỉ có thể bị `suspended` thủ công).

**Verification:** Test RLS bằng user tenant read-only: SELECT pass, INSERT/UPDATE/DELETE bị chặn; xác nhận thanh toán → ghi được lại ngay.

### 18.5. Milestone 1 điều chỉnh (launch production)

Với các lựa chọn trên, **Milestone 1** sẽ là:

| Phase | Nội dung | Lý do cần cho launch |
|---|---|---|
| P1 | Tenant list & core management | Quản lý tenant cơ bản |
| P2 | Subscription & usage | Biết giới hạn và tình trạng tenant |
| P3 | Member management | Mời/khóa user tenant |
| P4 | System analytics | Xem tổng quan hệ thống |
| P5 | Audit & security | Giám sát và bảo mật |
| P6 | Operations & support cơ bản | Data retention, export |
| P7 | Invoicing, manual payment confirmation, pricing & bank config | **Thu phí thủ công qua chuyển khoản** |
| P10 (partial) | Voucher/promotion management | **Khuyến mãi do admin cấu hình** |
| P11 | Support tickets (basic) | **Kênh phụ sau Zalo** |
| P17 | Optional Google Authenticator 2FA + login history | **Bảo vệ tài khoản system admin** |

**Không cần trong Milestone 1:**
- Payment gateway tự động (Stripe/VNPay/Momo).
- Billing automation hoàn toàn (vì cần manual confirm).
- Advanced BI (MRR/ARR/churn) — có thể làm sau khi có dữ liệu thanh toán.
- API platform & webhooks.
- Multi-region.

---

## 19. Các câu hỏi đã làm rõ — ĐÃ TRẢ LỜI

> Cập nhật: 2026-07-06 (trong phiên này)

### 19.1. Về hóa đơn và thanh toán

- [x] **Có cần tạo hóa đơn thủ công (không theo chu kỳ) không?** → **Có.** Admin có thể tạo hóa đơn thủ công cho tenant bất kỳ lúc nào.
- [x] **Có cho phép tenant thanh toán trước nhiều tháng không?** → **Có.** Cho phép tenant chọn số tháng trả trước tự do (3, 6, 12, ...).
- [x] **Sau bao nhiêu giờ quá hạn thì tenant bị suspend hoặc giới hạn quyền?** → **24 giờ.** Hóa đơn hết hạn sau 24 giờ chưa thanh toán.
- [x] **Khi hóa đơn hết hạn 24 giờ, tenant bị chuyển sang trạng thái gì?** → **Read-only.** Tenant vẫn xem được dữ liệu cũ nhưng không tạo đơn hàng / nhập hàng / thêm user/SKU.

### 19.2. Về khuyến mãi

- [x] **Voucher có thể dùng bao nhiêu lần?** → **Giới hạn theo tenant + tổng số lần.** Mỗi tenant tối đa X lần, và có tổng giới hạn toàn hệ thống.
- [x] **Voucher có giới hạn theo tenant không?** → **Có, kết hợp nhiều điều kiện:** tenant mới, gói cụ thể, từng tenant cụ thể.
- [x] **Có cần hiển thị voucher hết hạn / sắp hết hạn trong dashboard?** → **Có.** Dashboard hiển thị badge/danh sách voucher sắp hết hạn (7 ngày) và đã hết hạn.
- [x] **"Mua 1 năm tặng x tháng" có áp dụng song song với voucher phần trăm không?** → **Có.** Có thể kết hợp voucher + promotion (ví dụ: voucher 10% + mua năm tặng 1 tháng).

### 19.3. Về Zalo + ticket

- [x] **Có cần gán ticket cho nhân viên cụ thể không?** → **Có.** Gán ticket cho admin cụ thể phụ trách.
- [x] **Có cần phân loại ticket (bug, billing, support, feature request) không?** → **Có.** Phân loại đầy đủ.
- [x] **Có cần template reply cho ticket không?** → **Có.** Có template reply sẵn.

### 19.4. Về 2FA Google Authenticator

- [x] **Có cần bắt buộc backup codes trước khi bật 2FA không?** → **Có, bắt buộc.** Hiển thị backup codes một lần và yêu cầu xác nhận đã lưu mới bật 2FA.
- [x] **Workflow khôi phục khi admin mất điện thoại: chỉ backup codes, hay cần manual override bởi admin khác?** → **Manual override bởi admin khác.** Cần ít nhất 2 system admin.

### 19.5. Về cài đặt hệ thống

- [x] **Tên công ty / thương hiệu hiển thị trên hóa đơn là gì?** → **Do admin tự nhập** trong dashboard.
- [x] **Có cần mẫu email mặc định (logo, màu sắc) không?** → **Có, mặc định + tùy chỉnh.** Có giao diện cấu hình mẫu email, logo, màu chủ đạo, chữ ký.
- [x] **Có cần đa ngôn ngữ cho dashboard không?** → **Không.** Tiếng Việt duy nhất, không làm i18n.

---

## 20. Tóm tắt cuối cùng

- Kế hoạch đã được mở rộng từ **MVP 6 phase** thành **production-ready 14 phase**.
- Đã điều chỉnh theo các lựa chọn của chủ hệ thống:
  - Thanh toán: **chuyển khoản thủ công**.
  - Giá VIP: **69.000 ₫/tháng** hoặc **59.000 ₫/tháng khi mua năm**.
  - Gói Free: **giữ nguyên** giới hạn hiện tại.
  - Không có gói trung gian.
  - Khuyến mãi: **voucher + mua năm tặng tháng**.
  - Hỗ trợ: **Zalo cá nhân + ticket system trong dashboard**.
  - Không dùng Zalo OA.
  - 2FA: **Google Authenticator tùy chọn**.
  - **Hóa đơn hết hạn 48 giờ:** tenant chuyển sang **read-only** (admin vẫn confirm được trên hóa đơn expired).
  - **Tên trên hóa đơn:** do **admin tự nhập**.
  - **Thanh toán trước:** cho phép **tự do chọn số tháng**.
  - **Hóa đơn thủ công:** admin có thể tạo tay.
  - **Voucher:** giới hạn theo **tenant + tổng số lần**, có thể kết hợp điều kiện đối tượng.
  - **Ticket:** có **phân loại + gán người + template reply**.
  - **Backup codes:** bắt buộc trước khi bật 2FA.
  - **Khôi phục 2FA:** manual override bởi admin khác.
  - **Mẫu email:** có giao diện tùy chỉnh logo/màu sắc.
  - **Ngôn ngữ:** **tiếng Việt duy nhất**.
- Các quyết định chốt bổ sung (2026-07-06, xem mục 21):
  - **Email provider:** Resend.
  - **Xuất PDF:** client-side (thư viện JS).
  - **Xóa tenant:** soft delete (`archived`) + purge sau 30 ngày.
  - **Impersonation:** có làm, kèm audit log + banner cảnh báo.
  - **Trial:** không dùng — tenant mới vào thẳng gói Free.
  - **Refund:** không hoàn tiền — ghi rõ trong điều khoản.
- **Milestone 1 (launch)** gồm P1-P7 + P10 (promotion) + P11 + P17.
- **Các câu hỏi ở mục 19 đã được trả lời đầy đủ.** Tuy nhiên vẫn còn các quyết định mở ở **mục 21** cần chốt trước khi implement P7.
- Không implement trong chat này — chỉ cập nhật kế hoạch.

---

## 21. Các quyết định CÒN MỞ — cần chốt trước khi implement (2026-07-06)

> Đây là danh sách tổng hợp sau lần review độ đầy đủ của kế hoạch. Khi chốt xong, cập nhật trực tiếp vào đây và đồng bộ mục 14.

### 21.1. Chặn implement P7 (Invoicing) — ĐÃ CHỐT (2026-07-06)

- [x] **Email provider:** → **Resend.** Dùng cho email hóa đơn, nhắc thanh toán, thông báo ticket, mẫu email tùy chỉnh (P12). Gửi qua Edge Function, API key lưu trong Supabase secrets.
- [x] **Thời hạn hóa đơn:** → **48 giờ** (điều chỉnh từ 24 giờ). Đã đồng bộ toàn bộ mục 17.1, 18.1, 19.1.
- [x] **Hóa đơn expired nhưng tenant đã chuyển khoản:** → **Admin xác nhận thanh toán trực tiếp trên hóa đơn expired** → tenant tự động kích hoạt lại. Không cần tạo hóa đơn mới.
- [x] **Cách xuất PDF:** → **Client-side bằng thư viện JS** (jsPDF/pdfmake). Không render server.

### 21.2. Chặn implement P1 (Tenant management) — ĐÃ CHỐT (2026-07-06)

- [x] **Chính sách xóa tenant:** → **Soft delete + purge sau 30 ngày.** Khi admin xóa: chuyển status `archived` (tenant không truy cập được). Cron purge vĩnh viễn sau 30 ngày. Trong 30 ngày admin có thể khôi phục. `delete_tenant_safe` (P1) implement theo cách này, KHÔNG hard delete.

### 21.3. Support & vận hành — ĐÃ CHỐT (2026-07-06)

- [x] **Impersonation ("Login as tenant admin"):** → **Có làm.** Bắt buộc: ghi audit log đầy đủ (ai impersonate tenant nào, lúc nào, bao lâu) + banner cảnh báo rõ ràng khi đang ở chế độ impersonate. Thực hiện qua Edge Function với service role. Đưa vào Milestone 1 hoặc đầu Milestone 2 (P3 hoặc P11).
- [x] **Trial:** → **Không dùng trial.** Tenant mới vào thẳng gói Free. Status `trial` trong schema giữ nguyên (không xóa constraint) nhưng KHÔNG dùng — không cần cron convert/expire trial.
- [x] **Chính sách refund:** → **Không hoàn tiền.** Ghi rõ trong điều khoản sử dụng. P10 thu hẹp phạm vi: bỏ refund/negative payment, chỉ giữ voucher/promotion; credit note chỉ làm nếu phát sinh nhu cầu thực tế.

### 21.4. Có thể chốt sau (không chặn Milestone 1)

- [ ] SLA phản hồi ticket (mục 14.2).
- [ ] IP whitelist cho admin dashboard (mục 14.3).
- [ ] Compliance: Nghị định 13/2023, data localization, terms acceptance (mục 14.5).
- [ ] Hóa đơn điện tử hợp lệ (Nghị định 123/2020) — cần làm rõ trước khi thu phí chính thức nếu có đăng ký kinh doanh (mục 14.5).
- [ ] Dark mode / mobile responsive cho admin dashboard (mục 7).

