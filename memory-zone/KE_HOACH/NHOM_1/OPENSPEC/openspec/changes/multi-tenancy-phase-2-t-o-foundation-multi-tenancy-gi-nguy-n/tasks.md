## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_2_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [ ] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 2: Tạo foundation multi-tenancy (giữ nguyên)

- [ ] 1.1 Run SQL migration block(s) for this sub-phase
- [ ] 1.2 `types/tenant.ts`: `Tenant`, `TenantMembership`, `TenantRole`, `TenantSubscription`
- [ ] 1.3 `services/tenantService.ts`: `getTenantBySubdomain`, `getMembership`, `inviteMember`, `updateMemberRole`, `removeMember`

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [ ] Tạo tenant, thêm member, phân role
- [ ] User A không thấy tenant của user B
- [ ] Admin có thể mời member

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_2_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.