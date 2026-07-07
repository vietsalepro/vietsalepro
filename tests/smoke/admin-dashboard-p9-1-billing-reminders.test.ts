import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMockData, setCurrentUserId, setSystemAdmin } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  getBillingReminderConfig,
  setBillingReminderConfig,
  getPendingBillingReminders,
  sendBillingReminders,
} from '../../services/billingReminderService';
import { createInvoice } from '../../services/invoiceService';
import { createTenantWithAdmin } from '../../services/tenantService';

// ponytail: smoke test P9.1 — kiểm tra config + scheduler T-7/T-3/T-1 qua service mock.

describe('smoke: admin dashboard P9.1 billing reminders', () => {
  beforeEach(() => {
    resetMockData();
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
  });

  it('trả về config mặc định T-7/T-3/T-1', async () => {
    const config = await getBillingReminderConfig();
    expect(config.enabled).toBe(true);
    expect(config.milestones).toEqual([1, 3, 7]);
    expect(config.sendTime).toBe('09:00');
  });

  it('lưu config reminder', async () => {
    const config = await setBillingReminderConfig({
      enabled: true,
      milestones: [3, 1],
      sendTime: '08:00',
      functionUrl: 'https://example.com/functions/v1/send-billing-email',
      serviceRoleKey: 'test-key',
    });
    expect(config.milestones).toEqual([1, 3]);
    expect(config.sendTime).toBe('08:00');
  });

  it('từ chối nếu milestones không hợp lệ', async () => {
    await expect(setBillingReminderConfig({
      enabled: true,
      milestones: [-1],
      sendTime: '09:00',
      functionUrl: '',
      serviceRoleKey: '',
    })).rejects.toThrow();
  });

  it('liệt kê đúng reminder khi due_date trùng mốc T-7', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Reminder', subdomain: 'shop-reminder' });
    const today = new Date().toISOString().slice(0, 10);
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const invoice = await createInvoice({
      tenantId: tenant.id,
      cycleType: 'monthly',
      quantity: 1,
      bonusMonths: 0,
    });
    // Ghi đè due_date để test (mock tạo due_date = today + 2 ngày).
    const { getMockRows } = await import('../mocks/supabase');
    const invoices = getMockRows('invoices') as any[];
    const row = invoices.find(i => i.id === invoice.id);
    if (row) row.due_date = dueDate;

    await setBillingReminderConfig({
      enabled: true,
      milestones: [7],
      sendTime: '09:00',
      functionUrl: 'https://example.com/functions/v1/send-billing-email',
      serviceRoleKey: 'test-key',
    });

    const pending = await getPendingBillingReminders();
    expect(pending.length).toBe(1);
    expect(pending[0].milestone).toBe('T-7');
    expect(pending[0].invoiceId).toBe(invoice.id);
  });

  it('gửi reminder đúng lịch và ghi log', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Send', subdomain: 'shop-send' });
    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const invoice = await createInvoice({
      tenantId: tenant.id,
      cycleType: 'monthly',
      quantity: 1,
      bonusMonths: 0,
    });
    const { getMockRows } = await import('../mocks/supabase');
    const invoices = getMockRows('invoices') as any[];
    const row = invoices.find(i => i.id === invoice.id);
    if (row) row.due_date = dueDate;

    await setBillingReminderConfig({
      enabled: true,
      milestones: [3],
      sendTime: '09:00',
      functionUrl: 'https://example.com/functions/v1/send-billing-email',
      serviceRoleKey: 'test-key',
    });

    const res = await sendBillingReminders();
    expect(res.sent).toBe(1);
    expect(res.error).toBeFalsy();

    const logs = getMockRows('invoice_reminder_logs') as any[];
    expect(logs.length).toBe(1);
    expect(logs[0].milestone).toBe('T-3');
    expect(logs[0].invoice_id).toBe(invoice.id);
  });

  it('không gửi trùng reminder cho cùng mốc', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Dup', subdomain: 'shop-dup' });
    const dueDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const invoice = await createInvoice({
      tenantId: tenant.id,
      cycleType: 'monthly',
      quantity: 1,
      bonusMonths: 0,
    });
    const { getMockRows } = await import('../mocks/supabase');
    const invoices = getMockRows('invoices') as any[];
    const row = invoices.find(i => i.id === invoice.id);
    if (row) row.due_date = dueDate;

    await setBillingReminderConfig({
      enabled: true,
      milestones: [1],
      sendTime: '09:00',
      functionUrl: 'https://example.com/functions/v1/send-billing-email',
      serviceRoleKey: 'test-key',
    });

    await sendBillingReminders();
    const res = await sendBillingReminders();
    expect(res.sent).toBe(0);
  });

  it('bỏ qua nếu reminder bị tắt', async () => {
    await setBillingReminderConfig({
      enabled: false,
      milestones: [7, 3, 1],
      sendTime: '09:00',
      functionUrl: 'https://example.com/functions/v1/send-billing-email',
      serviceRoleKey: 'test-key',
    });

    const pending = await getPendingBillingReminders();
    expect(pending.length).toBe(0);

    const res = await sendBillingReminders();
    expect(res.error).toMatch(/disabled|tắt/i);
  });
});
