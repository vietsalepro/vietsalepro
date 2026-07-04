## Plan Coverage

- [ ] Sub-phase 13.1: Unit tests — tenant/auth/RLS is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] Tạo tenant, user, membership
- [ ] Truy vấn cross-tenant trả về 0 row
- [ ] Insert với tenant_id sai bị từ chối

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria