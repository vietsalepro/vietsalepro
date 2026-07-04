# CÁC BƯỚC IMPLEMENT VÀ LƯU Ý QUAN TRỌNG

> **Hướng xử lý:** Tách biệt logic bằng Shared Database + `tenant_id` + RLS nghiêm ngặt.
>
> **Mục tiêu:** Triển khai multi-tenancy cho VietSale Pro theo mô hình KiotViet — mỗi cửa hàng có subdomain riêng, dữ liệu cách ly hoàn toàn, chỉ chủ hệ thống tạo cửa hàng và tài khoản admin.
>
> **Ghi chú:** File này chỉ tóm tắt bước cao và các lưu ý quan trọng. Chi tiết kỹ thuật cụ thể (SQL, Edge Function, code frontend) sẽ được xây dựng khi bạn yêu cầu implement từng bước trong các phiên chat tiếp theo.

---

## PHẦN 1: CÁC BƯỚC IMPLEMENT NẾU BẠN YÊU CẦU

### Giai đoạn 0: Chuẩn bị

- Backup toàn bộ Supabase project trước khi chạm DB.
- Tạo môi trường Staging riêng (Supabase project + domain staging).
- Đảm bảo `npm run lint` và `npm run build` pass.
- Không bao giờ test multi-tenancy trực tiếp trên production.

### Giai đoạn 1: Tạo Foundation Multi-Tenancy

- Tạo bảng `tenants` (lưu thông tin cửa hàng, slug, subdomain, status).
- Tạo bảng `tenant_memberships` (liên kết user với tenant và role).
- Tạo bảng `system_admins` (quản lý chủ hệ thống/super admin).
- Tạo bảng `tenant_subscriptions` (gói dịch vụ, giới hạn, ngày hết hạn).

### Giai đoạn 2: Thêm tenant_id vào các bảng kinh doanh

- Thêm cột `tenant_id` vào tất cả bảng chứa dữ liệu riêng của cửa hàng.
- Cả bảng cha và bảng con đều phải có `tenant_id` (VD: orders và order_items).
- Cập nhật dữ liệu hiện có (nếu có) để trỏ về tenant đầu tiên.
- Tạo membership cho toàn bộ user hiện có thành admin của tenant đầu tiên (nếu không, user cũ sẽ không đăng nhập được).
- Đặt `tenant_id` thành `NOT NULL` sau khi đã backfill xong.
- Thêm unique index theo tenant cho SKU, barcode, mã đơn hàng, mã hóa đơn điện tử.

### Giai đoạn 3: Helper Functions và RLS Policies

- Tạo helper functions: `is_tenant_member`, `is_tenant_admin`, `has_tenant_role`, `get_tenant_by_subdomain`.
- Xóa toàn bộ policy cũ cho phép `public` access.
- Tạo RLS policies mới cho tất cả bảng business: user chỉ thao tác được dữ liệu thuộc tenant mình có quyền.
- Bật `ENABLE ROW LEVEL SECURITY` cho tất cả bảng business.
- Tạo index trên `tenant_id` cho các bảng thường xuyên query.

### Giai đoạn 4: Sửa Frontend

- Tạo module nhận diện subdomain từ `window.location.host`.
- Sửa `AuthContext` để lưu `tenant_id` và `tenant_role`.
- Sửa luồng login: sau đăng nhập, kiểm tra user có thuộc tenant của subdomain không.
- Sửa tất cả các gọi API trong `services/supabaseService.ts` để truyền `tenant_id`.
- Xử lý các trường hợp: subdomain không tồn tại, tenant bị suspend, user không thuộc tenant.

### Giai đoạn 5: Admin Dashboard cho chủ hệ thống

- Tạo trang/route `admin.vietsalepro.com`.
- Xây dựng form tạo cửa hàng mới: tên, subdomain, email/phone admin, gói dịch vụ.
- Tạo Edge Function để tạo tenant + admin user + gửi thông tin đăng nhập.
- Kiểm tra subdomain khả dụng trước khi tạo.
- Chỉ system admin mới được truy cập dashboard này.

### Giai đoạn 6: RBAC trong mỗi cửa hàng

- Cập nhật RLS policies theo role: admin, cashier, inventory_manager, accountant.
- Ẩn/hiện menu và chức năng trong UI theo role.
- Xây dựng flow admin cửa hàng mời nhân viên.
- Tạo Edge Function mời nhân viên vào tenant.
- Kiểm tra giới hạn số user, số sản phẩm, số đơn hàng/tháng theo gói dịch vụ.

### Giai đoạn 7: Audit Log, Subscription Limits & Rate Limiting

- Tạo bảng `app_audit_log`.
- Thêm trigger ghi log cho các bảng quan trọng.
- Thêm trigger/check giới hạn số user, số sản phẩm, số đơn hàng/tháng theo subscription.
- Thêm RLS cho audit log.
- Tạo bảng `rate_limit_logs` và kiểm tra rate limit trong Edge Function.

### Giai đoạn 8: DNS & Hosting (Cloudflare Pages)

- Hosting trên **Cloudflare Pages**.
- Thêm domain `vietsalepro.com` và wildcard `*.vietsalepro.com` vào Pages project.
- Cloudflare tự động tạo DNS CNAME và SSL wildcard.
- Bật Cloudflare proxy để có thêm bảo mật ở edge.
- Không cần thêm subdomain thủ công khi tạo tenant mới (wildcard tự động điều hướng).

### Giai đoạn 9: Test đầy đủ trên Staging

- Tạo 2-3 tenant test.
- Test cách ly dữ liệu: tenant A không thấy dữ liệu tenant B.
- Test RBAC: cashier không xóa đơn, accountant không tạo đơn.
- Test sign-up bị chặn.
- Test subdomain không tồn tại, tenant bị suspend.
- Test admin dashboard tạo cửa hàng.
- Test Storage RLS: tenant A không đọc được file tenant B.
- Test rate limiting: lockout sau 5 lần đăng nhập sai.
- Test backup và restore.

### Giai đoạn 10: Deploy Production

- Chạy migrations lên production trong khung giờ thấp điểm.
- Backfill dữ liệu hiện có cho tenant đầu tiên.
- Deploy frontend lên Cloudflare Pages.
- Cấu hình DNS wildcard `*.vietsalepro.com` trên Cloudflare.
- Smoke test toàn bộ luồng chính.
- Theo dõi error log, query performance, audit log.

---

## PHẦN 2: LƯU Ý QUAN TRỌNG

### Lưu ý 1: Không để lộ service_role key

- Service role key chỉ được dùng trong Edge Functions hoặc backend.
- Không bao giờ đưa vào frontend code.
- Nếu lộ, kẻ tấn công có thể vượt qua RLS hoàn toàn.

### Lưu ý 2: Tắt self-registration trong Supabase Auth

- Tắt `Enable new signups` trong Email provider.
- Tắt tất cả social providers.
- Khách hàng không thể tự tạo tài khoản; chỉ bạn tạo qua admin dashboard.

### Lưu ý 3: RLS phải bao phủ 100% bảng business và kiểm tra 2 lớp

- Mọi bảng chứa dữ liệu cửa hàng phải có `tenant_id` và RLS policy.
- Bảng nào quên bật RLS = lỗ hổng lộ dữ liệu.
- Các bảng con (VD: order_items) cũng phải có `tenant_id`.
- Mỗi policy phải kiểm tra cả:
  - `tenant_id = current_tenant_id()` (lấy từ request header `x-tenant-id`)
  - `is_tenant_member(tenant_id)` (user phải thuộc tenant)
- Không chỉ dựa vào header, vì header có thể bị giả mạo.

### Lưu ý 4: Không dùng `auth.users.raw_user_meta_data` cho role

- Role phải lưu trong `tenant_memberships`.
- `auth.users` chỉ dùng cho authentication, không authorization.
- Lý do: dễ query, có khóa ngoại, dễ audit, hỗ trợ user thuộc nhiều tenant.

### Lưu ý 4a: Không lưu `tenant_id` vào `localStorage`

- `tenant_id` phải được xác định runtime từ subdomain (`window.location.host`).
- Không lưu vào `localStorage` để tránh stale data khi user đổi subdomain hoặc bị mời vào nhiều tenant.
- Mỗi khi app khởi động, gọi `get_tenant_by_subdomain(subdomain)` và cập nhật header `x-tenant-id`.

### Lưu ý 4b: Không fallback tenant khi thiếu header

- Hàm `current_tenant_id()` đọc từ `request.headers` và trả về `NULL` nếu thiếu.
- Không tự động chọn tenant đầu tiên của user khi thiếu header.
- Nếu `current_tenant_id()` là `NULL`, RLS sẽ từ chối mọi truy vấn.
- Điều này ngăn lộ dữ liệu khi user thuộc nhiều tenant.

### Lưu ý 5: Backup & Restore trong mô hình multi-tenant (Shared DB)

#### 5.1. Backup toàn bộ project

- **Giai đoạn đầu (Free plan):** Dùng Supabase CLI hoặc dashboard để backup toàn bộ database.
- **Khi vận hành thật:** Nâng lên Supabase Pro và bật PITR (Point-in-Time Recovery).
- Backup định kỳ: hàng ngày nếu có thể.

#### 5.2. Restore toàn bộ

