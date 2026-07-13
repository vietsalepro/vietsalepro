import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ToastProvider } from '../../components/ToastContainer';
import AuditExportPanel from '../../components/admin/AuditExportPanel';

const mockedExportAuditLogs = vi.fn();
const mockedSaveAs = vi.fn();

vi.mock('../../services/admin/auditAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/auditAdminService')>(
    '../../services/admin/auditAdminService',
  );
  return {
    ...actual,
    exportAuditLogs: (...args: any[]) => mockedExportAuditLogs(...args),
  };
});

vi.mock('file-saver', () => ({
  saveAs: (...args: any[]) => mockedSaveAs(...args),
}));

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('AuditExportPanel', () => {
  beforeEach(() => {
    mockedExportAuditLogs.mockResolvedValue({
      blob: new Blob(['test'], { type: 'application/json' }),
      filename: 'audit-log-2026-07-13.json',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders format and filter controls', () => {
    render(<AuditExportPanel filters={{}} />, { wrapper: Wrapper });

    expect(screen.getByText('Xuất audit log')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CSV' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'JSON' })).toBeInTheDocument();
    expect(screen.getByLabelText('Từ ngày')).toBeInTheDocument();
    expect(screen.getByLabelText('Đến ngày')).toBeInTheDocument();
  });

  it('calls export service with selected format and filters', async () => {
    render(
      <AuditExportPanel
        filters={{
          tenantId: 't1',
          actorId: 'u1',
          action: 'INSERT',
          entityType: 'tenants',
          entityId: 't1',
          dateFrom: '2026-07-01',
          dateTo: '2026-07-31',
        }}
      />,
      { wrapper: Wrapper }
    );

    fireEvent.click(screen.getByRole('button', { name: /JSON/i }));
    fireEvent.click(screen.getByRole('button', { name: /Xuất JSON/i }));

    await waitFor(() => {
      expect(mockedExportAuditLogs).toHaveBeenCalledWith({
        format: 'json',
        tenantId: 't1',
        actorId: 'u1',
        action: 'INSERT',
        entityType: 'tenants',
        entityId: 't1',
        dateFrom: '2026-07-01',
        dateTo: '2026-07-31',
      });
    });

    expect(mockedSaveAs).toHaveBeenCalledWith(
      expect.any(Blob),
      'audit-log-2026-07-13.json'
    );
  });
});
