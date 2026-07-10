import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resetMockData,
  setCurrentUserId,
  setSystemAdmin,
  getMockRows,
  addMockRow,
} from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  createTenantWithAdmin,
  searchTenantMembers,
  toggleMemberActive,
  resendMemberInvite,
  inviteMemberByEmail,
} from '../../services/tenantService';

// ponytail: enterprise smoke tests cho F33 — filter, sort, toggle, resend invite.

describe('smoke: member management enterprise', () => {
  beforeEach(() => {
    resetMockData();
  });

  const seedTenant = async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
    return createTenantWithAdmin({
      name: 'Enterprise Store',
      subdomain: 'enterprise-store',
      plan: 'vip',
    });
  };

  it('search_tenant_members lọc theo vai trò, trạng thái, kích hoạt và tìm kiếm', async () => {
    const tenant = await seedTenant();
    const sub = getMockRows('tenant_subscriptions').find(s => s.tenant_id === tenant.id);
    if (sub) sub.max_users = 10;

    await inviteMemberByEmail(tenant.id, 'cashier@example.com', 'cashier');
    await inviteMemberByEmail(tenant.id, 'inventory@example.com', 'inventory_manager');

    const memberships = getMockRows('tenant_memberships').filter(m => m.tenant_id === tenant.id);
    const cashier = memberships.find(m => m.role === 'cashier');
    if (cashier) {
      cashier.status = 'pending';
      cashier.is_active = false;
    }

    const byRole = await searchTenantMembers({ tenantId: tenant.id, role: 'cashier' });
    expect(byRole.totalCount).toBe(1);
    expect(byRole.members[0].role).toBe('cashier');

    const byStatus = await searchTenantMembers({ tenantId: tenant.id, status: 'pending' });
    expect(byStatus.totalCount).toBe(1);

    const byActive = await searchTenantMembers({ tenantId: tenant.id, isActive: false });
    expect(byActive.totalCount).toBe(1);

    const bySearch = await searchTenantMembers({ tenantId: tenant.id, search: 'cashier' });
    expect(bySearch.totalCount).toBe(1);
    expect(bySearch.members[0].email).toBe('cashier@example.com');
  });

  it('search_tenant_members sắp xếp theo email và ngày tạo', async () => {
    const tenant = await seedTenant();
    // ponytail: đảm bảo owner có email dễ dự đoán để test sắp xếp.
    addMockRow('users', { id: 'sys-admin', email: 'owner@example.com' });
    const sub = getMockRows('tenant_subscriptions').find(s => s.tenant_id === tenant.id);
    if (sub) sub.max_users = 10;

    await inviteMemberByEmail(tenant.id, 'alpha@example.com', 'cashier');
    await inviteMemberByEmail(tenant.id, 'beta@example.com', 'inventory_manager');
    // ponytail: đảm bảo beta mới hơn alpha để test sắp xếp created_at.
    const betaMembership = getMockRows('tenant_memberships').find(
      m => m.tenant_id === tenant.id && m.role === 'inventory_manager'
    );
    if (betaMembership) {
      betaMembership.created_at = new Date(Date.now() + 1000).toISOString();
    }

    const asc = await searchTenantMembers({ tenantId: tenant.id, sortBy: 'email', sortDir: 'asc' });
    expect(asc.members[0].email).toBe('alpha@example.com');
    expect(asc.members[asc.members.length - 1].email).toBe('owner@example.com');

    const desc = await searchTenantMembers({ tenantId: tenant.id, sortBy: 'email', sortDir: 'desc' });
    expect(desc.members[0].email).toBe('owner@example.com');
    expect(desc.members[desc.members.length - 1].email).toBe('alpha@example.com');

    const newestFirst = await searchTenantMembers({ tenantId: tenant.id, sortBy: 'created_at', sortDir: 'desc' });
    expect(newestFirst.members[0].email).toBe('beta@example.com');
  });

  it('toggle_member_active cập nhật trạng thái is_active', async () => {
    const tenant = await seedTenant();
    const owner = getMockRows('tenant_memberships').find(m => m.tenant_id === tenant.id)!;
    owner.is_active = false;

    const updated = await toggleMemberActive(tenant.id, owner.user_id, true);
    expect(updated.isActive).toBe(true);
    expect(getMockRows('tenant_memberships').find(m => m.id === owner.id)?.is_active).toBe(true);
  });

  it('resend_member_invite chỉ cho phép thành viên pending', async () => {
    const tenant = await seedTenant();
    const sub = getMockRows('tenant_subscriptions').find(s => s.tenant_id === tenant.id);
    if (sub) sub.max_users = 5;

    await inviteMemberByEmail(tenant.id, 'pending@example.com', 'cashier');
    const pending = getMockRows('tenant_memberships').find(m => m.tenant_id === tenant.id && m.role === 'cashier')!;
    pending.status = 'pending';

    await expect(resendMemberInvite(tenant.id, pending.user_id)).resolves.toEqual(expect.objectContaining({ success: true }));

    pending.status = 'active';
    await expect(resendMemberInvite(tenant.id, pending.user_id)).rejects.toThrow('pending');
  });
});
