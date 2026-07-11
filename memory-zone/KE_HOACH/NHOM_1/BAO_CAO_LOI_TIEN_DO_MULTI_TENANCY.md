# Báo cáo kiểm tra tiến độ / lỗi — Kế hoạch Multi-Tenancy NHOM_1

> **Ngày kiểm tra:** 2026-07-05  
> **Cơ sở:** `KE_HOACH_CHI_TIET_MULTI_TENANCY.md` và `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md` trong `memory-zone/KE_HOACH/NHOM_1`  
> **Git branch hiện tại:** `master` (up to date với `origin/master`)  
> **Commit mới nhất:** `58f233c` — Phase 17: Thiết lập vận hành dài hạn (lint + build pass)

---

## 1. Tóm tắt

- **Tổng quan:** Tất cả 18 phase (và các sub-phase tương ứng) đều đã có **mã nguồn / migration / Edge Function** được commit vào repo. Không còn file rác `OLD/`, `MobilePOS.backup.tsx`, hay các bảng backup được liệt kê trong Phase 14.
- **Build & lint:** `npm run lint` và `npm run build` hiện tại **PASS**.
- **Tests:** `npm run test -- --run` **PASS** 23/23 test, nhưng **chưa đạt tiêu chí chấp nhận** yêu cầu ≥ 30 unit tests và ≥ 5 integration tests.
- **Những điểm chưa hoàn tất / cần xác nhận thủ công:**
  1. Số lượng test còn thiếu (23 so với mục tiêu 30+).
  2. Các thiết lập Auth (tắt self-registration, xóa social providers, Site URL/Redirect URLs) chỉ có thể kiểm chứng trên Supabase Dashboard, không nằm trong migration/code.
  3. Rate limiting cho đăng nhập đã có logic trong Edge Function `audit-log`, nhưng `Login.tsx` vẫn gọi `supabase.auth.signInWithPassword` trực tiếp — chưa thấy việc kiểm tra/gọi rate-limit trước khi đăng nhập.
  4. Các bước vận hành production/staging (DNS wildcard, PITR, test restore, kiểm tra nghiệp vụ đầy đủ) là thủ công và chưa thể xác minh từ mã nguồn.

---

## 2. Kết quả kiểm tra từng Phase / Sub-phase

| Phase | Sub-phase | Tên | Trạng thái | Ghi chú / Bằng chứng |
|---|---|---|---|---|
| 0 | — | Chuẩn bị môi trường & backup | PASS với ghi chú | `.env.staging` tồn tại; git branch hiện tại là `master` thay vì `multi-tenant` (có thể đã merge). Tạo project staging, mirror dữ liệu, backup production là thao tác infra không thể xác minh từ code. |
| 1 | — | Dọn dẹp bảo mật | PASS với ghi chú | Không có file migration riêng; việc xóa policy public được thực hiện trong `phase5_2` và `phase5_3`. `Login.tsx` không có link đăng ký. Tắt self-registration / xóa social providers / Site URL cần kiểm tra trên Supabase Dashboard. |
| 2 | — | Foundation multi-tenancy | PASS | `supabase/migrations/20250704000000_phase2_tenant_foundation.sql` tạo `tenants`, `tenant_memberships`, `tenant_subscriptions`, `system_admins` và các helper function. `types/tenant.ts`, `services/tenantService.ts` tồn tại. |
| 3 | 3.1 | Core business tables | PASS | `20250704000001_phase3_1_core_business_tenant_id.sql` thêm `tenant_id` cho products, customers, orders, order_items, suppliers, promotions. |
| 3 | 3.2 | Inventory & stock tables | PASS | `20250704000002_phase3_2_inventory_stock_tenant_id.sql` thêm `tenant_id` cho các bảng inventory/stock. |
| 3 | 3.3 | Config & misc tables | PASS | `20250704000003_phase3_3_config_misc_tenant_id.sql` thêm `tenant_id` cho các bảng config/còn lại. |
| 4 | 4.1 | Tạo tenant đầu + backfill core | PASS | `20250704000004_phase4_1_first_tenant_backfill_core.sql` tạo tenant `main`, membership admin cho user hiện có, subscription VIP. |
| 4 | 4.2 | Backfill remaining + orphan cleanup + FK | PASS | `20250704000005_phase4_2_backfill_remaining_tables_orphan_cleanup_fk.sql` backfill 27 bảng, backup + xóa orphan records, thêm FK `lot_id` cho `order_items`, `return_order_items`, `import_items`. |
| 5 | 5.1 | Helper functions + custom fetch | PASS | `20250704000006_phase5_1_current_tenant_id.sql` tạo `current_tenant_id()`. `lib/supabase.ts` inject header `x-tenant-id`. `lib/tenant.ts` có `getSubdomain`, `getTenantId`. |
| 5 | 5.2 | RLS policies core tables | PASS | `20250704000007_phase5_2_rls_policies_core_tables.sql` tạo RLS cho 5 bảng core. |
| 5 | 5.3 | Remaining tables + unique indexes | PASS | `20250705000000_phase5_3_...sql` tạo RLS cho 27 bảng còn lại, deduplicate SKU, tạo unique indexes theo tenant. |
| 6 | 6.1 | TenantContext + routing/subdomain | PASS | `contexts/TenantContext.tsx`, `components/TenantStatusPages.tsx`, `App.tsx` xử lý `admin`, root domain, tenant not found, suspended, forbidden. |
| 6 | 6.2 | Custom fetch + service layer inject | PASS | `lib/supabase.ts` có `tenantFetch`; `services/supabaseService.ts` sử dụng `getCurrentTenantId()` / `requireTenantId()` để inject `tenant_id` khi insert/update. |
| 6 | 6.3 | App.tsx + global data loading | PASS | `App.tsx` bọc `TenantProvider`, global data chỉ load sau khi tenant xác định. |
| 6 | 6.4 | Page-level data loading | PASS | Các page POS, Orders, Products, Customers, Reports, InventoryCount sử dụng `useTenant()` và tải theo tenant. |
| 7 | — | Thiết kế giới hạn / gói dịch vụ | PASS | `20250705000001_phase7_subscription_limits.sql` có trigger `check_tenant_limits`, `increment_monthly_order_count`. `services/subscriptionService.ts` tồn tại. |
| 8 | — | Admin dashboard | PASS | `20250705000002_phase8_admin_dashboard_rpc.sql` tạo RPC `create_tenant_with_admin`, `update_tenant_status`. `pages/SystemAdminDashboard.tsx` tồn tại. |
| 9 | 9.1 | `create-tenant` | PASS | `supabase/functions/create-tenant/index.ts` + migration `20250705000003_phase9_1_...`. |
| 9 | 9.2 | `invite-member` | PASS | `supabase/functions/invite-member/index.ts`. |
| 9 | 9.3 | `check-subdomain` | PASS | `supabase/functions/check-subdomain/index.ts`. |
| 9 | 9.4 | `reset-password` | PASS | `supabase/functions/reset-password/index.ts`. |
| 9 | 9.5 | `process-checkout` | PASS | `supabase/functions/process-checkout/index.ts` + migration `20250705000004/05/06_phase9_5_...`. |
| 9 | 9.6 | `audit-log` + rate limiting | PASS với ghi chú | `supabase/functions/audit-log/index.ts` + migration `20250705000007_phase9_6_...`. Logic lockout đăng nhập có trong function, nhưng `Login.tsx` chưa gọi kiểm tra rate-limit trước khi đăng nhập. |
| 10 | 10.1 | DB policies theo role | PASS | `20250705000008_phase10_1_db_policies_theo_role.sql` DROP generic policies và tạo role-based policies cho orders, products, import_receipts, inventory_counts, disposals, customers, suppliers, v.v. |
| 10 | 10.2 | UI permissions | PASS | `hooks/usePermissions.ts` cung cấp `canCreateOrder`, `canViewReports`, ...; `AppTopbar`, `BottomNav`, `MobileLayout` và các page sử dụng. |
| 11 | — | Audit log | PASS | `20250705000009_phase11_audit_log_triggers.sql` tạo bảng `app_audit_log`, trigger cho orders/products/import_receipts/disposals/app_settings. `services/auditService.ts` ghi thủ công LOGIN/LOGOUT/EXPORT qua Edge Function. `pages/AuditLog.tsx` tồn tại. |
| 12 | 12.1–12.3 | TypeScript strict | PASS | `tsconfig.json` có `"strict": true`. `npm run lint` PASS. |
| 13 | 13.1 | Unit tests tenant/auth/RLS | PASS với cảnh báo | `tests/tenant.test.ts` (4 tests), `tests/rls.test.ts` (3 tests). |
| 13 | 13.2 | Integration tests tenant isolation | PASS với cảnh báo | `tests/integration/tenant-isolation.test.ts` (3 tests). |
| 13 | 13.3 | Smoke tests RBAC/subscription/offline | PASS với cảnh báo | `tests/smoke/rbac.test.ts` (5), `subscription.test.ts` (5), `offline-tenant.test.ts` (3). |
| 14 | — | Dọn dẹp codebase | PASS | `20250705000010_phase14_cleanup_backup_tables.sql` xóa backup tables. Không còn `OLD/`, `MobilePOS.backup.tsx`, `memory-zone/.temp/phase*/fixed_*.sql`. |
| 15 | — | Test trên staging | Cần xác nhận thủ công | Có commit `8b9dd5a` và migration `20250705000015_phase15_staging_fixes.sql`. Các check-list tạo tenant, RBAC, storage, rate limiting, password reset là manual. |
| 16 | — | Deploy production | Cần xác nhận thủ công | Có commit `6184816`, `bc27b24`, migration storage RLS `20250705000016_phase16_storage_rls_tenant_assets.sql`. DNS/hosting/SSL cần kiểm tra trên Cloudflare Dashboard. |
| 17 | — | Vận hành dài hạn | PASS với ghi chú | `20250705000017_phase17_long_term_operations.sql` tạo archive tables, partitioned audit log, `run_data_retention()`, cron `data-retention-daily`. `runbook.md` tồn tại. Nâng Pro + PITR + test restore là bước thủ công. |

