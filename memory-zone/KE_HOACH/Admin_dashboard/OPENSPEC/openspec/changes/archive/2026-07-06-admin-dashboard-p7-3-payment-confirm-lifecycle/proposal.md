## Why

P7.3 — Payment confirmation + invoice lifecycle (pending/paid/overdue/cancelled/expired).

## What Changes

- Implement P7 3 Payment Confirm Lifecycle per KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.
- See design.md for technical decisions and tasks.md for implementation steps.

## Scope / Non-Goals

**In scope:**
- P7 3 Payment Confirm Lifecycle

**Out of scope:**
- Other admin dashboard phases not listed here.

## Capabilities

### New Capabilities
- `p7-3-payment-confirm-lifecycle`: P7.3 — Payment confirmation + invoice lifecycle (pending/paid/overdue/cancelled/expired).

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see design.md.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.
