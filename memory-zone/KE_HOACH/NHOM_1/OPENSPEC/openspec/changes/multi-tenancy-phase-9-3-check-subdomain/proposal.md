## Why

Kiểm tra subdomain có sẵn.

## What Changes

- Output files:
  - `supabase/functions/check-subdomain/index.ts`
  - Rate limiting 10 request/phút/IP.

## Scope / Non-Goals

**In scope:**
- Sub-phase 9.3: `check-subdomain`
- All database, code, and verification steps listed in this change.

**Out of scope:**
- Other sub-phases of the multi-tenancy migration.

## Capabilities

### New Capabilities
- `check-subdomain`: Kiểm tra subdomain có sẵn.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see What Changes.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.