---

## 3. Các lỗi / thiếu sót / điểm cần lưu ý

### 3.1. Số lượng test chưa đạt tiêu chí chấp nhận (AC #4)

- **Tiêu chí:** ít nhất 30 unit tests và 5 integration tests.
- **Thực tế:** 23 tests, 6 test files: tenant (4), rls (3), integration/tenant-isolation (3), smoke/rbac (5), smoke/subscription (5), smoke/offline-tenant (3).
- **Kết quả:** Thiếu 7 unit tests và 2 integration tests so với mục tiêu.
- **Khuyến nghị:** Bổ sung unit tests cho `usePermissions`, `subscriptionService`, `lotUtils`, `invoiceNumber`, `offlineManager`, và integration tests cho RBAC flow / subscription limits.

### 3.2. Phase 1 — Auth config không nằm trong migration/code

- **Thiết lập cần làm trên Supabase Dashboard:**
  - Tắt `Enable new users` (self-registration).
  - Xóa social providers.
  - `Site URL` / `Redirect URLs` chứa `*.vietsalepro.com`.
- **Mã nguồn:** `Login.tsx` không có link đăng ký; `.env` và `.env.staging` chỉ chứa `VITE_SUPABASE_ANON_KEY`, không có `VITE_SUPABASE_SERVICE_ROLE_KEY`.
- **Khuyến nghị:** Kiểm tra và screenshot cấu hình Auth trên Supabase Dashboard; nếu cần lưu lại thành tài liệu hoặc migration seed script.

### 3.3. Rate limiting đăng nhập chưa được gắn vào frontend

- **Edge Function `audit-log`:** đã hỗ trợ `type=rate_limit` cho action `login`, lockout sau 5 lần sai trong 15 phút.
- **Frontend `Login.tsx`:** hiện gọi `supabase.auth.signInWithPassword` trực tiếp, không gọi kiểm tra rate-limit từ `audit-log` trước khi đăng nhập.
- **Kết quả:** Lockout đăng nhập chỉ phát huy nếu có một lớp bảo vệ bên ngoài (ví dụ Cloudflare) hoặc nếu frontend được sửa để gọi `audit-log` trước mỗi lần đăng nhập.
- **Khuyến nghị:** Cân nhắc thêm wrapper trong `AuthContext` hoặc `Login.tsx` để gọi kiểm tra rate-limit (hoặc chuyển sang custom login Edge Function như phương án 1 trong kế hoạch).

### 3.4. `.env.staging` đặt tên biến khác so với kế hoạch

- **Kế hoạch yêu cầu:** `VITE_SUPABASE_URL_STAGING`, `VITE_SUPABASE_ANON_KEY_STAGING`.
- **Thực tế:** `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` trong `.env.staging`.
- **Đánh giá:** Vẫn hoạt động nếu chạy `vite --mode staging`, nhưng là điểm lệch so với spec.
- **Khuyến nghị:** Làm rõ tiêu chuẩn đặt tên hoặc cập nhật kế hoạch cho khớp.

### 3.5. Các hạng mục vận hành production/staging chưa thể xác minh từ code

- **Phase 15 (Staging test):** tạo nhiều tenant, kiểm tra cách ly, RBAC, storage, rate limiting, password reset, offline sync — cần chạy thủ công trên môi trường staging.
- **Phase 16 (Deploy production):** DNS wildcard `*.vietsalepro.com`, SSL, Cloudflare Pages, test smoke — cần kiểm tra trên Cloudflare Dashboard và thực tế.
- **Phase 17 (PITR & test restore):** nâng Supabase Pro, bật PITR, chạy test restore ít nhất 1 lần — cần thực hiện thủ công.

### 3.6. Phase 1 policy cleanup không có migration riêng

- Không tìm thấy file `phase1_security_cleanup.sql` trong `supabase/migrations/`.
- Việc xóa `authenticated_full_access_temp` và các policy public cũ được xử lý trong `phase5_2` và `phase5_3`.
- **Đánh giá:** Chức năng đã được đáp ứng, nhưng việc thiếu migration Phase 1 riêng làm kế hoạch triển khai production không hoàn toàn 1:1 với spec.

---

## 4. Trạng thái các tiêu chí chấp nhận (Acceptance Criteria)

| # | Tiêu chí | Trạng thái | Minh chứng / Ghi chú |
|---|---|---|---|
| 1 | Không còn policy public/anon ALL | PASS | Được xử lý trong `phase5_2` và `phase5_3`. |
| 2 | `npm run lint` pass với `strict: true` | PASS | `tsconfig.json`: `"strict": true`; lint exit 0. |
| 3 | `npm run build` pass | PASS | Build exit 0, dist được tạo. |
| 4 | ≥ 30 unit tests + ≥ 5 integration tests pass | **FAIL** | Chỉ 23 tests tổng cộng (3 integration). |
| 5 | Không còn record mồ côi | PASS | Migration `phase4_2` backup + xóa orphan records. |
| 6 | FK trên `order_items`, `return_order_items`, `import_items.lot_id` | PASS | Migration `phase4_2` thêm FK. |
| 7 | Có runbook | PASS | `runbook.md` tồn tại. |
| 8 | Backup tự động + đã test restore | Cần xác nhận | Cron và runbook có; PITR/test restore thủ công. |
| 9 | Cách ly dữ liệu tenant A/B đã test | PASS | Tests `rls.test.ts` và `integration/tenant-isolation.test.ts`. |
| 10 | RBAC đã test | PASS | `smoke/rbac.test.ts`. |
| 11 | Self-registration tắt | Cần xác nhận | Không thể kiểm tra từ code; cần Supabase Dashboard. |
| 12 | Service role key không lộ frontend | PASS | Chỉ tồn tại trong Edge Function env; không có trong `.env` / `.env.staging`. |
| 13 | Subdomain không tồn tại / tenant suspended xử lý đúng | PASS | `App.tsx` + `TenantStatusPages.tsx`. |
| 14 | Audit log hoạt động, chỉ admin/system admin xem | PASS | `app_audit_log` + trigger + `pages/AuditLog.tsx` + RLS. |
| 15 | Storage RLS cách ly file | PASS | Migration `phase16_storage_rls_tenant_assets.sql`. |
| 16 | Subscription limits đã test | PASS | `smoke/subscription.test.ts` + trigger `check_tenant_limits`. |
| 17 | Đã xóa backup tables / file rác | PASS | Migration `phase14_cleanup_backup_tables.sql`; không còn `OLD/` hay backup file. |
| 18 | `tenant_id` là UUID đồng bộ | PASS | Tất cả bảng dùng `UUID` cho `tenant_id`. |
| 19 | Không lưu `tenant_id` vào `localStorage` | PASS | `tenant_id` được xác định từ subdomain runtime qua `lib/supabase.ts`. |
| 20 | Password reset redirect đúng subdomain | PASS | Edge Function `reset-password` set `redirect_to` theo subdomain. |
| 21 | Rate limiting đã test | Cần xác nhận | Logic có trong `audit-log`, nhưng login chưa gắn vào frontend. |
| 22 | SKU / mã đơn / mã hóa đơn unique theo tenant | PASS | Unique indexes trong `phase5_3`. |
| 23 | Offline queue cách ly theo tenant | PASS | `utils/offlineManager.ts` có `tenantId` cho mỗi op; `syncOfflineQueue` xử lý theo tenant hiện tại. |
| 24 | Data retention policy + archive/partition | PASS | Migration `phase17` + `runbook.md`. |
| 25 | Backup strategy dùng Supabase CLI/PITR, không dùng `pg_dump` thuần | Cần xác nhận | Runbook đề cập `supabase db dump` và PITR; cần bật PITR thực tế. |

---

## 5. Kiểm tra nhanh đã thực hiện

```bash
# Lint
npm run lint              # exit 0, no errors

# Build production
npm run build             # exit 0, dist/ generated

# Tests
npm run test -- --run     # 6 files, 23 tests, all pass
```

**Git status:** chỉ còn thư mục untracked `.codebase-memory/` (không liên quan đến multi-tenancy).

---

## 6. Khuyến nghị hành động tiếp theo

1. **Bổ sung tests** để đạt ít nhất 30 unit tests và 5 integration tests (ưu tiên thêm tests cho `usePermissions`, `subscriptionService`, `utils/lotUtils`, `utils/invoiceNumber`, `utils/offlineManager`, và integration test cho subscription + RBAC cross-page).
2. **Xác nhận cấu hình Supabase Auth:** tắt self-registration, xóa social providers, kiểm tra `Site URL` / `Redirect URLs` chứa `*.vietsalepro.com`.
3. **Quyết định rate limiting đăng nhập:**
   - Option A: sửa `Login.tsx` để gọi kiểm tra `audit-log` trước khi gọi `supabase.auth.signInWithPassword`.
   - Option B: triển khai Cloudflare rate limiting rule và ghi nhận trong runbook.
4. **Chạy full checklist Phase 15 trên staging** (tạo 3 tenants, test cách ly, RBAC, storage, subscription, password reset, rate limiting, offline sync) và lưu kết quả.
5. **Hoàn tất Phase 16 production:** kiểm tra DNS `*.vietsalepro.com`, SSL, Cloudflare Pages deploy, smoke test.
6. **Nâng Supabase Pro + bật PITR** và thực hiện ít nhất 1 lần test restore theo runbook.
7. **Cân nhắc đổi tên biến trong `.env.staging`** hoặc cập nhật kế hoạch để khớp thực tế.

---

*File báo cáo được tạo tự động bởi Devin dựa trên kiểm tra mã nguồn và chạy lint/build/tests tại thời điểm 2026-07-05.*
