## Plan Coverage

- [ ] Sub-phase 4.1: Tạo tenant đầu + backfill core tables is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] `SELECT count(*) FROM products WHERE tenant_id IS NULL` = 0
- [ ] `tenant_memberships` có admin cho mỗi user hiện có
- [ ] `tenant_subscriptions` có row cho tenant đầu tiên với plan = 'vip'

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria