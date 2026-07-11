import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ToastProvider } from '../../components/ToastContainer';
import Security from '../../pages/admin/Security';
import { Tenant } from '../../types/tenant';
import { SecuritySettings, LockedEmail } from '../../services/admin/systemAdminService';

const mockedListAccounts = vi.fn();
const mockedGetTenantSecuritySettings = vi.fn();
const mockedUpdateTenantIpAllowlist = vi.fn();
const mockedUpdateTenantSessionTimeout = vi.fn();
const mockedGetLockedEmails = vi.fn();
const mockedUnlockLoginAttempts = vi.fn();
const mockedGetTwoFactorStatus = vi.fn();

vi.mock('../../services/admin/tenantAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/tenantAdminService')>(
    '../../services/admin/tenantAdminService',
  );
  return {
    ...actual,
    listAccounts: (...args: any[]) => mockedListAccounts(...args),
  };
});

vi.mock('../../services/admin/systemAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/systemAdminService')>(
    '../../services/admin/systemAdminService',
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

vi.mock('../../services/twoFactorService', async () => {
  const actual = await vi.importActual<typeof import('../../services/twoFactorService')>(
    '../../services/twoFactorService',
  );
  return {
    ...actual,
    getTwoFactorStatus: (...args: any[]) => mockedGetTwoFactorStatus(...args),
    enrollTotp: vi.fn(),
    verifyTotpEnrollment: vi.fn(),
    generateBackupCodes: vi.fn(),
    disableTwoFactor: vi.fn(),
    overrideAdmin2FA: vi.fn(),
  };
});

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'admin@example.com' }, session: null, signOut: vi.fn(), loading: false, mfaPending: false }),
}));

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ToastProvider>{children}</ToastProvider>
);

const mockTenants: Tenant[] = [
  { id: 't1', name: 'Cửa hàng A', subdomain: 'cuahanga', status: 'active', plan: 'vip' },
];

const mockSettings: SecuritySettings = {
  tenantId: 't1',
  allowedIps: ['192.168.1.1'],
  sessionTimeoutMinutes: 60,
};

const mockLockedEmails: LockedEmail[] = [
  { email: 'locked@example.com', failedCount: 5, lastAttempt: '2026-07-10T08:00:00Z' },
];

describe('Security page', () => {
  beforeEach(() => {
    mockedListAccounts.mockResolvedValue({ accounts: mockTenants, totalCount: mockTenants.length });
    mockedGetTenantSecuritySettings.mockResolvedValue(mockSettings);
    mockedGetLockedEmails.mockResolvedValue(mockLockedEmails);
    mockedGetTwoFactorStatus.mockResolvedValue({ enabled: true, factorId: 'f1', backupCodesRemaining: 8 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders security settings', async () => {
    render(<Security />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Cài đặt bảo mật')).toBeInTheDocument();
    });

    const tenantSelect = screen.getByRole('combobox');
    fireEvent.change(tenantSelect, { target: { value: 't1' } });

    await waitFor(() => {
      expect(screen.getByText('Cấu hình bảo mật theo cửa hàng')).toBeInTheDocument();
    });
    expect(screen.getByText('IP Allowlist')).toBeInTheDocument();
    expect(screen.getByText('Thời gian hết phiên')).toBeInTheDocument();
  });

  it('displays MFA status', async () => {
    render(<Security />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Cài đặt bảo mật')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Còn 8 backup code/)).toBeInTheDocument();
    });
  });
});
