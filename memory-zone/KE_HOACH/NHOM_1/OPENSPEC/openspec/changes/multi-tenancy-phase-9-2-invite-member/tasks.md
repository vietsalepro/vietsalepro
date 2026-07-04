## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_9_2_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [ ] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 9.2: `invite-member`

- [ ] 1.1 Rate limiting: 10 request/phút/IP.
- [ ] 1.2 Kiểm tra caller là admin của tenant (qua `tenant_memberships` role = 'admin').
- [ ] 1.3 Kiểm tra giới hạn số user trong `tenant_subscriptions`.
- [ ] 1.4 Nếu email đã tồn tại trong `auth.users`:
- [ ] 1.5 Kiểm tra user chưa thuộc tenant (tránh duplicate membership).
- [ ] 1.6 Thêm `tenant_memberships` với role được giao.
- [ ] 1.7 Nếu email chưa tồn tại:
- [ ] 1.8 Tạo user mới bằng `supabase.auth.admin.createUser({ email, password: crypto.randomUUID(), email_confirm: false })`.
- [ ] 1.9 Gửi password reset link qua `supabase.auth.admin.generateLink('recovery', email, { redirect_to: https://{subdomain}.vietsalepro.com/set-password })` để user tự đặt mật khẩu.
- [ ] 1.10 Thêm `tenant_memberships` với role được giao.
- [ ] 1.11 Ghi audit log.
- [ ] 1.12 Trả về `{ success: true, userId }`.
- [ ] 1.13 Create `supabase/functions/invite-member/index.ts`

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [ ] Invite member qua email.
- [ ] User đã tồn tại được thêm membership.
- [ ] Vượt giới hạn số user bị từ chối.

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_9_2_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.