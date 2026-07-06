## Why

P15.2 — Webhooks: tenant_webhooks + deliveries + retry idempotent (YAGNI).

## What Changes

- Implement P15 2 Webhooks per KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.
- See design.md for technical decisions and tasks.md for implementation steps.

## Scope / Non-Goals

**In scope:**
- P15 2 Webhooks

**Out of scope:**
- Other admin dashboard phases not listed here.

## Capabilities

### New Capabilities
- `p15-2-webhooks`: P15.2 — Webhooks: tenant_webhooks + deliveries + retry idempotent (YAGNI).

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see design.md.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.
