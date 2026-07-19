## Why

All code changes are complete. This phase runs the final end-to-end verification to confirm that the ImportGoods bugfix plan is fully resolved: lint, build, routing, data consistency, error messages, and reports all work as expected.

## What Changes

- Run `npm run lint` and `npm run build`.
- Start the dev server or production build and execute the end-to-end test script:
  - Create a new supplier from the import form.
  - Create a receipt with two products, one with a lot and one without.
  - Apply line discount and shipping cost.
  - Save draft, reopen, complete.
  - Verify inventory, cost, and supplier debt.
  - View receipt detail, then delete it.
  - Verify inventory, cost, and supplier debt reverted.
- Verify routing: `/import`, `/import/create`, back, F5.
- Verify reports: `get_inventory_report` and `get_profit_report` / `get_sales_report` values.
- Create the final backup.
- Update `AGENTS.md` with the results of each sub-phase.

## Scope / Non-Goals

**In scope:**
- Single sub-phase 7 as defined in `docs/plans/import-goods-bugfix/PLAN_REFINED.md`.
- Final verification, documentation, and backup.

**Out of scope:**
- Any new feature or bugfix not already in the previous phases.

## Capabilities

### New Capabilities
- `phase-7-verification`: Full end-to-end verification of the ImportGoods bugfix plan.

### Modified Capabilities
- None. This phase is purely verification and documentation.

## Impact

- Affected files: `AGENTS.md` (update with results), project backup.
- Dead code: none.
- Verification: lint, build, end-to-end test, report checks.

## Rollback

No rollback needed for this verification phase. If issues are found, file them as blockers for the corresponding earlier phase. Expanded in `rollback.md`.
