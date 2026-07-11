## ADDED Requirements

### Requirement: Unit tests — tenant/auth/RLS

The system MUST complete the implementation for: test cơ chế tenant, auth, membership, RLS cơ bản..

#### Scenario: Acceptance criteria 1
- **GIVEN** the system is in the required state
- **WHEN** Tạo tenant, user, membership
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 2
- **GIVEN** the system is in the required state
- **WHEN** Truy vấn cross-tenant trả về 0 row
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 3
- **GIVEN** the system is in the required state
- **WHEN** Insert với tenant_id sai bị từ chối
- **THEN** the expected outcome is achieved

## MODIFIED Requirements

- None outside this sub-phase.

## REMOVED Requirements

- None outside this sub-phase.
