# HANDOFF BÀN GIAO: SỬA KẾ HOẠCH MULTI-TENANCY

> **Phiên chat:** 2026-07-04  
> **Người thực hiện:** Devin  
> **Trạng thái:** Đã sửa toàn bộ các sai sót và bổ sung đầy đủ. Tất cả 11 task còn lại trong phiên trước đã hoàn thành.

---

## Đã hoàn thành trong phiên này

### 1. File `KE_HOACH_BAO_MAT_MULTI_TENANCY.md` (file chính)

Đã sửa và bổ sung:

- **Sửa lỗi inject `x-tenant-id`**: thay thế bằng custom fetch wrapper vì `createClient` với `global.headers` không cập nhật động được.
- **Backfill dữ liệu cũ**: thêm bước tạo membership cho toàn bộ user hiện có thành admin của tenant đầu tiên.
- **Ràng buộc unique theo tenant**: bổ sung unique index cho SKU, mã đơn hàng, mã hóa đơn theo tenant.
- **Offline queue**: bổ sung cách ly queue theo tenant, không sync chéo tenant.
- **Password reset flow**: bổ sung Edge Function reset password redirect về đúng subdomain.
- **Rate limiting**: bổ sung giới hạn request cho Edge Functions và brute-force login.
- **Backup strategy**: cập nhật dùng Supabase CLI hoặc PITR thay vì `pg_dump` thuần.
- **Data retention**: bổ sung archive/partition/xóa dữ liệu cũ cho hệ thống 10–20 năm.
- **Acceptance criteria**: từ 16 lên 22 tiêu chí.
- **Lưu ý quan trọng**: thêm các lưu ý về backup, password reset, rate limiting, data retention, SKU unique.

### 2. File `KE_HOACH_CHI_TIET_MULTI_TENANCY.md`

- Đã sửa cả 2 instance inject `x-tenant-id` (Phase 5 và section 4.2) thành custom fetch wrapper.
- Đã sửa cú pháp `current_setting('request.headers', true)::json->>'x-tenant-id'` và xóa fallback tenant.
- Đã sửa trigger `check_tenant_limits` thành hàm 0 tham số.
- Đã đổi `audit_logs` thành `app_audit_log` và để `tenant_id` nullable.
- Đã xóa toàn bộ `localStorage.getItem('tenant_id')`.
- Đã bổ sung backfill membership, unique index, offline queue, password reset, rate limiting, data retention, backup strategy.
- Đã thêm ghi chú thống nhất số phase (11 phase tổng quan vs 18 phase chi tiết).

### 3. Các file còn lại

- `KIEN_TRUC_CHI_TIET_VA_SO_DO_HE_THONG.md`: đổi `created_by` → `invited_by`, thống nhất localhost dùng `main`, bổ sung các phần còn thiếu.
- `MO_HINH_VA_HUONG_DI_SHARED_SUPABASE.md`: sửa inject `x-tenant-id`, bổ sung các phần còn thiếu.
- `CAC_BUOC_IMPLEMENT_VA_LUU_Y_LOGIC_TENANT.md`: bổ sung các lưu ý và giai đoạn còn thiếu.
- `KE_HOACH_TONG_HOP_DA_DUYET.md`: bổ sung nhu cầu, bước, tiêu chí chấp nhận về data retention/backup strategy và các yêu cầu mới.

---

## Kiểm tra sau khi sửa

Đã chạy `grep` kiểm tra các từ khóa mâu thuẫn:
- Không còn `created_by` trong các file kế hoạch (trừ file handoff này).
- Không còn `global.headers` trong code thực tế (chỉ còn trong comment giải thích).
- Không còn `localStorage.getItem('tenant_id')`.
- Không còn `pg_dump` trong hướng dẫn thực hiện (chỉ còn trong câu "không dùng pg_dump").
- Không còn `request.headers.x-tenant-id`.
- Không còn `check_tenant_limit(p_`.
- Không còn `app_audit_log` khai báo `NOT NULL` + `ON DELETE SET NULL`.
- Không còn `audit_logs` (đã đổi thành `app_audit_log`).

---

*File handoff đã cập nhật: tất cả các sai sót đã được sửa và bổ sung đầy đủ.*

---

# PHIÊN BỔ SUNG: CHỐT OPTION & ĐỒNG NHẤT TOÀN BỘ KẾ HOẠCH

> **Phiên chat:** tiếp nối phiên 2026-07-04
> **Người thực hiện:** Devin
> **Trạng thái:** Đã chốt toàn bộ option vận hành và đồng nhất 6 file kế hoạch.

---

## 1. Các option đã chốt

| Option | Lựa chọn | Lý do / Ghi chú |
|---|---|---|
| **Hosting provider** | **Cloudflare Pages** | Hỗ trợ wildcard subdomain, SSL tự động, bảo mật ở edge, phù hợp KiotViet-style 1000+ tenant. |
| **Rate limiting** | **Bảng `rate_limit_logs` trong Supabase** | Không cần thêm Redis/Upstash; dọn log cũ bằng cron. |
| **Email/SMS** | **Email mặc định của Supabase Auth** | Không cần cấu hình SMTP riêng; gửi welcome/reset-password qua `supabase.auth.admin.generateLink`. |
| **Storage strategy** | **1 bucket `tenant-assets` chung + path `tenant_id/`** | Phù hợp 1000+ tenant, đơn giản backup/restore; nếu sau này có tenant VIP cần cách ly vật lý thì tách riêng một số tenant. |
| **Supabase PITR** | **Free hiện tại, Pro khi vận hành thật** | Tiết kiệm chi phí ban đầu; bật PITR khi có khách hàng trả phí thật. |
| **Data retention automation** | **Supabase cron extension** | Lên lịch archive, partition, clean tự động trong DB. |

---

## 2. Schema đã thống nhất giữa các file

| Bảng | Trạng thái | Chi tiết |
|---|---|---|
| `public.tenants` | Đồng nhất | Có `id`, `name`, `subdomain`, `status`, `plan`, `owner_id`, `settings`, `created_at`, `updated_at`. **Không có `slug`**. |
| `public.tenant_memberships` | Đồng nhất | Có `id` PK, `tenant_id`, `user_id`, `role`, `invited_by`, `created_at`, `updated_at`, `UNIQUE(tenant_id, user_id)`. |
| `public.tenant_subscriptions` | Đồng nhất | Có `tenant_id`, `plan`, `max_users`, `max_products`, `max_orders_per_month`, `current_month_orders`, `current_month_start`, `billing_status`, `expires_at`, `updated_at`. **Không có `status`**. |
| `public.system_admins` | Đồng nhất | Có `user_id` PK, `created_at`. **Không có `role`**. |
| `public.rate_limit_logs` | Đồng nhất | Có `id`, `ip_address`, `action`, `attempt_count`, `window_start`, `created_at`. |

---

## 3. File đã cập nhật trong phiên này

1. **`KE_HOACH_CHI_TIET_MULTI_TENANCY.md`**
   - Phase 9: chốt rate limiting qua `rate_limit_logs`, password reset qua Supabase Auth email.
   - Phase 16: chốt Cloudflare Pages + bucket `tenant-assets` chung.
   - Phase 17: chốt Free/Pro PITR + Supabase cron extension cho data retention.
   - Section 4.7/4.8: đồng nhất với option đã chọn.

2. **`KE_HOACH_TONG_HOP_DA_DUYET.md`**
   - Cập nhật các yêu cầu 45–67 với provider đã chọn.
   - Cập nhật bước 14, 19, 20 với Cloudflare Pages, `rate_limit_logs`, cron extension.

3. **`KE_HOACH_BAO_MAT_MULTI_TENANCY.md`**
   - Thống nhất schema (bỏ `slug`, `status` subscription, `role` system admin).
   - Chốt Cloudflare Pages, `tenant-assets` chung, `rate_limit_logs`, Supabase Auth email, cron extension.

4. **`KIEN_TRUC_CHI_TIET_VA_SO_DO_HE_THONG.md`**
   - Cập nhật sơ đồ hệ thống (Cloudflare Pages, storage bucket, system_admins).
   - Cập nhật Edge Function `create-tenant-admin` theo schema mới.
   - Bổ sung section 3.6.5 Storage RLS và 3.6.6 Rate limiting.
   - Cập nhật backup/data retention/password reset theo option đã chọn.

5. **`MO_HINH_VA_HUONG_DI_SHARED_SUPABASE.md`**
   - Cập nhật schema theo bộ bảng thống nhất.
   - Cập nhật sơ đồ DNS/Cloudflare Pages.
   - Cập nhật các yêu cầu bổ sung với provider đã chọn.

6. **`CAC_BUOC_IMPLEMENT_VA_LUU_Y_LOGIC_TENANT.md`**
   - Cập nhật giai đoạn 7, 8, 9, 10 với Cloudflare Pages, `rate_limit_logs`, Storage RLS.
   - Cập nhật Lưu ý 5, 6.5, 19, 20 với option đã chọn.

7. **`HANDOFF_BAN_GIAO_MULTI_TENANCY.md`** (file này)
   - Bổ sung section ghi lại option đã chốt và trạng thái đồng nhất.

---

## 4. Việc cần tiếp tục (handoff cho implementer)

Toàn bộ **tài liệu kế hoạch** đã đồng nhất. Các việc tiếp theo là **triển khai code**, không còn là sửa tài liệu:

1. **Tạo migration SQL tổng hợp** theo schema đã chốt:
   - `supabase/migration_multitenant_tenants.sql`
   - `supabase/migration_multitenant_tenant_memberships.sql`
   - `supabase/migration_multitenant_tenant_subscriptions.sql`
   - `supabase/migration_multitenant_system_admins.sql`
   - `supabase/migration_multitenant_add_tenant_id_to_tables.sql`
   - `supabase/migration_multitenant_rls_policies.sql`
   - `supabase/migration_multitenant_helper_functions.sql`
   - `supabase/migration_multitenant_audit_log.sql`
   - `supabase/migration_multitenant_rate_limit_logs.sql`
   - `supabase/migration_multitenant_storage_rls.sql`

2. **Viết Edge Functions**:
   - `create-tenant-admin`
   - `invite-user-to-tenant`
   - `check-subdomain-availability`
   - `reset-password`
   - `audit-log-writer`
   - `process-checkout`

3. **Cấu hình Cloudflare Pages**:
   - Tạo project, kết nối repo.
   - Thêm domain `vietsalepro.com` và wildcard `*.vietsalepro.com`.
   - Bật Cloudflare proxy.

4. **Cấu hình Supabase**:
   - Tắt self-registration, social providers, email confirmations.
   - Tạo bucket `tenant-assets` + RLS.
   - Cài đặt `pg_cron` extension (Supabase cron).
   - Bật PITR khi nâng Pro.

5. **Implement frontend**:
   - `lib/tenant.ts` — nhận diện subdomain.
   - `lib/supabase.ts` — custom fetch wrapper gắn `x-tenant-id`.
   - `contexts/AuthContext.tsx` — tenant context.
   - `pages/AdminDashboard.tsx` — system admin dashboard.

6. **Test & deploy** theo 18 phase / 20 bước / 10 giai đoạn đã chốt.

---

## 5. Kiểm tra đồng nhất sau phiên này

- Không còn `slug` trong `public.tenants` ở các file kế hoạch.
- Không còn `status` trong `public.tenant_subscriptions`.
- Không còn `role` trong `public.system_admins`.
- Không còn `tenant_id TEXT` — toàn bộ đã đổi sang `UUID`.
- Hosting đã chốt Cloudflare Pages trong cả 6 file.
- Storage đã chốt bucket `tenant-assets` chung trong cả 6 file.
- Rate limiting đã chốt `rate_limit_logs` trong cả 6 file.
- Data retention đã chốt Supabase cron extension trong cả 6 file.
- Backup/PITR đã chốt Free → Pro trong cả 6 file.

---

*Kế hoạch đã sẵn sàng để chuyển sang giai đoạn implement. Không còn mâu thuẫn giữa các file tài liệu.*
