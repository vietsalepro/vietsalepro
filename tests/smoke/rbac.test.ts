import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../../hooks/usePermissions';
import { useTenant } from '../../hooks/useTenant';
import { TenantRole } from '../../types/tenant';

vi.mock('../../hooks/useTenant', () => ({
  useTenant: vi.fn(),
}));

// ponytail: smoke test kiểm tra ma trận permission theo role.
// Không test UI, chỉ test hook để đảm bảo rule RBAC đúng.

describe('smoke: RBAC', () => {
  const mockedUseTenant = vi.mocked(useTenant);

  beforeEach(() => {
    mockedUseTenant.mockReturnValue({
      tenant: null,
      membership: null,
      role: null,
      isLoading: false,
      isReadOnly: false,
      isImpersonating: false,
      impersonatedBy: null,
    });
  });

  const renderForRole = (role: TenantRole) => {
    mockedUseTenant.mockReturnValue({
      tenant: null,
      membership: null,
      role,
      isLoading: false,
      isReadOnly: false,
      isImpersonating: false,
      impersonatedBy: null,
    });
    return renderHook(() => usePermissions()).result.current;
  };

  it('cashier không được xóa đơn, nhưng được tạo đơn', () => {
    const perms = renderForRole('cashier');
    expect(perms.canCreateOrder).toBe(true);
    expect(perms.canUpdateOrder).toBe(false);
    expect(perms.canDeleteOrder).toBe(false);
  });

  it('admin có toàn quyền đơn hàng', () => {
    const perms = renderForRole('admin');
    expect(perms.canCreateOrder).toBe(true);
    expect(perms.canUpdateOrder).toBe(true);
    expect(perms.canDeleteOrder).toBe(true);
    expect(perms.canManageUsers).toBe(true);
    expect(perms.canViewAuditLogs).toBe(true);
  });

  it('accountant không được tạo/xóa đơn, chỉ xem báo cáo', () => {
    const perms = renderForRole('accountant');
    expect(perms.canCreateOrder).toBe(false);
    expect(perms.canUpdateOrder).toBe(false);
    expect(perms.canDeleteOrder).toBe(false);
    expect(perms.canViewReports).toBe(true);
    expect(perms.canManageInventory).toBe(false);
  });

  it('inventory_manager không được xóa đơn, được quản lý tồn kho', () => {
    const perms = renderForRole('inventory_manager');
    expect(perms.canCreateOrder).toBe(false);
    expect(perms.canDeleteOrder).toBe(false);
    expect(perms.canManageInventory).toBe(true);
    expect(perms.canCreateProduct).toBe(true);
  });

  it('không có role thì không có quyền gì', () => {
    const perms = renderHook(() => usePermissions()).result.current;
    expect(perms.canDeleteOrder).toBe(false);
    expect(perms.canCreateOrder).toBe(false);
    expect(perms.canViewReports).toBe(false);
    expect(perms.canManageInventory).toBe(false);
  });
});
