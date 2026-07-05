## Plan Coverage

- [x] Sub-phase 5.2: RLS policies — core tables is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [x] Only files and tables listed in this sub-phase are touched.
- [x] `tenant_id` is injected by the service layer, not from user input.
- [x] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [x] User ở tenant A chỉ thấy dữ liệu tenant A
- [x] Truy vấn tenant B trả về 0 row
- [x] Insert với tenant_id khác bị từ chối

## Verification Steps

- [x] Run `npm run lint` after code changes
- [x] Run `npm run build` if code is touched
- [x] Manual test acceptance criteria