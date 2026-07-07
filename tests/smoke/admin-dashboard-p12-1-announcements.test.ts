import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMockData, setCurrentUserId, setSystemAdmin, setCurrentTenantId } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import { createTenantWithAdmin } from '../../services/tenantService';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getCurrentAnnouncementsForTenant,
} from '../../services/announcementService';

// ponytail: smoke test P12.1 — CRUD announcement + targeting + scheduling.

describe('smoke: admin dashboard P12.1 announcements', () => {
  beforeEach(() => {
    resetMockData();
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
  });

  it('tạo và lấy danh sách announcement', async () => {
    const a = await createAnnouncement({
      title: 'Bảo trì hệ thống',
      content: 'Hệ thống sẽ bảo trì vào 02:00 sáng mai.',
      status: 'active',
    });
    expect(a.title).toBe('Bảo trì hệ thống');
    expect(a.status).toBe('active');
    expect(a.targetType).toBe('all');

    const list = await getAnnouncements();
    expect(list.length).toBe(1);
    expect(list[0].title).toBe('Bảo trì hệ thống');
  });

  it('cập nhật và lưu trữ announcement', async () => {
    let a = await createAnnouncement({
      title: 'Thông báo 1',
      content: 'Nội dung 1',
      status: 'draft',
    });
    a = await updateAnnouncement(a.id, { title: 'Thông báo 1 (cập nhật)', status: 'active' });
    expect(a.title).toBe('Thông báo 1 (cập nhật)');
    expect(a.status).toBe('active');

    a = await updateAnnouncement(a.id, { status: 'archived' });
    expect(a.status).toBe('archived');
  });

  it('xóa announcement', async () => {
    const a = await createAnnouncement({
      title: 'Thông báo sẽ xóa',
      content: 'Nội dung',
      status: 'draft',
    });
    await deleteAnnouncement(a.id);
    const list = await getAnnouncements();
    expect(list.length).toBe(0);
  });

  it('tenant chỉ thấy active announcement đúng đối tượng', async () => {
    const tenantA = await createTenantWithAdmin({ name: 'Shop A', subdomain: 'shop-a' });
    const tenantB = await createTenantWithAdmin({ name: 'Shop B', subdomain: 'shop-b', plan: 'vip' });

    // All tenants
    await createAnnouncement({
      title: 'Toàn hệ thống',
      content: 'Tất cả tenant đều thấy',
      targetType: 'all',
      status: 'active',
    });

    // Only tenant A
    await createAnnouncement({
      title: 'Cho Shop A',
      content: 'Chỉ Shop A thấy',
      targetType: 'specific_tenants',
      targets: [tenantA.id],
      status: 'active',
    });

    // Only VIP plan
    await createAnnouncement({
      title: 'Cho gói VIP',
      content: 'Chỉ tenant VIP thấy',
      targetType: 'specific_plans',
      targets: ['vip'],
      status: 'active',
    });

    // Draft — không ai thấy
    await createAnnouncement({
      title: 'Bản nháp',
      content: 'Chưa publish',
      targetType: 'all',
      status: 'draft',
    });

    setSystemAdmin(false);
    setCurrentUserId('user-a');
    setCurrentTenantId(tenantA.id);
    const forA = await getCurrentAnnouncementsForTenant(tenantA.id);
    expect(forA.map(x => x.title).sort()).toEqual(['Cho Shop A', 'Toàn hệ thống']);

    setCurrentTenantId(tenantB.id);
    const forB = await getCurrentAnnouncementsForTenant(tenantB.id);
    expect(forB.map(x => x.title).sort()).toEqual(['Cho gói VIP', 'Toàn hệ thống']);
  });

  it('scheduled/expired announcement không hiển thị cho tenant', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Time', subdomain: 'shop-time' });

    const past = new Date();
    past.setDate(past.getDate() - 1);
    const future = new Date();
    future.setDate(future.getDate() + 1);

    await createAnnouncement({
      title: 'Sắp tới',
      content: 'Chưa đến lịch',
      targetType: 'all',
      status: 'active',
      scheduledAt: future.toISOString(),
    });

    await createAnnouncement({
      title: 'Đã hết hạn',
      content: 'Hết hạn rồi',
      targetType: 'all',
      status: 'active',
      expiresAt: past.toISOString(),
    });

    await createAnnouncement({
      title: 'Đang hiệu lực',
      content: 'Hiển thị ngay',
      targetType: 'all',
      status: 'active',
    });

    setSystemAdmin(false);
    setCurrentUserId('user-time');
    setCurrentTenantId(tenant.id);
    const list = await getCurrentAnnouncementsForTenant(tenant.id);
    expect(list.length).toBe(1);
    expect(list[0].title).toBe('Đang hiệu lực');
  });
});
