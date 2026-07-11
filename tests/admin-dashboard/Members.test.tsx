import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ToastProvider } from '../../components/ToastContainer';
import Members from '../../pages/admin/Members';
import { Tenant, MemberWithEmail } from '../../types/tenant';

const mockedListAccounts = vi.fn();
const mockedSearchTenantMembers = vi.fn();

vi.mock('../../services/admin/tenantAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/tenantAdminService')>(
    '../../services/admin/tenantAdminService',
  );
  return {
    ...actual,
    listAccounts: (...args: any[]) => mockedListAccounts(...args),
  };
});

vi.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ tenant: null, membership: null, role: null, isLoading: false, isReadOnly: false, isImpersonating: false, impersonatedBy: null }),
}));

vi.mock('../../services/admin/memberAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/memberAdminService')>(
    '../../services/admin/memberAdminService',
  );
  return {
    ...actual,
    searchTenantMembers: (...args: any[]) => mockedSearchTenantMembers(...args),
  };
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ToastProvider>{children}</ToastProvider>
);

const mockTenants: Tenant[] = [
  { id: 't1', name: 'Cửa hàng A', subdomain: 'cuahanga', status: 'active', plan: 'vip' },
];

const mockMembers: MemberWithEmail[] = [
  { id: 'm1', userId: 'u1', tenantId: 't1', email: 'admin@example.com', role: 'admin', status: 'active', isActive: true },
  { id: 'm2', userId: 'u2', tenantId: 't1', email: 'cashier@example.com', role: 'cashier', status: 'active', isActive: true },
  { id: 'm3', userId: 'u3', tenantId: 't1', email: 'viewer@example.com', role: 'viewer', status: 'pending', isActive: false },
];

describe('Members page', () => {
  beforeEach(() => {
    mockedListAccounts.mockResolvedValue({ accounts: mockTenants, totalCount: mockTenants.length });
    mockedSearchTenantMembers.mockResolvedValue({ members: mockMembers, totalCount: mockMembers.length });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders member list when a tenant is selected', async () => {
    render(<Members />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Cửa hàng A/ })).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 't1' } });

    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });
    expect(screen.getByText('cashier@example.com')).toBeInTheDocument();
    expect(screen.getByText('viewer@example.com')).toBeInTheDocument();
  });

  it('displays role badges correctly', async () => {
    render(<Members />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Cửa hàng A/ })).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 't1' } });

    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });

    // DataGrid renders role selects in each row; selected option text is the display value.
    const adminSelect = screen.getByDisplayValue('Admin') as HTMLSelectElement;
    const cashierSelect = screen.getByDisplayValue('Thu ngân') as HTMLSelectElement;
    const viewerSelect = screen.getByDisplayValue('Người xem') as HTMLSelectElement;

    expect(adminSelect.value).toBe('admin');
    expect(cashierSelect.value).toBe('cashier');
    expect(viewerSelect.value).toBe('viewer');
  });
});
