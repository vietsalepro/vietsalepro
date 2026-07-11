import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetMockData, setCurrentUserId, setSystemAdmin } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import { createInvoice, calculateInvoicePrice } from '../../services/invoiceService';
import { createTenantWithAdmin } from '../../services/tenantService';
import { updateTenantSubscription } from '../../services/tenantService';

// ponytail: smoke test P7.2 invoice creation + pricing + auto numbering.

const today = () => new Date().toISOString().slice(0, 10);

const addMonths = (dateStr: string, months: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

describe('smoke: admin dashboard P7.2 invoice create + pricing', () => {
  beforeEach(() => {
    resetMockData();
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
  });

  it('tạo hóa đơn tháng với giá 69k/tháng', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop A', subdomain: 'shop-a', plan: 'vip' });
    const invoice = await createInvoice({ tenantId: tenant.id, cycleType: 'monthly', quantity: 1, bonusMonths: 0 });

    expect(invoice.total).toBe(69000);
    expect(invoice.status).toBe('open');
    expect(invoice.invoiceNo).toMatch(/^INV-\d{4}-0001$/);
    expect(invoice.periodStart).toBe(today());
    expect(invoice.periodEnd).toBe(addMonths(today(), 1));
  });

  it('tạo hóa đơn năm với giá 59k/tháng', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop B', subdomain: 'shop-b', plan: 'vip' });
    const invoice = await createInvoice({ tenantId: tenant.id, cycleType: 'yearly', quantity: 1, bonusMonths: 0 });

    expect(invoice.total).toBe(59000 * 12); // 708.000
    expect(invoice.periodEnd).toBe(addMonths(today(), 12));
  });

  it('trả trước nhiều tháng tính đúng tổng tiền', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop C', subdomain: 'shop-c', plan: 'vip' });
    const invoice = await createInvoice({ tenantId: tenant.id, cycleType: 'monthly', quantity: 3, bonusMonths: 0 });

    expect(invoice.total).toBe(69000 * 3); // 207.000
    expect(invoice.periodEnd).toBe(addMonths(today(), 3));
  });

  it('cộng dồn tháng tặng vào hạn sử dụng', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop D', subdomain: 'shop-d', plan: 'vip' });
    const invoice = await createInvoice({ tenantId: tenant.id, cycleType: 'monthly', quantity: 1, bonusMonths: 2 });

    expect(invoice.periodEnd).toBe(addMonths(today(), 3));
  });

  it('số hóa đơn tự động tăng không trùng', async () => {
    const tenant1 = await createTenantWithAdmin({ name: 'Shop E', subdomain: 'shop-e', plan: 'vip' });
    const tenant2 = await createTenantWithAdmin({ name: 'Shop F', subdomain: 'shop-f', plan: 'vip' });
    const invoice1 = await createInvoice({ tenantId: tenant1.id, cycleType: 'monthly', quantity: 1, bonusMonths: 0 });
    const invoice2 = await createInvoice({ tenantId: tenant2.id, cycleType: 'monthly', quantity: 1, bonusMonths: 0 });

    expect(invoice1.invoiceNo).not.toBe(invoice2.invoiceNo);
    expect(invoice2.invoiceNo).toMatch(/^INV-\d{4}-0002$/);
  });

  it('cộng dồn expires_at khi còn hạn', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop G', subdomain: 'shop-g', plan: 'vip' });
    const future = '2100-01-15';
    await updateTenantSubscription(tenant.id, { expiresAt: future });

    const invoice = await createInvoice({ tenantId: tenant.id, cycleType: 'monthly', quantity: 1, bonusMonths: 1 });

    expect(invoice.periodStart).toBe(future);
    expect(invoice.periodEnd).toBe(addMonths(future, 2));
  });

  it('chỉ system admin mới được tạo hóa đơn', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop H', subdomain: 'shop-h', plan: 'vip' });
    setSystemAdmin(false);
    await expect(createInvoice({ tenantId: tenant.id, cycleType: 'monthly', quantity: 1, bonusMonths: 0 })).rejects.toThrow();
  });

  it('calculateInvoicePrice tính đúng và xếp chồng từ expires_at', () => {
    const price = calculateInvoicePrice({ cycleType: 'yearly', quantity: 1, bonusMonths: 1 }, '2100-06-01');
    expect(price.paidMonths).toBe(12);
    expect(price.unitPrice).toBe(59000);
    expect(price.total).toBe(59000 * 12);
    expect(price.periodStart).toBe('2100-06-01');
    expect(price.periodEnd).toBe('2101-07-01');
  });
});
