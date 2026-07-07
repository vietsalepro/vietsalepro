## MODIFIED Requirements

### Requirement: p9-1-billing-reminders
The system MUST fix the P9.1 billing reminders bugs so that the feature works correctly from the Admin Dashboard.

#### Scenario: authenticated RPC access
- **GIVEN** the system admin is authenticated via the frontend Supabase client
- **WHEN** the admin calls `get_billing_reminder_config`, `set_billing_reminder_config`, `get_pending_billing_reminders`, or `send_billing_reminders`
- **THEN** the RPC executes successfully and returns the expected data

#### Scenario: invalid milestones rejected
- **GIVEN** the system admin attempts to save billing reminder config
- **WHEN** the milestones array is empty `[]`, null, or contains non-positive values
- **THEN** the system rejects the request with a clear error

#### Scenario: reminder mock reflects skipped count
- **GIVEN** the smoke test invokes `send_billing_reminders` with a simulated failure
- **WHEN** the mock encounters an error while logging a reminder
- **THEN** the returned `skipped` count is greater than zero

## ADDED Requirements

<!-- None. -->

## REMOVED Requirements

<!-- None. -->
