import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMockData, setCurrentUserId, setSystemAdmin } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import { createInvoice, sendBillingEmail } from '../../services/invoiceService';
import { createTenantWithAdmin } from '../../services/tenantService';

// ponytail: smoke test P7.5 — chỉ kiểm được lớp gửi email (Edge Function) qua service;
// cron hết hạn/gia hạn là SQL, xác minh trên Supabase thật khi deploy migration.

describe('smoke: admin dashboard P7.5 expiry cron + renewal + Resend email', () => {
  beforeEach(() => {
    resetMockData();
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
  });

  it('gửi email nhắc thanh toán cho hóa đơn với người nhận chỉ định', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop A', subdomain: 'shop-a' });
    const invoice = await createInvoice({ tenantId: tenant.id, cycleType: 'monthly', quantity: 1, bonusMonths: 0 });

    const res = await sendBillingEmail({ invoiceId: invoice.id, type: 'reminder', to: 'owner@example.com' });
    expect(res.to).toBe('owner@example.com');
    expect(res.id).toBeTruthy();
  });

  it('gửi email xác nhận thành công', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop B', subdomain: 'shop-b' });
    const invoice = await createInvoice({ tenantId: tenant.id, cycleType: 'monthly', quantity: 1, bonusMonths: 0 });

    const res = await sendBillingEmail({ invoiceId: invoice.id, type: 'confirmation', to: 'owner@example.com' });
    expect(res.to).toBe('owner@example.com');
  });

  it('báo lỗi khi không tìm được email người nhận', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop C', subdomain: 'shop-c', ownerId: null as any });
    const invoice = await createInvoice({ tenantId: tenant.id, cycleType: 'monthly', quantity: 1, bonusMonths: 0 });

    await expect(sendBillingEmail({ invoiceId: invoice.id, type: 'reminder' }))
      .rejects.toThrow(/người nhận/);
  });

  it('báo lỗi khi hóa đơn không tồn tại', async () => {
    await expect(sendBillingEmail({ invoiceId: '00000000-0000-0000-0000-000000000000', type: 'reminder', to: 'x@y.com' }))
      .rejects.toThrow(/hóa đơn/i);
  });
});
