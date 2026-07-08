import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { resetMockData, setSystemAdmin } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  bulkUpdateTenants,
  createMaintenanceWindow,
  getMaintenanceWindows,
  deleteMaintenanceWindow,
} from '../../services/maintenanceService';
import BulkMaintenancePanel from '../../components/BulkMaintenancePanel';
import { createTenantWithAdmin } from '../../services/tenantService';

describe('smoke: admin dashboard P13.4 bulk operations + maintenance scheduler', () => {
  beforeEach(() => {
    resetMockData();
    setSystemAdmin(true);
  });

  it('bulkUpdateTenants updates status/plan for multiple tenants', async () => {
    const t1 = await createTenantWithAdmin({ name: 'Shop A', subdomain: 'shop-a' });
    const t2 = await createTenantWithAdmin({ name: 'Shop B', subdomain: 'shop-b' });

    const result = await bulkUpdateTenants([t1.id, t2.id], { status: 'suspended', plan: 'vip' });

    expect(result.updated).toBe(2);
    expect(result.updatedIds).toContain(t1.id);
    expect(result.updatedIds).toContain(t2.id);
    expect(result.skippedIds).toHaveLength(0);
  });

  it('getMaintenanceWindows returns windows for a date range', async () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 9).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), 1, 11).toISOString();
    await createMaintenanceWindow({ title: 'Bảo trì', startsAt: start, endsAt: end, status: 'scheduled' });

    const windows = await getMaintenanceWindows({
      start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
    });

    expect(windows.length).toBeGreaterThanOrEqual(1);
    expect(windows[0].title).toBe('Bảo trì');
  });

  it('deleteMaintenanceWindow removes a window', async () => {
    const now = new Date();
    const window = await createMaintenanceWindow({
      title: 'Xóa sau',
      startsAt: new Date(now.getFullYear(), now.getMonth(), 15, 9).toISOString(),
      endsAt: new Date(now.getFullYear(), now.getMonth(), 15, 11).toISOString(),
      status: 'scheduled',
    });

    const result = await deleteMaintenanceWindow(window.id);
    expect(result.deleted).toBe(true);

    const windows = await getMaintenanceWindows();
    expect(windows.find(w => w.id === window.id)).toBeUndefined();
  });

  it('BulkMaintenancePanel renders bulk and calendar UI', async () => {
    render(<BulkMaintenancePanel />);
    await waitFor(() => {
      expect(screen.getByText('Bulk operations & Bảo trì')).toBeInTheDocument();
    });
    expect(screen.getByText('Cập nhật hàng loạt tenant')).toBeInTheDocument();
    expect(screen.getByText('Lịch bảo trì')).toBeInTheDocument();
  });
});
