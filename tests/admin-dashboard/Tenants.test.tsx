import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ToastProvider } from '../../components/ToastContainer';
import Tenants from '../../pages/admin/Tenants';
import { Tenant } from '../../types/tenant';

const mockedListAccounts = vi.fn();
const mockedCheckSubdomain = vi.fn();
const mockedStartImpersonation = vi.fn();
const mockedCreateTenantWithCredentials = vi.fn();
const mockedSoftDeleteTenant = vi.fn();
const mockedHardDeleteTenant = vi.fn();
const mockedRestoreTenantStatus = vi.fn();

vi.mock('../../services/admin/tenantAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/tenantAdminService')>(
    '../../services/admin/tenantAdminService',
  );
  return {
    ...actual,
    listAccounts: (...args: any[]) => mockedListAccounts(...args),
    createTenantWithCredentials: (...args: any[]) => mockedCreateTenantWithCredentials(...args),
    softDeleteTenant: (...args: any[]) => mockedSoftDeleteTenant(...args),
    hardDeleteTenant: (...args: any[]) => mockedHardDeleteTenant(...args),
    restoreTenantStatus: (...args: any[]) => mockedRestoreTenantStatus(...args),
  };
});

vi.mock('../../services/admin/systemAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/systemAdminService')>(
    '../../services/admin/systemAdminService',
  );
  return {
    ...actual,
    checkSubdomain: (...args: any[]) => mockedCheckSubdomain(...args),
    startImpersonation: (...args: any[]) => mockedStartImpersonation(...args),
  };
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ToastProvider>{children}</ToastProvider>
);

const mockTenants: Tenant[] = [
  { id: 't1', name: 'Cửa hàng A', subdomain: 'cuahanga', status: 'active', plan: 'free' },
  { id: 't2', name: 'Cửa hàng B', subdomain: 'cuahangb', status: 'archived', plan: 'vip' },
];

describe('Tenants page', () => {
  beforeEach(() => {
    mockedListAccounts.mockResolvedValue({ accounts: mockTenants, totalCount: mockTenants.length });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders tenant list', async () => {
    render(<Tenants />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Cửa hàng A')).toBeInTheDocument();
    });
    expect(screen.getByText('Cửa hàng B')).toBeInTheDocument();
    expect(screen.getByText('cuahanga')).toBeInTheDocument();
    expect(screen.getByText('cuahangb')).toBeInTheDocument();
  });

  it('supports search filtering', async () => {
    mockedListAccounts.mockImplementation((options: any) => {
      const search = options?.search?.toLowerCase() || '';
      const filtered = search
        ? mockTenants.filter((t) => t.name.toLowerCase().includes(search) || t.subdomain.includes(search))
        : mockTenants;
      return Promise.resolve({ accounts: filtered, totalCount: filtered.length });
    });

    render(<Tenants />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Cửa hàng A')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Tên hoặc subdomain');
    fireEvent.change(searchInput, { target: { value: 'B' } });

    await waitFor(() => {
      expect(screen.queryByText('Cửa hàng A')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Cửa hàng B')).toBeInTheDocument();
  });
});
