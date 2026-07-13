import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import LicenseManagerPanel from '../../components/admin/LicenseManagerPanel';
import { Tenant } from '../../types/tenant';
import { LicenseStatus } from '../../services/admin/licenseService';

const mockedGenerateLicense = vi.fn();
const mockedValidateLicense = vi.fn();
const mockedListTenantLicenses = vi.fn();
const mockedRevokeLicense = vi.fn();

vi.mock('../../services/admin/licenseService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/licenseService')>(
    '../../services/admin/licenseService'
  );
  return {
    ...actual,
    generateLicense: (...args: any[]) => mockedGenerateLicense(...args),
    validateLicense: (...args: any[]) => mockedValidateLicense(...args),
    listTenantLicenses: (...args: any[]) => mockedListTenantLicenses(...args),
    revokeLicense: (...args: any[]) => mockedRevokeLicense(...args),
  };
});

const mockTenant: Tenant = {
  id: 't1',
  name: 'Cửa hàng A',
  subdomain: 'cuahanga',
  status: 'active',
  plan: 'free',
};

describe('LicenseManagerPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn(() => true));
    mockedListTenantLicenses.mockResolvedValue([]);
    mockedGenerateLicense.mockResolvedValue({
      id: 'lic-new',
      tenantId: 't1',
      key: 'NEWKEY1234567890',
      plan: 'vip',
      maxUsers: 10,
      maxProducts: 1000,
      maxOrdersPerMonth: 10000,
      expiresAt: '2026-12-31T00:00:00Z',
      isActive: true,
      status: LicenseStatus.ACTIVE,
      createdAt: '2026-01-01T00:00:00Z',
    });
    mockedValidateLicense.mockResolvedValue({ valid: false });
    mockedRevokeLicense.mockResolvedValue(undefined);
  });

  it('renders empty license list', async () => {
    render(<LicenseManagerPanel tenant={mockTenant} />);
    expect(await screen.findByText(/Chưa có license nào/i)).toBeInTheDocument();
  });

  it('loads and displays existing licenses', async () => {
    mockedListTenantLicenses.mockResolvedValue([
      {
        id: 'lic-1',
        tenantId: 't1',
        key: 'KEY123',
        plan: 'vip',
        maxUsers: 5,
        maxProducts: 500,
        maxOrdersPerMonth: 5000,
        isActive: true,
        status: LicenseStatus.ACTIVE,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ]);

    render(<LicenseManagerPanel tenant={mockTenant} />);

    await waitFor(() => {
      expect(screen.getByText('KEY123')).toBeInTheDocument();
    });
    expect(screen.getByText(/vip/i)).toBeInTheDocument();
  });

  it('generates a license with user input', async () => {
    render(<LicenseManagerPanel tenant={mockTenant} />);

    fireEvent.click(screen.getByRole('button', { name: /Tạo license mới/i }));

    const planInput = screen.getByLabelText(/Gói/i);
    fireEvent.change(planInput, { target: { value: 'vip' } });

    fireEvent.click(screen.getByRole('button', { name: /^Tạo license$/i }));

    await waitFor(() => {
      expect(mockedGenerateLicense).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 't1', plan: 'vip' })
      );
    });
  });

  it('validates a license key', async () => {
    mockedValidateLicense.mockResolvedValue({
      valid: true,
      license: {
        id: 'lic-1',
        tenantId: 't1',
        key: 'VALIDKEY',
        plan: 'vip',
        maxUsers: 0,
        maxProducts: 0,
        maxOrdersPerMonth: 0,
        isActive: true,
        status: LicenseStatus.ACTIVE,
      },
    });

    render(<LicenseManagerPanel tenant={mockTenant} />);

    const keyInput = screen.getByPlaceholderText(/Nhập license key/i);
    fireEvent.change(keyInput, { target: { value: 'VALIDKEY' } });

    fireEvent.click(screen.getByRole('button', { name: /Kiểm tra/i }));

    await waitFor(() => {
      expect(mockedValidateLicense).toHaveBeenCalledWith('VALIDKEY');
    });
    expect(await screen.findByText(/Hợp lệ/i)).toBeInTheDocument();
  });

  it('revokes a license when user confirms', async () => {
    mockedListTenantLicenses.mockResolvedValue([
      {
        id: 'lic-1',
        tenantId: 't1',
        key: 'KEY123',
        plan: 'vip',
        maxUsers: 5,
        maxProducts: 500,
        maxOrdersPerMonth: 5000,
        isActive: true,
        status: LicenseStatus.ACTIVE,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ]);

    render(<LicenseManagerPanel tenant={mockTenant} />);

    await waitFor(() => {
      expect(screen.getByText('KEY123')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Thu hồi/i }));

    await waitFor(() => {
      expect(mockedRevokeLicense).toHaveBeenCalledWith('lic-1');
    });
  });
});
