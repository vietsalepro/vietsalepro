## Why

Ghi audit log và thiết lập rate limiting.

## What Changes

- Output files:
  - `supabase/functions/audit-log/index.ts`
  - Bảng `rate_limit_logs`
- SQL migrations (see design.md for full scripts)

## Scope / Non-Goals

**In scope:**
- Sub-phase 9.6: `audit-log-writer` + rate limiting
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `audit-log-writer-rate-limiting`: Ghi audit log và thiết lập rate limiting.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.