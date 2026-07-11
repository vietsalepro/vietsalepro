## Why

Mọi request tự động gắn `x-tenant-id`; mọi `insert/update` trong `services/supabaseService.ts` gắn `tenant_id`.

## What Changes

- Code changes:
  - Hoàn thiện `lib/supabase.ts` (xem sub-phase 5.1).
  - Rà soát `services/supabaseService.ts`:

## Scope / Non-Goals

**In scope:**
- Sub-phase 6.2: Custom fetch wrapper + service layer inject
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `custom-fetch-wrapper-service-layer-inject`: Mọi request tự động gắn `x-tenant-id`; mọi `insert/update` trong `services/supabaseService.ts` gắn `tenant_id`.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.