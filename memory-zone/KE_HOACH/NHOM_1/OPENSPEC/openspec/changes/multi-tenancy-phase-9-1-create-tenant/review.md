## Plan Coverage

- [ ] Sub-phase 9.1: `create-tenant` is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] System admin tạo tenant qua Edge Function.
- [ ] Subdomain không hợp lệ bị từ chối.
- [ ] Tenant mới có subscription row.

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria