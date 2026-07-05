## ADDED Requirements

### Requirement: RLS policies — core tables

The system MUST complete the implementation for: rLS policies — core tables.

#### Scenario: Acceptance criteria 1
- **GIVEN** the system is in the required state
- **WHEN** User ở tenant A chỉ thấy dữ liệu tenant A
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 2
- **GIVEN** the system is in the required state
- **WHEN** Truy vấn tenant B trả về 0 row
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 3
- **GIVEN** the system is in the required state
- **WHEN** Insert với tenant_id khác bị từ chối
- **THEN** the expected outcome is achieved

## MODIFIED Requirements

- None outside this sub-phase.

## REMOVED Requirements

- None outside this sub-phase.
