import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resetMockData,
  setCurrentUserId,
  setCurrentTenantId,
  mockSupabase,
} from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  createTenantWithAdmin,
  getTenantBySubdomain,
} from '../../services/tenantService';

describe('integration: tenant isolation', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('Tenant A tạo products/orders và chỉ thấy dữ liệu của mình', async () => {
    const ownerA = 'owner-a';
    setCurrentUserId(ownerA);

    const tenantA = await createTenantWithAdmin({
      name: 'Tenant A',
      subdomain: 'store-a',
      plan: 'free',
    });

    // Tạo sản phẩm trong tenant A
    const productA = {
      name: 'Sản phẩm A',
      code: 'P-A',
      tenant_id: tenantA.id,
      price: 100000,
      cost: 50000,
      quantity: 10,
    };
    const insertProduct = await mockSupabase.from('products').insert(productA).select().single();
    expect(insertProduct.error).toBeNull();
    expect(insertProduct.data).toMatchObject({ name: 'Sản phẩm A', tenant_id: tenantA.id });

    // Tạo đơn hàng trong tenant A
    const orderA = {
      code: 'ORD-A-001',
      tenant_id: tenantA.id,
      total: 100000,
      status: 'completed',
    };
    const insertOrder = await mockSupabase.from('orders').insert(orderA).select().single();
    expect(insertOrder.error).toBeNull();
    expect(insertOrder.data).toMatchObject({ code: 'ORD-A-001', tenant_id: tenantA.id });

    // Query trong tenant A: thấy cả product và order
    const productsA = await mockSupabase.from('products').select('*').eq('tenant_id', tenantA.id);
    expect(productsA.data).toHaveLength(1);
    expect(productsA.data?.[0].name).toBe('Sản phẩm A');

    const ordersA = await mockSupabase.from('orders').select('*').eq('tenant_id', tenantA.id);
    expect(ordersA.data).toHaveLength(1);
    expect(ordersA.data?.[0].code).toBe('ORD-A-001');
  });

  it('Tenant B không thấy products/orders của tenant A', async () => {
    const ownerA = 'owner-a';
    const ownerB = 'owner-b';

    // Tenant A
    setCurrentUserId(ownerA);
    const tenantA = await createTenantWithAdmin({
      name: 'Tenant A',
      subdomain: 'store-a',
      plan: 'free',
    });
    await mockSupabase.from('products').insert({
      name: 'Sản phẩm A',
      code: 'P-A',
      tenant_id: tenantA.id,
      price: 100000,
      cost: 50000,
      quantity: 10,
    });
    await mockSupabase.from('orders').insert({
      code: 'ORD-A-001',
      tenant_id: tenantA.id,
      total: 100000,
      status: 'completed',
    });

    // Tenant B
    setCurrentUserId(ownerB);
    const tenantB = await createTenantWithAdmin({
      name: 'Tenant B',
      subdomain: 'store-b',
      plan: 'free',
    });
    setCurrentTenantId(tenantB.id);

    // Tạo dữ liệu riêng cho tenant B
    await mockSupabase.from('products').insert({
      name: 'Sản phẩm B',
      code: 'P-B',
      tenant_id: tenantB.id,
      price: 200000,
      cost: 100000,
      quantity: 20,
    });
    await mockSupabase.from('orders').insert({
      code: 'ORD-B-001',
      tenant_id: tenantB.id,
      total: 200000,
      status: 'completed',
    });

    // Tenant B query toàn bộ products: không thấy product của A
    const allProductsB = await mockSupabase.from('products').select('*');
    expect(allProductsB.data).toHaveLength(1);
    expect(allProductsB.data?.[0].name).toBe('Sản phẩm B');

    // Tenant B query toàn bộ orders: không thấy order của A
    const allOrdersB = await mockSupabase.from('orders').select('*');
    expect(allOrdersB.data).toHaveLength(1);
    expect(allOrdersB.data?.[0].code).toBe('ORD-B-001');

    // Thử query cụ thể tenant A từ tenant B: trả về 0 row
    const crossProducts = await mockSupabase.from('products').select('*').eq('tenant_id', tenantA.id);
    expect(crossProducts.data).toHaveLength(0);

    const crossOrders = await mockSupabase.from('orders').select('*').eq('tenant_id', tenantA.id);
    expect(crossOrders.data).toHaveLength(0);
  });

  it('Subdomain đổi → tenant đổi', async () => {
    // ponytail: cùng một user sở hữu cả hai tenant để test mapping subdomain → tenant
    // trong môi trường mock (RLS tenants cho phép member/owner truy cập).
    const owner = 'owner-multi';
    setCurrentUserId(owner);

    const tenantA = await createTenantWithAdmin({
      name: 'Tenant A',
      subdomain: 'store-a',
      plan: 'free',
    });

    const tenantB = await createTenantWithAdmin({
      name: 'Tenant B',
      subdomain: 'store-b',
      plan: 'free',
    });

    // Subdomain store-a → tenant A
    const resolvedA = await getTenantBySubdomain('store-a');
    expect(resolvedA).not.toBeNull();
    expect(resolvedA?.id).toBe(tenantA.id);

    // Subdomain store-b → tenant B
    const resolvedB = await getTenantBySubdomain('store-b');
    expect(resolvedB).not.toBeNull();
    expect(resolvedB?.id).toBe(tenantB.id);

    // Dữ liệu gắn với đúng tenant theo subdomain
    setCurrentTenantId(tenantA.id);
    await mockSupabase.from('products').insert({
      name: 'Sản phẩm A',
      code: 'P-A',
      tenant_id: tenantA.id,
      price: 100000,
      cost: 50000,
      quantity: 10,
    });

    setCurrentTenantId(tenantB.id);
    await mockSupabase.from('products').insert({
      name: 'Sản phẩm B',
      code: 'P-B',
      tenant_id: tenantB.id,
      price: 200000,
      cost: 100000,
      quantity: 20,
    });

    // Chuyển subdomain về A: chỉ thấy sản phẩm A
    setCurrentTenantId(tenantA.id);
    const productsA = await mockSupabase.from('products').select('*');
    expect(productsA.data).toHaveLength(1);
    expect(productsA.data?.[0].name).toBe('Sản phẩm A');

    // Chuyển subdomain sang B: chỉ thấy sản phẩm B
    setCurrentTenantId(tenantB.id);
    const productsB = await mockSupabase.from('products').select('*');
    expect(productsB.data).toHaveLength(1);
    expect(productsB.data?.[0].name).toBe('Sản phẩm B');
  });
});
