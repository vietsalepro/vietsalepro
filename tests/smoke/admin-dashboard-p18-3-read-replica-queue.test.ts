import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMockData, setCurrentUserId, setSystemAdmin } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import { createTenantWithAdmin, updateTenant } from '../../services/tenantService';
import {
  enqueueHeavyOpJob,
  getHeavyOpJobs,
  claimHeavyOpJob,
  completeHeavyOpJob,
  retryHeavyOpJob,
  getConnectionPoolStats,
  getReadReplicaStatus,
} from '../../services/heavyOpsQueueService';

describe('smoke: admin dashboard P18.3 read replica + connection pool + queue', () => {
  beforeEach(() => {
    resetMockData();
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
  });

  it('cấu hình read replica URL và connection pool config cho tenant VIP', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop VIP', subdomain: 'shop-vip', plan: 'vip' });
    const updated = await updateTenant(tenant.id, {
      readReplicaUrl: 'https://read-replica.example.supabase.co',
      connectionPoolConfig: { max: 20, min: 2 },
    });
    expect(updated.readReplicaUrl).toBe('https://read-replica.example.supabase.co');
    expect(updated.connectionPoolConfig).toEqual({ max: 20, min: 2 });
  });

  it('read replica status phản ánh tenant đã cấu hình', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop VIP', subdomain: 'shop-vip-2', plan: 'vip' });
    await updateTenant(tenant.id, { readReplicaUrl: 'https://replica.example.com' });
    const status = await getReadReplicaStatus();
    expect(status.enabled).toBe(true);
    expect(status.configuredTenants).toBeGreaterThan(0);
  });

  it('connection pool stats trả về đầy đủ các trường', async () => {
    const stats = await getConnectionPoolStats();
    expect(stats).toHaveProperty('active');
    expect(stats).toHaveProperty('idle');
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('max');
    expect(stats).toHaveProperty('status');
  });

  it('enqueue + list + claim + complete heavy op job', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Queue', subdomain: 'shop-queue', plan: 'free' });
    // user sys-admin là owner/member của tenant vừa tạo, nhưng không phải system admin.
    setSystemAdmin(false);

    const job = await enqueueHeavyOpJob({
      tenantId: tenant.id,
      jobType: 'report_export',
      payload: { reportType: 'sales' },
    });
    expect(job.status).toBe('pending');
    expect(job.jobType).toBe('report_export');

    const jobs = await getHeavyOpJobs({ tenantId: tenant.id });
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs[0].payload?.reportType).toBe('sales');

    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
    const claimed = await claimHeavyOpJob();
    expect(claimed).not.toBeNull();
    expect(claimed?.status).toBe('processing');

    const completed = await completeHeavyOpJob(claimed!.id, 'completed', { url: 'https://example.com/report.csv' });
    expect(completed.status).toBe('completed');
    expect(completed.result?.url).toBe('https://example.com/report.csv');
  });

  it('retry job thất bại', async () => {
    const tenant = await createTenantWithAdmin({ name: 'Shop Retry', subdomain: 'shop-retry', plan: 'free' });
    const job = await enqueueHeavyOpJob({ tenantId: tenant.id, jobType: 'bulk_delete' });
    await completeHeavyOpJob(job.id, 'failed', undefined, 'timeout');

    let jobs = await getHeavyOpJobs({ status: 'failed' });
    expect(jobs.some((j) => j.id === job.id)).toBe(true);

    await retryHeavyOpJob(job.id);
    jobs = await getHeavyOpJobs({ status: 'pending' });
    expect(jobs.some((j) => j.id === job.id)).toBe(true);
  });

  it('không cho phép user thường claim job', async () => {
    setSystemAdmin(false);
    setCurrentUserId('user-1');
    await expect(claimHeavyOpJob()).rejects.toThrow();
  });
});
