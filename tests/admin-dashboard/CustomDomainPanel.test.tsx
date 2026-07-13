import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import CustomDomainPanel from '../../components/admin/CustomDomainPanel';
import { Tenant } from '../../types/tenant';

const mockedRequestCustomDomainVerification = vi.fn();
const mockedVerifyCustomDomain = vi.fn();

vi.mock('../../services/admin/tenantAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/tenantAdminService')>(
    '../../services/admin/tenantAdminService'
  );
  return {
    ...actual,
    requestCustomDomainVerification: (...args: any[]) => mockedRequestCustomDomainVerification(...args),
    verifyCustomDomain: (...args: any[]) => mockedVerifyCustomDomain(...args),
  };
});

const mockTenant: Tenant = {
  id: 't1',
  name: 'Cửa hàng A',
  subdomain: 'cuahanga',
  status: 'active',
  plan: 'vip',
  customDomain: 'brand.example.com',
};

describe('CustomDomainPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRequestCustomDomainVerification.mockResolvedValue({ token: 'verify-token-123', txtRecord: 'verify-token-123' });
    mockedVerifyCustomDomain.mockResolvedValue({ verified: true, message: 'Domain đã được xác minh' });
  });

  it('renders the current custom domain', () => {
    render(<CustomDomainPanel tenant={mockTenant} />);
    expect(screen.getByDisplayValue('brand.example.com')).toBeInTheDocument();
  });

  it('requests a verification token when user clicks Tạo token', async () => {
    render(<CustomDomainPanel tenant={mockTenant} />);

    fireEvent.click(screen.getByRole('button', { name: /Tạo token xác minh/i }));

    await waitFor(() => {
      expect(mockedRequestCustomDomainVerification).toHaveBeenCalledWith('t1');
    });
    expect(await screen.findByText(/verify-token-123/i)).toBeInTheDocument();
  });

  it('verifies the domain and shows a success message', async () => {
    render(<CustomDomainPanel tenant={mockTenant} />);

    fireEvent.click(screen.getByRole('button', { name: /Tạo token xác minh/i }));
    await screen.findByText(/verify-token-123/i);

    fireEvent.click(screen.getByRole('button', { name: /Xác minh ngay/i }));

    await waitFor(() => {
      expect(mockedVerifyCustomDomain).toHaveBeenCalledWith('t1', 'brand.example.com');
    });
    expect(await screen.findByText(/đã được xác minh/i)).toBeInTheDocument();
  });

  it('shows an error message when verification fails', async () => {
    mockedVerifyCustomDomain.mockResolvedValueOnce({ verified: false, message: 'Không tìm thấy TXT record' });
    render(<CustomDomainPanel tenant={mockTenant} />);

    fireEvent.click(screen.getByRole('button', { name: /Tạo token xác minh/i }));
    await screen.findByText(/verify-token-123/i);

    fireEvent.click(screen.getByRole('button', { name: /Xác minh ngay/i }));

    expect(await screen.findByText(/Không tìm thấy TXT record/i)).toBeInTheDocument();
  });

  it('prompts the user when the tenant has no custom domain', () => {
    const tenantWithoutDomain = { ...mockTenant, customDomain: undefined };
    render(<CustomDomainPanel tenant={tenantWithoutDomain} />);
    expect(screen.getByText(/chưa có custom domain/i)).toBeInTheDocument();
  });
});
