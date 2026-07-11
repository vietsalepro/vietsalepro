## ADDED Requirements

### Requirement: Custom fetch wrapper + service layer inject

The system MUST complete the implementation for: mọi request tự động gắn `x-tenant-id`; mọi `insert/update` trong `services/supabaseService.ts` gắn `tenant_id`..

#### Scenario: Acceptance criteria 1
- **GIVEN** the system is in the required state
- **WHEN** Tạo sản phẩm mới có `tenant_id` đúng.
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 2
- **GIVEN** the system is in the required state
- **WHEN** Gọi API từ subdomain khác không thấy dữ liệu.
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 3
- **GIVEN** the system is in the required state
- **WHEN** Mapper không chấp nhận `tenant_id` từ input object.
- **THEN** the expected outcome is achieved

## MODIFIED Requirements

- None outside this sub-phase.

## REMOVED Requirements

- None outside this sub-phase.
