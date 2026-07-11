## Plan Coverage

- [ ] Sub-phase 7: Thiết kế giới hạn và gói dịch vụ (giữ nguyên) is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] Free tenant không thêm user thứ 2
- [ ] Free tenant không thêm sản phẩm thứ 51
- [ ] Free tenant tạo đơn thứ 301 bị từ chối

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria