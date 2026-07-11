## Plan Coverage

- [ ] Sub-phase 11: Thêm audit log (giữ nguyên) is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] Mỗi thao tác quan trọng tạo 1 log row.
- [ ] Chỉ admin/system admin xem được log.
- [ ] DELETE log ghi đúng old_data, new_data = NULL.
- [ ] INSERT log ghi đúng new_data, old_data = NULL.

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria