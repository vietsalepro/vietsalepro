import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resetMockData,
  setCurrentUserId,
  setCurrentTenantId,
  setSystemAdmin,
  addMockRow,
  getMockRows,
  mockSupabase,
} from './mocks/supabase';

vi.mock('../lib/supabase', async () => {
  const { mockSupabase } = await import('./mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  createTenantWithAdmin,
  inviteMember,
  getMembership,
  getTenantMembers,
  getTenantById,
  getCurrentUserTenants,
  searchTenants,
  updateTenant,
  softDeleteTenant,
  restoreTenant,
} from '../services/tenantService';
import { restoreTenantBackup, previewBackupTables } from '../services/tenantRestoreService';
import { resetDemoData, migrateTenantData } from '../services/tenantMigrationService';

describe('tenant/auth/membership', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('tạo tenant, user owner và membership admin', async () => {
    const ownerId = 'owner-001';
    setCurrentUserId(ownerId);

    const tenant = await createTenantWithAdmin({
      name: 'Cửa hàng A',
      subdomain: 'store-a',
      plan: 'free',
    });

    expect(tenant).toBeTruthy();
    expect(tenant.name).toBe('Cửa hàng A');
    expect(tenant.subdomain).toBe('store-a');
    expect(tenant.ownerId).toBe(ownerId);

    const members = await getTenantMembers(tenant.id);
    expect(members).toHaveLength(1);
    expect(members[0].userId).toBe(ownerId);
    expect(members[0].role).toBe('admin');

    const membership = await getMembership(tenant.id, ownerId);
    expect(membership).not.toBeNull();
    expect(membership?.role).toBe('admin');
  });

  it('invite member tạo membership cho user trong tenant', async () => {
    const ownerId = 'owner-002';
    const cashierId = 'cashier-002';
    setCurrentUserId(ownerId);

    const tenant = await createTenantWithAdmin({
      name: 'Cửa hàng B',
      subdomain: 'store-b',
      plan: 'free',
    });

    const invited = await inviteMember(tenant.id, cashierId, 'cashier');
    expect(invited.tenantId).toBe(tenant.id);
    expect(invited.userId).toBe(cashierId);
    expect(invited.role).toBe('cashier');

    const members = await getTenantMembers(tenant.id);
    expect(members).toHaveLength(2);

    const found = await getMembership(tenant.id, cashierId);
    expect(found).not.toBeNull();
    expect(found?.role).toBe('cashier');
  });

  it('getCurrentUserTenants chỉ trả về tenant mà user là member', async () => {
    const ownerId = 'owner-003';
    setCurrentUserId(ownerId);

    const tenant = await createTenantWithAdmin({
      name: 'Cửa hàng C',
      subdomain: 'store-c',
      plan: 'free',
    });

    // Đổi user khác: không thấy tenant trên.
    setCurrentUserId('stranger-003');
    const empty = await getCurrentUserTenants();
    expect(empty).toHaveLength(0);

    // Quay lại owner: thấy tenant.
    setCurrentUserId(ownerId);
    const tenants = await getCurrentUserTenants();
    expect(tenants).toHaveLength(1);
    expect(tenants[0].id).toBe(tenant.id);
  });

  it('getTenantById trả về null khi user không thuộc tenant', async () => {
    const ownerId = 'owner-004';
    setCurrentUserId(ownerId);

    const tenant = await createTenantWithAdmin({
      name: 'Cửa hàng D',
      subdomain: 'store-d',
      plan: 'free',
    });

    setCurrentUserId('stranger-004');
    const found = await getTenantById(tenant.id);
    expect(found).toBeNull();

    setCurrentUserId(ownerId);
    const found2 = await getTenantById(tenant.id);
    expect(found2).not.toBeNull();
    expect(found2?.id).toBe(tenant.id);
  });
});

describe('system admin tenant management', () => {
  beforeEach(() => {
    resetMockData();
    setSystemAdmin(true);
  });

  it('searchTenants tìm kiếm, lọc theo gói và phân trang', async () => {
    setCurrentUserId('admin-001');
    await createTenantWithAdmin({ name: 'Cửa hàng Alpha', subdomain: 'alpha', plan: 'free' });
    await createTenantWithAdmin({ name: 'Cửa hàng Beta', subdomain: 'beta', plan: 'vip' });
    await createTenantWithAdmin({ name: 'Shop Gamma', subdomain: 'gamma', plan: 'free' });

    const res = await searchTenants({ searchTerm: 'Cửa hàng', pageSize: 2 });
    expect(res.tenants.length).toBe(2);
    expect(res.totalCount).toBe(2);
    expect(res.counts.free).toBe(1);
    expect(res.counts.vip).toBe(1);
    expect(res.counts.active).toBeGreaterThanOrEqual(2);

    const page2 = await searchTenants({ searchTerm: 'Cửa hàng', page: 2, pageSize: 1 });
    expect(page2.tenants.length).toBe(1);
    expect(page2.totalCount).toBe(2);

    const filtered = await searchTenants({ plan: 'free' });
    expect(filtered.tenants.every(t => t.plan === 'free')).toBe(true);
  });

  it('updateTenant cập nhật tên, gói và trạng thái', async () => {
    setCurrentUserId('admin-002');
    const tenant = await createTenantWithAdmin({ name: 'Cửa hàng D', subdomain: 'store-d', plan: 'free' });
    const updated = await updateTenant(tenant.id, { name: 'Cửa hàng D+', plan: 'vip', status: 'suspended' });
    expect(updated.name).toBe('Cửa hàng D+');
    expect(updated.plan).toBe('vip');
    expect(updated.status).toBe('suspended');
  });

  it('softDeleteTenant lưu trữ và restoreTenant khôi phục', async () => {
    setCurrentUserId('admin-003');
    const tenant = await createTenantWithAdmin({ name: 'Cửa hàng E', subdomain: 'store-e', plan: 'free' });
    const archived = await softDeleteTenant(tenant.id);
    expect(archived.status).toBe('archived');
    expect(archived.archivedAt).toBeTruthy();

    const restored = await restoreTenant(tenant.id);
    expect(restored.status).toBe('active');
    expect(restored.archivedAt).toBeFalsy();
  });
});

describe('tenant restore service', () => {
  beforeEach(() => {
    resetMockData();
    setSystemAdmin(true);
  });

  it('previewBackupTables liệt kê các bảng và số dòng', () => {
    const tables = { products: [{ id: 'p1' }, { id: 'p2' }], customers: [{ id: 'c1' }] };
    const preview = previewBackupTables({ tables });
    expect(preview).toHaveLength(2);
    expect(preview.find(t => t.name === 'products')?.rows).toBe(2);
    expect(preview.find(t => t.name === 'customers')?.rows).toBe(1);
  });

  it('restoreTenantBackup gửi file JSON và trả về kết quả restore', async () => {
    setCurrentUserId('admin-004');
    const tenant = await createTenantWithAdmin({ name: 'Cửa hàng F', subdomain: 'store-f', plan: 'free' });
    const backup = { tenant: { id: tenant.id, name: tenant.name }, tables: { products: [{ id: 'p1', tenant_id: tenant.id }] }, exportedAt: new Date().toISOString() };
    const file = new File([JSON.stringify(backup)], 'tenant-backup.json', { type: 'application/json' });

    const res = await restoreTenantBackup(tenant.id, file);
    expect(res.success).toBe(true);
    expect(res.result.total_rows).toBe(1);
    expect(res.result.restored).toContainEqual({ table: 'products', rows: 1 });
  });

  it('restoreTenantBackup từ chối file JSON thiếu tables', async () => {
    setCurrentUserId('admin-005');
    const file = new File(['{"tenant":{"id":"x"}}'], 'bad.json', { type: 'application/json' });
    await expect(restoreTenantBackup('x', file)).rejects.toThrow('thiếu phần tables');
  });
});

describe('tenant migration service', () => {
  beforeEach(() => {
    resetMockData();
    setSystemAdmin(true);
  });

  it('resetDemoData xóa dữ liệu business nhưng giữ tenant/subscription/membership', async () => {
    setCurrentUserId('admin-006');
    const tenant = await createTenantWithAdmin({ name: 'Cửa hàng Demo', subdomain: 'store-demo', plan: 'free' });
    addMockRow('products', { id: 'p-demo-1', tenant_id: tenant.id, name: 'SP mẫu', code: 'DEMO01', quantity: 10, cost: 1000, price: 1500, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    addMockRow('orders', { id: 'o-demo-1', tenant_id: tenant.id, code: 'ORDER01', total: 1500, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });

    const subBefore = getMockRows('tenant_subscriptions').find(s => s.tenant_id === tenant.id)!;
    subBefore.current_month_orders = 5;

    const res = await resetDemoData(tenant.id);
    expect(res.tenantId).toBe(tenant.id);
    expect(res.totalRows).toBeGreaterThan(0);
    expect(res.cleared.some(c => c.table === 'products')).toBe(true);
    expect(res.cleared.some(c => c.table === 'orders')).toBe(true);

    const productsAfter = getMockRows('products').filter((p: any) => p.tenant_id === tenant.id);
    const ordersAfter = getMockRows('orders').filter((o: any) => o.tenant_id === tenant.id);
    expect(productsAfter).toHaveLength(0);
    expect(ordersAfter).toHaveLength(0);

    const membershipsAfter = getMockRows('tenant_memberships').filter((m: any) => m.tenant_id === tenant.id);
    expect(membershipsAfter.length).toBeGreaterThan(0);

    const subAfter = getMockRows('tenant_subscriptions').find(s => s.tenant_id === tenant.id)!;
    expect(subAfter.current_month_orders).toBe(0);
  });

  it('migrateTenantData copy dữ liệu từ source sang target tenant', async () => {
    setCurrentUserId('admin-007');
    const source = await createTenantWithAdmin({ name: 'Source', subdomain: 'source', plan: 'free' });
    const target = await createTenantWithAdmin({ name: 'Target', subdomain: 'target', plan: 'free' });
    addMockRow('products', { id: 'p-mig-1', tenant_id: source.id, name: 'SP source', code: 'SRC01', quantity: 5, cost: 1000, price: 1500, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });

    const res = await migrateTenantData(source.id, target.id);
    expect(res.sourceTenantId).toBe(source.id);
    expect(res.targetTenantId).toBe(target.id);

    const targetProducts = getMockRows('products').filter((p: any) => p.tenant_id === target.id);
    expect(targetProducts.length).toBe(1);
    expect(targetProducts[0].name).toBe('SP source');
  });
});
