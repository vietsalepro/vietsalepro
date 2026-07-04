## 0. Pre-Flight

- [ ] 0.1 Create project backup to `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_7_<YYYYMMDD_HHMMSS>`
- [ ] 0.2 Confirm `npm run lint` passes (skip if no code changes)
- [ ] 0.3 Read the sub-phase section in `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## 1. Sub-phase 7: Thiết kế giới hạn và gói dịch vụ (giữ nguyên)

- [ ] 1.1 Run SQL migration block(s) for this sub-phase
- [ ] 1.2 `services/subscriptionService.ts`: `getSubscription`, `checkLimit`, `isNearLimit`
- [ ] 1.3 ponytail: các trigger `check_tenant_limits` và `increment_monthly_order_count` đọc count rồi so sánh. Với nhiều request đồng thời, có thể vượt giới hạn một vài đơn. Ở giai đoạn đầu (Free/VIP đơn giản) chấp nhận được; nếu sau này cần chính xác tuyệt đối, chuyển sang dùng advisory lock hoặc serializable transaction.
- [ ] 1.4 Đảm bảo mỗi tenant luôn có row trong `tenant_subscriptions` khi tạo (xem Phase 9.1).

## 2. Verification

- [ ] 2.1 Run `npm run lint`
- [ ] 2.2 Run `npm run build` if this sub-phase touches code
- [ ] 2.3 Manual test the acceptance criteria

## Acceptance Criteria

- [ ] Free tenant không thêm user thứ 2
- [ ] Free tenant không thêm sản phẩm thứ 51
- [ ] Free tenant tạo đơn thứ 301 bị từ chối

## Rollback Plan

- Backup: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_7_<YYYYMMDD_HHMMSS>`
- Rollback trigger: build/test fails, acceptance criteria fails, or data loss risk.