- Khi toàn bộ project lỗi, restore từ backup toàn bộ.
- Đây là cách đơn giản nhất và đáng tin cậy nhất.

#### 5.3. Restore một tenant riêng lẻ

- Shared DB không cho phép restore chỉ một tenant bằng cách bấm nút.
- Cần chuẩn bị script export/import dữ liệu của một tenant cụ thể.
- Export dữ liệu từng bảng theo `tenant_id`, sau đó import vào DB đích.
- Cần xử lý sequence, foreign key, và ID tồn tại.

#### 5.4. Khuyến nghị

- Luôn có backup toàn bộ trước mỗi lần deploy migration lớn.
- Test restore toàn bộ định kỳ (ít nhất 1 lần/tháng trên staging, 1 lần/quý trên production backup).
- Viết sẵn script export/import 1 tenant để dùng khi cần.
- Cân nhắc soft-delete tenant thay vì hard-delete, để dễ khôi phục.

### Lưu ý 6: Scaling khi số lượng cửa hàng tăng

#### 6.1. Vấn đề về index

- Khi số tenant tăng, mọi query đều lọc theo `tenant_id`.
- Cần index trên `tenant_id` cho tất cả bảng business.
- Cần composite index cho các query phổ biến như `(tenant_id, created_at)`.

#### 6.2. Vấn đề về bảng lớn

- Các bảng `orders`, `stock_movements`, `app_audit_log` sẽ tăng nhanh theo thời gian và số tenant.
- Cần cân nhắc partition theo `tenant_id` hoặc theo `created_at` (theo tháng/năm).
- Partition giúp query nhanh hơn và dễ archive dữ liệu cũ.

#### 6.3. Vấn đề về connection

- Mỗi tenant có nhiều user đồng thời online.
- Cần theo dõi số lượng database connection của Supabase project.
- Sử dụng connection pooling nếu cần.

#### 6.4. Vấn đề về read replica

- Khi số lượng query đọc nhiều (báo cáo, dashboard), dùng Supabase read replica để giảm tải primary database.

#### 6.5. Vấn đề về Storage

- Dùng **bucket `tenant-assets` chung** cho tất cả tenant.
- Tổ chức folder theo path: `tenant-assets/{tenant_id}/products/{file}`.
- RLS của Storage kiểm tra `(storage.foldername(name))[1] = current_tenant_id()::TEXT` và `is_tenant_member(...)` để tránh lộ file.
- Phù hợp scale 1000+ tenant KiotViet-style.

#### 6.6. Vấn đề về Realtime

- Nếu dùng Supabase Realtime, phải cấu hình để tenant chỉ nhận tin nhắn của chính mình.
- Không để channel realtime trở thành kênh lộ dữ liệu chéo tenant.

#### 6.7. Khuyến nghị

- Theo dõi performance metrics định kỳ.
- Có kế hoạch nâng cấp Supabase plan khi đạt ngưỡng.
- Chuẩn bị script partition cho các bảng lớn trước khi dữ liệu đạt hàng triệu dòng.
- Cân nhắc chuyển sang schema-per-tenant hoặc database-per-tenant khi đạt quy mô rất lớn (hàng nghìn tenant với dữ liệu khổng lồ).

### Lưu ý 7: Subdomain không tồn tại và tenant bị suspend

- Nếu subdomain không tồn tại: hiển thị trang lỗi hoặc redirect về landing page.
- Nếu tenant bị suspend/cancelled: sau login, chặn truy cập và hiển thị thông báo liên hệ hỗ trợ.

### Lưu ý 8: Subdomain reserved

Cấm đăng ký các subdomain sau để tránh xung đột:

- `admin`, `www`, `api`, `app`, `support`, `help`, `blog`, `docs`
- `mail`, `ftp`, `smtp`, `pop`, `imap`, `webmail`
- `login`, `auth`, `dashboard`, `store`, `shop`, `payment`, `billing`
- `secure`, `static`, `cdn`, `staging`, `test`, `dev`, `demo`

### Lưu ý 9: Email trùng nhau giữa các cửa hàng

- Với shared `auth.users`, một email chỉ tồn tại một lần.
- Nếu 2 cửa hàng cùng mời một email, đó là cùng một user với 2 membership.
- User đăng nhập vào subdomain nào thì thấy dữ liệu tenant đó.
- Đây là ưu điểm cho kế toán/nhân viên làm nhiều cửa hàng.
- Nếu muốn hoàn toàn tách biệt user theo tenant, cần dùng email có suffix hoặc chuyển database-per-tenant.

### Lưu ý 10: Test trên staging là bắt buộc

Trước khi deploy production, phải test:

