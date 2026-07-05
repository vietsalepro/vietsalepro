import { useTenant } from './useTenant';

export const usePermissions = () => {
  const { role } = useTenant();
  return {
    canCreateOrder: role === 'admin' || role === 'cashier',
    canUpdateOrder: role === 'admin',
    canDeleteOrder: role === 'admin',
    canCreateProduct: role === 'admin' || role === 'inventory_manager',
    canUpdateProduct: role === 'admin',
    canDeleteProduct: role === 'admin',
    canManageInventory: role === 'admin' || role === 'inventory_manager',
    canViewReports: role === 'admin' || role === 'accountant',
    canManageUsers: role === 'admin',
    canDeleteRecord: role === 'admin',
  };
};

export type Permissions = ReturnType<typeof usePermissions>;
