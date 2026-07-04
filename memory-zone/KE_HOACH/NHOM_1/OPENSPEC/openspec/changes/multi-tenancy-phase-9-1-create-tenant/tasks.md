## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_9_1_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [ ] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 9.1: `create-tenant`

- [ ] 1.1 Rate limiting: 10 request/phút/IP (dùng `rate_limit_logs`).
- [ ] 1.2 Kiểm tra caller là system admin (qua `system_admins`).
- [ ] 1.3 Validate subdomain: chỉ chữ thường, số, dấu gạng ngang; độ dài 3-63; không trùng reserved (`admin`, `www`, `api`, `app`).
- [ ] 1.4 Kiểm tra subdomain chưa tồn tại trong `public.tenants`.
- [ ] 1.5 Tạo user admin trong `auth.users` bằng `supabase.auth.admin.createUser({ email, password, email_confirm: true })`.
- [ ] 1.6 Tạo tenant trong `public.tenants` với `owner_id` = user admin vừa tạo.
- [ ] 1.7 Tạo subscription trong `public.tenant_subscriptions` theo gói được chọn (free/vip).
- [ ] 1.8 Tạo membership admin trong `public.tenant_memberships`.
- [ ] 1.9 Ghi audit log `INSERT` vào `public.app_audit_log` (nếu trigger chưa gắn hoặc ghi thủ công).
- [ ] 1.10 Trả về `{ tenant, adminUser, initialPassword }`.
- [ ] 1.11 Create `supabase/functions/create-tenant/index.ts`
- [ ] 1.12 Create RPC `create_tenant_with_admin` (nếu cần)

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [ ] System admin tạo tenant qua Edge Function.
- [ ] Subdomain không hợp lệ bị từ chối.
- [ ] Tenant mới có subscription row.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_9_1_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.