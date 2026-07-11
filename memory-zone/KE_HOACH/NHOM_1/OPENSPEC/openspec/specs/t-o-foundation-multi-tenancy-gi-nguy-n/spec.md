# Capability: Tạo foundation multi-tenancy

## Purpose

Cung cấp các bảng, helper functions và RLS policies cơ bản để hỗ trợ multi-tenancy trong toàn bộ hệ thống.

## Requirements

### Requirement: Tạo foundation multi-tenancy (giữ nguyên)

The system MUST complete the implementation for: có `tenants`, `tenant_memberships`, `tenant_subscriptions`, `system_admins`.

#### Scenario: Acceptance criteria 1
- **GIVEN** the system is in the required state
- **WHEN** Tạo tenant, thêm member, phân role
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 2
- **GIVEN** the system is in the required state
- **WHEN** User A không thấy tenant của user B
- **THEN** the expected outcome is achieved

#### Scenario: Acceptance criteria 3
- **GIVEN** the system is in the required state
- **WHEN** Admin có thể mời member
- **THEN** the expected outcome is achieved
