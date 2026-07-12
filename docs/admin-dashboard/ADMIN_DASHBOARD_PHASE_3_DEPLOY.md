# Phase 3 — Deploy migrations & edge functions

**Mục tiêu:** Đưa các SQL function và edge function lên Supabase remote một cách an toàn.

**Ưu tiên:** Cao — chỉ làm sau khi Phase 1 và Phase 2 hoàn thành.

---

## 1. Chuẩn bị trước khi deploy

### 1.1 Backup production

- Vào Supabase Dashboard → Database → Backups.
- Kiểm tra PITR (Point-in-Time Recovery) đã bật chưa.
- Nếu chưa bật PITR, xuất dump schema + data qua `supabase db dump` làm phòng ngừa:
  ```bash
  npx supabase db dump --db-url "postgresql://..." -f backup_pre_admin_dashboard_fix.sql
  ```

### 1.2 Kiểm tra local

```bash
npm run lint
npm run build
npx vitest run
```

Tất cả phải PASS trước khi deploy.

### 1.3 Kiểm tra migrations ở local

```bash
npx supabase migration up
```

Đảm bảo tất cả migration chạy mượt, không lỗi.

---

## 2. Deploy lên Supabase remote

### 2.1 Link project

```bash
npx supabase login
npx supabase link --project-ref rsialbfjswnrkzcxarnj
```

### 2.2 Push migrations

```bash
npx supabase db push
```

Hoặc nếu muốn tự động yes:

```bash
npx supabase db push --yes
```

> **Lưu ý:** `db push` chỉ chạy các migration chưa được ghi nhận trên remote. Nếu remote đã có migration cùng timestamp, CLI sẽ báo conflict.

### 2.3 Deploy edge functions

```bash
npx supabase functions deploy audit-log
npx supabase functions deploy cron-admin-tasks
```

Hoặc deploy nhiều function một lúc:

```bash
npx supabase functions deploy audit-log cron-admin-tasks create-system-admin
```

---

## 3. Kiểm tra sau deploy

### 3.1 Kiểm tra functions trong DB

Mở Supabase SQL Editor hoặc psql:

```sql
SELECT proname, proargnames, proargtypes::regtype[]
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'get_top_tenants',
    'get_current_user_tenants',
    'get_tenants_admin',
    'search_tenant_members',
    'get_gdpr_requests',
    'get_system_overview',
    'get_tenant_growth'
  )
ORDER BY proname;
```

Đảm bảo:
- `get_top_tenants` có 2 arguments: `integer`, `integer`.
- `get_current_user_tenants` không có argument.
- `get_tenants_admin` có 7 arguments: `integer`, `integer`, `text`, `text`, `text`, `text`, `text`.

### 3.2 Kiểm tra grants

```sql
SELECT
  proname,
  grantee,
  privilege_type
FROM information_schema.role_usage_grants
WHERE object_name IN ('get_top_tenants', 'get_current_user_tenants', 'get_tenants_admin')
ORDER BY object_name, grantee;
```

`authenticated` phải có `EXECUTE`.

### 3.3 Kiểm tra edge functions

Vào Supabase Dashboard → Edge Functions. Đảm bảo `audit-log` và `cron-admin-tasks` có trạng thái Active.

---

## 4. Rollback nếu gặp sự cố

### 4.1 Rollback migration

Nếu migration gây lỗi nghiêm trọng:

1. Dùng Supabase PITR để restore về thời điểm trước deploy.
2. Hoặc drop function thủ công:
   ```sql
   DROP FUNCTION IF EXISTS public.get_top_tenants(INTEGER, INTEGER);
   DROP FUNCTION IF EXISTS public.get_current_user_tenants();
   DROP FUNCTION IF EXISTS public.get_tenants_admin(INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT);
   ```
   Sau đó tạo lại phiên bản cũ nếu cần.

### 4.2 Rollback edge function

Supabase Edge Function không có rollback tự động. Cần deploy lại version cũ từ git:

```bash
git checkout <commit_cũ> -- supabase/functions/audit-log
npx supabase functions deploy audit-log
```

---

## 5. Checklist Phase 3

- [ ] Backup production trước khi deploy.
- [ ] `npm run lint`, `npm run build`, `npx vitest run` đều PASS.
- [ ] `supabase migration up` local PASS.
- [ ] `supabase link --project-ref rsialbfjswnrkzcxarnj` thành công.
- [ ] `supabase db push` thành công.
- [ ] `supabase functions deploy audit-log` (và các edge function liên quan) thành công.
- [ ] Kiểm tra functions và grants trong Supabase Dashboard / SQL Editor.
- [ ] Chuyển sang **Phase 4** để verify frontend.