- 2 tenant khác nhau không nhìn thấy dữ liệu nhau.
- User không thuộc tenant không đăng nhập được vào subdomain đó.
- Role cashier không xóa được đơn.
- Role accountant không tạo được đơn.
- Self-registration bị chặn.
- Admin dashboard chỉ system admin vào được.
- Backup và restore hoạt động.
- Subdomain không tồn tại và tenant suspend xử lý đúng.

### Lưu ý 11: Không bỏ qua môi trường Staging

- Multi-tenancy là thay đổi lớn, không thể test trực tiếp trên production.
- Cần Supabase project staging riêng.
- Cần domain staging riêng.
- Chỉ deploy lên production sau khi staging đã pass toàn bộ test case.

### Lưu ý 12: Cân nhắc soft-delete tenant

- Thay vì xóa tenant vĩnh viễn, nên đổi `status` thành `suspended` hoặc `cancelled`.
- Dữ liệu vẫn giữ lại để phục vụ điều tra, báo cáo, hoặc khôi phục.
- Chỉ xóa vĩnh viễn sau khi đã lưu trữ đầy đủ và có xác nhận.

### Lưu ý 13: Theo dõi và monitoring

- Cần theo dõi error logs của Supabase và frontend.
- Cần theo dõi số lượng tenant, user, sản phẩm, đơn hàng.
- Cần cảnh báo khi tenant gần đạt giới hạn subscription.
- Cần audit log cho các hành động quan trọng (tạo đơn, xóa đơn, nhập hàng, xuất hủy, thay đổi cài đặt).

### Lưu ý 14: Không nên hard-delete user trong auth.users

- Khi nhân viên nghỉ việc, chỉ xóa bản ghi trong `tenant_memberships`.
- Giữ lại `auth.users` để bảo toàn lịch sử và audit log.
- Nếu xóa user trong `auth.users`, các bản ghi liên quan có thể bị ảnh hưởng tùy cấu hình ON DELETE.

### Lưu ý 15: Backfill membership cho user hiện có

- Khi chuyển từ single-tenant sang multi-tenant, sau khi tạo tenant đầu tiên, phải tạo `tenant_memberships` cho toàn bộ user trong `auth.users` với role `admin`.
- Không có bước này, user cũ sẽ không đăng nhập được dù dữ liệu đã được gán đúng tenant.

### Lưu ý 16: SKU / mã đơn / mã hóa đơn unique theo tenant

- Dùng composite unique index `(tenant_id, sku)`, `(tenant_id, order_code)`, `(tenant_id, invoice_number)`.
- Cho phép trùng giữa các tenant, không trùng trong cùng tenant.

### Lưu ý 17: Offline queue cách ly theo tenant

- Mỗi operation trong IndexedDB phải lưu `tenant_id` khi tạo.
- Khi sync, lấy `tenant_id` từ subdomain runtime, không từ `localStorage`.
- Chỉ sync operation thuộc tenant hiện tại; kiểm tra membership trước khi sync.

### Lưu ý 18: Password reset flow

- Khi self-registration tắt, chỉ admin tenant hoặc system admin được reset password cho nhân viên.
- Link reset password phải redirect về đúng subdomain.

### Lưu ý 19: Rate limiting

- Dùng bảng `rate_limit_logs` trong Supabase.
- Đăng nhập sai ≥ 5 lần/15 phút/IP → lockout tạm thời.
- Tạo tenant, check subdomain, mời nhân viên: 10 request/phút/IP.
- Kiểm tra trong Edge Function; dọn dữ liệu cũ > 24h bằng Supabase cron extension.

### Lưu ý 20: Data retention & backup strategy

- Backup: Free plan dùng Supabase CLI (`supabase db dump`); khi vận hành thật nâng Pro + bật PITR. Test restore định kỳ.
- Data retention: dùng Supabase cron extension để lên lịch archive `orders`/`stock_movements` > 2 năm, partition `app_audit_log` theo tháng, clean `processed_operations` cũ > 90 ngày, clean `rate_limit_logs` cũ > 24h.

---

## KẾT LUẬN

Với hướng **tách biệt logic Shared DB + tenant_id + RLS nghiêm**, cần thực hiện đúng 10 giai đoạn implement và tuân thủ nghiêm các lưu ý bảo mật, đặc biệt là:

- **Lưu ý 5 — Backup & Restore**: luôn backup trước mỗi thay đổi lớn, test restore định kỳ, chuẩn bị script export/import 1 tenant.
- **Lưu ý 6 — Scaling**: index, partition, read replica, connection pooling, storage RLS, realtime isolation là các yếu tố then chốt khi số lượng cửa hàng tăng.

Khi bạn yêu cầu, tôi sẽ bắt đầu implement từng giai đoạn cụ thể và cung cấp code chi tiết trong các phiên chat tiếp theo.
