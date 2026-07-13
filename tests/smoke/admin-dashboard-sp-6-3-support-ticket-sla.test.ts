import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMockData, setCurrentUserId, setSystemAdmin, setCurrentTenantId } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  createSupportTicket,
  getSupportTicketById,
  updateSupportTicket,
  createTicketReply,
  getTicketReplies,
  computeSlaTargetAt,
} from '../../services/admin/supportService';
import { createTenantWithAdmin } from '../../services/tenantService';

// SP-6.3 — kiểm tra SLA target và thread reply trên support service.

describe('smoke: admin dashboard SP-6.3 support ticket SLA', () => {
  beforeEach(() => {
    resetMockData();
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
  });

  it('tạo ticket với SLA target dựa trên priority', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop SLA', subdomain: 'shop-sla' });
    setCurrentTenantId(tenant.id);

    const before = Date.now();
    const ticket = await createSupportTicket({
      tenantId: tenant.id,
      title: 'Yêu cầu khẩn',
      category: 'support',
      priority: 'urgent',
      createdBy: 'user-1',
    });
    const after = Date.now();

    expect(ticket.priority).toBe('urgent');
    expect(ticket.slaTargetAt).toBeDefined();
    const target = new Date(ticket.slaTargetAt!).getTime();
    // urgent SLA = 2 hours
    expect(target - before).toBeGreaterThanOrEqual(2 * 60 * 60 * 1000 - 1000);
    expect(target - after).toBeLessThanOrEqual(2 * 60 * 60 * 1000 + 1000);
  });

  it('cập nhật priority làm mới SLA target', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop SLA Update', subdomain: 'shop-sla-update' });
    setCurrentTenantId(tenant.id);

    let ticket = await createSupportTicket({
      tenantId: tenant.id,
      title: 'Ticket cần đổi priority',
      category: 'support',
      priority: 'low',
      createdBy: 'user-1',
    });
    const firstTarget = ticket.slaTargetAt;

    ticket = await updateSupportTicket(ticket.id, { priority: 'high' });
    expect(ticket.priority).toBe('high');
    expect(ticket.slaTargetAt).not.toBe(firstTarget);
  });

  it('reply thread hiển thị trong chi tiết ticket', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Thread', subdomain: 'shop-thread' });
    setCurrentTenantId(tenant.id);

    const ticket = await createSupportTicket({
      tenantId: tenant.id,
      title: 'Câu hỏi cần trả lời',
      category: 'support',
      createdBy: 'user-1',
    });

    const reply = await createTicketReply({
      ticketId: ticket.id,
      content: 'Chúng tôi đang kiểm tra vấn đề này.',
      isInternalNote: false,
      createdBy: 'admin-1',
    });

    const replies = await getTicketReplies(ticket.id);
    expect(replies.length).toBe(1);
    expect(replies[0].id).toBe(reply.id);
    expect(replies[0].content).toBe('Chúng tôi đang kiểm tra vấn đề này.');
  });

  it('computeSlaTargetAt trả về đúng số giờ theo priority', () => {
    const urgent = computeSlaTargetAt('urgent');
    const high = computeSlaTargetAt('high');
    const medium = computeSlaTargetAt('medium');
    const low = computeSlaTargetAt('low');
    const none = computeSlaTargetAt(undefined);

    expect(none).toBeUndefined();
    expect(new Date(urgent!).getTime() - Date.now()).toBeCloseTo(2 * 60 * 60 * 1000, -2);
    expect(new Date(high!).getTime() - Date.now()).toBeCloseTo(8 * 60 * 60 * 1000, -2);
    expect(new Date(medium!).getTime() - Date.now()).toBeCloseTo(24 * 60 * 60 * 1000, -2);
    expect(new Date(low!).getTime() - Date.now()).toBeCloseTo(72 * 60 * 60 * 1000, -2);
  });
});
