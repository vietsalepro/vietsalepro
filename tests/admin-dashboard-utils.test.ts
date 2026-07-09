import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/supabase', async () => {
  const { mockSupabase } = await import('./mocks/supabase');
  return { supabase: mockSupabase };
});

import { calculateProration, planLabel } from '../pages/SystemAdminDashboard';
import { mapTenantFromDB } from '../services/tenantService';
import { validateBackup } from '../services/tenantRestoreService';

const addDays = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const daysInCurrentMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
};

describe('calculateProration', () => {
  it('returns null when plan is unchanged', () => {
    expect(calculateProration('vip', 'vip', '2100-01-01')).toBeNull();
  });

  it('returns null when current cycle already expired', () => {
    expect(calculateProration('vip', 'free', '2000-01-01')).toBeNull();
  });

  it('returns null when there is no expiresAt', () => {
    expect(calculateProration('free', 'vip', null)).toBeNull();
    expect(calculateProration('free', 'vip')).toBeNull();
  });

  it('calculates amount due when upgrading from free to vip', () => {
    const future = addDays(30);
    const result = calculateProration('free', 'vip', future);
    const days = daysInCurrentMonth();
    expect(result).not.toBeNull();
    expect(result!.remainingDays).toBe(30);
    expect(result!.net).toBe(Math.round((69000 * 30) / days));
    expect(result!.isRefund).toBe(false);
  });

  it('calculates credit when downgrading from vip to free', () => {
    const future = addDays(15);
    const result = calculateProration('vip', 'free', future);
    const days = daysInCurrentMonth();
    expect(result).not.toBeNull();
    expect(result!.net).toBe(-Math.round((69000 * 15) / days));
    expect(result!.isRefund).toBe(true);
  });
});

describe('planLabel', () => {
  it("returns 'Free' for free plan", () => {
    expect(planLabel('free')).toBe('Free');
  });

  it("returns 'VIP' for vip plan", () => {
    expect(planLabel('vip')).toBe('VIP');
  });

  it('uppercases unknown plans', () => {
    expect(planLabel('pro')).toBe('PRO');
  });
});

describe('mapTenantFromDB', () => {
  it('maps a DB row to a Tenant object', () => {
    const row = {
      id: 't-1',
      name: 'Test Tenant',
      subdomain: 'test',
      status: 'active',
      plan: 'vip',
      owner_id: 'u-1',
      settings: { theme: 'dark' },
      isolation_mode: 'shared',
      isolation_schema: null,
      isolation_project_ref: null,
      custom_domain: 'shop.example.com',
      white_label: { logo: 'logo.png' },
      read_replica_url: null,
      connection_pool_config: { max: 10 },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
      archived_at: null,
    };

    const tenant = mapTenantFromDB(row);

    expect(tenant.id).toBe('t-1');
    expect(tenant.name).toBe('Test Tenant');
    expect(tenant.subdomain).toBe('test');
    expect(tenant.status).toBe('active');
    expect(tenant.plan).toBe('vip');
    expect(tenant.ownerId).toBe('u-1');
    expect(tenant.settings).toEqual({ theme: 'dark' });
    expect(tenant.isolationMode).toBe('shared');
    expect(tenant.isolationSchema).toBeNull();
    expect(tenant.customDomain).toBe('shop.example.com');
    expect(tenant.whiteLabel).toEqual({ logo: 'logo.png' });
    expect(tenant.readReplicaUrl).toBeNull();
    expect(tenant.connectionPoolConfig).toEqual({ max: 10 });
    expect(tenant.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(tenant.updatedAt).toBe('2024-06-01T00:00:00Z');
    expect(tenant.archivedAt).toBeNull();
  });
});

describe('validateBackup', () => {
  it('passes for a valid backup', () => {
    expect(() => validateBackup({ tables: {} })).not.toThrow();
    expect(() =>
      validateBackup({
        tenant: { id: 't-1' },
        tables: { products: [] },
        exportedAt: '2024-01-01',
      })
    ).not.toThrow();
  });

  it('throws for invalid backup objects', () => {
    expect(() => validateBackup(null)).toThrow('File backup không hợp lệ');
    expect(() => validateBackup('not an object')).toThrow('File backup không hợp lệ');
  });

  it('throws when tables is missing', () => {
    expect(() => validateBackup({ exportedAt: '2024-01-01' })).toThrow(
      'File backup thiếu phần tables hoặc tables không hợp lệ'
    );
  });

  it('throws when tables is not an object', () => {
    expect(() => validateBackup({ tables: [] })).toThrow(
      'File backup thiếu phần tables hoặc tables không hợp lệ'
    );
    expect(() => validateBackup({ tables: 'nope' })).toThrow(
      'File backup thiếu phần tables hoặc tables không hợp lệ'
    );
  });
});
