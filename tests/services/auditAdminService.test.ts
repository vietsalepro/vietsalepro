import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportAuditLogs } from '../../services/admin/auditAdminService';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase, resetMockData, addMockRow, setSystemAdmin } = await import('../mocks/supabase');
  return {
    supabase: mockSupabase,
    getCurrentTenantId: vi.fn(() => null),
    resetMockData,
    addMockRow,
    setSystemAdmin,
  };
});

describe('exportAuditLogs', () => {
  beforeEach(async () => {
    const { resetMockData, setSystemAdmin } = await import('../mocks/supabase');
    resetMockData();
    setSystemAdmin(true);
  });

  it('exports CSV with header plus one row per log', async () => {
    const { addMockRow } = await import('../mocks/supabase');
    addMockRow('audit_log', {
      id: 'l1',
      tenant_id: 't1',
      actor_id: 'u1',
      action: 'INSERT',
      entity_type: 'tenants',
      entity_id: 't1',
      old_data: null,
      new_data: { name: 'Cửa hàng A' },
      ip_address: '127.0.0.1',
      created_at: '2026-07-10T08:00:00Z',
    });
    addMockRow('audit_log', {
      id: 'l2',
      tenant_id: 't1',
      actor_id: 'u1',
      action: 'UPDATE',
      entity_type: 'tenants',
      entity_id: 't1',
      old_data: { status: 'pending' },
      new_data: { status: 'active' },
      ip_address: '127.0.0.1',
      created_at: '2026-07-10T09:00:00Z',
    });

    const { blob } = await exportAuditLogs({ format: 'csv' });
    const text = await blob.text();
    const lines = text.split('\n').filter((l) => l.trim() !== '');

    expect(lines.length).toBe(3);
    expect(lines[0]).toContain('id');
    expect(lines[0]).toContain('tenant_id');
    // Default order is created_at desc, so l2 (later) appears first.
    expect(lines[1]).toContain('l2');
    expect(lines[2]).toContain('l1');
  });

  it('exports JSON array', async () => {
    const { addMockRow } = await import('../mocks/supabase');
    addMockRow('audit_log', {
      id: 'l1',
      tenant_id: 't1',
      actor_id: 'u1',
      action: 'INSERT',
      entity_type: 'tenants',
      entity_id: 't1',
      old_data: null,
      new_data: null,
      ip_address: '127.0.0.1',
      created_at: '2026-07-10T08:00:00Z',
    });

    const { blob } = await exportAuditLogs({ format: 'json' });
    const text = await blob.text();
    const parsed = JSON.parse(text);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
    expect(parsed[0].id).toBe('l1');
  });

  it('respects date range filter', async () => {
    const { addMockRow } = await import('../mocks/supabase');
    addMockRow('audit_log', {
      id: 'old',
      tenant_id: 't1',
      actor_id: 'u1',
      action: 'INSERT',
      entity_type: 'tenants',
      entity_id: 't1',
      old_data: null,
      new_data: null,
      ip_address: null,
      created_at: '2026-07-01T08:00:00Z',
    });
    addMockRow('audit_log', {
      id: 'new',
      tenant_id: 't1',
      actor_id: 'u1',
      action: 'INSERT',
      entity_type: 'tenants',
      entity_id: 't1',
      old_data: null,
      new_data: null,
      ip_address: null,
      created_at: '2026-07-10T08:00:00Z',
    });

    const { blob } = await exportAuditLogs({
      format: 'csv',
      dateFrom: '2026-07-05',
      dateTo: '2026-07-31',
    });
    const text = await blob.text();
    const lines = text.split('\n').filter((l) => l.trim() !== '');

    expect(lines.length).toBe(2);
    expect(lines[1]).toContain('new');
    expect(lines[1]).not.toContain('old');
  });
});
