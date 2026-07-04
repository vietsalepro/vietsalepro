## ADDED Requirements

### Requirement: TenantContext + routing/subdomain

The system MUST complete the implementation for: subdomain → tenant, load tenant/membership, xử lý 404/suspended..

#### Scenario: Acceptance criteria 1
- **GIVEN** the system is in the required state
- **WHEN** Subdomain không tồn tại → 404
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 2
- **GIVEN** the system is in the required state
- **WHEN** Tenant suspended → chặn đăng nhập
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 3
- **GIVEN** the system is in the required state
- **WHEN** User không thuộc tenant → không vào được
- **THEN** the expected outcome is achieved

## MODIFIED Requirements

- None outside this sub-phase.

## REMOVED Requirements

- None outside this sub-phase.
