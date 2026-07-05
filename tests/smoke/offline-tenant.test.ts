import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resetMockData,
  setCurrentUserId,
  setCurrentTenantId,
  getCurrentTenantId,
} from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const mod = await import('../mocks/supabase');
  return {
    supabase: mod.mockSupabase,
    getCurrentTenantId: mod.getCurrentTenantId,
    setCurrentTenantId: mod.setCurrentTenantId,
    requireTenantId: mod.requireTenantId,
  };
});

import { createTenantWithAdmin } from '../../services/tenantService';
import { supabaseService } from '../../services/supabaseService';
import { offlineQueue, CheckoutOp } from '../../utils/offlineManager';
import { Order } from '../../types';

// ponytail: smoke test offline queue cách ly theo tenant.
// syncOfflineQueue chỉ đẩy op của tenant hiện tại, giữ lại op của tenant khác.

const makeCheckoutOp = (tenantId: string, orderCode: string): CheckoutOp => ({
  type: 'checkout',
  tenantId,
  opId: `op-${orderCode}`,
  order: {
    id: orderCode,
    orderCode,
    customerName: 'Khách offline',
    totalAmount: 100000,
    date: new Date().toISOString(),
    status: 'completed',
    items: [],
  } as unknown as Order,
  productDeltas: [],
  rewardDeltas: [],
  pointHistory: [],
  timestamp: Date.now(),
});

describe('smoke: offline tenant isolation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetMockData();
    offlineQueue.clear();
  });

  const seedTwoTenants = async () => {
    setCurrentUserId('owner-offline');
    const tenantA = await createTenantWithAdmin({
      name: 'Tenant A',
      subdomain: 'offline-a',
      plan: 'free',
    });
    const tenantB = await createTenantWithAdmin({
      name: 'Tenant B',
      subdomain: 'offline-b',
      plan: 'free',
    });
    return { tenantA, tenantB };
  };

  it('offline queue chỉ đồng bộ op của tenant hiện tại', async () => {
    const { tenantA, tenantB } = await seedTwoTenants();
    const opA = makeCheckoutOp(tenantA.id, 'OFFLINE-A-001');
    const opB = makeCheckoutOp(tenantB.id, 'OFFLINE-B-001');

    offlineQueue.add(opA);
    offlineQueue.add(opB);
    expect(offlineQueue.count()).toBe(2);

    setCurrentTenantId(tenantA.id);
    expect(getCurrentTenantId()).toBe(tenantA.id);

    const pushCheckoutSpy = vi.spyOn(supabaseService, 'pushCheckout').mockResolvedValue(undefined);
    const result = await supabaseService.syncOfflineQueue();

    expect(result.synced).toBe(1);
    // ponytail: failed ở đây là số op còn trong queue (gồm cả op của tenant khác bị giữ lại),
    // không phải số lỗi. Điều này chứng minh queue cách ly theo tenant.
    expect(result.failed).toBe(1);
    expect(pushCheckoutSpy).toHaveBeenCalledTimes(1);
    expect(pushCheckoutSpy).toHaveBeenCalledWith(expect.objectContaining({ tenantId: tenantA.id, opId: opA.opId }));

    const remaining = offlineQueue.getAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].tenantId).toBe(tenantB.id);
  });

  it('đổi sang tenant B sẽ đồng bộ op còn lại', async () => {
    const { tenantA, tenantB } = await seedTwoTenants();
    const opA = makeCheckoutOp(tenantA.id, 'OFFLINE-A-002');
    const opB = makeCheckoutOp(tenantB.id, 'OFFLINE-B-002');

    offlineQueue.add(opA);
    offlineQueue.add(opB);

    // Lần 1: sync tenant A
    setCurrentTenantId(tenantA.id);
    const pushCheckoutSpy = vi.spyOn(supabaseService, 'pushCheckout').mockResolvedValue(undefined);
    await supabaseService.syncOfflineQueue();
    expect(offlineQueue.getAll()).toHaveLength(1);
    pushCheckoutSpy.mockClear();

    // Lần 2: sync tenant B
    setCurrentTenantId(tenantB.id);
    const result = await supabaseService.syncOfflineQueue();

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
    expect(pushCheckoutSpy).toHaveBeenCalledTimes(1);
    expect(pushCheckoutSpy).toHaveBeenCalledWith(expect.objectContaining({ tenantId: tenantB.id, opId: opB.opId }));
    expect(offlineQueue.count()).toBe(0);
  });

  it('op không có tenantId bị giữ lại, không làm ảnh hưởng tenant hiện tại', async () => {
    const { tenantA } = await seedTwoTenants();
    const opA = makeCheckoutOp(tenantA.id, 'OFFLINE-A-003');
    const opLegacy = {
      ...makeCheckoutOp(tenantA.id, 'OFFLINE-LEGACY-003'),
      tenantId: undefined,
    } as unknown as CheckoutOp;

    offlineQueue.add(opA);
    offlineQueue.add(opLegacy);

    setCurrentTenantId(tenantA.id);
    vi.spyOn(supabaseService, 'pushCheckout').mockResolvedValue(undefined);
    const result = await supabaseService.syncOfflineQueue();

    // Op không có tenantId bị bỏ qua (lọc currentTenantId !== undefined).
    expect(result.synced).toBe(1);
    const remaining = offlineQueue.getAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].opId).toBe(opLegacy.opId);
  });
});
