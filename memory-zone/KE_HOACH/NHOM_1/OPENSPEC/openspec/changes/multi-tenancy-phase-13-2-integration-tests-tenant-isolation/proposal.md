## Why

Test cách ly dữ liệu giữa các tenant.

## What Changes

- Output files:
  - `tests/integration/tenant-isolation.test.ts`

## Scope / Non-Goals

**In scope:**
- Sub-phase 13.2: Integration tests — tenant isolation
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `integration-tests-tenant-isolation`: Test cách ly dữ liệu giữa các tenant.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.