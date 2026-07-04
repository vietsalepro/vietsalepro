## ADDED Requirements

### Requirement: Backfill remaining tables + orphan cleanup + FK

The system MUST complete the implementation for: backfill remaining tables + orphan cleanup + FK.

#### Scenario: Acceptance criteria 1
- **GIVEN** the system is in the required state
- **WHEN** `SELECT count(*) FROM products WHERE tenant_id IS NULL` = 0
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 2
- **GIVEN** the system is in the required state
- **WHEN** Không còn record mồ côi trong tất cả bảng cha-con đã liệt kê
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 3
- **GIVEN** the system is in the required state
- **WHEN** Có FK trên 3 bảng con (order_items, return_order_items, import_items.lot_id)
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 4
- **GIVEN** the system is in the required state
- **WHEN** Tenant đầu tiên có subscription row với plan = 'vip'
- **THEN** the expected outcome is achieved

## MODIFIED Requirements

- None outside this sub-phase.

## REMOVED Requirements

- None outside this sub-phase.
