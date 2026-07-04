## Why

Test luồng nghiệp vụ đầu cuối.

## What Changes

- Output files:
  - `tests/smoke/rbac.test.ts`
  - `tests/smoke/subscription.test.ts`
  - `tests/smoke/offline-tenant.test.ts`

## Scope / Non-Goals

**In scope:**
- Sub-phase 13.3: Smoke tests — RBAC/subscription/offline
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `smoke-tests-rbac-subscription-offline`: Test luồng nghiệp vụ đầu cuối.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.