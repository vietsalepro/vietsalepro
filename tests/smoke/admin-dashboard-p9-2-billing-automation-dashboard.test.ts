import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMockData, setCurrentUserId, setSystemAdmin } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  getBillingAutomationStatus,
  getBillingJobLogs,
} from '../../services/billingAutomationService';
import { createInvoice } from '../../services/invoiceService';
import { createTenantWithAdmin } from '../../services/tenantService';

// ponytail: smoke test P9.2 — kiểm tra dashboard trạng thái billing + job log qua service mock.

describe('smoke: admin dashboard P9.2 billing automation dashboard', () => {
  beforeEach(() => {
    resetMockData();
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
  });

  it('trả về trạng thái automation với tenant sắp hết hạn', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Expire', subdomain: 'shop-expire', plan: 'vip' });
    const { getMockRows } = await import('../mocks/supabase');
    const subs = getMockRows('tenant_subscriptions') as any[];
    const sub = subs.find(s => s.tenant_id === tenant.id);
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    if (sub) sub.expires_at = expiresAt;

    const status = await getBillingAutomationStatus();
    expect(status.expiringSoonCount).toBe(1);
    expect(status.expiringSoon[0].daysRemaining).toBeGreaterThanOrEqual(2);
  });

  it('trả về hóa đơn quá hạn và tenant dunning', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Overdue', subdomain: 'shop-overdue', plan: 'vip' });
    const invoice = await createInvoice({
      tenantId: tenant.id,
      cycleType: 'monthly',
      quantity: 1,
      bonusMonths: 0,
    });
    const { getMockRows } = await import('../mocks/supabase');
    const invoices = getMockRows('invoices') as any[];
    const row = invoices.find(i => i.id === invoice.id);
    if (row) row.status = 'uncollectible';

    const subs = getMockRows('tenant_subscriptions') as any[];
    const sub = subs.find(s => s.tenant_id === tenant.id);
    if (sub) sub.billing_status = 'overdue';

    const status = await getBillingAutomationStatus();
    expect(status.overdueInvoiceCount).toBe(1);
    expect(status.overdueInvoices[0].status).toBe('uncollectible');
    expect(status.dunningTenantCount).toBeGreaterThanOrEqual(1);
  });

  it('trả về job log đã ghi nhận', async () => {
    const { addMockRow } = await import('../mocks/supabase');
    addMockRow('billing_job_logs', {
      job_name: 'expire_overdue_invoices',
      status: 'success',
      run_at: new Date().toISOString(),
      duration_ms: 120,
      records_affected: 2,
      message: 'Test job',
    });

    const logs = await getBillingJobLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].jobName).toBe('expire_overdue_invoices');
    expect(logs[0].recordsAffected).toBe(2);
  });

  it('từ chối nếu không phải system admin', async () => {
    setSystemAdmin(false);
    await expect(getBillingAutomationStatus()).rejects.toThrow();
    await expect(getBillingJobLogs()).rejects.toThrow();
  });
});
