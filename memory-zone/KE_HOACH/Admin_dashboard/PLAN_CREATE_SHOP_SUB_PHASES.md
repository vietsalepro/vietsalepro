# Plan — Tạo shop từ Admin Dashboard (chia sub-phase)

> Phiên bản: 2026-07-10  
> Nguồn: `PLAN_CREATE_SHOP_FROM_ADMIN_DASHBOARD.md`  
> Phương án đã chọn: **B** — tự động sinh subdomain/password hoặc nhập password + gửi email credential.

---

## Tổng quan sub-phase

| Sub-phase | Tên | Output chính | Migration SQL | Deploy production | Handoff |
|---|---|---|---|---|---|
| **F28** | Backend email infrastructure | Template `tenant_credentials` trong DB; verify `send-template-email` hoạt động | ✅ Có | `supabase db push --linked --yes` | `HANDOFF_F28.md` |
| **F29** | Update Edge Function `create-tenant` | `create-tenant` chấp nhận `adminPassword`, gửi email credential | ❌ Không (chỉ thay đổi Edge Function) | `supabase functions deploy create-tenant` | `HANDOFF_F29.md` |
| **F30** | Frontend service + types | `createTenantWithCredentials(...)` trong `services/tenantService.ts` | ❌ Không (chỉ code frontend) | Không deploy | `HANDOFF_F30.md` |
| **F31** | Dashboard UI | Form tạo shop + kết quả credential | ❌ Không (chỉ code frontend) | Không deploy | `HANDOFF_F31.md` |
| **F32** | Tests + Production deploy | Test pass; frontend + Edge Function đều trên production | ❌ Không | `supabase functions deploy create-tenant` + Vercel deploy + smoke test | `HANDOFF_F32.md` |

> **Lưu ý về “sau mỗi sub-phase phải migration SQL”:** chỉ F28 tạo ra thay đổi schema/data trong Postgres. Các sub-phase còn lại thay đổi Edge Function hoặc frontend, nên bước “apply lên production” tương ứng là deploy function/frontend. Nếu bạn muốn **mỗi sub-phase đều có migration SQL**, hãy gộp F28+F29 thành một sub-phase Backend duy nhất.

---

## F28 — Backend email infrastructure

**Mục tiêu:**
- Thêm email template `tenant_credentials` vào DB.
- Verify `send-template-email` hoạt động với template mới.

**Files:**
- Migration mới: `supabase/migrations/20260710000001_add_tenant_credentials_template.sql`
- Migration mới: `supabase/migrations/20260710000002_allow_email_failed_audit_action.sql`

> ponytail: Cần thêm migration sửa CHECK constraint của `app_audit_log.action` để cho phép `EMAIL_FAILED`. Nếu không, F29 sẽ bị lỗi 500 khi gửi email lỗi vì DB từ chối insert audit log.

**Apply production:**
```bash
supabase db push --linked --yes
```

**Acceptance:**
- Query `SELECT key FROM public.email_templates WHERE key = 'tenant_credentials'` trả về 1 dòng.
- Query `SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.app_audit_log'::regclass AND conname LIKE '%action%'` cho thấy `EMAIL_FAILED` đã được phép.
- Gọi Edge Function `send-template-email` với template_key = `tenant_credentials` trả về `success: true` (test mode).

---

## F29 — Update Edge Function `create-tenant`

**Mục tiêu:**
- `create-tenant` nhận thêm `adminPassword?: string`.
- Nếu không gửi password → tự sinh UUID.
- Sau tạo thành công → gọi `send-template-email` gửi credential.

**Files:**
- `supabase/functions/create-tenant/index.ts`

**Apply production:**
```bash
supabase functions deploy create-tenant
```

**Acceptance:**
- Gọi với `adminPassword` tùy chỉnh (≥ 6 ký tự) → user được tạo với password đó.
- Gọi không có `adminPassword` → password là UUID.
- Lỗi email không rollback tenant.

---

## F30 — Frontend service + types

**Mục tiêu:**
- Thêm type `CreateTenantResult`.
- Thêm hàm `createTenantWithCredentials(...)` gọi Edge Function `create-tenant` qua `supabase.functions.invoke`.
- **Không dùng tên `createTenant`** vì `services/tenantService.ts` đã có hàm `createTenant` khác (insert trực tiếp vào `tenants`). Dùng tên mới để tránh lỗi compile.

**Files:**
- `types/tenant.ts`
- `services/tenantService.ts`

**Apply production:**
- Không deploy ở sub-phase này.

**Acceptance:**
- `createTenantWithCredentials` validate đúng response shape.
- Lỗi từ Edge Function throw message rõ ràng.

---

## F31 — Dashboard UI

**Mục tiêu:**
- Sửa form “Tạo cửa hàng mới” trên `SystemAdminDashboard`:
  - thêm email admin,
  - toggle tự sinh / nhập password,
  - auto-suggest subdomain slug.
