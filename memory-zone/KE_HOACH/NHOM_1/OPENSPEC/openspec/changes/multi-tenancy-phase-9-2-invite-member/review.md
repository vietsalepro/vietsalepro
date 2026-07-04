## Plan Coverage

- [ ] Sub-phase 9.2: `invite-member` is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] Invite member qua email.
- [ ] User đã tồn tại được thêm membership.
- [ ] Vượt giới hạn số user bị từ chối.

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria