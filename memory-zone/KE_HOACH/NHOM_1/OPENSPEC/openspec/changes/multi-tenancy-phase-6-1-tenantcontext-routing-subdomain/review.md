## Plan Coverage

- [ ] Sub-phase 6.1: TenantContext + routing/subdomain is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] Subdomain không tồn tại → 404
- [ ] Tenant suspended → chặn đăng nhập
- [ ] User không thuộc tenant → không vào được

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria