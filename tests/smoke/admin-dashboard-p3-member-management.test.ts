import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resetMockData,
  setCurrentUserId,
  setSystemAdmin,
  addMockRow,
  getMockRows,
} from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  createTenantWithAdmin,
  getTenantMembersWithEmail,
  inviteMemberByEmail,
  updateMemberRole,
  removeMember,
  resetMemberPassword,
  searchTenantMembers,
  bulkInviteMembers,
  toggleMemberActive,
  resendMemberInvite,
} from '../../services/tenantService';

// ponytail: smoke test P3 member management. Dùng mock in-memory để xác minh
// invite/change role/remove/reset và giới hạn user của gói.

describe('smoke: admin dashboard P3 member management', () => {
  beforeEach(() => {
    resetMockData();
  });

  const seedTenant = async () => {
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
    return createTenantWithAdmin({
      name: 'P3 Store',
      subdomain: 'p3-store',
      plan: 'free',
    });
  };

  it('get_tenant_members_with_email trả về thành viên kèm email', async () => {
    const tenant = await seedTenant();
    const members = await getTenantMembersWithEmail(tenant.id);
    expect(members.length).toBe(1);
    expect(members[0].email).toContain('user-');
    expect(members[0].role).toBe('admin');
  });

  it('invite_member_by_email thêm user vào tenant', async () => {
    const tenant = await seedTenant();
    // ponytail: tăng max_users để có thể mời thêm trong mock.
    const sub = getMockRows('tenant_subscriptions').find(s => s.tenant_id === tenant.id);
    if (sub) sub.max_users = 5;

    const res = await inviteMemberByEmail(tenant.id, 'cashier@example.com', 'cashier');
    expect(res.success).toBe(true);

    const list = await searchTenantMembers({ tenantId: tenant.id });
    expect(list.totalCount).toBe(2);
    expect(list.members.some(m => m.role === 'cashier')).toBe(true);
  });

  it('không mời quá giới hạn user của gói', async () => {
    const tenant = await seedTenant();
    // Free gói mặc định 1 user; owner đã chiếm 1 slot.
    await expect(inviteMemberByEmail(tenant.id, 'extra@example.com', 'cashier')).rejects.toThrow('giới hạn');

    const list = await searchTenantMembers({ tenantId: tenant.id });
    expect(list.totalCount).toBe(1);
  });

  it('update_member_role đổi vai trò', async () => {
    const tenant = await seedTenant();
    const owner = getMockRows('tenant_memberships').find(m => m.tenant_id === tenant.id)!;
    const updated = await updateMemberRole(tenant.id, owner.user_id, 'inventory_manager');
    expect(updated.role).toBe('inventory_manager');
  });

  it('remove_member xóa thành viên', async () => {
    const tenant = await seedTenant();
    // ponytail: tăng max_users để mời được cashier trong mock (free mặc định 1).
    const sub = getMockRows('tenant_subscriptions').find(s => s.tenant_id === tenant.id);
    if (sub) sub.max_users = 5;

    await inviteMemberByEmail(tenant.id, 'cashier@example.com', 'cashier');
    const cashier = getMockRows('tenant_memberships').find(m => m.tenant_id === tenant.id && m.role === 'cashier');
    expect(cashier).toBeTruthy();
    if (!cashier) throw new Error('Không tìm thấy cashier');
    await removeMember(tenant.id, cashier.user_id);

    const list = await searchTenantMembers({ tenantId: tenant.id });
    expect(list.totalCount).toBe(1);
  });

  it('remove_member từ chối xóa chủ sở hữu', async () => {
    const tenant = await seedTenant();
    const owner = getMockRows('tenant_memberships').find(m => m.tenant_id === tenant.id)!;
    await expect(removeMember(tenant.id, owner.user_id)).rejects.toThrow('chủ sở hữu');
  });

  it('reset_member_password trả về link redirect', async () => {
    const tenant = await seedTenant();
    const owner = getMockRows('tenant_memberships').find(m => m.tenant_id === tenant.id)!;
    const res = await resetMemberPassword(tenant.id, owner.user_id);
    expect(res.success).toBe(true);
    expect(res.redirectTo).toContain('reset-password');
  });

  it('non-system admin bị từ chối xem danh sách thành viên', async () => {
    const tenant = await seedTenant();
    setSystemAdmin(false);
    await expect(getTenantMembersWithEmail(tenant.id)).rejects.toThrow();
  });

  it('search_tenant_members trả về phân trang và total_count', async () => {
    const tenant = await seedTenant();
    const sub = getMockRows('tenant_subscriptions').find(s => s.tenant_id === tenant.id);
    if (sub) sub.max_users = 5;

    await inviteMemberByEmail(tenant.id, 'a@example.com', 'cashier');
    await inviteMemberByEmail(tenant.id, 'b@example.com', 'inventory_manager');

    const res = await searchTenantMembers({ tenantId: tenant.id, page: 1, pageSize: 2 });
    expect(res.totalCount).toBe(3);
    expect(res.members.length).toBe(2);
  });

  it('bulk_invite_members mời nhiều email và loại trùng', async () => {
    const tenant = await seedTenant();
    const sub = getMockRows('tenant_subscriptions').find(s => s.tenant_id === tenant.id);
    if (sub) sub.max_users = 10;

    const res = await bulkInviteMembers(tenant.id, ['a@example.com', ' b@example.com ', 'A@EXAMPLE.COM'], 'cashier');
    expect(res.succeeded).toBe(2);
    expect(res.failed).toBe(0);
    expect(res.alreadyMember).toBe(0);

    const list = await searchTenantMembers({ tenantId: tenant.id });
    expect(list.totalCount).toBe(3);
  });

  it('bulk_invite_members vượt quota trả về summary lỗi', async () => {
    const tenant = await seedTenant();
    // owner chiếm 1 slot, chỉ còn 1 slot nữa.
    const sub = getMockRows('tenant_subscriptions').find(s => s.tenant_id === tenant.id);
    if (sub) sub.max_users = 2;

    const res = await bulkInviteMembers(tenant.id, ['a@example.com', 'b@example.com', 'c@example.com'], 'cashier', 1);
    expect(res.succeeded).toBe(1);
    expect(res.failed).toBe(2);
    expect(res.errors.length).toBeGreaterThan(0);
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
