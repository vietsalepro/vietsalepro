import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ToastProvider } from '../../components/ToastContainer';
import Audit from '../../pages/admin/Audit';
import { Tenant } from '../../types/tenant';
import { AdminAuditLogEntry } from '../../services/admin/auditAdminService';

const mockedListAccounts = vi.fn();
const mockedGetAdminAuditLogs = vi.fn();

vi.mock('../../services/admin/tenantAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/tenantAdminService')>(
    '../../services/admin/tenantAdminService',
  );
  return {
    ...actual,
    listAccounts: (...args: any[]) => mockedListAccounts(...args),
  };
});

vi.mock('../../services/admin/auditAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/auditAdminService')>(
    '../../services/admin/auditAdminService',
  );
  return {
    ...actual,
    getAdminAuditLogs: (...args: any[]) => mockedGetAdminAuditLogs(...args),
  };
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ToastProvider>{children}</ToastProvider>
);

const mockTenants: Tenant[] = [
  { id: 't1', name: 'Cửa hàng A', subdomain: 'cuahanga', status: 'active', plan: 'free' },
];

const longData = {
  description:
    'Đây là một bản ghi audit log dài để đảm bảo nút mở rộng hiển thị khi dữ liệu vượt quá 120 ký tự trong giao diện.',
};

const mockLogs: AdminAuditLogEntry[] = [
  {
    id: 'l1',
    tenantId: 't1',
    actorId: 'u1',
    action: 'INSERT',
    entityType: 'tenants',
    entityId: 't1',
    oldData: null,
    newData: longData,
    ipAddress: '127.0.0.1',
    createdAt: '2026-07-10T08:00:00Z',
  },
  {
    id: 'l2',
    tenantId: 't1',
    actorId: 'u1',
    action: 'UPDATE',
    entityType: 'tenants',
    entityId: 't1',
    oldData: { status: 'pending' },
    newData: { status: 'active' },
    ipAddress: '127.0.0.1',
    createdAt: '2026-07-10T09:00:00Z',
  },
];

describe('Audit page', () => {
  beforeEach(() => {
    mockedListAccounts.mockResolvedValue({ accounts: mockTenants, totalCount: mockTenants.length });
    mockedGetAdminAuditLogs.mockResolvedValue({ data: mockLogs, count: mockLogs.length });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders audit log table', async () => {
    render(<Audit />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Nhật ký hoạt động')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    expect(screen.getAllByText('u1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('127.0.0.1').length).toBeGreaterThan(0);
  });

  it('expands log details when clicked', async () => {
    render(<Audit />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Mở rộng')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Mở rộng'));

    await waitFor(() => {
      expect(screen.getByText(/Đây là một bản ghi audit log dài/)).toBeInTheDocument();
    });
  });
});
