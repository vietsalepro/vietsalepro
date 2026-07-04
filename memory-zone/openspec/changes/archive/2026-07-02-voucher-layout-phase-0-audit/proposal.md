# Proposal: Phase 0 — Audit & Baseline for VoucherFormLayout SSOT

## Why

Before modifying any layout code, we need an accurate inventory of all layout components, CSS files, feature flags, and dead code related to the four voucher screens. This prevents accidental deletion of live code and ensures every phase of PLAN_02 has a verifiable starting point.

## What Changes

- Run grep/audit commands across `components/`, `pages/`, `features.ts`, and `index.css`.
- Produce a `BASELINE_AUDIT.md` checklist in `docs/plans/voucher-form-layout-ssot/`.
- Create a full project backup before any refactor begins.
- Confirm `npm run lint` and `npm run build` pass at baseline.
- Verify shared components (`SectionBox`, `TextInput`, `SelectInput`, `ActionButton`, `SummaryRow`, `ModalInfoGrid`, `StatusBadge`) exist and expose the required APIs.

## Scope / Non-Goals

**In scope:**
- Inventory of layout files, feature flags, dead code, and legacy CSS classes.
- Creation of baseline audit document and backup.
- Verification of current build state.

**Out of scope:**
- Any code changes (no deletions, no prop changes, no CSS edits).
- Business logic, `types.ts`, or database work.

## Capabilities

### New Capabilities
- `voucher-form-audit`: The project has a documented baseline audit for the VoucherFormLayout SSOT refactor.

### Modified Capabilities
- None (this phase is documentation-only).

## Impact

- `docs/plans/voucher-form-layout-ssot/BASELINE_AUDIT.md` (new)
- `openspec/specs/voucher-form-layout/spec.md` (already exists as baseline)
- No code changes.

## Rollback

No rollback needed — this phase does not modify code. The backup created in task 0.1 can be used as the starting point for Phase 1.
