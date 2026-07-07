## Plan Coverage

- [x] Sub-phase from KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md is represented in tasks.

## File List

- [x] Files to modify listed in design.md.
- [x] No dead code introduced.

## Guardrails

- [x] Only intended RPCs/service functions are touched.
- [x] No secrets committed.

## Acceptance Criteria

- [x] P10.3 — Voucher management UI + expiry warnings + tenant voucher input.
- [x] `npm run lint` pass.
- [x] `npm run build` pass (if code changed).

## Verification Steps

- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Manual test the acceptance criteria.
- [x] Run `npx vitest run` (110 tests pass).
- [x] Run `openspec validate --all` (39/39 pass).
