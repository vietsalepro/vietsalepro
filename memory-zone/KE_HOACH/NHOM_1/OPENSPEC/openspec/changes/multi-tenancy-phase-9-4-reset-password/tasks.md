## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_9_4_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [ ] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 9.4: `reset-password`

- [ ] 1.1 Kiểm tra caller là admin của tenant hoặc system admin.
- [ ] 1.2 Kiểm tra user thuộc tenant (qua `tenant_memberships`).
- [ ] 1.3 Nếu user đã từng đăng nhập: gọi `supabase.auth.admin.generateLink('recovery', email, { redirect_to: https://{subdomain}.vietsalepro.com/reset-password })`.
- [ ] 1.4 Nếu user mới chưa đăng nhập: gọi `generateLink('invite', email, { redirect_to: https://{subdomain}.vietsalepro.com/set-password })`.
- [ ] 1.5 Gửi email thông qua email provider mặc định của Supabase.
- [ ] 1.6 Create `supabase/functions/reset-password/index.ts`

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [ ] Reset password redirect về đúng subdomain.
- [ ] User mới nhận invite link về đúng subdomain.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_9_4_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.