## Why

Test cơ chế tenant, auth, membership, RLS cơ bản.

## What Changes

- Output files:
  - `tests/tenant.test.ts`
  - `tests/rls.test.ts`

## Scope / Non-Goals

**In scope:**
- Sub-phase 13.1: Unit tests — tenant/auth/RLS
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `unit-tests-tenant-auth-rls`: Test cơ chế tenant, auth, membership, RLS cơ bản.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.