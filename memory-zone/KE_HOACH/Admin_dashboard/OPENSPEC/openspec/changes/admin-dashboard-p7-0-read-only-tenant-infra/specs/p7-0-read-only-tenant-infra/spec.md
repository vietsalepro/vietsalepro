## ADDED Requirements

### Requirement: p7-0-read-only-tenant-infra
The system MUST implement p7.0 — read-only tenant infrastructure: status check, rls guards, tenant_read_only error..

#### Scenario: p7-0-read-only-tenant-infra happy path
- **GIVEN** the system admin is authenticated and the prerequisite phases are complete
- **WHEN** the system admin performs the P7 0 Read Only Tenant Infra actions
- **THEN** the system applies the changes correctly and returns the expected data

## MODIFIED Requirements

<!-- Only if existing capabilities are changing. -->

## REMOVED Requirements

<!-- Only if deprecating features. -->
