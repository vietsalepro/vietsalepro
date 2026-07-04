## ADDED Requirements

### Requirement: DB policies theo role

The system MUST complete the implementation for: 4 role, policies theo role..

#### Scenario: Acceptance criteria 1
- **GIVEN** the system is in the required state
- **WHEN** Cashier tạo đơn thành công; cashier sửa/xóa đơn bị từ chối.
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 2
- **GIVEN** the system is in the required state
- **WHEN** Accountant tạo/sửa đơn bị từ chối; accountant xem báo cáo thành công.
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 3
- **GIVEN** the system is in the required state
- **WHEN** Inventory_manager tạo nhập hàng thành công; inventory_manager sửa/xóa đơn nhập bị từ chối; inventory_manager tạo đơn bị từ chối.
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 4
- **GIVEN** the system is in the required state
- **WHEN** Admin thực hiện tất cả thao tác.
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 5
- **GIVEN** the system is in the required state
- **WHEN** Chỉ admin được sửa/xóa products/orders/import_receipts.
- **THEN** the expected outcome is achieved

## MODIFIED Requirements

- None outside this sub-phase.

## REMOVED Requirements

- None outside this sub-phase.
