## ADDED Requirements

### Requirement: Integration tests — tenant isolation

The system MUST complete the implementation for: test cách ly dữ liệu giữa các tenant..

#### Scenario: Acceptance criteria 1
- **GIVEN** the system is in the required state
- **WHEN** Tenant A tạo products/orders
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 2
- **GIVEN** the system is in the required state
- **WHEN** Tenant B không thấy products/orders của tenant A
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 3
- **GIVEN** the system is in the required state
- **WHEN** Subdomain đổi → tenant đổi
- **THEN** the expected outcome is achieved

## MODIFIED Requirements

- None outside this sub-phase.

## REMOVED Requirements

- None outside this sub-phase.
