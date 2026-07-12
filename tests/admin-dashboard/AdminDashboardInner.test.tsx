import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import AdminDashboardInner from '../../pages/admin/AdminDashboardInner';
import { SystemOverview, TopTenant } from '../../types/tenant';

const mockedGetTopTenants = vi.fn();
const mockedGetTenantGrowth = vi.fn();
const mockedGetSystemOverview = vi.fn();
const mockedGetRateLimitLogs = vi.fn();
const mockedGetAdminLoginHistory = vi.fn();
const mockedGetAdminLoginAlerts = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  },
  getCurrentTenantId: vi.fn(() => null),
  setCurrentTenantId: vi.fn(),
}));

vi.mock('../../services/admin/tenantAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/tenantAdminService')>(
    '../../services/admin/tenantAdminService',
  );
  return {
    ...actual,
    getTopTenants: (...args: any[]) => mockedGetTopTenants(...args),
    getTenantGrowth: (...args: any[]) => mockedGetTenantGrowth(...args),
  };
});

vi.mock('../../services/admin/systemAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/systemAdminService')>(
    '../../services/admin/systemAdminService',
  );
  return {
    ...actual,
    getSystemOverview: (...args: any[]) => mockedGetSystemOverview(...args),
  };
});

vi.mock('../../services/admin/auditAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/auditAdminService')>(
    '../../services/admin/auditAdminService',
  );
  return {
    ...actual,
    getRateLimitLogs: (...args: any[]) => mockedGetRateLimitLogs(...args),
    getAdminLoginHistory: (...args: any[]) => mockedGetAdminLoginHistory(...args),
    getAdminLoginAlerts: (...args: any[]) => mockedGetAdminLoginAlerts(...args),
  };
});

const mockOverview: SystemOverview = {
  totalTenants: 1,
  activeTenants: 1,
  trialTenants: 0,
  vipTenants: 0,
  expiringSoon: 0,
  nearLimit: 0,
  newThisMonth: 1,
  expiringTenants: [],
  nearLimitTenants: [],
};

const mockTopTenant: TopTenant = {
  id: 't-1',
  name: 'Store A',
  subdomain: 'store-a',
  status: 'active',
  plan: 'free',
  createdAt: '2026-07-12T00:00:00Z',
  ordersThisMonth: undefined as unknown as number,
  userCount: 0,
  productCount: 0,
};

describe('AdminDashboardInner overview tab', () => {
  beforeEach(() => {
    mockedGetSystemOverview.mockResolvedValue(mockOverview);
    mockedGetTopTenants.mockResolvedValue({ data: [mockTopTenant], count: 1 });
    mockedGetTenantGrowth.mockResolvedValue([{ month: '2026-07', count: 1 }]);
    mockedGetRateLimitLogs.mockResolvedValue({ data: [], count: 0 });
    mockedGetAdminLoginHistory.mockResolvedValue({ data: [], count: 0 });
    mockedGetAdminLoginAlerts.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders top tenants table without crashing when ordersThisMonth is undefined', async () => {
    render(<AdminDashboardInner activeTab="overview" />);

    await waitFor(() => {
      expect(screen.getByText('Top cửa hàng')).toBeInTheDocument();
    });

    const row = screen.getByText('Store A').closest('tr');
    expect(row).toBeInTheDocument();

    // ponytail: regression guard — undefined ordersThisMonth should fall back to 0.
    expect(within(row!).getByText('0')).toBeInTheDocument();
  });
});
