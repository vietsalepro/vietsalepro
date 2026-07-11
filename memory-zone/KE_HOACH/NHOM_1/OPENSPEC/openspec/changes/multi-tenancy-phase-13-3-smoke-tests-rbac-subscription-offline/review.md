## Plan Coverage

- [ ] Sub-phase 13.3: Smoke tests — RBAC/subscription/offline is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] Cashier không xóa đơn
- [ ] Free tenant đạt giới hạn user/sản phẩm/đơn hàng
- [ ] Offline queue cách ly theo tenant

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria