## ADDED Requirements

### Requirement: Thêm audit log (giữ nguyên)

The system MUST complete the implementation for: ghi log các thao tác quan trọng..

#### Scenario: Acceptance criteria 1
- **GIVEN** the system is in the required state
- **WHEN** Mỗi thao tác quan trọng tạo 1 log row.
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 2
- **GIVEN** the system is in the required state
- **WHEN** Chỉ admin/system admin xem được log.
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 3
- **GIVEN** the system is in the required state
- **WHEN** DELETE log ghi đúng old_data, new_data = NULL.
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 4
- **GIVEN** the system is in the required state
- **WHEN** INSERT log ghi đúng new_data, old_data = NULL.
- **THEN** the expected outcome is achieved

## MODIFIED Requirements

- None outside this sub-phase.

## REMOVED Requirements

- None outside this sub-phase.
