## 0. Pre-Flight

- [x] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_9_4_<YYYYMMDD_HHMMSS>`
- [x] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [x] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 9.4: `reset-password`

- [x] 1.1 Kiểm tra caller là admin của tenant hoặc system admin.
- [x] 1.2 Kiểm tra user thuộc tenant (qua `tenant_memberships`).
- [x] 1.3 Nếu user đã từng đăng nhập: gọi `supabase.auth.admin.generateLink('recovery', email, { redirect_to: https://{subdomain}.vietsalepro.com/reset-password })`.
- [x] 1.4 Nếu user mới chưa đăng nhập: gọi `generateLink('invite', email, { redirect_to: https://{subdomain}.vietsalepro.com/set-password })`.
- [x] 1.5 Gửi email thông qua email provider mặc định của Supabase.
- [x] 1.6 Create `supabase/functions/reset-password/index.ts`

## 2. Verification

- [x] 2.1 Run `npm run lint`
- [x] 2.2 Run `npm run build` if this sub-phase touches code
- [x] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [x] Reset password redirect về đúng subdomain.
- [x] User mới nhận invite link về đúng subdomain.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_9_4_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.