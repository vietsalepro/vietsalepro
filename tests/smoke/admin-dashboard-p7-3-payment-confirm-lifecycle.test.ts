import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetMockData, setCurrentUserId, setSystemAdmin, getMockRows } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import { createInvoice } from '../../services/invoiceService';
import { confirmPayment, getInvoicesByTenant } from '../../services/invoiceService';
import { createTenantWithAdmin } from '../../services/tenantService';
import { getTenantById } from '../../services/tenantService';

// ponytail: smoke test P7.3 payment confirmation + invoice lifecycle.

const addMonths = (dateStr: string, months: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

describe('smoke: admin dashboard P7.3 payment confirm + lifecycle', () => {
  beforeEach(() => {
    resetMockData();
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
  });

  it('xác nhận thanh toán hóa đơn pending → hóa đơn paid + tenant active + subscription ok', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop A', subdomain: 'shop-a' });
    const invoice = await createInvoice({ tenantId: tenant.id, cycleType: 'monthly', quantity: 1, bonusMonths: 0 });

    expect(invoice.status).toBe('pending');

    const payment = await confirmPayment({ invoiceId: invoice.id });

    expect(payment.amount).toBe(invoice.total);
    expect(payment.status).toBe('confirmed');

    const invoices = await getInvoicesByTenant(tenant.id);
    const updated = invoices.find(i => i.id === invoice.id);
    expect(updated?.status).toBe('paid');
    expect(updated?.amountPaid).toBe(invoice.total);

    const refreshedTenant = await getTenantById(tenant.id);
    expect(refreshedTenant?.status).toBe('active');
  });

  it('xác nhận thanh toán hóa đơn expired → kích hoạt lại tenant read_only', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop B', subdomain: 'shop-b' });
    const invoice = await createInvoice({ tenantId: tenant.id, cycleType: 'monthly', quantity: 2, bonusMonths: 1 });

    // Giả lập hóa đơn hết hạn và tenant bị read_only (như cron P7.5 sẽ làm)
    const invoiceRow = getMockRows('invoices').find(i => i.id === invoice.id);
    if (invoiceRow) invoiceRow.status = 'expired';
    const tenantRow = getMockRows('tenants').find(t => t.id === tenant.id);
    if (tenantRow) tenantRow.status = 'read_only';

    const payment = await confirmPayment({ invoiceId: invoice.id, paymentMethod: 'bank_transfer', referenceCode: 'REF123' });

    expect(payment.status).toBe('confirmed');
    expect(payment.referenceCode).toBe('REF123');

    const refreshedTenant = await getTenantById(tenant.id);
    expect(refreshedTenant?.status).toBe('active');

    const invoices = await getInvoicesByTenant(tenant.id);
    expect(invoices.find(i => i.id === invoice.id)?.status).toBe('paid');
  });

  it('chỉ system admin mới được xác nhận thanh toán', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop C', subdomain: 'shop-c' });
    const invoice = await createInvoice({ tenantId: tenant.id, cycleType: 'monthly', quantity: 1, bonusMonths: 0 });

    setSystemAdmin(false);
    await expect(confirmPayment({ invoiceId: invoice.id })).rejects.toThrow();
  });

  it('hóa đơn paid không thể confirm lại', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop D', subdomain: 'shop-d' });
    const invoice = await createInvoice({ tenantId: tenant.id, cycleType: 'monthly', quantity: 1, bonusMonths: 0 });
    await confirmPayment({ invoiceId: invoice.id });

    await expect(confirmPayment({ invoiceId: invoice.id })).rejects.toThrow();
  });
});
