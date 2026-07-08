import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { resetMockData, setSystemAdmin } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import { getTenantStorageUsage } from '../../services/tenantService';
import { getBackupStatus } from '../../services/systemBackupService';
import StorageBackupPanel from '../../components/StorageBackupPanel';

describe('smoke: admin dashboard P13.3 storage + backup', () => {
  beforeEach(() => {
    resetMockData();
    setSystemAdmin(true);
  });

  it('getTenantStorageUsage trả về storage usage per tenant', async () => {
    const result = await getTenantStorageUsage();
    expect(result.totalDatabaseBytes).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.tenants)).toBe(true);
  });

  it('getBackupStatus trả về backup status card', async () => {
    const result = await getBackupStatus();
    expect(result.backupStatus).toBeDefined();
    expect(result.backupStatus.status).toBeOneOf(['healthy', 'degraded', 'unknown']);
    expect(typeof result.backupStatus.cliAvailable).toBe('boolean');
  });

  it('StorageBackupPanel render storage và backup cards', async () => {
    render(<StorageBackupPanel />);
    await waitFor(() => {
      expect(screen.getByText('Tổng dung lượng DB')).toBeInTheDocument();
    });
    expect(screen.getByText('Trạng thái backup')).toBeInTheDocument();
    expect(screen.getByText('Storage theo tenant')).toBeInTheDocument();
  });
});
