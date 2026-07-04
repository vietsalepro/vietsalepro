## ADDED Requirements

### Requirement: Dọn dẹp bảo mật hiện tại (giữ nguyên)

The system MUST complete the implementation for: xóa policy public, tắt self-registration, đóng social providers..

#### Scenario: Acceptance criteria 1
- **GIVEN** the system is in the required state
- **WHEN** User đã đăng nhập vẫn thấy dữ liệu
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 2
- **GIVEN** the system is in the required state
- **WHEN** User chưa đăng nhập bị chặn
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 3
- **GIVEN** the system is in the required state
- **WHEN** `supabase.auth.signUp` bị từ chối
- **THEN** the expected outcome is achieved

## MODIFIED Requirements

- None outside this sub-phase.

## REMOVED Requirements

- None outside this sub-phase.
