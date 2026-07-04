## Plan Coverage

- [ ] Sub-phase 5.2: RLS policies — core tables is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] User ở tenant A chỉ thấy dữ liệu tenant A
- [ ] Truy vấn tenant B trả về 0 row
- [ ] Insert với tenant_id khác bị từ chối

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria