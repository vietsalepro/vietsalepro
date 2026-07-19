# Handoff: Phase 16 — Dashboard Config + Smoke Test

> Tạo bởi: Devin (Phase 16 deploy)
> Ngày: 2026-07-05
> Repo: https://github.com/vietsalepro/vietsalepro86
> Supabase production project: QLBH (`rsialbfjswnrkzcxarnj`)

---

## ✅ Đã hoàn thành

1. **Backup**
   - Local repo backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_16_20260705_153439`
   - Production DB backup: `C:\Users\SUACAUBA\Downloads\Project\supabase_prod_backup_20260705_154948\prod_full_backup_20260705_154948.sql`

2. **Local verification**
   - `npm run lint` — PASS
   - `npm run build` — PASS (dist/ sẵn sàng)
   - `npm run test -- --run` — 23 tests PASS

3. **Database migrations** — đã chạy trên production QLBH (`rsialbfjswnrkzcxarnj`) theo đúng thứ tự:
   - Phase 1 → Phase 13
   - Phase 15 staging fixes
   - Phase 16 storage RLS
   - **Chưa chạy Phase 14 cleanup** (`supabase/migrations/20250705000010_phase14_cleanup_backup_tables.sql`)

4. **Edge Functions deployed** trên production:
   - `create-tenant`
   - `invite-member`
   - `check-subdomain`
   - `reset-password`
   - `process-checkout`
   - `audit-log`

5. **Database verification** — các bảng/RPC/policy chính đều tồn tại:
   - `tenants`, `tenant_memberships`, `tenant_subscriptions`, `app_audit_log`, `rate_limit_logs`
   - `process_checkout_tenant`, `create_tenant_with_admin`
   - 32 tenant isolation SELECT policies
   - Main tenant count: 1; total memberships: 3

6. **Git**
   - Commit `6184816` trên `multi-tenant`
   - Đã merge `multi-tenant` → `master` (fast-forward)
   - Đã push cả 2 branch lên `https://github.com/vietsalepro/vietsalepro86`

---

## ⏳ Cần làm tiếp

### 1. Cấu hình Supabase Auth (dashboard)

Vào Supabase Dashboard → project **QLBH** (`rsialbfjswnrkzcxarnj`):

- **Authentication → Settings**
  - Tắt **"Enable new users"** (self-registration).
- **Authentication → Providers**
  - Xóa hết social providers (Google, Facebook, GitHub, v.v.).
- **Authentication → URL Configuration**
  - Site URL: `https://vietsalepro.com`
  - Redirect URLs:
    - `https://vietsalepro.com/*`
    - `https://*.vietsalepro.com/*`

### 2. Cấu hình Cloudflare Pages (dashboard)

Vào Cloudflare Dashboard → **Pages**:

1. **Create a project** → **Connect to Git**.
2. Chọn repo `vietsalepro/vietsalepro86`.
3. Setup:
   - Project name: `vietsalepro` (hoặc tùy ý)
   - Production branch: `master`
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Environment variables:
   - `VITE_SUPABASE_URL` = lấy từ `.env` production
   - `VITE_SUPABASE_ANON_KEY` = lấy từ `.env` production
5. **Save and Deploy**.
6. Sau khi deploy, vào **Custom domains**:
   - Thêm `vietsalepro.com`
   - Thêm `*.vietsalepro.com`
7. Bật **Cloudflare proxy** (mây vàng) cho cả 2 domain.

> `_redirects` trong repo đã có `/* /index.html 200`, SPA routing sẽ hoạt động.

### 3. Đợi DNS resolve

Kiểm tra:

```powershell
nslookup vietsalepro.com
nslookup main.vietsalepro.com
nslookup admin.vietsalepro.com
```

Khi các subdomain đều trỏ về Cloudflare Pages → sang bước smoke test.

### 4. Smoke test

| Test | Cách kiểm tra |
|------|---------------|
| Đăng nhập `main.vietsalepro.com` | Dùng user hiện có, phải vào được app |
| Đăng nhập sai tenant | User của tenant A không vào được subdomain tenant B |
| Tạo đơn hàng | POS tạo đơn, trừ kho đúng |
| Nhập hàng | Tạo phiếu nhập, tồn kho tăng |
| RBAC | Cashier không thấy nút xóa đơn; admin thấy đầy đủ |
| Storage | Upload file vào `tenant-assets` và đảm bảo tenant khác không thấy |
| Tạo tenant mới | Gọi Edge Function `create-tenant` thành công |
| Audit log | Thao tác xóa/sửa được ghi log |
| Self-registration | `supabase.auth.signUp` bị từ chối |
| Password reset | Gửi email reset, redirect về đúng subdomain |

### 5. Nếu smoke test PASS

Chạy Phase 14 cleanup trên production:

```powershell
cd "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7"
Get-Content "supabase/migrations/20250705000010_phase14_cleanup_backup_tables.sql" | supabase db query --linked
```

Hoặc chạy qua Supabase SQL Editor.

### 6. Theo dõi 24h

- Theo dõi Supabase Dashboard: Auth logs, RLS errors, Edge Function errors.
- Cloudflare Pages analytics: 5xx errors.
- Nếu có lỗi nghiêm trọng: rollback DB từ backup trước migration.

---

## ⚠️ Lưu ý quan trọng

- **Không chạy Phase 14 cleanup** cho đến khi smoke test production pass.
- **Backup production DB** đã có, có thể restore nếu cần.
- Nếu gặp lỗi auth, kiểm tra lại Site URL / Redirect URLs trong Supabase.
- Nếu gặp lỗi 404 khi reload trang con trên subdomain, kiểm tra `_redirects` trong Cloudflare Pages.

---

## Command tham khảo

```powershell
# Kiểm tra status
supabase functions list --linked
supabase db query --linked "SELECT count(*) FROM public.tenants;"

# Deploy lại Edge Functions nếu cần
supabase functions deploy create-tenant invite-member check-subdomain reset-password process-checkout audit-log

# Chạy Phase 14 cleanup khi smoke pass
Get-Content "supabase/migrations/20250705000010_phase14_cleanup_backup_tables.sql" | supabase db query --linked
```
