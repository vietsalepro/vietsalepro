## Why

P17.1 — 2FA Google Authenticator (TOTP) with backup codes + manual override.

## What Changes

- Implement P17 1 2fa Totp per KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md.
- See design.md for technical decisions and tasks.md for implementation steps.

## Scope / Non-Goals

**In scope:**
- P17 1 2fa Totp

**Out of scope:**
- Other admin dashboard phases not listed here.

## Capabilities

### New Capabilities
- `p17-1-2fa-totp`: P17.1 — 2FA Google Authenticator (TOTP) with backup codes + manual override.

### Modified Capabilities
- None outside this sub-phase.

## Impact

- Affected files: see design.md.
- Verification: see Acceptance Criteria in tasks.md.

## Rollback

Restore affected files and database changes from the pre-phase backup. Detailed steps in rollback.md.
