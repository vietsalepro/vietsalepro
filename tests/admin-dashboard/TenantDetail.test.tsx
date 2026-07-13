import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import TenantDetail from '../../pages/admin/TenantDetail';
import { Tenant } from '../../types/tenant';

const mocks = vi.hoisted(() => ({
  getAccount: vi.fn(),
  SubdomainPanel: vi.fn(() => <div data-testid="subdomain-panel" />),
  CustomDomainPanel: vi.fn(() => <div data-testid="custom-domain-panel" />),
  LicensePanel: vi.fn(() => <div data-testid="license-panel" />),
  SecurityPanel: vi.fn(() => <div data-testid="security-panel" />),
}));

vi.mock('../../services/admin/tenantAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/tenantAdminService')>(
    '../../services/admin/tenantAdminService',
  );
  return {
    ...actual,
    getAccount: (...args: any[]) => mocks.getAccount(...args),
  };
});

vi.mock('../../components/admin/SubdomainManagerPanel', () => ({
  default: mocks.SubdomainPanel,
}));

vi.mock('../../components/admin/CustomDomainPanel', () => ({
  default: mocks.CustomDomainPanel,
}));

vi.mock('../../components/admin/LicenseManagerPanel', () => ({
  default: mocks.LicensePanel,
}));

vi.mock('../../components/admin/SecuritySettingsPanel', () => ({
  default: mocks.SecurityPanel,
}));

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter initialEntries={['/admin/tenants/t1']}>
    <Routes>
      <Route path="/admin/tenants/:id" element={children} />
    </Routes>
  </MemoryRouter>
);

const mockTenant: Tenant = {
  id: 't1',
  name: 'Cửa hàng A',
  subdomain: 'cuahanga',
  status: 'active',
  plan: 'free',
};

describe('TenantDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getAccount with the tenant id from route params', async () => {
    mocks.getAccount.mockResolvedValue(mockTenant);
    render(<TenantDetail />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(mocks.getAccount).toHaveBeenCalledWith('t1');
    });
  });

  it('renders subdomain, license, and security panels for a free tenant', async () => {
    mocks.getAccount.mockResolvedValue(mockTenant);
    render(<TenantDetail />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('subdomain-panel')).toBeInTheDocument();
    });

    expect(screen.getByTestId('license-panel')).toBeInTheDocument();
    expect(screen.getByTestId('security-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-domain-panel')).not.toBeInTheDocument();
  });

  it('renders custom domain panel for a vip tenant', async () => {
    mocks.getAccount.mockResolvedValue({ ...mockTenant, plan: 'vip' });
    render(<TenantDetail />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('custom-domain-panel')).toBeInTheDocument();
    });

    expect(screen.getByTestId('subdomain-panel')).toBeInTheDocument();
    expect(screen.getByTestId('license-panel')).toBeInTheDocument();
    expect(screen.getByTestId('security-panel')).toBeInTheDocument();
  });

  it('shows error state when getAccount fails', async () => {
    mocks.getAccount.mockRejectedValue(new Error('Không thể tải tenant.'));
    render(<TenantDetail />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Không thể tải tenant/i)).toBeInTheDocument();
    });
  });
});
