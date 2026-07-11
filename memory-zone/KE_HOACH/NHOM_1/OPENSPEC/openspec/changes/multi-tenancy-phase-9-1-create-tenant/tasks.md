## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_9_1_20260705_102032`
- [x] 0.2 Confirm `npm run lint` passes
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 9.1: `create-tenant`

- [x] 1.1 Rate limiting: 10 request/phút/IP (dùng `rate_limit_logs`).
- [x] 1.2 Kiểm tra caller là system admin (qua `system_admins`).
- [x] 1.3 Validate subdomain: chỉ chữ thường, số, dấu gạng ngang; độ dài 3-63; không trùng reserved (`admin`, `www`, `api`, `app`).
- [x] 1.4 Kiểm tra subdomain chưa tồn tại trong `public.tenants`.
- [x] 1.5 Tạo user admin trong `auth.users` bằng `supabase.auth.admin.createUser({ email, password, email_confirm: true })`.
- [x] 1.6 Tạo tenant trong `public.tenants` với `owner_id` = user admin vừa tạo.
- [x] 1.7 Tạo subscription trong `public.tenant_subscriptions` theo gói được chọn (free/vip).
- [x] 1.8 Tạo membership admin trong `public.tenant_memberships`.
- [x] 1.9 Ghi audit log `INSERT` vào `public.app_audit_log` (nếu trigger chưa gắn hoặc ghi thủ công).
- [x] 1.10 Trả về `{ tenant, adminUser, initialPassword }`.
- [x] 1.11 Create `supabase/functions/create-tenant/index.ts`
- [x] 1.12 Create RPC `create_tenant_with_admin` (nếu cần) — đã tồn tại từ Phase 8

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build`
- [x] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [x] System admin tạo tenant qua Edge Function.
- [x] Subdomain không hợp lệ bị từ chối.
- [x] Tenant mới có subscription row.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_9_1_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.