- Hiển thị kết quả credential sau tạo thành công (URL, email, password, copy, login-as).

**Files:**
- `pages/SystemAdminDashboard.tsx`
- `lib/tenant.ts` (reuse `getTenantUrl`)

**Apply production:**
- Không deploy ở sub-phase này.

**Acceptance:**
- Tạo shop thành công với cả 2 chế độ password.
- Copy password hoạt động.
- Link shop mở đúng subdomain.
- Lỗi hiển thị bằng tiếng Việt.

---

## F32 — Tests + Production deploy

**Mục tiêu:**
- Viết smoke/integration tests.
- Chạy `npm run lint`, `npm run build`, `npx vitest run`.
- Deploy Edge Function + frontend production.
- Smoke test tạo shop, nhận email, đăng nhập.

**Files:**
- `tests/smoke/admin-dashboard-create-tenant.test.ts`
- `tests/integration/create-tenant-integration.test.ts` (tùy chọn)

**Apply production:**
```bash
# 1. Edge Function
supabase functions deploy create-tenant

# 2. Frontend build + deploy
npm run lint
npm run build
# Deploy lên Vercel (qua Git push hoặc Vercel CLI)
```

**Acceptance:**
- Tất cả test pass.
- Build pass.
- Trên production: tạo shop test, nhận email, đăng nhập, archive/xóa shop test.

---

## Các lưu ý bổ sung để tránh lỗi khi thực hiện

1. **Không đặt tên hàm mới là `createTenant`** trong `services/tenantService.ts` vì đã có hàm cùng tên. Dùng `createTenantWithCredentials` (hoặc tên tương đương) và import đúng tên đó ở F31/F32.
2. **Đồng bộ limits với Plan Builder:** Edge Function `create-tenant` hiện hard-code `max_users / max_products / max_orders_per_month`. Nếu bảng `plans` được chỉnh sửa, tenant tạo từ dashboard sẽ lệch. Xem hướng dẫn trong `HANDOFF_F29.md` để lấy limits từ `public.get_default_plan_limit_values(plan)`.
3. **Bắt lỗi `send-template-email` đúng cách:** `supabaseAdmin.functions.invoke` trả về `{ error }` object, không throw. Phải kiểm tra `error` sau khi invoke, không chỉ `try/catch`.
4. **Giữ `createTenantWithAdmin` hoặc refactor test cũ:** Nhiều smoke test hiện tại dùng `createTenantWithAdmin` để seed tenant. Nếu xóa hàm này, test suite sẽ bị vỡ. Nên giữ lại hoặc cập nhật lại các test đó cùng lúc.
5. **Cleanup sau smoke test theo thứ tự:** (1) archive/xóa tenant test qua `delete_tenant_safe`, (2) xóa `tenant_memberships` nếu còn sót, (3) xóa audit log test, (4) xóa `rate_limit_logs` của IP test, (5) cuối cùng xóa auth user test. Thứ tự này tránh vi phạm FK constraint.
6. **Rollback frontend trên Vercel:** Revert commit → push lại origin/master; Vercel sẽ tự động redeploy.
7. **KHÔNG gọi `public.create_tenant_with_admin` từ Edge Function:** RPC này là `SECURITY INVOKER` và check `is_system_admin()` qua `auth.uid()`. Service role không có `auth.uid()`, nên sẽ bị từ chối. Chỉ dùng cách lấy limits từ `get_default_plan_limit_values` rồi insert tay.
8. **Validate response adminUser đầy đủ:** `createTenantWithCredentials` nên kiểm tra cả `data.adminUser.id` và `data.adminUser.email`, không chỉ tồn tại object.
9. **Migration sửa CHECK constraint `app_audit_log.action` là bắt buộc** trước F29 nếu muốn ghi audit log `EMAIL_FAILED`.

---

## Rollback tổng thể

1. Revert code.
2. Redeploy Edge Function cũ nếu cần.
3. Xóa shop test qua UI archive hoặc RPC `delete_tenant_safe`.
4. Template `tenant_credentials` có thể để lại hoặc xóa tay; không ảnh hưởng hệ thống cũ.

---

## Các file handoff đã tạo

- `memory-zone/KE_HOACH/Admin_dashboard/HANDOFF_F28.md`
- `memory-zone/KE_HOACH/Admin_dashboard/HANDOFF_F29.md`
- `memory-zone/KE_HOACH/Admin_dashboard/HANDOFF_F30.md`
- `memory-zone/KE_HOACH/Admin_dashboard/HANDOFF_F31.md`
- `memory-zone/KE_HOACH/Admin_dashboard/HANDOFF_F32.md`

Mỗi file handoff là template sẵn để copy vào task chat mới; chat mới sẽ implement xong và cập nhật lại file handoff thành “Đã làm xong”.
