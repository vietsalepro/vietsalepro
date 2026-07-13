import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ToastProvider } from '../../components/ToastContainer';
import SecuritySettingsPanel from '../../components/admin/SecuritySettingsPanel';
import { Tenant } from '../../types/tenant';
import { SecuritySettings, LockedEmail } from '../../services/admin/systemAdminService';

const mockedGetTenantSecuritySettings = vi.fn();
const mockedUpdateTenantIpAllowlist = vi.fn();
const mockedUpdateTenantSessionTimeout = vi.fn();
const mockedGetLockedEmails = vi.fn();
const mockedUnlockLoginAttempts = vi.fn();

vi.mock('../../services/admin/systemAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/systemAdminService')>(
    '../../services/admin/systemAdminService'
  );
  return {
    ...actual,
    getTenantSecuritySettings: (...args: any[]) => mockedGetTenantSecuritySettings(...args),
    updateTenantIpAllowlist: (...args: any[]) => mockedUpdateTenantIpAllowlist(...args),
    updateTenantSessionTimeout: (...args: any[]) => mockedUpdateTenantSessionTimeout(...args),
    getLockedEmails: (...args: any[]) => mockedGetLockedEmails(...args),
    unlockLoginAttempts: (...args: any[]) => mockedUnlockLoginAttempts(...args),
  };
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ToastProvider>{children}</ToastProvider>
);

const mockTenant: Tenant = {
  id: 't1',
  name: 'Cửa hàng A',
  subdomain: 'cuahanga',
  status: 'active',
  plan: 'vip',
};

const mockSettings: SecuritySettings = {
  tenantId: 't1',
  allowedIps: ['192.168.1.1'],
  sessionTimeoutMinutes: 60,
};

const mockLockedEmails: LockedEmail[] = [
  { email: 'locked@example.com', failedCount: 5, lastAttempt: '2026-07-10T08:00:00Z' },
];

describe('SecuritySettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetTenantSecuritySettings.mockResolvedValue(mockSettings);
    mockedGetLockedEmails.mockResolvedValue(mockLockedEmails);
    mockedUpdateTenantIpAllowlist.mockResolvedValue(undefined);
    mockedUpdateTenantSessionTimeout.mockResolvedValue(undefined);
    mockedUnlockLoginAttempts.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders and loads security settings for tenant', async () => {
    render(<SecuritySettingsPanel tenant={mockTenant} />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(mockedGetTenantSecuritySettings).toHaveBeenCalledWith('t1');
    });

    expect(screen.getByText('Cấu hình bảo mật')).toBeInTheDocument();
    expect(screen.getByText('IP Allowlist')).toBeInTheDocument();
    expect(screen.getByText('Thời gian hết phiên')).toBeInTheDocument();
  });

  it('loads locked emails on mount', async () => {
    render(<SecuritySettingsPanel tenant={mockTenant} />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(mockedGetLockedEmails).toHaveBeenCalled();
    });

    expect(screen.getByText('locked@example.com')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('adds IP to allowlist', async () => {
    render(<SecuritySettingsPanel tenant={mockTenant} />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('192.168.1.1');
    fireEvent.change(input, { target: { value: '10.0.0.1' } });
    fireEvent.click(screen.getByRole('button', { name: /Thêm IP/i }));

    await waitFor(() => {
      expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
    });
  });

  it('rejects invalid IP format', async () => {
    render(<SecuritySettingsPanel tenant={mockTenant} />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('192.168.1.1');
    fireEvent.change(input, { target: { value: 'not-an-ip' } });
    fireEvent.click(screen.getByRole('button', { name: /Thêm IP/i }));

    await waitFor(() => {
      expect(screen.getByText(/IP không hợp lệ/i)).toBeInTheDocument();
    });
    expect(screen.queryByText('not-an-ip')).not.toBeInTheDocument();
  });

  it('rejects duplicate IP', async () => {
    render(<SecuritySettingsPanel tenant={mockTenant} />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('192.168.1.1');
    fireEvent.change(input, { target: { value: '192.168.1.1' } });
    fireEvent.click(screen.getByRole('button', { name: /Thêm IP/i }));

    await waitFor(() => {
      expect(screen.getByText(/IP đã tồn tại/i)).toBeInTheDocument();
    });
  });

  it('removes IP from allowlist', async () => {
    render(<SecuritySettingsPanel tenant={mockTenant} />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Xóa 192\.168\.1\.1/i));

    await waitFor(() => {
      expect(screen.queryByText('192.168.1.1')).not.toBeInTheDocument();
    });
  });

  it('updates session timeout', async () => {
    render(<SecuritySettingsPanel tenant={mockTenant} />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByDisplayValue('60')).toBeInTheDocument();
    });

    const input = screen.getByDisplayValue('60');
    fireEvent.change(input, { target: { value: '120' } });

    expect(screen.getByDisplayValue('120')).toBeInTheDocument();
  });

  it('saves allowlist and session timeout', async () => {
    render(<SecuritySettingsPanel tenant={mockTenant} />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });

    const timeoutInput = screen.getByDisplayValue('60');
    fireEvent.change(timeoutInput, { target: { value: '90' } });

    fireEvent.click(screen.getByRole('button', { name: /Lưu cấu hình/i }));

    await waitFor(() => {
      expect(mockedUpdateTenantIpAllowlist).toHaveBeenCalledWith('t1', ['192.168.1.1']);
      expect(mockedUpdateTenantSessionTimeout).toHaveBeenCalledWith('t1', 90);
    });
  });

  it('unlocks a locked email', async () => {
    render(<SecuritySettingsPanel tenant={mockTenant} />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('locked@example.com')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Mở khóa/i }));

    await waitFor(() => {
      expect(mockedUnlockLoginAttempts).toHaveBeenCalledWith('locked@example.com');
    });
  });
});
