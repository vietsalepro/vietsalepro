# Delta for Voucher Form Layout

## ADDED Requirements

### Requirement: Baseline audit document exists

The system SHALL have a baseline audit document at `docs/plans/voucher-form-layout-ssot/BASELINE_AUDIT.md` that lists all dead code, feature flags, legacy CSS classes, and affected files before the layout refactor begins.

#### Scenario: Audit document is complete
- **GIVEN** the VoucherFormLayout SSOT refactor is about to start
- **WHEN** a developer opens `BASELINE_AUDIT.md`
- **THEN** the document lists all files to delete, all files to modify, all feature flags to remove, and all legacy CSS classes to audit
- **AND** the document confirms the current `npm run lint` and `npm run build` status

## MODIFIED Requirements

- None

## REMOVED Requirements

- None
