## Why

P13.3 — Storage usage per tenant + backup status card (PITR/Supabase CLI).

## What Changes

- Implement P13 3 Storage Backup per KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.
- See design.md for technical decisions and tasks.md for implementation steps.

## Scope / Non-Goals

**In scope:**
- P13 3 Storage Backup

**Out of scope:**
- Other admin dashboard phases not listed here.

## Capabilities

### New Capabilities
- `p13-3-storage-backup`: P13.3 — Storage usage per tenant + backup status card (PITR/Supabase CLI).

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see design.md.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.
