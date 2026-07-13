import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import SubdomainManagerPanel from '../../components/admin/SubdomainManagerPanel';
import { Tenant } from '../../types/tenant';

const mockedCheckSubdomainAvailability = vi.fn();
const mockedSetTenantSubdomain = vi.fn();

vi.mock('../../services/admin/tenantAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/tenantAdminService')>(
    '../../services/admin/tenantAdminService'
  );
  return {
    ...actual,
    checkSubdomainAvailability: (...args: any[]) => mockedCheckSubdomainAvailability(...args),
    setTenantSubdomain: (...args: any[]) => mockedSetTenantSubdomain(...args),
  };
});

const mockTenant: Tenant = {
  id: 't1',
  name: 'Cửa hàng A',
  subdomain: 'cuahanga',
  status: 'active',
  plan: 'free',
};

describe('SubdomainManagerPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCheckSubdomainAvailability.mockResolvedValue({ available: true });
    mockedSetTenantSubdomain.mockResolvedValue({ ...mockTenant, subdomain: 'newsub' });
  });

  it('renders current subdomain', () => {
    render(<SubdomainManagerPanel tenant={mockTenant} />);
    expect(screen.getByDisplayValue('cuahanga')).toBeInTheDocument();
  });

  it('checks availability when user clicks Kiểm tra', async () => {
    render(<SubdomainManagerPanel tenant={mockTenant} />);

    const input = screen.getByDisplayValue('cuahanga');
    fireEvent.change(input, { target: { value: 'newsub' } });

    fireEvent.click(screen.getByRole('button', { name: /Kiểm tra/i }));

    await waitFor(() => {
      expect(mockedCheckSubdomainAvailability).toHaveBeenCalledWith('newsub');
    });
    expect(await screen.findByText(/khả dụng/i)).toBeInTheDocument();
  });

  it('saves subdomain when available and user clicks Lưu', async () => {
    const onUpdated = vi.fn();
    render(<SubdomainManagerPanel tenant={mockTenant} onUpdated={onUpdated} />);

    const input = screen.getByDisplayValue('cuahanga');
    fireEvent.change(input, { target: { value: 'newsub' } });
    fireEvent.click(screen.getByRole('button', { name: /Kiểm tra/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Lưu/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Lưu/i }));

    await waitFor(() => {
      expect(mockedSetTenantSubdomain).toHaveBeenCalledWith('t1', 'newsub');
    });
    expect(onUpdated).toHaveBeenCalled();
  });

  it('disables save when subdomain is unavailable', async () => {
    mockedCheckSubdomainAvailability.mockResolvedValue({ available: false, error: 'Subdomain đã được sử dụng.' });
    render(<SubdomainManagerPanel tenant={mockTenant} />);

    const input = screen.getByDisplayValue('cuahanga');
    fireEvent.change(input, { target: { value: 'taken' } });
    fireEvent.click(screen.getByRole('button', { name: /Kiểm tra/i }));

    await waitFor(() => {
      expect(screen.getByText(/đã được sử dụng/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Lưu/i })).toBeDisabled();
  });

  it('rejects reserved subdomains without calling the service', async () => {
    render(<SubdomainManagerPanel tenant={mockTenant} />);

    const input = screen.getByDisplayValue('cuahanga');
    fireEvent.change(input, { target: { value: 'admin' } });

    expect(screen.getByRole('button', { name: /Kiểm tra/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Lưu/i })).toBeDisabled();
    expect(mockedCheckSubdomainAvailability).not.toHaveBeenCalled();
  });

  it('handles tenant with undefined subdomain gracefully', () => {
    const tenantWithoutSubdomain = { ...mockTenant, subdomain: undefined as unknown as string };
    render(<SubdomainManagerPanel tenant={tenantWithoutSubdomain} />);
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });
});
