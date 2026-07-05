## Plan Coverage

- [ ] Sub-phase 6.3: App.tsx + global data loading is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] Chuyển subdomain thấy dữ liệu khác.
- [ ] Đăng nhập vào tenant A, sau đó mở subdomain B → không thấy dữ liệu A.

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria