## Plan Coverage

- [ ] Sub-phase 13.2: Integration tests — tenant isolation is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] Tenant A tạo products/orders
- [ ] Tenant B không thấy products/orders của tenant A
- [ ] Subdomain đổi → tenant đổi

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria