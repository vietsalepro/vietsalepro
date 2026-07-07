import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMockData, setCurrentUserId, setSystemAdmin, setCurrentTenantId } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  createSupportTicket,
  getSupportTicketWithReplies,
  assignSupportTicket,
  updateSupportTicketStatus,
  createTicketReply,
  sendTicketUpdateEmail,
} from '../../services/ticketService';
import { createTenantWithAdmin } from '../../services/tenantService';

// ponytail: smoke test P11.2 — gán, trả lời, và gửi email cập nhật ticket qua mock edge function.

describe('smoke: admin dashboard P11.2 ticket inbox + email', () => {
  beforeEach(() => {
    resetMockData();
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
  });

  it('gán ticket và gửi email thông báo cập nhật', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Ticket Email', subdomain: 'shop-ticket-email' });
    setCurrentTenantId(tenant.id);

    const ticket = await createSupportTicket({
      tenantId: tenant.id,
      title: 'Cần hỗ trợ',
      category: 'support',
      createdBy: 'user-1',
    });

    const assigned = await assignSupportTicket(ticket.id, 'admin-1');
    expect(assigned.assignedTo).toBe('admin-1');

    const email = await sendTicketUpdateEmail({ ticketId: ticket.id, event: 'assigned' });
    expect(email.event).toBe('assigned');
    expect(email.to).toBeDefined();
  });

  it('trả lời ticket và gửi email thông báo phản hồi', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Reply Email', subdomain: 'shop-reply-email' });
    setCurrentTenantId(tenant.id);

    const ticket = await createSupportTicket({
      tenantId: tenant.id,
      title: 'Câu hỏi',
      createdBy: 'user-1',
    });

    const reply = await createTicketReply({
      ticketId: ticket.id,
      content: 'Cảm ơn bạn đã liên hệ. Chúng tôi đang xử lý.',
      createdBy: 'admin-1',
    });

    const result = await getSupportTicketWithReplies(ticket.id);
    expect(result?.replies.length).toBe(1);

    const email = await sendTicketUpdateEmail({ ticketId: ticket.id, event: 'reply', replyId: reply.id });
    
    expect(email.event).toBe('reply');
  });

  it('cập nhật trạng thái ticket và gửi email thông báo', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Status Email', subdomain: 'shop-status-email' });
    setCurrentTenantId(tenant.id);

    const ticket = await createSupportTicket({
      tenantId: tenant.id,
      title: 'Báo lỗi',
      category: 'bug',
      createdBy: 'user-1',
    });

    const updated = await updateSupportTicketStatus(ticket.id, 'in_progress');
    expect(updated.status).toBe('in_progress');

    const email = await sendTicketUpdateEmail({ ticketId: ticket.id, event: 'status' });
    expect(email.event).toBe('status');
  });

  it('gửi email thất bại nếu ticket không tồn tại', async () => {
    await expect(sendTicketUpdateEmail({ ticketId: '00000000-0000-0000-0000-000000000000', event: 'reply' }))
      .rejects.toThrow();
  });
});
