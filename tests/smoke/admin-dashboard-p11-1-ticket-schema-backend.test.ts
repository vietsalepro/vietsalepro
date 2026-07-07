import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMockData, setCurrentUserId, setSystemAdmin, setCurrentTenantId } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  createSupportTicket,
  getSupportTickets,
  getSupportTicketById,
  updateSupportTicket,
  deleteSupportTicket,
  assignSupportTicket,
  updateSupportTicketStatus,
  createTicketReply,
  getTicketReplies,
  updateTicketReply,
  deleteTicketReply,
  createTicketReplyTemplate,
  getTicketReplyTemplates,
  getTicketReplyTemplateById,
  updateTicketReplyTemplate,
  deleteTicketReplyTemplate,
  getSupportTicketWithReplies,
} from '../../services/ticketService';
import { createTenantWithAdmin } from '../../services/tenantService';

// ponytail: smoke test P11.1 — kiểm tra CRUD ticket, reply, template qua service mock.

describe('smoke: admin dashboard P11.1 ticket schema backend', () => {
  beforeEach(() => {
    resetMockData();
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
  });

  it('tạo và lấy support ticket', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Ticket', subdomain: 'shop-ticket' });
    setCurrentTenantId(tenant.id);

    const ticket = await createSupportTicket({
      tenantId: tenant.id,
      title: 'Lỗi thanh toán',
      description: 'Không thể xác nhận thanh toán chuyển khoản',
      category: 'billing',
      priority: 'high',
      createdBy: 'user-1',
    });

    expect(ticket.title).toBe('Lỗi thanh toán');
    expect(ticket.category).toBe('billing');
    expect(ticket.status).toBe('open');
    expect(ticket.priority).toBe('high');

    const found = await getSupportTicketById(ticket.id);
    expect(found).not.toBeNull();
    expect(found?.title).toBe('Lỗi thanh toán');
  });

  it('lọc ticket theo tenant, status, category', async () => {
    const tenantA = await createTenantWithAdmin({ name: 'Shop A', subdomain: 'shop-a' });
    setCurrentTenantId(tenantA.id);
    await createSupportTicket({ tenantId: tenantA.id, title: 'Bug A', category: 'bug', createdBy: 'user-a' });
    await createSupportTicket({ tenantId: tenantA.id, title: 'Billing A', category: 'billing', createdBy: 'user-a' });

    const tenantB = await createTenantWithAdmin({ name: 'Shop B', subdomain: 'shop-b' });
    setCurrentTenantId(tenantB.id);
    await createSupportTicket({ tenantId: tenantB.id, title: 'Ticket B', category: 'support', createdBy: 'user-b' });

    setSystemAdmin(false);
    setCurrentUserId('user-a');
    setCurrentTenantId(tenantA.id);
    const ticketsA = await getSupportTickets();
    expect(ticketsA.length).toBe(2);

    const bugs = await getSupportTickets({ tenantId: tenantA.id, category: 'bug' });
    expect(bugs.length).toBe(1);
    expect(bugs[0].title).toBe('Bug A');
  });

  it('cập nhật, gán và đổi status ticket', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Assign', subdomain: 'shop-assign' });
    setCurrentTenantId(tenant.id);

    let ticket = await createSupportTicket({
      tenantId: tenant.id,
      title: 'Cần hỗ trợ',
      category: 'support',
      createdBy: 'user-1',
    });

    ticket = await assignSupportTicket(ticket.id, 'admin-1');
    expect(ticket.assignedTo).toBe('admin-1');

    ticket = await updateSupportTicketStatus(ticket.id, 'in_progress');
    expect(ticket.status).toBe('in_progress');

    ticket = await updateSupportTicketStatus(ticket.id, 'resolved');
    expect(ticket.status).toBe('resolved');
    expect(ticket.resolvedAt).toBeDefined();

    ticket = await updateSupportTicket(ticket.id, { title: 'Đã giải quyết', priority: 'low' });
    expect(ticket.title).toBe('Đã giải quyết');
    expect(ticket.priority).toBe('low');
  });

  it('xóa ticket', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Delete', subdomain: 'shop-delete' });
    setCurrentTenantId(tenant.id);

    const ticket = await createSupportTicket({
      tenantId: tenant.id,
      title: 'Ticket sẽ xóa',
      createdBy: 'user-1',
    });

    await deleteSupportTicket(ticket.id);
    const found = await getSupportTicketById(ticket.id);
    expect(found).toBeNull();
  });

  it('tạo và cập nhật reply cho ticket', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Reply', subdomain: 'shop-reply' });
    setCurrentTenantId(tenant.id);

    const ticket = await createSupportTicket({
      tenantId: tenant.id,
      title: 'Câu hỏi',
      createdBy: 'user-1',
    });

    let reply = await createTicketReply({
      ticketId: ticket.id,
      content: 'Cảm ơn bạn đã liên hệ.',
      createdBy: 'admin-1',
    });

    expect(reply.ticketId).toBe(ticket.id);
    expect(reply.content).toBe('Cảm ơn bạn đã liên hệ.');
    expect(reply.tenantId).toBe(tenant.id);

    const replies = await getTicketReplies(ticket.id);
    expect(replies.length).toBe(1);

    reply = await updateTicketReply(reply.id, { content: 'Cảm ơn bạn đã liên hệ. Chúng tôi đang xử lý.' });
    expect(reply.content).toBe('Cảm ơn bạn đã liên hệ. Chúng tôi đang xử lý.');

    await deleteTicketReply(reply.id);
    expect((await getTicketReplies(ticket.id)).length).toBe(0);
  });

  it('lấy ticket kèm danh sách reply và số lượng', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop With Replies', subdomain: 'shop-with-replies' });
    setCurrentTenantId(tenant.id);

    const ticket = await createSupportTicket({
      tenantId: tenant.id,
      title: 'Ticket nhiều reply',
      createdBy: 'user-1',
    });

    await createTicketReply({ ticketId: ticket.id, content: 'Reply 1', createdBy: 'admin-1' });
    await createTicketReply({ ticketId: ticket.id, content: 'Reply 2', createdBy: 'admin-1' });

    const result = await getSupportTicketWithReplies(ticket.id);
    expect(result).not.toBeNull();
    expect(result!.replies.length).toBe(2);
    expect(result!.ticket.replyCount).toBe(2);
  });

  it('CRUD ticket reply template chỉ cho system admin', async () => {
    setSystemAdmin(true);

    let template = await createTicketReplyTemplate({
      title: 'Mẫu chào hỏi',
      category: 'support',
      content: 'Chào bạn, cảm ơn bạn đã liên hệ.',
    });

    expect(template.title).toBe('Mẫu chào hỏi');
    expect(template.category).toBe('support');
    expect(template.isActive).toBe(true);

    const found = await getTicketReplyTemplateById(template.id);
    expect(found).not.toBeNull();

    const templates = await getTicketReplyTemplates({ category: 'support' });
    expect(templates.length).toBe(1);

    template = await updateTicketReplyTemplate(template.id, { title: 'Mẫu chào hỏi (cập nhật)', isActive: false });
    expect(template.title).toBe('Mẫu chào hỏi (cập nhật)');
    expect(template.isActive).toBe(false);

    await deleteTicketReplyTemplate(template.id);
    expect(await getTicketReplyTemplateById(template.id)).toBeNull();
  });

  it('từ chối template operations khi không phải system admin', async () => {
    setSystemAdmin(false);
    setCurrentUserId('user-1');

    await expect(
      createTicketReplyTemplate({
        title: 'Mẫu lỗi',
        content: 'Nội dung',
      })
    ).rejects.toThrow();
  });
});
