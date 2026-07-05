# app-tsx-global-data-loading Specification

## Purpose
TBD - created by archiving change multi-tenancy-phase-6-3-app-tsx-global-data-loading. Update Purpose after archive.
## Requirements
### Requirement: App.tsx + global data loading

The system MUST complete the implementation for: bọc `TenantProvider` trong `App.tsx`, load data theo tenant..

#### Scenario: Acceptance criteria 1
- **GIVEN** the system is in the required state
- **WHEN** Chuyển subdomain thấy dữ liệu khác.
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 2
- **GIVEN** the system is in the required state
- **WHEN** Đăng nhập vào tenant A, sau đó mở subdomain B → không thấy dữ liệu A.
- **THEN** the expected outcome is achieved

