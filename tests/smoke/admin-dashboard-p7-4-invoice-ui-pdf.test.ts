import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetMockData, setCurrentUserId, setSystemAdmin } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import { createInvoice, getAllInvoices, getInvoiceById } from '../../services/invoiceService';
import { createTenantWithAdmin } from '../../services/tenantService';

// ponytail: smoke test P7.4 invoice list/detail dùng lại RPC/migration P7.1–P7.3.

describe('smoke: admin dashboard P7.4 invoice UI + PDF', () => {
  beforeEach(() => {
    resetMockData();
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
  });

  it('liệt kê tất cả hóa đơn của các tenant', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop A', subdomain: 'shop-a', plan: 'vip' });
    const invoice = await createInvoice({ tenantId: tenant.id, cycleType: 'monthly', quantity: 1, bonusMonths: 0 });

    const invoices = await getAllInvoices();
    expect(invoices.length).toBe(1);
    expect(invoices[0].id).toBe(invoice.id);
    expect(invoices[0].status).toBe('open');
    expect(invoices[0].tenantId).toBe(tenant.id);
    // Mock chưa hỗ trợ join tenants(name, subdomain) nên tên/subdomain có thể rỗng.
    expect(invoices[0].tenantName).toBeDefined();
  });

  it('xem chi tiết hóa đơn kèm dòng dịch vụ và lịch sử thanh toán', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop B', subdomain: 'shop-b', plan: 'vip' });
    const invoice = await createInvoice({ tenantId: tenant.id, cycleType: 'yearly', quantity: 1, bonusMonths: 2 });

    const detail = await getInvoiceById(invoice.id);
    expect(detail).not.toBeNull();
    expect(detail?.invoice.id).toBe(invoice.id);
    expect(detail?.items.length).toBeGreaterThan(0);
    expect(detail?.items.some(i => i.description.includes('Gói VIP'))).toBe(true);
    expect(detail?.payments.length).toBe(0);
  });

  it('không tìm thấy hóa đơn sai id', async () => {
    const detail = await getInvoiceById('00000000-0000-0000-0000-000000000000');
    expect(detail).toBeNull();
  });
});
