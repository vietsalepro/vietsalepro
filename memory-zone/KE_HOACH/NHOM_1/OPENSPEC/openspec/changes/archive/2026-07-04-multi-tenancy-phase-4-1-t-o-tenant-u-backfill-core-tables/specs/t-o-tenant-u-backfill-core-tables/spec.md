## ADDED Requirements

### Requirement: Tạo tenant đầu + backfill core tables

The system MUST complete the implementation for: dữ liệu cũ thuộc về tenant đầu tiên; xử lý core tables trước..

#### Scenario: Acceptance criteria 1
- **GIVEN** the system is in the required state
- **WHEN** `SELECT count(*) FROM products WHERE tenant_id IS NULL` = 0
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 2
- **GIVEN** the system is in the required state
- **WHEN** `tenant_memberships` có admin cho mỗi user hiện có
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 3
- **GIVEN** the system is in the required state
- **WHEN** `tenant_subscriptions` có row cho tenant đầu tiên với plan = 'vip'
- **THEN** the expected outcome is achieved

## MODIFIED Requirements

- None outside this sub-phase.

## REMOVED Requirements

- None outside this sub-phase.
