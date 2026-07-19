# Handoff: Hoàn thành Phase 1 trên Staging

> Tạo sau khi Phase 1 đã chạy xong trên production (project `rsialbfjswnrkzcxarnj`).
> Project staging hiện tại `shbmzvfcenbybvyzclem` đang trống (chỉ có schema hệ thống, chưa có bảng kinh doanh).
> Nhiệm vụ tiếp theo: mirror production → staging, sau đó chạy lại migration + auth config của Phase 1 trên staging.

---

## 1. Mirror dữ liệu từ Production sang Staging

### 1.1. Chuẩn bị

- Đảm bảo đã có quyền truy cập Supabase project `rsialbfjswnrkzcxarnj` (production) và `shbmzvfcenbybvyzclem` (staging).
- Đảm bảo Supabase CLI đã login: `supabase projects list` hiển thị cả hai project.

### 1.2. Cách A: Dùng Supabase CLI (khuyên dùng nếu có password)

```powershell
# Link production để dump
supabase link --project-ref rsialbfjswnrkzcxarnj --workdir C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7

# Dump schema + data production
supabase db dump --linked --file "C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/staging_mirror_production.sql"

# Link staging
supabase link --project-ref shbmzvfcenbybvyzclem --workdir C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7

# Restore vào staging
supabase db query --file "C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/staging_mirror_production.sql" --linked
```

> Lưu ý: `supabase db dump --linked` có thể hỏi password. Nếu không có password, chuyển sang Cách B.

### 1.3. Cách B: Dùng Supabase Dashboard (nếu CLI yêu cầu password)

1. Mở `https://supabase.com/dashboard/project/rsialbfjswnrkzcxarnj`.
2. Vào **Database → Backups**.
3. Tạo backup hoặc sử dụng **PITR** nếu có.
4. Tải file backup `.sql` về.
5. Mở `https://supabase.com/dashboard/project/shbmzvfcenbybvyzclem`.
6. Vào **SQL Editor → New query**.
7. Paste toàn bộ nội dung backup → **Run**.
8. Kiểm tra: `SELECT count(*) FROM public.products;` nên trả về số dòng giống production.

### 1.4. Kiểm tra mirror thành công

```powershell
supabase link --project-ref shbmzvfcenbybvyzclem --workdir C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7
supabase db query --linked "SELECT count(*) FROM public.products;" --output-format json
supabase db query --linked "SELECT count(*) FROM public.orders;" --output-format json
```

> Cả hai lệnh phải trả về số lượng > 0.

---

## 2. Chạy lại migration Phase 1 trên Staging

File migration đã có sẵn: `supabase/migration_phase1_security_cleanup.sql`

```powershell
# Đảm bảo đang link staging
supabase link --project-ref shbmzvfcenbybvyzclem --workdir C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7

# Chạy migration
supabase db query --file "C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/supabase/migration_phase1_security_cleanup.sql" --linked
```

### Kiểm tra migration

```powershell
# Không còn policy public nào trên bảng kinh doanh
supabase db query --linked "SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public' AND 'public' = ANY(roles);" --output-format json

# Các bảng kinh doanh đều có policy authenticated_full_access_temp
supabase db query --linked "SELECT tablename FROM pg_policies WHERE schemaname = 'public' AND policyname = 'authenticated_full_access_temp' ORDER BY tablename;" --output-format json
```

---

## 3. Push auth config Phase 1 lên Staging

File config hiện tại: `supabase/config.toml` (đang có `project_id = "rsialbfjswnrkzcxarnj"` cho production).

### 3.1. Tạm thời đổi `project_id` sang staging

Trong `supabase/config.toml`, sửa:

```toml
project_id = "shbmzvfcenbybvyzclem"
```

> ponytail: đổi tạm `project_id` để push config sang staging; đổi lại production sau khi xong.

### 3.2. Push config

```powershell
supabase link --project-ref shbmzvfcenbybvyzclem --workdir C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7
supabase config push --workdir C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7
```

Xác nhận diff chỉ hiển thị:

- `site_url` → `https://app.vietsalepro.com`
- `additional_redirect_urls` → `["https://*.vietsalepro.com"]`
- `enable_signup` → `false`
- `email.enable_signup` → `true` (giữ email provider bật để đăng nhập)
- Các `auth.external.*.enabled` → `false` (nếu chúng đang bật trên staging)

### 3.3. Đổi `project_id` về lại production

```toml
project_id = "rsialbfjswnrkzcxarnj"
```

---

## 4. Kiểm thử acceptance criteria trên Staging

Dùng `.env.staging` (anon key cho project `shbmzvfcenbybvyzclem`):

### 4.1. User chưa đăng nhập bị chặn

```powershell
$anon = "<ANON_KEY_FROM_.env.staging>"
Invoke-RestMethod -Uri "https://shbmzvfcenbybvyzclem.supabase.co/rest/v1/products?select=id&limit=1" -Headers @{ apikey = $anon; Authorization = "Bearer $anon" }
# Kết quả mong đợi: @[]
```

### 4.2. `supabase.auth.signUp` bị từ chối

```powershell
$body = '{"email":"testphase1_staging@example.com","password":"TestPassword123!"}'
Invoke-RestMethod -Uri "https://shbmzvfcenbybvyzclem.supabase.co/auth/v1/signup" -Method POST -Headers @{ apikey = $anon; "Content-Type" = "application/json" } -Body $body
# Kết quả mong đợi: 422 signup_disabled
```

### 4.3. User đã đăng nhập vẫn thấy data

Cần tạo user tạm bằng service_role key:

```powershell
$service_role = "<SERVICE_ROLE_KEY_FROM_DASHBOARD>"
$headers = @{ apikey = $service_role; Authorization = "Bearer $service_role"; "Content-Type" = "application/json" }
$body = '{"email":"testphase1_staging_auth@example.com","password":"TestAuthPass123!","email_confirm":true}'
$user = Invoke-RestMethod -Uri "https://shbmzvfcenbybvyzclem.supabase.co/auth/v1/admin/users" -Method POST -Headers $headers -Body $body

# Sign in
$body = '{"email":"testphase1_staging_auth@example.com","password":"TestAuthPass123!"}'
$token = (Invoke-RestMethod -Uri "https://shbmzvfcenbybvyzclem.supabase.co/auth/v1/token?grant_type=password" -Method POST -Headers @{ apikey = $anon; "Content-Type" = "application/json" } -Body $body).access_token

# Query products
Invoke-RestMethod -Uri "https://shbmzvfcenbybvyzclem.supabase.co/rest/v1/products?select=id,name&limit=3" -Headers @{ apikey = $anon; Authorization = "Bearer $token" }
# Kết quả mong đợi: danh sách sản phẩm

# Dọn dẹp user tạm
Invoke-RestMethod -Uri "https://shbmzvfcenbybvyzclem.supabase.co/auth/v1/admin/users/$($user.id)" -Method DELETE -Headers @{ apikey = $service_role; Authorization = "Bearer $service_role" }
```

---

## 5. Sau khi hoàn thành

- Chạy `npm run lint` và `npm run build` trên local.
- Cập nhật `tasks.md` của Phase 1 với trạng thái staging: <ref_file file="C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7/memory-zone/KE_HOACH/NHOM_1/OPENSPEC/openspec/changes/multi-tenancy-phase-1-d-n-d-p-b-o-m-t-hi-n-t-i-gi-nguy-n/tasks.md" />
- Commit nếu có thay đổi (ví dụ: cập nhật handoff, sửa config.toml project_id nếu chưa đổi lại).
- Xóa file `supabase/staging_mirror_production.sql` sau khi staging đã ổn định.

---

## 6. Rollback nếu có vấn đề

- Dùng backup `C:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7_backup_multi_tenancy_phase_1_20260704_162213` để khôi phục code.
- Dùng backup từ Supabase Dashboard hoặc file dump để restore staging về trạng thái trước migration.
