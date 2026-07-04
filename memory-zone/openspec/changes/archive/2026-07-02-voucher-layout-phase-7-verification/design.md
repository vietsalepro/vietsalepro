## Context

PLAN_02 Phase 7 is the verification phase. It runs after all code changes are complete. The purpose is to confirm that the VoucherFormLayout SSOT refactor did not introduce regressions in static checks, business flows, responsive design, or edge-case visuals.

## Goals / Non-Goals

**Goals:**
- Confirm `npm run lint` and `npm run build` pass with zero errors.
- Verify the 5 required manual business flows.
- Verify responsive behavior on desktop, tablet, and mobile.
- Verify edge cases: sidebar actions sticky, wizard UI, empty main content, banner without search, and date input visual.
- Produce a final verification report.

**Non-Goals:**
- Changing any code.
- Fixing bugs discovered during verification (those should be handled by re-opening the relevant phase).
- Performance testing or load testing.

## Decisions

| Decision | Rationale | Alternative considered |
|----------|-----------|------------------------|
| Run static checks first | If lint or build fails, manual tests are not meaningful | Run manual tests first; rejected because static failures are easier to detect |
| Execute all 5 flows before responsive tests | Business flow correctness is the primary acceptance criterion | Run responsive tests first; rejected because functional correctness is more important |
| Document results in a verification note | Keeps a record next to PLAN_01 and PLAN_02 | Rely on task checkboxes only; rejected because a summary note is easier to share |

## Risks / Trade-offs

- **[High]** Manual tests may discover functional regressions in the most complex screen (ImportGoods). Mitigation: if a regression is found, restore the relevant phase backup and fix the issue before returning to Phase 7.
- **[Medium]** Responsive testing requires browser dev tools or real devices. Mitigation: test at least one screen at each breakpoint.
- **[Low]** Edge cases may be missed. Mitigation: follow the checklist from Phase 7c exactly.

## Migration / Rollback

- Migration: Not applicable (no code changes).
- Rollback: If a regression is found, identify the affected phase and restore files from that phase's backup. After fixing, return to Phase 7.

## Open Questions

- Which environment (local dev server, staging, or production build) will be used for manual tests? (PLAN_02 assumes a local dev server after `npm run build`.)
- Are there any known data prerequisites for the 5 manual flows? (PLAN_02 assumes valid supplier, product, lot, and receipt data exist.)
