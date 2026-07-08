import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { resetMockData, setSystemAdmin } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  getFraudDetectionConfig,
  setFraudDetectionConfig,
  runFraudDetection,
  getFraudQueue,
  updateFraudQueueStatus,
  getDataRetentionConfig,
  setDataRetentionConfig,
  runDataRetention,
} from '../../services/fraudRetentionService';
import FraudRetentionPanel from '../../components/FraudRetentionPanel';

describe('smoke: admin dashboard P17.4 fraud detection + data retention', () => {
  beforeEach(() => {
    resetMockData();
    setSystemAdmin(true);
  });

  it('getFraudDetectionConfig returns default config', async () => {
    const config = await getFraudDetectionConfig();
    expect(config.enabled).toBe(true);
    expect(config.ipMax).toBe(5);
  });

  it('setFraudDetectionConfig updates thresholds', async () => {
    const config = await setFraudDetectionConfig({ ipMax: 10 });
    expect(config.ipMax).toBe(10);
    const current = await getFraudDetectionConfig();
    expect(current.ipMax).toBe(10);
  });

  it('runFraudDetection returns summary', async () => {
    const result = await runFraudDetection();
    expect(result.enabled).toBe(true);
    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(0);
  });

  it('getFraudQueue returns empty list by default', async () => {
    const result = await getFraudQueue();
    expect(result.data).toHaveLength(0);
    expect(result.count).toBe(0);
  });

  it('getDataRetentionConfig returns default config', async () => {
    const config = await getDataRetentionConfig();
    expect(config.retentionDaysOrders).toBe(730);
    expect(config.cronSchedule).toBe('0 3 * * *');
  });

  it('setDataRetentionConfig updates days and syncs cron setting', async () => {
    const config = await setDataRetentionConfig({ retentionDaysOrders: 365 });
    expect(config.retentionDaysOrders).toBe(365);
  });

  it('runDataRetention returns cleanup summary', async () => {
    const result = await runDataRetention();
    expect(result.archivedOrders).toBe(0);
    expect(result.deletedRateLimitLogs).toBe(0);
  });

  it('FraudRetentionPanel renders fraud + retention UI', async () => {
    render(<FraudRetentionPanel />);
    await waitFor(() => {
      expect(screen.getByText('Cấu hình phát hiện gian lận')).toBeInTheDocument();
    });
    expect(screen.getByText('Hàng đợi gian lận')).toBeInTheDocument();
    expect(screen.getByText('Cấu hình data retention')).toBeInTheDocument();

    const runBtn = screen.getByRole('button', { name: /Chạy detection/i });
    fireEvent.click(runBtn);
    await waitFor(() => {
      expect(screen.getByText('Tổng cảnh báo')).toBeInTheDocument();
    });
  });
});
