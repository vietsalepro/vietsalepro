## Why

`current_tenant_id()` từ header, `lib/tenant.ts`, `lib/supabase.ts` inject header.

## What Changes

- SQL migrations (see design.md for full scripts)
- See implementation tasks for detailed changes.

## Scope / Non-Goals

**In scope:**
- Sub-phase 5.1: Helper functions + custom fetch wrapper
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `helper-functions-custom-fetch-wrapper`: `current_tenant_id()` từ header, `lib/tenant.ts`, `lib/supabase.ts` inject header.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.